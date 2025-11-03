import { Card, CardContent } from "@/components/ui/card";

export function LoadingFallback() {
  return (
    <div className="animate-pulse space-y-4">
      <div className="h-8 bg-muted rounded w-1/3" />
      <Card>
        <CardContent className="p-6">
          <div className="space-y-3">
            <div className="h-4 bg-muted rounded w-full" />
            <div className="h-4 bg-muted rounded w-5/6" />
            <div className="h-4 bg-muted rounded w-4/6" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export function PageLoadingFallback() {
  return (
    <div className="space-y-6 animate-pulse">
      <div>
        <div className="h-10 bg-muted rounded w-1/4 mb-2" />
        <div className="h-4 bg-muted rounded w-1/3" />
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[...Array(6)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="space-y-3">
                <div className="h-6 bg-muted rounded w-2/3" />
                <div className="h-4 bg-muted rounded w-full" />
                <div className="h-4 bg-muted rounded w-4/5" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

export function TableLoadingFallback() {
  return (
    <div className="space-y-3 animate-pulse">
      <div className="h-10 bg-muted rounded" />
      {[...Array(5)].map((_, i) => (
        <div key={i} className="h-16 bg-muted rounded" />
      ))}
    </div>
  );
}

export function ComponentLoadingFallback() {
  return (
    <div className="flex items-center justify-center p-8">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
    </div>
  );
}
