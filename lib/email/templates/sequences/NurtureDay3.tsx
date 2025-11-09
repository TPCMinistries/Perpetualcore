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

interface NurtureDay3Props {
  firstName: string;
}

export const NurtureDay3: React.FC<NurtureDay3Props> = ({ firstName }) => (
  <Html>
    <Head />
    <Preview>Real companies saving 20+ hours/week with AI</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>How Top Companies Saved 20 Hours/Week</Heading>

        <Text style={text}>Hi {firstName},</Text>

        <Text style={text}>
          Yesterday we talked about the #1 mistake with AI. Today, I want to share <strong>real results</strong> from companies using AI the right way.
        </Text>

        <Section style={caseStudyBox}>
          <Heading style={caseStudyTitle}>📊 Case Study #1: Marketing Agency</Heading>
          <Text style={caseStudyText}>
            <strong>Challenge:</strong> Spending 15 hours/week writing client reports
          </Text>
          <Text style={caseStudyText}>
            <strong>Solution:</strong> AI-powered report generation using Perpetual Core
          </Text>
          <Text style={caseStudyText}>
            <strong>Result:</strong> ⏱️ 12 hours saved weekly | 💰 $4,800/month in billable time recovered
          </Text>
        </Section>

        <Section style={caseStudyBox}>
          <Heading style={caseStudyTitle}>💼 Case Study #2: SaaS Startup</Heading>
          <Text style={caseStudyText}>
            <strong>Challenge:</strong> Customer support team overwhelmed with repetitive questions
          </Text>
          <Text style={caseStudyText}>
            <strong>Solution:</strong> AI customer support assistant
          </Text>
          <Text style={caseStudyText}>
            <strong>Result:</strong> 📉 40% reduction in support tickets | ⚡ 2-minute avg response time | 😊 92% satisfaction score
          </Text>
        </Section>

        <Section style={caseStudyBox}>
          <Heading style={caseStudyTitle}>🏢 Case Study #3: Consulting Firm</Heading>
          <Text style={caseStudyText}>
            <strong>Challenge:</strong> Hours spent on meeting notes and follow-ups
          </Text>
          <Text style={caseStudyText}>
            <strong>Solution:</strong> AI meeting transcription + automatic action items
          </Text>
          <Text style={caseStudyText}>
            <strong>Result:</strong> 🎯 100% of action items captured | 💪 8 hours saved per consultant/week
          </Text>
        </Section>

        <Section style={patternBox}>
          <Text style={patternTitle}>🔍 The Pattern:</Text>
          <Text style={patternText}>
            Notice what all these companies did:<br /><br />
            1️⃣ They identified ONE specific, repetitive task<br />
            2️⃣ They implemented AI for THAT task only<br />
            3️⃣ They measured the results<br />
            4️⃣ Then they expanded to other areas
          </Text>
        </Section>

        <Text style={text}>
          <strong>Your turn:</strong> What's one repetitive task that's eating up your team's time?
        </Text>

        <Section style={ctaBox}>
          <Text style={ctaText}>
            Tomorrow, I'll send you a free implementation roadmap showing exactly how to automate your first workflow in just 30 days.
          </Text>
        </Section>

        <Text style={text}>
          Questions? Hit reply - I love hearing what you're working on.
        </Text>

        <Hr style={hr} />

        <Text style={footer}>
          Cheers,<br />
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

export default NurtureDay3;

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

const caseStudyBox = {
  backgroundColor: "#f9fafb",
  border: "1px solid #e5e7eb",
  borderLeft: "4px solid #3b82f6",
  borderRadius: "8px",
  padding: "20px",
  margin: "20px 0",
};

const caseStudyTitle = {
  color: "#1f2937",
  fontSize: "18px",
  fontWeight: "700",
  margin: "0 0 12px",
};

const caseStudyText = {
  color: "#4b5563",
  fontSize: "15px",
  lineHeight: "1.6",
  margin: "8px 0",
};

const patternBox = {
  backgroundColor: "#fef3c7",
  border: "2px solid #fbbf24",
  borderRadius: "12px",
  padding: "24px",
  margin: "32px 0",
};

const patternTitle = {
  color: "#92400e",
  fontSize: "20px",
  fontWeight: "700",
  margin: "0 0 16px",
};

const patternText = {
  color: "#78350f",
  fontSize: "16px",
  lineHeight: "1.8",
  margin: "0",
};

const ctaBox = {
  backgroundColor: "#ede9fe",
  borderRadius: "8px",
  padding: "20px",
  margin: "24px 0",
  textAlign: "center" as const,
};

const ctaText = {
  color: "#5b21b6",
  fontSize: "17px",
  fontWeight: "600",
  lineHeight: "1.6",
  margin: "0",
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
