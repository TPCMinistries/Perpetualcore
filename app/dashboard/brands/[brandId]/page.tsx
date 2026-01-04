"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Palette,
  Loader2,
  Sparkles,
  Save,
  Trash2,
  Calendar,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Brand } from "@/types/entities";

const voiceOptions = [
  { value: "professional", label: "Professional", desc: "Formal, business-focused" },
  { value: "casual", label: "Casual", desc: "Relaxed, conversational" },
  { value: "pastoral", label: "Pastoral", desc: "Caring, spiritual guidance" },
  { value: "academic", label: "Academic", desc: "Educational, research-focused" },
  { value: "friendly", label: "Friendly", desc: "Warm, approachable" },
];

const emojiOptions = [
  { value: "none", label: "None" },
  { value: "minimal", label: "Minimal" },
  { value: "moderate", label: "Moderate" },
  { value: "heavy", label: "Heavy" },
];

const hashtagOptions = [
  { value: "none", label: "None" },
  { value: "minimal", label: "Minimal" },
  { value: "relevant", label: "Relevant" },
  { value: "trending", label: "Trending" },
];

const ctaOptions = [
  { value: "none", label: "None" },
  { value: "soft", label: "Soft" },
  { value: "direct", label: "Direct" },
  { value: "urgent", label: "Urgent" },
];

interface PageProps {
  params: Promise<{ brandId: string }>;
}

export default function BrandDetailPage({ params }: PageProps) {
  const { brandId } = use(params);
  const router = useRouter();
  const [brand, setBrand] = useState<Brand | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    tagline: "",
    description: "",
    color_primary: "#6366f1",
    voice: "professional",
    emoji_usage: "minimal",
    hashtag_strategy: "relevant",
    cta_style: "soft",
    content_calendar_enabled: true,
    approval_required: true,
    auto_schedule_enabled: false,
  });

  useEffect(() => {
    fetchBrand();
  }, [brandId]);

  const fetchBrand = async () => {
    try {
      const response = await fetch(`/api/brands/${brandId}`);
      if (!response.ok) {
        throw new Error("Brand not found");
      }

      const data = await response.json();
      setBrand(data.brand);

      // Populate form with existing data
      setFormData({
        name: data.brand.name || "",
        tagline: data.brand.tagline || "",
        description: data.brand.description || "",
        color_primary: data.brand.color_primary || "#6366f1",
        voice: data.brand.tone_config?.voice || "professional",
        emoji_usage: data.brand.tone_config?.emoji_usage || "minimal",
        hashtag_strategy: data.brand.tone_config?.hashtag_strategy || "relevant",
        cta_style: data.brand.tone_config?.cta_style || "soft",
        content_calendar_enabled: data.brand.content_calendar_enabled ?? true,
        approval_required: data.brand.approval_required ?? true,
        auto_schedule_enabled: data.brand.auto_schedule_enabled ?? false,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load brand");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch(`/api/brands/${brandId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          tagline: formData.tagline || null,
          description: formData.description || null,
          color_primary: formData.color_primary,
          tone_config: {
            ...brand?.tone_config,
            voice: formData.voice,
            emoji_usage: formData.emoji_usage,
            hashtag_strategy: formData.hashtag_strategy,
            cta_style: formData.cta_style,
          },
          content_calendar_enabled: formData.content_calendar_enabled,
          approval_required: formData.approval_required,
          auto_schedule_enabled: formData.auto_schedule_enabled,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to update brand");
      }

      const { brand: updated } = await response.json();
      setBrand(updated);
      setSuccess("Brand updated successfully");

      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update brand");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this brand? This action cannot be undone.")) {
      return;
    }

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/brands/${brandId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete brand");
      }

      router.push("/dashboard/brands");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete brand");
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!brand) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Brand not found</p>
        <Link href="/dashboard/brands">
          <Button variant="link">Go back to brands</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/brands">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div className="flex items-center gap-3">
            <div
              className="h-12 w-12 rounded-lg flex items-center justify-center text-xl font-semibold text-white"
              style={{ backgroundColor: brand.color_primary || "#6366f1" }}
            >
              {brand.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                {brand.name}
              </h1>
              <div className="flex items-center gap-2 mt-1">
                {brand.entity && (
                  <Badge variant="outline" className="text-xs">
                    {brand.entity.name}
                  </Badge>
                )}
                <Badge variant="secondary" className="text-xs">
                  {brand.tone_config?.voice || "professional"}
                </Badge>
              </div>
            </div>
          </div>
        </div>
        <Button
          variant="destructive"
          size="sm"
          onClick={handleDelete}
          disabled={isDeleting}
        >
          {isDeleting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Trash2 className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Success/Error Messages */}
      {success && (
        <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg text-green-700 dark:text-green-400 text-sm">
          {success}
        </div>
      )}
      {error && (
        <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive text-sm">
          {error}
        </div>
      )}

      {/* Basic Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            Brand Identity
          </CardTitle>
          <CardDescription>
            Basic information about your brand
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Brand Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Brand name"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="tagline">Tagline</Label>
            <Input
              id="tagline"
              value={formData.tagline}
              onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
              placeholder="e.g., Inspiring faith through media"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="What is this brand about?"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="color">Primary Color</Label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                id="color"
                value={formData.color_primary}
                onChange={(e) => setFormData({ ...formData, color_primary: e.target.value })}
                className="h-10 w-20 rounded cursor-pointer"
              />
              <Input
                value={formData.color_primary}
                onChange={(e) => setFormData({ ...formData, color_primary: e.target.value })}
                className="w-28"
                placeholder="#6366f1"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tone & Voice */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            Tone & Voice
          </CardTitle>
          <CardDescription>
            How should AI generate content for this brand?
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Voice Style</Label>
            <Select
              value={formData.voice}
              onValueChange={(value) => setFormData({ ...formData, voice: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {voiceOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    <div>
                      <span className="font-medium">{option.label}</span>
                      <span className="text-muted-foreground ml-2 text-xs">
                        {option.desc}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Emoji Usage</Label>
              <Select
                value={formData.emoji_usage}
                onValueChange={(value) => setFormData({ ...formData, emoji_usage: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {emojiOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Hashtags</Label>
              <Select
                value={formData.hashtag_strategy}
                onValueChange={(value) => setFormData({ ...formData, hashtag_strategy: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {hashtagOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Call-to-Action</Label>
              <Select
                value={formData.cta_style}
                onValueChange={(value) => setFormData({ ...formData, cta_style: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ctaOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Content Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Content Settings
          </CardTitle>
          <CardDescription>
            Configure content creation and approval workflow
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>Content Calendar</Label>
              <p className="text-xs text-muted-foreground">
                Enable content planning and scheduling
              </p>
            </div>
            <Switch
              checked={formData.content_calendar_enabled}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, content_calendar_enabled: checked })
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label>Require Approval</Label>
              <p className="text-xs text-muted-foreground">
                Content must be approved before publishing
              </p>
            </div>
            <Switch
              checked={formData.approval_required}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, approval_required: checked })
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label>Auto-Schedule</Label>
              <p className="text-xs text-muted-foreground">
                Automatically schedule approved content
              </p>
            </div>
            <Switch
              checked={formData.auto_schedule_enabled}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, auto_schedule_enabled: checked })
              }
            />
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex items-center justify-end gap-4">
        <Link href="/dashboard/brands">
          <Button variant="ghost">Cancel</Button>
        </Link>
        <Button onClick={handleSave} disabled={isSaving || !formData.name}>
          {isSaving ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          Save Changes
        </Button>
      </div>
    </div>
  );
}
