"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BookOpen,
  Code,
  Copy,
  CheckCircle2,
  Search,
  ExternalLink,
  Key,
  Zap,
  Shield,
  Globe,
  Terminal,
  FileText,
  Lock,
  Clock,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";

interface ApiEndpoint {
  method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
  path: string;
  description: string;
  auth: boolean;
  rateLimit: string;
}

interface CodeExample {
  language: string;
  code: string;
}

export default function ApiDocsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const endpoints: ApiEndpoint[] = [
    {
      method: "GET",
      path: "/api/v1/agents",
      description: "List all AI agents",
      auth: true,
      rateLimit: "100/min",
    },
    {
      method: "POST",
      path: "/api/v1/agents",
      description: "Create a new AI agent",
      auth: true,
      rateLimit: "20/min",
    },
    {
      method: "GET",
      path: "/api/v1/agents/:id",
      description: "Get agent details",
      auth: true,
      rateLimit: "100/min",
    },
    {
      method: "PUT",
      path: "/api/v1/agents/:id",
      description: "Update an agent",
      auth: true,
      rateLimit: "20/min",
    },
    {
      method: "DELETE",
      path: "/api/v1/agents/:id",
      description: "Delete an agent",
      auth: true,
      rateLimit: "10/min",
    },
    {
      method: "POST",
      path: "/api/v1/chat/completions",
      description: "Create a chat completion",
      auth: true,
      rateLimit: "50/min",
    },
    {
      method: "GET",
      path: "/api/v1/workflows",
      description: "List all workflows",
      auth: true,
      rateLimit: "100/min",
    },
    {
      method: "POST",
      path: "/api/v1/workflows/execute",
      description: "Execute a workflow",
      auth: true,
      rateLimit: "30/min",
    },
  ];

  const codeExamples: Record<string, CodeExample[]> = {
    authentication: [
      {
        language: "curl",
        code: `curl https://api.aios.com/v1/agents \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json"`,
      },
      {
        language: "javascript",
        code: `const response = await fetch('https://api.aios.com/v1/agents', {
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY',
    'Content-Type': 'application/json'
  }
});

const data = await response.json();`,
      },
      {
        language: "python",
        code: `import requests

headers = {
    'Authorization': 'Bearer YOUR_API_KEY',
    'Content-Type': 'application/json'
}

response = requests.get('https://api.aios.com/v1/agents', headers=headers)
data = response.json()`,
      },
    ],
    createAgent: [
      {
        language: "curl",
        code: `curl -X POST https://api.aios.com/v1/agents \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "name": "Customer Support Agent",
    "model": "gpt-4",
    "instructions": "You are a helpful customer support agent."
  }'`,
      },
      {
        language: "javascript",
        code: `const response = await fetch('https://api.aios.com/v1/agents', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    name: 'Customer Support Agent',
    model: 'gpt-4',
    instructions: 'You are a helpful customer support agent.'
  })
});

const agent = await response.json();`,
      },
      {
        language: "python",
        code: `import requests

headers = {
    'Authorization': 'Bearer YOUR_API_KEY',
    'Content-Type': 'application/json'
}

data = {
    'name': 'Customer Support Agent',
    'model': 'gpt-4',
    'instructions': 'You are a helpful customer support agent.'
}

response = requests.post('https://api.aios.com/v1/agents',
                        headers=headers,
                        json=data)
agent = response.json()`,
      },
    ],
  };

  function handleCopyCode(code: string, id: string) {
    navigator.clipboard.writeText(code);
    setCopiedCode(id);
    toast.success("Code copied to clipboard");
    setTimeout(() => setCopiedCode(null), 2000);
  }

  function getMethodColor(method: string) {
    const colors = {
      GET: "bg-green-50 border-green-300 text-green-700",
      POST: "bg-blue-50 border-blue-300 text-blue-700",
      PUT: "bg-yellow-50 border-yellow-300 text-yellow-700",
      DELETE: "bg-red-50 border-red-300 text-red-700",
      PATCH: "bg-purple-50 border-purple-300 text-purple-700",
    };
    return colors[method as keyof typeof colors] || "bg-gray-50 border-gray-300 text-gray-700";
  }

  const filteredEndpoints = endpoints.filter(
    (endpoint) =>
      endpoint.path.toLowerCase().includes(searchQuery.toLowerCase()) ||
      endpoint.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-50 via-cyan-50 to-teal-50 dark:from-blue-950/20 dark:via-cyan-950/20 dark:to-teal-950/20 border border-blue-100 dark:border-blue-900/20 p-8 shadow-lg">
        <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
        <div className="relative flex items-center gap-4">
          <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center shadow-lg">
            <BookOpen className="h-8 w-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-900 via-cyan-800 to-teal-900 dark:from-blue-100 dark:via-cyan-100 dark:to-teal-100 bg-clip-text text-transparent">
              API Documentation
            </h1>
            <p className="text-blue-700 dark:text-blue-300 mt-1">
              Complete reference for the Perpetual Core API
            </p>
          </div>
        </div>
      </div>

      {/* Quick Links */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="hover:shadow-lg transition-all cursor-pointer">
          <CardContent className="pt-6">
            <Key className="h-8 w-8 text-blue-600 mb-3" />
            <h3 className="font-semibold mb-1">Authentication</h3>
            <p className="text-sm text-muted-foreground">API key setup & usage</p>
          </CardContent>
        </Card>
        <Card className="hover:shadow-lg transition-all cursor-pointer">
          <CardContent className="pt-6">
            <Zap className="h-8 w-8 text-purple-600 mb-3" />
            <h3 className="font-semibold mb-1">Rate Limits</h3>
            <p className="text-sm text-muted-foreground">Request quotas & limits</p>
          </CardContent>
        </Card>
        <Card className="hover:shadow-lg transition-all cursor-pointer">
          <CardContent className="pt-6">
            <Shield className="h-8 w-8 text-green-600 mb-3" />
            <h3 className="font-semibold mb-1">Best Practices</h3>
            <p className="text-sm text-muted-foreground">Security & optimization</p>
          </CardContent>
        </Card>
        <Card className="hover:shadow-lg transition-all cursor-pointer">
          <CardContent className="pt-6">
            <Globe className="h-8 w-8 text-orange-600 mb-3" />
            <h3 className="font-semibold mb-1">SDKs</h3>
            <p className="text-sm text-muted-foreground">Client libraries</p>
          </CardContent>
        </Card>
      </div>

      {/* Getting Started */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Terminal className="h-5 w-5" />
            Getting Started
          </CardTitle>
          <CardDescription>Quick start guide to using the Perpetual Core API</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <h4 className="font-semibold flex items-center gap-2">
              <span className="flex items-center justify-center h-6 w-6 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 text-sm">
                1
              </span>
              Get Your API Key
            </h4>
            <p className="text-sm text-muted-foreground ml-8">
              Navigate to{" "}
              <a href="/dashboard/developer/api-keys" className="text-blue-600 hover:underline">
                API Keys
              </a>{" "}
              to create a new API key. Keep it secure and never share it publicly.
            </p>
          </div>

          <div className="space-y-2">
            <h4 className="font-semibold flex items-center gap-2">
              <span className="flex items-center justify-center h-6 w-6 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 text-sm">
                2
              </span>
              Make Your First Request
            </h4>
            <Tabs defaultValue="curl" className="ml-8">
              <TabsList>
                <TabsTrigger value="curl">cURL</TabsTrigger>
                <TabsTrigger value="javascript">JavaScript</TabsTrigger>
                <TabsTrigger value="python">Python</TabsTrigger>
              </TabsList>
              {Object.entries(codeExamples.authentication).map(([_, example]) => (
                <TabsContent key={example.language} value={example.language}>
                  <div className="relative">
                    <pre className="p-4 bg-slate-950 text-slate-50 rounded-lg overflow-x-auto text-sm">
                      <code>{example.code}</code>
                    </pre>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="absolute top-2 right-2 text-slate-400 hover:text-slate-50"
                      onClick={() => handleCopyCode(example.code, `auth-${example.language}`)}
                    >
                      {copiedCode === `auth-${example.language}` ? (
                        <CheckCircle2 className="h-4 w-4" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </TabsContent>
              ))}
            </Tabs>
          </div>

          <div className="space-y-2">
            <h4 className="font-semibold flex items-center gap-2">
              <span className="flex items-center justify-center h-6 w-6 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 text-sm">
                3
              </span>
              Explore Endpoints
            </h4>
            <p className="text-sm text-muted-foreground ml-8">
              Browse the API reference below to discover all available endpoints and their parameters.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* API Reference */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Code className="h-5 w-5" />
                API Reference
              </CardTitle>
              <CardDescription>Complete list of API endpoints</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline">v1.0</Badge>
              <Badge className="bg-green-50 border-green-300 text-green-700">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Stable
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search endpoints..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Endpoints List */}
          <div className="space-y-3">
            {filteredEndpoints.map((endpoint, index) => (
              <Card key={index} className="hover:shadow-md transition-all">
                <CardContent className="pt-4">
                  <div className="flex items-start gap-4">
                    <Badge variant="outline" className={`${getMethodColor(endpoint.method)} font-mono`}>
                      {endpoint.method}
                    </Badge>
                    <div className="flex-1">
                      <code className="text-sm font-mono font-semibold">{endpoint.path}</code>
                      <p className="text-sm text-muted-foreground mt-1">{endpoint.description}</p>
                      <div className="flex items-center gap-4 mt-2">
                        {endpoint.auth && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Lock className="h-3 w-3" />
                            <span>Auth required</span>
                          </div>
                        )}
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          <span>Rate limit: {endpoint.rateLimit}</span>
                        </div>
                      </div>
                    </div>
                    <Button size="sm" variant="ghost">
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Code Examples */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Code Examples
          </CardTitle>
          <CardDescription>Common use cases and implementation examples</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h4 className="font-semibold mb-3">Creating an AI Agent</h4>
            <Tabs defaultValue="curl">
              <TabsList>
                <TabsTrigger value="curl">cURL</TabsTrigger>
                <TabsTrigger value="javascript">JavaScript</TabsTrigger>
                <TabsTrigger value="python">Python</TabsTrigger>
              </TabsList>
              {Object.entries(codeExamples.createAgent).map(([_, example]) => (
                <TabsContent key={example.language} value={example.language}>
                  <div className="relative">
                    <pre className="p-4 bg-slate-950 text-slate-50 rounded-lg overflow-x-auto text-sm">
                      <code>{example.code}</code>
                    </pre>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="absolute top-2 right-2 text-slate-400 hover:text-slate-50"
                      onClick={() => handleCopyCode(example.code, `create-${example.language}`)}
                    >
                      {copiedCode === `create-${example.language}` ? (
                        <CheckCircle2 className="h-4 w-4" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </TabsContent>
              ))}
            </Tabs>
          </div>
        </CardContent>
      </Card>

      {/* Rate Limits & Error Handling */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Zap className="h-5 w-5" />
              Rate Limits
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Free Tier:</span>
              <span className="font-semibold">100 requests/min</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Pro Tier:</span>
              <span className="font-semibold">1,000 requests/min</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Enterprise:</span>
              <span className="font-semibold">Custom limits</span>
            </div>
            <div className="pt-3 border-t">
              <p className="text-xs text-muted-foreground">
                Rate limits are enforced per API key. Exceeded limits return a 429 status code.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-900/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <AlertCircle className="h-5 w-5 text-amber-600" />
              Error Handling
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="text-sm">
              <code className="bg-amber-100 dark:bg-amber-900 px-2 py-1 rounded text-xs">400</code>
              <span className="ml-2 text-muted-foreground">Bad Request - Invalid parameters</span>
            </div>
            <div className="text-sm">
              <code className="bg-amber-100 dark:bg-amber-900 px-2 py-1 rounded text-xs">401</code>
              <span className="ml-2 text-muted-foreground">Unauthorized - Invalid API key</span>
            </div>
            <div className="text-sm">
              <code className="bg-amber-100 dark:bg-amber-900 px-2 py-1 rounded text-xs">429</code>
              <span className="ml-2 text-muted-foreground">Rate Limit Exceeded</span>
            </div>
            <div className="text-sm">
              <code className="bg-amber-100 dark:bg-amber-900 px-2 py-1 rounded text-xs">500</code>
              <span className="ml-2 text-muted-foreground">Server Error</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* SDKs */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Official SDKs
          </CardTitle>
          <CardDescription>Client libraries for popular languages</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-3">
            <Button variant="outline" className="justify-start">
              <Code className="h-4 w-4 mr-2" />
              JavaScript SDK
            </Button>
            <Button variant="outline" className="justify-start">
              <Code className="h-4 w-4 mr-2" />
              Python SDK
            </Button>
            <Button variant="outline" className="justify-start">
              <Code className="h-4 w-4 mr-2" />
              Go SDK
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
