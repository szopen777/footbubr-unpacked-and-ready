import { Skeleton } from '@/components/skeleton';

export default function ProductCardSkeleton() {
  return (
    <div className="bg-[#141414] border border-neutral-800/80 rounded-3xl overflow-hidden flex flex-col justify-between h-full">
      {/* Miejsce na zdjęcie */}
      <Skeleton className="aspect-square w-full rounded-none" />
      
      {/* Miejsce na treść */}
      <div className="p-4 sm:p-5 flex flex-col flex-1 gap-3">
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-4 w-12 rounded-lg" />
          </div>
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/4" />
        </div>

        <div className="space-y-3 pt-4 mt-auto">
          <Skeleton className="h-6 w-24" />
          <div className="grid grid-cols-2 gap-2">
            <Skeleton className="h-10 w-full rounded-xl" />
            <Skeleton className="h-10 w-full rounded-xl" />
          </div>
        </div>
      </div>
    </div>
  );
}
