"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
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
import { ArrowLeft, Loader2, Save, Settings as SettingsIcon } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

interface Assistant {
  id: string;
  name: string;
  description: string;
  role: string;
  avatar_emoji: string;
  tone: string;
  system_instructions: string;
  is_active: boolean;
}

const toneOptions = [
  { value: "professional", label: "Professional" },
  { value: "friendly", label: "Friendly" },
  { value: "casual", label: "Casual" },
  { value: "formal", label: "Formal" },
  { value: "enthusiastic", label: "Enthusiastic" },
];

const roleOptions = [
  { value: "strategic_advisor", label: "Strategic Advisor" },
  { value: "sales", label: "Sales" },
  { value: "marketing", label: "Marketing" },
  { value: "customer_success", label: "Customer Success" },
  { value: "content_writer", label: "Content Writer" },
  { value: "code_reviewer", label: "Code Reviewer" },
  { value: "researcher", label: "Researcher" },
  { value: "legal_advisor", label: "Legal Advisor" },
  { value: "hr_director", label: "HR Director" },
  { value: "operations", label: "Operations" },
  { value: "product_manager", label: "Product Manager" },
  { value: "custom", label: "Custom" },
];

export default function AssistantSettingsPage() {
  const params = useParams();
  const router = useRouter();
  const assistantId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [assistant, setAssistant] = useState<Assistant | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    role: "",
    avatar_emoji: "",
    tone: "",
    system_instructions: "",
    is_active: true,
  });

  useEffect(() => {
    if (assistantId) {
      fetchAssistant();
    }
  }, [assistantId]);

  async function fetchAssistant() {
    try {
      const response = await fetch(`/api/assistants/${assistantId}`);
      if (response.ok) {
        const data = await response.json();
        setAssistant(data.assistant);
        setFormData({
          name: data.assistant.name || "",
          description: data.assistant.description || "",
          role: data.assistant.role || "",
          avatar_emoji: data.assistant.avatar_emoji || "",
          tone: data.assistant.tone || "",
          system_instructions: data.assistant.system_instructions || "",
          is_active: data.assistant.is_active ?? true,
        });
      } else {
        toast.error("Failed to load assistant");
      }
    } catch (error) {
      console.error("Error fetching assistant:", error);
      toast.error("An error occurred while loading assistant");
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    if (!formData.name.trim() || !formData.description.trim()) {
      toast.error("Name and description are required");
      return;
    }

    setSaving(true);
    try {
      const response = await fetch(`/api/assistants/${assistantId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        toast.success("Settings saved successfully");
        router.push("/dashboard/assistants");
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || "Failed to save settings");
      }
    } catch (error) {
      console.error("Error saving settings:", error);
      toast.error("An error occurred while saving");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-slate-600" />
      </div>
    );
  }

  if (!assistant) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-slate-600 dark:text-slate-400">Assistant not found</p>
      </div>
    );
  }

  return (
    <div className="container max-w-4xl mx-auto py-8 px-4">
      {/* Header */}
      <div className="mb-6">
        <Button variant="ghost" size="sm" asChild className="mb-4">
          <Link href="/dashboard/assistants">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Executive Suite
          </Link>
        </Button>
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center">
            <SettingsIcon className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-semibold text-slate-900 dark:text-slate-100">
              Assistant Settings
            </h1>
            <p className="text-slate-600 dark:text-slate-400">
              Customize {assistant.name}'s configuration
            </p>
          </div>
        </div>
      </div>

      {/* Settings Form */}
      <Card className="border-slate-200 dark:border-slate-800">
        <CardHeader>
          <CardTitle className="text-slate-900 dark:text-slate-100">Configuration</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="name" className="text-slate-700 dark:text-slate-300">
              Name
            </Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Assistant Name"
              className="border-slate-200 dark:border-slate-800"
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description" className="text-slate-700 dark:text-slate-300">
              Description
            </Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Brief description of the assistant's purpose"
              rows={3}
              className="border-slate-200 dark:border-slate-800 resize-none"
            />
          </div>

          {/* Role */}
          <div className="space-y-2">
            <Label htmlFor="role" className="text-slate-700 dark:text-slate-300">
              Role
            </Label>
            <Select
              value={formData.role}
              onValueChange={(value) => setFormData({ ...formData, role: value })}
            >
              <SelectTrigger className="border-slate-200 dark:border-slate-800">
                <SelectValue placeholder="Select a role" />
              </SelectTrigger>
              <SelectContent>
                {roleOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Avatar Emoji */}
          <div className="space-y-2">
            <Label htmlFor="emoji" className="text-slate-700 dark:text-slate-300">
              Avatar Emoji
            </Label>
            <Input
              id="emoji"
              value={formData.avatar_emoji}
              onChange={(e) => setFormData({ ...formData, avatar_emoji: e.target.value })}
              placeholder="e.g. 🤖, 💼, 📊"
              maxLength={2}
              className="border-slate-200 dark:border-slate-800"
            />
            <p className="text-xs text-slate-500 dark:text-slate-500">
              Enter a single emoji to represent this assistant
            </p>
          </div>

          {/* Tone */}
          <div className="space-y-2">
            <Label htmlFor="tone" className="text-slate-700 dark:text-slate-300">
              Tone
            </Label>
            <Select
              value={formData.tone}
              onValueChange={(value) => setFormData({ ...formData, tone: value })}
            >
              <SelectTrigger className="border-slate-200 dark:border-slate-800">
                <SelectValue placeholder="Select a tone" />
              </SelectTrigger>
              <SelectContent>
                {toneOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* System Instructions */}
          <div className="space-y-2">
            <Label htmlFor="instructions" className="text-slate-700 dark:text-slate-300">
              System Instructions
            </Label>
            <Textarea
              id="instructions"
              value={formData.system_instructions}
              onChange={(e) =>
                setFormData({ ...formData, system_instructions: e.target.value })
              }
              placeholder="Detailed instructions for how this assistant should behave..."
              rows={8}
              className="border-slate-200 dark:border-slate-800 resize-none font-mono text-sm"
            />
            <p className="text-xs text-slate-500 dark:text-slate-500">
              These instructions guide the assistant's behavior and expertise
            </p>
          </div>

          {/* Active Status */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="is_active"
              checked={formData.is_active}
              onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
              className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
            />
            <Label htmlFor="is_active" className="text-slate-700 dark:text-slate-300 cursor-pointer">
              Active (assistant appears in Executive Suite)
            </Label>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
            <Button
              onClick={handleSave}
              disabled={saving}
              className="bg-gradient-to-br from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white"
            >
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Changes
                </>
              )}
            </Button>
            <Button
              variant="outline"
              onClick={() => router.push("/dashboard/assistants")}
              className="border-slate-200 dark:border-slate-800"
            >
              Cancel
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
