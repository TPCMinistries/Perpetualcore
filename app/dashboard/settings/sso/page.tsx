"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Shield, Plus, Edit, Trash2, AlertCircle, Check, Key, Cloud } from "lucide-react";
import { SSOProvider, SSOProviderType } from "@/types";

export default function SSOSettingsPage() {
  const [providers, setProviders] = useState<SSOProvider[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingProvider, setEditingProvider] = useState<SSOProvider | null>(null);
  const [showForm, setShowForm] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    provider_type: "saml" as SSOProviderType,
    provider_name: "",
    enabled: false,
    // SAML fields
    saml_entity_id: "",
    saml_sso_url: "",
    saml_slo_url: "",
    saml_certificate: "",
    saml_signature_algorithm: "sha256",
    saml_name_id_format: "urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress",
    // OAuth fields
    oauth_client_id: "",
    oauth_client_secret: "",
    oauth_authorization_url: "",
    oauth_token_url: "",
    oauth_user_info_url: "",
    oauth_scopes: ["openid", "profile", "email"],
    // Settings
    auto_provision_users: true,
    enforce_sso: false,
    allowed_domains: [] as string[],
  });
  const [domainInput, setDomainInput] = useState("");

  useEffect(() => {
    fetchProviders();
  }, []);

  async function fetchProviders() {
    try {
      const response = await fetch("/api/sso/providers");
      if (response.ok) {
        const data = await response.json();
        setProviders(data.providers || []);
      }
    } catch (error) {
      console.error("Error fetching SSO providers:", error);
      toast.error("Failed to load SSO providers");
    } finally {
      setLoading(false);
    }
  }

  function handleEdit(provider: SSOProvider) {
    setEditingProvider(provider);
    setFormData({
      provider_type: provider.provider_type,
      provider_name: provider.provider_name,
      enabled: provider.enabled,
      saml_entity_id: provider.saml_entity_id || "",
      saml_sso_url: provider.saml_sso_url || "",
      saml_slo_url: provider.saml_slo_url || "",
      saml_certificate: provider.saml_certificate || "",
      saml_signature_algorithm: provider.saml_signature_algorithm || "sha256",
      saml_name_id_format: provider.saml_name_id_format || "urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress",
      oauth_client_id: provider.oauth_client_id || "",
      oauth_client_secret: provider.oauth_client_secret || "",
      oauth_authorization_url: provider.oauth_authorization_url || "",
      oauth_token_url: provider.oauth_token_url || "",
      oauth_user_info_url: provider.oauth_user_info_url || "",
      oauth_scopes: provider.oauth_scopes || ["openid", "profile", "email"],
      auto_provision_users: provider.auto_provision_users,
      enforce_sso: provider.enforce_sso,
      allowed_domains: provider.allowed_domains || [],
    });
    setShowForm(true);
  }

  async function handleDelete(providerId: string) {
    if (!confirm("Are you sure you want to delete this SSO provider?")) {
      return;
    }

    try {
      const response = await fetch(`/api/sso/providers/${providerId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete provider");
      }

      toast.success("SSO provider deleted successfully");
      fetchProviders();
    } catch (error: any) {
      toast.error(error.message || "Failed to delete SSO provider");
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const url = editingProvider
      ? `/api/sso/providers/${editingProvider.id}`
      : "/api/sso/providers";
    const method = editingProvider ? "PATCH" : "POST";

    try {
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to save provider");
      }

      toast.success(
        editingProvider
          ? "SSO provider updated successfully"
          : "SSO provider created successfully"
      );
      setShowForm(false);
      setEditingProvider(null);
      resetForm();
      fetchProviders();
    } catch (error: any) {
      toast.error(error.message || "Failed to save SSO provider");
    }
  }

  function resetForm() {
    setFormData({
      provider_type: "saml",
      provider_name: "",
      enabled: false,
      saml_entity_id: "",
      saml_sso_url: "",
      saml_slo_url: "",
      saml_certificate: "",
      saml_signature_algorithm: "sha256",
      saml_name_id_format: "urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress",
      oauth_client_id: "",
      oauth_client_secret: "",
      oauth_authorization_url: "",
      oauth_token_url: "",
      oauth_user_info_url: "",
      oauth_scopes: ["openid", "profile", "email"],
      auto_provision_users: true,
      enforce_sso: false,
      allowed_domains: [],
    });
    setDomainInput("");
  }

  function handleAddDomain() {
    if (domainInput && !formData.allowed_domains.includes(domainInput)) {
      setFormData({
        ...formData,
        allowed_domains: [...formData.allowed_domains, domainInput],
      });
      setDomainInput("");
    }
  }

  function handleRemoveDomain(domain: string) {
    setFormData({
      ...formData,
      allowed_domains: formData.allowed_domains.filter((d) => d !== domain),
    });
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">SSO Configuration</h1>
          <p className="text-muted-foreground">Manage Single Sign-On providers</p>
        </div>
        <Card className="animate-pulse">
          <CardHeader>
            <div className="h-6 bg-muted rounded w-1/3 mb-2" />
            <div className="h-4 bg-muted rounded w-2/3" />
          </CardHeader>
          <CardContent>
            <div className="h-20 bg-muted rounded" />
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
          <h1 className="text-3xl font-bold">SSO Configuration</h1>
          <p className="text-muted-foreground">Configure SAML, OAuth, and OIDC providers</p>
        </div>
        {!showForm && (
          <Button
            onClick={() => {
              resetForm();
              setEditingProvider(null);
              setShowForm(true);
            }}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Provider
          </Button>
        )}
      </div>

      {/* Provider Form */}
      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>
              {editingProvider ? "Edit" : "Add"} SSO Provider
            </CardTitle>
            <CardDescription>
              Configure a new identity provider for Single Sign-On
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Basic Info */}
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="provider_type">Provider Type</Label>
                    <Select
                      value={formData.provider_type}
                      onValueChange={(value) =>
                        setFormData({
                          ...formData,
                          provider_type: value as SSOProviderType,
                        })
                      }
                      disabled={!!editingProvider}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="saml">SAML 2.0</SelectItem>
                        <SelectItem value="oidc">OpenID Connect</SelectItem>
                        <SelectItem value="oauth2">OAuth 2.0</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="provider_name">Provider Name</Label>
                    <Input
                      id="provider_name"
                      value={formData.provider_name}
                      onChange={(e) =>
                        setFormData({ ...formData, provider_name: e.target.value })
                      }
                      placeholder="e.g., Okta, Azure AD, Google"
                      required
                    />
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    checked={formData.enabled}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, enabled: checked })
                    }
                  />
                  <Label>Enable this provider</Label>
                </div>
              </div>

              {/* SAML Configuration */}
              {formData.provider_type === "saml" && (
                <div className="space-y-4 border-t pt-4">
                  <h3 className="font-medium">SAML Configuration</h3>

                  <div className="space-y-2">
                    <Label htmlFor="saml_entity_id">Entity ID (Optional)</Label>
                    <Input
                      id="saml_entity_id"
                      value={formData.saml_entity_id}
                      onChange={(e) =>
                        setFormData({ ...formData, saml_entity_id: e.target.value })
                      }
                      placeholder="https://yourapp.com/sso/saml/metadata"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="saml_sso_url">SSO URL *</Label>
                    <Input
                      id="saml_sso_url"
                      value={formData.saml_sso_url}
                      onChange={(e) =>
                        setFormData({ ...formData, saml_sso_url: e.target.value })
                      }
                      placeholder="https://idp.example.com/sso/saml"
                      required={formData.provider_type === "saml"}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="saml_slo_url">Logout URL (Optional)</Label>
                    <Input
                      id="saml_slo_url"
                      value={formData.saml_slo_url}
                      onChange={(e) =>
                        setFormData({ ...formData, saml_slo_url: e.target.value })
                      }
                      placeholder="https://idp.example.com/slo/saml"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="saml_certificate">X.509 Certificate *</Label>
                    <Textarea
                      id="saml_certificate"
                      value={formData.saml_certificate}
                      onChange={(e) =>
                        setFormData({ ...formData, saml_certificate: e.target.value })
                      }
                      placeholder="-----BEGIN CERTIFICATE-----&#10;...&#10;-----END CERTIFICATE-----"
                      rows={6}
                      required={formData.provider_type === "saml"}
                    />
                  </div>
                </div>
              )}

              {/* OAuth/OIDC Configuration */}
              {["oauth2", "oidc"].includes(formData.provider_type) && (
                <div className="space-y-4 border-t pt-4">
                  <h3 className="font-medium">OAuth Configuration</h3>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="oauth_client_id">Client ID *</Label>
                      <Input
                        id="oauth_client_id"
                        value={formData.oauth_client_id}
                        onChange={(e) =>
                          setFormData({ ...formData, oauth_client_id: e.target.value })
                        }
                        required={["oauth2", "oidc"].includes(formData.provider_type)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="oauth_client_secret">Client Secret</Label>
                      <Input
                        id="oauth_client_secret"
                        type="password"
                        value={formData.oauth_client_secret}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            oauth_client_secret: e.target.value,
                          })
                        }
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="oauth_authorization_url">Authorization URL *</Label>
                    <Input
                      id="oauth_authorization_url"
                      value={formData.oauth_authorization_url}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          oauth_authorization_url: e.target.value,
                        })
                      }
                      placeholder="https://accounts.google.com/o/oauth2/v2/auth"
                      required={["oauth2", "oidc"].includes(formData.provider_type)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="oauth_token_url">Token URL *</Label>
                    <Input
                      id="oauth_token_url"
                      value={formData.oauth_token_url}
                      onChange={(e) =>
                        setFormData({ ...formData, oauth_token_url: e.target.value })
                      }
                      placeholder="https://oauth2.googleapis.com/token"
                      required={["oauth2", "oidc"].includes(formData.provider_type)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="oauth_user_info_url">User Info URL</Label>
                    <Input
                      id="oauth_user_info_url"
                      value={formData.oauth_user_info_url}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          oauth_user_info_url: e.target.value,
                        })
                      }
                      placeholder="https://www.googleapis.com/oauth2/v2/userinfo"
                    />
                  </div>
                </div>
              )}

              {/* Settings */}
              <div className="space-y-4 border-t pt-4">
                <h3 className="font-medium">Settings</h3>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Auto-provision Users</Label>
                      <p className="text-sm text-muted-foreground">
                        Automatically create accounts for new users on first login
                      </p>
                    </div>
                    <Switch
                      checked={formData.auto_provision_users}
                      onCheckedChange={(checked) =>
                        setFormData({ ...formData, auto_provision_users: checked })
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Enforce SSO</Label>
                      <p className="text-sm text-muted-foreground">
                        Require SSO login for all users in allowed domains
                      </p>
                    </div>
                    <Switch
                      checked={formData.enforce_sso}
                      onCheckedChange={(checked) =>
                        setFormData({ ...formData, enforce_sso: checked })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Allowed Email Domains</Label>
                    <div className="flex gap-2">
                      <Input
                        value={domainInput}
                        onChange={(e) => setDomainInput(e.target.value)}
                        placeholder="example.com"
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            handleAddDomain();
                          }
                        }}
                      />
                      <Button type="button" onClick={handleAddDomain}>
                        Add
                      </Button>
                    </div>
                    {formData.allowed_domains.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {formData.allowed_domains.map((domain) => (
                          <Badge key={domain} variant="secondary">
                            {domain}
                            <button
                              type="button"
                              onClick={() => handleRemoveDomain(domain)}
                              className="ml-2 hover:text-destructive"
                            >
                              ×
                            </button>
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <Button type="submit">
                  {editingProvider ? "Update Provider" : "Create Provider"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowForm(false);
                    setEditingProvider(null);
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

      {/* Providers List */}
      {!showForm && providers.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <Cloud className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="font-semibold mb-2">No SSO Providers Configured</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Add a SAML, OAuth, or OIDC provider to enable Single Sign-On
            </p>
            <Button
              onClick={() => {
                resetForm();
                setShowForm(true);
              }}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Your First Provider
            </Button>
          </CardContent>
        </Card>
      )}

      {!showForm && providers.length > 0 && (
        <div className="grid gap-4">
          {providers.map((provider) => (
            <Card key={provider.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded">
                      <Shield className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        {provider.provider_name}
                        {provider.enabled && (
                          <Badge variant="outline" className="bg-green-50 border-green-300 text-green-700">
                            <Check className="h-3 w-3 mr-1" />
                            Enabled
                          </Badge>
                        )}
                      </CardTitle>
                      <CardDescription>
                        {provider.provider_type.toUpperCase()}
                        {provider.enforce_sso && " • SSO Enforced"}
                        {provider.allowed_domains && provider.allowed_domains.length > 0 &&
                          ` • ${provider.allowed_domains.length} allowed domain(s)`}
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => handleEdit(provider)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(provider.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
