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

interface ProductDay3Props {
  firstName: string;
}

export const ProductDay3: React.FC<ProductDay3Props> = ({ firstName }) => {
  return (
    <Html>
      <Head />
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>See How Teams Like Yours Use AI 🚀</Heading>

          <Text style={greeting}>Hey {firstName},</Text>

          <Text style={paragraph}>
            You've downloaded the guide. You've seen the prompts. Now let me show you what happens when you put it all into action.
          </Text>

          {/* Real Example */}
          <Section style={exampleBox}>
            <Text style={exampleTitle}>Real Example: Sarah's Marketing Agency</Text>
            <Text style={exampleStat}>Team Size: 8 people</Text>
            <Text style={exampleText}>
              <strong>Before Perpetual Core:</strong>
              <br />• 12 hours/week writing client reports
              <br />• 8 hours/week managing content calendars
              <br />• 6 hours/week on email responses
              <br />
              <br />
              <strong>After Perpetual Core (30 days):</strong>
              <br />• Reports generated in 15 minutes (saved 11.75 hrs/week)
              <br />• Content calendar automated (saved 7 hrs/week)
              <br />• Email drafts created in seconds (saved 5 hrs/week)
              <br />
              <br />
              <strong>Total:</strong> 23.75 hours saved per week = $4,800/month
            </Text>
          </Section>

          {/* What You Get */}
          <Heading style={h2}>What You Get with Perpetual Core:</Heading>

          <Section style={featureList}>
            <Text style={feature}>✅ All AI models in one place (GPT-4, Claude, Gemini)</Text>
            <Text style={feature}>✅ Save & organize your prompts</Text>
            <Text style={feature}>✅ Upload docs & get instant answers (RAG)</Text>
            <Text style={feature}>✅ Build custom AI workflows</Text>
            <Text style={feature}>✅ Team collaboration & sharing</Text>
          </Section>

          {/* CTA */}
          <Section style={ctaBox}>
            <Heading style={ctaHeading}>Try It Free - No Credit Card Required</Heading>
            <Text style={ctaText}>
              Start with our free plan. Upgrade only when you're ready.
            </Text>
            <Button href="https://www.perpetualcore.com/signup" style={button}>
              Start Free Trial →
            </Button>
          </Section>

          <Text style={paragraph}>
            Questions? Just reply to this email - I read every response.
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

export default ProductDay3;

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

const exampleBox = {
  backgroundColor: "#f3f4f6",
  borderLeft: "4px solid #8b5cf6",
  borderRadius: "4px",
  padding: "20px",
  margin: "30px 0",
};

const exampleTitle = {
  color: "#1f2937",
  fontSize: "18px",
  fontWeight: "700",
  margin: "0 0 10px",
};

const exampleStat = {
  color: "#6b7280",
  fontSize: "14px",
  fontStyle: "italic",
  margin: "0 0 15px",
};

const exampleText = {
  color: "#374151",
  fontSize: "15px",
  lineHeight: "1.6",
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
