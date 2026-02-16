"use client";

import { useState } from "react";
import { Phone, Loader2, PhoneOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface CallButtonProps {
  phoneNumber: string;
  greeting?: string;
  size?: "sm" | "default" | "lg" | "icon";
  variant?: "default" | "outline" | "ghost";
}

export function CallButton({
  phoneNumber,
  greeting,
  size = "sm",
  variant = "outline",
}: CallButtonProps) {
  const [calling, setCalling] = useState(false);
  const [callSid, setCallSid] = useState<string | null>(null);

  async function handleCall() {
    if (callSid) {
      // End the call
      try {
        setCalling(true);
        const res = await fetch(`/api/voice/calls/${callSid}`, {
          method: "DELETE",
        });
        if (res.ok) {
          toast.success("Call ended");
          setCallSid(null);
        } else {
          const data = await res.json();
          toast.error(data.error || "Failed to end call");
        }
      } catch {
        toast.error("Failed to end call");
      } finally {
        setCalling(false);
      }
      return;
    }

    // Initiate the call
    try {
      setCalling(true);
      const res = await fetch("/api/voice/calls", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: phoneNumber,
          script: greeting ? { greeting } : undefined,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setCallSid(data.callId);
        toast.success(`Calling ${phoneNumber}...`);
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to initiate call");
      }
    } catch {
      toast.error("Failed to initiate call");
    } finally {
      setCalling(false);
    }
  }

  return (
    <Button
      size={size}
      variant={callSid ? "destructive" : variant}
      onClick={handleCall}
      disabled={calling}
    >
      {calling ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : callSid ? (
        <>
          <PhoneOff className="h-4 w-4 mr-1" />
          End Call
        </>
      ) : (
        <>
          <Phone className="h-4 w-4 mr-1" />
          Call
        </>
      )}
    </Button>
  );
}
