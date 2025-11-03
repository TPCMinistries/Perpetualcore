"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  CheckCircle2,
  XCircle,
  AlertCircle,
  Clock,
  Activity,
  Server,
  Database,
  Zap,
  Globe,
  Cloud,
  Bell,
  ExternalLink,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface ServiceStatus {
  name: string;
  status: "operational" | "degraded" | "partial_outage" | "major_outage";
  uptime: number;
  responseTime: number;
  icon: any;
  description: string;
}

interface Incident {
  id: string;
  title: string;
  status: "investigating" | "identified" | "monitoring" | "resolved";
  severity: "minor" | "major" | "critical";
  description: string;
  updates: {
    timestamp: string;
    message: string;
    status: string;
  }[];
  created_at: string;
  resolved_at: string | null;
}

export default function StatusPage() {
  const [services, setServices] = useState<ServiceStatus[]>([
    {
      name: "API",
      status: "operational",
      uptime: 99.98,
      responseTime: 145,
      icon: Zap,
      description: "Core API endpoints",
    },
    {
      name: "Web Application",
      status: "operational",
      uptime: 99.99,
      responseTime: 234,
      icon: Globe,
      description: "Dashboard and web interface",
    },
    {
      name: "Database",
      status: "operational",
      uptime: 99.97,
      responseTime: 23,
      icon: Database,
      description: "Primary database cluster",
    },
    {
      name: "AI Processing",
      status: "operational",
      uptime: 99.95,
      responseTime: 856,
      icon: Activity,
      description: "AI model inference and training",
    },
    {
      name: "File Storage",
      status: "operational",
      uptime: 99.99,
      responseTime: 89,
      icon: Cloud,
      description: "Document and media storage",
    },
    {
      name: "Webhooks",
      status: "operational",
      uptime: 99.96,
      responseTime: 178,
      icon: Server,
      description: "Event notification delivery",
    },
  ]);

  const [incidents, setIncidents] = useState<Incident[]>([
    {
      id: "1",
      title: "Scheduled Maintenance - Database Optimization",
      status: "resolved",
      severity: "minor",
      description: "Planned database optimization to improve query performance",
      created_at: "2025-01-20T02:00:00Z",
      resolved_at: "2025-01-20T04:30:00Z",
      updates: [
        {
          timestamp: "2025-01-20T04:30:00Z",
          message: "Maintenance completed successfully. All systems operational.",
          status: "resolved",
        },
        {
          timestamp: "2025-01-20T02:00:00Z",
          message: "Maintenance window started. Expected duration: 2-3 hours.",
          status: "monitoring",
        },
      ],
    },
    {
      id: "2",
      title: "API Rate Limiting Issues",
      status: "resolved",
      severity: "major",
      description: "Some users experiencing intermittent 429 errors",
      created_at: "2025-01-15T14:23:00Z",
      resolved_at: "2025-01-15T15:45:00Z",
      updates: [
        {
          timestamp: "2025-01-15T15:45:00Z",
          message: "Issue resolved. Rate limiting thresholds have been adjusted and are working as expected.",
          status: "resolved",
        },
        {
          timestamp: "2025-01-15T14:45:00Z",
          message: "We've identified the issue with our rate limiting service and are applying a fix.",
          status: "identified",
        },
        {
          timestamp: "2025-01-15T14:23:00Z",
          message: "We're investigating reports of API rate limiting errors.",
          status: "investigating",
        },
      ],
    },
  ]);

  const uptimeData = [
    { date: "Jan 20", uptime: 100 },
    { date: "Jan 19", uptime: 100 },
    { date: "Jan 18", uptime: 99.98 },
    { date: "Jan 17", uptime: 100 },
    { date: "Jan 16", uptime: 100 },
    { date: "Jan 15", uptime: 99.87 },
    { date: "Jan 14", uptime: 100 },
    { date: "Jan 13", uptime: 100 },
    { date: "Jan 12", uptime: 100 },
    { date: "Jan 11", uptime: 100 },
    { date: "Jan 10", uptime: 99.95 },
    { date: "Jan 9", uptime: 100 },
    { date: "Jan 8", uptime: 100 },
    { date: "Jan 7", uptime: 100 },
  ];

  function getStatusBadge(status: string) {
    const variants = {
      operational: {
        icon: CheckCircle2,
        className: "bg-green-50 border-green-300 text-green-700",
        label: "Operational",
      },
      degraded: {
        icon: AlertCircle,
        className: "bg-yellow-50 border-yellow-300 text-yellow-700",
        label: "Degraded Performance",
      },
      partial_outage: {
        icon: AlertCircle,
        className: "bg-orange-50 border-orange-300 text-orange-700",
        label: "Partial Outage",
      },
      major_outage: {
        icon: XCircle,
        className: "bg-red-50 border-red-300 text-red-700",
        label: "Major Outage",
      },
    };
    const config = variants[status as keyof typeof variants] || variants.operational;
    const Icon = config.icon;

    return (
      <Badge variant="outline" className={config.className}>
        <Icon className="h-3 w-3 mr-1" />
        {config.label}
      </Badge>
    );
  }

  function getIncidentStatusBadge(status: string) {
    const variants = {
      investigating: { className: "bg-yellow-50 border-yellow-300 text-yellow-700" },
      identified: { className: "bg-orange-50 border-orange-300 text-orange-700" },
      monitoring: { className: "bg-blue-50 border-blue-300 text-blue-700" },
      resolved: { className: "bg-green-50 border-green-300 text-green-700" },
    };
    const config = variants[status as keyof typeof variants] || variants.investigating;

    return (
      <Badge variant="outline" className={config.className}>
        {status.charAt(0).toUpperCase() + status.slice(1).replace("_", " ")}
      </Badge>
    );
  }

  function getSeverityBadge(severity: string) {
    const variants = {
      minor: { className: "bg-blue-50 border-blue-300 text-blue-700" },
      major: { className: "bg-orange-50 border-orange-300 text-orange-700" },
      critical: { className: "bg-red-50 border-red-300 text-red-700" },
    };
    const config = variants[severity as keyof typeof variants] || variants.minor;

    return (
      <Badge variant="outline" className={config.className}>
        {severity.charAt(0).toUpperCase() + severity.slice(1)}
      </Badge>
    );
  }

  const allOperational = services.every((s) => s.status === "operational");
  const overallUptime = (services.reduce((acc, s) => acc + s.uptime, 0) / services.length).toFixed(2);

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6 max-w-6xl space-y-6">
        {/* Header */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50 dark:from-emerald-950/20 dark:via-green-950/20 dark:to-teal-950/20 border border-emerald-100 dark:border-emerald-900/20 p-8 shadow-lg">
          <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
          <div className="relative">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center shadow-lg">
                  <Activity className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-900 via-green-800 to-teal-900 dark:from-emerald-100 dark:via-green-100 dark:to-teal-100 bg-clip-text text-transparent">
                    System Status
                  </h1>
                  <p className="text-emerald-700 dark:text-emerald-300 mt-1">
                    Real-time status and uptime monitoring
                  </p>
                </div>
              </div>
              <Button variant="outline" className="shadow-md">
                <Bell className="h-4 w-4 mr-2" />
                Subscribe to Updates
              </Button>
            </div>

            <div className="flex items-center gap-3 mt-6">
              {allOperational ? (
                <>
                  <CheckCircle2 className="h-6 w-6 text-green-600" />
                  <div>
                    <p className="text-lg font-semibold text-green-900 dark:text-green-100">
                      All Systems Operational
                    </p>
                    <p className="text-sm text-green-700 dark:text-green-300">
                      {overallUptime}% uptime over the last 30 days
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <AlertCircle className="h-6 w-6 text-orange-600" />
                  <div>
                    <p className="text-lg font-semibold text-orange-900 dark:text-orange-100">
                      Some Systems Experiencing Issues
                    </p>
                    <p className="text-sm text-orange-700 dark:text-orange-300">
                      We're working to resolve these as quickly as possible
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Services Status */}
        <Card>
          <CardHeader>
            <CardTitle>Services</CardTitle>
            <CardDescription>Current status of all platform services</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {services.map((service) => {
                const ServiceIcon = service.icon;
                return (
                  <div
                    key={service.name}
                    className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-4 flex-1">
                      <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center flex-shrink-0">
                        <ServiceIcon className="h-5 w-5 text-white" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-medium">{service.name}</p>
                          {getStatusBadge(service.status)}
                        </div>
                        <p className="text-sm text-muted-foreground">{service.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-6 text-sm">
                      <div className="text-right">
                        <p className="text-muted-foreground">Uptime</p>
                        <p className="font-medium">{service.uptime}%</p>
                      </div>
                      <div className="text-right">
                        <p className="text-muted-foreground">Response Time</p>
                        <p className="font-medium">{service.responseTime}ms</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Uptime Chart */}
        <Card>
          <CardHeader>
            <CardTitle>14-Day Uptime History</CardTitle>
            <CardDescription>Daily uptime percentage across all services</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-end justify-between gap-2 h-40">
                {uptimeData.reverse().map((day, index) => {
                  const height = (day.uptime / 100) * 100;
                  const isToday = index === uptimeData.length - 1;
                  return (
                    <div key={day.date} className="flex-1 flex flex-col items-center gap-2">
                      <div className="w-full flex items-end justify-center h-32">
                        <div
                          className={`w-full rounded-t transition-all ${
                            day.uptime >= 99.9
                              ? "bg-green-500"
                              : day.uptime >= 99
                              ? "bg-yellow-500"
                              : "bg-red-500"
                          } ${isToday ? "opacity-100" : "opacity-60 hover:opacity-100"}`}
                          style={{ height: `${height}%` }}
                          title={`${day.date}: ${day.uptime}%`}
                        />
                      </div>
                      <p className="text-xs text-muted-foreground transform -rotate-45 origin-top-left">
                        {day.date}
                      </p>
                    </div>
                  );
                })}
              </div>
              <div className="flex items-center justify-center gap-6 text-sm pt-4 border-t">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded bg-green-500" />
                  <span className="text-muted-foreground">≥99.9% uptime</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded bg-yellow-500" />
                  <span className="text-muted-foreground">99-99.9% uptime</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded bg-red-500" />
                  <span className="text-muted-foreground">&lt;99% uptime</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recent Incidents */}
        <Card>
          <CardHeader>
            <CardTitle>Incident History</CardTitle>
            <CardDescription>Recent incidents and maintenance updates</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {incidents.map((incident) => (
                <div key={incident.id} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold">{incident.title}</h3>
                        {getIncidentStatusBadge(incident.status)}
                        {getSeverityBadge(incident.severity)}
                      </div>
                      <p className="text-sm text-muted-foreground">{incident.description}</p>
                    </div>
                  </div>

                  <div className="space-y-3 mt-4">
                    {incident.updates.map((update, index) => (
                      <div
                        key={index}
                        className="flex gap-3 pl-4 border-l-2 border-muted"
                      >
                        <Clock className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="text-sm font-medium capitalize">
                              {update.status.replace("_", " ")}
                            </p>
                            <span className="text-xs text-muted-foreground">
                              {formatDistanceToNow(new Date(update.timestamp), {
                                addSuffix: true,
                              })}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground">{update.message}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}

              {incidents.length === 0 && (
                <div className="text-center py-12">
                  <CheckCircle2 className="h-12 w-12 mx-auto text-green-600 mb-4" />
                  <h3 className="font-semibold mb-2">No Recent Incidents</h3>
                  <p className="text-sm text-muted-foreground">
                    All systems have been running smoothly
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <Card className="bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-950/20 dark:to-green-950/20 border-emerald-200 dark:border-emerald-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold mb-1">Want real-time updates?</h3>
                <p className="text-sm text-muted-foreground">
                  Subscribe to get notified about incidents and maintenance windows
                </p>
              </div>
              <Button className="bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700">
                <Bell className="h-4 w-4 mr-2" />
                Subscribe
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
