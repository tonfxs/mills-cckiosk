// components/(admin)/OrderCardSkeleton.tsx
export default function OrderCardSkeleton() {
  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-xl animate-pulse">
      <div className="flex justify-between items-start">
        <div className="space-y-3">
          {/* Order ID Placeholder - Narrower and lighter */}
          <div className="h-5 w-28 bg-slate-100 rounded-md" />
          {/* Sales Channel Placeholder */}
          <div className="h-3 w-16 bg-slate-50 rounded" />
        </div>
        {/* Status Badge Placeholder - More subtle */}
        <div className="h-6 w-20 bg-slate-50 rounded-full" />
      </div>

      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="space-y-2">
            {/* Label Placeholder */}
            <div className="h-2.5 w-12 bg-slate-50 rounded" />
            {/* Value Placeholder */}
            <div className="h-4 w-36 bg-slate-100/80 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}