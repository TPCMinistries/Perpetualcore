"use client";

import { useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Card } from "./ui/card";
import { Loader2, Image as ImageIcon, Download, Sparkles } from "lucide-react";
import { toast } from "sonner";

export function ImageGenerator() {
  const [prompt, setPrompt] = useState("");
  const [size, setSize] = useState<"1024x1024" | "1792x1024" | "1024x1792">("1024x1024");
  const [quality, setQuality] = useState<"standard" | "hd">("standard");
  const [style, setStyle] = useState<"vivid" | "natural">("vivid");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<{
    url: string;
    revisedPrompt: string;
  } | null>(null);

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast.error("Please enter a prompt");
      return;
    }

    setIsGenerating(true);
    try {
      const response = await fetch("/api/generate-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt,
          size,
          quality,
          style,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to generate image");
      }

      const data = await response.json();
      setGeneratedImage({
        url: data.imageUrl,
        revisedPrompt: data.revisedPrompt,
      });
      toast.success("Image generated successfully!");
    } catch (error: any) {
      console.error("Error generating image:", error);
      toast.error(error.message || "Failed to generate image");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = async () => {
    if (!generatedImage) return;

    try {
      const response = await fetch(generatedImage.url);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `ai-generated-${Date.now()}.png`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success("Image downloaded!");
    } catch (error) {
      toast.error("Failed to download image");
    }
  };

  return (
    <Card className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
          <Sparkles className="h-5 w-5 text-white" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
            AI Image Generator
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Powered by DALL-E 3
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {/* Prompt */}
        <div className="space-y-2">
          <Label htmlFor="prompt">Image Description</Label>
          <Input
            id="prompt"
            placeholder="A serene landscape with mountains at sunset..."
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            disabled={isGenerating}
            className="h-20"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleGenerate();
              }
            }}
          />
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Describe the image you want to generate
          </p>
        </div>

        {/* Settings Grid */}
        <div className="grid grid-cols-3 gap-4">
          {/* Size */}
          <div className="space-y-2">
            <Label htmlFor="size">Size</Label>
            <Select value={size} onValueChange={(v: any) => setSize(v)} disabled={isGenerating}>
              <SelectTrigger id="size">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1024x1024">Square (1024×1024)</SelectItem>
                <SelectItem value="1792x1024">Landscape (1792×1024)</SelectItem>
                <SelectItem value="1024x1792">Portrait (1024×1792)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Quality */}
          <div className="space-y-2">
            <Label htmlFor="quality">Quality</Label>
            <Select value={quality} onValueChange={(v: any) => setQuality(v)} disabled={isGenerating}>
              <SelectTrigger id="quality">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="standard">Standard</SelectItem>
                <SelectItem value="hd">HD (Higher cost)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Style */}
          <div className="space-y-2">
            <Label htmlFor="style">Style</Label>
            <Select value={style} onValueChange={(v: any) => setStyle(v)} disabled={isGenerating}>
              <SelectTrigger id="style">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="vivid">Vivid (Dramatic)</SelectItem>
                <SelectItem value="natural">Natural (Realistic)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Generate Button */}
        <Button
          onClick={handleGenerate}
          disabled={isGenerating || !prompt.trim()}
          className="w-full"
          size="lg"
        >
          {isGenerating ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4 mr-2" />
              Generate Image
            </>
          )}
        </Button>
      </div>

      {/* Generated Image */}
      {generatedImage && (
        <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-slate-800">
          <div className="relative rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-900">
            <img
              src={generatedImage.url}
              alt="Generated image"
              className="w-full h-auto"
            />
          </div>

          {generatedImage.revisedPrompt && (
            <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-4">
              <p className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                DALL-E Refined Prompt:
              </p>
              <p className="text-sm text-slate-700 dark:text-slate-300">
                {generatedImage.revisedPrompt}
              </p>
            </div>
          )}

          <Button
            onClick={handleDownload}
            variant="outline"
            className="w-full"
          >
            <Download className="h-4 w-4 mr-2" />
            Download Image
          </Button>
        </div>
      )}

      {/* Pricing Note */}
      <div className="bg-blue-50 dark:bg-blue-950/20 rounded-lg p-4">
        <p className="text-xs text-blue-900 dark:text-blue-300">
          <strong>Pricing:</strong> Standard quality costs ~$0.04 per image, HD quality costs ~$0.08 per image
        </p>
      </div>
    </Card>
  );
}
