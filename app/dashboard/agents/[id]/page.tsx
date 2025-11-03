"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Checkbox } from "@/components/ui/checkbox"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { toast } from "sonner"
import {
  Bot,
  Save,
  Trash2,
  Play,
  Settings,
  History,
  Code,
  Zap,
  ArrowLeft,
  Activity,
  Clock,
  CheckCircle2,
  XCircle,
  TrendingUp,
  MessageSquare,
  Send,
  Loader2,
} from "lucide-react"

export default function AgentDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState("config")
  const [isSaving, setIsSaving] = useState(false)
  const [isTesting, setIsTesting] = useState(false)
  const [testInput, setTestInput] = useState("")
  const [testMessages, setTestMessages] = useState<Array<{ role: string; content: string }>>([])

  // Agent configuration state
  const [config, setConfig] = useState({
    name: "Customer Support Agent",
    description: "Handles customer inquiries and support tickets",
    model: "gpt-4",
    temperature: 0.7,
    maxTokens: 2000,
    systemPrompt: "You are a helpful customer support agent. Be friendly, professional, and provide accurate information.",
    status: "active",
    tools: ["web_search", "knowledge_base", "email"],
    autoRetry: true,
    logConversations: true,
  })

  // Mock run history
  const [runs] = useState([
    {
      id: "1",
      timestamp: new Date("2024-01-26T10:30:00"),
      status: "success",
      duration: 1.2,
      tokensUsed: 450,
      input: "How do I reset my password?",
      output: "To reset your password, click on 'Forgot Password' on the login page...",
    },
    {
      id: "2",
      timestamp: new Date("2024-01-26T09:15:00"),
      status: "success",
      duration: 0.8,
      tokensUsed: 320,
      input: "What's your return policy?",
      output: "Our return policy allows returns within 30 days of purchase...",
    },
    {
      id: "3",
      timestamp: new Date("2024-01-26T08:45:00"),
      status: "error",
      duration: 0.3,
      tokensUsed: 150,
      input: "Track my order #12345",
      output: "Error: Unable to connect to order tracking service",
    },
  ])

  const availableTools = [
    { id: "web_search", label: "Web Search", description: "Search the internet for information" },
    { id: "knowledge_base", label: "Knowledge Base", description: "Query internal documentation" },
    { id: "email", label: "Email", description: "Send emails to users" },
    { id: "database", label: "Database", description: "Query customer database" },
    { id: "calendar", label: "Calendar", description: "Schedule appointments" },
    { id: "analytics", label: "Analytics", description: "Track and analyze metrics" },
  ]

  const modelOptions = [
    { value: "gpt-4", label: "GPT-4", description: "Most capable, slower" },
    { value: "gpt-4-turbo", label: "GPT-4 Turbo", description: "Fast and capable" },
    { value: "gpt-3.5-turbo", label: "GPT-3.5 Turbo", description: "Fast and cost-effective" },
    { value: "claude-3-opus", label: "Claude 3 Opus", description: "Advanced reasoning" },
    { value: "claude-3-sonnet", label: "Claude 3 Sonnet", description: "Balanced performance" },
  ]

  const handleSave = async () => {
    setIsSaving(true)
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      toast.success("Agent configuration saved successfully")
    } catch (error) {
      toast.error("Failed to save agent configuration")
    } finally {
      setIsSaving(false)
    }
  }

  const handleTest = async () => {
    if (!testInput.trim()) {
      toast.error("Please enter a test message")
      return
    }

    setIsTesting(true)
    setTestMessages([...testMessages, { role: "user", content: testInput }])

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000))
      const response = "This is a simulated response from the agent. In production, this would be the actual agent's response based on your configuration."
      setTestMessages(prev => [...prev, { role: "assistant", content: response }])
      setTestInput("")
    } catch (error) {
      toast.error("Failed to test agent")
    } finally {
      setIsTesting(false)
    }
  }

  const handleDelete = async () => {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      toast.success("Agent deleted successfully")
      router.push("/dashboard/agents")
    } catch (error) {
      toast.error("Failed to delete agent")
    }
  }

  const formatDuration = (seconds: number) => {
    return `${seconds.toFixed(2)}s`
  }

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date)
  }

  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-pink-50 via-rose-50 to-red-50 dark:from-pink-950/20 dark:via-rose-950/20 dark:to-red-950/20 border border-pink-100 dark:border-pink-900/20 p-8 shadow-lg">
        <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
        <div className="relative">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/dashboard/agents")}
            className="mb-4 text-pink-700 dark:text-pink-300 hover:bg-pink-100 dark:hover:bg-pink-900/20"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Agents
          </Button>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-pink-500 to-red-600 flex items-center justify-center shadow-lg">
                <Bot className="h-8 w-8 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-pink-900 via-rose-800 to-red-900 dark:from-pink-100 dark:via-rose-100 dark:to-red-100 bg-clip-text text-transparent">
                    {config.name}
                  </h1>
                  <Badge variant="outline" className="bg-green-100 dark:bg-green-900/40 border-green-300 dark:border-green-700 text-green-700 dark:text-green-300">
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    {config.status}
                  </Badge>
                </div>
                <p className="text-pink-700 dark:text-pink-300 mt-1">
                  {config.description}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                onClick={handleSave}
                disabled={isSaving}
                className="bg-gradient-to-r from-pink-600 to-red-600 hover:from-pink-700 hover:to-red-700"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save Changes
                  </>
                )}
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" className="border-red-200 dark:border-red-800 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Agent</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to delete "{config.name}"? This action cannot be undone.
                      All associated data and history will be permanently deleted.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDelete}
                      className="bg-red-600 hover:bg-red-700"
                    >
                      Delete Agent
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="config">
            <Settings className="h-4 w-4 mr-2" />
            Configuration
          </TabsTrigger>
          <TabsTrigger value="test">
            <Play className="h-4 w-4 mr-2" />
            Test
          </TabsTrigger>
          <TabsTrigger value="history">
            <History className="h-4 w-4 mr-2" />
            History
          </TabsTrigger>
          <TabsTrigger value="analytics">
            <TrendingUp className="h-4 w-4 mr-2" />
            Analytics
          </TabsTrigger>
        </TabsList>

        {/* Configuration Tab */}
        <TabsContent value="config" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>
                Configure the basic settings for your agent
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">Agent Name</Label>
                  <Input
                    id="name"
                    value={config.name}
                    onChange={(e) => setConfig({ ...config, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select value={config.status} onValueChange={(value) => setConfig({ ...config, status: value })}>
                    <SelectTrigger id="status">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                      <SelectItem value="draft">Draft</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={config.description}
                  onChange={(e) => setConfig({ ...config, description: e.target.value })}
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Model Configuration</CardTitle>
              <CardDescription>
                Choose the AI model and configure its parameters
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="model">Model</Label>
                <Select value={config.model} onValueChange={(value) => setConfig({ ...config, model: value })}>
                  <SelectTrigger id="model">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {modelOptions.map((model) => (
                      <SelectItem key={model.value} value={model.value}>
                        <div className="flex flex-col">
                          <span className="font-medium">{model.label}</span>
                          <span className="text-xs text-muted-foreground">{model.description}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="temperature">Temperature</Label>
                  <span className="text-sm text-muted-foreground">{config.temperature}</span>
                </div>
                <Slider
                  id="temperature"
                  min={0}
                  max={2}
                  step={0.1}
                  value={[config.temperature]}
                  onValueChange={([value]) => setConfig({ ...config, temperature: value })}
                />
                <p className="text-xs text-muted-foreground">
                  Lower values are more focused and deterministic, higher values are more creative
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="maxTokens">Max Tokens</Label>
                <Input
                  id="maxTokens"
                  type="number"
                  value={config.maxTokens}
                  onChange={(e) => setConfig({ ...config, maxTokens: parseInt(e.target.value) })}
                />
                <p className="text-xs text-muted-foreground">
                  Maximum number of tokens in the response
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>System Prompt</CardTitle>
              <CardDescription>
                Define how the agent should behave and respond
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                value={config.systemPrompt}
                onChange={(e) => setConfig({ ...config, systemPrompt: e.target.value })}
                rows={6}
                className="font-mono text-sm"
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Tools & Capabilities</CardTitle>
              <CardDescription>
                Enable tools that the agent can use to perform tasks
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {availableTools.map((tool) => (
                  <div
                    key={tool.id}
                    className="flex items-start space-x-3 p-3 rounded-lg border bg-muted/50"
                  >
                    <Checkbox
                      id={tool.id}
                      checked={config.tools.includes(tool.id)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setConfig({ ...config, tools: [...config.tools, tool.id] })
                        } else {
                          setConfig({
                            ...config,
                            tools: config.tools.filter((t) => t !== tool.id),
                          })
                        }
                      }}
                    />
                    <div className="flex-1">
                      <label
                        htmlFor={tool.id}
                        className="text-sm font-medium leading-none cursor-pointer"
                      >
                        {tool.label}
                      </label>
                      <p className="text-xs text-muted-foreground mt-1">
                        {tool.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Advanced Settings</CardTitle>
              <CardDescription>
                Additional configuration options
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="autoRetry">Auto Retry on Failure</Label>
                  <p className="text-xs text-muted-foreground">
                    Automatically retry failed requests
                  </p>
                </div>
                <Switch
                  id="autoRetry"
                  checked={config.autoRetry}
                  onCheckedChange={(checked) => setConfig({ ...config, autoRetry: checked })}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="logConversations">Log Conversations</Label>
                  <p className="text-xs text-muted-foreground">
                    Store conversation history for analysis
                  </p>
                </div>
                <Switch
                  id="logConversations"
                  checked={config.logConversations}
                  onCheckedChange={(checked) => setConfig({ ...config, logConversations: checked })}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Test Tab */}
        <TabsContent value="test" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Test Playground</CardTitle>
              <CardDescription>
                Test your agent configuration with sample inputs
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4 max-h-96 overflow-y-auto p-4 rounded-lg border bg-muted/20">
                {testMessages.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>No messages yet. Send a test message to see how your agent responds.</p>
                  </div>
                ) : (
                  testMessages.map((message, index) => (
                    <div
                      key={index}
                      className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[80%] rounded-lg p-3 ${
                          message.role === "user"
                            ? "bg-pink-100 dark:bg-pink-900/40 text-pink-900 dark:text-pink-100"
                            : "bg-muted"
                        }`}
                      >
                        <p className="text-sm">{message.content}</p>
                      </div>
                    </div>
                  ))
                )}
                {isTesting && (
                  <div className="flex justify-start">
                    <div className="bg-muted rounded-lg p-3">
                      <Loader2 className="h-4 w-4 animate-spin" />
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                <Input
                  placeholder="Type a test message..."
                  value={testInput}
                  onChange={(e) => setTestInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault()
                      handleTest()
                    }
                  }}
                  disabled={isTesting}
                />
                <Button onClick={handleTest} disabled={isTesting}>
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Run History</CardTitle>
              <CardDescription>
                Recent executions of this agent
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {runs.map((run) => (
                  <div
                    key={run.id}
                    className="p-4 rounded-lg border hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Badge
                          variant="outline"
                          className={
                            run.status === "success"
                              ? "bg-green-100 dark:bg-green-900/40 border-green-300 dark:border-green-700 text-green-700 dark:text-green-300"
                              : "bg-red-100 dark:bg-red-900/40 border-red-300 dark:border-red-700 text-red-700 dark:text-red-300"
                          }
                        >
                          {run.status === "success" ? (
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                          ) : (
                            <XCircle className="h-3 w-3 mr-1" />
                          )}
                          {run.status}
                        </Badge>
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatDate(run.timestamp)}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Activity className="h-3 w-3" />
                          {formatDuration(run.duration)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Code className="h-3 w-3" />
                          {run.tokensUsed} tokens
                        </span>
                      </div>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div>
                        <span className="font-medium">Input:</span>
                        <p className="text-muted-foreground mt-1">{run.input}</p>
                      </div>
                      <div>
                        <span className="font-medium">Output:</span>
                        <p className="text-muted-foreground mt-1">{run.output}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Total Runs</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">1,234</div>
                <p className="text-xs text-muted-foreground mt-1">
                  <span className="text-green-600">+12%</span> from last month
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">98.5%</div>
                <p className="text-xs text-muted-foreground mt-1">
                  <span className="text-green-600">+2.1%</span> from last month
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">1.2s</div>
                <p className="text-xs text-muted-foreground mt-1">
                  <span className="text-green-600">-0.3s</span> from last month
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Tokens Used</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">45.2K</div>
                <p className="text-xs text-muted-foreground mt-1">
                  <span className="text-green-600">+8%</span> from last month
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Performance Metrics</CardTitle>
              <CardDescription>
                Detailed analytics coming soon
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64 flex items-center justify-center border rounded-lg bg-muted/20">
                <div className="text-center">
                  <TrendingUp className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-50" />
                  <p className="text-muted-foreground">Charts and graphs will be displayed here</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
