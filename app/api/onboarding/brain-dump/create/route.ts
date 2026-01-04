import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const maxDuration = 60;

interface CreateRequest {
  entities: {
    name: string;
    type: string;
    description: string;
    brands?: { name: string; description: string }[];
    projects: {
      name: string;
      description: string;
      emoji: string;
      priority: string;
      tasks: {
        title: string;
        description?: string;
        priority: string;
        subtasks?: string[];
      }[];
    }[];
    // For linking to existing entities
    linkToExistingId?: string;
    isLinked?: boolean;
  }[];
}

// POST /api/onboarding/brain-dump/create - Create all entities, projects, tasks
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { entities }: CreateRequest = await req.json();

    if (!entities || !Array.isArray(entities) || entities.length === 0) {
      return NextResponse.json(
        { error: "No entities provided" },
        { status: 400 }
      );
    }

    // Get user's organization
    const { data: profile } = await supabase
      .from("profiles")
      .select("organization_id")
      .eq("id", user.id)
      .single();

    if (!profile?.organization_id) {
      return NextResponse.json(
        { error: "No organization found" },
        { status: 400 }
      );
    }

    const orgId = profile.organization_id;
    const results = {
      entities: [] as any[],
      brands: [] as any[],
      projects: [] as any[],
      tasks: [] as any[],
      errors: [] as string[],
    };

    // Get entity type IDs from lookup table (optional - may not exist)
    let entityTypeMap: { [key: string]: string } = {};
    try {
      const { data: entityTypes } = await supabase
        .from("lookup_entity_types")
        .select("id, name");
      if (entityTypes && entityTypes.length > 0) {
        entityTypes.forEach(et => {
          entityTypeMap[et.name] = et.id;
        });
      }
    } catch (e) {
      console.log("lookup_entity_types table not available, skipping");
    }

    // Get project stage IDs from lookup table (optional - may not exist)
    let stageMap: { [key: string]: string } = {};
    try {
      const { data: projectStages } = await supabase
        .from("lookup_project_stages")
        .select("id, name");
      if (projectStages && projectStages.length > 0) {
        projectStages.forEach(s => {
          stageMap[s.name] = s.id;
        });
      }
    } catch (e) {
      console.log("lookup_project_stages table not available, skipping");
    }
    const planningStageId = stageMap['planning'] || null;

    // Process each entity
    for (const entityData of entities) {
      try {
        let entity: any;

        // Check if linking to existing entity
        if (entityData.isLinked && entityData.linkToExistingId) {
          // Use existing entity
          const { data: existingEntity, error: fetchError } = await supabase
            .from("entities")
            .select("*")
            .eq("id", entityData.linkToExistingId)
            .single();

          if (fetchError || !existingEntity) {
            console.error("Failed to fetch linked entity:", fetchError);
            results.errors.push(`Failed to link to existing entity: ${entityData.name}`);
            continue;
          }

          entity = existingEntity;
          // Count as "linked" not "created"
        } else {
          // Create new entity
          const mappedType = mapEntityType(entityData.type);
          const entityTypeId = entityTypeMap[mappedType] || entityTypeMap['personal'] || null;

          const entityInsert: any = {
            organization_id: orgId,
            owner_id: user.id,
            name: entityData.name,
            description: entityData.description,
            is_active: true,
          };
          if (entityTypeId) {
            entityInsert.entity_type_id = entityTypeId;
          }

          const { data: newEntity, error: entityError } = await supabase
            .from("entities")
            .insert(entityInsert)
            .select()
            .single();

          if (entityError) {
            console.error("Entity creation error:", entityError);
            results.errors.push(`Entity "${entityData.name}": ${entityError.message || entityError.code}`);
            continue;
          }

          entity = newEntity;
          results.entities.push(entity);
        }

        // Create brands if provided
        if (entityData.brands && entityData.brands.length > 0) {
          for (const brandData of entityData.brands) {
            const { data: brand, error: brandError } = await supabase
              .from("brands")
              .insert({
                entity_id: entity.id,
                owner_id: user.id,
                name: brandData.name,
                description: brandData.description,
                is_active: true,
              })
              .select()
              .single();

            if (brandError) {
              results.errors.push(`Failed to create brand: ${brandData.name}`);
            } else {
              results.brands.push(brand);
            }
          }
        }

        // Create projects for this entity
        for (const projectData of entityData.projects) {
          // Build project insert - only include stage_id if we have it
          const projectInsert: any = {
            entity_id: entity.id,
            owner_id: user.id,
            name: projectData.name,
            description: projectData.description,
            priority: projectData.priority || "medium",
            tags: projectData.emoji ? [projectData.emoji] : [],
            is_active: true,
          };
          if (planningStageId) {
            projectInsert.current_stage_id = planningStageId;
          }

          const { data: project, error: projectError } = await supabase
            .from("entity_projects")
            .insert(projectInsert)
            .select()
            .single();

          if (projectError) {
            console.error("Project creation error:", projectError);
            results.errors.push(`Project "${projectData.name}": ${projectError.message || projectError.code}`);
            continue;
          }

          results.projects.push(project);

          // Create tasks for this project
          for (let i = 0; i < projectData.tasks.length; i++) {
            const taskData = projectData.tasks[i];

            const { data: task, error: taskError } = await supabase
              .from("tasks")
              .insert({
                organization_id: orgId,
                user_id: user.id,
                title: taskData.title,
                description: taskData.description || null,
                priority: taskData.priority || "medium",
                status: "todo",
                assigned_to: user.id,
                project_name: project.name,
                tags: [entity.name],
              })
              .select()
              .single();

            if (taskError) {
              console.error("Task creation error:", taskError);
              results.errors.push(`Failed to create task: ${taskData.title}`);
              continue;
            }

            results.tasks.push(task);

            // Create subtasks as separate tasks with reference
            if (taskData.subtasks && taskData.subtasks.length > 0) {
              for (let j = 0; j < taskData.subtasks.length; j++) {
                const subtaskTitle = taskData.subtasks[j];

                const { error: subtaskError } = await supabase
                  .from("tasks")
                  .insert({
                    organization_id: orgId,
                    user_id: user.id,
                    title: subtaskTitle,
                    priority: "medium",
                    status: "todo",
                    assigned_to: user.id,
                    project_name: project.name,
                    tags: [entity.name, "subtask"],
                    source_reference: `Subtask of: ${taskData.title}`,
                  });

                if (subtaskError) {
                  console.error("Subtask creation error:", subtaskError);
                }
              }
            }
          }
        }
      } catch (err) {
        console.error("Error processing entity:", err);
        results.errors.push(`Error processing entity: ${entityData.name}`);
      }
    }

    return NextResponse.json({
      success: true,
      results: {
        entitiesCreated: results.entities.length,
        brandsCreated: results.brands.length,
        projectsCreated: results.projects.length,
        tasksCreated: results.tasks.length,
        errors: results.errors,
      },
      entities: results.entities,
      projects: results.projects,
    });

  } catch (error) {
    console.error("Brain dump create API error:", error);
    return NextResponse.json(
      { error: "Failed to create structure" },
      { status: 500 }
    );
  }
}

function mapEntityType(type: string): string {
  const typeMap: { [key: string]: string } = {
    business: "business",
    ministry: "ministry",
    nonprofit: "nonprofit",
    personal: "personal",
    saas: "business",
    consulting: "business",
  };
  return typeMap[type] || "business";
}
