"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Plus,
  Building2,
  Building,
  Briefcase,
  Church,
  User,
  Globe,
  MoreHorizontal,
  Loader2,
  Settings,
  Trash2,
  FolderKanban,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { useEntityContext } from "@/components/entities/EntityProvider";

// Icon mapping for entity types
const entityTypeIcons: Record<string, React.ReactNode> = {
  nonprofit: <Building2 className="h-5 w-5" />,
  llc: <Briefcase className="h-5 w-5" />,
  corporation: <Building className="h-5 w-5" />,
  personal: <User className="h-5 w-5" />,
  ministry: <Church className="h-5 w-5" />,
};

const entityTypeColors: Record<string, string> = {
  nonprofit: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  llc: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  corporation: "bg-slate-100 text-slate-700 dark:bg-slate-900/30 dark:text-slate-400",
  personal: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  ministry: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
};

export default function EntitiesPage() {
  const router = useRouter();
  const { entities, isLoading, refreshEntities, switchEntity, currentEntity } = useEntityContext();
  const [deleting, setDeleting] = useState<string | null>(null);

  const handleDelete = async (entityId: string) => {
    if (!confirm("Are you sure you want to delete this entity? This will also delete all associated brands and projects.")) {
      return;
    }

    setDeleting(entityId);
    try {
      const response = await fetch(`/api/entities/${entityId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        await refreshEntities();
      }
    } catch (error) {
      console.error("Error deleting entity:", error);
    } finally {
      setDeleting(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            Entities
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage your companies, organizations, and personal brands
          </p>
        </div>
        <Link href="/dashboard/entities/new">
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            New Entity
          </Button>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Entities</p>
                <p className="text-2xl font-bold">{entities.length}</p>
              </div>
              <Building2 className="h-8 w-8 text-muted-foreground/50" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Brands</p>
                <p className="text-2xl font-bold">
                  {entities.reduce((sum, e) => sum + (e.brand_count || 0), 0)}
                </p>
              </div>
              <FolderKanban className="h-8 w-8 text-muted-foreground/50" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Projects</p>
                <p className="text-2xl font-bold">
                  {entities.reduce((sum, e) => sum + (e.project_count || 0), 0)}
                </p>
              </div>
              <Sparkles className="h-8 w-8 text-muted-foreground/50" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Current</p>
                <p className="text-lg font-medium truncate max-w-[120px]">
                  {currentEntity?.name || "None"}
                </p>
              </div>
              <Globe className="h-8 w-8 text-muted-foreground/50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Entities Grid */}
      {entities.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Building2 className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-medium mb-2">No entities yet</h3>
            <p className="text-muted-foreground text-center mb-4">
              Create your first entity to start organizing your brands and projects
            </p>
            <Link href="/dashboard/entities/new">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Entity
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {entities.map((entity) => {
            const typeName = entity.entity_type?.name || "personal";
            const icon = entityTypeIcons[typeName] || <Globe className="h-5 w-5" />;
            const colorClass = entityTypeColors[typeName] || entityTypeColors.personal;
            const isActive = currentEntity?.id === entity.id;

            return (
              <Card
                key={entity.id}
                className={`relative transition-all hover:shadow-md cursor-pointer ${
                  isActive ? "ring-2 ring-primary" : ""
                }`}
                onClick={() => switchEntity(entity.id)}
              >
                {isActive && (
                  <div className="absolute top-2 right-2">
                    <Badge variant="default" className="text-xs">Active</Badge>
                  </div>
                )}
                <CardHeader className="pb-3">
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg ${colorClass}`}>
                      {icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-lg truncate">{entity.name}</CardTitle>
                      <CardDescription className="truncate">
                        {entity.entity_type?.name || "Entity"}
                        {entity.primary_focus?.name && ` • ${entity.primary_focus.name}`}
                      </CardDescription>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/dashboard/entities/${entity.id}`);
                          }}
                        >
                          <Settings className="h-4 w-4 mr-2" />
                          Settings
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(entity.id);
                          }}
                          disabled={deleting === entity.id}
                        >
                          {deleting === entity.id ? (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4 mr-2" />
                          )}
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>
                <CardContent>
                  {entity.description && (
                    <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                      {entity.description}
                    </p>
                  )}
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <FolderKanban className="h-4 w-4" />
                      <span>{entity.brand_count || 0} brands</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Sparkles className="h-4 w-4" />
                      <span>{entity.project_count || 0} projects</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
