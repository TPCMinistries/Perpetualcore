"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  User,
  Building2,
  MapPin,
  Calendar,
  Phone,
  Mail,
  Globe,
  Linkedin,
  Twitter,
  Instagram,
  Heart,
  Briefcase,
  Users,
  Sparkles,
  ChevronRight,
  ChevronLeft,
  Plus,
  X,
  Loader2,
  Upload,
  Lightbulb,
  GraduationCap,
  Target,
  Gift,
  MessageSquare,
  Clock,
  UserPlus,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  ContactType,
  RelationshipStrength,
  CONTACT_TYPE_CONFIG,
  RELATIONSHIP_STRENGTH_CONFIG,
} from "@/types/contacts";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface ContactFormData {
  // Basic Info
  full_name: string;
  nickname: string;
  avatar_url: string;
  birthday: string;

  // Contact Details
  emails: Array<{ value: string; type: string; primary: boolean }>;
  phones: Array<{ value: string; type: string; primary: boolean }>;

  // Location
  location: string;
  timezone: string;
  address: string;

  // Professional
  company: string;
  job_title: string;
  department: string;
  industry: string;
  linkedin_url: string;
  years_in_role: string;
  previous_companies: string[];

  // Social
  twitter_url: string;
  instagram_url: string;
  website_url: string;
  other_social: Array<{ platform: string; url: string }>;

  // Relationship
  contact_type: ContactType;
  relationship_strength: RelationshipStrength;
  how_we_met: string;
  first_met_date: string;
  where_we_met: string;
  introduced_by: string;

  // Skills & Interests
  skills: string[];
  interests: string[];
  can_help_with: string[];
  looking_for: string[];
  industries_known: string[];

  // Personal
  spouse_partner_name: string;
  children_names: string;
  hobbies: string[];
  favorite_things: string;
  important_dates: Array<{ date: string; description: string }>;
  conversation_starters: string;

  // System
  tags: string[];
  notes: string;
  suggest_for_opportunities: boolean;
}

const INITIAL_FORM_DATA: ContactFormData = {
  full_name: "",
  nickname: "",
  avatar_url: "",
  birthday: "",
  emails: [{ value: "", type: "work", primary: true }],
  phones: [{ value: "", type: "mobile", primary: true }],
  location: "",
  timezone: "",
  address: "",
  company: "",
  job_title: "",
  department: "",
  industry: "",
  linkedin_url: "",
  years_in_role: "",
  previous_companies: [],
  twitter_url: "",
  instagram_url: "",
  website_url: "",
  other_social: [],
  contact_type: "professional",
  relationship_strength: "new",
  how_we_met: "",
  first_met_date: "",
  where_we_met: "",
  introduced_by: "",
  skills: [],
  interests: [],
  can_help_with: [],
  looking_for: [],
  industries_known: [],
  spouse_partner_name: "",
  children_names: "",
  hobbies: [],
  favorite_things: "",
  important_dates: [],
  conversation_starters: "",
  tags: [],
  notes: "",
  suggest_for_opportunities: true,
};

const SECTIONS = [
  { id: "basic", label: "Basic Info", icon: User },
  { id: "contact", label: "Contact Details", icon: Phone },
  { id: "professional", label: "Professional", icon: Briefcase },
  { id: "social", label: "Social Profiles", icon: Globe },
  { id: "relationship", label: "Relationship", icon: Users },
  { id: "expertise", label: "Skills & Expertise", icon: GraduationCap },
  { id: "personal", label: "Personal Notes", icon: Heart },
];

interface ContactFormFullProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (contact: any) => void;
  initialData?: Partial<ContactFormData>;
  mode?: "create" | "edit";
  contactId?: string;
}

export function ContactFormFull({
  open,
  onOpenChange,
  onSuccess,
  initialData,
  mode = "create",
  contactId,
}: ContactFormFullProps) {
  const router = useRouter();
  const [activeSection, setActiveSection] = useState("basic");
  const [formData, setFormData] = useState<ContactFormData>({
    ...INITIAL_FORM_DATA,
    ...initialData,
  });
  const [saving, setSaving] = useState(false);
  const [enriching, setEnriching] = useState(false);
  const [tagInput, setTagInput] = useState("");
  const [skillInput, setSkillInput] = useState("");
  const [interestInput, setInterestInput] = useState("");
  const [helpInput, setHelpInput] = useState("");
  const [lookingInput, setLookingInput] = useState("");
  const [hobbyInput, setHobbyInput] = useState("");
  const [companyInput, setCompanyInput] = useState("");

  const updateField = useCallback(<K extends keyof ContactFormData>(
    field: K,
    value: ContactFormData[K]
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  }, []);

  const addToArray = (field: keyof ContactFormData, value: string, inputSetter: (v: string) => void) => {
    if (!value.trim()) return;
    const currentArray = formData[field] as string[];
    if (!currentArray.includes(value.trim())) {
      updateField(field, [...currentArray, value.trim()] as any);
    }
    inputSetter("");
  };

  const removeFromArray = (field: keyof ContactFormData, value: string) => {
    const currentArray = formData[field] as string[];
    updateField(field, currentArray.filter((v) => v !== value) as any);
  };

  const addEmail = () => {
    updateField("emails", [...formData.emails, { value: "", type: "work", primary: false }]);
  };

  const removeEmail = (index: number) => {
    updateField("emails", formData.emails.filter((_, i) => i !== index));
  };

  const updateEmail = (index: number, field: string, value: string | boolean) => {
    const newEmails = [...formData.emails];
    newEmails[index] = { ...newEmails[index], [field]: value };
    if (field === "primary" && value === true) {
      newEmails.forEach((e, i) => {
        if (i !== index) e.primary = false;
      });
    }
    updateField("emails", newEmails);
  };

  const addPhone = () => {
    updateField("phones", [...formData.phones, { value: "", type: "work", primary: false }]);
  };

  const removePhone = (index: number) => {
    updateField("phones", formData.phones.filter((_, i) => i !== index));
  };

  const updatePhone = (index: number, field: string, value: string | boolean) => {
    const newPhones = [...formData.phones];
    newPhones[index] = { ...newPhones[index], [field]: value };
    if (field === "primary" && value === true) {
      newPhones.forEach((p, i) => {
        if (i !== index) p.primary = false;
      });
    }
    updateField("phones", newPhones);
  };

  const handleEnrichWithAI = async () => {
    if (!formData.full_name && !formData.company && !formData.linkedin_url) {
      toast.error("Add a name, company, or LinkedIn URL first");
      return;
    }

    setEnriching(true);
    try {
      const response = await fetch("/api/contacts/enrich", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.full_name,
          company: formData.company,
          linkedin_url: formData.linkedin_url,
          email: formData.emails[0]?.value,
        }),
      });

      if (response.ok) {
        const enrichedData = await response.json();
        if (enrichedData.suggestions) {
          // Merge enriched data with existing form data (don't overwrite user input)
          setFormData((prev) => ({
            ...prev,
            job_title: prev.job_title || enrichedData.suggestions.job_title || "",
            industry: prev.industry || enrichedData.suggestions.industry || "",
            location: prev.location || enrichedData.suggestions.location || "",
            skills: prev.skills.length > 0 ? prev.skills : enrichedData.suggestions.skills || [],
            interests: prev.interests.length > 0 ? prev.interests : enrichedData.suggestions.interests || [],
            tags: prev.tags.length > 0 ? prev.tags : enrichedData.suggestions.tags || [],
          }));
          toast.success("AI enriched contact details");
        }
      } else {
        toast.error("Could not enrich contact");
      }
    } catch (error) {
      console.error("Enrich error:", error);
      toast.error("Failed to enrich contact");
    } finally {
      setEnriching(false);
    }
  };

  const handleSave = async () => {
    if (!formData.full_name.trim()) {
      toast.error("Name is required");
      setActiveSection("basic");
      return;
    }

    setSaving(true);
    try {
      // Transform form data for API
      const apiData = {
        full_name: formData.full_name,
        nickname: formData.nickname || null,
        email: formData.emails.find((e) => e.primary)?.value || formData.emails[0]?.value || null,
        phone: formData.phones.find((p) => p.primary)?.value || formData.phones[0]?.value || null,
        company: formData.company || null,
        job_title: formData.job_title || null,
        avatar_url: formData.avatar_url || null,
        contact_type: formData.contact_type,
        relationship_strength: formData.relationship_strength,
        how_we_met: formData.how_we_met || null,
        first_met_date: formData.first_met_date || null,
        location: formData.location || null,
        timezone: formData.timezone || null,
        skills: formData.skills,
        interests: formData.interests,
        can_help_with: formData.can_help_with,
        looking_for: formData.looking_for,
        tags: formData.tags,
        suggest_for_opportunities: formData.suggest_for_opportunities,
        custom_fields: {
          // Store extended fields in custom_fields
          birthday: formData.birthday,
          department: formData.department,
          industry: formData.industry,
          linkedin_url: formData.linkedin_url,
          years_in_role: formData.years_in_role,
          previous_companies: formData.previous_companies,
          twitter_url: formData.twitter_url,
          instagram_url: formData.instagram_url,
          website_url: formData.website_url,
          other_social: formData.other_social,
          where_we_met: formData.where_we_met,
          introduced_by: formData.introduced_by,
          industries_known: formData.industries_known,
          spouse_partner_name: formData.spouse_partner_name,
          children_names: formData.children_names,
          hobbies: formData.hobbies,
          favorite_things: formData.favorite_things,
          important_dates: formData.important_dates,
          conversation_starters: formData.conversation_starters,
          address: formData.address,
          emails: formData.emails,
          phones: formData.phones,
          notes: formData.notes,
        },
      };

      const url = mode === "edit" && contactId
        ? `/api/contacts/${contactId}`
        : "/api/contacts";

      const response = await fetch(url, {
        method: mode === "edit" ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(apiData),
      });

      if (response.ok) {
        const data = await response.json();
        toast.success(mode === "edit" ? "Contact updated" : "Contact created");
        onOpenChange(false);
        if (onSuccess) {
          onSuccess(data.contact);
        } else {
          router.push(`/dashboard/contacts/${data.contact.id}`);
        }
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || "Failed to save contact");
      }
    } catch (error) {
      console.error("Save error:", error);
      toast.error("Failed to save contact");
    } finally {
      setSaving(false);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const currentSectionIndex = SECTIONS.findIndex((s) => s.id === activeSection);

  const goToNextSection = () => {
    if (currentSectionIndex < SECTIONS.length - 1) {
      setActiveSection(SECTIONS[currentSectionIndex + 1].id);
    }
  };

  const goToPrevSection = () => {
    if (currentSectionIndex > 0) {
      setActiveSection(SECTIONS[currentSectionIndex - 1].id);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden p-0">
        <div className="flex h-[85vh]">
          {/* Sidebar Navigation */}
          <div className="w-56 border-r bg-muted/30 p-4 flex flex-col">
            <DialogHeader className="mb-4">
              <DialogTitle className="text-lg">
                {mode === "edit" ? "Edit Contact" : "New Contact"}
              </DialogTitle>
              <DialogDescription className="text-xs">
                Build a comprehensive profile
              </DialogDescription>
            </DialogHeader>

            {/* Contact Preview */}
            <div className="flex items-center gap-3 p-3 rounded-lg bg-background border mb-4">
              <Avatar className="h-10 w-10">
                <AvatarImage src={formData.avatar_url || undefined} />
                <AvatarFallback className="bg-primary/10 text-primary">
                  {formData.full_name ? getInitials(formData.full_name) : <User className="h-4 w-4" />}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">
                  {formData.full_name || "New Contact"}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {formData.company || formData.job_title || "Add details below"}
                </p>
              </div>
            </div>

            {/* Section Navigation */}
            <nav className="space-y-1 flex-1">
              {SECTIONS.map((section, index) => {
                const Icon = section.icon;
                const isActive = activeSection === section.id;
                const isComplete = index < currentSectionIndex;

                return (
                  <button
                    key={section.id}
                    onClick={() => setActiveSection(section.id)}
                    className={cn(
                      "w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors text-left",
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : "hover:bg-muted text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {isComplete ? (
                      <Check className="h-4 w-4 text-green-500" />
                    ) : (
                      <Icon className="h-4 w-4" />
                    )}
                    {section.label}
                  </button>
                );
              })}
            </nav>

            {/* AI Enrich Button */}
            <Button
              variant="outline"
              className="mt-4 gap-2"
              onClick={handleEnrichWithAI}
              disabled={enriching}
            >
              {enriching ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4" />
              )}
              AI Enrich
            </Button>
          </div>

          {/* Main Content */}
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="flex-1 overflow-y-auto p-6">
              {/* Basic Info Section */}
              {activeSection === "basic" && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      <User className="h-5 w-5" />
                      Basic Information
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Essential details about this contact
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2 sm:col-span-1 space-y-2">
                      <Label htmlFor="full_name">Full Name *</Label>
                      <Input
                        id="full_name"
                        placeholder="John Smith"
                        value={formData.full_name}
                        onChange={(e) => updateField("full_name", e.target.value)}
                        className="h-11"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="nickname">Preferred Name / Nickname</Label>
                      <Input
                        id="nickname"
                        placeholder="Johnny"
                        value={formData.nickname}
                        onChange={(e) => updateField("nickname", e.target.value)}
                        className="h-11"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="birthday">Birthday</Label>
                      <Input
                        id="birthday"
                        type="date"
                        value={formData.birthday}
                        onChange={(e) => updateField("birthday", e.target.value)}
                        className="h-11"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="avatar_url">Profile Photo URL</Label>
                      <Input
                        id="avatar_url"
                        placeholder="https://..."
                        value={formData.avatar_url}
                        onChange={(e) => updateField("avatar_url", e.target.value)}
                        className="h-11"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="location">City / Location</Label>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="location"
                          placeholder="New York, NY"
                          value={formData.location}
                          onChange={(e) => updateField("location", e.target.value)}
                          className="h-11 pl-9"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="timezone">Timezone</Label>
                      <Select
                        value={formData.timezone}
                        onValueChange={(v) => updateField("timezone", v)}
                      >
                        <SelectTrigger className="h-11">
                          <SelectValue placeholder="Select timezone" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="America/New_York">Eastern (ET)</SelectItem>
                          <SelectItem value="America/Chicago">Central (CT)</SelectItem>
                          <SelectItem value="America/Denver">Mountain (MT)</SelectItem>
                          <SelectItem value="America/Los_Angeles">Pacific (PT)</SelectItem>
                          <SelectItem value="Europe/London">London (GMT)</SelectItem>
                          <SelectItem value="Europe/Paris">Paris (CET)</SelectItem>
                          <SelectItem value="Asia/Tokyo">Tokyo (JST)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="col-span-2 space-y-2">
                      <Label htmlFor="address">Full Address</Label>
                      <Textarea
                        id="address"
                        placeholder="123 Main St, Suite 100, New York, NY 10001"
                        value={formData.address}
                        onChange={(e) => updateField("address", e.target.value)}
                        rows={2}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Contact Details Section */}
              {activeSection === "contact" && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      <Phone className="h-5 w-5" />
                      Contact Details
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      How to reach this person
                    </p>
                  </div>

                  {/* Emails */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label>Email Addresses</Label>
                      <Button variant="ghost" size="sm" onClick={addEmail}>
                        <Plus className="h-4 w-4 mr-1" /> Add
                      </Button>
                    </div>
                    {formData.emails.map((email, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <div className="relative flex-1">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            placeholder="email@example.com"
                            value={email.value}
                            onChange={(e) => updateEmail(index, "value", e.target.value)}
                            className="pl-9"
                          />
                        </div>
                        <Select
                          value={email.type}
                          onValueChange={(v) => updateEmail(index, "type", v)}
                        >
                          <SelectTrigger className="w-28">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="work">Work</SelectItem>
                            <SelectItem value="personal">Personal</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button
                          variant={email.primary ? "default" : "outline"}
                          size="sm"
                          onClick={() => updateEmail(index, "primary", true)}
                          className="text-xs"
                        >
                          Primary
                        </Button>
                        {formData.emails.length > 1 && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeEmail(index)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Phones */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label>Phone Numbers</Label>
                      <Button variant="ghost" size="sm" onClick={addPhone}>
                        <Plus className="h-4 w-4 mr-1" /> Add
                      </Button>
                    </div>
                    {formData.phones.map((phone, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <div className="relative flex-1">
                          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            placeholder="+1 (555) 000-0000"
                            value={phone.value}
                            onChange={(e) => updatePhone(index, "value", e.target.value)}
                            className="pl-9"
                          />
                        </div>
                        <Select
                          value={phone.type}
                          onValueChange={(v) => updatePhone(index, "type", v)}
                        >
                          <SelectTrigger className="w-28">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="mobile">Mobile</SelectItem>
                            <SelectItem value="work">Work</SelectItem>
                            <SelectItem value="home">Home</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button
                          variant={phone.primary ? "default" : "outline"}
                          size="sm"
                          onClick={() => updatePhone(index, "primary", true)}
                          className="text-xs"
                        >
                          Primary
                        </Button>
                        {formData.phones.length > 1 && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removePhone(index)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Professional Section */}
              {activeSection === "professional" && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      <Briefcase className="h-5 w-5" />
                      Professional Profile
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Career and work information
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="company">Company</Label>
                      <div className="relative">
                        <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="company"
                          placeholder="Acme Corp"
                          value={formData.company}
                          onChange={(e) => updateField("company", e.target.value)}
                          className="pl-9"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="job_title">Job Title</Label>
                      <Input
                        id="job_title"
                        placeholder="VP of Engineering"
                        value={formData.job_title}
                        onChange={(e) => updateField("job_title", e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="department">Department</Label>
                      <Input
                        id="department"
                        placeholder="Engineering"
                        value={formData.department}
                        onChange={(e) => updateField("department", e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="industry">Industry</Label>
                      <Input
                        id="industry"
                        placeholder="Technology"
                        value={formData.industry}
                        onChange={(e) => updateField("industry", e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="years_in_role">Years in Current Role</Label>
                      <Input
                        id="years_in_role"
                        placeholder="3"
                        value={formData.years_in_role}
                        onChange={(e) => updateField("years_in_role", e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="linkedin_url">LinkedIn Profile</Label>
                      <div className="relative">
                        <Linkedin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="linkedin_url"
                          placeholder="linkedin.com/in/username"
                          value={formData.linkedin_url}
                          onChange={(e) => updateField("linkedin_url", e.target.value)}
                          className="pl-9"
                        />
                      </div>
                    </div>

                    <div className="col-span-2 space-y-2">
                      <Label>Previous Companies</Label>
                      <div className="flex gap-2">
                        <Input
                          placeholder="Add previous company"
                          value={companyInput}
                          onChange={(e) => setCompanyInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              addToArray("previous_companies", companyInput, setCompanyInput);
                            }
                          }}
                        />
                        <Button
                          variant="outline"
                          onClick={() => addToArray("previous_companies", companyInput, setCompanyInput)}
                        >
                          Add
                        </Button>
                      </div>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {formData.previous_companies.map((company) => (
                          <Badge key={company} variant="secondary" className="gap-1">
                            {company}
                            <X
                              className="h-3 w-3 cursor-pointer"
                              onClick={() => removeFromArray("previous_companies", company)}
                            />
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Social Section */}
              {activeSection === "social" && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      <Globe className="h-5 w-5" />
                      Social Profiles
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Online presence and social media
                    </p>
                  </div>

                  <div className="grid grid-cols-1 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="linkedin_url">LinkedIn</Label>
                      <div className="relative">
                        <Linkedin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="linkedin_url"
                          placeholder="linkedin.com/in/username"
                          value={formData.linkedin_url}
                          onChange={(e) => updateField("linkedin_url", e.target.value)}
                          className="pl-9"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="twitter_url">Twitter / X</Label>
                      <div className="relative">
                        <Twitter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="twitter_url"
                          placeholder="twitter.com/username"
                          value={formData.twitter_url}
                          onChange={(e) => updateField("twitter_url", e.target.value)}
                          className="pl-9"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="instagram_url">Instagram</Label>
                      <div className="relative">
                        <Instagram className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="instagram_url"
                          placeholder="instagram.com/username"
                          value={formData.instagram_url}
                          onChange={(e) => updateField("instagram_url", e.target.value)}
                          className="pl-9"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="website_url">Personal Website</Label>
                      <div className="relative">
                        <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="website_url"
                          placeholder="https://example.com"
                          value={formData.website_url}
                          onChange={(e) => updateField("website_url", e.target.value)}
                          className="pl-9"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Relationship Section */}
              {activeSection === "relationship" && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      <Users className="h-5 w-5" />
                      Relationship Context
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      How you know this person
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Contact Type</Label>
                      <Select
                        value={formData.contact_type}
                        onValueChange={(v) => updateField("contact_type", v as ContactType)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(CONTACT_TYPE_CONFIG).map(([key, config]) => (
                            <SelectItem key={key} value={key}>
                              <div>
                                <div className="font-medium">{config.label}</div>
                                <div className="text-xs text-muted-foreground">
                                  {config.description}
                                </div>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Relationship Strength</Label>
                      <Select
                        value={formData.relationship_strength}
                        onValueChange={(v) => updateField("relationship_strength", v as RelationshipStrength)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(RELATIONSHIP_STRENGTH_CONFIG).map(([key, config]) => (
                            <SelectItem key={key} value={key}>
                              <div className="flex items-center gap-2">
                                <div className={cn("w-2 h-2 rounded-full", config.bgColor)} />
                                <span>{config.label}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="col-span-2 space-y-2">
                      <Label htmlFor="how_we_met">How did you meet?</Label>
                      <Textarea
                        id="how_we_met"
                        placeholder="Tech conference in Austin, mutual friend introduced us..."
                        value={formData.how_we_met}
                        onChange={(e) => updateField("how_we_met", e.target.value)}
                        rows={3}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="first_met_date">When did you first meet?</Label>
                      <Input
                        id="first_met_date"
                        type="date"
                        value={formData.first_met_date}
                        onChange={(e) => updateField("first_met_date", e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="where_we_met">Where did you meet?</Label>
                      <Input
                        id="where_we_met"
                        placeholder="Austin Convention Center"
                        value={formData.where_we_met}
                        onChange={(e) => updateField("where_we_met", e.target.value)}
                      />
                    </div>

                    <div className="col-span-2 space-y-2">
                      <Label htmlFor="introduced_by">Who introduced you?</Label>
                      <div className="relative">
                        <UserPlus className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="introduced_by"
                          placeholder="Sarah Johnson"
                          value={formData.introduced_by}
                          onChange={(e) => updateField("introduced_by", e.target.value)}
                          className="pl-9"
                        />
                      </div>
                    </div>

                    <div className="col-span-2 flex items-center justify-between p-4 rounded-lg border bg-muted/50">
                      <div className="space-y-0.5">
                        <Label>Suggest for Opportunities</Label>
                        <p className="text-sm text-muted-foreground">
                          AI will suggest this contact for relevant projects
                        </p>
                      </div>
                      <Switch
                        checked={formData.suggest_for_opportunities}
                        onCheckedChange={(v) => updateField("suggest_for_opportunities", v)}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Expertise Section */}
              {activeSection === "expertise" && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      <GraduationCap className="h-5 w-5" />
                      Skills & Expertise
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      What they know and what they need
                    </p>
                  </div>

                  <div className="space-y-4">
                    {/* Skills */}
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <Lightbulb className="h-4 w-4" />
                        Skills & Expertise
                      </Label>
                      <div className="flex gap-2">
                        <Input
                          placeholder="e.g., React, Leadership, Sales..."
                          value={skillInput}
                          onChange={(e) => setSkillInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              addToArray("skills", skillInput, setSkillInput);
                            }
                          }}
                        />
                        <Button
                          variant="outline"
                          onClick={() => addToArray("skills", skillInput, setSkillInput)}
                        >
                          Add
                        </Button>
                      </div>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {formData.skills.map((skill) => (
                          <Badge key={skill} variant="secondary" className="gap-1">
                            {skill}
                            <X
                              className="h-3 w-3 cursor-pointer"
                              onClick={() => removeFromArray("skills", skill)}
                            />
                          </Badge>
                        ))}
                      </div>
                    </div>

                    {/* Interests */}
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <Heart className="h-4 w-4" />
                        Interests
                      </Label>
                      <div className="flex gap-2">
                        <Input
                          placeholder="e.g., AI, Startups, Investing..."
                          value={interestInput}
                          onChange={(e) => setInterestInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              addToArray("interests", interestInput, setInterestInput);
                            }
                          }}
                        />
                        <Button
                          variant="outline"
                          onClick={() => addToArray("interests", interestInput, setInterestInput)}
                        >
                          Add
                        </Button>
                      </div>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {formData.interests.map((interest) => (
                          <Badge key={interest} variant="secondary" className="gap-1">
                            {interest}
                            <X
                              className="h-3 w-3 cursor-pointer"
                              onClick={() => removeFromArray("interests", interest)}
                            />
                          </Badge>
                        ))}
                      </div>
                    </div>

                    {/* Can Help With */}
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <Target className="h-4 w-4" />
                        What can they help you with?
                      </Label>
                      <div className="flex gap-2">
                        <Input
                          placeholder="e.g., Introductions, Technical advice..."
                          value={helpInput}
                          onChange={(e) => setHelpInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              addToArray("can_help_with", helpInput, setHelpInput);
                            }
                          }}
                        />
                        <Button
                          variant="outline"
                          onClick={() => addToArray("can_help_with", helpInput, setHelpInput)}
                        >
                          Add
                        </Button>
                      </div>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {formData.can_help_with.map((item) => (
                          <Badge key={item} className="gap-1 bg-green-100 text-green-700">
                            {item}
                            <X
                              className="h-3 w-3 cursor-pointer"
                              onClick={() => removeFromArray("can_help_with", item)}
                            />
                          </Badge>
                        ))}
                      </div>
                    </div>

                    {/* Looking For */}
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <Target className="h-4 w-4" />
                        What are they looking for?
                      </Label>
                      <div className="flex gap-2">
                        <Input
                          placeholder="e.g., Funding, Partnerships, Talent..."
                          value={lookingInput}
                          onChange={(e) => setLookingInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              addToArray("looking_for", lookingInput, setLookingInput);
                            }
                          }}
                        />
                        <Button
                          variant="outline"
                          onClick={() => addToArray("looking_for", lookingInput, setLookingInput)}
                        >
                          Add
                        </Button>
                      </div>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {formData.looking_for.map((item) => (
                          <Badge key={item} className="gap-1 bg-blue-100 text-blue-700">
                            {item}
                            <X
                              className="h-3 w-3 cursor-pointer"
                              onClick={() => removeFromArray("looking_for", item)}
                            />
                          </Badge>
                        ))}
                      </div>
                    </div>

                    {/* Tags */}
                    <div className="space-y-2">
                      <Label>Tags</Label>
                      <div className="flex gap-2">
                        <Input
                          placeholder="e.g., investor, advisor, NYC..."
                          value={tagInput}
                          onChange={(e) => setTagInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              addToArray("tags", tagInput, setTagInput);
                            }
                          }}
                        />
                        <Button
                          variant="outline"
                          onClick={() => addToArray("tags", tagInput, setTagInput)}
                        >
                          Add
                        </Button>
                      </div>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {formData.tags.map((tag) => (
                          <Badge key={tag} variant="outline" className="gap-1">
                            {tag}
                            <X
                              className="h-3 w-3 cursor-pointer"
                              onClick={() => removeFromArray("tags", tag)}
                            />
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Personal Section */}
              {activeSection === "personal" && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      <Heart className="h-5 w-5" />
                      Personal Notes
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Details to remember for building rapport
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="spouse_partner_name">Spouse / Partner Name</Label>
                      <Input
                        id="spouse_partner_name"
                        placeholder="Jane"
                        value={formData.spouse_partner_name}
                        onChange={(e) => updateField("spouse_partner_name", e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="children_names">Children&apos;s Names</Label>
                      <Input
                        id="children_names"
                        placeholder="Emma, Jack"
                        value={formData.children_names}
                        onChange={(e) => updateField("children_names", e.target.value)}
                      />
                    </div>

                    <div className="col-span-2 space-y-2">
                      <Label className="flex items-center gap-2">
                        <Gift className="h-4 w-4" />
                        Hobbies
                      </Label>
                      <div className="flex gap-2">
                        <Input
                          placeholder="e.g., Golf, Photography, Cooking..."
                          value={hobbyInput}
                          onChange={(e) => setHobbyInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              addToArray("hobbies", hobbyInput, setHobbyInput);
                            }
                          }}
                        />
                        <Button
                          variant="outline"
                          onClick={() => addToArray("hobbies", hobbyInput, setHobbyInput)}
                        >
                          Add
                        </Button>
                      </div>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {formData.hobbies.map((hobby) => (
                          <Badge key={hobby} variant="secondary" className="gap-1">
                            {hobby}
                            <X
                              className="h-3 w-3 cursor-pointer"
                              onClick={() => removeFromArray("hobbies", hobby)}
                            />
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div className="col-span-2 space-y-2">
                      <Label htmlFor="favorite_things">Favorite Things</Label>
                      <Textarea
                        id="favorite_things"
                        placeholder="Favorite restaurants, sports teams, books, etc..."
                        value={formData.favorite_things}
                        onChange={(e) => updateField("favorite_things", e.target.value)}
                        rows={2}
                      />
                    </div>

                    <div className="col-span-2 space-y-2">
                      <Label htmlFor="conversation_starters">
                        <MessageSquare className="h-4 w-4 inline mr-2" />
                        Conversation Starters
                      </Label>
                      <Textarea
                        id="conversation_starters"
                        placeholder="Topics they love discussing, things to ask about..."
                        value={formData.conversation_starters}
                        onChange={(e) => updateField("conversation_starters", e.target.value)}
                        rows={3}
                      />
                    </div>

                    <div className="col-span-2 space-y-2">
                      <Label htmlFor="notes">General Notes</Label>
                      <Textarea
                        id="notes"
                        placeholder="Any other important information to remember..."
                        value={formData.notes}
                        onChange={(e) => updateField("notes", e.target.value)}
                        rows={4}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="border-t p-4 flex items-center justify-between bg-muted/30">
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={goToPrevSection}
                  disabled={currentSectionIndex === 0}
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={goToNextSection}
                  disabled={currentSectionIndex === SECTIONS.length - 1}
                >
                  Next
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>

              <div className="flex items-center gap-2">
                <Button variant="outline" onClick={() => onOpenChange(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSave} disabled={saving}>
                  {saving ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Check className="h-4 w-4 mr-2" />
                      {mode === "edit" ? "Save Changes" : "Create Contact"}
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
