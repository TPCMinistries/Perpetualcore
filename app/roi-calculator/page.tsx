"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TrendingUp, DollarSign, Clock, CheckCircle2, ArrowRight } from "lucide-react";

type Vertical = "law" | "healthcare" | "realestate" | "agency";

interface ROIInputs {
  law: {
    attorneys: number;
    billableRate: number;
    hoursPerWeek: number;
  };
  healthcare: {
    providers: number;
    avgSalary: number;
    adminHoursPerDay: number;
  };
  realestate: {
    agents: number;
    avgCommission: number;
    dealsPerMonth: number;
  };
  agency: {
    teamMembers: number;
    avgSalary: number;
    projectsPerMonth: number;
    whitelabelClients: number;
  };
}

export default function ROICalculatorPage() {
  const [vertical, setVertical] = useState<Vertical>("law");
  const [inputs, setInputs] = useState<ROIInputs>({
    law: {
      attorneys: 5,
      billableRate: 350,
      hoursPerWeek: 40,
    },
    healthcare: {
      providers: 4,
      avgSalary: 250000,
      adminHoursPerDay: 4,
    },
    realestate: {
      agents: 10,
      avgCommission: 12000,
      dealsPerMonth: 2,
    },
    agency: {
      teamMembers: 8,
      avgSalary: 80000,
      projectsPerMonth: 10,
      whitelabelClients: 2,
    },
  });

  const updateInput = (vertical: Vertical, field: string, value: number) => {
    setInputs((prev) => ({
      ...prev,
      [vertical]: {
        ...prev[vertical],
        [field]: value,
      },
    }));
  };

  const roi = useMemo(() => {
    switch (vertical) {
      case "law": {
        const { attorneys, billableRate, hoursPerWeek } = inputs.law;
        // 40% more billable hours (from 80% admin reduction = 8 more hours/week)
        const hoursGainedPerWeek = 8;
        const annualRevenue = attorneys * hoursGainedPerWeek * billableRate * 52;
        const cost = attorneys * 999 * 12;
        const savings = annualRevenue - cost;
        const roiPercent = ((savings / cost) * 100).toFixed(0);
        const paybackMonths = (cost / (annualRevenue / 12)).toFixed(1);

        return {
          annualSavings: savings,
          annualRevenue,
          cost,
          roiPercent: parseFloat(roiPercent),
          paybackMonths: parseFloat(paybackMonths),
          metrics: [
            { label: "Hours Saved/Week", value: `${hoursGainedPerWeek * attorneys}`, unit: "hours" },
            { label: "Extra Billable Revenue", value: `$${(annualRevenue / 1000).toFixed(0)}K`, unit: "/year" },
            { label: "Cost of Perpetual Core", value: `$${(cost / 1000).toFixed(0)}K`, unit: "/year" },
          ],
        };
      }

      case "healthcare": {
        const { providers, avgSalary, adminHoursPerDay } = inputs.healthcare;
        // 75% reduction in admin time = 3 hours/day saved
        const hoursSavedPerDay = adminHoursPerDay * 0.75;
        const hourlyWage = avgSalary / (8 * 5 * 52); // Assuming 8 hours/day, 5 days/week
        const annualSavings = providers * hoursSavedPerDay * hourlyWage * 5 * 52;
        const cost = providers * 899 * 12;
        const netSavings = annualSavings - cost;
        const roiPercent = ((netSavings / cost) * 100).toFixed(0);
        const paybackMonths = (cost / (annualSavings / 12)).toFixed(1);

        return {
          annualSavings: netSavings,
          annualRevenue: annualSavings,
          cost,
          roiPercent: parseFloat(roiPercent),
          paybackMonths: parseFloat(paybackMonths),
          metrics: [
            { label: "Admin Hours Saved/Day", value: `${(hoursSavedPerDay * providers).toFixed(1)}`, unit: "hours" },
            { label: "Labor Cost Savings", value: `$${(annualSavings / 1000).toFixed(0)}K`, unit: "/year" },
            { label: "Cost of Perpetual Core", value: `$${(cost / 1000).toFixed(0)}K`, unit: "/year" },
          ],
        };
      }

      case "realestate": {
        const { agents, avgCommission, dealsPerMonth } = inputs.realestate;
        // 50% more deals closed
        const extraDealsPerMonth = dealsPerMonth * 0.5;
        const annualRevenue = agents * extraDealsPerMonth * avgCommission * 12;
        const cost = agents * 499 * 12;
        const netProfit = annualRevenue - cost;
        const roiPercent = ((netProfit / cost) * 100).toFixed(0);
        const paybackMonths = (cost / (annualRevenue / 12)).toFixed(1);

        return {
          annualSavings: netProfit,
          annualRevenue,
          cost,
          roiPercent: parseFloat(roiPercent),
          paybackMonths: parseFloat(paybackMonths),
          metrics: [
            { label: "Extra Deals/Month", value: `${(extraDealsPerMonth * agents).toFixed(1)}`, unit: "deals" },
            { label: "Extra Commission", value: `$${(annualRevenue / 1000).toFixed(0)}K`, unit: "/year" },
            { label: "Cost of Perpetual Core", value: `$${(cost / 1000).toFixed(0)}K`, unit: "/year" },
          ],
        };
      }

      case "agency": {
        const { teamMembers, avgSalary, projectsPerMonth, whitelabelClients } = inputs.agency;
        // 60% reduction in production costs + white label revenue
        const laborCostPerProject = (avgSalary / 12) / projectsPerMonth;
        const savingsPerProject = laborCostPerProject * 0.6;
        const annualLaborSavings = savingsPerProject * projectsPerMonth * 12;
        const whitelabelRevenue = whitelabelClients * 2000 * 12;
        const totalSavings = annualLaborSavings + whitelabelRevenue;
        const cost = teamMembers * 799 * 12;
        const netProfit = totalSavings - cost;
        const roiPercent = ((netProfit / cost) * 100).toFixed(0);
        const paybackMonths = (cost / (totalSavings / 12)).toFixed(1);

        return {
          annualSavings: netProfit,
          annualRevenue: totalSavings,
          cost,
          roiPercent: parseFloat(roiPercent),
          paybackMonths: parseFloat(paybackMonths),
          metrics: [
            { label: "Labor Cost Savings", value: `$${(annualLaborSavings / 1000).toFixed(0)}K`, unit: "/year" },
            { label: "White Label Revenue", value: `$${(whitelabelRevenue / 1000).toFixed(0)}K`, unit: "/year" },
            { label: "Cost of Perpetual Core", value: `$${(cost / 1000).toFixed(0)}K`, unit: "/year" },
          ],
        };
      }

      default:
        return {
          annualSavings: 0,
          annualRevenue: 0,
          cost: 0,
          roiPercent: 0,
          paybackMonths: 0,
          metrics: [],
        };
    }
  }, [vertical, inputs]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

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
              <Link href="/signup">Get Started</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-12 text-center">
        <div className="max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 px-4 py-2 rounded-full text-sm font-medium mb-6">
            <TrendingUp className="h-4 w-4" />
            ROI Calculator
          </div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
            Calculate Your ROI with Perpetual Core
          </h1>
          <p className="text-lg text-muted-foreground mb-8">
            See exactly how much your organization will save and earn with AI automation
          </p>
        </div>
      </section>

      {/* Calculator Section */}
      <section className="container mx-auto px-4 pb-20">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-8">
            {/* Input Panel */}
            <Card>
              <CardHeader>
                <CardTitle>Your Organization</CardTitle>
                <CardDescription>Enter your details to calculate ROI</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Vertical Selector */}
                <div className="space-y-2">
                  <Label>Industry</Label>
                  <Select value={vertical} onValueChange={(v) => setVertical(v as Vertical)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="law">Law Firms</SelectItem>
                      <SelectItem value="healthcare">Healthcare</SelectItem>
                      <SelectItem value="realestate">Real Estate</SelectItem>
                      <SelectItem value="agency">Agencies</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Law Firm Inputs */}
                {vertical === "law" && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="attorneys">Number of Attorneys</Label>
                      <Input
                        id="attorneys"
                        type="number"
                        value={inputs.law.attorneys}
                        onChange={(e) => updateInput("law", "attorneys", parseInt(e.target.value) || 0)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="billableRate">Average Billable Rate ($/hour)</Label>
                      <Input
                        id="billableRate"
                        type="number"
                        value={inputs.law.billableRate}
                        onChange={(e) => updateInput("law", "billableRate", parseInt(e.target.value) || 0)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="hoursPerWeek">Current Billable Hours/Week</Label>
                      <Input
                        id="hoursPerWeek"
                        type="number"
                        value={inputs.law.hoursPerWeek}
                        onChange={(e) => updateInput("law", "hoursPerWeek", parseInt(e.target.value) || 0)}
                      />
                    </div>
                  </>
                )}

                {/* Healthcare Inputs */}
                {vertical === "healthcare" && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="providers">Number of Providers</Label>
                      <Input
                        id="providers"
                        type="number"
                        value={inputs.healthcare.providers}
                        onChange={(e) => updateInput("healthcare", "providers", parseInt(e.target.value) || 0)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="avgSalary">Average Provider Salary ($)</Label>
                      <Input
                        id="avgSalary"
                        type="number"
                        value={inputs.healthcare.avgSalary}
                        onChange={(e) => updateInput("healthcare", "avgSalary", parseInt(e.target.value) || 0)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="adminHoursPerDay">Admin Hours/Day per Provider</Label>
                      <Input
                        id="adminHoursPerDay"
                        type="number"
                        value={inputs.healthcare.adminHoursPerDay}
                        onChange={(e) => updateInput("healthcare", "adminHoursPerDay", parseInt(e.target.value) || 0)}
                      />
                    </div>
                  </>
                )}

                {/* Real Estate Inputs */}
                {vertical === "realestate" && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="agents">Number of Agents</Label>
                      <Input
                        id="agents"
                        type="number"
                        value={inputs.realestate.agents}
                        onChange={(e) => updateInput("realestate", "agents", parseInt(e.target.value) || 0)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="avgCommission">Average Commission per Deal ($)</Label>
                      <Input
                        id="avgCommission"
                        type="number"
                        value={inputs.realestate.avgCommission}
                        onChange={(e) => updateInput("realestate", "avgCommission", parseInt(e.target.value) || 0)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="dealsPerMonth">Deals/Month per Agent</Label>
                      <Input
                        id="dealsPerMonth"
                        type="number"
                        value={inputs.realestate.dealsPerMonth}
                        onChange={(e) => updateInput("realestate", "dealsPerMonth", parseInt(e.target.value) || 0)}
                      />
                    </div>
                  </>
                )}

                {/* Agency Inputs */}
                {vertical === "agency" && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="teamMembers">Number of Team Members</Label>
                      <Input
                        id="teamMembers"
                        type="number"
                        value={inputs.agency.teamMembers}
                        onChange={(e) => updateInput("agency", "teamMembers", parseInt(e.target.value) || 0)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="avgSalary">Average Salary ($)</Label>
                      <Input
                        id="avgSalary"
                        type="number"
                        value={inputs.agency.avgSalary}
                        onChange={(e) => updateInput("agency", "avgSalary", parseInt(e.target.value) || 0)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="projectsPerMonth">Projects/Month</Label>
                      <Input
                        id="projectsPerMonth"
                        type="number"
                        value={inputs.agency.projectsPerMonth}
                        onChange={(e) => updateInput("agency", "projectsPerMonth", parseInt(e.target.value) || 0)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="whitelabelClients">White Label Clients (Optional)</Label>
                      <Input
                        id="whitelabelClients"
                        type="number"
                        value={inputs.agency.whitelabelClients}
                        onChange={(e) => updateInput("agency", "whitelabelClients", parseInt(e.target.value) || 0)}
                      />
                      <p className="text-xs text-muted-foreground">
                        Add $2,000/month per client in recurring revenue
                      </p>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Results Panel */}
            <div className="space-y-6">
              {/* Main ROI Card */}
              <Card className="border-primary border-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5 text-primary" />
                    Your ROI
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Annual Savings */}
                  <div className="text-center p-6 bg-gradient-to-br from-primary/10 to-primary/5 rounded-lg">
                    <div className="text-sm text-muted-foreground mb-2">Annual Net Savings</div>
                    <div className="text-5xl font-bold text-primary mb-2">
                      {formatCurrency(roi.annualSavings)}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {roi.roiPercent}% ROI • {roi.paybackMonths} month payback
                    </div>
                  </div>

                  {/* Metrics */}
                  <div className="space-y-3">
                    {roi.metrics.map((metric, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                        <span className="text-sm font-medium">{metric.label}</span>
                        <span className="text-sm font-bold">
                          {metric.value}
                          <span className="text-muted-foreground ml-1">{metric.unit}</span>
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* CTA */}
                  <div className="space-y-3 pt-4 border-t">
                    <Button size="lg" className="w-full" asChild>
                      <Link href="/contact-sales">
                        Schedule Demo <ArrowRight className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>
                    <p className="text-xs text-muted-foreground text-center">
                      Get a personalized ROI analysis from our team
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Benefits Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-primary" />
                    What You Get
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {vertical === "law" && (
                    <>
                      <div className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                        <span className="text-sm">40% increase in billable hours</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                        <span className="text-sm">80% reduction in admin time</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                        <span className="text-sm">AI legal research & document automation</span>
                      </div>
                    </>
                  )}
                  {vertical === "healthcare" && (
                    <>
                      <div className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                        <span className="text-sm">3+ more hours with patients per day</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                        <span className="text-sm">75% reduction in admin burden</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                        <span className="text-sm">HIPAA-compliant AI documentation</span>
                      </div>
                    </>
                  )}
                  {vertical === "realestate" && (
                    <>
                      <div className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                        <span className="text-sm">50% more deals closed</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                        <span className="text-sm">15 hours saved per week per agent</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                        <span className="text-sm">AI listing creator & marketing automation</span>
                      </div>
                    </>
                  )}
                  {vertical === "agency" && (
                    <>
                      <div className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                        <span className="text-sm">60% lower production costs</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                        <span className="text-sm">5x faster project delivery</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                        <span className="text-sm">White label option for client resale</span>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
