"use client";

import { useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Plus,
  Trash2,
  Play,
  Loader2,
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  Code,
  Globe,
} from "lucide-react";
import { toast } from "sonner";
import type {
  CreateCustomSkillInput,
  CustomToolDefinition,
  HttpToolConfig,
  CustomSkillAuthType,
  ToolParameterSchema,
} from "@/lib/skills/custom/types";

const CATEGORIES = [
  { value: "communication", label: "Communication" },
  { value: "productivity", label: "Productivity" },
  { value: "development", label: "Development" },
  { value: "media", label: "Media" },
  { value: "analytics", label: "Analytics" },
  { value: "automation", label: "Automation" },
  { value: "integration", label: "Integration" },
  { value: "utility", label: "Utility" },
];

const AUTH_TYPES: { value: CustomSkillAuthType; label: string; desc: string }[] = [
  { value: "none", label: "None", desc: "No authentication required" },
  { value: "bearer", label: "Bearer Token", desc: "Authorization: Bearer <token>" },
  { value: "api_key", label: "API Key Header", desc: "Custom header with API key" },
  { value: "basic", label: "Basic Auth", desc: "HTTP Basic authentication" },
  { value: "custom_header", label: "Custom Header", desc: "Custom header name + value" },
];

const HTTP_METHODS = ["GET", "POST", "PUT", "PATCH", "DELETE"] as const;

interface SkillBuilderFormProps {
  initialData?: Partial<CreateCustomSkillInput> & { id?: string };
  onSubmit: (data: CreateCustomSkillInput) => Promise<void>;
  onTest?: (skillId: string, toolIndex: number, params: Record<string, any>, credentialValue?: string) => Promise<any>;
  submitLabel: string;
  isSubmitting: boolean;
}

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 50);
}

function emptyTool(): CustomToolDefinition {
  return {
    name: "",
    description: "",
    parameters: { type: "object", properties: {}, required: [] },
    http: {
      method: "GET",
      url_template: "https://",
      headers: {},
    },
  };
}

function emptyParam(): ToolParameterSchema {
  return { type: "string", description: "" };
}

export default function SkillBuilderForm({
  initialData,
  onSubmit,
  onTest,
  submitLabel,
  isSubmitting,
}: SkillBuilderFormProps) {
  const [name, setName] = useState(initialData?.name || "");
  const [slug, setSlug] = useState(initialData?.slug || "");
  const [description, setDescription] = useState(initialData?.description || "");
  const [category, setCategory] = useState(initialData?.category || "utility");
  const [tags, setTags] = useState<string[]>(initialData?.tags || []);
  const [tagInput, setTagInput] = useState("");
  const [visibility, setVisibility] = useState<"private" | "organization" | "public">(
    initialData?.visibility || "private"
  );
  const [systemPrompt, setSystemPrompt] = useState(initialData?.system_prompt || "");
  const [authType, setAuthType] = useState<CustomSkillAuthType>(initialData?.auth_type || "none");
  const [authHeaderName, setAuthHeaderName] = useState(
    initialData?.auth_config?.header_name || ""
  );
  const [authPrefix, setAuthPrefix] = useState(
    initialData?.auth_config?.prefix || "Bearer"
  );
  const [allowedDomains, setAllowedDomains] = useState(
    (initialData?.allowed_domains || []).join(", ")
  );
  const [tools, setTools] = useState<CustomToolDefinition[]>(
    initialData?.tools?.length ? initialData.tools : [emptyTool()]
  );
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);
  const [testingTool, setTestingTool] = useState<number | null>(null);
  const [testResults, setTestResults] = useState<Record<number, any>>({});
  const [testCredential, setTestCredential] = useState("");

  // Auto-generate slug from name
  const handleNameChange = useCallback(
    (val: string) => {
      setName(val);
      if (!slugManuallyEdited) {
        setSlug(generateSlug(val));
      }
    },
    [slugManuallyEdited]
  );

  // Tool management
  const addTool = () => {
    if (tools.length >= 10) {
      toast.error("Maximum 10 tools per skill");
      return;
    }
    setTools([...tools, emptyTool()]);
  };

  const removeTool = (index: number) => {
    if (tools.length <= 1) {
      toast.error("At least one tool is required");
      return;
    }
    setTools(tools.filter((_, i) => i !== index));
  };

  const updateTool = (index: number, updates: Partial<CustomToolDefinition>) => {
    setTools(tools.map((t, i) => (i === index ? { ...t, ...updates } : t)));
  };

  const updateToolHttp = (index: number, updates: Partial<HttpToolConfig>) => {
    setTools(
      tools.map((t, i) =>
        i === index ? { ...t, http: { ...t.http, ...updates } } : t
      )
    );
  };

  // Parameter management
  const addParam = (toolIndex: number) => {
    const tool = tools[toolIndex];
    const paramName = `param_${Object.keys(tool.parameters.properties).length + 1}`;
    updateTool(toolIndex, {
      parameters: {
        ...tool.parameters,
        properties: { ...tool.parameters.properties, [paramName]: emptyParam() },
      },
    });
  };

  const removeParam = (toolIndex: number, paramName: string) => {
    const tool = tools[toolIndex];
    const { [paramName]: _, ...rest } = tool.parameters.properties;
    updateTool(toolIndex, {
      parameters: {
        ...tool.parameters,
        properties: rest,
        required: (tool.parameters.required || []).filter((r) => r !== paramName),
      },
    });
  };

  const renameParam = (toolIndex: number, oldName: string, newName: string) => {
    if (!newName || oldName === newName) return;
    const tool = tools[toolIndex];
    const entries = Object.entries(tool.parameters.properties).map(([k, v]) =>
      k === oldName ? [newName, v] : [k, v]
    );
    updateTool(toolIndex, {
      parameters: {
        ...tool.parameters,
        properties: Object.fromEntries(entries),
        required: (tool.parameters.required || []).map((r) =>
          r === oldName ? newName : r
        ),
      },
    });
  };

  const updateParam = (
    toolIndex: number,
    paramName: string,
    updates: Partial<ToolParameterSchema>
  ) => {
    const tool = tools[toolIndex];
    updateTool(toolIndex, {
      parameters: {
        ...tool.parameters,
        properties: {
          ...tool.parameters.properties,
          [paramName]: { ...tool.parameters.properties[paramName], ...updates },
        },
      },
    });
  };

  const toggleRequired = (toolIndex: number, paramName: string) => {
    const tool = tools[toolIndex];
    const required = tool.parameters.required || [];
    updateTool(toolIndex, {
      parameters: {
        ...tool.parameters,
        required: required.includes(paramName)
          ? required.filter((r) => r !== paramName)
          : [...required, paramName],
      },
    });
  };

  // Tag management
  const addTag = () => {
    const t = tagInput.trim().toLowerCase();
    if (t && !tags.includes(t) && tags.length < 10) {
      setTags([...tags, t]);
      setTagInput("");
    }
  };

  // Test a tool
  const handleTestTool = async (toolIndex: number) => {
    if (!onTest || !initialData?.id) {
      toast.error("Save the skill first to test tools");
      return;
    }
    setTestingTool(toolIndex);
    try {
      const result = await onTest(initialData.id, toolIndex, {}, testCredential || undefined);
      setTestResults({ ...testResults, [toolIndex]: result });
      if (result.success) {
        toast.success("Tool executed successfully");
      } else {
        toast.error(result.error || "Test failed");
      }
    } catch (err: any) {
      toast.error(err.message || "Test failed");
    } finally {
      setTestingTool(null);
    }
  };

  // Submit
  const handleSubmit = async () => {
    const data: CreateCustomSkillInput = {
      name: name.trim(),
      slug: slug.trim(),
      description: description.trim(),
      category: category as any,
      tags,
      visibility,
      system_prompt: systemPrompt.trim() || undefined,
      tools,
      auth_type: authType,
      auth_config:
        authType === "none"
          ? undefined
          : {
              header_name: authHeaderName || undefined,
              prefix: authType === "bearer" ? authPrefix : undefined,
            },
      allowed_domains: allowedDomains
        .split(",")
        .map((d) => d.trim())
        .filter(Boolean),
    };

    await onSubmit(data);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Basics */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Skill Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="My API Skill"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="slug">Slug</Label>
              <Input
                id="slug"
                value={slug}
                onChange={(e) => {
                  setSlug(e.target.value);
                  setSlugManuallyEdited(true);
                }}
                placeholder="my-api-skill"
                className="font-mono text-sm"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What does this skill do? This helps the AI understand when to use it."
              rows={2}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Category</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c.value} value={c.value}>
                      {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Visibility</Label>
              <Select value={visibility} onValueChange={(v: any) => setVisibility(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="private">Private (only you)</SelectItem>
                  <SelectItem value="organization">Organization</SelectItem>
                  <SelectItem value="public">Public (marketplace)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Tags</Label>
            <div className="flex gap-2 flex-wrap mb-2">
              {tags.map((tag) => (
                <Badge
                  key={tag}
                  variant="secondary"
                  className="cursor-pointer"
                  onClick={() => setTags(tags.filter((t) => t !== tag))}
                >
                  {tag} &times;
                </Badge>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTag())}
                placeholder="Add tag..."
                className="max-w-[200px]"
              />
              <Button type="button" variant="outline" size="sm" onClick={addTag}>
                Add
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Authentication */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Authentication</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Auth Type</Label>
            <Select value={authType} onValueChange={(v: any) => setAuthType(v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {AUTH_TYPES.map((a) => (
                  <SelectItem key={a.value} value={a.value}>
                    <span className="font-medium">{a.label}</span>
                    <span className="text-muted-foreground ml-2 text-xs">{a.desc}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {authType !== "none" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {(authType === "api_key" || authType === "custom_header") && (
                <div className="space-y-2">
                  <Label>Header Name</Label>
                  <Input
                    value={authHeaderName}
                    onChange={(e) => setAuthHeaderName(e.target.value)}
                    placeholder={authType === "api_key" ? "X-API-Key" : "X-Custom-Header"}
                  />
                </div>
              )}
              {authType === "bearer" && (
                <div className="space-y-2">
                  <Label>Token Prefix</Label>
                  <Input
                    value={authPrefix}
                    onChange={(e) => setAuthPrefix(e.target.value)}
                    placeholder="Bearer"
                  />
                </div>
              )}
              <div className="space-y-2">
                <Label>Allowed Domains (comma-separated)</Label>
                <Input
                  value={allowedDomains}
                  onChange={(e) => setAllowedDomains(e.target.value)}
                  placeholder="api.example.com, example.com"
                />
                <p className="text-xs text-muted-foreground">
                  Restrict HTTP calls to these domains only
                </p>
              </div>
            </div>
          )}

          {authType !== "none" && onTest && initialData?.id && (
            <div className="space-y-2">
              <Label>Test Credential</Label>
              <Input
                type="password"
                value={testCredential}
                onChange={(e) => setTestCredential(e.target.value)}
                placeholder="Paste API key/token for testing..."
              />
              <p className="text-xs text-muted-foreground">
                Used only for testing. Save your real credential in the Skills settings page.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* System Prompt */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">System Prompt (Optional)</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            value={systemPrompt}
            onChange={(e) => setSystemPrompt(e.target.value)}
            placeholder="Instructions for the AI when using this skill. E.g. 'Always format responses as bullet points...'"
            rows={4}
          />
          <p className="text-xs text-muted-foreground mt-1">
            {systemPrompt.length}/5000 characters
          </p>
        </CardContent>
      </Card>

      {/* Tools */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">Tools ({tools.length}/10)</CardTitle>
          <Button type="button" variant="outline" size="sm" onClick={addTool}>
            <Plus className="h-4 w-4 mr-1" /> Add Tool
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          <Accordion type="multiple" defaultValue={["tool-0"]} className="space-y-3">
            {tools.map((tool, toolIdx) => (
              <AccordionItem
                key={toolIdx}
                value={`tool-${toolIdx}`}
                className="border rounded-lg px-4"
              >
                <AccordionTrigger className="hover:no-underline py-3">
                  <div className="flex items-center gap-2 text-left">
                    <Code className="h-4 w-4 text-muted-foreground" />
                    <span className="font-mono text-sm">
                      {tool.name || `tool_${toolIdx + 1}`}
                    </span>
                    {tool.http.method && (
                      <Badge variant="outline" className="text-xs">
                        {tool.http.method}
                      </Badge>
                    )}
                  </div>
                </AccordionTrigger>
                <AccordionContent className="space-y-4 pb-4">
                  {/* Tool basics */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Tool Name</Label>
                      <Input
                        value={tool.name}
                        onChange={(e) =>
                          updateTool(toolIdx, { name: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, "_") })
                        }
                        placeholder="get_users"
                        className="font-mono text-sm"
                      />
                      <p className="text-xs text-muted-foreground">
                        Lowercase, underscores only
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label>Description</Label>
                      <Input
                        value={tool.description}
                        onChange={(e) => updateTool(toolIdx, { description: e.target.value })}
                        placeholder="Fetches a list of users from the API"
                      />
                    </div>
                  </div>

                  {/* HTTP Config */}
                  <div className="space-y-3 p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <Globe className="h-4 w-4" /> HTTP Request
                    </div>
                    <div className="grid grid-cols-[120px_1fr] gap-2">
                      <Select
                        value={tool.http.method}
                        onValueChange={(v: any) => updateToolHttp(toolIdx, { method: v })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {HTTP_METHODS.map((m) => (
                            <SelectItem key={m} value={m}>
                              {m}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Input
                        value={tool.http.url_template}
                        onChange={(e) =>
                          updateToolHttp(toolIdx, { url_template: e.target.value })
                        }
                        placeholder="https://api.example.com/users/{{user_id}}"
                        className="font-mono text-sm"
                      />
                    </div>

                    {tool.http.method !== "GET" && (
                      <div className="space-y-2">
                        <Label className="text-xs">Body Template (JSON)</Label>
                        <Textarea
                          value={
                            tool.http.body_template
                              ? typeof tool.http.body_template === "string"
                                ? tool.http.body_template
                                : JSON.stringify(tool.http.body_template, null, 2)
                              : ""
                          }
                          onChange={(e) => {
                            try {
                              updateToolHttp(toolIdx, {
                                body_template: JSON.parse(e.target.value),
                              });
                            } catch {
                              updateToolHttp(toolIdx, {
                                body_template: e.target.value,
                              });
                            }
                          }}
                          placeholder='{"name": "{{name}}", "email": "{{email}}"}'
                          rows={3}
                          className="font-mono text-xs"
                        />
                      </div>
                    )}

                    <div className="space-y-2">
                      <Label className="text-xs">Custom Headers (JSON)</Label>
                      <Input
                        value={
                          tool.http.headers
                            ? JSON.stringify(tool.http.headers)
                            : ""
                        }
                        onChange={(e) => {
                          try {
                            updateToolHttp(toolIdx, {
                              headers: JSON.parse(e.target.value),
                            });
                          } catch {
                            // keep raw input
                          }
                        }}
                        placeholder='{"X-Custom": "value"}'
                        className="font-mono text-xs"
                      />
                    </div>
                  </div>

                  {/* Parameters */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label>Parameters</Label>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => addParam(toolIdx)}
                      >
                        <Plus className="h-3 w-3 mr-1" /> Add
                      </Button>
                    </div>

                    {Object.entries(tool.parameters.properties).map(
                      ([paramName, param]) => (
                        <div
                          key={paramName}
                          className="grid grid-cols-[1fr_100px_1fr_auto_auto] gap-2 items-start"
                        >
                          <Input
                            defaultValue={paramName}
                            onBlur={(e) =>
                              renameParam(toolIdx, paramName, e.target.value.trim())
                            }
                            placeholder="param_name"
                            className="font-mono text-xs"
                          />
                          <Select
                            value={param.type}
                            onValueChange={(v: any) =>
                              updateParam(toolIdx, paramName, { type: v })
                            }
                          >
                            <SelectTrigger className="text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="string">string</SelectItem>
                              <SelectItem value="number">number</SelectItem>
                              <SelectItem value="boolean">boolean</SelectItem>
                              <SelectItem value="integer">integer</SelectItem>
                              <SelectItem value="array">array</SelectItem>
                            </SelectContent>
                          </Select>
                          <Input
                            value={param.description}
                            onChange={(e) =>
                              updateParam(toolIdx, paramName, {
                                description: e.target.value,
                              })
                            }
                            placeholder="Description"
                            className="text-xs"
                          />
                          <Button
                            type="button"
                            variant={
                              (tool.parameters.required || []).includes(paramName)
                                ? "default"
                                : "outline"
                            }
                            size="sm"
                            className="text-xs"
                            onClick={() => toggleRequired(toolIdx, paramName)}
                          >
                            Req
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeParam(toolIdx, paramName)}
                          >
                            <Trash2 className="h-3 w-3 text-destructive" />
                          </Button>
                        </div>
                      )
                    )}

                    {Object.keys(tool.parameters.properties).length === 0 && (
                      <p className="text-xs text-muted-foreground text-center py-2">
                        No parameters. Use {"{{param_name}}"} placeholders in URLs/body.
                      </p>
                    )}
                  </div>

                  {/* Tool actions */}
                  <div className="flex justify-between pt-2 border-t">
                    {onTest && initialData?.id ? (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleTestTool(toolIdx)}
                        disabled={testingTool === toolIdx}
                      >
                        {testingTool === toolIdx ? (
                          <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                        ) : (
                          <Play className="h-3 w-3 mr-1" />
                        )}
                        Test
                      </Button>
                    ) : (
                      <div />
                    )}
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeTool(toolIdx)}
                      className="text-destructive"
                    >
                      <Trash2 className="h-3 w-3 mr-1" /> Remove Tool
                    </Button>
                  </div>

                  {/* Test results */}
                  {testResults[toolIdx] && (
                    <div
                      className={`p-3 rounded text-xs font-mono overflow-auto max-h-48 ${
                        testResults[toolIdx].success
                          ? "bg-green-50 dark:bg-green-950/30 border border-green-200"
                          : "bg-red-50 dark:bg-red-950/30 border border-red-200"
                      }`}
                    >
                      <div className="flex items-center gap-1 mb-1">
                        {testResults[toolIdx].success ? (
                          <CheckCircle2 className="h-3 w-3 text-green-600" />
                        ) : (
                          <AlertCircle className="h-3 w-3 text-red-600" />
                        )}
                        <span className="font-semibold">
                          {testResults[toolIdx].success ? "Success" : "Failed"}
                        </span>
                      </div>
                      <pre className="whitespace-pre-wrap">
                        {JSON.stringify(
                          testResults[toolIdx].data || testResults[toolIdx].error,
                          null,
                          2
                        )}
                      </pre>
                    </div>
                  )}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </CardContent>
      </Card>

      {/* Submit */}
      <div className="flex justify-end gap-3">
        <Button
          onClick={handleSubmit}
          disabled={isSubmitting || !name.trim() || !slug.trim()}
          size="lg"
        >
          {isSubmitting ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <CheckCircle2 className="h-4 w-4 mr-2" />
          )}
          {submitLabel}
        </Button>
      </div>
    </div>
  );
}
