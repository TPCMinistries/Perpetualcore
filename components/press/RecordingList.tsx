"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowRight, FileVideo2, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PressStatusBadge } from "./PressStatusBadge";
import type { PressProject } from "./types";

function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Date unavailable";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: date.getFullYear() !== new Date().getFullYear() ? "numeric" : undefined,
  }).format(date);
}

export function RecordingList({ projects }: { projects: PressProject[] }) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("active");
  const visibleProjects = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return projects.filter((project) => {
      const matchesStatus = status === "all"
        || (status === "active" ? project.status !== "archived" : project.status === status);
      const matchesQuery = !normalizedQuery
        || project.title.toLowerCase().includes(normalizedQuery)
        || project.assets?.some((asset) => asset.fileName.toLowerCase().includes(normalizedQuery));
      return matchesStatus && matchesQuery;
    });
  }, [projects, query, status]);

  return (
    <section aria-labelledby="recordings-title">
      <div className="mb-4 flex items-end justify-between gap-4">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-zinc-500">Archive</p>
          <h2 id="recordings-title" className="mt-2 text-xl font-semibold tracking-tight text-zinc-950">Recordings</h2>
        </div>
        <p className="text-sm text-zinc-500">{projects.length} {projects.length === 1 ? "recording" : "recordings"}</p>
      </div>

      <div className="mb-4 grid gap-3 border border-zinc-300 bg-white p-4 sm:grid-cols-[minmax(0,1fr)_220px]">
        <div className="space-y-2">
          <Label htmlFor="press-recording-search" className="text-xs text-zinc-600">Search archive</Label>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" aria-hidden />
            <Input
              id="press-recording-search"
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Title or file name"
              className="h-11 rounded-md pl-10"
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="press-recording-status" className="text-xs text-zinc-600">Status</Label>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger id="press-recording-status" className="h-11 rounded-md"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="active">Active recordings</SelectItem>
              <SelectItem value="all">All recordings</SelectItem>
              <SelectItem value="review">Awaiting review</SelectItem>
              <SelectItem value="ready">Ready</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
              <SelectItem value="archived">Archived</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {visibleProjects.length === 0 && (
        <div className="border border-zinc-300 bg-white p-8 text-center">
          <Search className="mx-auto h-6 w-6 text-zinc-400" aria-hidden />
          <h3 className="mt-3 font-medium text-zinc-900">No matching recordings</h3>
          <p className="mt-1 text-sm text-zinc-600">Try another search or status filter.</p>
        </div>
      )}

      {visibleProjects.length > 0 && <div className="hidden overflow-hidden border border-zinc-300 bg-white md:block">
        <Table>
          <TableHeader>
            <TableRow className="bg-zinc-50 hover:bg-zinc-50">
              <TableHead className="font-mono text-[10px] uppercase tracking-[0.14em] text-zinc-500">Recording</TableHead>
              <TableHead className="font-mono text-[10px] uppercase tracking-[0.14em] text-zinc-500">Status</TableHead>
              <TableHead className="font-mono text-[10px] uppercase tracking-[0.14em] text-zinc-500">Added</TableHead>
              <TableHead className="w-28"><span className="sr-only">Open recording</span></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {visibleProjects.map((project) => (
              <TableRow key={project.id} className="group">
                <TableCell>
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center bg-zinc-100 text-zinc-600">
                      <FileVideo2 className="h-4 w-4" aria-hidden />
                    </span>
                    <div className="min-w-0">
                      <Link href={`/dashboard/press/recordings/${project.id}`} className="font-medium text-zinc-950 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-950 focus-visible:ring-offset-2">
                        {project.title}
                      </Link>
                      {project.assets?.[0]?.fileName && <p className="mt-0.5 max-w-md truncate text-xs text-zinc-500">{project.assets[0].fileName}</p>}
                    </div>
                  </div>
                </TableCell>
                <TableCell><PressStatusBadge status={project.status} /></TableCell>
                <TableCell className="text-sm text-zinc-600">{formatDate(project.createdAt)}</TableCell>
                <TableCell className="text-right">
                  <Link href={`/dashboard/press/recordings/${project.id}`} className="inline-flex min-h-11 items-center px-3 text-sm font-medium text-zinc-700 hover:text-zinc-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-950" aria-label={`Open ${project.title}`}>
                    Open <ArrowRight className="ml-1.5 h-4 w-4 transition-transform group-hover:translate-x-0.5 motion-reduce:transform-none" aria-hidden />
                  </Link>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>}

      {visibleProjects.length > 0 && <div className="grid gap-3 md:hidden">
        {visibleProjects.map((project) => (
          <Link
            key={project.id}
            href={`/dashboard/press/recordings/${project.id}`}
            className="border border-zinc-300 bg-white p-4 transition-colors hover:border-zinc-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-950 focus-visible:ring-offset-2"
          >
            <div className="flex items-start justify-between gap-4">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center bg-zinc-100 text-zinc-600"><FileVideo2 className="h-4 w-4" aria-hidden /></span>
              <ArrowRight className="h-4 w-4 text-zinc-500" aria-hidden />
            </div>
            <h3 className="mt-4 font-medium text-zinc-950">{project.title}</h3>
            {project.assets?.[0]?.fileName && <p className="mt-1 truncate text-xs text-zinc-500">{project.assets[0].fileName}</p>}
            <div className="mt-4 flex items-center justify-between gap-3">
              <PressStatusBadge status={project.status} />
              <span className="text-xs text-zinc-500">{formatDate(project.createdAt)}</span>
            </div>
          </Link>
        ))}
      </div>}
    </section>
  );
}
