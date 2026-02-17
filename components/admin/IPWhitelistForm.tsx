"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { AlertCircle } from "lucide-react";

interface IPWhitelistFormProps {
  onSubmit: (data: { ip_range: string; label: string; description: string }) => Promise<void>;
  onCancel: () => void;
  initialData?: { ip_range: string; label: string; description: string };
}

const CIDR_REGEX = /^(\d{1,3}\.){3}\d{1,3}(\/\d{1,2})?$/;

function validateCIDR(value: string): string | null {
  if (!value.trim()) return "IP range is required";

  // Allow plain IP (will be treated as /32)
  const normalized = value.includes("/") ? value : `${value}/32`;

  if (!CIDR_REGEX.test(normalized)) {
    return "Invalid format. Use CIDR notation (e.g., 192.168.1.0/24) or a single IP";
  }

  const [ip, prefix] = normalized.split("/");
  const octets = ip.split(".").map(Number);

  if (octets.some((o) => o < 0 || o > 255)) {
    return "Invalid IP address: octets must be 0-255";
  }

  const prefixNum = parseInt(prefix, 10);
  if (prefixNum < 0 || prefixNum > 32) {
    return "Invalid prefix: must be between 0 and 32";
  }

  return null;
}

export default function IPWhitelistForm({ onSubmit, onCancel, initialData }: IPWhitelistFormProps) {
  const [ipRange, setIpRange] = useState(initialData?.ip_range ?? "");
  const [label, setLabel] = useState(initialData?.label ?? "");
  const [description, setDescription] = useState(initialData?.description ?? "");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const validationError = validateCIDR(ipRange);
    if (validationError) {
      setError(validationError);
      return;
    }

    if (!label.trim()) {
      setError("Label is required");
      return;
    }

    setSubmitting(true);
    try {
      const normalizedIp = ipRange.includes("/") ? ipRange : `${ipRange}/32`;
      await onSubmit({ ip_range: normalizedIp, label: label.trim(), description: description.trim() });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 text-red-700 text-sm rounded-lg">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="ip_range">IP Range (CIDR)</Label>
        <Input
          id="ip_range"
          placeholder="192.168.1.0/24 or 10.0.0.1"
          value={ipRange}
          onChange={(e) => setIpRange(e.target.value)}
        />
        <p className="text-xs text-gray-500">
          Use CIDR notation for ranges (e.g., 10.0.0.0/8) or a single IP address
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="label">Label</Label>
        <Input
          id="label"
          placeholder="Office VPN, Headquarters, etc."
          value={label}
          onChange={(e) => setLabel(e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description (optional)</Label>
        <Textarea
          id="description"
          placeholder="Additional notes about this IP range"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
        />
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onCancel} disabled={submitting}>
          Cancel
        </Button>
        <Button type="submit" disabled={submitting}>
          {submitting ? "Saving..." : initialData ? "Update Rule" : "Add Rule"}
        </Button>
      </div>
    </form>
  );
}
