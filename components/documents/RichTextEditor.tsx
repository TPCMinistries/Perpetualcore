"use client";

import { useState, useRef, useEffect } from "react";
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  List,
  ListOrdered,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Link,
  Image,
  Code,
  Quote,
  Heading1,
  Heading2,
  Heading3,
  Undo,
  Redo,
  Type,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  minHeight?: string;
}

export function RichTextEditor({
  value,
  onChange,
  placeholder = "Start writing...",
  minHeight = "400px",
}: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    if (editorRef.current && value !== editorRef.current.innerHTML) {
      editorRef.current.innerHTML = value;
    }
  }, [value]);

  const executeCommand = (command: string, value: string | undefined = undefined) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
    handleInput();
  };

  const handleInput = () => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    // Prevent default paste behavior
    e.preventDefault();

    // Get plain text from clipboard
    const text = e.clipboardData.getData("text/plain");

    // Insert text at cursor
    document.execCommand("insertText", false, text);
  };

  const insertLink = () => {
    const url = prompt("Enter URL:");
    if (url) {
      executeCommand("createLink", url);
    }
  };

  const insertImage = () => {
    const url = prompt("Enter image URL:");
    if (url) {
      executeCommand("insertImage", url);
    }
  };

  const toolbarButtons = [
    {
      group: "text",
      buttons: [
        { icon: Bold, command: "bold", title: "Bold (Ctrl+B)" },
        { icon: Italic, command: "italic", title: "Italic (Ctrl+I)" },
        { icon: Underline, command: "underline", title: "Underline (Ctrl+U)" },
        { icon: Strikethrough, command: "strikeThrough", title: "Strikethrough" },
      ],
    },
    {
      group: "headings",
      buttons: [
        { icon: Heading1, command: "formatBlock", value: "h1", title: "Heading 1" },
        { icon: Heading2, command: "formatBlock", value: "h2", title: "Heading 2" },
        { icon: Heading3, command: "formatBlock", value: "h3", title: "Heading 3" },
        { icon: Type, command: "formatBlock", value: "p", title: "Paragraph" },
      ],
    },
    {
      group: "lists",
      buttons: [
        { icon: List, command: "insertUnorderedList", title: "Bullet List" },
        { icon: ListOrdered, command: "insertOrderedList", title: "Numbered List" },
      ],
    },
    {
      group: "alignment",
      buttons: [
        { icon: AlignLeft, command: "justifyLeft", title: "Align Left" },
        { icon: AlignCenter, command: "justifyCenter", title: "Align Center" },
        { icon: AlignRight, command: "justifyRight", title: "Align Right" },
      ],
    },
    {
      group: "insert",
      buttons: [
        { icon: Link, command: "link", action: insertLink, title: "Insert Link" },
        { icon: Image, command: "image", action: insertImage, title: "Insert Image" },
        { icon: Quote, command: "formatBlock", value: "blockquote", title: "Quote" },
        { icon: Code, command: "formatBlock", value: "pre", title: "Code Block" },
      ],
    },
    {
      group: "history",
      buttons: [
        { icon: Undo, command: "undo", title: "Undo (Ctrl+Z)" },
        { icon: Redo, command: "redo", title: "Redo (Ctrl+Y)" },
      ],
    },
  ];

  return (
    <Card className={isFocused ? "ring-2 ring-primary" : ""}>
      <CardContent className="p-0">
        {/* Toolbar */}
        <div className="border-b p-2 flex flex-wrap gap-2 bg-muted/50">
          {toolbarButtons.map((group, groupIndex) => (
            <div key={groupIndex} className="flex gap-1">
              {group.buttons.map((button, buttonIndex) => {
                const Icon = button.icon;
                return (
                  <Button
                    key={buttonIndex}
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => {
                      if (button.action) {
                        button.action();
                      } else {
                        executeCommand(button.command, button.value);
                      }
                    }}
                    title={button.title}
                  >
                    <Icon className="h-4 w-4" />
                  </Button>
                );
              })}
              {groupIndex < toolbarButtons.length - 1 && (
                <div className="w-px bg-border mx-1" />
              )}
            </div>
          ))}
        </div>

        {/* Editor Area */}
        <div
          ref={editorRef}
          contentEditable
          className="prose prose-sm max-w-none p-6 focus:outline-none"
          style={{ minHeight }}
          onInput={handleInput}
          onPaste={handlePaste}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          data-placeholder={placeholder}
        />

        <style jsx global>{`
          [contenteditable][data-placeholder]:empty:before {
            content: attr(data-placeholder);
            color: #9ca3af;
            cursor: text;
          }

          [contenteditable] {
            outline: none;
          }

          [contenteditable] h1 {
            font-size: 2em;
            font-weight: bold;
            margin: 0.67em 0;
          }

          [contenteditable] h2 {
            font-size: 1.5em;
            font-weight: bold;
            margin: 0.75em 0;
          }

          [contenteditable] h3 {
            font-size: 1.17em;
            font-weight: bold;
            margin: 0.83em 0;
          }

          [contenteditable] p {
            margin: 1em 0;
          }

          [contenteditable] blockquote {
            border-left: 4px solid #e5e7eb;
            padding-left: 1em;
            margin: 1em 0;
            color: #6b7280;
          }

          [contenteditable] pre {
            background: #f3f4f6;
            padding: 1em;
            border-radius: 0.375rem;
            overflow-x: auto;
            font-family: monospace;
          }

          [contenteditable] code {
            background: #f3f4f6;
            padding: 0.2em 0.4em;
            border-radius: 0.25rem;
            font-family: monospace;
            font-size: 0.9em;
          }

          [contenteditable] ul,
          [contenteditable] ol {
            margin: 1em 0;
            padding-left: 2em;
          }

          [contenteditable] li {
            margin: 0.5em 0;
          }

          [contenteditable] a {
            color: #3b82f6;
            text-decoration: underline;
          }

          [contenteditable] img {
            max-width: 100%;
            height: auto;
            border-radius: 0.375rem;
            margin: 1em 0;
          }
        `}</style>
      </CardContent>
    </Card>
  );
}
