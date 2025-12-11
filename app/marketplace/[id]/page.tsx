"use client";

import { useState, useEffect } from "react";
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
  Bot,
  Workflow,
  CheckCircle2,
  DollarSign,
  Users,
  Calendar,
  Loader2,
  ArrowLeft,
} from "lucide-react";
import { toast } from "sonner";

interface MarketplaceItem {
  id: string;
  type: "agent" | "workflow";
  name: string;
  description: string;
  long_description?: string;
  price: number;
  pricing_type: "one_time" | "subscription";
  subscription_interval?: string;
  category: string;
  tags: string[];
  features: string[];
  rating: number;
  review_count: number;
  total_sales: number;
  creator: {
    name: string;
    verified: boolean;
    total_items: number;
    total_sales: number;
    member_since: string;
  };
  reviews: Array<{
    id: string;
    rating: number;
    title?: string;
    comment: string;
    reviewer: string;
    verified_purchase: boolean;
    created_at: string;
  }>;
}

export default function MarketplaceItemPage() {
  const params = useParams();
  const router = useRouter();
  const [item, setItem] = useState<MarketplaceItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [alreadyPurchased, setAlreadyPurchased] = useState(false);

  useEffect(() => {
    fetchItem();
  }, [params.id]);

  async function fetchItem() {
    try {
      const response = await fetch(`/api/marketplace/items/${params.id}`);
      if (!response.ok) {
        throw new Error("Item not found");
      }
      const data = await response.json();
      setItem(data.item);
      setAlreadyPurchased(data.alreadyPurchased || false);
    } catch (error) {
      console.error("Error fetching item:", error);
      toast.error("Failed to load item");
    } finally {
      setLoading(false);
    }
  }

  const handlePurchase = async () => {
    if (!item) return;

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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
        <div className="container mx-auto px-4 py-12">
          <div className="flex items-center justify-center py-24">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-2 text-muted-foreground">Loading item...</span>
          </div>
        </div>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
        <div className="container mx-auto px-4 py-12">
          <Card>
            <CardContent className="py-12 text-center">
              <Bot className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Item not found</h3>
              <p className="text-muted-foreground mb-4">
                This item may have been removed or is no longer available.
              </p>
              <Button asChild>
                <Link href="/marketplace">Browse Marketplace</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <header className="border-b bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/marketplace" className="flex items-center space-x-2">
            <ArrowLeft className="h-5 w-5" />
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
                  <span className="font-medium">{item.rating || 0}</span>
                  <span className="text-muted-foreground">({item.review_count} reviews)</span>
                </div>
                <div className="flex items-center gap-1 text-muted-foreground">
                  <Download className="h-4 w-4" />
                  <span>{item.total_sales.toLocaleString()} sales</span>
                </div>
                {item.creator.verified && (
                  <div className="flex items-center gap-1 text-green-600">
                    <Shield className="h-4 w-4" />
                    <span>Verified Creator</span>
                  </div>
                )}
              </div>
            </div>

            <Separator />

            {/* Description */}
            {item.long_description && (
              <div>
                <h2 className="text-2xl font-bold mb-4">About This {item.type === "agent" ? "Agent" : "Workflow"}</h2>
                <div className="prose prose-gray dark:prose-invert max-w-none">
                  {item.long_description.split('\n').map((paragraph, i) => {
                    if (!paragraph.trim()) return null;

                    // Safely render text - escape HTML first, then apply formatting
                    const escapeHtml = (text: string) =>
                      text.replace(/&/g, '&amp;')
                          .replace(/</g, '&lt;')
                          .replace(/>/g, '&gt;')
                          .replace(/"/g, '&quot;')
                          .replace(/'/g, '&#039;');

                    const safeText = escapeHtml(paragraph);

                    // Check if it's a bullet point
                    if (paragraph.trim().startsWith('- ')) {
                      return (
                        <p key={i} className="mb-2 flex items-start gap-2">
                          <span>•</span>
                          <span>{paragraph.trim().substring(2)}</span>
                        </p>
                      );
                    }

                    // Handle bold text safely by splitting and rendering
                    if (paragraph.includes('**')) {
                      const parts = paragraph.split(/\*\*(.*?)\*\*/g);
                      return (
                        <p key={i} className="mb-4">
                          {parts.map((part, j) =>
                            j % 2 === 1 ? <strong key={j}>{part}</strong> : part
                          )}
                        </p>
                      );
                    }

                    return <p key={i} className="mb-4">{paragraph}</p>;
                  })}
                </div>
              </div>
            )}

            {/* Features */}
            {item.features && item.features.length > 0 && (
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
            )}

            {/* Tags */}
            {item.tags && item.tags.length > 0 && (
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
            )}

            {/* Reviews */}
            <div>
              <h2 className="text-2xl font-bold mb-4">Reviews ({item.review_count})</h2>
              {item.reviews && item.reviews.length > 0 ? (
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
              ) : (
                <Card>
                  <CardContent className="py-8 text-center">
                    <Star className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                    <p className="text-muted-foreground">No reviews yet. Be the first to review!</p>
                  </CardContent>
                </Card>
              )}
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
                        <span className="text-lg text-muted-foreground font-normal">
                          /{item.subscription_interval || "month"}
                        </span>
                      )}
                    </div>
                    {item.pricing_type === "one_time" && (
                      <Badge variant="secondary">One-time</Badge>
                    )}
                  </div>
                  {alreadyPurchased ? (
                    <>
                      <Button
                        size="lg"
                        className="w-full"
                        variant="outline"
                        asChild
                      >
                        <Link href="/marketplace/my-purchases">
                          View in My Purchases
                        </Link>
                      </Button>
                      <p className="text-xs text-center text-green-600 mt-2">
                        You already own this item
                      </p>
                    </>
                  ) : (
                    <>
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
                    </>
                  )}
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

                  {item.creator.member_since && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      <span>
                        Member since{" "}
                        {new Date(item.creator.member_since).toLocaleDateString("en-US", {
                          month: "long",
                          year: "numeric",
                        })}
                      </span>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
