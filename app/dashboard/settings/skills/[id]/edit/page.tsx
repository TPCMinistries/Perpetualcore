"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import SkillBuilderForm from "@/components/skills/SkillBuilderForm";
import type { CreateCustomSkillInput } from "@/lib/skills/custom/types";

export default function EditCustomSkillPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [skill, setSkill] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/skills/custom/${id}`);
        if (!res.ok) {
          toast.error("Skill not found");
          router.push("/dashboard/settings/skills");
          return;
        }
        const data = await res.json();
        setSkill(data.skill);
      } catch {
        toast.error("Failed to load skill");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id, router]);

  const handleSubmit = async (data: CreateCustomSkillInput) => {
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/skills/custom/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await res.json();

      if (!res.ok) {
        if (result.errors) {
          toast.error(result.errors.join(", "));
        } else {
          toast.error(result.error || "Failed to update skill");
        }
        return;
      }

      setSkill(result.skill);
      toast.success("Skill updated!");
    } catch (err: any) {
      toast.error(err.message || "Failed to update skill");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTest = async (
    skillId: string,
    toolIndex: number,
    params: Record<string, any>,
    credentialValue?: string
  ) => {
    const res = await fetch(`/api/skills/custom/${skillId}/test`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        tool_index: toolIndex,
        params,
        credential_value: credentialValue,
      }),
    });
    return res.json();
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this skill? This cannot be undone.")) {
      return;
    }

    setIsDeleting(true);
    try {
      const res = await fetch(`/api/skills/custom/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || "Failed to delete");
        return;
      }

      toast.success("Skill deleted");
      router.push("/dashboard/settings/skills");
    } catch (err: any) {
      toast.error(err.message || "Failed to delete");
    } finally {
      setIsDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!skill) return null;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/dashboard/settings/skills")}
          >
            <ArrowLeft className="h-4 w-4 mr-1" /> Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Edit: {skill.name}</h1>
            <p className="text-muted-foreground text-sm font-mono">
              {skill.slug}
            </p>
          </div>
        </div>
        <Button
          variant="destructive"
          size="sm"
          onClick={handleDelete}
          disabled={isDeleting}
        >
          {isDeleting ? (
            <Loader2 className="h-4 w-4 mr-1 animate-spin" />
          ) : (
            <Trash2 className="h-4 w-4 mr-1" />
          )}
          Delete Skill
        </Button>
      </div>

      <SkillBuilderForm
        initialData={{
          id: skill.id,
          name: skill.name,
          slug: skill.slug,
          description: skill.description,
          category: skill.category,
          tags: skill.tags,
          visibility: skill.visibility,
          system_prompt: skill.system_prompt,
          tools: skill.tools,
          auth_type: skill.auth_type,
          auth_config: skill.auth_config,
          allowed_domains: skill.allowed_domains,
        }}
        onSubmit={handleSubmit}
        onTest={handleTest}
        submitLabel="Save Changes"
        isSubmitting={isSubmitting}
      />
    </div>
  );
}
