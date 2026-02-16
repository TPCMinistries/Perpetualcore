"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle, MoreVertical } from "lucide-react";

interface OrgMember {
  id: string;
  email: string;
  full_name: string | null;
  role: string;
  mfa_enabled: boolean;
  created_at: string;
}

interface OrgMembersTableProps {
  members: OrgMember[];
  onRoleChange?: (userId: string, newRole: string) => void;
  onRemove?: (userId: string) => void;
}

const ROLE_COLORS: Record<string, string> = {
  owner: "bg-purple-100 text-purple-700",
  admin: "bg-blue-100 text-blue-700",
  member: "bg-gray-100 text-gray-700",
  viewer: "bg-slate-100 text-slate-600",
};

export default function OrgMembersTable({ members, onRoleChange, onRemove }: OrgMembersTableProps) {
  if (members.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500 text-sm">
        No members in this organization
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b text-left">
            <th className="pb-2 font-medium text-gray-600">Member</th>
            <th className="pb-2 font-medium text-gray-600">Role</th>
            <th className="pb-2 font-medium text-gray-600">MFA</th>
            <th className="pb-2 font-medium text-gray-600">Joined</th>
            <th className="pb-2 font-medium text-gray-600 text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {members.map((member) => (
            <tr key={member.id} className="border-b last:border-0">
              <td className="py-3">
                <div className="font-medium">{member.full_name || "Unknown"}</div>
                <div className="text-xs text-gray-500">{member.email}</div>
              </td>
              <td className="py-3">
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium capitalize ${ROLE_COLORS[member.role] ?? ROLE_COLORS.member}`}>
                  {member.role}
                </span>
              </td>
              <td className="py-3">
                {member.mfa_enabled ? (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                ) : (
                  <XCircle className="h-4 w-4 text-gray-300" />
                )}
              </td>
              <td className="py-3 text-gray-500">
                {new Date(member.created_at).toLocaleDateString()}
              </td>
              <td className="py-3 text-right">
                {member.role !== "owner" && (
                  <Button variant="ghost" size="sm">
                    <MoreVertical className="h-3.5 w-3.5" />
                  </Button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
