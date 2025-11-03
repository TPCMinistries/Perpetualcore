"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { toast } from "sonner"
import {
  Shield,
  Cookie,
  Share2,
  Mail,
  AlertTriangle,
  Download,
  Trash2,
  Eye,
  Lock,
  Bell,
  FileText,
  Database,
  ExternalLink,
} from "lucide-react"

export default function PrivacySettingsPage() {
  const [cookieSettings, setCookieSettings] = useState({
    necessary: true, // Always enabled
    analytics: true,
    marketing: false,
    preferences: true,
  })

  const [dataSharing, setDataSharing] = useState({
    analytics: true,
    thirdParty: false,
    research: false,
    marketing: false,
  })

  const [communications, setCommunications] = useState({
    productUpdates: true,
    newsletter: true,
    securityAlerts: true,
    marketing: false,
    surveys: false,
  })

  const [privacySettings, setPrivacySettings] = useState({
    profileVisibility: "private",
    activityTracking: true,
    dataRetention: "auto",
  })

  const [deleteConfirmation, setDeleteConfirmation] = useState("")
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  const handleSaveCookies = () => {
    toast.success("Cookie preferences saved successfully")
  }

  const handleSaveDataSharing = () => {
    toast.success("Data sharing preferences saved")
  }

  const handleSaveCommunications = () => {
    toast.success("Communication preferences updated")
  }

  const handleDownloadData = () => {
    toast.success("Your data export request has been queued. You'll receive an email when ready.")
  }

  const handleDeleteAccount = () => {
    if (deleteConfirmation === "DELETE") {
      toast.success("Account deletion initiated. You'll receive a confirmation email.")
      setShowDeleteDialog(false)
      setDeleteConfirmation("")
    } else {
      toast.error("Please type DELETE to confirm")
    }
  }

  return (
    <div className="space-y-8 pb-16">
      {/* Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-red-50 via-pink-50 to-rose-50 dark:from-red-950/20 dark:via-pink-950/20 dark:to-rose-950/20 border border-red-100 dark:border-red-900/20 p-8 shadow-lg">
        <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
        <div className="relative flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center shadow-lg">
              <Shield className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-red-900 via-pink-800 to-rose-900 dark:from-red-100 dark:via-pink-100 dark:to-rose-100 bg-clip-text text-transparent">
                Privacy Settings
              </h1>
              <p className="text-red-700 dark:text-red-300 mt-1">
                Manage your privacy preferences and data controls
              </p>
            </div>
          </div>
          <Badge variant="outline" className="border-red-200 dark:border-red-800 text-red-700 dark:text-red-300">
            GDPR Compliant
          </Badge>
        </div>
      </div>

      {/* Cookie Preferences */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-orange-100 dark:bg-orange-900/20 flex items-center justify-center">
              <Cookie className="h-5 w-5 text-orange-600 dark:text-orange-400" />
            </div>
            <div>
              <CardTitle>Cookie Preferences</CardTitle>
              <CardDescription>
                Manage how we use cookies to improve your experience
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            {/* Necessary Cookies */}
            <div className="flex items-center justify-between p-4 rounded-lg border bg-muted/50">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <Label htmlFor="cookie-necessary" className="font-semibold">
                    Necessary Cookies
                  </Label>
                  <Badge variant="secondary" className="text-xs">Required</Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  Essential for the website to function properly. Cannot be disabled.
                </p>
              </div>
              <Switch
                id="cookie-necessary"
                checked={cookieSettings.necessary}
                disabled
              />
            </div>

            {/* Analytics Cookies */}
            <div className="flex items-center justify-between p-4 rounded-lg border">
              <div className="flex-1">
                <Label htmlFor="cookie-analytics" className="font-semibold">
                  Analytics Cookies
                </Label>
                <p className="text-sm text-muted-foreground mt-1">
                  Help us understand how you use our platform to improve performance.
                </p>
              </div>
              <Switch
                id="cookie-analytics"
                checked={cookieSettings.analytics}
                onCheckedChange={(checked) =>
                  setCookieSettings({ ...cookieSettings, analytics: checked })
                }
              />
            </div>

            {/* Marketing Cookies */}
            <div className="flex items-center justify-between p-4 rounded-lg border">
              <div className="flex-1">
                <Label htmlFor="cookie-marketing" className="font-semibold">
                  Marketing Cookies
                </Label>
                <p className="text-sm text-muted-foreground mt-1">
                  Used to deliver personalized advertisements and track campaign performance.
                </p>
              </div>
              <Switch
                id="cookie-marketing"
                checked={cookieSettings.marketing}
                onCheckedChange={(checked) =>
                  setCookieSettings({ ...cookieSettings, marketing: checked })
                }
              />
            </div>

            {/* Preference Cookies */}
            <div className="flex items-center justify-between p-4 rounded-lg border">
              <div className="flex-1">
                <Label htmlFor="cookie-preferences" className="font-semibold">
                  Preference Cookies
                </Label>
                <p className="text-sm text-muted-foreground mt-1">
                  Remember your settings and choices for a personalized experience.
                </p>
              </div>
              <Switch
                id="cookie-preferences"
                checked={cookieSettings.preferences}
                onCheckedChange={(checked) =>
                  setCookieSettings({ ...cookieSettings, preferences: checked })
                }
              />
            </div>
          </div>

          <Button onClick={handleSaveCookies} className="w-full sm:w-auto">
            Save Cookie Preferences
          </Button>
        </CardContent>
      </Card>

      {/* Data Sharing */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center">
              <Share2 className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <CardTitle>Data Sharing</CardTitle>
              <CardDescription>
                Control how your data is shared and used
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-lg border">
              <div className="flex-1">
                <Label htmlFor="share-analytics" className="font-semibold">
                  Usage Analytics
                </Label>
                <p className="text-sm text-muted-foreground mt-1">
                  Share anonymous usage data to help improve our services.
                </p>
              </div>
              <Switch
                id="share-analytics"
                checked={dataSharing.analytics}
                onCheckedChange={(checked) =>
                  setDataSharing({ ...dataSharing, analytics: checked })
                }
              />
            </div>

            <div className="flex items-center justify-between p-4 rounded-lg border">
              <div className="flex-1">
                <Label htmlFor="share-third-party" className="font-semibold">
                  Third-Party Services
                </Label>
                <p className="text-sm text-muted-foreground mt-1">
                  Allow sharing data with trusted third-party integrations.
                </p>
              </div>
              <Switch
                id="share-third-party"
                checked={dataSharing.thirdParty}
                onCheckedChange={(checked) =>
                  setDataSharing({ ...dataSharing, thirdParty: checked })
                }
              />
            </div>

            <div className="flex items-center justify-between p-4 rounded-lg border">
              <div className="flex-1">
                <Label htmlFor="share-research" className="font-semibold">
                  Research & Development
                </Label>
                <p className="text-sm text-muted-foreground mt-1">
                  Contribute anonymized data to AI research and platform improvements.
                </p>
              </div>
              <Switch
                id="share-research"
                checked={dataSharing.research}
                onCheckedChange={(checked) =>
                  setDataSharing({ ...dataSharing, research: checked })
                }
              />
            </div>

            <div className="flex items-center justify-between p-4 rounded-lg border">
              <div className="flex-1">
                <Label htmlFor="share-marketing" className="font-semibold">
                  Marketing Partners
                </Label>
                <p className="text-sm text-muted-foreground mt-1">
                  Share data with marketing partners for personalized offers.
                </p>
              </div>
              <Switch
                id="share-marketing"
                checked={dataSharing.marketing}
                onCheckedChange={(checked) =>
                  setDataSharing({ ...dataSharing, marketing: checked })
                }
              />
            </div>
          </div>

          <Button onClick={handleSaveDataSharing} className="w-full sm:w-auto">
            Save Data Sharing Preferences
          </Button>
        </CardContent>
      </Card>

      {/* Communication Preferences */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-purple-100 dark:bg-purple-900/20 flex items-center justify-center">
              <Mail className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <CardTitle>Communication Preferences</CardTitle>
              <CardDescription>
                Choose what emails and notifications you want to receive
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-lg border bg-muted/50">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <Label htmlFor="comm-security" className="font-semibold">
                    Security Alerts
                  </Label>
                  <Badge variant="secondary" className="text-xs">Required</Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  Critical security notifications and account alerts.
                </p>
              </div>
              <Switch
                id="comm-security"
                checked={communications.securityAlerts}
                disabled
              />
            </div>

            <div className="flex items-center justify-between p-4 rounded-lg border">
              <div className="flex-1">
                <Label htmlFor="comm-updates" className="font-semibold">
                  Product Updates
                </Label>
                <p className="text-sm text-muted-foreground mt-1">
                  New features, improvements, and platform updates.
                </p>
              </div>
              <Switch
                id="comm-updates"
                checked={communications.productUpdates}
                onCheckedChange={(checked) =>
                  setCommunications({ ...communications, productUpdates: checked })
                }
              />
            </div>

            <div className="flex items-center justify-between p-4 rounded-lg border">
              <div className="flex-1">
                <Label htmlFor="comm-newsletter" className="font-semibold">
                  Newsletter
                </Label>
                <p className="text-sm text-muted-foreground mt-1">
                  Weekly digest of tips, best practices, and community highlights.
                </p>
              </div>
              <Switch
                id="comm-newsletter"
                checked={communications.newsletter}
                onCheckedChange={(checked) =>
                  setCommunications({ ...communications, newsletter: checked })
                }
              />
            </div>

            <div className="flex items-center justify-between p-4 rounded-lg border">
              <div className="flex-1">
                <Label htmlFor="comm-marketing" className="font-semibold">
                  Marketing Emails
                </Label>
                <p className="text-sm text-muted-foreground mt-1">
                  Promotional content, special offers, and announcements.
                </p>
              </div>
              <Switch
                id="comm-marketing"
                checked={communications.marketing}
                onCheckedChange={(checked) =>
                  setCommunications({ ...communications, marketing: checked })
                }
              />
            </div>

            <div className="flex items-center justify-between p-4 rounded-lg border">
              <div className="flex-1">
                <Label htmlFor="comm-surveys" className="font-semibold">
                  Surveys & Feedback
                </Label>
                <p className="text-sm text-muted-foreground mt-1">
                  Occasional surveys to help us improve your experience.
                </p>
              </div>
              <Switch
                id="comm-surveys"
                checked={communications.surveys}
                onCheckedChange={(checked) =>
                  setCommunications({ ...communications, surveys: checked })
                }
              />
            </div>
          </div>

          <Button onClick={handleSaveCommunications} className="w-full sm:w-auto">
            Save Communication Preferences
          </Button>
        </CardContent>
      </Card>

      {/* GDPR Rights */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
              <FileText className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <CardTitle>Your Data Rights</CardTitle>
              <CardDescription>
                Exercise your rights under GDPR and data protection laws
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Button
              variant="outline"
              className="h-auto flex-col items-start p-4 space-y-2"
              onClick={handleDownloadData}
            >
              <div className="flex items-center gap-2 w-full">
                <Download className="h-4 w-4" />
                <span className="font-semibold">Download Your Data</span>
              </div>
              <p className="text-xs text-muted-foreground text-left">
                Export all your personal data in a machine-readable format
              </p>
            </Button>

            <Button
              variant="outline"
              className="h-auto flex-col items-start p-4 space-y-2"
              asChild
            >
              <a href="/privacy-policy" target="_blank">
                <div className="flex items-center gap-2 w-full">
                  <Eye className="h-4 w-4" />
                  <span className="font-semibold">View Privacy Policy</span>
                </div>
                <p className="text-xs text-muted-foreground text-left">
                  Read our full privacy policy and data handling practices
                </p>
              </a>
            </Button>

            <Button
              variant="outline"
              className="h-auto flex-col items-start p-4 space-y-2"
              asChild
            >
              <a href="/data-processing" target="_blank">
                <div className="flex items-center gap-2 w-full">
                  <Database className="h-4 w-4" />
                  <span className="font-semibold">Data Processing</span>
                </div>
                <p className="text-xs text-muted-foreground text-left">
                  Learn how we process and store your information
                </p>
              </a>
            </Button>

            <Button
              variant="outline"
              className="h-auto flex-col items-start p-4 space-y-2"
              asChild
            >
              <a href="/contact-dpo" target="_blank">
                <div className="flex items-center gap-2 w-full">
                  <Lock className="h-4 w-4" />
                  <span className="font-semibold">Contact DPO</span>
                </div>
                <p className="text-xs text-muted-foreground text-left">
                  Reach out to our Data Protection Officer
                </p>
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-red-200 dark:border-red-900/50">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
              <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <CardTitle className="text-red-900 dark:text-red-100">
                Danger Zone
              </CardTitle>
              <CardDescription>
                Irreversible and destructive actions
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 rounded-lg border border-red-200 dark:border-red-900/50 bg-red-50/50 dark:bg-red-950/10">
            <div className="flex items-start gap-3">
              <Trash2 className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5" />
              <div className="flex-1">
                <h4 className="font-semibold text-red-900 dark:text-red-100 mb-1">
                  Delete Account
                </h4>
                <p className="text-sm text-red-700 dark:text-red-300 mb-4">
                  Permanently delete your account and all associated data. This action cannot be undone.
                </p>
                <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                  <DialogTrigger asChild>
                    <Button variant="destructive" size="sm">
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete Account
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Delete Account</DialogTitle>
                      <DialogDescription>
                        This action is permanent and cannot be undone. All your data, agents,
                        integrations, and settings will be permanently deleted.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="rounded-lg bg-red-50 dark:bg-red-950/20 p-4 border border-red-200 dark:border-red-900/50">
                        <p className="text-sm text-red-900 dark:text-red-100 font-medium mb-2">
                          This will permanently delete:
                        </p>
                        <ul className="text-sm text-red-700 dark:text-red-300 space-y-1 list-disc list-inside">
                          <li>Your account and profile</li>
                          <li>All agents and workflows</li>
                          <li>Integration connections</li>
                          <li>Usage history and analytics</li>
                          <li>API keys and tokens</li>
                        </ul>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="delete-confirm">
                          Type <span className="font-mono font-bold">DELETE</span> to confirm
                        </Label>
                        <Input
                          id="delete-confirm"
                          value={deleteConfirmation}
                          onChange={(e) => setDeleteConfirmation(e.target.value)}
                          placeholder="DELETE"
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setShowDeleteDialog(false)
                          setDeleteConfirmation("")
                        }}
                      >
                        Cancel
                      </Button>
                      <Button
                        variant="destructive"
                        onClick={handleDeleteAccount}
                        disabled={deleteConfirmation !== "DELETE"}
                      >
                        Delete Account Permanently
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
