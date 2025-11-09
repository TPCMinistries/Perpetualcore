import * as React from "react";
import {
  Html,
  Head,
  Body,
  Container,
  Section,
  Heading,
  Text,
  Button,
  Hr,
} from "@react-email/components";

interface ConsultingDay2Props {
  firstName: string;
}

export const ConsultingDay2: React.FC<ConsultingDay2Props> = ({ firstName }) => {
  return (
    <Html>
      <Head />
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Your Custom AI Roadmap (Based on Your Quiz)</Heading>

          <Text style={greeting}>Hi {firstName},</Text>

          <Text style={paragraph}>
            Based on your quiz responses, I've created a custom implementation roadmap specifically for teams like yours.
          </Text>

          {/* Quiz Insights */}
          <Section style={insightBox}>
            <Text style={insightTitle}>📊 What Your Quiz Revealed:</Text>
            <Text style={insightText}>
              • Your team is spending significant time on repetitive tasks
              <br />
              • You have the budget to invest in productivity tools
              <br />
              • You need guidance to implement AI effectively
              <br />
              • Quick wins would build momentum for your team
            </Text>
          </Section>

          {/* Recommended Approach */}
          <Heading style={h2}>Your 90-Day Implementation Plan:</Heading>

          <Section style={phaseBox}>
            <Text style={phaseTitle}>Phase 1: Quick Wins (Days 1-30)</Text>
            <Text style={phaseText}>
              • Strategy call to identify top 3 high-impact use cases
              <br />
              • Set up Perpetual Core with your team
              <br />
              • Create custom prompts for your specific workflows
              <br />
              • Train 2-3 "AI champions" on your team
              <br />
              <strong>Expected Result:</strong> 10-15 hours saved per week
            </Text>
          </Section>

          <Section style={phaseBox}>
            <Text style={phaseTitle}>Phase 2: Scale (Days 31-60)</Text>
            <Text style={phaseText}>
              • Roll out AI workflows to entire team
              <br />
              • Build custom knowledge base with your documents
              <br />
              • Automate reporting and data analysis
              <br />
              • Weekly check-ins to optimize processes
              <br />
              <strong>Expected Result:</strong> 20-25 hours saved per week
            </Text>
          </Section>

          <Section style={phaseBox}>
            <Text style={phaseTitle}>Phase 3: Optimize (Days 61-90)</Text>
            <Text style={phaseText}>
              • Measure ROI and document savings
              <br />
              • Build advanced workflows and automations
              <br />
              • Train team on best practices
              <br />
              • Plan next phase of optimization
              <br />
              <strong>Expected Result:</strong> 30+ hours saved per week
            </Text>
          </Section>

          {/* Investment */}
          <Section style={investmentBox}>
            <Text style={investmentTitle}>Investment:</Text>
            <Text style={investmentText}>
              <strong>$2,500 one-time setup</strong> + <strong>$299/month platform fee</strong>
              <br />
              <br />
              Includes: Strategy call, custom setup, team training, 90 days of implementation support, weekly check-ins
              <br />
              <br />
              <strong>Typical ROI:</strong> Pay for itself in 4-6 weeks through time savings
            </Text>
          </Section>

          {/* CTA */}
          <Section style={ctaBox}>
            <Heading style={ctaHeading}>Book Your Strategy Call</Heading>
            <Text style={ctaText}>
              Let's discuss your specific situation and create a custom plan.
              <br />
              No pressure, no obligation - just honest advice.
            </Text>
            <Button href="https://www.perpetualcore.com/consultation" style={button}>
              Schedule Strategy Call →
            </Button>
          </Section>

          <Text style={paragraph}>
            Questions about the roadmap? Just reply - I'm here to help.
          </Text>

          <Hr style={hr} />

          <Text style={footer}>
            Best,
            <br />
            The Perpetual Core Team
            <br />
            <a href="https://www.perpetualcore.com" style={link}>
              www.perpetualcore.com
            </a>
          </Text>

          <Text style={unsubscribe}>
            <a href="{{unsubscribe_url}}" style={unsubscribeLink}>
              Unsubscribe
            </a>
          </Text>
        </Container>
      </Body>
    </Html>
  );
};

export default ConsultingDay2;

// Styles
const main = {
  backgroundColor: "#f6f9fc",
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: "#ffffff",
  margin: "0 auto",
  padding: "40px 20px",
  maxWidth: "600px",
};

const h1 = {
  color: "#1f2937",
  fontSize: "28px",
  fontWeight: "700",
  lineHeight: "1.3",
  margin: "0 0 20px",
};

const h2 = {
  color: "#1f2937",
  fontSize: "22px",
  fontWeight: "700",
  lineHeight: "1.3",
  margin: "30px 0 15px",
};

const greeting = {
  color: "#374151",
  fontSize: "16px",
  lineHeight: "1.6",
  margin: "0 0 10px",
};

const paragraph = {
  color: "#374151",
  fontSize: "16px",
  lineHeight: "1.6",
  margin: "0 0 20px",
};

const insightBox = {
  backgroundColor: "#eff6ff",
  borderLeft: "4px solid #3b82f6",
  borderRadius: "4px",
  padding: "20px",
  margin: "30px 0",
};

const insightTitle = {
  color: "#1f2937",
  fontSize: "18px",
  fontWeight: "700",
  margin: "0 0 10px",
};

const insightText = {
  color: "#374151",
  fontSize: "15px",
  lineHeight: "1.8",
  margin: "0",
};

const phaseBox = {
  backgroundColor: "#f9fafb",
  border: "1px solid #e5e7eb",
  borderRadius: "8px",
  padding: "20px",
  margin: "15px 0",
};

const phaseTitle = {
  color: "#8b5cf6",
  fontSize: "18px",
  fontWeight: "700",
  margin: "0 0 10px",
};

const phaseText = {
  color: "#374151",
  fontSize: "15px",
  lineHeight: "1.8",
  margin: "0",
};

const investmentBox = {
  backgroundColor: "#f0fdf4",
  borderLeft: "4px solid #10b981",
  borderRadius: "4px",
  padding: "20px",
  margin: "30px 0",
};

const investmentTitle = {
  color: "#1f2937",
  fontSize: "18px",
  fontWeight: "700",
  margin: "0 0 10px",
};

const investmentText = {
  color: "#374151",
  fontSize: "15px",
  lineHeight: "1.6",
  margin: "0",
};

const ctaBox = {
  backgroundColor: "#8b5cf6",
  borderRadius: "8px",
  padding: "30px",
  textAlign: "center" as const,
  margin: "30px 0",
};

const ctaHeading = {
  color: "#ffffff",
  fontSize: "24px",
  fontWeight: "700",
  margin: "0 0 10px",
};

const ctaText = {
  color: "#e9d5ff",
  fontSize: "16px",
  margin: "0 0 20px",
  lineHeight: "1.6",
};

const button = {
  backgroundColor: "#ffffff",
  borderRadius: "6px",
  color: "#8b5cf6",
  fontSize: "16px",
  fontWeight: "700",
  textDecoration: "none",
  textAlign: "center" as const,
  display: "inline-block",
  padding: "14px 28px",
};

const hr = {
  borderColor: "#e5e7eb",
  margin: "30px 0",
};

const footer = {
  color: "#6b7280",
  fontSize: "14px",
  lineHeight: "1.6",
};

const link = {
  color: "#8b5cf6",
  textDecoration: "none",
};

const unsubscribe = {
  color: "#9ca3af",
  fontSize: "12px",
  textAlign: "center" as const,
  marginTop: "20px",
};

const unsubscribeLink = {
  color: "#9ca3af",
  textDecoration: "underline",
};
