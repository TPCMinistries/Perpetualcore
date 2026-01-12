"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useEntityContext } from "./EntityProvider";
import {
  Building2,
  ChevronDown,
  Plus,
  Check,
  Settings,
  Loader2,
  Globe,
  Briefcase,
  Church,
  User,
  Building,
  FolderKanban,
  Users,
} from "lucide-react";
import Link from "next/link";

// Icon mapping for entity types
const entityTypeIcons: Record<string, React.ReactNode> = {
  nonprofit: <Building2 className="h-4 w-4" />,
  llc: <Briefcase className="h-4 w-4" />,
  corporation: <Building className="h-4 w-4" />,
  personal: <User className="h-4 w-4" />,
  ministry: <Church className="h-4 w-4" />,
};

interface EntitySwitcherProps {
  compact?: boolean;
  showBrandSelector?: boolean;
}

export function EntitySwitcher({ compact = false, showBrandSelector = false }: EntitySwitcherProps) {
  const {
    entities,
    currentEntity,
    currentBrand,
    isLoading,
    switchEntity,
    switchBrand,
  } = useEntityContext();
  const [isOpen, setIsOpen] = useState(false);

  if (isLoading) {
    return (
      <Button variant="ghost" size="sm" disabled className="gap-2">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span className="hidden sm:inline">Loading...</span>
      </Button>
    );
  }

  if (entities.length === 0) {
    return (
      <Link href="/dashboard/entities/new">
        <Button variant="outline" size="sm" className="gap-2">
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">Create Space</span>
        </Button>
      </Link>
    );
  }

  const currentIcon = currentEntity?.entity_type?.name
    ? entityTypeIcons[currentEntity.entity_type.name] || <Globe className="h-4 w-4" />
    : <Users className="h-4 w-4" />;  // "All Spaces" icon when no space selected

  // Get total counts across all entities
  const totalProjects = entities.reduce((sum, e) => sum + (e.project_count || 0), 0);
  const totalBrands = entities.reduce((sum, e) => sum + (e.brand_count || 0), 0);

  if (compact) {
    return (
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="gap-1.5 h-8 max-w-[180px]">
            {currentIcon}
            <span className="truncate text-xs">{currentEntity?.name || "All Spaces"}</span>
            <ChevronDown className="h-3 w-3 opacity-50 flex-shrink-0" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-64">
          <DropdownMenuLabel className="text-xs text-muted-foreground">
            Switch Space
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          {/* All Spaces option */}
          <DropdownMenuItem
            onClick={() => switchEntity(null)}
            className="flex items-center gap-3 py-2"
          >
            <div className="flex-shrink-0 text-muted-foreground">
              <Users className="h-4 w-4" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">All Spaces</p>
              <p className="text-xs text-muted-foreground">
                {entities.length} spaces · {totalProjects} projects
              </p>
            </div>
            {!currentEntity && (
              <Check className="h-4 w-4 text-primary flex-shrink-0" />
            )}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          {entities.map((entity) => {
            const icon = entity.entity_type?.name
              ? entityTypeIcons[entity.entity_type.name]
              : <Globe className="h-4 w-4" />;

            return (
              <DropdownMenuItem
                key={entity.id}
                onClick={() => switchEntity(entity.id)}
                className="flex items-center gap-3 py-2"
              >
                <div className="flex-shrink-0 text-muted-foreground">{icon}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{entity.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {entity.project_count} projects
                  </p>
                </div>
                {currentEntity?.id === entity.id && (
                  <Check className="h-4 w-4 text-primary flex-shrink-0" />
                )}
              </DropdownMenuItem>
            );
          })}
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <Link href="/dashboard/entities/new" className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Create New Space
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/dashboard/entities" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Manage Spaces
            </Link>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  // Full-width version
  return (
    <div className="space-y-3">
      {/* Space Selector */}
      <div className="bg-muted/50 rounded-lg p-3">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-muted-foreground">Current Space</span>
          <Link href="/dashboard/entities">
            <Button variant="ghost" size="sm" className="h-6 text-xs">
              <Settings className="h-3 w-3 mr-1" />
              Manage
            </Button>
          </Link>
        </div>

        <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              className="w-full justify-between h-auto py-3"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10 text-primary">
                  {currentIcon}
                </div>
                <div className="text-left">
                  <p className="font-medium">{currentEntity?.name || "All Spaces"}</p>
                  {currentEntity ? (
                    <p className="text-xs text-muted-foreground">
                      {currentEntity.entity_type?.name || "Space"} ·{" "}
                      {currentEntity.project_count || 0} projects
                    </p>
                  ) : (
                    <p className="text-xs text-muted-foreground">
                      {entities.length} spaces · {totalProjects} projects
                    </p>
                  )}
                </div>
              </div>
              <ChevronDown className="h-4 w-4 opacity-50" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-[var(--radix-dropdown-menu-trigger-width)]">
            <DropdownMenuLabel>Your Spaces</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {/* All Spaces option */}
            <DropdownMenuItem
              onClick={() => switchEntity(null)}
              className="flex items-center gap-3 py-3"
            >
              <div className="p-1.5 rounded bg-muted">
                <Users className="h-4 w-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-medium truncate">All Spaces</p>
                  {!currentEntity && (
                    <Check className="h-4 w-4 text-primary" />
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  {entities.length} spaces · {totalProjects} projects
                </p>
              </div>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            {entities.map((entity) => {
              const icon = entity.entity_type?.name
                ? entityTypeIcons[entity.entity_type.name]
                : <Globe className="h-4 w-4" />;

              return (
                <DropdownMenuItem
                  key={entity.id}
                  onClick={() => switchEntity(entity.id)}
                  className="flex items-center gap-3 py-3"
                >
                  <div className="p-1.5 rounded bg-muted">{icon}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium truncate">{entity.name}</p>
                      {currentEntity?.id === entity.id && (
                        <Check className="h-4 w-4 text-primary" />
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {entity.project_count} projects
                    </p>
                  </div>
                </DropdownMenuItem>
              );
            })}
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/dashboard/entities/new">
                <Plus className="h-4 w-4 mr-2" />
                Create New Space
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Brand Selector (if enabled and entity selected) */}
      {showBrandSelector && currentEntity && (
        <BrandSelector
          entityId={currentEntity.id}
          currentBrand={currentBrand}
          onSelectBrand={switchBrand}
        />
      )}
    </div>
  );
}

// Brand Selector Component
interface BrandSelectorProps {
  entityId: string;
  currentBrand: any;
  onSelectBrand: (brandId: string | null) => void;
}

function BrandSelector({ entityId, currentBrand, onSelectBrand }: BrandSelectorProps) {
  const [brands, setBrands] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);

  // Fetch brands for entity
  useState(() => {
    const fetchBrands = async () => {
      try {
        const response = await fetch(`/api/entities/${entityId}/brands`);
        if (response.ok) {
          const data = await response.json();
          setBrands(data.brands || []);
        }
      } catch (err) {
        console.error("Error fetching brands:", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchBrands();
  });

  if (isLoading || brands.length === 0) {
    return null;
  }

  return (
    <div className="bg-muted/30 rounded-lg p-3">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium text-muted-foreground">Brand Context</span>
        {currentBrand && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onSelectBrand(null)}
            className="h-6 text-xs"
          >
            Clear
          </Button>
        )}
      </div>

      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="w-full justify-between">
            <div className="flex items-center gap-2">
              <FolderKanban className="h-4 w-4" />
              <span className="truncate">
                {currentBrand?.name || "All Brands"}
              </span>
            </div>
            <ChevronDown className="h-4 w-4 opacity-50" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-[var(--radix-dropdown-menu-trigger-width)]">
          <DropdownMenuItem onClick={() => onSelectBrand(null)}>
            <Globe className="h-4 w-4 mr-2" />
            All Brands
            {!currentBrand && <Check className="h-4 w-4 ml-auto" />}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          {brands.map((brand) => (
            <DropdownMenuItem
              key={brand.id}
              onClick={() => onSelectBrand(brand.id)}
            >
              <div
                className="h-4 w-4 rounded mr-2"
                style={{ backgroundColor: brand.color_primary || "#6366f1" }}
              />
              {brand.name}
              {currentBrand?.id === brand.id && (
                <Check className="h-4 w-4 ml-auto" />
              )}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

// Export for use in header
export function EntitySwitcherCompact() {
  return <EntitySwitcher compact />;
}
