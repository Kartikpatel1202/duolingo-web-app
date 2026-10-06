import { Skeleton } from "@/components/ui";

import { layoutPath } from "./pathLayout";

/** Same geometry as the real path, so content slides in without a layout jump. */
export function PathSkeleton() {
  const { points, height } = layoutPath(4, 0);
  return (
    <div aria-busy="true" aria-label="Loading your learning path" className="space-y-6">
      <Skeleton className="h-[92px] w-full rounded-card" />
      <Skeleton className="h-[76px] w-full rounded-card" />
      <div className="relative mx-auto w-full max-w-[560px]" style={{ height }}>
        {points.map((point, i) => (
          <Skeleton
            key={i}
            shape="circle"
            className="absolute size-[86px] -translate-x-1/2 -translate-y-1/2"
            style={{ left: `${point.x * 100}%`, top: point.y }}
          />
        ))}
      </div>
    </div>
  );
}
