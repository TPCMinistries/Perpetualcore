"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  Bot,
  MessageSquare,
  Shield,
  Eye,
  Save,
  Loader2,
  Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import type { AgentIdentity, AgentIdentityUpdate, CommunicationStyle } from "@/lib/agent-workspace/types";
import { buildAgentPersonaPrompt } from "@/lib/agent-workspace/context-builder";

interface IdentityFormProps {
  identity: AgentIdentity | null;
  onSave: (update: AgentIdentityUpdate) => Promise<void>;
  onDelete: () => Promise<void>;
  saving: boolean;
}

const TONE_OPTIONS = [
  { value: "professional", label: "Professional" },
  { value: "casual", label: "Casual" },
  { value: "formal", label: "Formal" },
  { value: "friendly", label: "Friendly" },
  { value: "witty", label: "Witty" },
  { value: "concise", label: "Concise" },
];

const VERBOSITY_OPTIONS = [
  { value: "brief", label: "Brief" },
  { value: "moderate", label: "Moderate" },
  { value: "detailed", label: "Detailed" },
];

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.1,
      duration: 0.4,
      ease: "easeOut",
    },
  }),
};

export function IdentityForm({ identity, onSave, onDelete, saving }: IdentityFormProps) {
  const [name, setName] = useState(identity?.name || "Atlas");
  const [persona, setPersona] = useState(identity?.persona || "A helpful AI assistant");
  const [tone, setTone] = useState<CommunicationStyle["tone"]>(
    identity?.communicationStyle?.tone || "professional"
  );
  const [verbosity, setVerbosity] = useState<CommunicationStyle["verbosity"]>(
    identity?.communicationStyle?.verbosity || "moderate"
  );
  const [useEmoji, setUseEmoji] = useState(identity?.communicationStyle?.useEmoji || false);
  const [personality, setPersonality] = useState(
    identity?.communicationStyle?.personality || "Helpful, knowledgeable, and proactive"
  );
  const [greeting, setGreeting] = useState(
    identity?.greeting || "Hello! How can I help you today?"
  );
  const [signoff, setSignoff] = useState(identity?.signoff || "");
  const [boundariesText, setBoundariesText] = useState(
    identity?.boundaries?.join("\n") || ""
  );
  const [systemPromptOverride, setSystemPromptOverride] = useState(
    identity?.systemPromptOverride || ""
  );
  const [isActive, setIsActive] = useState(identity?.isActive ?? true);
  const [showPreview, setShowPreview] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Build preview of the persona prompt
  const previewPrompt = useMemo(() => {
    const mockIdentity: AgentIdentity = {
      id: "",
      userId: "",
      name,
      persona,
      communicationStyle: {
        tone,
        verbosity,
        useEmoji,
        language: "en",
        personality,
      },
      boundaries: boundariesText
        .split("\n")
        .map((b) => b.trim())
        .filter(Boolean),
      greeting,
      signoff,
      systemPromptOverride: systemPromptOverride || undefined,
      isActive,
      createdAt: "",
      updatedAt: "",
    };
    return buildAgentPersonaPrompt(mockIdentity);
  }, [name, persona, tone, verbosity, useEmoji, personality, greeting, signoff, boundariesText, systemPromptOverride, isActive]);

  function handleSave() {
    const update: AgentIdentityUpdate = {
      name,
      persona,
      communicationStyle: {
        tone,
        verbosity,
        useEmoji,
        language: "en",
        personality,
      },
      boundaries: boundariesText
        .split("\n")
        .map((b) => b.trim())
        .filter(Boolean),
      greeting,
      signoff,
      systemPromptOverride: systemPromptOverride || undefined,
      isActive,
    };
    onSave(update);
  }

  function handleDelete() {
    setShowDeleteConfirm(false);
    onDelete();
  }

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {/* Left Column - Main Form */}
      <motion.div
        custom={0}
        initial="hidden"
        animate="visible"
        variants={cardVariants}
        className="lg:col-span-2 space-y-6"
      >
        {/* Identity */}
        <Card>
          <CardHeader className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
            <div className="flex items-center gap-2">
              <Bot className="h-5 w-5 text-indigo-500" />
              <CardTitle className="text-base">Identity</CardTitle>
            </div>
            <CardDescription>
              Define your AI agent&apos;s name and persona
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="agent-name" className="text-slate-700 dark:text-slate-300">
                  Agent Name <span className="text-rose-500">*</span>
                </Label>
                <Input
                  id="agent-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Atlas"
                  className="h-11 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  e.g., Atlas, Jarvis, Friday, Nova
                </p>
              </div>

              <div className="space-y-2">
                <Label className="text-slate-700 dark:text-slate-300">
                  Status
                </Label>
                <div className="flex items-center gap-3 h-11">
                  <Switch
                    checked={isActive}
                    onCheckedChange={setIsActive}
                  />
                  <span className="text-sm text-slate-600 dark:text-slate-400">
                    {isActive ? "Active - persona applied to all chats" : "Inactive - using default AI"}
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="persona" className="text-slate-700 dark:text-slate-300">
                Persona Description
              </Label>
              <Textarea
                id="persona"
                value={persona}
                onChange={(e) => setPersona(e.target.value)}
                placeholder="A helpful AI assistant that specializes in productivity and business strategy"
                rows={3}
                className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 resize-none"
              />
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Describe what your agent is and what it specializes in
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Communication Style */}
        <Card>
          <CardHeader className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-blue-500" />
              <CardTitle className="text-base">Communication Style</CardTitle>
            </div>
            <CardDescription>
              How your agent communicates and expresses itself
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label className="text-slate-700 dark:text-slate-300">Tone</Label>
                <Select value={tone} onValueChange={(v) => setTone(v as CommunicationStyle["tone"])}>
                  <SelectTrigger className="h-11 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TONE_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-slate-700 dark:text-slate-300">Verbosity</Label>
                <Select value={verbosity} onValueChange={(v) => setVerbosity(v as CommunicationStyle["verbosity"])}>
                  <SelectTrigger className="h-11 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {VERBOSITY_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="personality" className="text-slate-700 dark:text-slate-300">
                Personality
              </Label>
              <Textarea
                id="personality"
                value={personality}
                onChange={(e) => setPersonality(e.target.value)}
                placeholder="Helpful, knowledgeable, and proactive"
                rows={2}
                className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 resize-none"
              />
            </div>

            <div className="flex items-center gap-3">
              <Switch checked={useEmoji} onCheckedChange={setUseEmoji} />
              <Label className="text-slate-700 dark:text-slate-300 cursor-pointer">
                Allow emoji in responses
              </Label>
            </div>

            <Separator />

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="greeting" className="text-slate-700 dark:text-slate-300">
                  Greeting
                </Label>
                <Input
                  id="greeting"
                  value={greeting}
                  onChange={(e) => setGreeting(e.target.value)}
                  placeholder="Hello! How can I help you today?"
                  className="h-11 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="signoff" className="text-slate-700 dark:text-slate-300">
                  Sign-off
                </Label>
                <Input
                  id="signoff"
                  value={signoff}
                  onChange={(e) => setSignoff(e.target.value)}
                  placeholder="(Optional) e.g., Stay sharp!"
                  className="h-11 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Boundaries */}
        <Card>
          <CardHeader className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-amber-500" />
              <CardTitle className="text-base">Boundaries</CardTitle>
            </div>
            <CardDescription>
              Define what your agent should never do (one per line)
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            <div className="space-y-2">
              <Textarea
                value={boundariesText}
                onChange={(e) => setBoundariesText(e.target.value)}
                placeholder={"Share personal information\nMake financial decisions on my behalf\nUse offensive language"}
                rows={4}
                className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 resize-none font-mono text-sm"
              />
              <p className="text-xs text-slate-500 dark:text-slate-400">
                One boundary per line. These will be included as strict instructions.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="system-override" className="text-slate-700 dark:text-slate-300">
                Custom System Prompt (Advanced)
              </Label>
              <Textarea
                id="system-override"
                value={systemPromptOverride}
                onChange={(e) => setSystemPromptOverride(e.target.value)}
                placeholder="Additional instructions appended to the system prompt..."
                rows={3}
                className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 resize-none font-mono text-sm"
              />
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Advanced: raw text added to the system prompt. Use with caution.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Save / Delete */}
        <div className="flex items-center justify-between">
          <div>
            {identity && (
              <>
                {showDeleteConfirm ? (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-slate-500 dark:text-slate-400">
                      Are you sure?
                    </span>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={handleDelete}
                    >
                      Yes, delete
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowDeleteConfirm(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                ) : (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowDeleteConfirm(true)}
                    className="text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Remove Agent Persona
                  </Button>
                )}
              </>
            )}
          </div>

          <Button
            onClick={handleSave}
            disabled={saving || !name.trim()}
            className="bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white shadow-lg shadow-indigo-500/25"
          >
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Agent Identity
              </>
            )}
          </Button>
        </div>
      </motion.div>

      {/* Right Column - Preview */}
      <motion.div
        custom={1}
        initial="hidden"
        animate="visible"
        variants={cardVariants}
        className="space-y-6"
      >
        <Card>
          <CardHeader className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Eye className="h-5 w-5 text-emerald-500" />
                <CardTitle className="text-base">Prompt Preview</CardTitle>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowPreview(!showPreview)}
              >
                {showPreview ? "Hide" : "Show"}
              </Button>
            </div>
            <CardDescription>
              How the persona translates to a system prompt
            </CardDescription>
          </CardHeader>
          {showPreview && (
            <CardContent className="pt-4">
              <pre className="text-xs text-slate-600 dark:text-slate-400 whitespace-pre-wrap font-mono bg-slate-50 dark:bg-slate-900 rounded-lg p-4 max-h-[600px] overflow-y-auto border border-slate-200 dark:border-slate-700">
                {previewPrompt}
              </pre>
            </CardContent>
          )}
        </Card>

        {/* Quick Info */}
        <Card>
          <CardHeader className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
            <CardTitle className="text-base">How It Works</CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="space-y-3 text-sm text-slate-600 dark:text-slate-400">
              <p>
                Your agent persona is prepended to every chat interaction, shaping how the AI responds.
              </p>
              <ul className="space-y-2 list-disc list-inside">
                <li>
                  <strong className="text-slate-900 dark:text-white">Name:</strong> How the AI refers to itself
                </li>
                <li>
                  <strong className="text-slate-900 dark:text-white">Tone:</strong> Controls formality and style
                </li>
                <li>
                  <strong className="text-slate-900 dark:text-white">Verbosity:</strong> How detailed responses are
                </li>
                <li>
                  <strong className="text-slate-900 dark:text-white">Boundaries:</strong> Strict rules the AI follows
                </li>
              </ul>
              <p className="text-xs text-slate-500 dark:text-slate-500">
                Changes take effect on your next conversation. Cached for 5 minutes.
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
