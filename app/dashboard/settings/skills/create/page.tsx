"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import SkillBuilderForm from "@/components/skills/SkillBuilderForm";
import type { CreateCustomSkillInput } from "@/lib/skills/custom/types";

export default function CreateCustomSkillPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (data: CreateCustomSkillInput) => {
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/skills/custom", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await res.json();

      if (!res.ok) {
        if (result.errors) {
          toast.error(result.errors.join(", "));
        } else {
          toast.error(result.error || "Failed to create skill");
        }
        return;
      }

      toast.success("Custom skill created!");
      router.push(`/dashboard/settings/skills/${result.skill.id}/edit`);
    } catch (err: any) {
      toast.error(err.message || "Failed to create skill");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push("/dashboard/settings/skills")}
        >
          <ArrowLeft className="h-4 w-4 mr-1" /> Back
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Create Custom Skill</h1>
          <p className="text-muted-foreground text-sm">
            Build a skill that connects to any HTTP API
          </p>
        </div>
      </div>

      <SkillBuilderForm
        onSubmit={handleSubmit}
        submitLabel="Create Skill"
        isSubmitting={isSubmitting}
      />
    </div>
  );
}
