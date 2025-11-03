"use client";

import { useState, useEffect } from "react";
import {
  MessageCircle,
  Send,
  Check,
  CheckCheck,
  Phone,
  Smartphone,
  Sparkles,
  Loader2,
  AlertCircle,
  CheckCircle2,
  TrendingUp,
  Zap,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

interface WhatsAppMessage {
  id: string;
  direction: "inbound" | "outbound";
  from_number: string;
  to_number: string;
  body: string;
  status: string;
  ai_response: boolean;
  created_at: string;
}

interface WhatsAppAccount {
  id: string;
  phone_number: string;
  status: string;
  ai_enabled: boolean;
}

export default function WhatsAppPage() {
  const [accounts, setAccounts] = useState<WhatsAppAccount[]>([]);
  const [messages, setMessages] = useState<WhatsAppMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [showConnect, setShowConnect] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [codeSent, setCodeSent] = useState(false);
  const [newMessage, setNewMessage] = useState("");
  const [selectedAccount, setSelectedAccount] = useState<WhatsAppAccount | null>(null);

  useEffect(() => {
    fetchAccounts();
    fetchMessages();
  }, []);

  const fetchAccounts = async () => {
    try {
      const response = await fetch("/api/whatsapp/connect");
      if (response.ok) {
        const data = await response.json();
        setAccounts(data.accounts || []);
        if (data.accounts?.length > 0) {
          setSelectedAccount(data.accounts[0]);
        }
      }
    } catch (error) {
      console.error("Failed to fetch accounts:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async () => {
    try {
      const response = await fetch("/api/whatsapp/messages?limit=100");
      if (response.ok) {
        const data = await response.json();
        setMessages(data.messages || []);
      }
    } catch (error) {
      console.error("Failed to fetch messages:", error);
    }
  };

  const sendVerificationCode = async () => {
    try {
      setSending(true);
      const response = await fetch("/api/whatsapp/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phoneNumber }),
      });

      if (response.ok) {
        setCodeSent(true);
        toast.success("Verification code sent! Check your WhatsApp.");
      } else {
        toast.error("Failed to send verification code");
      }
    } catch (error) {
      console.error("Failed to send code:", error);
      toast.error("Failed to send verification code");
    } finally {
      setSending(false);
    }
  };

  const verifyCode = async () => {
    try {
      setSending(true);
      const response = await fetch("/api/whatsapp/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phoneNumber,
          code: verificationCode,
          action: "verify",
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success("WhatsApp connected successfully!");
        setShowConnect(false);
        setCodeSent(false);
        setPhoneNumber("");
        setVerificationCode("");
        fetchAccounts();
      } else {
        toast.error("Invalid verification code");
      }
    } catch (error) {
      console.error("Failed to verify:", error);
      toast.error("Failed to verify code");
    } finally {
      setSending(false);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedAccount) return;

    try {
      setSending(true);
      const response = await fetch("/api/whatsapp/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: selectedAccount.phone_number,
          message: newMessage,
        }),
      });

      if (response.ok) {
        setNewMessage("");
        await fetchMessages();
      } else {
        toast.error("Failed to send message");
      }
    } catch (error) {
      console.error("Failed to send message:", error);
      toast.error("Failed to send message");
    } finally {
      setSending(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return date.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
      });
    } else if (date.toDateString() === yesterday.toDateString()) {
      return "Yesterday";
    } else {
      return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "delivered":
      case "read":
        return <CheckCheck className="h-3 w-3 text-blue-600" />;
      case "sent":
        return <Check className="h-3 w-3 text-gray-400" />;
      default:
        return <Loader2 className="h-3 w-3 animate-spin text-gray-400" />;
    }
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
        </div>
      </div>
    );
  }

  // Not connected
  if (accounts.length === 0 || showConnect) {
    return (
      <div className="space-y-6">
        <Card className="max-w-2xl mx-auto border-slate-200 dark:border-slate-800 shadow-xl bg-white dark:bg-slate-900">
          <CardContent className="py-12">
            <div className="text-center mb-8">
              <div className="h-20 w-20 rounded-2xl bg-green-50 dark:bg-green-950/30 flex items-center justify-center shadow-lg mx-auto mb-4">
                <Smartphone className="h-10 w-10 text-green-600 dark:text-green-400" />
              </div>
              <h2 className="text-3xl font-semibold mb-2 text-slate-900 dark:text-slate-100">
                Connect WhatsApp
              </h2>
              <p className="text-slate-600 dark:text-slate-400">
                Access your AI Brain directly from WhatsApp
              </p>
            </div>

            {!codeSent ? (
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Phone Number (with country code)
                  </label>
                  <Input
                    type="tel"
                    placeholder="+1234567890"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className="text-lg"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Format: +[country code][number] (e.g., +14155551234)
                  </p>
                </div>

                <Button
                  onClick={sendVerificationCode}
                  disabled={!phoneNumber || sending}
                  className="w-full bg-slate-900 dark:bg-slate-100 hover:bg-slate-800 dark:hover:bg-slate-200 text-white dark:text-slate-900"
                  size="lg"
                >
                  {sending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <MessageCircle className="mr-2 h-4 w-4" />
                      Send Verification Code
                    </>
                  )}
                </Button>

                <div className="bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-xl p-5 text-sm">
                  <div className="flex items-center gap-2 mb-3">
                    <Zap className="h-5 w-5 text-green-600 dark:text-green-400" />
                    <h4 className="font-semibold text-green-900 dark:text-green-100">How it works:</h4>
                  </div>
                  <ol className="text-green-800 dark:text-green-200 space-y-2 list-decimal list-inside">
                    <li>Enter your WhatsApp phone number</li>
                    <li>Receive a 6-digit code on WhatsApp</li>
                    <li>Enter the code to verify</li>
                    <li>Start chatting with your AI Brain!</li>
                  </ol>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <CheckCircle2 className="h-5 w-5 text-green-600 mb-2" />
                  <p className="text-sm text-green-900">
                    Verification code sent to <strong>{phoneNumber}</strong>
                  </p>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Verification Code
                  </label>
                  <Input
                    type="text"
                    placeholder="123456"
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value)}
                    maxLength={6}
                    className="text-lg text-center"
                  />
                </div>

                <Button
                  onClick={verifyCode}
                  disabled={verificationCode.length !== 6 || sending}
                  className="w-full bg-slate-900 dark:bg-slate-100 hover:bg-slate-800 dark:hover:bg-slate-200 text-white dark:text-slate-900"
                  size="lg"
                >
                  {sending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="mr-2 h-4 w-4" />
                      Verify & Connect
                    </>
                  )}
                </Button>

                <Button
                  variant="ghost"
                  onClick={() => {
                    setCodeSent(false);
                    setVerificationCode("");
                  }}
                  className="w-full"
                >
                  Back
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // Connected - show chat interface
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border border-slate-200 dark:border-slate-800 rounded-xl p-8 bg-white dark:bg-slate-900">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-lg bg-slate-900 dark:bg-slate-100 flex items-center justify-center">
              <MessageCircle className="h-6 w-6 text-white dark:text-slate-900" />
            </div>
            <div>
              <h1 className="text-3xl font-semibold text-slate-900 dark:text-slate-100">
                WhatsApp
              </h1>
              <p className="text-slate-600 dark:text-slate-400 mt-1">
                Chat with your AI Brain from anywhere
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {selectedAccount && (
              <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-2 mb-1">
                  <Phone className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                  <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{selectedAccount.phone_number}</p>
                </div>
                {selectedAccount.ai_enabled && (
                  <div className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
                    <div className="h-1.5 w-1.5 rounded-full bg-green-600 dark:bg-green-400 animate-pulse"></div>
                    <Sparkles className="h-3 w-3" />
                    AI Auto-reply enabled
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-6 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600 dark:text-slate-400">Total Messages</p>
              <p className="text-3xl font-semibold text-slate-900 dark:text-slate-100 mt-1">{messages.length}</p>
            </div>
            <div className="h-10 w-10 rounded-lg bg-green-50 dark:bg-green-950/30 flex items-center justify-center">
              <MessageCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </Card>

        <Card className="p-6 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600 dark:text-slate-400">Sent</p>
              <p className="text-3xl font-semibold text-slate-900 dark:text-slate-100 mt-1">
                {messages.filter((m) => m.direction === "outbound").length}
              </p>
            </div>
            <div className="h-10 w-10 rounded-lg bg-blue-50 dark:bg-blue-950/30 flex items-center justify-center">
              <Send className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </Card>

        <Card className="p-6 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600 dark:text-slate-400">AI Responses</p>
              <p className="text-3xl font-semibold text-slate-900 dark:text-slate-100 mt-1">
                {messages.filter((m) => m.ai_response).length}
              </p>
            </div>
            <div className="h-10 w-10 rounded-lg bg-purple-50 dark:bg-purple-950/30 flex items-center justify-center">
              <Sparkles className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
        </Card>

        <Card className="p-6 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600 dark:text-slate-400">Conversations</p>
              <p className="text-3xl font-semibold text-slate-900 dark:text-slate-100 mt-1">
                {new Set(messages.map((m) => m.from_number)).size}
              </p>
            </div>
            <div className="h-10 w-10 rounded-lg bg-teal-50 dark:bg-teal-950/30 flex items-center justify-center">
              <Users className="h-5 w-5 text-teal-600 dark:text-teal-400" />
            </div>
          </div>
        </Card>
      </div>

      {/* Messages */}
      <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
        <CardContent className="p-4 h-[600px] flex flex-col">
          {/* Messages area */}
          <div className="flex-1 overflow-y-auto mb-4 space-y-4">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <MessageCircle className="h-12 w-12 text-gray-400 mb-4" />
                <p className="text-gray-600">No messages yet</p>
                <p className="text-sm text-gray-500 mt-2">
                  Send a message or text your connected number
                </p>
              </div>
            ) : (
              messages
                .slice()
                .reverse()
                .map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${
                      message.direction === "outbound" ? "justify-end" : "justify-start"
                    }`}
                  >
                    <div
                      className={`max-w-[70%] rounded-2xl px-4 py-3 shadow-sm ${
                        message.direction === "outbound"
                          ? "bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900"
                          : "bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-700"
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap">{message.body}</p>
                      <div
                        className={`flex items-center gap-1 mt-1 text-xs ${
                          message.direction === "outbound"
                            ? "text-blue-100 justify-end"
                            : "text-gray-500"
                        }`}
                      >
                        {message.ai_response && (
                          <Sparkles className="h-3 w-3 mr-1" />
                        )}
                        <span>{formatDate(message.created_at)}</span>
                        {message.direction === "outbound" && getStatusIcon(message.status)}
                      </div>
                    </div>
                  </div>
                ))
            )}
          </div>

          {/* Input area */}
          <div className="flex gap-2">
            <Textarea
              placeholder="Type a message..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage();
                }
              }}
              rows={2}
              className="flex-1"
            />
            <Button
              onClick={sendMessage}
              disabled={!newMessage.trim() || sending}
              size="lg"
              className="bg-slate-900 dark:bg-slate-100 hover:bg-slate-800 dark:hover:bg-slate-200 text-white dark:text-slate-900"
            >
              {sending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Info card */}
      <Card className="bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800">
        <CardContent className="p-5">
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 rounded-lg bg-green-100 dark:bg-green-900/50 flex items-center justify-center flex-shrink-0">
              <Sparkles className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
            <div className="text-sm text-green-800 dark:text-green-200">
              <p className="font-semibold mb-1 text-green-900 dark:text-green-100">Pro tip:</p>
              <p>
                Text your connected number from any WhatsApp account and your AI Brain will respond automatically! Perfect for quick questions on the go.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
