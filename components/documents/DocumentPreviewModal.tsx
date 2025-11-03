"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Download, FileText, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

interface DocumentPreviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  document: {
    id: string;
    title: string;
    file_type: string;
    file_url?: string;
  } | null;
}

export function DocumentPreviewModal({
  open,
  onOpenChange,
  document,
}: DocumentPreviewModalProps) {
  const [loading, setLoading] = useState(false);
  const [content, setContent] = useState<string>("");
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const supabase = createClient();

  // Fetch document content and signed URL when document changes
  useEffect(() => {
    async function fetchDocumentData() {
      if (!document?.id) {
        setContent("");
        setSignedUrl(null);
        return;
      }

      setLoading(true);

      try {
        // Fetch document content from database
        const { data: docData, error: docError } = await supabase
          .from("documents")
          .select("content")
          .eq("id", document.id)
          .single();

        if (docError) {
          console.error("Error fetching document content:", docError);
        } else if (docData?.content) {
          setContent(docData.content);
        }

        // Generate signed URL for download
        if (document.file_url) {
          const { data: urlData, error: urlError } = await supabase.storage
            .from("documents")
            .createSignedUrl(document.file_url, 3600);

          if (urlError) {
            console.error("Error generating signed URL:", urlError);
          } else {
            setSignedUrl(urlData.signedUrl);
          }
        }
      } catch (err) {
        console.error("Error in fetchDocumentData:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchDocumentData();
  }, [document?.id, document?.file_url]);

  if (!document) return null;

  function handleDownload() {
    if (signedUrl) {
      window.open(signedUrl, "_blank");
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl h-[90vh] flex flex-col p-0 backdrop-blur-2xl bg-card/95 border-border">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-border">
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2 text-xl">
              <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center shadow-lg">
                <FileText className="h-6 w-6 text-white" />
              </div>
              <span className="text-foreground">{document.title}</span>
            </DialogTitle>
            <Button variant="outline" size="sm" onClick={handleDownload} disabled={!signedUrl}>
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
          </div>
        </DialogHeader>

        <ScrollArea className="flex-1 px-6 py-4">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Loading document...</p>
              </div>
            </div>
          ) : content ? (
            <div className="bg-background rounded-lg p-8 max-w-4xl mx-auto shadow-sm border border-border">
              <div className="prose prose-sm dark:prose-invert max-w-none prose-headings:text-foreground prose-p:text-foreground prose-p:leading-relaxed prose-strong:text-foreground">
                <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-foreground">
                  {content}
                </pre>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <FileText className="h-16 w-16 mx-auto text-muted-foreground mb-4 opacity-30" />
                <p className="text-muted-foreground mb-2">No text content available</p>
                <p className="text-sm text-muted-foreground">
                  This document may still be processing or the content couldn't be extracted.
                </p>
                {signedUrl && (
                  <Button onClick={handleDownload} className="mt-4">
                    <Download className="h-4 w-4 mr-2" />
                    Download Original File
                  </Button>
                )}
              </div>
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
