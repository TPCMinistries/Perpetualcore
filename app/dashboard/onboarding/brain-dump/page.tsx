"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Brain,
  Sparkles,
  Loader2,
  CheckCircle2,
  Building2,
  FolderKanban,
  CheckSquare,
  ChevronDown,
  ChevronRight,
  Rocket,
  AlertCircle,
  ArrowRight,
  RefreshCw,
  Pencil,
  Trash2,
  Check,
  X,
  Link2,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

interface ParsedTask {
  title: string;
  description?: string;
  priority: string;
  subtasks?: string[];
}

interface ParsedProject {
  name: string;
  description: string;
  emoji: string;
  priority: string;
  tasks: ParsedTask[];
}

interface ParsedEntity {
  name: string;
  type: string;
  description: string;
  brands?: { name: string; description: string }[];
  projects: ParsedProject[];
}

interface BrainDumpResult {
  entities: ParsedEntity[];
  summary: string;
  suggestions: string[];
}

type Step = "input" | "processing" | "preview" | "creating" | "complete";

interface ExistingEntity {
  id: string;
  name: string;
  description?: string;
  type?: string;
}

export default function BrainDumpPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("input");
  const [brainDump, setBrainDump] = useState("");
  const [result, setResult] = useState<BrainDumpResult | null>(null);
  const [stats, setStats] = useState<any>(null);
  const [userName, setUserName] = useState("");
  const [expandedEntities, setExpandedEntities] = useState<Set<string>>(new Set());
  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(new Set());
  const [creationResult, setCreationResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [existingEntities, setExistingEntities] = useState<ExistingEntity[]>([]);
  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");

  // Edit handlers
  const startEdit = (key: string, value: string) => {
    setEditingItem(key);
    setEditValue(value);
  };

  const cancelEdit = () => {
    setEditingItem(null);
    setEditValue("");
  };

  const saveEdit = (entityIdx: number, projectIdx?: number, taskIdx?: number, field: string = "name") => {
    if (!result) return;

    const newEntities = [...result.entities];

    if (taskIdx !== undefined && projectIdx !== undefined) {
      // Editing task
      if (field === "title") {
        newEntities[entityIdx].projects[projectIdx].tasks[taskIdx].title = editValue;
      }
    } else if (projectIdx !== undefined) {
      // Editing project
      if (field === "name") {
        newEntities[entityIdx].projects[projectIdx].name = editValue;
      }
    } else {
      // Editing entity
      if (field === "name") {
        newEntities[entityIdx].name = editValue;
      } else if (field === "description") {
        newEntities[entityIdx].description = editValue;
      }
    }

    setResult({ ...result, entities: newEntities });
    cancelEdit();
  };

  // Delete handlers
  const deleteEntity = (entityIdx: number) => {
    if (!result) return;
    const newEntities = result.entities.filter((_, i) => i !== entityIdx);
    setResult({ ...result, entities: newEntities });
    updateStats(newEntities);
  };

  const deleteProject = (entityIdx: number, projectIdx: number) => {
    if (!result) return;
    const newEntities = [...result.entities];
    newEntities[entityIdx].projects = newEntities[entityIdx].projects.filter((_, i) => i !== projectIdx);
    setResult({ ...result, entities: newEntities });
    updateStats(newEntities);
  };

  const deleteTask = (entityIdx: number, projectIdx: number, taskIdx: number) => {
    if (!result) return;
    const newEntities = [...result.entities];
    newEntities[entityIdx].projects[projectIdx].tasks =
      newEntities[entityIdx].projects[projectIdx].tasks.filter((_, i) => i !== taskIdx);
    setResult({ ...result, entities: newEntities });
    updateStats(newEntities);
  };

  const updateStats = (entities: ParsedEntity[]) => {
    setStats({
      entities: entities.length,
      projects: entities.reduce((sum, e) => sum + e.projects.length, 0),
      tasks: entities.reduce((sum, e) =>
        sum + e.projects.reduce((pSum, p) => pSum + p.tasks.length, 0), 0),
      subtasks: entities.reduce((sum, e) =>
        sum + e.projects.reduce((pSum, p) =>
          pSum + p.tasks.reduce((tSum, t) => tSum + (t.subtasks?.length || 0), 0), 0), 0),
    });
  };

  // Link to existing entity
  const linkToExisting = (entityIdx: number, existingId: string) => {
    if (!result) return;
    const newEntities = [...result.entities];
    const existing = existingEntities.find(e => e.id === existingId);
    if (existing) {
      // Mark this entity to be merged with existing
      (newEntities[entityIdx] as any).linkToExistingId = existingId;
      (newEntities[entityIdx] as any).isLinked = true;
    }
    setResult({ ...result, entities: newEntities });
  };

  const handleProcess = async () => {
    if (!brainDump.trim()) {
      toast.error("Please enter your brain dump first");
      return;
    }

    setStep("processing");
    setError(null);

    try {
      // Fetch existing entities in parallel with AI processing
      const [aiResponse, entitiesResponse] = await Promise.all([
        fetch("/api/onboarding/brain-dump", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ brainDump }),
        }),
        fetch("/api/entities"),
      ]);

      const data = await aiResponse.json();

      if (!aiResponse.ok) {
        throw new Error(data.error || "Failed to process");
      }

      // Get existing entities
      if (entitiesResponse.ok) {
        const entitiesData = await entitiesResponse.json();
        setExistingEntities(entitiesData.entities || []);
      }

      setResult(data.data);
      setStats(data.stats);
      setUserName(data.userName);

      // Expand first entity by default
      if (data.data.entities.length > 0) {
        setExpandedEntities(new Set([data.data.entities[0].name]));
      }

      setStep("preview");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setStep("input");
      toast.error("Failed to process brain dump");
    }
  };

  const handleCreate = async () => {
    if (!result) return;

    setStep("creating");

    try {
      const response = await fetch("/api/onboarding/brain-dump/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ entities: result.entities }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create");
      }

      setCreationResult(data.results);
      setStep("complete");
      toast.success("Everything created successfully!");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create structure");
      setStep("preview");
      toast.error("Failed to create. Please try again.");
    }
  };

  const toggleEntity = (name: string) => {
    const newSet = new Set(expandedEntities);
    if (newSet.has(name)) {
      newSet.delete(name);
    } else {
      newSet.add(name);
    }
    setExpandedEntities(newSet);
  };

  const toggleProject = (key: string) => {
    const newSet = new Set(expandedProjects);
    if (newSet.has(key)) {
      newSet.delete(key);
    } else {
      newSet.add(key);
    }
    setExpandedProjects(newSet);
  };

  const getTypeColor = (type: string) => {
    const colors: { [key: string]: string } = {
      business: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
      ministry: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
      nonprofit: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
      personal: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400",
      saas: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400",
      consulting: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
    };
    return colors[type] || colors.business;
  };

  const getPriorityColor = (priority: string) => {
    const colors: { [key: string]: string } = {
      urgent: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
      high: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
      medium: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
      low: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400",
    };
    return colors[priority] || colors.medium;
  };

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="flex justify-center">
          <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
            <Brain className="h-8 w-8 text-white" />
          </div>
        </div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
          AI Brain Dump
        </h1>
        <p className="text-muted-foreground max-w-lg mx-auto">
          Tell me everything on your plate. I'll organize it into entities, projects, and tasks.
        </p>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center justify-center gap-2">
        {["input", "processing", "preview", "creating", "complete"].map((s, i) => (
          <div key={s} className="flex items-center">
            <div
              className={`h-2 w-2 rounded-full transition-colors ${
                step === s
                  ? "bg-violet-600"
                  : ["input", "processing", "preview", "creating", "complete"].indexOf(step) > i
                  ? "bg-violet-400"
                  : "bg-slate-200 dark:bg-slate-700"
              }`}
            />
            {i < 4 && (
              <div
                className={`w-8 h-0.5 ${
                  ["input", "processing", "preview", "creating", "complete"].indexOf(step) > i
                    ? "bg-violet-400"
                    : "bg-slate-200 dark:bg-slate-700"
                }`}
              />
            )}
          </div>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {/* Step 1: Input */}
        {step === "input" && (
          <motion.div
            key="input"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <Card>
              <CardHeader>
                <CardTitle>What's on your mind?</CardTitle>
                <CardDescription>
                  List all your businesses, projects, ideas, responsibilities - everything.
                  Don't worry about organization, just dump it all.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Textarea
                  value={brainDump}
                  onChange={(e) => setBrainDump(e.target.value)}
                  placeholder="Example: I'm working on my consulting company, need to finish the proposal for ABC Corp, launch my podcast with my partner, plan our trip to Kenya in March, finish writing my book, manage my ministry's prayer line and discipleship program, build out my SaaS platform..."
                  className="min-h-[300px] w-full resize-y text-base leading-relaxed break-words"
                  style={{ wordBreak: "break-word", overflowWrap: "break-word" }}
                />
                {error && (
                  <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400 text-sm flex items-center gap-2">
                    <AlertCircle className="h-4 w-4" />
                    {error}
                  </div>
                )}
                <div className="flex justify-end">
                  <Button
                    onClick={handleProcess}
                    disabled={!brainDump.trim()}
                    className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700"
                  >
                    <Sparkles className="h-4 w-4 mr-2" />
                    Organize with AI
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Step 2: Processing */}
        {step === "processing" && (
          <motion.div
            key="processing"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="text-center py-12"
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              className="inline-block"
            >
              <Brain className="h-12 w-12 text-violet-600" />
            </motion.div>
            <h3 className="mt-4 text-lg font-semibold">Analyzing your brain dump...</h3>
            <p className="text-muted-foreground mt-2">
              Organizing into entities, projects, and tasks
            </p>
          </motion.div>
        )}

        {/* Step 3: Preview */}
        {step === "preview" && result && (
          <motion.div
            key="preview"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            {/* Stats Summary */}
            <Card className="border-violet-200 dark:border-violet-800 bg-violet-50/50 dark:bg-violet-950/20">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-lg">Here's what I found, {userName}</h3>
                    <p className="text-muted-foreground text-sm mt-1">{result.summary}</p>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => setStep("input")}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Start Over
                  </Button>
                </div>
                <div className="grid grid-cols-4 gap-4 mt-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-violet-600">{stats?.entities || 0}</div>
                    <div className="text-xs text-muted-foreground">Entities</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-violet-600">{stats?.projects || 0}</div>
                    <div className="text-xs text-muted-foreground">Projects</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-violet-600">{stats?.tasks || 0}</div>
                    <div className="text-xs text-muted-foreground">Tasks</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-violet-600">{stats?.subtasks || 0}</div>
                    <div className="text-xs text-muted-foreground">Subtasks</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Suggestions */}
            {result.suggestions && result.suggestions.length > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-amber-500" />
                    Suggestions
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {result.suggestions.map((suggestion, i) => (
                      <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                        <span className="text-amber-500 mt-0.5">•</span>
                        {suggestion}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {/* Entities Tree */}
            <div className="space-y-4">
              <h3 className="font-semibold flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Your Structure
              </h3>

              {result.entities.map((entity, entityIdx) => {
                const entityKey = `entity-${entityIdx}`;
                const matchingExisting = existingEntities.find(
                  e => e.name.toLowerCase() === entity.name.toLowerCase()
                );

                return (
                <Card key={entityKey} className={`overflow-hidden ${(entity as any).isLinked ? "border-green-500 bg-green-50/30 dark:bg-green-950/20" : ""}`}>
                  <div className="p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 flex-1">
                        <button onClick={() => toggleEntity(entity.name)} className="p-1">
                          {expandedEntities.has(entity.name) ? (
                            <ChevronDown className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <ChevronRight className="h-4 w-4 text-muted-foreground" />
                          )}
                        </button>
                        <Building2 className="h-5 w-5 text-violet-600" />
                        <div className="flex-1">
                          {editingItem === `${entityKey}-name` ? (
                            <div className="flex items-center gap-2">
                              <Input
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value)}
                                className="h-7 text-sm font-medium"
                                autoFocus
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") saveEdit(entityIdx, undefined, undefined, "name");
                                  if (e.key === "Escape") cancelEdit();
                                }}
                              />
                              <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => saveEdit(entityIdx, undefined, undefined, "name")}>
                                <Check className="h-3 w-3 text-green-600" />
                              </Button>
                              <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={cancelEdit}>
                                <X className="h-3 w-3 text-red-600" />
                              </Button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 group">
                              <h4 className="font-medium">{entity.name}</h4>
                              <button
                                onClick={(e) => { e.stopPropagation(); startEdit(`${entityKey}-name`, entity.name); }}
                                className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded"
                              >
                                <Pencil className="h-3 w-3 text-muted-foreground" />
                              </button>
                            </div>
                          )}
                          <p className="text-sm text-muted-foreground">{entity.description}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {matchingExisting && !(entity as any).isLinked && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-xs h-7 border-amber-500 text-amber-600 hover:bg-amber-50"
                            onClick={(e) => { e.stopPropagation(); linkToExisting(entityIdx, matchingExisting.id); }}
                          >
                            <Link2 className="h-3 w-3 mr-1" />
                            Link to existing
                          </Button>
                        )}
                        {(entity as any).isLinked && (
                          <Badge className="bg-green-100 text-green-700">Linked</Badge>
                        )}
                        <Badge className={getTypeColor(entity.type)}>{entity.type}</Badge>
                        <Badge variant="outline">{entity.projects.length} projects</Badge>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 w-7 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                          onClick={(e) => { e.stopPropagation(); deleteEntity(entityIdx); }}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>

                  <AnimatePresence>
                    {expandedEntities.has(entity.name) && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="border-t bg-slate-50/50 dark:bg-slate-900/50"
                      >
                        <div className="p-4 space-y-3">
                          {entity.projects.map((project, projectIdx) => {
                            const projectKey = `entity-${entityIdx}-project-${projectIdx}`;
                            return (
                              <div key={projectKey} className="border rounded-lg bg-white dark:bg-slate-800">
                                <div className="p-3 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2 flex-1">
                                      <button onClick={() => toggleProject(projectKey)} className="p-0.5">
                                        {expandedProjects.has(projectKey) ? (
                                          <ChevronDown className="h-3 w-3 text-muted-foreground" />
                                        ) : (
                                          <ChevronRight className="h-3 w-3 text-muted-foreground" />
                                        )}
                                      </button>
                                      <span className="text-lg">{project.emoji}</span>
                                      {editingItem === `${projectKey}-name` ? (
                                        <div className="flex items-center gap-2 flex-1">
                                          <Input
                                            value={editValue}
                                            onChange={(e) => setEditValue(e.target.value)}
                                            className="h-6 text-sm font-medium"
                                            autoFocus
                                            onKeyDown={(e) => {
                                              if (e.key === "Enter") saveEdit(entityIdx, projectIdx, undefined, "name");
                                              if (e.key === "Escape") cancelEdit();
                                            }}
                                          />
                                          <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={() => saveEdit(entityIdx, projectIdx, undefined, "name")}>
                                            <Check className="h-3 w-3 text-green-600" />
                                          </Button>
                                          <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={cancelEdit}>
                                            <X className="h-3 w-3 text-red-600" />
                                          </Button>
                                        </div>
                                      ) : (
                                        <div className="flex items-center gap-2 group">
                                          <span className="font-medium text-sm">{project.name}</span>
                                          <button
                                            onClick={(e) => { e.stopPropagation(); startEdit(`${projectKey}-name`, project.name); }}
                                            className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded"
                                          >
                                            <Pencil className="h-3 w-3 text-muted-foreground" />
                                          </button>
                                        </div>
                                      )}
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <Badge className={getPriorityColor(project.priority)} variant="outline">
                                        {project.priority}
                                      </Badge>
                                      <span className="text-xs text-muted-foreground">
                                        {project.tasks.length} tasks
                                      </span>
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        className="h-6 w-6 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                                        onClick={(e) => { e.stopPropagation(); deleteProject(entityIdx, projectIdx); }}
                                      >
                                        <Trash2 className="h-3 w-3" />
                                      </Button>
                                    </div>
                                  </div>
                                </div>

                                <AnimatePresence>
                                  {expandedProjects.has(projectKey) && (
                                    <motion.div
                                      initial={{ height: 0, opacity: 0 }}
                                      animate={{ height: "auto", opacity: 1 }}
                                      exit={{ height: 0, opacity: 0 }}
                                      className="border-t"
                                    >
                                      <div className="p-3 space-y-2">
                                        <p className="text-xs text-muted-foreground mb-2">
                                          {project.description}
                                        </p>
                                        {project.tasks.slice(0, 8).map((task, taskIdx) => {
                                          const taskKey = `entity-${entityIdx}-project-${projectIdx}-task-${taskIdx}`;
                                          return (
                                          <div
                                            key={taskKey}
                                            className="flex items-start gap-2 text-sm py-1 group"
                                          >
                                            <CheckSquare className="h-3.5 w-3.5 mt-0.5 text-muted-foreground" />
                                            <div className="flex-1 flex items-center gap-2">
                                              {editingItem === `${taskKey}-title` ? (
                                                <div className="flex items-center gap-2 flex-1">
                                                  <Input
                                                    value={editValue}
                                                    onChange={(e) => setEditValue(e.target.value)}
                                                    className="h-6 text-sm"
                                                    autoFocus
                                                    onKeyDown={(e) => {
                                                      if (e.key === "Enter") saveEdit(entityIdx, projectIdx, taskIdx, "title");
                                                      if (e.key === "Escape") cancelEdit();
                                                    }}
                                                  />
                                                  <Button size="sm" variant="ghost" className="h-5 w-5 p-0" onClick={() => saveEdit(entityIdx, projectIdx, taskIdx, "title")}>
                                                    <Check className="h-3 w-3 text-green-600" />
                                                  </Button>
                                                  <Button size="sm" variant="ghost" className="h-5 w-5 p-0" onClick={cancelEdit}>
                                                    <X className="h-3 w-3 text-red-600" />
                                                  </Button>
                                                </div>
                                              ) : (
                                                <>
                                                  <span>{task.title}</span>
                                                  {task.subtasks && task.subtasks.length > 0 && (
                                                    <span className="text-xs text-muted-foreground">
                                                      (+{task.subtasks.length} subtasks)
                                                    </span>
                                                  )}
                                                  <button
                                                    onClick={() => startEdit(`${taskKey}-title`, task.title)}
                                                    className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded"
                                                  >
                                                    <Pencil className="h-3 w-3 text-muted-foreground" />
                                                  </button>
                                                  <button
                                                    onClick={() => deleteTask(entityIdx, projectIdx, taskIdx)}
                                                    className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 hover:bg-red-100 dark:hover:bg-red-900/30 rounded"
                                                  >
                                                    <Trash2 className="h-3 w-3 text-red-500" />
                                                  </button>
                                                </>
                                              )}
                                            </div>
                                          </div>
                                        )})}
                                        {project.tasks.length > 8 && (
                                          <p className="text-xs text-muted-foreground pt-1">
                                            +{project.tasks.length - 8} more tasks
                                          </p>
                                        )}
                                      </div>
                                    </motion.div>
                                  )}
                                </AnimatePresence>
                              </div>
                            );
                          })}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </Card>
              );
              })}
            </div>

            {/* Action Button */}
            <div className="flex justify-center pt-4">
              <Button
                size="lg"
                onClick={handleCreate}
                className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700"
              >
                <Rocket className="h-5 w-5 mr-2" />
                Create Everything
              </Button>
            </div>
          </motion.div>
        )}

        {/* Step 4: Creating */}
        {step === "creating" && (
          <motion.div
            key="creating"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="text-center py-12"
          >
            <Loader2 className="h-12 w-12 text-violet-600 animate-spin mx-auto" />
            <h3 className="mt-4 text-lg font-semibold">Creating your structure...</h3>
            <p className="text-muted-foreground mt-2">
              Setting up entities, projects, and tasks
            </p>
          </motion.div>
        )}

        {/* Step 5: Complete */}
        {step === "complete" && creationResult && (
          <motion.div
            key="complete"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            <Card className="border-green-200 dark:border-green-800 bg-green-50/50 dark:bg-green-950/20">
              <CardContent className="p-8 text-center">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 200, damping: 15 }}
                >
                  <CheckCircle2 className="h-16 w-16 text-green-600 mx-auto" />
                </motion.div>
                <h2 className="text-2xl font-bold mt-4">You're All Set!</h2>
                <p className="text-muted-foreground mt-2">
                  Your brain dump has been organized into a clear structure.
                </p>

                <div className="grid grid-cols-4 gap-4 mt-6 max-w-lg mx-auto">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {creationResult.entitiesCreated}
                    </div>
                    <div className="text-xs text-muted-foreground">Entities</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {creationResult.brandsCreated}
                    </div>
                    <div className="text-xs text-muted-foreground">Brands</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {creationResult.projectsCreated}
                    </div>
                    <div className="text-xs text-muted-foreground">Projects</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {creationResult.tasksCreated}
                    </div>
                    <div className="text-xs text-muted-foreground">Tasks</div>
                  </div>
                </div>

                {creationResult.errors && creationResult.errors.length > 0 && (
                  <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg text-amber-700 dark:text-amber-400 text-sm">
                    {creationResult.errors.length} items had issues but most succeeded
                  </div>
                )}

                <div className="flex justify-center gap-4 mt-8">
                  <Button variant="outline" onClick={() => router.push("/dashboard/projects")}>
                    <FolderKanban className="h-4 w-4 mr-2" />
                    View Projects
                  </Button>
                  <Button
                    onClick={() => router.push("/dashboard/home")}
                    className="bg-gradient-to-r from-violet-600 to-purple-600"
                  >
                    Go to Dashboard
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
