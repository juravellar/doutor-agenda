import { PageContainer, PageContent } from "@/components/ui/page-container";
import { Skeleton } from "@/components/ui/skeleton";

// Loading states shaped like the pages they stand in for, shown the moment a
// link is clicked while the server renders the real page.

export function HeaderSkeleton({
  withAction = true,
}: {
  withAction?: boolean;
}) {
  return (
    <div className="flex w-full flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="space-y-2">
        <Skeleton className="h-7 w-40" />
        <Skeleton className="h-4 w-64 max-w-full" />
      </div>
      {withAction && <Skeleton className="h-9 w-44" />}
    </div>
  );
}

function CardSkeleton({ className }: { className?: string }) {
  return (
    <div className={`space-y-3 rounded-xl border p-6 ${className ?? ""}`}>
      <Skeleton className="h-4 w-28" />
      <Skeleton className="h-8 w-20" />
    </div>
  );
}

export function TablePageSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <PageContainer>
      <HeaderSkeleton />
      <PageContent>
        <div className="overflow-hidden rounded-md border">
          <div className="border-b p-3">
            <Skeleton className="h-4 w-1/2" />
          </div>
          {Array.from({ length: rows }, (_, row) => (
            <div key={row} className="flex gap-4 border-b p-3 last:border-0">
              <Skeleton className="h-4 flex-1" />
              <Skeleton className="hidden h-4 flex-1 sm:block" />
              <Skeleton className="h-4 w-24" />
            </div>
          ))}
        </div>
      </PageContent>
    </PageContainer>
  );
}

export function CardGridPageSkeleton({ cards = 3 }: { cards?: number }) {
  return (
    <PageContainer>
      <HeaderSkeleton />
      <PageContent>
        <div className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,280px),20rem))] gap-6">
          {Array.from({ length: cards }, (_, card) => (
            <div key={card} className="space-y-4 rounded-xl border p-6">
              <div className="flex items-center gap-2">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
              <Skeleton className="h-5 w-2/3" />
              <Skeleton className="h-5 w-1/2" />
              <Skeleton className="h-10 w-full" />
            </div>
          ))}
        </div>
      </PageContent>
    </PageContainer>
  );
}

export function DashboardSkeleton() {
  return (
    <PageContainer>
      <HeaderSkeleton />
      <PageContent>
        <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
          {Array.from({ length: 4 }, (_, card) => (
            <CardSkeleton key={card} />
          ))}
        </div>
        <div className="grid gap-4 lg:grid-cols-[2.25fr_1fr]">
          <Skeleton className="h-[300px] rounded-xl" />
          <Skeleton className="h-[300px] rounded-xl" />
        </div>
        <div className="grid gap-4 lg:grid-cols-[2.25fr_1fr]">
          <Skeleton className="h-56 rounded-xl" />
          <Skeleton className="h-56 rounded-xl" />
        </div>
      </PageContent>
    </PageContainer>
  );
}

export function CardsPageSkeleton({ cards = 2 }: { cards?: number }) {
  return (
    <PageContainer>
      <HeaderSkeleton withAction={false} />
      <PageContent>
        <div className="grid max-w-2xl gap-6">
          {Array.from({ length: cards }, (_, card) => (
            <div key={card} className="space-y-3 rounded-xl border p-6">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
            </div>
          ))}
        </div>
      </PageContent>
    </PageContainer>
  );
}

export function SubscriptionSkeleton() {
  return (
    <PageContainer>
      <HeaderSkeleton withAction={false} />
      <PageContent>
        <Skeleton className="h-48 rounded-xl" />
        <div className="grid gap-6 lg:grid-cols-3">
          {Array.from({ length: 3 }, (_, plan) => (
            <Skeleton key={plan} className="h-96 rounded-xl" />
          ))}
        </div>
      </PageContent>
    </PageContainer>
  );
}
