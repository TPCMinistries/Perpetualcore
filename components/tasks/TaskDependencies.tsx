"use client";

import { useState, useEffect } from "react";
import { Link2, Plus, X, AlertCircle, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

interface Task {
  id: string;
  title: string;
  status: string;
  priority: string;
}

interface Dependency {
  id: string;
  task_id: string;
  depends_on_task_id: string;
  dependency_type: string;
  is_hard: boolean;
  depends_on_task: Task;
}

interface TaskDependenciesProps {
  taskId: string;
  organizationId: string;
}

export function TaskDependencies({ taskId, organizationId }: TaskDependenciesProps) {
  const [dependencies, setDependencies] = useState<Dependency[]>([]);
  const [availableTasks, setAvailableTasks] = useState<Task[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState("");
  const [dependencyType, setDependencyType] = useState("finish_to_start");
  const [isHard, setIsHard] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (taskId) {
      fetchDependencies();
      fetchAvailableTasks();
    }
  }, [taskId]);

  const fetchDependencies = async () => {
    try {
      const response = await fetch(`/api/tasks/${taskId}/dependencies`);
      if (response.ok) {
        const data = await response.json();
        setDependencies(data.dependencies || []);
      }
    } catch (error) {
      console.error("Error fetching dependencies:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableTasks = async () => {
    try {
      const response = await fetch(`/api/tasks?organization_id=${organizationId}`);
      if (response.ok) {
        const data = await response.json();
        // Filter out the current task and already dependent tasks
        const tasks = (data.tasks || []).filter(
          (t: Task) => t.id !== taskId && !dependencies.some(d => d.depends_on_task_id === t.id)
        );
        setAvailableTasks(tasks);
      }
    } catch (error) {
      console.error("Error fetching tasks:", error);
    }
  };

  const handleAddDependency = async () => {
    if (!selectedTaskId) {
      toast.error("Please select a task");
      return;
    }

    setSaving(true);
    try {
      const response = await fetch(`/api/tasks/${taskId}/dependencies`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          depends_on_task_id: selectedTaskId,
          dependency_type: dependencyType,
          is_hard: isHard,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to add dependency");
      }

      toast.success("Dependency added");
      setShowAddForm(false);
      setSelectedTaskId("");
      fetchDependencies();
      fetchAvailableTasks();
    } catch (error: any) {
      console.error("Error adding dependency:", error);
      toast.error(error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveDependency = async (dependencyId: string) => {
    if (!confirm("Remove this dependency?")) return;

    try {
      const response = await fetch(`/api/tasks/${taskId}/dependencies/${dependencyId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to remove dependency");
      }

      toast.success("Dependency removed");
      fetchDependencies();
      fetchAvailableTasks();
    } catch (error) {
      console.error("Error removing dependency:", error);
      toast.error("Failed to remove dependency");
    }
  };

  const getDependencyTypeLabel = (type: string) => {
    switch (type) {
      case "finish_to_start":
        return "Finish to Start";
      case "start_to_start":
        return "Start to Start";
      case "finish_to_finish":
        return "Finish to Finish";
      case "start_to_finish":
        return "Start to Finish";
      default:
        return type;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800";
      case "in_progress":
        return "bg-blue-100 text-blue-800";
      case "todo":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-6 text-center text-sm text-muted-foreground">
          Loading dependencies...
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base flex items-center gap-2">
          <Link2 className="h-4 w-4" />
          Dependencies
        </CardTitle>
        {!showAddForm && availableTasks.length > 0 && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setShowAddForm(true)}
          >
            <Plus className="h-4 w-4 mr-1" />
            Add
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Add Dependency Form */}
        {showAddForm && (
          <div className="border rounded-lg p-4 space-y-4 bg-muted/50">
            <div className="flex items-center justify-between">
              <Label>Add Dependency</Label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setShowAddForm(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div>
              <Label>This task depends on</Label>
              <Select value={selectedTaskId} onValueChange={setSelectedTaskId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a task" />
                </SelectTrigger>
                <SelectContent>
                  {availableTasks.map((task) => (
                    <SelectItem key={task.id} value={task.id}>
                      {task.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Type</Label>
              <Select value={dependencyType} onValueChange={setDependencyType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="finish_to_start">Finish to Start (FS)</SelectItem>
                  <SelectItem value="start_to_start">Start to Start (SS)</SelectItem>
                  <SelectItem value="finish_to_finish">Finish to Finish (FF)</SelectItem>
                  <SelectItem value="start_to_finish">Start to Finish (SF)</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-1">
                {dependencyType === "finish_to_start" && "This task can't start until the other finishes"}
                {dependencyType === "start_to_start" && "This task can't start until the other starts"}
                {dependencyType === "finish_to_finish" && "This task can't finish until the other finishes"}
                {dependencyType === "start_to_finish" && "This task can't finish until the other starts"}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isHard"
                checked={isHard}
                onChange={(e) => setIsHard(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300"
              />
              <Label htmlFor="isHard" className="cursor-pointer">
                Hard dependency (blocks task)
              </Label>
            </div>

            <Button onClick={handleAddDependency} disabled={saving} className="w-full">
              {saving ? "Adding..." : "Add Dependency"}
            </Button>
          </div>
        )}

        {/* Dependencies List */}
        {dependencies.length === 0 ? (
          <div className="text-center py-6 text-sm text-muted-foreground">
            {showAddForm ? "No dependencies yet" : "This task has no dependencies"}
          </div>
        ) : (
          <div className="space-y-2">
            {dependencies.map((dep) => (
              <div
                key={dep.id}
                className="flex items-start justify-between p-3 border rounded-lg hover:bg-accent transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    {dep.depends_on_task.status === "completed" ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-yellow-600" />
                    )}
                    <span className="font-medium truncate">
                      {dep.depends_on_task.title}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap text-xs">
                    <Badge variant="outline" className={getStatusColor(dep.depends_on_task.status)}>
                      {dep.depends_on_task.status}
                    </Badge>
                    <Badge variant="secondary">
                      {getDependencyTypeLabel(dep.dependency_type)}
                    </Badge>
                    {dep.is_hard && (
                      <Badge variant="destructive">Hard</Badge>
                    )}
                  </div>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemoveDependency(dep.id)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
