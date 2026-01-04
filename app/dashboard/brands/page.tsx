"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Plus,
  Palette,
  MoreHorizontal,
  Loader2,
  Settings,
  Trash2,
  FileText,
  Calendar,
  Sparkles,
  Building2,
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
import { useEntityContext, useCurrentEntityIds } from "@/components/entities/EntityProvider";
import { Brand } from "@/types/entities";

export default function BrandsPage() {
  const router = useRouter();
  const { currentEntity, switchBrand, currentBrand } = useEntityContext();
  const { entityId } = useCurrentEntityIds();
  const [brands, setBrands] = useState<Brand[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    fetchBrands();
  }, [entityId]);

  const fetchBrands = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (entityId) {
        params.append("entity_id", entityId);
      }

      const response = await fetch(`/api/brands?${params}`);
      if (response.ok) {
        const data = await response.json();
        setBrands(data.brands || []);
      }
    } catch (error) {
      console.error("Error fetching brands:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (brandId: string) => {
    if (!confirm("Are you sure you want to delete this brand? This will also archive all associated content.")) {
      return;
    }

    setDeleting(brandId);
    try {
      const response = await fetch(`/api/brands/${brandId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        await fetchBrands();
      }
    } catch (error) {
      console.error("Error deleting brand:", error);
    } finally {
      setDeleting(null);
    }
  };

  const getToneColor = (voice?: string) => {
    switch (voice) {
      case "professional":
        return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400";
      case "casual":
        return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400";
      case "pastoral":
        return "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400";
      case "academic":
        return "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400";
      case "friendly":
        return "bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400";
      default:
        return "bg-slate-100 text-slate-700 dark:bg-slate-900/30 dark:text-slate-400";
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
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
              Brands
            </h1>
            {currentEntity && (
              <Badge variant="outline" className="gap-1">
                <Building2 className="h-3 w-3" />
                {currentEntity.name}
              </Badge>
            )}
          </div>
          <p className="text-muted-foreground mt-1">
            Manage your brand identities and content strategies
          </p>
        </div>
        <Link href="/dashboard/brands/new">
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            New Brand
          </Button>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Brands</p>
                <p className="text-2xl font-bold">{brands.length}</p>
              </div>
              <Palette className="h-8 w-8 text-muted-foreground/50" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Content Enabled</p>
                <p className="text-2xl font-bold">
                  {brands.filter((b) => b.content_calendar_enabled).length}
                </p>
              </div>
              <Calendar className="h-8 w-8 text-muted-foreground/50" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Auto-Schedule</p>
                <p className="text-2xl font-bold">
                  {brands.filter((b) => b.auto_schedule_enabled).length}
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
                  {currentBrand?.name || "None"}
                </p>
              </div>
              <FileText className="h-8 w-8 text-muted-foreground/50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Brands Grid */}
      {brands.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Palette className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-medium mb-2">No brands yet</h3>
            <p className="text-muted-foreground text-center mb-4">
              {currentEntity
                ? `Create your first brand for ${currentEntity.name}`
                : "Select an entity first, then create brands for it"}
            </p>
            {currentEntity && (
              <Link href="/dashboard/brands/new">
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Brand
                </Button>
              </Link>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {brands.map((brand) => {
            const isActive = currentBrand?.id === brand.id;
            const voice = brand.tone_config?.voice || "professional";

            return (
              <Card
                key={brand.id}
                className={`relative transition-all hover:shadow-md cursor-pointer ${
                  isActive ? "ring-2 ring-primary" : ""
                }`}
                onClick={() => switchBrand(brand.id)}
              >
                {isActive && (
                  <div className="absolute top-2 right-2">
                    <Badge variant="default" className="text-xs">Active</Badge>
                  </div>
                )}
                <CardHeader className="pb-3">
                  <div className="flex items-start gap-3">
                    <div
                      className="h-10 w-10 rounded-lg flex items-center justify-center text-lg font-semibold text-white"
                      style={{
                        backgroundColor: brand.color_primary || "#6366f1",
                      }}
                    >
                      {brand.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-lg truncate">{brand.name}</CardTitle>
                      <CardDescription className="truncate">
                        {brand.tagline || "No tagline set"}
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
                            router.push(`/dashboard/brands/${brand.id}`);
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
                            handleDelete(brand.id);
                          }}
                          disabled={deleting === brand.id}
                        >
                          {deleting === brand.id ? (
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
                  {brand.description && (
                    <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                      {brand.description}
                    </p>
                  )}
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="outline" className={getToneColor(voice)}>
                      {voice}
                    </Badge>
                    {brand.content_calendar_enabled && (
                      <Badge variant="outline" className="gap-1">
                        <Calendar className="h-3 w-3" />
                        Calendar
                      </Badge>
                    )}
                    {brand.approval_required && (
                      <Badge variant="outline" className="gap-1">
                        <FileText className="h-3 w-3" />
                        Approval
                      </Badge>
                    )}
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
