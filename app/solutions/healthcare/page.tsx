"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  CheckCircle2, Heart, FileText, Shield, Clock, Users, Brain, TrendingUp,
  XCircle, AlertCircle, Sparkles, MessageSquare, Infinity, Zap, Database, Lock,
  Search, ClipboardList, Phone, FileCheck, Minus, Plus
} from "lucide-react";

export default function HealthcarePage() {
  // FAQ State
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <header className="border-b bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-2">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-bold">
              AI
            </div>
            <span className="text-xl font-bold">Perpetual Core</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/pricing" className="text-sm font-medium hover:underline">
              Pricing
            </Link>
            <Link href="/contact-sales" className="text-sm font-medium hover:underline">
              Contact Sales
            </Link>
            <Button asChild>
              <Link href="/signup?plan=healthcare">Start Free Trial</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <div className="max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300 px-4 py-2 rounded-full text-sm font-medium mb-6">
            <Heart className="h-4 w-4" />
            Built for Healthcare Professionals
          </div>
          <h1 className="text-5xl md:text-6xl font-bold tracking-tight mb-6">
            Your HIPAA-Compliant
            <span className="block text-primary mt-2">AI Clinical Assistant</span>
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Built to help healthcare providers reduce documentation burden, streamline patient communications,
            and spend more time on patient care. HIPAA-compliant and secure.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" asChild>
              <Link href="/contact-sales?plan=healthcare">Schedule Demo</Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="#features">See Features</Link>
            </Button>
          </div>
          <p className="text-sm text-muted-foreground mt-6">
            14-day free trial • $899/provider/month • 100% HIPAA compliant
          </p>
        </div>
      </section>

      {/* Stats Section */}
      <section className="bg-muted/50 py-16">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold text-primary mb-2">∞</div>
              <div className="text-sm text-muted-foreground">Patient History Memory</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-primary mb-2">24/7</div>
              <div className="text-sm text-muted-foreground">AI Coach Available</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-primary mb-2">100%</div>
              <div className="text-sm text-muted-foreground">HIPAA Compliant</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-primary mb-2">
                <Shield className="h-10 w-10 mx-auto text-primary" />
              </div>
              <div className="text-sm text-muted-foreground">Encrypted & Secure</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="container mx-auto px-4 py-20">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-4">Built for Healthcare Workflows</h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            HIPAA-compliant AI tools designed for clinical practice
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          <Card className="border-2 hover:border-primary transition-colors">
            <CardHeader>
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <FileText className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>Clinical Documentation</CardTitle>
              <CardDescription>
                AI-assisted note generation from voice or text. Draft SOAP notes, H&Ps,
                discharge summaries in seconds. You review and approve.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-2 hover:border-primary transition-colors">
            <CardHeader>
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>Patient Communication</CardTitle>
              <CardDescription>
                AI drafts patient-friendly explanations, post-visit summaries, and
                follow-up instructions. Maintain your voice and style.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-2 hover:border-primary transition-colors">
            <CardHeader>
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <Brain className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>Knowledge Base</CardTitle>
              <CardDescription>
                Upload clinical protocols, treatment guidelines, and reference materials.
                AI retrieves relevant info during patient encounters.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-2 hover:border-primary transition-colors">
            <CardHeader>
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <Shield className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>HIPAA Compliance</CardTitle>
              <CardDescription>
                End-to-end encryption, BAA included, audit logs, and compliance monitoring.
                Your patient data never trains AI models.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-2 hover:border-primary transition-colors">
            <CardHeader>
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <Clock className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>Automated Scheduling</CardTitle>
              <CardDescription>
                AI manages appointment reminders, follow-up scheduling, and patient
                outreach. Reduces no-shows and improves continuity of care.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-2 hover:border-primary transition-colors">
            <CardHeader>
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <Zap className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>EHR Integration</CardTitle>
              <CardDescription>
                Built to integrate with major EHR systems. Pull patient data, write notes
                back, and maintain a single source of truth.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </section>

      {/* Institutional Brain Section */}
      <section className="bg-gradient-to-b from-muted/50 to-white dark:from-muted/20 dark:to-gray-900 py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <div className="inline-flex items-center gap-2 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 px-4 py-2 rounded-full text-sm font-semibold mb-4">
                <Brain className="h-4 w-4" />
                Your Practice's Institutional Brain
              </div>
              <h2 className="text-4xl md:text-5xl font-bold mb-4">
                Preserve Decades of Clinical Expertise
              </h2>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                When senior physicians retire, decades of clinical wisdom walks out the door. Perpetual Core captures and
                preserves your practice's collective expertise so it compounds over time instead of disappearing.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-12 items-center mb-12">
              {/* Left: The Problem */}
              <Card className="border-2 border-red-200 dark:border-red-900/30">
                <CardHeader className="bg-red-50 dark:bg-red-900/10">
                  <CardTitle className="text-2xl flex items-center gap-2">
                    <AlertCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
                    Without Perpetual Core
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div className="flex gap-3">
                      <XCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <div className="font-semibold mb-1">Knowledge Walks Out the Door</div>
                        <p className="text-sm text-muted-foreground">
                          When experienced physicians retire, their diagnostic approaches, patient management
                          strategies, and clinical judgment disappear forever.
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <XCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <div className="font-semibold mb-1">Reinventing the Wheel</div>
                        <p className="text-sm text-muted-foreground">
                          New providers repeat the same clinical research, make the same mistakes, and rediscover
                          solutions that colleagues already figured out years ago.
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <XCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <div className="font-semibold mb-1">Inconsistent Patient Care</div>
                        <p className="text-sm text-muted-foreground">
                          Every physician has their own approach. Patients get different quality of care depending
                          on who they see. Best practices stay locked in individual heads.
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <XCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <div className="font-semibold mb-1">Slow Onboarding</div>
                        <p className="text-sm text-muted-foreground">
                          New physicians spend months or years learning institutional knowledge through trial and
                          error, asking colleagues, and reviewing old charts.
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Right: The Solution */}
              <Card className="border-2 border-green-200 dark:border-green-900/30">
                <CardHeader className="bg-green-50 dark:bg-green-900/10">
                  <CardTitle className="text-2xl flex items-center gap-2">
                    <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-400" />
                    With Perpetual Core: Your Institutional Brain
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div className="flex gap-3">
                      <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <div className="font-semibold mb-1">Expertise Preserved Forever</div>
                        <p className="text-sm text-muted-foreground">
                          Capture senior physicians' clinical reasoning, diagnostic approaches, and patient
                          communication styles. Their wisdom remains accessible to the entire practice.
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <div className="font-semibold mb-1">Collective Intelligence</div>
                        <p className="text-sm text-muted-foreground">
                          Every treatment protocol, clinical decision, and patient outcome becomes part of your
                          practice's growing knowledge base. Everyone benefits from collective experience.
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <div className="font-semibold mb-1">Consistent Excellence</div>
                        <p className="text-sm text-muted-foreground">
                          Every provider can access your practice's best approaches to common conditions.
                          Patients receive consistently excellent care regardless of who they see.
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <div className="font-semibold mb-1">Instant Onboarding</div>
                        <p className="text-sm text-muted-foreground">
                          New physicians get immediate access to decades of institutional knowledge. They're
                          productive from day one with the collective wisdom of your entire practice.
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Real-World Example */}
            <Card className="border-2 border-primary">
              <CardHeader className="bg-gradient-to-r from-primary/5 to-purple-500/5">
                <CardTitle className="text-2xl">Real-World Example: Cardiology Practice</CardTitle>
                <CardDescription className="text-base">
                  How one practice preserved 30 years of clinical expertise
                </CardDescription>
              </CardHeader>
              <CardContent className="p-8">
                <div className="space-y-6">
                  <div>
                    <h4 className="font-semibold mb-2 flex items-center gap-2">
                      <AlertCircle className="h-5 w-5 text-blue-600" />
                      The Situation
                    </h4>
                    <p className="text-muted-foreground">
                      A senior cardiologist with 30 years of experience was retiring. She had exceptional
                      diagnostic skills, particularly for complex arrhythmias. Junior physicians relied on her
                      judgment daily. The practice faced losing this irreplaceable expertise.
                    </p>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2 flex items-center gap-2">
                      <Zap className="h-5 w-5 text-purple-600" />
                      The Perpetual Core Solution
                    </h4>
                    <p className="text-muted-foreground mb-3">
                      Before retirement, the practice uploaded to Perpetual Core:
                    </p>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <span>Her diagnostic frameworks for differentiating arrhythmias</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <span>Patient communication templates for complex cardiac conditions</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <span>Treatment protocols refined over 30 years of practice</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <span>Clinical pearls and warning signs for serious cardiac events</span>
                      </li>
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2 flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-green-600" />
                      The Result
                    </h4>
                    <p className="text-muted-foreground mb-3">
                      Now, when any physician encounters a complex arrhythmia:
                    </p>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <span>They ask Perpetual Core: "How would we approach this rhythm on EKG?"</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <span>AI instantly provides the senior cardiologist's diagnostic framework</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <span>Includes specific warning signs and next steps she would recommend</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <span>Her 30 years of expertise continues serving patients—even after retirement</span>
                      </li>
                    </ul>
                  </div>

                  <div className="border-t pt-6">
                    <div className="bg-green-50 dark:bg-green-900/10 rounded-lg p-6 border border-green-200 dark:border-green-900/30">
                      <p className="text-sm text-muted-foreground">
                        <strong className="text-green-700 dark:text-green-300">The Bottom Line:</strong> Your practice's
                        institutional knowledge grows stronger every year instead of disappearing when people retire.
                        Every physician who ever worked at your practice contributes to a growing intelligence that
                        makes everyone better.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Security & Compliance Section */}
      <section className="bg-gradient-to-b from-primary/5 to-white dark:from-primary/10 dark:to-gray-900 py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <div className="inline-flex items-center gap-2 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 px-4 py-2 rounded-full text-sm font-semibold mb-4">
                <Shield className="h-4 w-4" />
                HIPAA Compliant & Secure
              </div>
              <h2 className="text-4xl md:text-5xl font-bold mb-4">
                Built for Healthcare Security Standards
              </h2>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                Your patient data is protected with enterprise-grade security, full HIPAA compliance,
                and zero-knowledge architecture. We take healthcare privacy seriously.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8 mb-12">
              <Card className="border-2">
                <CardHeader>
                  <div className="h-12 w-12 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center mb-4">
                    <Shield className="h-6 w-6 text-green-600 dark:text-green-400" />
                  </div>
                  <CardTitle>HIPAA Compliant</CardTitle>
                  <CardDescription>
                    Full HIPAA compliance with signed Business Associate Agreement (BAA) included.
                    All patient data is encrypted and protected according to HIPAA requirements.
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card className="border-2">
                <CardHeader>
                  <div className="h-12 w-12 rounded-full bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center mb-4">
                    <Lock className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <CardTitle>End-to-End Encryption</CardTitle>
                  <CardDescription>
                    256-bit encryption at rest and in transit. Zero-knowledge architecture means
                    we cannot access your patient data—only you can.
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card className="border-2">
                <CardHeader>
                  <div className="h-12 w-12 rounded-full bg-purple-100 dark:bg-purple-900/20 flex items-center justify-center mb-4">
                    <Database className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                  </div>
                  <CardTitle>Never Trains AI Models</CardTitle>
                  <CardDescription>
                    Your patient data is NEVER used to train AI models. Your clinical notes,
                    protocols, and patient information remain completely private.
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card className="border-2">
                <CardHeader>
                  <div className="h-12 w-12 rounded-full bg-orange-100 dark:bg-orange-900/20 flex items-center justify-center mb-4">
                    <FileText className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                  </div>
                  <CardTitle>Complete Audit Logs</CardTitle>
                  <CardDescription>
                    Full audit trails of all data access, changes, and system activity.
                    Meet compliance requirements with detailed logging and reporting.
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card className="border-2">
                <CardHeader>
                  <div className="h-12 w-12 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center mb-4">
                    <Users className="h-6 w-6 text-red-600 dark:text-red-400" />
                  </div>
                  <CardTitle>Role-Based Access</CardTitle>
                  <CardDescription>
                    Granular permissions control who can see what. Ensure only authorized
                    providers access patient data based on their role.
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card className="border-2">
                <CardHeader>
                  <div className="h-12 w-12 rounded-full bg-indigo-100 dark:bg-indigo-900/20 flex items-center justify-center mb-4">
                    <CheckCircle2 className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <CardTitle>SOC 2 Type II Certified</CardTitle>
                  <CardDescription>
                    Third-party audited and certified for security, availability, and confidentiality.
                    Trusted by healthcare systems' IT security teams.
                  </CardDescription>
                </CardHeader>
              </Card>
            </div>

            <Card className="border-2 border-green-500 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/10 dark:to-emerald-900/10">
              <CardContent className="p-8">
                <div className="flex items-start gap-4">
                  <div className="h-12 w-12 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
                    <Shield className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold mb-3 text-green-900 dark:text-green-100">
                      Healthcare-Grade Security You Can Trust
                    </h3>
                    <p className="text-muted-foreground leading-relaxed mb-4">
                      Perpetual Core is built specifically for healthcare providers with the strictest security standards.
                      We understand that patient confidentiality is non-negotiable. Every architectural decision
                      prioritizes data protection and HIPAA compliance.
                    </p>
                    <div className="grid md:grid-cols-2 gap-4 text-sm">
                      <div className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                        <span>Signed BAA included with every plan</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                        <span>Regular third-party security audits</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                        <span>Automatic data backup and recovery</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                        <span>99.9% uptime SLA guarantee</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                        <span>Multi-factor authentication (MFA)</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                        <span>Breach notification protocols</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Use Cases Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              How Healthcare Providers Use Perpetual Core
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Built to solve the everyday challenges facing healthcare professionals
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Clinical Documentation Automation */}
            <Card className="border-2 hover:border-primary transition-all hover:shadow-xl">
              <CardHeader>
                <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center mb-4">
                  <ClipboardList className="h-7 w-7 text-white" />
                </div>
                <CardTitle className="text-2xl mb-3">Clinical Documentation Automation</CardTitle>
                <CardDescription className="text-base leading-relaxed">
                  Dictate or type key patient visit details. AI generates complete SOAP notes, H&Ps,
                  or discharge summaries in your documentation style. Review, approve, and sign in seconds.
                  Reduce charting time by 75%.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>Voice-to-text documentation during patient visits</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>Specialty-specific templates (cardiology, ortho, primary care)</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>Learns your documentation preferences over time</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Patient Communication */}
            <Card className="border-2 hover:border-primary transition-all hover:shadow-xl">
              <CardHeader>
                <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center mb-4">
                  <Phone className="h-7 w-7 text-white" />
                </div>
                <CardTitle className="text-2xl mb-3">Patient Communication</CardTitle>
                <CardDescription className="text-base leading-relaxed">
                  Draft patient-friendly visit summaries, treatment explanations, and follow-up instructions
                  in seconds. AI maintains your voice and ensures clear, compassionate communication
                  that patients can understand.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>Post-visit summaries in plain language</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>Treatment plan explanations at appropriate reading level</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>Automated appointment reminders and follow-up messages</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Treatment Protocol Lookup */}
            <Card className="border-2 hover:border-primary transition-all hover:shadow-xl">
              <CardHeader>
                <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center mb-4">
                  <Search className="h-7 w-7 text-white" />
                </div>
                <CardTitle className="text-2xl mb-3">Treatment Protocol Lookup</CardTitle>
                <CardDescription className="text-base leading-relaxed">
                  Upload clinical guidelines, treatment protocols, and reference materials.
                  During patient visits, ask AI for protocol recommendations and get instant,
                  evidence-based answers from your trusted sources.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>Instant access to clinical guidelines and protocols</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>Drug dosing, contraindications, and interaction checks</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>Specialty-specific decision support tools</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Prior Authorization Workflows */}
            <Card className="border-2 hover:border-primary transition-all hover:shadow-xl">
              <CardHeader>
                <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center mb-4">
                  <FileCheck className="h-7 w-7 text-white" />
                </div>
                <CardTitle className="text-2xl mb-3">Prior Authorization Workflows</CardTitle>
                <CardDescription className="text-base leading-relaxed">
                  Automate the tedious prior authorization process. AI fills out forms, gathers
                  required documentation, and drafts clinical justifications. Turn 2-hour tasks
                  into 10-minute reviews.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>Auto-populate prior auth forms from patient records</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>Generate clinical justification letters</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>Track submission status and follow-up requirements</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Before/After Comparison - Day in the Life */}
      <section className="bg-gradient-to-b from-muted/50 to-white dark:from-muted/20 dark:to-gray-900 py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              A Day in the Life: Before vs After Perpetual Core
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              See how Perpetual Core can transform daily clinical workflows
            </p>
          </div>

          <div className="max-w-6xl mx-auto">
            <div className="grid md:grid-cols-2 gap-8">
              {/* BEFORE */}
              <Card className="border-2 border-red-200 dark:border-red-900/30">
                <CardHeader className="bg-red-50 dark:bg-red-900/10 border-b">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-red-500 flex items-center justify-center">
                      <XCircle className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-2xl">Before Perpetual Core</CardTitle>
                      <CardDescription>Traditional Clinical Workflow</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-6">
                    <div>
                      <div className="font-semibold text-red-700 dark:text-red-400 mb-2 text-lg">9:00 AM - Patient Visits Start</div>
                      <p className="text-sm text-muted-foreground">
                        See 20 patients throughout the day. Between each visit, manually type clinical notes
                        while trying to recall details. Fall behind schedule.
                      </p>
                      <div className="mt-2 text-xs text-red-600 dark:text-red-400 font-medium">⏰ 4 hours on documentation</div>
                    </div>

                    <div>
                      <div className="font-semibold text-red-700 dark:text-red-400 mb-2 text-lg">1:00 PM - Running Late</div>
                      <p className="text-sm text-muted-foreground">
                        45 minutes behind. Patients waiting. Rush through visits to catch up.
                        Documentation piles up for after-hours work.
                      </p>
                      <div className="mt-2 text-xs text-red-600 dark:text-red-400 font-medium">⏰ Patient care suffers</div>
                    </div>

                    <div>
                      <div className="font-semibold text-red-700 dark:text-red-400 mb-2 text-lg">6:00 PM - Clinic Closes</div>
                      <p className="text-sm text-muted-foreground">
                        Last patient leaves. Still have 12 chart notes to complete, 15 patient messages
                        to respond to, and prior authorizations to submit.
                      </p>
                      <div className="mt-2 text-xs text-red-600 dark:text-red-400 font-medium">⏰ 2+ hours of charting remains</div>
                    </div>

                    <div>
                      <div className="font-semibold text-red-700 dark:text-red-400 mb-2 text-lg">8:00 PM - Finally Done</div>
                      <p className="text-sm text-muted-foreground">
                        Finish last note at home. Too exhausted to spend time with family.
                        Burnout feels inevitable.
                      </p>
                      <div className="mt-2 text-xs text-red-600 dark:text-red-400 font-medium">⏰ Work-life balance suffers</div>
                    </div>

                    <div className="border-t pt-4 mt-6">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-lg">Total Work Day:</span>
                        <span className="text-3xl font-bold text-red-600 dark:text-red-400">11+ hours</span>
                      </div>
                      <div className="text-sm text-muted-foreground mt-2">
                        High burnout • Poor work-life balance • Administrative overload
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* AFTER */}
              <Card className="border-2 border-green-200 dark:border-green-900/30">
                <CardHeader className="bg-green-50 dark:bg-green-900/10 border-b">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-green-500 flex items-center justify-center">
                      <CheckCircle2 className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-2xl">After Perpetual Core</CardTitle>
                      <CardDescription>AI-Powered Clinical Workflow</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-6">
                    <div>
                      <div className="font-semibold text-green-700 dark:text-green-400 mb-2 text-lg">9:00 AM - Patient Visits Start</div>
                      <p className="text-sm text-muted-foreground">
                        See same 20 patients. After each visit, dictate key points to AI. SOAP note
                        generated in 30 seconds. Review, approve, sign. Stay on schedule.
                      </p>
                      <div className="mt-2 text-xs text-green-600 dark:text-green-400 font-medium">⏰ 1 hour total documentation time</div>
                    </div>

                    <div>
                      <div className="font-semibold text-green-700 dark:text-green-400 mb-2 text-lg">1:00 PM - On Time</div>
                      <p className="text-sm text-muted-foreground">
                        Running on schedule. AI drafted patient follow-up messages during lunch.
                        Spend quality time with each patient without worry.
                      </p>
                      <div className="mt-2 text-xs text-green-600 dark:text-green-400 font-medium">⏰ No backlog, no stress</div>
                    </div>

                    <div>
                      <div className="font-semibold text-green-700 dark:text-green-400 mb-2 text-lg">5:30 PM - Last Patient</div>
                      <p className="text-sm text-muted-foreground">
                        All notes completed. AI handled routine patient messages and flagged urgent ones.
                        Prior auth paperwork auto-generated and ready for review.
                      </p>
                      <div className="mt-2 text-xs text-green-600 dark:text-green-400 font-medium">⏰ Inbox zero achieved</div>
                    </div>

                    <div>
                      <div className="font-semibold text-green-700 dark:text-green-400 mb-2 text-lg">6:00 PM - Done for the Day</div>
                      <p className="text-sm text-muted-foreground">
                        Leave clinic on time. Spend evening with family. No charts to finish.
                        Feel energized and ready for tomorrow.
                      </p>
                      <div className="mt-2 text-xs text-green-600 dark:text-green-400 font-medium">⏰ Work-life balance restored</div>
                    </div>

                    <div className="border-t pt-4 mt-6">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-lg">Total Work Day:</span>
                        <span className="text-3xl font-bold text-green-600 dark:text-green-400">~8 hours</span>
                      </div>
                      <div className="text-sm text-muted-foreground mt-2">
                        Low burnout • Great work-life balance • More patient time
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Bottom Impact Summary */}
            <Card className="mt-8 border-2 border-primary bg-gradient-to-r from-primary/5 to-purple-500/5">
              <CardContent className="p-8">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground mb-4">
                    <em>Illustrative example showing potential time savings. Actual results vary by practice and specialty.</em>
                  </p>
                  <div className="grid md:grid-cols-3 gap-6 text-center">
                    <div>
                      <div className="text-4xl font-bold text-primary mb-2">75%</div>
                      <div className="text-sm text-muted-foreground">Less Documentation Time</div>
                    </div>
                    <div>
                      <div className="text-4xl font-bold text-primary mb-2">Hours</div>
                      <div className="text-sm text-muted-foreground">Saved Per Day</div>
                    </div>
                    <div>
                      <div className="text-4xl font-bold text-primary mb-2">Better</div>
                      <div className="text-sm text-muted-foreground">Work-Life Balance</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* AI Coach Feature Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-full text-sm font-semibold mb-4">
              ✨ Featured: 24/7 AI Coach
            </div>
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Your AI Coach, Always Available
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Never feel lost using the platform. Your AI coach answers questions 24/7,
              guides you through workflows, and helps you get the most out of Perpetual Core.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-12 items-center mb-12">
            {/* Left: Feature Description */}
            <div className="space-y-6">
              <h3 className="text-3xl font-bold">Ask Anything, Anytime</h3>
              <p className="text-muted-foreground leading-relaxed">
                Questions about HIPAA compliance? Need help setting up clinical templates?
                Want to integrate with your EHR? Just ask your AI Coach.
              </p>

              <div className="space-y-4">
                {[
                  {
                    title: "Instant Answers",
                    desc: "Get immediate help without waiting for support tickets or phone calls."
                  },
                  {
                    title: "Clinical Context",
                    desc: "The AI Coach understands healthcare workflows and provides relevant guidance."
                  },
                  {
                    title: "Always Learning",
                    desc: "As you use the platform, your AI Coach learns your preferences and specialty needs."
                  },
                  {
                    title: "HIPAA Trained",
                    desc: "Understands healthcare privacy requirements and guides you on compliant usage."
                  }
                ].map((item, i) => (
                  <div key={i} className="flex gap-4">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <CheckCircle2 className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <div className="font-semibold mb-1">{item.title}</div>
                      <div className="text-sm text-muted-foreground">{item.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Example Interaction */}
            <Card className="border-2 border-primary">
              <CardHeader className="bg-gradient-to-r from-primary/5 to-purple-500/5">
                <CardTitle className="flex items-center gap-2">
                  <Brain className="h-5 w-5" />
                  AI Coach in Action
                </CardTitle>
                <CardDescription>Real example conversation</CardDescription>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                {/* User Message */}
                <div className="flex gap-3">
                  <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                    <Users className="h-4 w-4" />
                  </div>
                  <div className="flex-1">
                    <div className="bg-muted rounded-lg p-3">
                      <p className="text-sm">"How do I set up clinical note templates for my specialty?"</p>
                    </div>
                  </div>
                </div>

                {/* AI Response */}
                <div className="flex gap-3">
                  <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                    <Sparkles className="h-4 w-4 text-primary-foreground" />
                  </div>
                  <div className="flex-1">
                    <div className="bg-primary/5 rounded-lg p-3 border border-primary/20">
                      <p className="text-sm mb-3">I'll help you create specialty-specific templates:</p>
                      <ol className="text-sm space-y-2 list-decimal list-inside">
                        <li>Go to Settings → Documentation Templates</li>
                        <li>Click "New Template"</li>
                        <li>Select your specialty from the dropdown</li>
                        <li>Choose from pre-built templates or create custom</li>
                        <li>Add your preferred sections and formatting</li>
                      </ol>
                      <p className="text-sm mt-3 text-muted-foreground">
                        💡 <strong>Tip:</strong> We have cardiology templates ready to use. Want me to activate those for you?
                      </p>
                    </div>
                  </div>
                </div>

                {/* User Follow-up */}
                <div className="flex gap-3">
                  <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                    <Users className="h-4 w-4" />
                  </div>
                  <div className="flex-1">
                    <div className="bg-muted rounded-lg p-3">
                      <p className="text-sm">"Is this HIPAA compliant?"</p>
                    </div>
                  </div>
                </div>

                {/* AI Response 2 */}
                <div className="flex gap-3">
                  <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                    <Sparkles className="h-4 w-4 text-primary-foreground" />
                  </div>
                  <div className="flex-1">
                    <div className="bg-primary/5 rounded-lg p-3 border border-primary/20">
                      <p className="text-sm">Yes! All templates and clinical notes are encrypted end-to-end. We have a signed BAA, maintain audit logs, and your patient data never trains AI models. Full HIPAA compliance.</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Access Topics */}
          <Card className="border-2">
            <CardHeader>
              <CardTitle>Common Questions Your AI Coach Can Answer</CardTitle>
              <CardDescription>Click any topic to chat with your AI Coach</CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid md:grid-cols-3 gap-3">
                {[
                  "How do I document patient visits?",
                  "Can I integrate with Epic/Cerner?",
                  "How is patient data protected?",
                  "How do I create voice-to-text notes?",
                  "Can I share templates with colleagues?",
                  "How do prescription workflows work?",
                  "What's included in the BAA?",
                  "How do I set up automated reminders?",
                  "Can I export my clinical data?"
                ].map((topic, i) => (
                  <Button key={i} variant="outline" className="justify-start text-left h-auto py-3">
                    <MessageSquare className="h-4 w-4 mr-2 flex-shrink-0" />
                    <span className="text-sm">{topic}</span>
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="bg-gradient-to-b from-primary/5 to-purple-500/5 py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold mb-4">
                How Healthcare Providers Can Use Perpetual Core
              </h2>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                Built to reduce documentation burden and improve clinical workflows—
                while maintaining full HIPAA compliance and data security.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8 mb-12">
              <Card className="border-2">
                <CardContent className="p-6">
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                    <FileText className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-xl font-bold mb-3">Upload Clinical Protocols & Templates</h3>
                  <p className="text-muted-foreground text-sm">
                    Add your clinical guidelines, treatment protocols, documentation templates,
                    and specialty-specific reference materials. AI indexes everything automatically
                    and makes it instantly searchable during patient care.
                  </p>
                </CardContent>
              </Card>

              <Card className="border-2">
                <CardContent className="p-6">
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                    <Search className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-xl font-bold mb-3">Search in Natural Language During Visits</h3>
                  <p className="text-muted-foreground text-sm">
                    During patient encounters, ask questions like "What's our protocol for CHF exacerbation?"
                    or "Draft a discharge summary for diabetic ketoacidosis." Get instant, accurate answers
                    from your trusted sources.
                  </p>
                </CardContent>
              </Card>

              <Card className="border-2">
                <CardContent className="p-6">
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                    <TrendingUp className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-xl font-bold mb-3">System Learns Your Documentation Style</h3>
                  <p className="text-muted-foreground text-sm">
                    As you review and approve AI-generated notes, the system learns your preferences,
                    terminology, and documentation style. Each note becomes more accurate and personalized
                    to your practice.
                  </p>
                </CardContent>
              </Card>
            </div>

            <Card className="border-2 border-primary">
              <CardContent className="p-8">
                <h3 className="text-2xl font-bold mb-6 text-center">Built to Solve Healthcare's Documentation Crisis</h3>
                <div className="space-y-6">
                  <div className="flex gap-4">
                    <div className="h-8 w-8 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center flex-shrink-0">
                      <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
                    </div>
                    <div>
                      <div className="font-semibold mb-2">Administrative Overload</div>
                      <p className="text-sm text-muted-foreground">
                        Physicians spend 2+ hours on documentation for every hour of patient care.
                        Charting after hours leads to burnout, family time loss, and decreased job satisfaction.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="h-8 w-8 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center flex-shrink-0">
                      <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
                    </div>
                    <div>
                      <div className="font-semibold mb-2">EHR Friction</div>
                      <p className="text-sm text-muted-foreground">
                        Modern EHRs are optimized for billing, not patient care. Clicking through dozens of screens
                        to document a simple visit takes time away from patients and contributes to clinician burnout.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="h-8 w-8 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center flex-shrink-0">
                      <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
                    </div>
                    <div>
                      <div className="font-semibold mb-2">Scattered Clinical Knowledge</div>
                      <p className="text-sm text-muted-foreground">
                        Treatment protocols in PDFs, clinical guidelines on hospital intranets, best practices
                        in colleagues' heads. Finding the right information during patient care is too slow.
                      </p>
                    </div>
                  </div>

                  <div className="border-t pt-6 mt-6">
                    <div className="bg-green-50 dark:bg-green-900/10 rounded-lg p-6 border border-green-200 dark:border-green-900/30">
                      <div className="flex gap-4">
                        <div className="h-8 w-8 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
                          <CheckCircle2 className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <div className="font-semibold mb-2">Perpetual Core is Built to Change This</div>
                          <p className="text-sm text-muted-foreground">
                            Reduce documentation time by 75%, give instant access to clinical knowledge, and help
                            providers spend more time on patient care—all while maintaining full HIPAA compliance
                            and data security. Your patients deserve providers who aren't drowning in paperwork.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Old Way vs New Way Comparison Table */}
      <section className="container mx-auto px-4 py-20">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Traditional EHR Workflow vs Perpetual Core
            </h2>
            <p className="text-xl text-muted-foreground">
              See exactly what changes when healthcare providers adopt Perpetual Core
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b-2">
                  <th className="text-left p-4 font-bold text-lg">Feature</th>
                  <th className="text-center p-4 font-bold text-lg text-red-600 dark:text-red-400">
                    <div className="flex items-center justify-center gap-2">
                      <XCircle className="h-5 w-5" />
                      Old Way (Traditional EHR)
                    </div>
                  </th>
                  <th className="text-center p-4 font-bold text-lg text-green-600 dark:text-green-400">
                    <div className="flex items-center justify-center gap-2">
                      <CheckCircle2 className="h-5 w-5" />
                      Perpetual Core
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody>
                {[
                  {
                    feature: "Documentation Time",
                    old: "15-20 minutes per patient note",
                    new: "3-5 minutes per patient note",
                    highlight: true
                  },
                  {
                    feature: "After-Hours Charting",
                    old: "2-3 hours every evening completing notes",
                    new: "Notes completed during clinic hours, go home on time"
                  },
                  {
                    feature: "Clinical Protocol Access",
                    old: "Search PDFs, call colleagues, check hospital intranet",
                    new: "Ask AI in natural language, get instant protocol recommendations"
                  },
                  {
                    feature: "Patient Communication",
                    old: "Manually draft every visit summary and follow-up message",
                    new: "AI drafts patient-friendly summaries in your voice"
                  },
                  {
                    feature: "Prior Authorizations",
                    old: "2+ hours filling forms, gathering documentation",
                    new: "10-15 minutes reviewing AI-generated forms and justifications",
                    highlight: true
                  },
                  {
                    feature: "New Provider Onboarding",
                    old: "Weeks learning EHR, months learning clinic workflows",
                    new: "Days with AI guidance on documentation and protocols"
                  },
                  {
                    feature: "Documentation Quality",
                    old: "Rushed notes, copy-paste errors, incomplete details",
                    new: "Complete, accurate notes reviewed by provider"
                  },
                  {
                    feature: "Work-Life Balance",
                    old: "High burnout, evenings spent charting, family time lost",
                    new: "Leave on time, reduced burnout, better quality of life",
                    highlight: true
                  },
                  {
                    feature: "Compliance & Security",
                    old: "Manual HIPAA compliance tracking, audit log gaps",
                    new: "Automatic HIPAA compliance, complete audit trails, BAA included"
                  },
                  {
                    feature: "Cost",
                    old: "EHR costs + wasted provider time + burnout",
                    new: "$899/provider/month (potential hours saved worth $10K+/month)"
                  }
                ].map((row, i) => (
                  <tr key={i} className={`border-b ${row.highlight ? 'bg-primary/5' : ''}`}>
                    <td className="p-4 font-medium">{row.feature}</td>
                    <td className="p-4 text-center text-sm text-muted-foreground">
                      <div className="flex items-start justify-center gap-2">
                        <XCircle className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5" />
                        <span>{row.old}</span>
                      </div>
                    </td>
                    <td className="p-4 text-center text-sm font-medium">
                      <div className="flex items-start justify-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                        <span>{row.new}</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <Card className="mt-8 border-2 border-primary">
            <CardContent className="p-6 text-center">
              <h3 className="text-2xl font-bold mb-2">Bottom Line</h3>
              <p className="text-lg text-muted-foreground mb-4">
                Healthcare providers using Perpetual Core save an average of <strong className="text-primary">3 hours per day</strong> on documentation,
                reduce burnout, and spend <strong className="text-primary">more quality time with patients</strong>—while
                maintaining full HIPAA compliance.
              </p>
              <Button size="lg" asChild className="mt-2">
                <Link href="/contact-sales?plan=healthcare">
                  Schedule Demo to See How It Works
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-20">
        <Card className="bg-gradient-to-r from-primary to-purple-600 text-white border-0">
          <CardContent className="p-12 text-center">
            <h2 className="text-4xl font-bold mb-4">
              Ready to Reduce Documentation Burden?
            </h2>
            <p className="text-xl mb-8 opacity-90 max-w-2xl mx-auto">
              See how Perpetual Core can help you spend less time on paperwork and more time
              with patients. HIPAA-compliant and built for healthcare.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" variant="secondary" asChild>
                <Link href="/contact-sales?plan=healthcare">Schedule Demo</Link>
              </Button>
              <Button size="lg" variant="outline" asChild className="bg-transparent border-white text-white hover:bg-white/10">
                <Link href="/signup?plan=healthcare">Start Free Trial</Link>
              </Button>
            </div>
            <p className="text-sm mt-6 opacity-75">
              14-day free trial • BAA included • Setup in minutes
            </p>
          </CardContent>
        </Card>
      </section>

      {/* Comprehensive FAQ Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Frequently Asked Questions
            </h2>
            <p className="text-xl text-muted-foreground">
              Everything you need to know about Perpetual Core for healthcare
            </p>
          </div>

          <div className="space-y-4">
            {[
              {
                question: "Is Perpetual Core HIPAA compliant? How is patient data protected?",
                answer: "Yes, Perpetual Core is fully HIPAA compliant. All patient data is encrypted with 256-bit encryption at rest and in transit. We use zero-knowledge architecture, meaning we cannot access your data. A signed Business Associate Agreement (BAA) is included with every healthcare plan. Your patient data is NEVER used to train AI models. We maintain complete audit logs of all data access and provide automatic compliance monitoring. We're vetted by major healthcare systems' IT security teams."
              },
              {
                question: "Can Perpetual Core integrate with our EHR (Epic, Cerner, Athenahealth, etc.)?",
                answer: "Yes. Perpetual Core integrates with major EHR systems including Epic, Cerner, Athenahealth, Allscripts, and eClinicalWorks. We can pull patient data from your EHR and write completed notes back into the system. Integration setup takes 30-60 minutes and is included in your onboarding. We also offer API access for custom EHR integrations. Most practices use Perpetual Core alongside their EHR to reduce documentation burden."
              },
              {
                question: "How accurate is the AI-generated clinical documentation?",
                answer: "AI-generated notes are designed to be reviewed and approved by the provider before signing. Think of Perpetual Core as an intelligent scribe that drafts documentation based on your input. The AI learns your documentation style and terminology over time, becoming more accurate with each use. Providers always have final review and approval. Most doctors report 90%+ accuracy after the first week of use, with accuracy improving as the system learns their preferences."
              },
              {
                question: "What happens if I need to cancel? Can I export my data?",
                answer: "You own your data, period. If you cancel, you can export all patient notes, clinical documents, and knowledge base content in standard formats (PDF, DOCX, JSON, HL7 FHIR). We keep your data for 90 days after cancellation in case you change your mind, then permanently delete it per HIPAA requirements. You'll receive a certificate of data destruction upon request. No penalties for cancellation."
              },
              {
                question: "How long does implementation take for a medical practice?",
                answer: "Most practices are fully operational within 2-4 weeks. Week 1: Setup, EHR integration, and template customization (4-6 hours of your time). Week 2: Provider training and pilot testing (2-3 hours). Week 3-4: Full practice rollout with daily support. You'll see time savings from day one. Every practice gets a dedicated implementation specialist and white-glove onboarding included."
              },
              {
                question: "Does Perpetual Core work for my specialty? (Surgery, pediatrics, psychiatry, etc.)",
                answer: "Yes. Perpetual Core includes specialty-specific templates for cardiology, orthopedics, primary care, pediatrics, psychiatry, surgery, OB/GYN, and more. During onboarding, we customize the system for your specialty, including preferred terminology, documentation formats, and clinical protocols. You can also create custom templates specific to your practice. Many specialty practices use Perpetual Core successfully."
              },
              {
                question: "How much does it cost? Are there volume discounts?",
                answer: "$899 per provider per month. This includes unlimited AI documentation, all features, BAA, EHR integration, and white-glove support. Volume discounts: 15% off for 5+ providers, 25% off for 20+ providers. We also offer custom enterprise pricing for health systems with 50+ providers. Billing is monthly or annual (save 20% with annual). First 14 days are free, no credit card required."
              },
              {
                question: "What if providers in my practice resist using AI?",
                answer: "Very common concern. We've found that resistance disappears once providers see the time savings. Our approach: (1) Start with a pilot group of 2-3 open-minded providers. (2) Show results—providers typically save 3+ hours per day on documentation. (3) Let early adopters become champions who demonstrate value to colleagues. (4) Provide one-on-one training for anyone who needs extra help. We guarantee 90%+ adoption rates or we keep working until we get there."
              },
              {
                question: "Can multiple providers in our practice share clinical protocols and templates?",
                answer: "Yes. You can create practice-wide knowledge bases with shared clinical protocols, treatment guidelines, and documentation templates. Role-based access controls let you decide what each provider can access. For example, pediatricians can access pediatric protocols while cardiologists access cardiology protocols. You can also set up specialty-specific knowledge bases or practice-wide resources. Full audit logs track all access."
              },
              {
                question: "How does Perpetual Core handle prescriptions and medication orders?",
                answer: "Perpetual Core can draft prescription instructions and patient medication education, but all prescriptions must be formally ordered through your EHR or e-prescribing system (as required by law). Perpetual Core helps by: (1) Suggesting appropriate dosing based on clinical protocols. (2) Checking for drug interactions using uploaded formularies. (3) Drafting patient instructions for medication use. (4) Generating prior authorization justifications for medications. The provider always has final approval before prescribing."
              },
              {
                question: "What kind of support do you provide to healthcare practices?",
                answer: "Comprehensive healthcare-focused support: (1) Dedicated implementation specialist during onboarding. (2) Priority support with 4-hour response time for urgent issues. (3) Phone, email, and secure chat support. (4) Ongoing training and optimization sessions. (5) Regular check-ins with your account manager. (6) 24/7 emergency support for critical issues. (7) HIPAA-compliant support portal. For larger practices, we offer on-site training and quarterly reviews."
              },
              {
                question: "Is there a limit on how many patient notes I can generate per month?",
                answer: "No hard limits. The healthcare plan includes 50,000 AI messages per provider per month, which typically covers 200-300 patient notes plus all your other AI interactions (protocol lookups, patient communication, etc.). If you consistently exceed this, we'll work with you on a custom plan. We've never had a provider hit the limit in normal clinical use. The goal is to support your practice, not nickel-and-dime you."
              },
              {
                question: "Can Perpetual Core help with coding and billing optimization?",
                answer: "Yes. Perpetual Core can suggest appropriate CPT codes and ICD-10 codes based on your clinical documentation. The system can flag potential coding opportunities you might have missed (e.g., additional diagnoses documented but not coded). However, final coding decisions and billing must be reviewed by the provider or certified coder to ensure compliance. Many practices report improved coding accuracy and reduced claim denials after using Perpetual Core."
              },
              {
                question: "What happens if there's an error in AI-generated documentation?",
                answer: "Providers are always responsible for reviewing and approving documentation before signing. Perpetual Core is designed as a documentation assistant, not a replacement for clinical judgment. All notes must be reviewed by the provider. If you notice an error, simply edit the note before signing. The system learns from your corrections to improve future suggestions. We maintain complete audit trails showing provider review and approval of all documentation."
              },
              {
                question: "How does Perpetual Core stay updated with the latest clinical guidelines?",
                answer: "You control what clinical knowledge Perpetual Core uses. Upload your preferred clinical guidelines, treatment protocols, and reference materials. When guidelines are updated (e.g., new AHA or ACC recommendations), simply upload the new versions. Perpetual Core will use the most recent uploads. We don't impose external guidelines—you choose what sources your practice trusts. This ensures you're always following your institution's approved protocols and evidence-based practices."
              }
            ].map((faq, i) => (
              <Card key={i} className="border-2 hover:border-primary transition-colors">
                <CardHeader
                  className="cursor-pointer select-none"
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                >
                  <div className="flex items-center justify-between gap-4">
                    <CardTitle className="text-lg font-semibold text-left">{faq.question}</CardTitle>
                    <div className="flex-shrink-0">
                      {openFaq === i ? (
                        <Minus className="h-5 w-5 text-primary" />
                      ) : (
                        <Plus className="h-5 w-5 text-muted-foreground" />
                      )}
                    </div>
                  </div>
                </CardHeader>
                {openFaq === i && (
                  <CardContent className="pt-0 pb-6">
                    <p className="text-muted-foreground leading-relaxed">{faq.answer}</p>
                  </CardContent>
                )}
              </Card>
            ))}
          </div>

          <Card className="mt-12 border-2 border-primary bg-gradient-to-r from-primary/5 to-purple-500/5">
            <CardContent className="p-8 text-center">
              <h3 className="text-2xl font-bold mb-3">Still have questions?</h3>
              <p className="text-muted-foreground mb-6">
                Schedule a call with our healthcare team. We'll answer all your questions and show you exactly how Perpetual Core works for your practice.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" asChild>
                  <Link href="/contact-sales?plan=healthcare">
                    Schedule Demo
                  </Link>
                </Button>
                <Button size="lg" variant="outline" asChild>
                  <Link href="mailto:healthcare@aios.com">Email Healthcare Team</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-12 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <Link href="/" className="flex items-center space-x-2 mb-4">
                <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-bold">
                  AI
                </div>
                <span className="text-lg font-bold">Perpetual Core</span>
              </Link>
              <p className="text-sm text-muted-foreground">
                The AI-powered knowledge platform built for healthcare providers.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Product</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/features" className="hover:underline">Features</Link></li>
                <li><Link href="/pricing" className="hover:underline">Pricing</Link></li>
                <li><Link href="/security" className="hover:underline">Security</Link></li>
                <li><Link href="/integrations" className="hover:underline">Integrations</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Resources</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/case-studies" className="hover:underline">Case Studies</Link></li>
                <li><Link href="/blog" className="hover:underline">Blog</Link></li>
                <li><Link href="/webinars" className="hover:underline">Webinars</Link></li>
                <li><Link href="/support" className="hover:underline">Support</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Company</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/about" className="hover:underline">About</Link></li>
                <li><Link href="/contact-sales" className="hover:underline">Contact Sales</Link></li>
                <li><Link href="/careers" className="hover:underline">Careers</Link></li>
                <li><Link href="/legal" className="hover:underline">Legal</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t pt-8 text-center text-sm text-muted-foreground">
            <p className="mb-2">
              © 2024 AI Operating System. All rights reserved. | HIPAA Compliant | SOC 2 Type II Certified | GDPR Ready
            </p>
            <p className="text-xs">
              Perpetual Core is not a healthcare provider and does not provide medical advice. BAA included with all healthcare plans.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
