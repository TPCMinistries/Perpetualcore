"use client";

import { useState } from "react";
import { CheckCircle2, Loader2 } from "lucide-react";

export default function EnterpriseDemoBookingForm() {
  const [formData, setFormData] = useState({
    email: "",
    full_name: "",
    company_name: "",
    job_title: "",
    phone: "",
    company_size: "",
    industry: "",
    use_case: "",
    estimated_users: "",
    required_features: [] as string[],
    compliance_requirements: [] as string[],
    notes: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");

    try {
      const response = await fetch("/api/enterprise/demo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        setIsSuccess(true);
        // Reset form
        setFormData({
          email: "",
          full_name: "",
          company_name: "",
          job_title: "",
          phone: "",
          company_size: "",
          industry: "",
          use_case: "",
          estimated_users: "",
          required_features: [],
          compliance_requirements: [],
          notes: "",
        });
      } else {
        setError(data.error || "Something went wrong. Please try again.");
      }
    } catch (err) {
      setError("Network error. Please check your connection and try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleArrayField = (field: "required_features" | "compliance_requirements", value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: prev[field].includes(value)
        ? prev[field].filter((item) => item !== value)
        : [...prev[field], value],
    }));
  };

  if (isSuccess) {
    return (
      <div className="bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-950/30 dark:to-indigo-950/30 rounded-2xl p-8 border border-purple-200 dark:border-purple-800">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-purple-100 dark:bg-purple-900/50 mb-4">
            <CheckCircle2 className="h-8 w-8 text-purple-600 dark:text-purple-400" />
          </div>
          <h3 className="text-2xl font-bold text-purple-900 dark:text-purple-100 mb-2">
            Demo Request Received!
          </h3>
          <p className="text-purple-700 dark:text-purple-300 mb-4">
            Our enterprise team will contact you within 24 hours to schedule your personalized demo.
          </p>
          <p className="text-sm text-purple-600 dark:text-purple-400">
            Check your email for confirmation and preparation details.
          </p>
          <button
            onClick={() => setIsSuccess(false)}
            className="mt-6 text-sm text-purple-700 dark:text-purple-300 hover:underline"
          >
            Submit another request
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Full Name */}
      <div>
        <label htmlFor="full_name" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
          Full Name *
        </label>
        <input
          type="text"
          id="full_name"
          required
          value={formData.full_name}
          onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
          className="w-full px-4 py-3 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
          placeholder="Jane Smith"
        />
      </div>

      {/* Email */}
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
          Work Email *
        </label>
        <input
          type="email"
          id="email"
          required
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          className="w-full px-4 py-3 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
          placeholder="jane@company.com"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Company Name */}
        <div>
          <label htmlFor="company_name" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
            Company Name *
          </label>
          <input
            type="text"
            id="company_name"
            required
            value={formData.company_name}
            onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
            className="w-full px-4 py-3 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
            placeholder="Acme Corporation"
          />
        </div>

        {/* Job Title */}
        <div>
          <label htmlFor="job_title" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
            Job Title
          </label>
          <input
            type="text"
            id="job_title"
            value={formData.job_title}
            onChange={(e) => setFormData({ ...formData, job_title: e.target.value })}
            className="w-full px-4 py-3 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
            placeholder="VP of Engineering"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Phone */}
        <div>
          <label htmlFor="phone" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
            Phone Number
          </label>
          <input
            type="tel"
            id="phone"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            className="w-full px-4 py-3 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
            placeholder="+1 (555) 123-4567"
          />
        </div>

        {/* Company Size */}
        <div>
          <label htmlFor="company_size" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
            Company Size
          </label>
          <select
            id="company_size"
            value={formData.company_size}
            onChange={(e) => setFormData({ ...formData, company_size: e.target.value })}
            className="w-full px-4 py-3 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
          >
            <option value="">Select company size...</option>
            <option value="1-50">1-50 employees</option>
            <option value="51-200">51-200 employees</option>
            <option value="201-1000">201-1,000 employees</option>
            <option value="1001-5000">1,001-5,000 employees</option>
            <option value="5000+">5,000+ employees</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Industry */}
        <div>
          <label htmlFor="industry" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
            Industry
          </label>
          <select
            id="industry"
            value={formData.industry}
            onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
            className="w-full px-4 py-3 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
          >
            <option value="">Select industry...</option>
            <option value="Technology">Technology</option>
            <option value="Financial Services">Financial Services</option>
            <option value="Healthcare">Healthcare</option>
            <option value="Manufacturing">Manufacturing</option>
            <option value="Retail">Retail</option>
            <option value="Professional Services">Professional Services</option>
            <option value="Education">Education</option>
            <option value="Government">Government</option>
            <option value="Other">Other</option>
          </select>
        </div>

        {/* Estimated Users */}
        <div>
          <label htmlFor="estimated_users" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
            Estimated Users
          </label>
          <select
            id="estimated_users"
            value={formData.estimated_users}
            onChange={(e) => setFormData({ ...formData, estimated_users: e.target.value })}
            className="w-full px-4 py-3 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
          >
            <option value="">Select number of users...</option>
            <option value="1-25">1-25 users</option>
            <option value="26-100">26-100 users</option>
            <option value="101-500">101-500 users</option>
            <option value="501-2000">501-2,000 users</option>
            <option value="2000+">2,000+ users</option>
          </select>
        </div>
      </div>

      {/* Use Case */}
      <div>
        <label htmlFor="use_case" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
          Primary Use Case
        </label>
        <select
          id="use_case"
          value={formData.use_case}
          onChange={(e) => setFormData({ ...formData, use_case: e.target.value })}
          className="w-full px-4 py-3 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
        >
          <option value="">Select primary use case...</option>
          <option value="Internal Knowledge Management">Internal Knowledge Management</option>
          <option value="Customer Support">Customer Support</option>
          <option value="Research & Development">Research & Development</option>
          <option value="Sales Enablement">Sales Enablement</option>
          <option value="Document Management">Document Management</option>
          <option value="Team Collaboration">Team Collaboration</option>
          <option value="Training & Onboarding">Training & Onboarding</option>
          <option value="Other">Other</option>
        </select>
      </div>

      {/* Required Features */}
      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
          Required Features
        </label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {[
            "SSO / SAML Authentication",
            "Custom Integrations",
            "Advanced Security & Compliance",
            "Dedicated Support",
            "Custom Branding",
            "Advanced Analytics",
            "API Access",
            "On-Premise Deployment",
          ].map((feature) => (
            <label
              key={feature}
              className="flex items-center space-x-3 p-3 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg cursor-pointer hover:border-purple-400 dark:hover:border-purple-500 transition-all"
            >
              <input
                type="checkbox"
                checked={formData.required_features.includes(feature)}
                onChange={() => toggleArrayField("required_features", feature)}
                className="w-4 h-4 text-purple-600 bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 rounded focus:ring-2 focus:ring-purple-500"
              />
              <span className="text-sm text-slate-700 dark:text-slate-300">{feature}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Compliance Requirements */}
      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
          Compliance Requirements
        </label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {[
            "SOC 2 Type II",
            "GDPR",
            "HIPAA",
            "ISO 27001",
            "CCPA",
            "FedRAMP",
          ].map((compliance) => (
            <label
              key={compliance}
              className="flex items-center space-x-3 p-3 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg cursor-pointer hover:border-purple-400 dark:hover:border-purple-500 transition-all"
            >
              <input
                type="checkbox"
                checked={formData.compliance_requirements.includes(compliance)}
                onChange={() => toggleArrayField("compliance_requirements", compliance)}
                className="w-4 h-4 text-purple-600 bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 rounded focus:ring-2 focus:ring-purple-500"
              />
              <span className="text-sm text-slate-700 dark:text-slate-300">{compliance}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Notes */}
      <div>
        <label htmlFor="notes" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
          Additional Details (Optional)
        </label>
        <textarea
          id="notes"
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          rows={4}
          className="w-full px-4 py-3 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all resize-none"
          placeholder="Tell us about your specific requirements, timeline, or any questions you have..."
        />
      </div>

      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
        </div>
      )}

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full px-6 py-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold rounded-xl transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin" />
            Submitting Request...
          </>
        ) : (
          "Request Enterprise Demo"
        )}
      </button>

      <p className="text-xs text-center text-slate-500 dark:text-slate-400">
        Our enterprise team will contact you within 24 business hours
      </p>
    </form>
  );
}
