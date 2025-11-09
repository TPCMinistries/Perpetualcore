import { Resend } from "resend";

if (!process.env.RESEND_API_KEY) {
  throw new Error("RESEND_API_KEY is not defined in environment variables");
}

export const resend = new Resend(process.env.RESEND_API_KEY);

export const EMAIL_FROM = process.env.RESEND_FROM_EMAIL || "info@perpetualcore.com";
export const COMPANY_NAME = "Perpetual Core";
export const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://www.perpetualcore.com";
