"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { TableViewer } from "@/components/data-explorer/TableViewer";
import {
  Database,
  Table2,
  CheckSquare,
  Users,
  FolderKanban,
  Calendar,
  FileText,
  Mail,
  MessageSquare,
  Activity,
  Zap,
  Bell,
  Briefcase,
  Lightbulb,
  ArrowLeft,
} from "lucide-react";
import { toast } from "sonner";

interface TableInfo {
  name: string;
  displayName: string;
}

const TABLE_ICONS: Record<string, React.ElementType> = {
  tasks: CheckSquare,
  projects: FolderKanban,
  contacts: Users,
  calendar_events: Calendar,
  documents: FileText,
  notes: FileText,
  emails: Mail,
  conversations: MessageSquare,
  activity_feed: Activity,
  automations: Zap,
  automation_executions: Zap,
  notifications: Bell,
  workspaces: Briefcase,
  ai_insights: Lightbulb,
};

const TABLE_DESCRIPTIONS: Record<string, string> = {
  tasks: "Your tasks and to-dos",
  projects: "Project management data",
  contacts: "People in your network",
  calendar_events: "Calendar and meetings",
  documents: "Stored documents",
  notes: "Quick notes",
  emails: "Email messages",
  conversations: "Chat conversations",
  activity_feed: "Activity history",
  automations: "Automation workflows",
  automation_executions: "Automation run history",
  notifications: "System notifications",
  workspaces: "Workspace configurations",
  ai_insights: "AI-generated insights",
};

export default function DataExplorerPage() {
  const [tables, setTables] = useState<TableInfo[]>([]);
  const [selectedTable, setSelectedTable] = useState<TableInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTables();
  }, []);

  const fetchTables = async () => {
    try {
      const response = await fetch("/api/data-explorer?action=tables");
      if (!response.ok) throw new Error("Failed to fetch tables");

      const data = await response.json();
      setTables(data.tables || []);
    } catch (error) {
      console.error("Error fetching tables:", error);
      toast.error("Failed to load tables");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center gap-3">
          <Database className="h-8 w-8" />
          <div>
            <h1 className="text-2xl font-bold">Data Explorer</h1>
            <p className="text-muted-foreground">Browse your database tables</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-3">
                <Skeleton className="h-5 w-24" />
                <Skeleton className="h-4 w-full mt-2" />
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (selectedTable) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => setSelectedTable(null)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-3">
            {(() => {
              const Icon = TABLE_ICONS[selectedTable.name] || Table2;
              return <Icon className="h-6 w-6" />;
            })()}
            <div>
              <h1 className="text-2xl font-bold">{selectedTable.displayName}</h1>
              <p className="text-sm text-muted-foreground">
                {TABLE_DESCRIPTIONS[selectedTable.name] || "View and manage data"}
              </p>
            </div>
          </div>
        </div>

        <TableViewer table={selectedTable.name} tableName={selectedTable.displayName} />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Database className="h-8 w-8" />
        <div>
          <h1 className="text-2xl font-bold">Data Explorer</h1>
          <p className="text-muted-foreground">
            Browse and manage your database tables with a spreadsheet-like interface
          </p>
        </div>
      </div>

      {/* Info Card */}
      <Card className="bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
        <CardContent className="pt-4">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
              <Database className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="space-y-1">
              <p className="font-medium text-blue-900 dark:text-blue-100">
                Secure Data Access
              </p>
              <p className="text-sm text-blue-700 dark:text-blue-300">
                You can only view and edit data you own. All queries respect row-level security policies.
                Double-click any cell to edit it directly.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Table Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {tables.map((table) => {
          const Icon = TABLE_ICONS[table.name] || Table2;
          return (
            <Card
              key={table.name}
              className="cursor-pointer transition-all hover:shadow-md hover:border-slate-400 dark:hover:border-slate-600"
              onClick={() => setSelectedTable(table)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <CardTitle className="text-base">{table.displayName}</CardTitle>
                  </div>
                </div>
                <CardDescription className="mt-2">
                  {TABLE_DESCRIPTIONS[table.name] || "View and manage data"}
                </CardDescription>
              </CardHeader>
            </Card>
          );
        })}
      </div>

      {tables.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <Database className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No accessible tables found</p>
          </CardContent>
        </Card>
      )}

      {/* Features */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Features</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="flex items-start gap-2">
              <Badge variant="secondary">Search</Badge>
              <span className="text-muted-foreground">
                Full-text search across all text fields
              </span>
            </div>
            <div className="flex items-start gap-2">
              <Badge variant="secondary">Sort</Badge>
              <span className="text-muted-foreground">
                Click column headers to sort by any field
              </span>
            </div>
            <div className="flex items-start gap-2">
              <Badge variant="secondary">Edit</Badge>
              <span className="text-muted-foreground">
                Double-click cells to edit values inline
              </span>
            </div>
            <div className="flex items-start gap-2">
              <Badge variant="secondary">Export</Badge>
              <span className="text-muted-foreground">
                Download table data as CSV file
              </span>
            </div>
            <div className="flex items-start gap-2">
              <Badge variant="secondary">Paginate</Badge>
              <span className="text-muted-foreground">
                Navigate through large datasets easily
              </span>
            </div>
            <div className="flex items-start gap-2">
              <Badge variant="secondary">Details</Badge>
              <span className="text-muted-foreground">
                View full row details including JSON fields
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
