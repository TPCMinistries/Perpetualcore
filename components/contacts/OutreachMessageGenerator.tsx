"use client";

import { useState } from "react";
import {
  Sparkles,
  Copy,
  Mail,
  Check,
  Loader2,
  RefreshCw,
  MessageCircle,
  FolderKanban,
  Calendar,
  UserPlus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  OutreachMessageType,
  OutreachTone,
  GeneratedMessage,
  GenerateMessageResponse,
  OUTREACH_MESSAGE_TYPE_CONFIG,
  OUTREACH_TONE_CONFIG,
} from "@/types/contacts";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface OutreachMessageGeneratorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contactId: string;
  contactName: string;
  contactEmail?: string;
}

const MESSAGE_TYPE_ICONS: Record<OutreachMessageType, React.ReactNode> = {
  check_in: <MessageCircle className="h-4 w-4" />,
  project_update: <FolderKanban className="h-4 w-4" />,
  opportunity: <Sparkles className="h-4 w-4" />,
  meeting_request: <Calendar className="h-4 w-4" />,
  introduction: <UserPlus className="h-4 w-4" />,
};

export function OutreachMessageGenerator({
  open,
  onOpenChange,
  contactId,
  contactName,
  contactEmail,
}: OutreachMessageGeneratorProps) {
  const [messageType, setMessageType] = useState<OutreachMessageType>("check_in");
  const [loading, setLoading] = useState(false);
  const [variations, setVariations] = useState<GeneratedMessage[]>([]);
  const [selectedTone, setSelectedTone] = useState<OutreachTone>("professional");
  const [editedSubject, setEditedSubject] = useState("");
  const [editedBody, setEditedBody] = useState("");
  const [copied, setCopied] = useState(false);
  const [context, setContext] = useState<GenerateMessageResponse["context"] | null>(null);

  const generateMessages = async () => {
    setLoading(true);
    setVariations([]);

    try {
      const response = await fetch(`/api/contacts/${contactId}/generate-message`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message_type: messageType }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate message");
      }

      const data: GenerateMessageResponse = await response.json();
      setVariations(data.variations);
      setContext(data.context);

      // Set the professional variation as default
      const professionalMsg = data.variations.find((v) => v.tone === "professional");
      if (professionalMsg) {
        setSelectedTone("professional");
        setEditedSubject(professionalMsg.subject);
        setEditedBody(professionalMsg.body);
      } else if (data.variations.length > 0) {
        setSelectedTone(data.variations[0].tone);
        setEditedSubject(data.variations[0].subject);
        setEditedBody(data.variations[0].body);
      }
    } catch (error) {
      console.error("Error generating message:", error);
      toast.error("Failed to generate message");
    } finally {
      setLoading(false);
    }
  };

  const handleToneChange = (tone: OutreachTone) => {
    setSelectedTone(tone);
    const variation = variations.find((v) => v.tone === tone);
    if (variation) {
      setEditedSubject(variation.subject);
      setEditedBody(variation.body);
    }
  };

  const handleCopy = async () => {
    const fullMessage = `Subject: ${editedSubject}\n\n${editedBody}`;
    await navigator.clipboard.writeText(fullMessage);
    setCopied(true);
    toast.success("Copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleEmail = () => {
    if (!contactEmail) {
      toast.error("No email address available for this contact");
      return;
    }

    const mailtoUrl = `mailto:${contactEmail}?subject=${encodeURIComponent(editedSubject)}&body=${encodeURIComponent(editedBody)}`;
    window.open(mailtoUrl, "_blank");
  };

  const handleTypeChange = (type: string) => {
    setMessageType(type as OutreachMessageType);
    setVariations([]);
    setEditedSubject("");
    setEditedBody("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-500" />
            Reach Out to {contactName}
          </DialogTitle>
          <DialogDescription>
            Generate a personalized message using AI, then copy or email it directly
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Message Type Selection */}
          <div>
            <Label className="text-sm font-medium mb-2 block">Message Type</Label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {(Object.keys(OUTREACH_MESSAGE_TYPE_CONFIG) as OutreachMessageType[]).map(
                (type) => {
                  const config = OUTREACH_MESSAGE_TYPE_CONFIG[type];
                  return (
                    <button
                      key={type}
                      onClick={() => handleTypeChange(type)}
                      className={cn(
                        "flex items-center gap-2 p-3 rounded-lg border text-left transition-all",
                        messageType === type
                          ? "border-purple-500 bg-purple-50 dark:bg-purple-950/30"
                          : "border-border hover:border-purple-300"
                      )}
                    >
                      <div
                        className={cn(
                          "shrink-0",
                          messageType === type
                            ? "text-purple-600"
                            : "text-muted-foreground"
                        )}
                      >
                        {MESSAGE_TYPE_ICONS[type]}
                      </div>
                      <div>
                        <div className="text-sm font-medium">{config.label}</div>
                        <div className="text-xs text-muted-foreground">
                          {config.description}
                        </div>
                      </div>
                    </button>
                  );
                }
              )}
            </div>
          </div>

          {/* Generate Button */}
          {variations.length === 0 && (
            <Button
              onClick={generateMessages}
              disabled={loading}
              className="w-full"
              size="lg"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Generating 3 variations...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Generate Message
                </>
              )}
            </Button>
          )}

          {/* Loading State */}
          {loading && (
            <div className="space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-40 w-full" />
            </div>
          )}

          {/* Generated Message */}
          {variations.length > 0 && !loading && (
            <>
              {/* Tone Tabs */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label className="text-sm font-medium">Tone</Label>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={generateMessages}
                    disabled={loading}
                  >
                    <RefreshCw className="h-4 w-4 mr-1" />
                    Regenerate
                  </Button>
                </div>
                <Tabs
                  value={selectedTone}
                  onValueChange={(v) => handleToneChange(v as OutreachTone)}
                >
                  <TabsList className="grid w-full grid-cols-3">
                    {(["casual", "professional", "formal"] as OutreachTone[]).map(
                      (tone) => (
                        <TabsTrigger key={tone} value={tone} className="capitalize">
                          {OUTREACH_TONE_CONFIG[tone].label}
                        </TabsTrigger>
                      )
                    )}
                  </TabsList>
                </Tabs>
              </div>

              {/* Editable Message */}
              <div className="space-y-3">
                <div>
                  <Label htmlFor="subject" className="text-sm font-medium">
                    Subject
                  </Label>
                  <Input
                    id="subject"
                    value={editedSubject}
                    onChange={(e) => setEditedSubject(e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="body" className="text-sm font-medium">
                    Message
                  </Label>
                  <Textarea
                    id="body"
                    value={editedBody}
                    onChange={(e) => setEditedBody(e.target.value)}
                    className="mt-1 min-h-[200px]"
                  />
                </div>
              </div>

              {/* Context Info */}
              {context && (
                <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                  {context.days_since_contact !== null && (
                    <Badge variant="outline">
                      {context.days_since_contact} days since contact
                    </Badge>
                  )}
                  {context.shared_projects && context.shared_projects.length > 0 && (
                    <Badge variant="outline">
                      {context.shared_projects.length} shared project
                      {context.shared_projects.length !== 1 ? "s" : ""}
                    </Badge>
                  )}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-2">
                <Button
                  onClick={handleCopy}
                  variant="outline"
                  className="flex-1"
                  disabled={!editedBody}
                >
                  {copied ? (
                    <>
                      <Check className="h-4 w-4 mr-2" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4 mr-2" />
                      Copy to Clipboard
                    </>
                  )}
                </Button>
                <Button
                  onClick={handleEmail}
                  className="flex-1"
                  disabled={!editedBody || !contactEmail}
                >
                  <Mail className="h-4 w-4 mr-2" />
                  Send via Email
                </Button>
              </div>

              {!contactEmail && (
                <p className="text-xs text-muted-foreground text-center">
                  Add an email address to this contact to send directly
                </p>
              )}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
