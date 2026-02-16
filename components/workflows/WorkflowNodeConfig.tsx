"use client";

import { Node } from "@xyflow/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { Settings, Copy, Trash2 } from "lucide-react";
import { NODE_REGISTRY } from "@/lib/workflows/node-registry";
import type { NodeType } from "@/lib/workflow-engine";

interface WorkflowNodeConfigProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedNode: Node | null;
  onUpdateConfig: (key: string, value: string) => void;
  onDelete: () => void;
  onDuplicate: () => void;
}

export function WorkflowNodeConfig({
  open,
  onOpenChange,
  selectedNode,
  onUpdateConfig,
  onDelete,
  onDuplicate,
}: WorkflowNodeConfigProps) {
  if (!selectedNode) return null;

  const nodeType = selectedNode.type as NodeType;
  const registry = NODE_REGISTRY[nodeType];
  const config = (selectedNode.data?.config as Record<string, string>) || {};

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Configure Node
          </SheetTitle>
          <SheetDescription>
            {selectedNode.data?.label as string}
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6 mt-6">
          {/* Node Info */}
          <div className="space-y-2">
            <Label>Node Type</Label>
            <div className="p-3 rounded-lg bg-muted">
              <p className="font-medium">{registry?.label || nodeType}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {registry?.description ||
                  (selectedNode.data?.description as string)}
              </p>
            </div>
          </div>

          <Separator />

          {/* Dynamic config fields from registry */}
          {registry?.configSchema.fields.map((field) => (
            <div key={field.name} className="space-y-2">
              <Label htmlFor={field.name}>
                {field.label}
                {field.required && (
                  <span className="text-red-500 ml-1">*</span>
                )}
              </Label>

              {field.type === "text" && (
                <Input
                  id={field.name}
                  placeholder={field.placeholder}
                  value={config[field.name] || ""}
                  onChange={(e) => onUpdateConfig(field.name, e.target.value)}
                />
              )}

              {field.type === "number" && (
                <Input
                  id={field.name}
                  type="number"
                  placeholder={field.placeholder}
                  value={config[field.name] || ""}
                  onChange={(e) => onUpdateConfig(field.name, e.target.value)}
                />
              )}

              {field.type === "textarea" && (
                <Textarea
                  id={field.name}
                  placeholder={field.placeholder}
                  value={config[field.name] || ""}
                  onChange={(e) => onUpdateConfig(field.name, e.target.value)}
                  rows={4}
                  className="font-mono text-sm"
                />
              )}

              {field.type === "select" && field.options && (
                <Select
                  value={config[field.name] || ""}
                  onValueChange={(value) => onUpdateConfig(field.name, value)}
                >
                  <SelectTrigger id={field.name}>
                    <SelectValue placeholder={`Select ${field.label.toLowerCase()}`} />
                  </SelectTrigger>
                  <SelectContent>
                    {field.options.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          ))}

          <Separator />

          {/* Node Actions */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onDuplicate}
              className="flex-1"
            >
              <Copy className="h-4 w-4 mr-2" />
              Duplicate
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={onDelete}
              className="flex-1"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
