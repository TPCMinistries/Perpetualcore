"use client";

import { RefObject, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Paperclip, X, FileText, Send, Loader2, Command, Library, Zap, Sparkles, Users } from "lucide-react";
import { FileAttachment } from "../hooks/useChat";
import {
  useContactMention,
  MentionDropdown,
  MentionedContactsPills,
  MentionedContact,
} from "@/components/mentions/ContactMention";

interface ChatInputProps {
  input: string;
  onInputChange: (value: string) => void;
  attachments: FileAttachment[];
  isDragging: boolean;
  isLoading: boolean;
  isRecording: boolean;
  textareaRef: RefObject<HTMLTextAreaElement>;
  fileInputRef: RefObject<HTMLInputElement>;
  onSubmit: (e: React.FormEvent, mentionedContacts?: MentionedContact[]) => void;
  onFileSelect: (files: FileList | null) => void;
  onRemoveAttachment: (index: number) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
  onOpenCommandPalette: () => void;
  onOpenPromptLibrary: () => void;
  onToggleQuickActions: () => void;
}

export type { MentionedContact };

export function ChatInput({
  input,
  onInputChange,
  attachments,
  isDragging,
  isLoading,
  isRecording,
  textareaRef,
  fileInputRef,
  onSubmit,
  onFileSelect,
  onRemoveAttachment,
  onDragOver,
  onDragLeave,
  onDrop,
  onOpenCommandPalette,
  onOpenPromptLibrary,
  onToggleQuickActions,
}: ChatInputProps) {
  // Contact mention support
  const {
    mentionedContacts,
    setMentionedContacts,
    showMentionDropdown,
    mentionPosition,
    contacts,
    loading,
    selectedIndex,
    handleInputChange: handleMentionInputChange,
    handleMentionSelect,
    handleKeyDown: handleMentionKeyDown,
  } = useContactMention();

  const handleInputChangeWithMention = useCallback(
    (value: string) => {
      onInputChange(value);
      const cursorPos = textareaRef.current?.selectionStart || value.length;
      handleMentionInputChange(value, cursorPos, textareaRef);
    },
    [onInputChange, handleMentionInputChange, textareaRef]
  );

  const handleSelectContact = useCallback(
    (contact: MentionedContact) => {
      const cursorPos = textareaRef.current?.selectionStart || input.length;
      handleMentionSelect(contact, input, cursorPos, onInputChange);
      // Focus back on textarea
      setTimeout(() => textareaRef.current?.focus(), 0);
    },
    [handleMentionSelect, input, onInputChange, textareaRef]
  );

  const handleRemoveMentionedContact = useCallback(
    (id: string) => {
      setMentionedContacts((prev) => prev.filter((c) => c.id !== id));
    },
    [setMentionedContacts]
  );

  const handleFormSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      onSubmit(e, mentionedContacts);
      // Clear mentioned contacts after submit
      setMentionedContacts([]);
    },
    [onSubmit, mentionedContacts, setMentionedContacts]
  );

  return (
    <div className="border-t border-border/50 dark:border-border/50 bg-card/80 dark:bg-background/80 backdrop-blur-sm">
      <div className="max-w-3xl mx-auto px-6 py-4">
        {/* Prompt Menu Buttons */}
        <div className="flex items-center gap-2 mb-3">
          <Button
            variant="outline"
            size="sm"
            onClick={onOpenCommandPalette}
            className="gap-2"
          >
            <Command className="h-4 w-4" />
            <span className="hidden sm:inline">Quick Prompts</span>
            <kbd className="hidden md:inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100">
              <span className="text-xs">⌘</span>K
            </kbd>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onOpenPromptLibrary}
            className="gap-2"
          >
            <Library className="h-4 w-4" />
            <span className="hidden sm:inline">Browse Library</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onToggleQuickActions}
            className="gap-2"
          >
            <Zap className="h-4 w-4" />
            <span className="hidden sm:inline">Quick Actions</span>
          </Button>
          <div className="flex-1" />
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Sparkles className="h-3 w-3" />
            <span className="hidden md:inline">AI-Powered Prompts</span>
          </div>
        </div>

        {/* Attachments Preview */}
        {attachments.length > 0 && (
          <div className="mb-3 flex flex-wrap gap-2">
            {attachments.map((attachment, index) => (
              <div
                key={index}
                className="relative group bg-muted dark:bg-card border border-border dark:border-border rounded-lg p-2 flex items-center gap-2"
              >
                {attachment.type === "image" && attachment.preview ? (
                  <img
                    src={attachment.preview}
                    alt={attachment.file.name}
                    className="h-12 w-12 object-cover rounded"
                  />
                ) : (
                  <FileText className="h-5 w-5 text-muted-foreground dark:text-muted-foreground" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate text-foreground dark:text-foreground">
                    {attachment.file.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {(attachment.file.size / 1024).toFixed(1)} KB
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => onRemoveAttachment(index)}
                  className="h-5 w-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Mentioned Contacts Pills */}
        <MentionedContactsPills
          contacts={mentionedContacts}
          onRemove={handleRemoveMentionedContact}
        />

        {/* Input Box */}
        <div
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
          className={`relative rounded-2xl border transition-all shadow-sm ${
            isDragging
              ? "border-slate-400 dark:border-border bg-muted dark:bg-card shadow-lg"
              : "border-border dark:border-border bg-card hover:border-border dark:hover:border-border"
          }`}
        >
          {/* Mention Dropdown */}
          {showMentionDropdown && (
            <MentionDropdown
              contacts={contacts}
              loading={loading}
              selectedIndex={selectedIndex}
              onSelect={handleSelectContact}
              position={mentionPosition}
            />
          )}

          <form onSubmit={handleFormSubmit} className="flex gap-2 items-end p-2">
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".pdf,.docx,.txt,.csv,image/*"
              onChange={(e) => onFileSelect(e.target.files)}
              className="hidden"
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => fileInputRef.current?.click()}
              disabled={isLoading}
              title="Attach files"
              className="h-9 w-9 text-muted-foreground dark:text-muted-foreground hover:text-foreground dark:hover:text-slate-100 hover:bg-muted dark:hover:bg-muted"
            >
              <Paperclip className="h-4 w-4" />
            </Button>
            <Textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => handleInputChangeWithMention(e.target.value)}
              placeholder={
                isRecording
                  ? "Listening..."
                  : isDragging
                  ? "Drop files here..."
                  : "Ask anything... Type @ to mention a contact"
              }
              disabled={isLoading}
              className="flex-1 min-h-[36px] max-h-[200px] resize-none border-0 focus-visible:ring-0 bg-transparent text-foreground dark:text-foreground placeholder:text-muted-foreground dark:placeholder:text-muted-foreground px-2 text-[15px]"
              rows={1}
              onInput={(e) => {
                const target = e.target as HTMLTextAreaElement;
                target.style.height = '36px';
                target.style.height = target.scrollHeight + 'px';
              }}
              onKeyDown={(e) => {
                // Handle mention navigation first
                const cursorPos = textareaRef.current?.selectionStart || input.length;
                if (handleMentionKeyDown(e, input, cursorPos, onInputChange)) {
                  return; // Mention handled the key
                }
                // Default Enter behavior
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  const form = e.currentTarget.form;
                  if (form) {
                    form.requestSubmit();
                  }
                }
              }}
            />
            <Button
              type="submit"
              disabled={isLoading || (!input.trim() && attachments.length === 0)}
              className="h-9 w-9 p-0 rounded-lg bg-slate-900 dark:bg-muted hover:bg-slate-800 dark:hover:bg-muted text-white dark:text-foreground disabled:opacity-50"
              size="icon"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
