/**
 * n8n API Client
 * Handles communication with n8n instances
 */

export interface N8nCredentials {
  instanceUrl: string;
  apiKey: string;
}

export interface N8nWorkflow {
  id: string;
  name: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
  nodes?: any[];
  connections?: any;
  settings?: any;
  tags?: Array<{ id: string; name: string }>;
}

export interface N8nExecution {
  id: string;
  finished: boolean;
  mode: string;
  startedAt: string;
  stoppedAt?: string;
  workflowId: string;
  status: "success" | "error" | "waiting" | "running";
  data?: any;
}

export interface N8nWebhook {
  webhookId: string;
  node: string;
  path: string;
  httpMethod: string;
}

export class N8nClient {
  private baseUrl: string;
  private apiKey: string;

  constructor(credentials: N8nCredentials) {
    // Normalize URL
    this.baseUrl = credentials.instanceUrl.replace(/\/$/, "");
    this.apiKey = credentials.apiKey;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}/api/v1${endpoint}`;

    const response = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        "X-N8N-API-KEY": this.apiKey,
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.text().catch(() => "Unknown error");
      throw new Error(`n8n API error (${response.status}): ${error}`);
    }

    return response.json();
  }

  /**
   * Verify connection to n8n instance
   */
  async verifyConnection(): Promise<{ success: boolean; version?: string; error?: string }> {
    try {
      // Try to get workflows as a connection test
      await this.request<any>("/workflows?limit=1");
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Get all workflows
   */
  async getWorkflows(options?: {
    active?: boolean;
    limit?: number;
    cursor?: string;
  }): Promise<{ data: N8nWorkflow[]; nextCursor?: string }> {
    const params = new URLSearchParams();
    if (options?.limit) params.set("limit", String(options.limit));
    if (options?.cursor) params.set("cursor", options.cursor);
    if (options?.active !== undefined) params.set("active", String(options.active));

    const query = params.toString();
    return this.request<{ data: N8nWorkflow[]; nextCursor?: string }>(
      `/workflows${query ? `?${query}` : ""}`
    );
  }

  /**
   * Get a specific workflow
   */
  async getWorkflow(workflowId: string): Promise<N8nWorkflow> {
    return this.request<N8nWorkflow>(`/workflows/${workflowId}`);
  }

  /**
   * Activate a workflow
   */
  async activateWorkflow(workflowId: string): Promise<N8nWorkflow> {
    return this.request<N8nWorkflow>(`/workflows/${workflowId}/activate`, {
      method: "POST",
    });
  }

  /**
   * Deactivate a workflow
   */
  async deactivateWorkflow(workflowId: string): Promise<N8nWorkflow> {
    return this.request<N8nWorkflow>(`/workflows/${workflowId}/deactivate`, {
      method: "POST",
    });
  }

  /**
   * Execute a workflow
   */
  async executeWorkflow(
    workflowId: string,
    data?: Record<string, any>
  ): Promise<{ executionId: string }> {
    return this.request<{ executionId: string }>(`/workflows/${workflowId}/run`, {
      method: "POST",
      body: JSON.stringify(data || {}),
    });
  }

  /**
   * Get workflow executions
   */
  async getExecutions(options?: {
    workflowId?: string;
    status?: "success" | "error" | "waiting" | "running";
    limit?: number;
    cursor?: string;
  }): Promise<{ data: N8nExecution[]; nextCursor?: string }> {
    const params = new URLSearchParams();
    if (options?.workflowId) params.set("workflowId", options.workflowId);
    if (options?.status) params.set("status", options.status);
    if (options?.limit) params.set("limit", String(options.limit));
    if (options?.cursor) params.set("cursor", options.cursor);

    const query = params.toString();
    return this.request<{ data: N8nExecution[]; nextCursor?: string }>(
      `/executions${query ? `?${query}` : ""}`
    );
  }

  /**
   * Get a specific execution
   */
  async getExecution(executionId: string): Promise<N8nExecution> {
    return this.request<N8nExecution>(`/executions/${executionId}`);
  }

  /**
   * Create a workflow from JSON
   */
  async createWorkflow(workflow: {
    name: string;
    nodes: any[];
    connections: any;
    settings?: any;
  }): Promise<N8nWorkflow> {
    return this.request<N8nWorkflow>("/workflows", {
      method: "POST",
      body: JSON.stringify(workflow),
    });
  }

  /**
   * Update a workflow
   */
  async updateWorkflow(
    workflowId: string,
    updates: Partial<{
      name: string;
      nodes: any[];
      connections: any;
      settings: any;
    }>
  ): Promise<N8nWorkflow> {
    return this.request<N8nWorkflow>(`/workflows/${workflowId}`, {
      method: "PATCH",
      body: JSON.stringify(updates),
    });
  }

  /**
   * Delete a workflow
   */
  async deleteWorkflow(workflowId: string): Promise<void> {
    await this.request<void>(`/workflows/${workflowId}`, {
      method: "DELETE",
    });
  }

  /**
   * Get webhooks for a workflow
   */
  async getWebhooks(workflowId: string): Promise<N8nWebhook[]> {
    const workflow = await this.getWorkflow(workflowId);
    const webhookNodes = (workflow.nodes || []).filter(
      (node: any) =>
        node.type === "n8n-nodes-base.webhook" ||
        node.type.includes("webhook")
    );

    return webhookNodes.map((node: any) => ({
      webhookId: node.webhookId || node.id,
      node: node.name,
      path: node.parameters?.path || "",
      httpMethod: node.parameters?.httpMethod || "GET",
    }));
  }

  /**
   * Trigger a webhook
   */
  async triggerWebhook(
    webhookPath: string,
    data: Record<string, any>,
    method: string = "POST"
  ): Promise<any> {
    const url = `${this.baseUrl}/webhook/${webhookPath}`;

    const response = await fetch(url, {
      method,
      headers: {
        "Content-Type": "application/json",
      },
      body: method !== "GET" ? JSON.stringify(data) : undefined,
    });

    if (!response.ok) {
      throw new Error(`Webhook trigger failed: ${response.status}`);
    }

    return response.json().catch(() => ({ success: true }));
  }
}

/**
 * Create n8n client from stored integration
 */
export function createN8nClient(integration: {
  n8n_instance_url: string;
  api_key_encrypted: string;
}): N8nClient {
  // In production, decrypt the API key
  // For now, assume it's stored plainly (should be encrypted in production)
  return new N8nClient({
    instanceUrl: integration.n8n_instance_url,
    apiKey: integration.api_key_encrypted,
  });
}
