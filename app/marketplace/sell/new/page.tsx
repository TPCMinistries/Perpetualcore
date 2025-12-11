"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Upload, DollarSign, Tag, Sparkles, FileJson, X, Loader2, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";

export default function NewMarketplaceItemPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingConfig, setIsUploadingConfig] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [configFile, setConfigFile] = useState<{ name: string; url: string } | null>(null);
  const [imageFile, setImageFile] = useState<{ name: string; url: string } | null>(null);
  const configInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState({
    type: "agent",
    name: "",
    description: "",
    long_description: "",
    pricing_type: "one_time",
    price: "",
    subscription_interval: "monthly",
    category: "",
    tags: "",
    features: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Validate form
      if (!formData.name || !formData.description || !formData.price || !formData.category) {
        throw new Error("Please fill in all required fields");
      }

      // Parse tags and features
      const tags = formData.tags
        .split(",")
        .map((tag) => tag.trim())
        .filter((tag) => tag.length > 0);

      const features = formData.features
        .split("\n")
        .map((feature) => feature.trim())
        .filter((feature) => feature.length > 0);

      const response = await fetch("/api/marketplace/items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          price: parseFloat(formData.price),
          tags,
          features,
          config: configFile ? { file_url: configFile.url } : {},
          preview_image: imageFile?.url || null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create listing");
      }

      toast.success("Listing created! It will be reviewed within 24 hours.");
      router.push("/marketplace/sell");
    } catch (error: any) {
      console.error("Error creating listing:", error);
      toast.error(error.message || "Failed to create listing");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleConfigUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ["application/json", "application/zip", "application/x-zip-compressed"];
    if (!validTypes.includes(file.type) && !file.name.endsWith(".json") && !file.name.endsWith(".zip")) {
      toast.error("Please upload a JSON or ZIP file");
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error("File size must be less than 10MB");
      return;
    }

    setIsUploadingConfig(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("type", "config");

      const response = await fetch("/api/marketplace/upload", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to upload file");
      }

      setConfigFile({ name: file.name, url: data.url });
      toast.success("Configuration file uploaded!");
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Failed to upload file";
      toast.error(errorMessage);
    } finally {
      setIsUploadingConfig(false);
      if (configInputRef.current) {
        configInputRef.current.value = "";
      }
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image size must be less than 5MB");
      return;
    }

    setIsUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("type", "image");

      const response = await fetch("/api/marketplace/upload", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to upload image");
      }

      setImageFile({ name: file.name, url: data.url });
      toast.success("Preview image uploaded!");
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Failed to upload image";
      toast.error(errorMessage);
    } finally {
      setIsUploadingImage(false);
      if (imageInputRef.current) {
        imageInputRef.current.value = "";
      }
    }
  };

  const removeConfigFile = () => {
    setConfigFile(null);
  };

  const removeImageFile = () => {
    setImageFile(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <header className="border-b bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/marketplace/sell" className="flex items-center space-x-2">
            <ArrowLeft className="h-5 w-5" />
            <span className="text-xl font-bold">Back to Dashboard</span>
          </Link>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Create New Listing</h1>
            <p className="text-muted-foreground">
              List your AI agent or workflow on the marketplace and earn 70% on every sale
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Type Selection */}
            <Card>
              <CardHeader>
                <CardTitle>Item Type</CardTitle>
                <CardDescription>
                  What type of item are you listing?
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => handleInputChange("type", "agent")}
                    className={`p-4 border-2 rounded-lg transition-colors ${
                      formData.type === "agent"
                        ? "border-primary bg-primary/5"
                        : "border-muted hover:border-primary/50"
                    }`}
                  >
                    <div className="text-center">
                      <Sparkles className="h-8 w-8 mx-auto mb-2 text-primary" />
                      <div className="font-medium">AI Agent</div>
                      <div className="text-sm text-muted-foreground">
                        Intelligent assistant
                      </div>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleInputChange("type", "workflow")}
                    className={`p-4 border-2 rounded-lg transition-colors ${
                      formData.type === "workflow"
                        ? "border-primary bg-primary/5"
                        : "border-muted hover:border-primary/50"
                    }`}
                  >
                    <div className="text-center">
                      <Upload className="h-8 w-8 mx-auto mb-2 text-primary" />
                      <div className="font-medium">Workflow</div>
                      <div className="text-sm text-muted-foreground">
                        Automation process
                      </div>
                    </div>
                  </button>
                </div>
              </CardContent>
            </Card>

            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
                <CardDescription>
                  Provide details about your {formData.type === "agent" ? "agent" : "workflow"}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="name">
                    Name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="name"
                    placeholder="e.g., Legal Document Analyzer"
                    value={formData.name}
                    onChange={(e) => handleInputChange("name", e.target.value)}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="description">
                    Short Description <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="description"
                    placeholder="Brief one-line description"
                    value={formData.description}
                    onChange={(e) => handleInputChange("description", e.target.value)}
                    required
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    This appears in search results and listings
                  </p>
                </div>

                <div>
                  <Label htmlFor="long_description">Full Description</Label>
                  <textarea
                    id="long_description"
                    className="flex min-h-[150px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    placeholder="Detailed description with key capabilities, use cases, and what's included..."
                    value={formData.long_description}
                    onChange={(e) => handleInputChange("long_description", e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Supports **bold** markdown formatting
                  </p>
                </div>

                <div>
                  <Label htmlFor="category">
                    Category <span className="text-destructive">*</span>
                  </Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => handleInputChange("category", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Legal">Legal</SelectItem>
                      <SelectItem value="Healthcare">Healthcare</SelectItem>
                      <SelectItem value="Real Estate">Real Estate</SelectItem>
                      <SelectItem value="Marketing">Marketing</SelectItem>
                      <SelectItem value="Sales">Sales</SelectItem>
                      <SelectItem value="Finance">Finance</SelectItem>
                      <SelectItem value="HR">HR</SelectItem>
                      <SelectItem value="Customer Support">Customer Support</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="tags">Tags</Label>
                  <Input
                    id="tags"
                    placeholder="e.g., legal, document-analysis, contracts"
                    value={formData.tags}
                    onChange={(e) => handleInputChange("tags", e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Comma-separated tags for better discoverability
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Features */}
            <Card>
              <CardHeader>
                <CardTitle>Key Features</CardTitle>
                <CardDescription>
                  List the main features and capabilities
                </CardDescription>
              </CardHeader>
              <CardContent>
                <textarea
                  id="features"
                  className="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  placeholder="One feature per line&#10;Clause extraction and categorization&#10;Risk assessment scoring&#10;Automated redlining"
                  value={formData.features}
                  onChange={(e) => handleInputChange("features", e.target.value)}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Enter one feature per line
                </p>
              </CardContent>
            </Card>

            {/* Pricing */}
            <Card>
              <CardHeader>
                <CardTitle>Pricing</CardTitle>
                <CardDescription>
                  Set your pricing model (you earn 70% commission)
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Pricing Type</Label>
                  <Select
                    value={formData.pricing_type}
                    onValueChange={(value) => handleInputChange("pricing_type", value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="one_time">One-time Purchase</SelectItem>
                      <SelectItem value="subscription">Subscription</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {formData.pricing_type === "subscription" && (
                  <div>
                    <Label>Billing Interval</Label>
                    <Select
                      value={formData.subscription_interval}
                      onValueChange={(value) => handleInputChange("subscription_interval", value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="monthly">Monthly</SelectItem>
                        <SelectItem value="yearly">Yearly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div>
                  <Label htmlFor="price">
                    Price (USD) <span className="text-destructive">*</span>
                  </Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="price"
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="99.00"
                      className="pl-9"
                      value={formData.price}
                      onChange={(e) => handleInputChange("price", e.target.value)}
                      required
                    />
                  </div>
                  {formData.price && (
                    <div className="mt-2 p-3 bg-muted/50 rounded-lg text-sm">
                      <div className="flex justify-between mb-1">
                        <span className="text-muted-foreground">Your earnings (70%):</span>
                        <span className="font-medium text-green-600">
                          ${(parseFloat(formData.price) * 0.7).toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Platform fee (30%):</span>
                        <span className="font-medium">
                          ${(parseFloat(formData.price) * 0.3).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Configuration Upload */}
            <Card>
              <CardHeader>
                <CardTitle>Configuration</CardTitle>
                <CardDescription>
                  Upload your {formData.type === "agent" ? "agent" : "workflow"} configuration file
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <input
                  ref={configInputRef}
                  type="file"
                  accept=".json,.zip"
                  onChange={handleConfigUpload}
                  className="hidden"
                />
                {configFile ? (
                  <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/50">
                    <div className="flex items-center gap-3">
                      <FileJson className="h-8 w-8 text-primary" />
                      <div>
                        <p className="font-medium">{configFile.name}</p>
                        <p className="text-xs text-muted-foreground">Configuration file uploaded</p>
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={removeConfigFile}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div
                    className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
                    onClick={() => configInputRef.current?.click()}
                  >
                    {isUploadingConfig ? (
                      <>
                        <Loader2 className="h-12 w-12 text-muted-foreground mx-auto mb-4 animate-spin" />
                        <p className="text-sm text-muted-foreground">Uploading...</p>
                      </>
                    ) : (
                      <>
                        <Upload className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <p className="text-sm text-muted-foreground mb-2">
                          Click to upload your configuration file
                        </p>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            configInputRef.current?.click();
                          }}
                        >
                          Choose File
                        </Button>
                        <p className="text-xs text-muted-foreground mt-2">
                          Accepts JSON or ZIP files (max 10MB)
                        </p>
                      </>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Preview Image Upload */}
            <Card>
              <CardHeader>
                <CardTitle>Preview Image</CardTitle>
                <CardDescription>
                  Upload a preview image for your listing (optional)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <input
                  ref={imageInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
                {imageFile ? (
                  <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/50">
                    <div className="flex items-center gap-3">
                      <img
                        src={imageFile.url}
                        alt="Preview"
                        className="h-16 w-16 object-cover rounded"
                      />
                      <div>
                        <p className="font-medium">{imageFile.name}</p>
                        <p className="text-xs text-muted-foreground">Preview image uploaded</p>
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={removeImageFile}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div
                    className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
                    onClick={() => imageInputRef.current?.click()}
                  >
                    {isUploadingImage ? (
                      <>
                        <Loader2 className="h-12 w-12 text-muted-foreground mx-auto mb-4 animate-spin" />
                        <p className="text-sm text-muted-foreground">Uploading...</p>
                      </>
                    ) : (
                      <>
                        <ImageIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <p className="text-sm text-muted-foreground mb-2">
                          Click to upload a preview image
                        </p>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            imageInputRef.current?.click();
                          }}
                        >
                          Choose Image
                        </Button>
                        <p className="text-xs text-muted-foreground mt-2">
                          PNG, JPG, or GIF (max 5MB)
                        </p>
                      </>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Submit */}
            <div className="flex gap-4">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => router.push("/marketplace/sell")}
              >
                Cancel
              </Button>
              <Button type="submit" className="flex-1" disabled={isSubmitting}>
                {isSubmitting ? "Submitting..." : "Submit for Review"}
              </Button>
            </div>

            <div className="p-4 bg-muted/50 rounded-lg text-sm text-muted-foreground">
              <strong>Review Process:</strong> Your listing will be reviewed by our team within 24 hours.
              You'll receive an email once it's approved or if any changes are needed.
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
