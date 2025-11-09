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

interface NurtureDay4Props {
  firstName: string;
}

export const NurtureDay4: React.FC<NurtureDay4Props> = ({ firstName }) => (
  <Html>
    <Head />
    <Preview>Your AI implementation roadmap - Free template inside</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Your 30-Day AI Roadmap</Heading>

        <Text style={text}>Hi {firstName},</Text>

        <Text style={text}>
          Over the past few days, you've learned about AI mistakes to avoid and real success stories.
          Now it's time for the most important piece: <strong>your implementation plan</strong>.
        </Text>

        <Section style={downloadBox}>
          <Text style={downloadTitle}>📋 FREE DOWNLOAD</Text>
          <Heading style={downloadHeading}>30-Day AI Implementation Roadmap</Heading>
          <Text style={downloadDescription}>
            A step-by-step template to transform your workflow with AI in just one month
          </Text>
          <Button
            href="https://www.perpetualcore.com/downloads/30-day-ai-roadmap.pdf"
            style={button}
          >
            Download Your Roadmap →
          </Button>
        </Section>

        <Text style={text}>
          <strong>What's inside:</strong>
        </Text>

        <Section style={weekSection}>
          <Text style={weekTitle}>📅 Week 1: Foundation</Text>
          <Text style={weekText}>
            • Identify your top 3 time-consuming tasks<br />
            • Set up your AI tools (we'll show you exactly which ones)<br />
            • Create your first AI prompt library
          </Text>
        </Section>

        <Section style={weekSection}>
          <Text style={weekTitle}>📅 Week 2: First Automations</Text>
          <Text style={weekText}>
            • Automate email responses (save 5+ hours/week)<br />
            • Set up AI meeting summaries<br />
            • Build your content creation system
          </Text>
        </Section>

        <Section style={weekSection}>
          <Text style={weekTitle}>📅 Week 3: Scale Up</Text>
          <Text style={weekText}>
            • Expand to customer support automation<br />
            • Implement AI for data analysis<br />
            • Train your team on best practices
          </Text>
        </Section>

        <Section style={weekSection}>
          <Text style={weekTitle}>📅 Week 4: Measure & Optimize</Text>
          <Text style={weekText}>
            • Calculate your ROI (time & money saved)<br />
            • Identify next automation opportunities<br />
            • Plan your AI expansion strategy
          </Text>
        </Section>

        <Section style={bonusBox}>
          <Text style={bonusTitle}>🎁 BONUS INCLUDED:</Text>
          <Text style={bonusText}>
            ✓ 50+ Copy-Paste AI Prompts<br />
            ✓ ROI Calculator Spreadsheet<br />
            ✓ Team Training Checklist<br />
            ✓ Troubleshooting Guide
          </Text>
        </Section>

        <Text style={text}>
          This is the same roadmap our clients use to achieve 10x productivity gains.
          And it's yours free.
        </Text>

        <Section style={ctaSection}>
          <Button
            href="https://www.perpetualcore.com/downloads/30-day-ai-roadmap.pdf"
            style={buttonSecondary}
          >
            Get Your Free Roadmap
          </Button>
        </Section>

        <Text style={text}>
          Tomorrow, I'll share the ROI calculator that helps you measure exactly how much time and money AI is saving you.
        </Text>

        <Text style={text}>
          Questions about the roadmap? Reply to this email - I'm here to help!
        </Text>

        <Hr style={hr} />

        <Text style={footer}>
          To your success,<br />
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

export default NurtureDay4;

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

const downloadBox = {
  backgroundColor: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
  background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
  borderRadius: "12px",
  padding: "32px",
  margin: "32px 0",
  textAlign: "center" as const,
};

const downloadTitle = {
  color: "#fbbf24",
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
  color: "#e5e7eb",
  fontSize: "16px",
  lineHeight: "1.5",
  margin: "0 0 24px",
};

const button = {
  backgroundColor: "#ffffff",
  borderRadius: "8px",
  color: "#7c3aed",
  fontSize: "16px",
  fontWeight: "700",
  textDecoration: "none",
  textAlign: "center" as const,
  display: "inline-block",
  padding: "14px 32px",
  margin: "8px 0",
};

const buttonSecondary = {
  backgroundColor: "#8b5cf6",
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

const weekSection = {
  backgroundColor: "#f9fafb",
  borderLeft: "4px solid #8b5cf6",
  borderRadius: "6px",
  padding: "16px 20px",
  margin: "16px 0",
};

const weekTitle = {
  color: "#1f2937",
  fontSize: "17px",
  fontWeight: "700",
  margin: "0 0 10px",
};

const weekText = {
  color: "#4b5563",
  fontSize: "15px",
  lineHeight: "1.7",
  margin: "0",
};

const bonusBox = {
  backgroundColor: "#fef3c7",
  border: "2px dashed #fbbf24",
  borderRadius: "8px",
  padding: "20px",
  margin: "24px 0",
  textAlign: "center" as const,
};

const bonusTitle = {
  color: "#92400e",
  fontSize: "18px",
  fontWeight: "700",
  margin: "0 0 12px",
};

const bonusText = {
  color: "#78350f",
  fontSize: "15px",
  lineHeight: "1.8",
  margin: "0",
  textAlign: "left" as const,
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
