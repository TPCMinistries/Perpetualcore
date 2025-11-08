"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  Loader2,
  FileText,
  Presentation,
  FileSpreadsheet,
  Image as ImageIcon,
  Sparkles,
  Wand2,
  Download,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface GenerateContentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

type ContentType = "document" | "powerpoint" | "spreadsheet" | "image";

export function GenerateContentModal({
  open,
  onOpenChange,
  onSuccess,
}: GenerateContentModalProps) {
  const [contentType, setContentType] = useState<ContentType>("document");
  const [title, setTitle] = useState("");
  const [prompt, setPrompt] = useState("");
  const [generating, setGenerating] = useState(false);
  const [useAI, setUseAI] = useState(false);
  const [aiGeneratedContent, setAiGeneratedContent] = useState("");

  // Image generation settings
  const [imageSize, setImageSize] = useState<"1024x1024" | "1792x1024" | "1024x1792">("1024x1024");
  const [imageQuality, setImageQuality] = useState<"standard" | "hd">("standard");
  const [imageStyle, setImageStyle] = useState<"vivid" | "natural">("vivid");

  const contentTypes = [
    {
      id: "document" as ContentType,
      label: "Document",
      icon: FileText,
      description: "Rich text document (HTML)",
      color: "text-blue-600",
      bgColor: "bg-blue-50 dark:bg-blue-950/30",
    },
    {
      id: "powerpoint" as ContentType,
      label: "PowerPoint",
      icon: Presentation,
      description: "Presentation slides (.pptx)",
      color: "text-orange-600",
      bgColor: "bg-orange-50 dark:bg-orange-950/30",
    },
    {
      id: "spreadsheet" as ContentType,
      label: "Spreadsheet",
      icon: FileSpreadsheet,
      description: "Excel spreadsheet (.xlsx)",
      color: "text-green-600",
      bgColor: "bg-green-50 dark:bg-green-950/30",
    },
    {
      id: "image" as ContentType,
      label: "AI Image",
      icon: ImageIcon,
      description: "DALL-E 3 generated image",
      color: "text-purple-600",
      bgColor: "bg-purple-50 dark:bg-purple-950/30",
    },
  ];

  const handleGenerateWithAI = async () => {
    if (!prompt.trim()) {
      toast.error("Please enter a description");
      return;
    }

    setGenerating(true);
    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [
            {
              role: "user",
              content: `Generate ${contentType} content based on this: ${prompt}\n\nProvide the content in a structured format.`,
            },
          ],
          model: "auto",
        }),
      });

      if (!response.ok) throw new Error("Failed to generate content");

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let fullContent = "";

      while (true) {
        const { done, value } = (await reader?.read()) || {};
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split("\n").filter((line) => line.trim());

        for (const line of lines) {
          try {
            const data = JSON.parse(line);
            if (data.content) {
              fullContent += data.content;
            }
          } catch (err) {
            // Ignore parse errors
          }
        }
      }

      setAiGeneratedContent(fullContent);
      setUseAI(true);
      toast.success("Content generated! Review and download.");
    } catch (error: any) {
      console.error("Error generating content:", error);
      toast.error(error.message || "Failed to generate content");
    } finally {
      setGenerating(false);
    }
  };

  const handleDownload = async () => {
    if (!title.trim() && contentType !== "image") {
      toast.error("Please enter a title");
      return;
    }

    if (contentType === "image") {
      // Generate image with DALL-E
      if (!prompt.trim()) {
        toast.error("Please enter an image description");
        return;
      }

      setGenerating(true);
      try {
        const response = await fetch("/api/generate-image", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            prompt,
            size: imageSize,
            quality: imageQuality,
            style: imageStyle,
          }),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || "Failed to generate image");
        }

        const data = await response.json();

        // Download image
        const imageResponse = await fetch(data.imageUrl);
        const blob = await imageResponse.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `ai-generated-${Date.now()}.png`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);

        toast.success("Image generated and downloaded!");
        onOpenChange(false);
        resetForm();
      } catch (error: any) {
        toast.error(error.message || "Failed to generate image");
      } finally {
        setGenerating(false);
      }
      return;
    }

    // Generate document/powerpoint/spreadsheet
    setGenerating(true);
    try {
      let payload: any = {
        type: contentType === "document" ? "word" : contentType,
        title,
      };

      if (contentType === "powerpoint") {
        // Parse AI content or use prompt to create slides
        const content = aiGeneratedContent || prompt;
        const sections = content.split("\n\n").filter((s) => s.trim());
        payload.slides = sections.map((section, idx) => ({
          title: `Slide ${idx + 1}`,
          content: [section.substring(0, 500)],
        }));
      } else if (contentType === "spreadsheet") {
        // Create sample spreadsheet data
        payload.data = [
          { Item: "Sample 1", Value: 100, Status: "Active" },
          { Item: "Sample 2", Value: 200, Status: "Pending" },
        ];
      } else {
        // Document
        payload.content = aiGeneratedContent || prompt;
      }

      const response = await fetch("/api/generate-document", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to generate document");
      }

      // Download file
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const ext =
        contentType === "powerpoint"
          ? "pptx"
          : contentType === "spreadsheet"
          ? "xlsx"
          : "docx";
      a.download = `${title.replace(/[^a-z0-9]/gi, "_")}.${ext}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success(`${contentType} downloaded successfully!`);
      onOpenChange(false);
      resetForm();
    } catch (error: any) {
      console.error("Error:", error);
      toast.error(error.message || "Failed to generate content");
    } finally {
      setGenerating(false);
    }
  };

  const resetForm = () => {
    setTitle("");
    setPrompt("");
    setAiGeneratedContent("");
    setUseAI(false);
    setContentType("document");
  };

  const selectedType = contentTypes.find((t) => t.id === contentType);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-600" />
            Generate Content
          </DialogTitle>
          <DialogDescription>
            Create documents, presentations, spreadsheets, or images with AI assistance
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Content Type Selection */}
          <div className="space-y-3">
            <Label>What would you like to create?</Label>
            <div className="grid grid-cols-2 gap-3">
              {contentTypes.map((type) => (
                <button
                  key={type.id}
                  onClick={() => setContentType(type.id)}
                  className={`p-4 rounded-lg border-2 transition-all text-left ${
                    contentType === type.id
                      ? "border-purple-500 dark:border-purple-400 bg-purple-50 dark:bg-purple-950/30"
                      : "border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`h-10 w-10 rounded-lg ${type.bgColor} flex items-center justify-center flex-shrink-0`}>
                      <type.icon className={`h-5 w-5 ${type.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-sm text-slate-900 dark:text-slate-100">
                        {type.label}
                      </h4>
                      <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                        {type.description}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Title Input (not for images) */}
          {contentType !== "image" && (
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                placeholder={`Enter ${selectedType?.label.toLowerCase()} title...`}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>
          )}

          {/* Prompt/Description */}
          <div className="space-y-2">
            <Label htmlFor="prompt">
              {contentType === "image" ? "Image Description" : "Description or Content"}
            </Label>
            <Textarea
              id="prompt"
              placeholder={
                contentType === "image"
                  ? "A serene landscape with mountains at sunset..."
                  : "Describe what you want to create, or paste/write your content..."
              }
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={contentType === "image" ? 3 : 6}
              className="resize-none"
            />
          </div>

          {/* Image Settings */}
          {contentType === "image" && (
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Size</Label>
                <Select value={imageSize} onValueChange={(v: any) => setImageSize(v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1024x1024">Square</SelectItem>
                    <SelectItem value="1792x1024">Landscape</SelectItem>
                    <SelectItem value="1024x1792">Portrait</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Quality</Label>
                <Select value={imageQuality} onValueChange={(v: any) => setImageQuality(v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="standard">Standard</SelectItem>
                    <SelectItem value="hd">HD</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Style</Label>
                <Select value={imageStyle} onValueChange={(v: any) => setImageStyle(v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="vivid">Vivid</SelectItem>
                    <SelectItem value="natural">Natural</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {/* AI Generated Content Preview */}
          {aiGeneratedContent && contentType !== "image" && (
            <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-4 space-y-2">
              <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                AI Generated Content Preview
              </Label>
              <div className="text-sm text-slate-600 dark:text-slate-400 max-h-40 overflow-y-auto whitespace-pre-wrap">
                {aiGeneratedContent.substring(0, 500)}
                {aiGeneratedContent.length > 500 && "..."}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3">
            {contentType !== "image" && !useAI && (
              <Button
                onClick={handleGenerateWithAI}
                disabled={generating || !prompt.trim()}
                variant="outline"
                className="flex-1"
              >
                {generating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Wand2 className="mr-2 h-4 w-4" />
                    Generate with AI
                  </>
                )}
              </Button>
            )}

            <Button
              onClick={handleDownload}
              disabled={generating || (contentType !== "image" && !title.trim()) || !prompt.trim()}
              className="flex-1 bg-purple-600 hover:bg-purple-700 text-white"
            >
              {generating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {contentType === "image" ? "Generating..." : "Creating..."}
                </>
              ) : (
                <>
                  <Download className="mr-2 h-4 w-4" />
                  {contentType === "image" ? "Generate & Download" : "Download"}
                </>
              )}
            </Button>
          </div>

          {/* Help Text */}
          <div className="bg-blue-50 dark:bg-blue-950/20 rounded-lg p-3">
            <p className="text-xs text-blue-900 dark:text-blue-300">
              {contentType === "image" ? (
                <>
                  <strong>Tip:</strong> DALL-E 3 creates high-quality images. Standard quality costs ~$0.04, HD costs ~$0.08 per image.
                </>
              ) : (
                <>
                  <strong>Tip:</strong> Use "Generate with AI" to let AI create the content for you, or write/paste your own content and download directly.
                </>
              )}
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
