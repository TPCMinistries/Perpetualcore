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

interface EnterpriseDay2Props {
  firstName: string;
}

export const EnterpriseDay2: React.FC<EnterpriseDay2Props> = ({ firstName }) => {
  return (
    <Html>
      <Head />
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Your Enterprise AI Assessment Results</Heading>

          <Text style={greeting}>Hi {firstName},</Text>

          <Text style={paragraph}>
            Thank you for completing the AI Readiness Assessment. Based on your responses, your organization has significant opportunity to leverage AI for competitive advantage.
          </Text>

          {/* Assessment Summary */}
          <Section style={summaryBox}>
            <Text style={summaryTitle}>📊 Assessment Summary:</Text>
            <Text style={summaryText}>
              <strong>Organization Size:</strong> Enterprise (50+ employees)
              <br />
              <strong>Investment Capacity:</strong> Significant budget allocated
              <br />
              <strong>Primary Goal:</strong> Scale operations without proportional headcount increase
              <br />
              <strong>Current AI Maturity:</strong> Early stage with high potential
            </Text>
          </Section>

          {/* Projected Impact */}
          <Heading style={h2}>Projected Impact for Your Organization:</Heading>

          <Section style={metricBox}>
            <Text style={metricNumber}>$1.2M - $2.5M</Text>
            <Text style={metricLabel}>Estimated Annual Savings</Text>
            <Text style={metricDetail}>
              Based on 100 employees saving 20-30 hours/week at $120/hour average cost
            </Text>
          </Section>

          <Section style={metricBox}>
            <Text style={metricNumber}>6-8 Weeks</Text>
            <Text style={metricLabel}>Implementation Timeline</Text>
            <Text style={metricDetail}>
              From executive briefing to full enterprise rollout with training
            </Text>
          </Section>

          <Section style={metricBox}>
            <Text style={metricNumber}>30-40%</Text>
            <Text style={metricLabel}>Productivity Increase</Text>
            <Text style={metricDetail}>
              Average improvement across knowledge work tasks
            </Text>
          </Section>

          {/* Enterprise Features */}
          <Heading style={h2}>Enterprise-Grade Capabilities:</Heading>

          <Section style={featureList}>
            <Text style={feature}>🔒 SOC 2 Type II compliance & SSO integration</Text>
            <Text style={feature}>🏢 Dedicated instance with custom domain</Text>
            <Text style={feature}>👥 Unlimited users with advanced role management</Text>
            <Text style={feature}>📊 Custom integrations with your tech stack</Text>
            <Text style={feature}>🎯 White-glove implementation & training</Text>
            <Text style={feature}>💼 Dedicated account manager & support SLA</Text>
          </Section>

          {/* Next Steps */}
          <Section style={nextStepsBox}>
            <Text style={nextStepsTitle}>Recommended Next Steps:</Text>
            <Text style={nextStepsText}>
              <strong>1. Executive Briefing (45 minutes)</strong>
              <br />
              • Review assessment in detail
              <br />
              • Demonstrate platform capabilities
              <br />
              • Discuss your specific use cases
              <br />
              • Answer technical & security questions
              <br />
              <br />
              <strong>2. Custom Implementation Plan</strong>
              <br />
              • Tailored rollout strategy
              <br />
              • ROI projections for your organization
              <br />
              • Technical architecture review
              <br />
              • Security & compliance documentation
              <br />
              <br />
              <strong>3. Pilot Program (Optional)</strong>
              <br />
              • 30-day trial with select team
              <br />
              • Measure results before full rollout
              <br />
              • Refine implementation approach
            </Text>
          </Section>

          {/* CTA */}
          <Section style={ctaBox}>
            <Heading style={ctaHeading}>Schedule Executive Briefing</Heading>
            <Text style={ctaText}>
              Let's discuss how Perpetual Core can drive measurable results for your organization.
            </Text>
            <Button href="https://www.perpetualcore.com/enterprise-demo" style={button}>
              Book Executive Briefing →
            </Button>
            <Text style={ctaFootnote}>
              Priority scheduling for enterprise prospects
            </Text>
          </Section>

          <Text style={paragraph}>
            I'm available to answer any questions about the assessment or our enterprise offering.
          </Text>

          <Hr style={hr} />

          <Text style={footer}>
            Best regards,
            <br />
            The Perpetual Core Enterprise Team
            <br />
            <a href="https://www.perpetualcore.com/enterprise" style={link}>
              www.perpetualcore.com/enterprise
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

export default EnterpriseDay2;

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

const summaryBox = {
  backgroundColor: "#eff6ff",
  borderLeft: "4px solid #3b82f6",
  borderRadius: "4px",
  padding: "20px",
  margin: "30px 0",
};

const summaryTitle = {
  color: "#1f2937",
  fontSize: "18px",
  fontWeight: "700",
  margin: "0 0 10px",
};

const summaryText = {
  color: "#374151",
  fontSize: "15px",
  lineHeight: "1.8",
  margin: "0",
};

const metricBox = {
  backgroundColor: "#f9fafb",
  border: "2px solid #e5e7eb",
  borderRadius: "8px",
  padding: "24px",
  margin: "15px 0",
  textAlign: "center" as const,
};

const metricNumber = {
  color: "#8b5cf6",
  fontSize: "36px",
  fontWeight: "700",
  margin: "0 0 8px",
};

const metricLabel = {
  color: "#1f2937",
  fontSize: "18px",
  fontWeight: "700",
  margin: "0 0 8px",
};

const metricDetail = {
  color: "#6b7280",
  fontSize: "14px",
  lineHeight: "1.4",
  margin: "0",
};

const featureList = {
  margin: "20px 0",
};

const feature = {
  color: "#374151",
  fontSize: "16px",
  lineHeight: "1.8",
  margin: "8px 0",
};

const nextStepsBox = {
  backgroundColor: "#f0fdf4",
  borderLeft: "4px solid #10b981",
  borderRadius: "4px",
  padding: "20px",
  margin: "30px 0",
};

const nextStepsTitle = {
  color: "#1f2937",
  fontSize: "18px",
  fontWeight: "700",
  margin: "0 0 15px",
};

const nextStepsText = {
  color: "#374151",
  fontSize: "15px",
  lineHeight: "1.8",
  margin: "0",
};

const ctaBox = {
  backgroundColor: "#1f2937",
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
  color: "#d1d5db",
  fontSize: "16px",
  margin: "0 0 20px",
};

const button = {
  backgroundColor: "#8b5cf6",
  borderRadius: "6px",
  color: "#ffffff",
  fontSize: "16px",
  fontWeight: "700",
  textDecoration: "none",
  textAlign: "center" as const,
  display: "inline-block",
  padding: "14px 28px",
};

const ctaFootnote = {
  color: "#9ca3af",
  fontSize: "13px",
  margin: "15px 0 0",
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
