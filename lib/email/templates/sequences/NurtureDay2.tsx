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

interface NurtureDay2Props {
  firstName: string;
}

export const NurtureDay2: React.FC<NurtureDay2Props> = ({ firstName }) => (
  <Html>
    <Head />
    <Preview>The #1 mistake businesses make with AI (and how to avoid it)</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Hi {firstName},</Heading>

        <Text style={text}>
          Yesterday, you downloaded our AI Productivity Guide. I hope you found it valuable!
        </Text>

        <Text style={text}>
          Today, I want to share the <strong>#1 mistake</strong> I see businesses make when implementing AI:
        </Text>

        <Section style={highlightBox}>
          <Text style={highlightText}>
            <strong>They try to automate everything at once.</strong>
          </Text>
        </Section>

        <Text style={text}>
          Instead of trying to AI-ify your entire business overnight, start with the "low-hanging fruit":
        </Text>

        <Section style={listContainer}>
          <Text style={listItem}>✓ <strong>Email responses</strong> - Save 5-10 hours/week</Text>
          <Text style={listItem}>✓ <strong>Meeting summaries</strong> - Never take notes again</Text>
          <Text style={listItem}>✓ <strong>Content creation</strong> - 10x your output</Text>
          <Text style={listItem}>✓ <strong>Data analysis</strong> - Insights in seconds, not days</Text>
        </Section>

        <Text style={text}>
          Pick ONE task that takes up the most time in your day. That's your starting point.
        </Text>

        <Section style={tipBox}>
          <Text style={tipTitle}>💡 Quick Win:</Text>
          <Text style={tipText}>
            Try using AI for your next email response. Use this prompt:
          </Text>
          <Text style={codeBlock}>
            "Write a professional email response to: [paste email]. Keep it concise, friendly, and actionable."
          </Text>
        </Section>

        <Text style={text}>
          Tomorrow, I'll share real case studies of companies that saved 20+ hours per week using this exact approach.
        </Text>

        <Text style={text}>
          Have questions? Just hit reply - I read every email.
        </Text>

        <Hr style={hr} />

        <Text style={footer}>
          Best,<br />
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

export default NurtureDay2;

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

const highlightBox = {
  backgroundColor: "#fef3c7",
  border: "2px solid #fbbf24",
  borderRadius: "8px",
  padding: "20px",
  margin: "24px 0",
};

const highlightText = {
  color: "#92400e",
  fontSize: "18px",
  lineHeight: "1.5",
  margin: "0",
  textAlign: "center" as const,
};

const listContainer = {
  margin: "20px 0",
};

const listItem = {
  color: "#374151",
  fontSize: "16px",
  lineHeight: "1.8",
  margin: "8px 0",
};

const tipBox = {
  backgroundColor: "#f3f4f6",
  borderLeft: "4px solid #8b5cf6",
  padding: "20px",
  margin: "24px 0",
  borderRadius: "4px",
};

const tipTitle = {
  color: "#7c3aed",
  fontSize: "16px",
  fontWeight: "700",
  margin: "0 0 12px",
};

const tipText = {
  color: "#374151",
  fontSize: "15px",
  lineHeight: "1.6",
  margin: "0 0 12px",
};

const codeBlock = {
  backgroundColor: "#1f2937",
  color: "#f9fafb",
  fontFamily: "monospace",
  fontSize: "14px",
  padding: "16px",
  borderRadius: "6px",
  lineHeight: "1.5",
  margin: "0",
  whiteSpace: "pre-wrap" as const,
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
