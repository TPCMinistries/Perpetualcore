"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Building2,
  Building,
  Briefcase,
  Church,
  User,
  Globe,
  Loader2,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useEntityContext } from "@/components/entities/EntityProvider";

interface LookupItem {
  id: string;
  name: string;
  description: string | null;
  icon: string | null;
}

// Icon mapping for entity types
const entityTypeIcons: Record<string, React.ReactNode> = {
  nonprofit: <Building2 className="h-5 w-5" />,
  llc: <Briefcase className="h-5 w-5" />,
  corporation: <Building className="h-5 w-5" />,
  personal: <User className="h-5 w-5" />,
  ministry: <Church className="h-5 w-5" />,
};

export default function NewEntityPage() {
  const router = useRouter();
  const { refreshEntities } = useEntityContext();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [entityTypes, setEntityTypes] = useState<LookupItem[]>([]);
  const [focusAreas, setFocusAreas] = useState<LookupItem[]>([]);
  const [loadingLookups, setLoadingLookups] = useState(true);

  const [formData, setFormData] = useState({
    name: "",
    legal_name: "",
    description: "",
    entity_type_id: "",
    primary_focus_id: "",
    website: "",
    email: "",
  });

  // Fetch lookup data
  useEffect(() => {
    const fetchLookups = async () => {
      try {
        const [typesRes, focusRes] = await Promise.all([
          fetch("/api/lookups/entity-types"),
          fetch("/api/lookups/focus-areas"),
        ]);

        if (typesRes.ok) {
          const data = await typesRes.json();
          setEntityTypes(data.items || []);
        }

        if (focusRes.ok) {
          const data = await focusRes.json();
          setFocusAreas(data.items || []);
        }
      } catch (error) {
        console.error("Error fetching lookups:", error);
      } finally {
        setLoadingLookups(false);
      }
    };

    fetchLookups();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      alert("Space name is required");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/entities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name.trim(),
          legal_name: formData.legal_name.trim() || null,
          description: formData.description.trim() || null,
          entity_type_id: formData.entity_type_id || null,
          primary_focus_id: formData.primary_focus_id || null,
          website: formData.website.trim() || null,
          email: formData.email.trim() || null,
        }),
      });

      if (response.ok) {
        await refreshEntities();
        router.push("/dashboard/entities");
      } else {
        const error = await response.json();
        alert(error.error || "Failed to create space");
      }
    } catch (error) {
      console.error("Error creating space:", error);
      alert("Failed to create space");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard/entities">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            Create Space
          </h1>
          <p className="text-muted-foreground">
            Add a new business, venture, or project space
          </p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Space Details</CardTitle>
            <CardDescription>
              Basic information about your space
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                placeholder="e.g., TPC Ministries"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>

            {/* Legal Name */}
            <div className="space-y-2">
              <Label htmlFor="legal_name">Legal Name</Label>
              <Input
                id="legal_name"
                placeholder="e.g., TPC Ministries Inc."
                value={formData.legal_name}
                onChange={(e) => setFormData({ ...formData, legal_name: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">
                Official legal name if different from display name
              </p>
            </div>

            {/* Entity Type */}
            <div className="space-y-2">
              <Label>Entity Type</Label>
              {loadingLookups ? (
                <div className="flex items-center gap-2 h-10 text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading types...
                </div>
              ) : (
                <Select
                  value={formData.entity_type_id}
                  onValueChange={(value) => setFormData({ ...formData, entity_type_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select entity type" />
                  </SelectTrigger>
                  <SelectContent>
                    {entityTypes.map((type) => (
                      <SelectItem key={type.id} value={type.id}>
                        <div className="flex items-center gap-2">
                          {entityTypeIcons[type.name] || <Globe className="h-4 w-4" />}
                          <span className="capitalize">{type.name}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            {/* Primary Focus */}
            <div className="space-y-2">
              <Label>Primary Focus Area</Label>
              {loadingLookups ? (
                <div className="flex items-center gap-2 h-10 text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading focus areas...
                </div>
              ) : (
                <Select
                  value={formData.primary_focus_id}
                  onValueChange={(value) => setFormData({ ...formData, primary_focus_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select primary focus" />
                  </SelectTrigger>
                  <SelectContent>
                    {focusAreas.map((focus) => (
                      <SelectItem key={focus.id} value={focus.id}>
                        <div className="flex items-center gap-2">
                          <span>{focus.icon}</span>
                          <span className="capitalize">{focus.name}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="What does this entity do?"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
              />
            </div>

            {/* Contact Info */}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="website">Website</Label>
                <Input
                  id="website"
                  type="url"
                  placeholder="https://example.com"
                  value={formData.website}
                  onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="contact@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 mt-6">
          <Link href="/dashboard/entities">
            <Button variant="outline" type="button">
              Cancel
            </Button>
          </Link>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <Check className="h-4 w-4 mr-2" />
                Create Space
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
