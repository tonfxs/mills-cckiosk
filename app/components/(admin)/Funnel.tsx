type Funnel = {
  started: number;
  verified: number;
  completed: number;
};

function clamp(n: number) {
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, n);
}

function pct(part: number, whole: number) {
  const w = clamp(whole);
  const p = clamp(part);
  if (w === 0) return 0;
  return Math.round((p / w) * 100);
}

export default function TodayVsTotalFunnelPanel({
  today,
  total,
}: {
  today?: Partial<Funnel>;
  total?: Partial<Funnel>;
}) {
  const t: Funnel = {
    started: clamp(today?.started ?? 0),
    verified: clamp(today?.verified ?? 0),
    completed: clamp(today?.completed ?? 0),
  };

  const all: Funnel = {
    started: clamp(total?.started ?? 0),
    verified: clamp(total?.verified ?? 0),
    completed: clamp(total?.completed ?? 0),
  };

  const todayVerifyRate = pct(t.verified, t.started);
  const todayCompleteRate = pct(t.completed, t.started);

  const totalVerifyRate = pct(all.verified, all.started);
  const totalCompleteRate = pct(all.completed, all.started);

  return (
    <section className="rounded-2xl border bg-white shadow-sm">
      <div className="p-5 border-b">
        <h3 className="font-semibold text-gray-900">Today vs Total Success Funnel</h3>
        <p className="text-sm text-gray-500">Completion performance (today compared to overall)</p>
      </div>

      <div className="p-5 grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* TODAY */}
        <div className="rounded-xl border bg-gray-50 p-4">
          <div className="flex items-center justify-between">
            <div className="text-sm font-semibold text-gray-900">Today</div>
            <div className="text-xs text-gray-600">Complete rate: {todayCompleteRate}%</div>
          </div>

          <div className="mt-4 space-y-3 text-sm">
            <Row label="Started" value={t.started} />
            <Row label="Verified" value={t.verified} meta={`${todayVerifyRate}% of started`} />
            <Row label="Completed" value={t.completed} meta={`${todayCompleteRate}% of started`} />
          </div>

          <Bar label="Verified" value={t.verified} max={t.started} />
          <Bar label="Completed" value={t.completed} max={t.started} />
        </div>

        {/* TOTAL */}
        <div className="rounded-xl border bg-gray-50 p-4">
          <div className="flex items-center justify-between">
            <div className="text-sm font-semibold text-gray-900">Total</div>
            <div className="text-xs text-gray-600">Complete rate: {totalCompleteRate}%</div>
          </div>

          <div className="mt-4 space-y-3 text-sm">
            <Row label="Started" value={all.started} />
            <Row label="Verified" value={all.verified} meta={`${totalVerifyRate}% of started`} />
            <Row label="Completed" value={all.completed} meta={`${totalCompleteRate}% of started`} />
          </div>

          <Bar label="Verified" value={all.verified} max={all.started} />
          <Bar label="Completed" value={all.completed} max={all.started} />
        </div>
      </div>
    </section>
  );
}

function Row({ label, value, meta }: { label: string; value: number; meta?: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <div className="text-gray-700">{label}</div>
      <div className="flex items-baseline gap-3">
        {meta ? <div className="text-xs text-gray-500">{meta}</div> : null}
        <div className="text-base font-semibold text-gray-900 tabular-nums">{value}</div>
      </div>
    </div>
  );
}

function Bar({ label, value, max }: { label: string; value: number; max: number }) {
  const percent = max <= 0 ? 0 : Math.min(100, Math.round((value / max) * 100));
  return (
    <div className="mt-3">
      <div className="flex items-center justify-between text-xs text-gray-600">
        <span>{label}</span>
        <span className="tabular-nums">{percent}%</span>
      </div>
      <div className="mt-1 h-2 w-full rounded-full bg-white border overflow-hidden">
        <div className="h-full bg-gray-900/30" style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}
