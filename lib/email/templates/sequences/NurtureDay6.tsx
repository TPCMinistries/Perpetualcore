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

interface NurtureDay6Props {
  firstName: string;
}

export const NurtureDay6: React.FC<NurtureDay6Props> = ({ firstName }) => (
  <Html>
    <Head />
    <Preview>Ready to transform your workflow? Let's talk about next steps</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Ready to Transform Your Workflow?</Heading>

        <Text style={text}>Hi {firstName},</Text>

        <Text style={text}>
          Over the past week, you've received:
        </Text>

        <Section style={recapBox}>
          <Text style={recapItem}>✓ The AI Productivity Guide</Text>
          <Text style={recapItem}>✓ Common AI mistakes to avoid</Text>
          <Text style={recapItem}>✓ Real case studies with proven results</Text>
          <Text style={recapItem}>✓ 30-Day Implementation Roadmap</Text>
          <Text style={recapItem}>✓ ROI Calculator to track your progress</Text>
        </Section>

        <Text style={text}>
          That's <strong>$1,500+ worth of consulting knowledge</strong>, completely free.
        </Text>

        <Text style={text}>
          Now, I want to be honest with you about what comes next...
        </Text>

        <Section style={dividerSection}>
          <Hr style={divider} />
        </Section>

        <Heading style={h2}>You Have Two Paths Forward</Heading>

        <Section style={pathBox}>
          <Text style={pathTitle}>🛠️ Path 1: Do It Yourself</Text>
          <Text style={pathText}>
            Use the resources I've shared to implement AI on your own. This works great if you have:
          </Text>
          <Text style={pathList}>
            • Time to research and test different AI tools<br />
            • Technical expertise to set up integrations<br />
            • Budget for multiple separate tools<br />
            • Patience to troubleshoot when things break
          </Text>
          <Text style={pathText}>
            <strong>Estimated timeline:</strong> 3-6 months to full implementation<br />
            <strong>Estimated cost:</strong> $300-800/month across multiple tools
          </Text>
        </Section>

        <Section style={pathBoxHighlight}>
          <Text style={pathTitleHighlight}>🚀 Path 2: Perpetual Core</Text>
          <Text style={pathTextHighlight}>
            Get a complete AI platform built specifically for your business. Everything in one place:
          </Text>
          <Text style={pathListHighlight}>
            ✓ All AI models (GPT-4, Claude, Gemini) in one interface<br />
            ✓ Your company knowledge base with instant AI answers<br />
            ✓ Custom automations without coding<br />
            ✓ Team collaboration and sharing<br />
            ✓ White-glove setup and training
          </Text>
          <Text style={pathTextHighlight}>
            <strong>Implementation:</strong> 2 weeks to full deployment<br />
            <strong>Cost:</strong> Starting at $99/month (replaces 5+ tools)
          </Text>
        </Section>

        <Section style={benefitsBox}>
          <Heading style={benefitsTitle}>Why Perpetual Core is Different</Heading>

          <Text style={benefitItem}>
            <strong>1. Your Knowledge, Supercharged</strong><br />
            Upload your documents, SOPs, and tribal knowledge. AI instantly becomes an expert on YOUR business, not just generic answers.
          </Text>

          <Text style={benefitItem}>
            <strong>2. All Models, One Platform</strong><br />
            Stop switching between ChatGPT, Claude, and others. Use the best AI for each task, all in one place.
          </Text>

          <Text style={benefitItem}>
            <strong>3. Built for Teams</strong><br />
            Share prompts, collaborate on documents, track usage. Finally, AI that works for the whole company.
          </Text>

          <Text style={benefitItem}>
            <strong>4. Actually Secure</strong><br />
            Your data stays yours. No training on your information. SOC 2 compliant. Built for businesses that care about privacy.
          </Text>
        </Section>

        <Section style={testimonialBox}>
          <Text style={testimonialQuote}>
            "We tried cobbling together ChatGPT, Notion AI, and other tools. It was a mess. Perpetual Core gave us everything in one place, and our team actually uses it. ROI paid for itself in the first month."
          </Text>
          <Text style={testimonialAuthor}>
            — Sarah Chen, Operations Director at TechFlow Solutions
          </Text>
        </Section>

        <Section style={ctaBox}>
          <Heading style={ctaHeading}>Let's Talk About Your Needs</Heading>
          <Text style={ctaText}>
            I'd love to show you how Perpetual Core can work for your specific business.
            No pressure, no sales pitch - just a genuine conversation about your AI goals.
          </Text>
          <Button
            href="https://www.perpetualcore.com/demo"
            style={ctaButton}
          >
            Schedule a Free Demo
          </Button>
          <Text style={ctaSubtext}>
            15-minute call · See it in action · Get custom recommendations
          </Text>
        </Section>

        <Section style={psBox}>
          <Text style={psTitle}>P.S. Not ready yet?</Text>
          <Text style={psText}>
            That's totally fine! You'll continue getting valuable AI tips and resources from me.
            When you're ready, we'll be here. And if you decide DIY is your path, I genuinely wish you success with it.
          </Text>
        </Section>

        <Text style={text}>
          Either way, thank you for being part of this journey. I hope the resources I've shared
          have been valuable to you.
        </Text>

        <Hr style={hr} />

        <Text style={footer}>
          Here to help,<br />
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

export default NurtureDay6;

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

const h2 = {
  color: "#1f2937",
  fontSize: "24px",
  fontWeight: "700",
  margin: "32px 0 20px",
  lineHeight: "1.3",
};

const text = {
  color: "#374151",
  fontSize: "16px",
  lineHeight: "1.6",
  margin: "0 0 16px",
};

const recapBox = {
  backgroundColor: "#f3f4f6",
  borderRadius: "8px",
  padding: "20px 24px",
  margin: "24px 0",
};

const recapItem = {
  color: "#1f2937",
  fontSize: "16px",
  lineHeight: "1.8",
  margin: "8px 0",
};

const dividerSection = {
  margin: "32px 0",
};

const divider = {
  borderColor: "#e5e7eb",
  margin: "0",
};

const pathBox = {
  backgroundColor: "#f9fafb",
  border: "2px solid #e5e7eb",
  borderRadius: "12px",
  padding: "24px",
  margin: "20px 0",
};

const pathBoxHighlight = {
  backgroundColor: "#ede9fe",
  border: "3px solid #8b5cf6",
  borderRadius: "12px",
  padding: "24px",
  margin: "20px 0",
};

const pathTitle = {
  color: "#1f2937",
  fontSize: "20px",
  fontWeight: "700",
  margin: "0 0 12px",
};

const pathTitleHighlight = {
  color: "#7c3aed",
  fontSize: "20px",
  fontWeight: "700",
  margin: "0 0 12px",
};

const pathText = {
  color: "#4b5563",
  fontSize: "16px",
  lineHeight: "1.6",
  margin: "0 0 12px",
};

const pathTextHighlight = {
  color: "#5b21b6",
  fontSize: "16px",
  lineHeight: "1.6",
  margin: "0 0 12px",
};

const pathList = {
  color: "#6b7280",
  fontSize: "15px",
  lineHeight: "1.8",
  margin: "12px 0",
};

const pathListHighlight = {
  color: "#6b21a8",
  fontSize: "15px",
  lineHeight: "1.8",
  margin: "12px 0",
  fontWeight: "500",
};

const benefitsBox = {
  backgroundColor: "#f9fafb",
  borderRadius: "12px",
  padding: "32px 24px",
  margin: "32px 0",
};

const benefitsTitle = {
  color: "#1f2937",
  fontSize: "22px",
  fontWeight: "700",
  margin: "0 0 24px",
  textAlign: "center" as const,
};

const benefitItem = {
  color: "#374151",
  fontSize: "16px",
  lineHeight: "1.7",
  margin: "0 0 20px",
};

const testimonialBox = {
  backgroundColor: "#ecfdf5",
  borderLeft: "4px solid #10b981",
  borderRadius: "6px",
  padding: "24px",
  margin: "32px 0",
};

const testimonialQuote = {
  color: "#064e3b",
  fontSize: "17px",
  fontStyle: "italic",
  lineHeight: "1.7",
  margin: "0 0 16px",
};

const testimonialAuthor = {
  color: "#065f46",
  fontSize: "15px",
  fontWeight: "600",
  margin: "0",
};

const ctaBox = {
  backgroundColor: "linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)",
  background: "linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)",
  borderRadius: "12px",
  padding: "40px 32px",
  margin: "32px 0",
  textAlign: "center" as const,
};

const ctaHeading = {
  color: "#ffffff",
  fontSize: "26px",
  fontWeight: "700",
  margin: "0 0 16px",
  lineHeight: "1.3",
};

const ctaText = {
  color: "#e5e7eb",
  fontSize: "16px",
  lineHeight: "1.6",
  margin: "0 0 24px",
};

const ctaButton = {
  backgroundColor: "#ffffff",
  borderRadius: "8px",
  color: "#7c3aed",
  fontSize: "18px",
  fontWeight: "700",
  textDecoration: "none",
  textAlign: "center" as const,
  display: "inline-block",
  padding: "16px 40px",
  margin: "8px 0",
};

const ctaSubtext = {
  color: "#d1d5db",
  fontSize: "14px",
  margin: "16px 0 0",
};

const psBox = {
  backgroundColor: "#fef3c7",
  borderRadius: "8px",
  padding: "20px 24px",
  margin: "32px 0",
};

const psTitle = {
  color: "#92400e",
  fontSize: "16px",
  fontWeight: "700",
  margin: "0 0 8px",
};

const psText = {
  color: "#78350f",
  fontSize: "15px",
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
