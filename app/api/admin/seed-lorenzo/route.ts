import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const maxDuration = 60;

// Lorenzo's actual entities and projects
const LORENZO_ENTITIES = [
  {
    name: "Kenya Trip 2025",
    type: "personal",
    description: "Planning and execution of Kenya ministry trip",
    projects: [
      {
        name: "Trip Logistics",
        description: "Hotels, flights, venues, transportation",
        emoji: "✈️",
        priority: "high",
        tasks: [
          { title: "Book flights for all travelers", priority: "high" },
          { title: "Reserve hotel accommodations", priority: "high" },
          { title: "Arrange ground transportation", priority: "medium" },
          { title: "Confirm venue bookings", priority: "high" },
          { title: "Create detailed itinerary", priority: "medium" },
        ],
      },
      {
        name: "Ministry Planning",
        description: "Events, speaking, activities in Kenya",
        emoji: "🙏",
        priority: "high",
        tasks: [
          { title: "Finalize speaking schedule", priority: "high" },
          { title: "Prepare teaching materials", priority: "medium" },
          { title: "Coordinate with local ministry partners", priority: "high" },
          { title: "Plan community outreach activities", priority: "medium" },
        ],
      },
      {
        name: "Team Coordination",
        description: "Managing trip attendees and responsibilities",
        emoji: "👥",
        priority: "medium",
        tasks: [
          { title: "Confirm attendee list", priority: "high" },
          { title: "Collect passport info and travel documents", priority: "high" },
          { title: "Assign team roles and responsibilities", priority: "medium" },
          { title: "Pre-trip team meeting", priority: "medium" },
        ],
      },
    ],
  },
  {
    name: "Streams of Grace",
    type: "ministry",
    description: "Daily devotional platform and content ministry",
    projects: [
      {
        name: "Platform Development",
        description: "Building and maintaining the devotional platform",
        emoji: "💻",
        priority: "high",
        tasks: [
          { title: "Finalize platform features", priority: "high" },
          { title: "Set up user authentication", priority: "high" },
          { title: "Implement content management system", priority: "medium" },
          { title: "Mobile responsiveness testing", priority: "medium" },
        ],
      },
      {
        name: "Content Production",
        description: "Daily devotional writing and scheduling",
        emoji: "✍️",
        priority: "high",
        tasks: [
          { title: "Write next month's devotionals", priority: "high" },
          { title: "Create content calendar", priority: "medium" },
          { title: "Record audio versions", priority: "low" },
          { title: "Design accompanying graphics", priority: "medium" },
        ],
      },
      {
        name: "Marketing & Growth",
        description: "Audience building and social media",
        emoji: "📢",
        priority: "medium",
        tasks: [
          { title: "Set up social media accounts", priority: "medium" },
          { title: "Create launch marketing plan", priority: "medium" },
          { title: "Build email list", priority: "high" },
          { title: "Partner outreach for promotion", priority: "low" },
        ],
      },
    ],
  },
  {
    name: "TPC Ministries",
    type: "ministry",
    description: "Ministry platform including The 12 discipleship, prayer line, teachings, and books",
    projects: [
      {
        name: "The 12 Discipleship Program",
        description: "Structured discipleship curriculum and community",
        emoji: "📖",
        priority: "high",
        tasks: [
          { title: "Finalize curriculum modules", priority: "high" },
          { title: "Set up online learning platform", priority: "medium" },
          { title: "Recruit initial cohort", priority: "high" },
          { title: "Create facilitator training materials", priority: "medium" },
        ],
      },
      {
        name: "Prayer Line Ministry",
        description: "Managing prayer line operations and volunteers",
        emoji: "📞",
        priority: "medium",
        tasks: [
          { title: "Schedule prayer line volunteers", priority: "medium" },
          { title: "Set up call tracking system", priority: "low" },
          { title: "Create prayer request follow-up process", priority: "medium" },
          { title: "Train new prayer partners", priority: "medium" },
        ],
      },
      {
        name: "Teachings & Books",
        description: "Publishing teachings and book projects",
        emoji: "📚",
        priority: "medium",
        tasks: [
          { title: "Organize teaching archive", priority: "low" },
          { title: "Plan next book project", priority: "medium" },
          { title: "Set up distribution channels", priority: "low" },
          { title: "Create study guides for teachings", priority: "low" },
        ],
      },
    ],
  },
  {
    name: "Lorenzo Personal Brand",
    type: "personal",
    description: "Personal book writing, speaking, and consulting",
    projects: [
      {
        name: "Book Writing",
        description: "Current book project and publishing",
        emoji: "📝",
        priority: "medium",
        tasks: [
          { title: "Complete manuscript draft", priority: "high" },
          { title: "Edit and revise chapters", priority: "medium" },
          { title: "Find publisher or self-publish strategy", priority: "medium" },
          { title: "Design book cover", priority: "low" },
        ],
      },
      {
        name: "Personal Consulting",
        description: "Individual consulting engagements",
        emoji: "🎯",
        priority: "medium",
        tasks: [
          { title: "Define consulting service offerings", priority: "medium" },
          { title: "Create consulting rate card", priority: "low" },
          { title: "Build consulting pipeline", priority: "medium" },
          { title: "Develop case studies", priority: "low" },
        ],
      },
    ],
  },
  {
    name: "Uplift",
    type: "nonprofit",
    description: "Medical workforce development program",
    projects: [
      {
        name: "RFP & Contracts",
        description: "Finding and responding to RFPs",
        emoji: "📋",
        priority: "high",
        tasks: [
          { title: "Research upcoming RFPs", priority: "high" },
          { title: "Prepare RFP response templates", priority: "medium" },
          { title: "Submit current RFP applications", priority: "high" },
          { title: "Follow up on pending proposals", priority: "medium" },
        ],
      },
      {
        name: "DBNA Capacity Building",
        description: "Partnership with DBNA for capacity building",
        emoji: "🤝",
        priority: "high",
        tasks: [
          { title: "Define program deliverables", priority: "high" },
          { title: "Create training curriculum", priority: "medium" },
          { title: "Schedule capacity building sessions", priority: "medium" },
          { title: "Track program metrics", priority: "low" },
        ],
      },
      {
        name: "School-Based Programs",
        description: "Healthcare workforce programs in schools",
        emoji: "🏫",
        priority: "medium",
        tasks: [
          { title: "Identify target schools", priority: "medium" },
          { title: "Develop school outreach materials", priority: "medium" },
          { title: "Present to school administrators", priority: "medium" },
          { title: "Pilot program in first school", priority: "high" },
        ],
      },
    ],
  },
  {
    name: "The Podcast",
    type: "business",
    description: "Podcast with Achumboro - ideation, planning, production",
    projects: [
      {
        name: "Podcast Launch",
        description: "Getting the podcast off the ground",
        emoji: "🎙️",
        priority: "high",
        tasks: [
          { title: "Finalize podcast name and branding", priority: "high" },
          { title: "Set up recording equipment", priority: "medium" },
          { title: "Create podcast artwork", priority: "medium" },
          { title: "Set up hosting platform", priority: "medium" },
          { title: "Record first 3 episodes", priority: "high" },
        ],
      },
      {
        name: "Content Planning",
        description: "Episode topics and guest scheduling",
        emoji: "📅",
        priority: "medium",
        tasks: [
          { title: "Brainstorm first 10 episode topics", priority: "medium" },
          { title: "Create guest wishlist", priority: "low" },
          { title: "Reach out to potential guests", priority: "medium" },
          { title: "Develop episode format/structure", priority: "medium" },
        ],
      },
      {
        name: "Marketing & Distribution",
        description: "Growing the podcast audience",
        emoji: "📈",
        priority: "low",
        tasks: [
          { title: "Submit to podcast directories", priority: "medium" },
          { title: "Create social media strategy", priority: "low" },
          { title: "Design promotional graphics", priority: "low" },
          { title: "Plan launch campaign", priority: "medium" },
        ],
      },
    ],
  },
  {
    name: "Consulting Company",
    type: "business",
    description: "Consulting company with Achumboro",
    projects: [
      {
        name: "Business Formation",
        description: "Legal setup and structure",
        emoji: "⚖️",
        priority: "high",
        tasks: [
          { title: "Decide on business structure", priority: "high" },
          { title: "File business registration", priority: "high" },
          { title: "Set up business bank account", priority: "medium" },
          { title: "Create operating agreement", priority: "medium" },
        ],
      },
      {
        name: "Service Offerings",
        description: "Defining what we offer",
        emoji: "💼",
        priority: "medium",
        tasks: [
          { title: "Define core service offerings", priority: "high" },
          { title: "Create pricing structure", priority: "medium" },
          { title: "Develop service delivery process", priority: "medium" },
          { title: "Create proposal templates", priority: "low" },
        ],
      },
      {
        name: "Client Development",
        description: "Building client relationships - including Melba",
        emoji: "🤝",
        priority: "high",
        tasks: [
          { title: "Follow up with Melba", priority: "high" },
          { title: "Create client pipeline tracker", priority: "medium" },
          { title: "Develop referral strategy", priority: "low" },
          { title: "Schedule networking activities", priority: "low" },
        ],
      },
    ],
  },
  {
    name: "Perpetual Core",
    type: "business",
    description: "AI-powered business operating system platform",
    projects: [
      {
        name: "Product Development",
        description: "Building out platform features",
        emoji: "🚀",
        priority: "high",
        tasks: [
          { title: "Complete Teams + AI Advisors integration", priority: "high" },
          { title: "Fix and test Brain Dump feature", priority: "high" },
          { title: "Implement user onboarding flow", priority: "medium" },
          { title: "Security audit and hardening", priority: "medium" },
        ],
      },
      {
        name: "Sales & Marketing",
        description: "Growing the customer base",
        emoji: "📊",
        priority: "medium",
        tasks: [
          { title: "Create demo video", priority: "medium" },
          { title: "Build landing page", priority: "medium" },
          { title: "Develop pricing tiers", priority: "medium" },
          { title: "Identify beta customers", priority: "high" },
        ],
      },
      {
        name: "Support & Operations",
        description: "Customer success and operations",
        emoji: "🛠️",
        priority: "low",
        tasks: [
          { title: "Set up help documentation", priority: "low" },
          { title: "Create support ticket system", priority: "low" },
          { title: "Develop onboarding guides", priority: "medium" },
          { title: "Plan customer success process", priority: "low" },
        ],
      },
    ],
  },
  {
    name: "Institute for Human Advancement",
    type: "nonprofit",
    description: "Non-profit focused on human development and advancement",
    projects: [
      {
        name: "Organization Setup",
        description: "Establishing the non-profit",
        emoji: "🏛️",
        priority: "medium",
        tasks: [
          { title: "File 501(c)(3) application", priority: "high" },
          { title: "Create board of directors", priority: "medium" },
          { title: "Develop mission and vision statements", priority: "medium" },
          { title: "Set up organizational infrastructure", priority: "low" },
        ],
      },
      {
        name: "Program Development",
        description: "Designing initial programs",
        emoji: "📋",
        priority: "low",
        tasks: [
          { title: "Define initial program focus areas", priority: "medium" },
          { title: "Research funding opportunities", priority: "medium" },
          { title: "Develop program metrics", priority: "low" },
          { title: "Create program documentation", priority: "low" },
        ],
      },
    ],
  },
  {
    name: "DeepFutures Capital",
    type: "business",
    description: "For-profit investment and ventures arm",
    projects: [
      {
        name: "Business Setup",
        description: "Establishing the entity",
        emoji: "💰",
        priority: "medium",
        tasks: [
          { title: "Register business entity", priority: "high" },
          { title: "Set up business banking", priority: "medium" },
          { title: "Define investment thesis", priority: "medium" },
          { title: "Create deal flow process", priority: "low" },
        ],
      },
      {
        name: "Deal Pipeline",
        description: "Managing investment opportunities",
        emoji: "📈",
        priority: "low",
        tasks: [
          { title: "Identify initial investment targets", priority: "medium" },
          { title: "Create due diligence checklist", priority: "low" },
          { title: "Develop term sheet templates", priority: "low" },
          { title: "Build investor network", priority: "low" },
        ],
      },
    ],
  },
];

// POST /api/admin/seed-lorenzo - Clean up and seed Lorenzo's data
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify this is Lorenzo (admin check)
    const { data: profile } = await supabase
      .from("profiles")
      .select("role, organization_id")
      .eq("id", user.id)
      .single();

    if (!profile?.organization_id) {
      return NextResponse.json({ error: "No organization found" }, { status: 400 });
    }

    const orgId = profile.organization_id;
    const results = {
      deleted: { entities: 0, projects: 0, tasks: 0 },
      created: { entities: 0, projects: 0, tasks: 0 },
      errors: [] as string[],
    };

    // Step 1: Delete existing data
    // First delete tasks
    const { count: taskCount } = await supabase
      .from("tasks")
      .delete()
      .eq("user_id", user.id);
    results.deleted.tasks = taskCount || 0;

    // Delete entity_projects (entity architecture projects)
    const { count: entityProjectCount } = await supabase
      .from("entity_projects")
      .delete()
      .eq("owner_id", user.id);
    results.deleted.projects = entityProjectCount || 0;

    // Delete entities
    const { count: entityCount } = await supabase
      .from("entities")
      .delete()
      .eq("owner_id", user.id);
    results.deleted.entities = entityCount || 0;

    // Step 2: Get lookup table IDs
    let entityTypeMap: { [key: string]: string } = {};
    try {
      const { data: entityTypes } = await supabase
        .from("lookup_entity_types")
        .select("id, name");
      if (entityTypes) {
        entityTypes.forEach(et => { entityTypeMap[et.name] = et.id; });
      }
    } catch (e) {
      console.log("lookup_entity_types not available");
    }

    let stageMap: { [key: string]: string } = {};
    try {
      const { data: stages } = await supabase
        .from("lookup_project_stages")
        .select("id, name");
      if (stages) {
        stages.forEach(s => { stageMap[s.name] = s.id; });
      }
    } catch (e) {
      console.log("lookup_project_stages not available");
    }

    // Step 3: Create new entities
    for (const entityData of LORENZO_ENTITIES) {
      try {
        // Map type
        const typeMap: { [key: string]: string } = {
          business: "business",
          ministry: "ministry",
          nonprofit: "nonprofit",
          personal: "personal",
        };
        const mappedType = typeMap[entityData.type] || "business";
        const entityTypeId = entityTypeMap[mappedType] || null;

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

        const { data: entity, error: entityError } = await supabase
          .from("entities")
          .insert(entityInsert)
          .select()
          .single();

        if (entityError) {
          results.errors.push(`Entity "${entityData.name}": ${entityError.message}`);
          continue;
        }

        results.created.entities++;

        // Create projects in entity_projects table (entity architecture)
        for (const projectData of entityData.projects) {
          const projectInsert: any = {
            entity_id: entity.id,
            owner_id: user.id,
            name: projectData.name,
            description: projectData.description,
            priority: projectData.priority,
            tags: [projectData.emoji],
            is_active: true,
          };
          if (stageMap['planning']) {
            projectInsert.current_stage_id = stageMap['planning'];
          }

          const { data: project, error: projectError } = await supabase
            .from("entity_projects")
            .insert(projectInsert)
            .select()
            .single();

          if (projectError) {
            results.errors.push(`Project "${projectData.name}": ${projectError.message}`);
            continue;
          }

          results.created.projects++;

          // Create tasks with proper entity/project links
          for (const taskData of projectData.tasks) {
            const { error: taskError } = await supabase
              .from("tasks")
              .insert({
                organization_id: orgId,
                user_id: user.id,
                title: taskData.title,
                priority: taskData.priority,
                status: "todo",
                assigned_to: user.id,
                entity_id: entity.id,
                project_id: project.id,
                tags: [entity.name, project.name],
              });

            if (taskError) {
              results.errors.push(`Task "${taskData.title}": ${taskError.message}`);
            } else {
              results.created.tasks++;
            }
          }
        }
      } catch (err: any) {
        results.errors.push(`Error with ${entityData.name}: ${err.message}`);
      }
    }

    return NextResponse.json({
      success: true,
      message: "Data seeded successfully",
      results,
    });

  } catch (error: any) {
    console.error("Seed error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to seed data" },
      { status: 500 }
    );
  }
}
