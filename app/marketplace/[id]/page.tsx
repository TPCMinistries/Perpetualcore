"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Star,
  Download,
  Shield,
  TrendingUp,
  Bot,
  Workflow,
  CheckCircle2,
  Play,
  DollarSign,
  Users,
  Calendar
} from "lucide-react";
import { toast } from "sonner";

export default function MarketplaceItemPage() {
  const params = useParams();
  const router = useRouter();
  const [isPurchasing, setIsPurchasing] = useState(false);

  // Mock data - replace with actual API call
  const item = {
    id: params.id,
    type: "agent",
    name: "Legal Document Analyzer",
    description: "AI agent that analyzes legal documents and extracts key clauses, risks, and recommendations.",
    long_description: `This powerful AI agent is specifically trained on legal documents and can help law firms save countless hours on document review.

**Key Capabilities:**
- Automatically extracts key clauses from contracts
- Identifies potential risks and red flags
- Provides clause-by-clause analysis and recommendations
- Generates executive summaries of complex legal documents
- Supports multiple document formats (PDF, DOCX, TXT)

**Perfect for:**
- Law firms handling high volumes of contracts
- In-house legal departments
- Contract review services
- Compliance teams

**What's Included:**
- Pre-trained AI agent with legal domain expertise
- Customizable risk threshold settings
- Integration with your existing document management system
- Regular updates with latest legal best practices`,
    price: 99,
    pricing_type: "one_time",
    category: "Legal",
    tags: ["legal", "document-analysis", "contracts", "compliance"],
    features: [
      "Clause extraction and categorization",
      "Risk assessment scoring",
      "Automated redlining",
      "Multi-document batch processing",
      "Custom legal dictionary support",
      "Compliance checking (GDPR, SOC2, etc.)",
      "Export to Word/PDF with annotations",
      "Integration API included"
    ],
    rating: 4.8,
    review_count: 124,
    total_sales: 856,
    images: [],
    demo_video_url: null,
    creator: {
      name: "LawTech AI",
      avatar: null,
      verified: true,
      total_items: 8,
      total_sales: 2456,
      member_since: "2024-01"
    },
    reviews: [
      {
        id: "1",
        rating: 5,
        title: "Game changer for our firm",
        comment: "This agent has reduced our contract review time by 60%. The accuracy is impressive and it catches things we sometimes miss.",
        reviewer: "Sarah M.",
        verified_purchase: true,
        created_at: "2025-01-15"
      },
      {
        id: "2",
        rating: 5,
        title: "Worth every penny",
        comment: "Best investment we've made this year. The ROI was clear within the first month.",
        reviewer: "John D.",
        verified_purchase: true,
        created_at: "2025-01-10"
      },
      {
        id: "3",
        rating: 4,
        title: "Very good, with room for improvement",
        comment: "Great overall, but would love to see more customization options for industry-specific clauses.",
        reviewer: "Emily R.",
        verified_purchase: true,
        created_at: "2025-01-05"
      }
    ]
  };

  const handlePurchase = async () => {
    setIsPurchasing(true);
    try {
      const response = await fetch("/api/marketplace/purchase", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          item_id: item.id,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to purchase item");
      }

      // Redirect to Stripe checkout if needed, or to success page
      if (data.checkout_url) {
        window.location.href = data.checkout_url;
      } else {
        toast.success("Purchase successful! Item added to your account.");
        router.push("/marketplace/my-purchases");
      }
    } catch (error: any) {
      console.error("Purchase error:", error);
      toast.error(error.message || "Failed to complete purchase");
    } finally {
      setIsPurchasing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <header className="border-b bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/marketplace" className="flex items-center space-x-2">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-bold">
              AI
            </div>
            <span className="text-xl font-bold">Back to Marketplace</span>
          </Link>
        </div>
      </header>

      <div className="container mx-auto px-4 py-12">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Item Header */}
            <div>
              <div className="flex items-start gap-4 mb-4">
                <div className="h-16 w-16 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  {item.type === "agent" ? (
                    <Bot className="h-8 w-8 text-primary" />
                  ) : (
                    <Workflow className="h-8 w-8 text-primary" />
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge>{item.category}</Badge>
                    <Badge variant="outline">{item.type === "agent" ? "AI Agent" : "Workflow"}</Badge>
                  </div>
                  <h1 className="text-3xl font-bold mb-2">{item.name}</h1>
                  <p className="text-lg text-muted-foreground">{item.description}</p>
                </div>
              </div>

              {/* Stats */}
              <div className="flex items-center gap-6 text-sm">
                <div className="flex items-center gap-1">
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  <span className="font-medium">{item.rating}</span>
                  <span className="text-muted-foreground">({item.review_count} reviews)</span>
                </div>
                <div className="flex items-center gap-1 text-muted-foreground">
                  <Download className="h-4 w-4" />
                  <span>{item.total_sales.toLocaleString()} sales</span>
                </div>
                <div className="flex items-center gap-1 text-green-600">
                  <Shield className="h-4 w-4" />
                  <span>Verified Creator</span>
                </div>
              </div>
            </div>

            <Separator />

            {/* Description */}
            <div>
              <h2 className="text-2xl font-bold mb-4">About This {item.type === "agent" ? "Agent" : "Workflow"}</h2>
              <div className="prose prose-gray dark:prose-invert max-w-none">
                {item.long_description.split('\n').map((paragraph, i) => (
                  paragraph.trim() && (
                    <p key={i} className="mb-4">
                      {paragraph.includes('**') ? (
                        <span dangerouslySetInnerHTML={{
                          __html: paragraph
                            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                            .replace(/^- /gm, '• ')
                        }} />
                      ) : (
                        paragraph
                      )}
                    </p>
                  )
                ))}
              </div>
            </div>

            {/* Features */}
            <div>
              <h2 className="text-2xl font-bold mb-4">Key Features</h2>
              <div className="grid md:grid-cols-2 gap-3">
                {item.features.map((feature, index) => (
                  <div key={index} className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <span className="text-sm">{feature}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Tags */}
            <div>
              <h2 className="text-2xl font-bold mb-4">Tags</h2>
              <div className="flex flex-wrap gap-2">
                {item.tags.map((tag) => (
                  <Badge key={tag} variant="outline">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Reviews */}
            <div>
              <h2 className="text-2xl font-bold mb-4">Reviews ({item.review_count})</h2>
              <div className="space-y-4">
                {item.reviews.map((review) => (
                  <Card key={review.id}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="flex">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`h-4 w-4 ${
                                  i < review.rating
                                    ? "fill-yellow-400 text-yellow-400"
                                    : "text-gray-300"
                                }`}
                              />
                            ))}
                          </div>
                          <span className="font-semibold">{review.reviewer}</span>
                          {review.verified_purchase && (
                            <Badge variant="secondary" className="text-xs">
                              Verified Purchase
                            </Badge>
                          )}
                        </div>
                        <span className="text-sm text-muted-foreground">
                          {new Date(review.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      {review.title && <CardTitle className="text-lg">{review.title}</CardTitle>}
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground">{review.comment}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 space-y-6">
              {/* Purchase Card */}
              <Card className="border-primary border-2">
                <CardHeader>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-1 text-3xl font-bold">
                      <DollarSign className="h-6 w-6" />
                      {item.price}
                      {item.pricing_type === "subscription" && (
                        <span className="text-lg text-muted-foreground font-normal">/month</span>
                      )}
                    </div>
                    {item.pricing_type === "one_time" && (
                      <Badge variant="secondary">One-time</Badge>
                    )}
                  </div>
                  <Button
                    size="lg"
                    className="w-full"
                    onClick={handlePurchase}
                    disabled={isPurchasing}
                  >
                    {isPurchasing ? "Processing..." : "Purchase Now"}
                  </Button>
                  <p className="text-xs text-center text-muted-foreground mt-2">
                    30-day money-back guarantee
                  </p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3 text-sm">
                    <div className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                      <span>Instant delivery after purchase</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                      <span>Free updates for life</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                      <span>Email support included</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                      <span>Commercial license</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Creator Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    About the Creator
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center font-bold">
                      {item.creator.name.charAt(0)}
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold">{item.creator.name}</div>
                      {item.creator.verified && (
                        <Badge variant="secondary" className="text-xs">
                          Verified Creator
                        </Badge>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-center text-sm">
                    <div>
                      <div className="font-bold text-lg">{item.creator.total_items}</div>
                      <div className="text-muted-foreground">Items</div>
                    </div>
                    <div>
                      <div className="font-bold text-lg">{item.creator.total_sales.toLocaleString()}</div>
                      <div className="text-muted-foreground">Sales</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>Member since {new Date(item.creator.member_since).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</span>
                  </div>

                  <Button variant="outline" className="w-full" asChild>
                    <Link href={`/marketplace/creators/${item.creator.name}`}>
                      View All Items
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
