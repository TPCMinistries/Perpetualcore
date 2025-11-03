"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import { Shield, Check, AlertCircle, Copy, Download, Key } from "lucide-react";
import QRCode from "qrcode";

interface TwoFactorStatus {
  enabled: boolean;
  enabled_at: string | null;
  backup_codes_count: number;
  recent_attempts: number;
}

export default function SecuritySettingsPage() {
  const [status, setStatus] = useState<TwoFactorStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [setupStep, setSetupStep] = useState<"idle" | "qr" | "verify" | "backup">("idle");
  const [setupData, setSetupData] = useState<{
    secret?: string;
    uri?: string;
    encryptedSecret?: string;
    qrCodeUrl?: string;
  }>({});
  const [verificationCode, setVerificationCode] = useState("");
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [disableCode, setDisableCode] = useState("");

  useEffect(() => {
    fetchStatus();
  }, []);

  async function fetchStatus() {
    try {
      const response = await fetch("/api/auth/2fa");
      if (response.ok) {
        const data = await response.json();
        setStatus(data);
      }
    } catch (error) {
      console.error("Error fetching 2FA status:", error);
      toast.error("Failed to load 2FA status");
    } finally {
      setLoading(false);
    }
  }

  async function handleStartSetup() {
    try {
      const response = await fetch("/api/auth/2fa/setup");
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to start setup");
      }

      const data = await response.json();

      // Generate QR code
      const qrCodeUrl = await QRCode.toDataURL(data.uri);

      setSetupData({
        secret: data.secret,
        uri: data.uri,
        encryptedSecret: data.encryptedSecret,
        qrCodeUrl,
      });
      setSetupStep("qr");
    } catch (error: any) {
      console.error("Setup error:", error);
      toast.error(error.message || "Failed to start 2FA setup");
    }
  }

  async function handleVerifyAndEnable() {
    if (!verificationCode || !setupData.encryptedSecret) {
      toast.error("Please enter the verification code");
      return;
    }

    try {
      const response = await fetch("/api/auth/2fa/enable", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          encryptedSecret: setupData.encryptedSecret,
          token: verificationCode,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Verification failed");
      }

      const data = await response.json();
      setBackupCodes(data.backupCodes);
      setSetupStep("backup");
      toast.success("2FA enabled successfully!");
    } catch (error: any) {
      console.error("Verification error:", error);
      toast.error(error.message || "Failed to verify code");
    }
  }

  async function handleFinishSetup() {
    setSetupStep("idle");
    setSetupData({});
    setVerificationCode("");
    setBackupCodes([]);
    fetchStatus();
  }

  async function handleDisable2FA() {
    if (!disableCode) {
      toast.error("Please enter your verification code");
      return;
    }

    if (!confirm("Are you sure you want to disable 2FA? This will make your account less secure.")) {
      return;
    }

    try {
      const response = await fetch("/api/auth/2fa", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: disableCode }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to disable 2FA");
      }

      toast.success("2FA disabled successfully");
      setDisableCode("");
      fetchStatus();
    } catch (error: any) {
      console.error("Disable error:", error);
      toast.error(error.message || "Failed to disable 2FA");
    }
  }

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  }

  function downloadBackupCodes() {
    const content = `Two-Factor Authentication Backup Codes
Generated: ${new Date().toLocaleString()}

IMPORTANT: Save these codes in a secure location.
Each code can only be used once to access your account if you lose your authenticator device.

${backupCodes.join("\n")}

Keep these codes safe and confidential.`;

    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `backup-codes-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Security Settings</h1>
          <p className="text-muted-foreground">Manage your account security</p>
        </div>
        <Card className="animate-pulse">
          <CardHeader>
            <div className="h-6 bg-muted rounded w-1/3 mb-2" />
            <div className="h-4 bg-muted rounded w-2/3" />
          </CardHeader>
          <CardContent>
            <div className="h-20 bg-muted rounded" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Security Settings</h1>
        <p className="text-muted-foreground">Manage two-factor authentication and security options</p>
      </div>

      {/* 2FA Status */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Two-Factor Authentication (2FA)
              </CardTitle>
              <CardDescription>
                Add an extra layer of security to your account
              </CardDescription>
            </div>
            {status?.enabled && (
              <Badge variant="outline" className="bg-green-50 border-green-300 text-green-700">
                <Check className="h-3 w-3 mr-1" />
                Enabled
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {!status?.enabled ? (
            // Setup Flow
            setupStep === "idle" ? (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Two-factor authentication adds an extra layer of security to your account by requiring a code from your authenticator app in addition to your password.
                </p>
                <Button onClick={handleStartSetup}>
                  <Key className="h-4 w-4 mr-2" />
                  Enable 2FA
                </Button>
              </div>
            ) : setupStep === "qr" ? (
              <div className="space-y-4">
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Scan the QR code with your authenticator app (Google Authenticator, Authy, 1Password, etc.)
                  </AlertDescription>
                </Alert>

                {setupData.qrCodeUrl && (
                  <div className="flex flex-col items-center space-y-4 py-4">
                    <img src={setupData.qrCodeUrl} alt="QR Code" className="border rounded-lg p-4" />
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground mb-2">
                        Or enter this code manually:
                      </p>
                      <div className="flex items-center gap-2">
                        <code className="bg-muted px-3 py-1 rounded font-mono text-sm">
                          {setupData.secret}
                        </code>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => copyToClipboard(setupData.secret || "")}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="verify-code">Enter the 6-digit code from your app</Label>
                  <div className="flex gap-2">
                    <Input
                      id="verify-code"
                      value={verificationCode}
                      onChange={(e) => setVerificationCode(e.target.value)}
                      placeholder="000000"
                      maxLength={6}
                      className="font-mono text-center text-lg"
                    />
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button onClick={handleVerifyAndEnable} disabled={verificationCode.length !== 6}>
                    Verify and Enable
                  </Button>
                  <Button variant="outline" onClick={() => setSetupStep("idle")}>
                    Cancel
                  </Button>
                </div>
              </div>
            ) : setupStep === "backup" ? (
              <div className="space-y-4">
                <Alert className="border-yellow-200 bg-yellow-50">
                  <AlertCircle className="h-4 w-4 text-yellow-600" />
                  <AlertDescription>
                    <strong>Save these backup codes!</strong> You can use these codes to access your account if you lose your authenticator device. Each code can only be used once.
                  </AlertDescription>
                </Alert>

                <div className="bg-muted p-4 rounded-lg">
                  <div className="grid grid-cols-2 gap-2 font-mono text-sm">
                    {backupCodes.map((code, idx) => (
                      <div key={idx} className="flex items-center justify-between bg-background p-2 rounded">
                        <span>{code}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0"
                          onClick={() => copyToClipboard(code)}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button onClick={downloadBackupCodes} variant="outline">
                    <Download className="h-4 w-4 mr-2" />
                    Download Codes
                  </Button>
                  <Button onClick={handleFinishSetup}>
                    I've Saved My Codes
                  </Button>
                </div>
              </div>
            ) : null
          ) : (
            // Disable Flow
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Status</p>
                  <p className="font-medium">Enabled</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Enabled Since</p>
                  <p className="font-medium">
                    {status.enabled_at ? new Date(status.enabled_at).toLocaleDateString() : "N/A"}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Backup Codes Remaining</p>
                  <p className="font-medium">{status.backup_codes_count}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Recent Attempts (24h)</p>
                  <p className="font-medium">{status.recent_attempts}</p>
                </div>
              </div>

              <div className="pt-4 border-t">
                <h4 className="font-medium mb-2">Disable 2FA</h4>
                <p className="text-sm text-muted-foreground mb-4">
                  To disable two-factor authentication, enter a verification code from your authenticator app.
                </p>
                <div className="flex gap-2">
                  <Input
                    value={disableCode}
                    onChange={(e) => setDisableCode(e.target.value)}
                    placeholder="000000"
                    maxLength={6}
                    className="max-w-xs font-mono text-center"
                  />
                  <Button variant="destructive" onClick={handleDisable2FA} disabled={disableCode.length !== 6}>
                    Disable 2FA
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
