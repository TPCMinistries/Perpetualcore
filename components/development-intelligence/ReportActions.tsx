"use client";

import { useState } from "react";
import { Check, Copy, Download } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ReportActions() {
  const [copied, setCopied] = useState(false);

  async function copyLink() {
    await navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2_000);
  }

  return (
    <div className="flex flex-wrap gap-2 print:hidden">
      <Button variant="outline" onClick={copyLink} className="min-h-11 cursor-pointer">
        {copied ? <Check className="mr-2 h-4 w-4 text-emerald-600" /> : <Copy className="mr-2 h-4 w-4" />}
        {copied ? "Link copied" : "Copy report link"}
      </Button>
      <Button onClick={() => window.print()} className="min-h-11 cursor-pointer bg-indigo-600 hover:bg-indigo-700">
        <Download className="mr-2 h-4 w-4" />
        Save as PDF
      </Button>
    </div>
  );
}
