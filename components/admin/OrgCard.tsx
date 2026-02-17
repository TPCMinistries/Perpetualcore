"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building2, Users, Shield, CheckCircle } from "lucide-react";
import Link from "next/link";

interface OrgCardProps {
  id: string;
  name: string;
  slug: string;
  plan: string | null;
  member_count: number;
  has_sso: boolean;
  compliance_score: number | null;
  created_at: string;
}

export default function OrgCard({
  id,
  name,
  slug,
  plan,
  member_count,
  has_sso,
  compliance_score,
  created_at,
}: OrgCardProps) {
  return (
    <Link href={`/dashboard/admin/organizations/${id}`}>
      <Card className="hover:shadow-md transition-shadow cursor-pointer">
        <CardContent className="p-4">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-slate-100 rounded-lg">
                <Building2 className="h-5 w-5 text-slate-600" />
              </div>
              <div>
                <h3 className="font-semibold">{name}</h3>
                <p className="text-xs text-gray-500">/{slug}</p>
              </div>
            </div>
            {plan && (
              <Badge variant="outline" className="capitalize text-xs">
                {plan}
              </Badge>
            )}
          </div>

          <div className="flex items-center gap-4 mt-4 text-xs text-gray-500">
            <div className="flex items-center gap-1">
              <Users className="h-3.5 w-3.5" />
              {member_count} member{member_count !== 1 ? "s" : ""}
            </div>
            {has_sso && (
              <div className="flex items-center gap-1 text-green-600">
                <CheckCircle className="h-3.5 w-3.5" />
                SSO
              </div>
            )}
            {compliance_score !== null && (
              <div className="flex items-center gap-1">
                <Shield className="h-3.5 w-3.5" />
                {compliance_score}%
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
