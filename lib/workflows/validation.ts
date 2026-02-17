import type { WorkflowNode, WorkflowEdge } from "@/lib/workflow-engine";

interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export function validateWorkflow(
  nodes: WorkflowNode[],
  edges: WorkflowEdge[]
): ValidationResult {
  const errors: string[] = [];

  if (nodes.length === 0) {
    errors.push("Workflow must have at least one node");
    return { valid: false, errors };
  }

  // Check for at least one input node
  const inputNodes = nodes.filter((n) => n.type === "input");
  if (inputNodes.length === 0) {
    errors.push("Workflow must have at least one Input node");
  }

  // Check for at least one output node
  const outputNodes = nodes.filter((n) => n.type === "output");
  if (outputNodes.length === 0) {
    errors.push("Workflow must have at least one Output node");
  }

  // Check for duplicate node IDs
  const nodeIds = new Set<string>();
  for (const node of nodes) {
    if (nodeIds.has(node.id)) {
      errors.push(`Duplicate node ID: ${node.id}`);
    }
    nodeIds.add(node.id);
  }

  // Build adjacency for connectivity checks
  const outgoing = new Map<string, string[]>();
  const incoming = new Map<string, string[]>();
  for (const node of nodes) {
    outgoing.set(node.id, []);
    incoming.set(node.id, []);
  }

  for (const edge of edges) {
    if (!nodeIds.has(edge.source)) {
      errors.push(`Edge references unknown source node: ${edge.source}`);
      continue;
    }
    if (!nodeIds.has(edge.target)) {
      errors.push(`Edge references unknown target node: ${edge.target}`);
      continue;
    }
    outgoing.get(edge.source)?.push(edge.target);
    incoming.get(edge.target)?.push(edge.source);
  }

  // Check for orphan nodes (not connected to anything, unless it's the only node)
  if (nodes.length > 1) {
    for (const node of nodes) {
      const hasOutgoing = (outgoing.get(node.id)?.length ?? 0) > 0;
      const hasIncoming = (incoming.get(node.id)?.length ?? 0) > 0;
      if (!hasOutgoing && !hasIncoming) {
        errors.push(`Node "${node.data.label}" (${node.id}) is not connected to any other node`);
      }
    }
  }

  // Check all paths from input reach output (BFS from each input)
  if (inputNodes.length > 0 && outputNodes.length > 0) {
    const outputIds = new Set(outputNodes.map((n) => n.id));
    for (const inputNode of inputNodes) {
      const reachable = new Set<string>();
      const queue = [inputNode.id];
      while (queue.length > 0) {
        const current = queue.shift()!;
        if (reachable.has(current)) continue;
        reachable.add(current);
        const neighbors = outgoing.get(current) ?? [];
        for (const neighbor of neighbors) {
          if (!reachable.has(neighbor)) {
            queue.push(neighbor);
          }
        }
      }

      const reachesOutput = [...outputIds].some((id) => reachable.has(id));
      if (!reachesOutput) {
        errors.push(
          `Input node "${inputNode.data.label}" cannot reach any Output node`
        );
      }
    }
  }

  // Cycle detection (topological sort with Kahn's algorithm)
  if (hasCycle(nodes, edges)) {
    errors.push("Workflow contains a cycle - loops are not allowed");
  }

  return { valid: errors.length === 0, errors };
}

function hasCycle(nodes: WorkflowNode[], edges: WorkflowEdge[]): boolean {
  const inDegree = new Map<string, number>();
  const adj = new Map<string, string[]>();

  for (const node of nodes) {
    inDegree.set(node.id, 0);
    adj.set(node.id, []);
  }

  for (const edge of edges) {
    if (!inDegree.has(edge.source) || !inDegree.has(edge.target)) continue;
    adj.get(edge.source)!.push(edge.target);
    inDegree.set(edge.target, (inDegree.get(edge.target) ?? 0) + 1);
  }

  const queue: string[] = [];
  for (const [nodeId, degree] of inDegree.entries()) {
    if (degree === 0) {
      queue.push(nodeId);
    }
  }

  let visited = 0;
  while (queue.length > 0) {
    const current = queue.shift()!;
    visited++;
    for (const neighbor of adj.get(current) ?? []) {
      const newDegree = (inDegree.get(neighbor) ?? 1) - 1;
      inDegree.set(neighbor, newDegree);
      if (newDegree === 0) {
        queue.push(neighbor);
      }
    }
  }

  return visited !== nodes.length;
}
