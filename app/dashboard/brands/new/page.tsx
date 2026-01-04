"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Palette,
  Loader2,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useEntityContext } from "@/components/entities/EntityProvider";

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

export default function NewBrandPage() {
  const router = useRouter();
  const { currentEntity, entities } = useEntityContext();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    entity_id: currentEntity?.id || "",
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/brands", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          entity_id: formData.entity_id,
          name: formData.name,
          tagline: formData.tagline || null,
          description: formData.description || null,
          color_primary: formData.color_primary,
          tone_config: {
            voice: formData.voice,
            emoji_usage: formData.emoji_usage,
            hashtag_strategy: formData.hashtag_strategy,
            cta_style: formData.cta_style,
            personality_traits: [],
            writing_style: "clear and concise",
            avoid_words: [],
            preferred_phrases: [],
          },
          content_calendar_enabled: formData.content_calendar_enabled,
          approval_required: formData.approval_required,
          auto_schedule_enabled: formData.auto_schedule_enabled,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to create brand");
      }

      const { brand } = await response.json();
      router.push(`/dashboard/brands/${brand.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create brand");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard/brands">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            New Brand
          </h1>
          <p className="text-muted-foreground">
            Create a new brand identity for content creation
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
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
              <Label htmlFor="entity_id">Entity *</Label>
              <Select
                value={formData.entity_id}
                onValueChange={(value) => setFormData({ ...formData, entity_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select an entity" />
                </SelectTrigger>
                <SelectContent>
                  {entities.map((entity) => (
                    <SelectItem key={entity.id} value={entity.id}>
                      {entity.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Which entity does this brand belong to?
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">Brand Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., TPC Media, Uplift Blog"
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
            <CardTitle>Content Settings</CardTitle>
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

        {/* Error Display */}
        {error && (
          <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive text-sm">
            {error}
          </div>
        )}

        {/* Submit */}
        <div className="flex items-center justify-end gap-4">
          <Link href="/dashboard/brands">
            <Button type="button" variant="ghost">
              Cancel
            </Button>
          </Link>
          <Button type="submit" disabled={isSubmitting || !formData.entity_id || !formData.name}>
            {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Create Brand
          </Button>
        </div>
      </form>
    </div>
  );
}
