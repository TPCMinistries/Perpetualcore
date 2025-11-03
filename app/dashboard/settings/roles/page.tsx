"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Shield, Plus, Edit, Trash2, Users, Lock } from "lucide-react";
import { Role, Permission } from "@/types";

export default function RolesSettingsPage() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [groupedPermissions, setGroupedPermissions] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    description: "",
    selectedPermissions: [] as string[],
  });

  useEffect(() => {
    fetchRoles();
    fetchPermissions();
  }, []);

  async function fetchRoles() {
    try {
      const response = await fetch("/api/rbac/roles");
      if (response.ok) {
        const data = await response.json();
        setRoles(data.roles || []);
      }
    } catch (error) {
      console.error("Error fetching roles:", error);
      toast.error("Failed to load roles");
    } finally {
      setLoading(false);
    }
  }

  async function fetchPermissions() {
    try {
      const response = await fetch("/api/rbac/permissions");
      if (response.ok) {
        const data = await response.json();
        setPermissions(data.permissions || []);
        setGroupedPermissions(data.grouped || {});
      }
    } catch (error) {
      console.error("Error fetching permissions:", error);
      toast.error("Failed to load permissions");
    }
  }

  function handleEdit(role: Role) {
    setEditingRole(role);
    setFormData({
      name: role.name,
      slug: role.slug,
      description: role.description || "",
      selectedPermissions: [],
    });
    setShowForm(true);
  }

  async function handleDelete(roleId: string) {
    if (!confirm("Are you sure you want to delete this role?")) {
      return;
    }

    try {
      const response = await fetch(`/api/rbac/roles/${roleId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete role");
      }

      toast.success("Role deleted successfully");
      fetchRoles();
    } catch (error: any) {
      toast.error(error.message || "Failed to delete role");
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    // Generate slug from name if not provided
    const slug = formData.slug || formData.name.toLowerCase().replace(/\s+/g, "-");

    const url = editingRole
      ? `/api/rbac/roles/${editingRole.id}`
      : "/api/rbac/roles";
    const method = editingRole ? "PATCH" : "POST";

    try {
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          slug,
          permission_ids: formData.selectedPermissions,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to save role");
      }

      toast.success(
        editingRole
          ? "Role updated successfully"
          : "Role created successfully"
      );
      setShowForm(false);
      setEditingRole(null);
      resetForm();
      fetchRoles();
    } catch (error: any) {
      toast.error(error.message || "Failed to save role");
    }
  }

  function resetForm() {
    setFormData({
      name: "",
      slug: "",
      description: "",
      selectedPermissions: [],
    });
  }

  function togglePermission(permissionId: string) {
    setFormData({
      ...formData,
      selectedPermissions: formData.selectedPermissions.includes(permissionId)
        ? formData.selectedPermissions.filter((id) => id !== permissionId)
        : [...formData.selectedPermissions, permissionId],
    });
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Roles & Permissions</h1>
          <p className="text-muted-foreground">Manage user roles and access control</p>
        </div>
        <Card className="animate-pulse">
          <CardHeader>
            <div className="h-6 bg-muted rounded w-1/3 mb-2" />
            <div className="h-4 bg-muted rounded w-2/3" />
          </CardHeader>
          <CardContent>
            <div className="h-40 bg-muted rounded" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Roles & Permissions</h1>
          <p className="text-muted-foreground">
            Configure role-based access control for your organization
          </p>
        </div>
        {!showForm && (
          <Button
            onClick={() => {
              resetForm();
              setEditingRole(null);
              setShowForm(true);
            }}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Role
          </Button>
        )}
      </div>

      {/* Role Form */}
      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>
              {editingRole ? "Edit" : "Create"} Role
            </CardTitle>
            <CardDescription>
              Define a custom role with specific permissions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Basic Info */}
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">Role Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    placeholder="e.g., Project Manager"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="slug">Slug</Label>
                  <Input
                    id="slug"
                    value={formData.slug}
                    onChange={(e) =>
                      setFormData({ ...formData, slug: e.target.value })
                    }
                    placeholder="Auto-generated from name"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="Describe this role's responsibilities..."
                  rows={3}
                />
              </div>

              {/* Permissions */}
              <div className="space-y-4">
                <h3 className="font-medium">Permissions</h3>
                <div className="border rounded-lg p-4 max-h-96 overflow-y-auto space-y-4">
                  {Object.entries(groupedPermissions).map(([groupName, data]) => (
                    <div key={groupName} className="space-y-2">
                      <h4 className="font-medium text-sm flex items-center gap-2">
                        <Shield className="h-4 w-4" />
                        {groupName}
                      </h4>
                      <div className="grid gap-2 md:grid-cols-2 pl-6">
                        {data.permissions.map((permission: Permission) => (
                          <div key={permission.id} className="flex items-center space-x-2">
                            <Checkbox
                              id={permission.id}
                              checked={formData.selectedPermissions.includes(permission.id)}
                              onCheckedChange={() => togglePermission(permission.id)}
                            />
                            <label
                              htmlFor={permission.id}
                              className="text-sm leading-none cursor-pointer"
                            >
                              <span className="font-medium">{permission.action}</span>
                              <span className="text-muted-foreground"> {permission.resource}</span>
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <Button type="submit">
                  {editingRole ? "Update Role" : "Create Role"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowForm(false);
                    setEditingRole(null);
                    resetForm();
                  }}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Roles List */}
      {!showForm && (
        <div className="grid gap-4">
          {roles.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Lock className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="font-semibold mb-2">No Custom Roles</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Create custom roles to control user permissions
                </p>
                <Button
                  onClick={() => {
                    resetForm();
                    setShowForm(true);
                  }}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First Role
                </Button>
              </CardContent>
            </Card>
          ) : (
            roles.map((role) => (
              <Card key={role.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-primary/10 rounded">
                        <Shield className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          {role.name}
                          {role.is_system_role && (
                            <Badge variant="secondary">System</Badge>
                          )}
                        </CardTitle>
                        <CardDescription>
                          {role.description || `Role: ${role.slug}`}
                        </CardDescription>
                      </div>
                    </div>
                    {!role.is_system_role && (
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(role)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(role.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                </CardHeader>
              </Card>
            ))
          )}
        </div>
      )}
    </div>
  );
}
