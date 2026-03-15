"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

interface AttributionRow {
  key: string;
  visitors: number;
  signups: number;
  activations: number;
  conversions: number;
  signup_rate: number;
  activation_rate: number;
  conversion_rate: number;
}

interface AttributionTableProps {
  rows: AttributionRow[];
  groupBy: string;
}

function getRateBadge(rate: number) {
  if (rate >= 10) return <Badge variant="default" className="bg-emerald-500">{rate}%</Badge>;
  if (rate >= 5) return <Badge variant="default" className="bg-amber-500">{rate}%</Badge>;
  if (rate > 0) return <Badge variant="default" className="bg-red-500">{rate}%</Badge>;
  return <span className="text-gray-400">--</span>;
}

export function AttributionTable({ rows, groupBy }: AttributionTableProps) {
  if (!rows.length) {
    return (
      <div className="flex items-center justify-center h-40 text-sm text-gray-400">
        No attribution data yet. Events with UTM parameters will appear here.
      </div>
    );
  }

  const label =
    groupBy === "source"
      ? "Source"
      : groupBy === "medium"
        ? "Medium"
        : "Campaign";

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[180px]">{label}</TableHead>
            <TableHead className="text-right">Visitors</TableHead>
            <TableHead className="text-right">Signups</TableHead>
            <TableHead className="text-right">Activations</TableHead>
            <TableHead className="text-right">Conversions</TableHead>
            <TableHead className="text-right">Signup Rate</TableHead>
            <TableHead className="text-right">Activation Rate</TableHead>
            <TableHead className="text-right">Conv. Rate</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.key}>
              <TableCell className="font-medium">{row.key}</TableCell>
              <TableCell className="text-right">
                {row.visitors.toLocaleString()}
              </TableCell>
              <TableCell className="text-right">
                {row.signups.toLocaleString()}
              </TableCell>
              <TableCell className="text-right">
                {row.activations.toLocaleString()}
              </TableCell>
              <TableCell className="text-right">
                {row.conversions.toLocaleString()}
              </TableCell>
              <TableCell className="text-right">
                {getRateBadge(row.signup_rate)}
              </TableCell>
              <TableCell className="text-right">
                {getRateBadge(row.activation_rate)}
              </TableCell>
              <TableCell className="text-right">
                {getRateBadge(row.conversion_rate)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
