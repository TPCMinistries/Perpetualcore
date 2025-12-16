/**
 * Create Stripe Product and Prices for Perpetual Core
 * Run with: npx tsx scripts/create-stripe-prices.ts
 */

import * as dotenv from "dotenv";
import * as path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-12-18.acacia",
});

const PRICING_TIERS = [
  {
    name: "Starter",
    monthlyPrice: 4900, // $49 in cents
    annualPrice: 47000, // $470 in cents
  },
  {
    name: "Pro",
    monthlyPrice: 9900, // $99 in cents
    annualPrice: 95000, // $950 in cents
  },
  {
    name: "Team",
    monthlyPrice: 49900, // $499 in cents
    annualPrice: 479000, // $4,790 in cents
  },
  {
    name: "Business",
    monthlyPrice: 199900, // $1,999 in cents
    annualPrice: 1919000, // $19,190 in cents
  },
  {
    name: "Enterprise",
    monthlyPrice: 999900, // $9,999 in cents
    annualPrice: 9599000, // $95,990 in cents
  },
];

async function main() {
  console.log("🚀 Creating Stripe Product and Prices for Perpetual Core...\n");

  // Check if product already exists
  const existingProducts = await stripe.products.list({ limit: 100 });
  let product = existingProducts.data.find(p => p.name === "Perpetual Core");

  if (product) {
    console.log(`✅ Product "Perpetual Core" already exists: ${product.id}`);
  } else {
    // Create the main product
    product = await stripe.products.create({
      name: "Perpetual Core",
      description: "AI-powered productivity platform with intelligent assistants, document management, and workflow automation.",
      metadata: {
        app: "perpetual-core",
      },
    });
    console.log(`✅ Created product "Perpetual Core": ${product.id}`);
  }

  console.log("\n📊 Creating price tiers...\n");

  const priceIds: Record<string, { monthly: string; annual: string }> = {};

  for (const tier of PRICING_TIERS) {
    console.log(`Creating ${tier.name} tier...`);

    // Create monthly price
    const monthlyPrice = await stripe.prices.create({
      product: product.id,
      unit_amount: tier.monthlyPrice,
      currency: "usd",
      recurring: {
        interval: "month",
      },
      nickname: `${tier.name} Monthly`,
      metadata: {
        tier: tier.name.toLowerCase(),
        billing: "monthly",
      },
    });

    // Create annual price
    const annualPrice = await stripe.prices.create({
      product: product.id,
      unit_amount: tier.annualPrice,
      currency: "usd",
      recurring: {
        interval: "year",
      },
      nickname: `${tier.name} Annual`,
      metadata: {
        tier: tier.name.toLowerCase(),
        billing: "annual",
      },
    });

    priceIds[tier.name.toLowerCase()] = {
      monthly: monthlyPrice.id,
      annual: annualPrice.id,
    };

    console.log(`  ✅ ${tier.name} Monthly: ${monthlyPrice.id} ($${tier.monthlyPrice / 100}/mo)`);
    console.log(`  ✅ ${tier.name} Annual: ${annualPrice.id} ($${tier.annualPrice / 100}/yr)`);
  }

  console.log("\n" + "=".repeat(60));
  console.log("🎉 All prices created! Add these to your .env.local and Vercel:\n");
  console.log("=".repeat(60) + "\n");

  console.log(`STRIPE_STARTER_MONTHLY_PRICE_ID=${priceIds.starter.monthly}`);
  console.log(`STRIPE_STARTER_ANNUAL_PRICE_ID=${priceIds.starter.annual}`);
  console.log(`STRIPE_PRO_MONTHLY_PRICE_ID=${priceIds.pro.monthly}`);
  console.log(`STRIPE_PRO_ANNUAL_PRICE_ID=${priceIds.pro.annual}`);
  console.log(`STRIPE_TEAM_MONTHLY_PRICE_ID=${priceIds.team.monthly}`);
  console.log(`STRIPE_TEAM_ANNUAL_PRICE_ID=${priceIds.team.annual}`);
  console.log(`STRIPE_BUSINESS_MONTHLY_PRICE_ID=${priceIds.business.monthly}`);
  console.log(`STRIPE_BUSINESS_ANNUAL_PRICE_ID=${priceIds.business.annual}`);
  console.log(`STRIPE_ENTERPRISE_MONTHLY_PRICE_ID=${priceIds.enterprise.monthly}`);
  console.log(`STRIPE_ENTERPRISE_ANNUAL_PRICE_ID=${priceIds.enterprise.annual}`);

  console.log("\n" + "=".repeat(60));
}

main().catch(console.error);
