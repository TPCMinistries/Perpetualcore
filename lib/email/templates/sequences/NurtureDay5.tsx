import React from "react";
import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Text,
  Section,
  Button,
  Hr,
} from "@react-email/components";

interface NurtureDay5Props {
  firstName: string;
}

export const NurtureDay5: React.FC<NurtureDay5Props> = ({ firstName }) => (
  <Html>
    <Head />
    <Preview>Calculate your AI ROI - Free calculator inside</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>The ROI Calculator Every Business Needs</Heading>

        <Text style={text}>Hi {firstName},</Text>

        <Text style={text}>
          Yesterday I sent you the 30-day roadmap. Today, I want to show you how to <strong>prove the value</strong> of your AI investment.
        </Text>

        <Section style={statBox}>
          <Text style={statNumber}>$84,000</Text>
          <Text style={statLabel}>Average annual savings per employee using AI automation</Text>
          <Text style={statSource}>— McKinsey Global Institute, 2024</Text>
        </Section>

        <Text style={text}>
          But here's the thing: <strong>you need to measure it</strong>. That's why I created this ROI calculator.
        </Text>

        <Section style={downloadBox}>
          <Text style={downloadTitle}>🧮 FREE CALCULATOR</Text>
          <Heading style={downloadHeading}>AI ROI Calculator Spreadsheet</Heading>
          <Text style={downloadDescription}>
            Calculate exactly how much time and money AI saves your business
          </Text>
          <Button
            href="https://www.perpetualcore.com/downloads/ai-roi-calculator.xlsx"
            style={button}
          >
            Download Calculator →
          </Button>
        </Section>

        <Text style={text}>
          <strong>What you can track:</strong>
        </Text>

        <Section style={metricSection}>
          <Text style={metricTitle}>⏱️ Time Savings</Text>
          <Text style={metricText}>
            • Hours saved per task<br />
            • Weekly/monthly time recovery<br />
            • Productivity gain percentage
          </Text>
        </Section>

        <Section style={metricSection}>
          <Text style={metricTitle}>💰 Cost Savings</Text>
          <Text style={metricText}>
            • Labor cost reduction<br />
            • Tool consolidation savings<br />
            • Opportunity cost recovery
          </Text>
        </Section>

        <Section style={metricSection}>
          <Text style={metricTitle}>📈 Business Impact</Text>
          <Text style={metricText}>
            • Revenue increase from freed capacity<br />
            • Customer satisfaction improvements<br />
            • Team morale and retention
          </Text>
        </Section>

        <Section style={exampleBox}>
          <Text style={exampleTitle}>💡 Real Example:</Text>
          <Text style={exampleText}>
            <strong>Marketing agency with 10 employees:</strong><br /><br />

            Before AI:<br />
            • 15 hours/week on client reports<br />
            • 10 hours/week on content creation<br />
            • 8 hours/week on email management<br />
            = 33 hours weekly @ $50/hour = <strong>$1,650/week wasted</strong><br /><br />

            After AI (with Perpetual Core):<br />
            • Client reports: 3 hours (80% reduction)<br />
            • Content creation: 2 hours (80% reduction)<br />
            • Email management: 2 hours (75% reduction)<br />
            = 7 hours weekly @ $50/hour = <strong>$350/week</strong><br /><br />

            <span style={{color: "#059669", fontWeight: "700", fontSize: "18px"}}>
              Savings: $1,300/week = $67,600/year
            </span>
          </Text>
        </Section>

        <Text style={text}>
          <strong>Here's what makes this calculator special:</strong>
        </Text>

        <Section style={featureList}>
          <Text style={featureItem}>
            ✓ <strong>Pre-loaded benchmarks</strong> from 500+ businesses
          </Text>
          <Text style={featureItem}>
            ✓ <strong>Automatic calculations</strong> - just plug in your numbers
          </Text>
          <Text style={featureItem}>
            ✓ <strong>Visual dashboards</strong> to share with your team
          </Text>
          <Text style={featureItem}>
            ✓ <strong>Monthly tracking</strong> to see improvement over time
          </Text>
        </Section>

        <Section style={ctaSection}>
          <Button
            href="https://www.perpetualcore.com/downloads/ai-roi-calculator.xlsx"
            style={buttonSecondary}
          >
            Get Your Free Calculator
          </Button>
        </Section>

        <Text style={text}>
          <strong>Quick task for today:</strong> Spend 5 minutes identifying your 3 most time-consuming tasks.
          You'll need this for the calculator.
        </Text>

        <Text style={text}>
          Tomorrow's email is important - I'll show you how Perpetual Core can help you achieve these results
          (and why we're different from generic AI tools).
        </Text>

        <Hr style={hr} />

        <Text style={footer}>
          Looking forward to your results,<br />
          The Perpetual Core Team<br />
          <a href="https://www.perpetualcore.com" style={link}>www.perpetualcore.com</a>
        </Text>

        <Text style={unsubscribe}>
          <a href="{{unsubscribe_url}}" style={link}>Unsubscribe</a>
        </Text>
      </Container>
    </Body>
  </Html>
);

export default NurtureDay5;

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
  margin: "0 0 24px",
  lineHeight: "1.3",
};

const text = {
  color: "#374151",
  fontSize: "16px",
  lineHeight: "1.6",
  margin: "0 0 16px",
};

const statBox = {
  backgroundColor: "#ede9fe",
  borderRadius: "12px",
  padding: "32px",
  margin: "32px 0",
  textAlign: "center" as const,
};

const statNumber = {
  color: "#7c3aed",
  fontSize: "48px",
  fontWeight: "700",
  margin: "0 0 8px",
  lineHeight: "1",
};

const statLabel = {
  color: "#5b21b6",
  fontSize: "16px",
  fontWeight: "600",
  lineHeight: "1.5",
  margin: "0 0 8px",
};

const statSource = {
  color: "#6b7280",
  fontSize: "13px",
  fontStyle: "italic",
  margin: "0",
};

const downloadBox = {
  backgroundColor: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
  background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
  borderRadius: "12px",
  padding: "32px",
  margin: "32px 0",
  textAlign: "center" as const,
};

const downloadTitle = {
  color: "#fef3c7",
  fontSize: "14px",
  fontWeight: "700",
  margin: "0 0 12px",
  letterSpacing: "1px",
};

const downloadHeading = {
  color: "#ffffff",
  fontSize: "24px",
  fontWeight: "700",
  margin: "0 0 12px",
  lineHeight: "1.3",
};

const downloadDescription = {
  color: "#d1fae5",
  fontSize: "16px",
  lineHeight: "1.5",
  margin: "0 0 24px",
};

const button = {
  backgroundColor: "#ffffff",
  borderRadius: "8px",
  color: "#059669",
  fontSize: "16px",
  fontWeight: "700",
  textDecoration: "none",
  textAlign: "center" as const,
  display: "inline-block",
  padding: "14px 32px",
  margin: "8px 0",
};

const buttonSecondary = {
  backgroundColor: "#10b981",
  borderRadius: "8px",
  color: "#ffffff",
  fontSize: "16px",
  fontWeight: "700",
  textDecoration: "none",
  textAlign: "center" as const,
  display: "inline-block",
  padding: "14px 32px",
  margin: "8px 0",
};

const metricSection = {
  backgroundColor: "#f9fafb",
  borderLeft: "4px solid #10b981",
  borderRadius: "6px",
  padding: "16px 20px",
  margin: "16px 0",
};

const metricTitle = {
  color: "#1f2937",
  fontSize: "17px",
  fontWeight: "700",
  margin: "0 0 10px",
};

const metricText = {
  color: "#4b5563",
  fontSize: "15px",
  lineHeight: "1.7",
  margin: "0",
};

const exampleBox = {
  backgroundColor: "#ecfdf5",
  border: "2px solid #10b981",
  borderRadius: "8px",
  padding: "24px",
  margin: "24px 0",
};

const exampleTitle = {
  color: "#065f46",
  fontSize: "18px",
  fontWeight: "700",
  margin: "0 0 16px",
};

const exampleText = {
  color: "#064e3b",
  fontSize: "15px",
  lineHeight: "1.7",
  margin: "0",
};

const featureList = {
  margin: "20px 0",
};

const featureItem = {
  color: "#374151",
  fontSize: "16px",
  lineHeight: "1.8",
  margin: "12px 0",
};

const ctaSection = {
  textAlign: "center" as const,
  margin: "32px 0",
};

const hr = {
  borderColor: "#e5e7eb",
  margin: "32px 0",
};

const footer = {
  color: "#6b7280",
  fontSize: "14px",
  lineHeight: "1.6",
  margin: "0",
};

const link = {
  color: "#8b5cf6",
  textDecoration: "underline",
};

const unsubscribe = {
  color: "#9ca3af",
  fontSize: "12px",
  lineHeight: "1.5",
  margin: "24px 0 0",
  textAlign: "center" as const,
};
