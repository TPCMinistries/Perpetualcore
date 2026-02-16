"use client";

import { useState } from "react";
import type { A2UIBlock } from "@/lib/a2ui/types";
import type { FormBlockData } from "@/lib/a2ui/types";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface FormBlockProps {
  block: A2UIBlock;
}

export default function FormBlock({ block }: FormBlockProps) {
  const formData = block.data as FormBlockData;
  const [submitState, setSubmitState] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const defaultValues: Record<string, unknown> = {};
  for (const field of formData.fields) {
    if (field.default !== undefined) {
      defaultValues[field.name] = field.default;
    } else if (field.type === "checkbox") {
      defaultValues[field.name] = false;
    } else {
      defaultValues[field.name] = "";
    }
  }

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm({
    defaultValues,
  });

  const onSubmit = async (data: Record<string, unknown>) => {
    setSubmitState("loading");
    setErrorMessage("");

    try {
      const res = await fetch("/api/a2ui/callback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          callbackId: formData.callbackId,
          data,
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to submit form");
      }

      setSubmitState("success");
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Something went wrong");
      setSubmitState("error");
    }
  };

  if (submitState === "success") {
    return (
      <div className="rounded-lg border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-950/30 p-4 flex items-center gap-3">
        <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0" />
        <p className="text-sm text-green-700 dark:text-green-300">
          Form submitted successfully.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-4">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {formData.fields.map((field) => (
          <div key={field.name} className="space-y-1.5">
            <Label
              htmlFor={field.name}
              className="text-sm font-medium text-slate-700 dark:text-slate-300"
            >
              {field.label}
              {field.required && (
                <span className="text-red-500 ml-0.5">*</span>
              )}
            </Label>

            {field.type === "text" || field.type === "email" || field.type === "date" ? (
              <Input
                id={field.name}
                type={field.type}
                placeholder={field.placeholder}
                className="h-9 text-sm"
                {...register(field.name, {
                  required: field.required ? `${field.label} is required` : false,
                })}
              />
            ) : field.type === "number" ? (
              <Input
                id={field.name}
                type="number"
                placeholder={field.placeholder}
                className="h-9 text-sm"
                {...register(field.name, {
                  required: field.required ? `${field.label} is required` : false,
                  valueAsNumber: true,
                })}
              />
            ) : field.type === "textarea" ? (
              <Textarea
                id={field.name}
                placeholder={field.placeholder}
                className="text-sm min-h-[80px]"
                {...register(field.name, {
                  required: field.required ? `${field.label} is required` : false,
                })}
              />
            ) : field.type === "select" ? (
              <Select
                onValueChange={(val) => setValue(field.name, val)}
                defaultValue={(field.default as string) || undefined}
              >
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue placeholder={field.placeholder || "Select..."} />
                </SelectTrigger>
                <SelectContent>
                  {field.options?.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : field.type === "checkbox" ? (
              <div className="flex items-center gap-2">
                <Checkbox
                  id={field.name}
                  checked={watch(field.name) as boolean}
                  onCheckedChange={(checked) => setValue(field.name, checked)}
                />
                <label
                  htmlFor={field.name}
                  className="text-sm text-slate-600 dark:text-slate-400 cursor-pointer"
                >
                  {field.placeholder || field.label}
                </label>
              </div>
            ) : null}

            {errors[field.name] && (
              <p className="text-xs text-red-500">
                {errors[field.name]?.message as string}
              </p>
            )}
          </div>
        ))}

        {errorMessage && (
          <p className="text-sm text-red-500">{errorMessage}</p>
        )}

        <Button
          type="submit"
          disabled={submitState === "loading"}
          className={cn(
            "w-full h-9 text-sm",
            "bg-violet-600 hover:bg-violet-700 text-white"
          )}
        >
          {submitState === "loading" ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Submitting...
            </>
          ) : (
            formData.submitLabel
          )}
        </Button>
      </form>
    </div>
  );
}
