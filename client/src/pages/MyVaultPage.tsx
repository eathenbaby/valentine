import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { motion } from "framer-motion";

type MyConfession = {
  id: string;
  shortId: string;
  vibe: string;
  shadowName: string;
  status: string;
  viewCount: number;
  department: string | null;
  createdAt: string | null;
  lastTrackedAt: string | null;
};

function formatRelative(dateStr: string | null): string {
  if (!dateStr) return "never";
  const d = new Date(dateStr);
  const diffMs = Date.now() - d.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "just now";
  if (diffMin < 60) return `${diffMin} min ago`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `${diffH} h ago`;
  const diffD = Math.floor(diffH / 24);
  return `${diffD} d ago`;
}

export default function MyVaultPage() {
  const [rows, setRows] = useState<MyConfession[]>([]);
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const init = async () => {
      if (!supabase) {
        setLoading(false);
        return;
      }
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      const fullName =
        (user.user_metadata as any)?.full_name ||
        (user.user_metadata as any)?.name ||
        user.email ||
        "Verified Student";
      setUserName(fullName);
      setUserId(user.id);
    };
    void init();
  }, []);

  useEffect(() => {
    if (!userId) return;

    let cancelled = false;

    const loadFeed = async () => {
      const res = await fetch(
        `/api/v4ult/my-confessions?authorId=${encodeURIComponent(userId)}`
      );
      if (!res.ok) return;
      const data = (await res.json()) as MyConfession[];
      if (!cancelled) {
        setRows(data);
        setLoading(false);
      }
    };

    void loadFeed();
    const interval = window.setInterval(loadFeed, 8000);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [userId]);

  return (
    <div className="min-h-screen bg-black text-neutral-100 flex items-center justify-center px-4 py-8">
      <div className="pointer-events-none fixed inset-0 mix-blend-overlay opacity-40 bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />
      <div className="relative z-10 w-full max-w-4xl border border-neutral-800 rounded-3xl bg-neutral-950/80 px-6 py-8 md:px-8 md:py-10 shadow-[0_0_120px_rgba(0,0,0,0.9)]">
        <header className="mb-6">
          <p className="text-[10px] uppercase tracking-[0.3em] text-pink-500 mb-1">
            V4ULT // MY FEED
          </p>
          <h1
            className="text-2xl md:text-3xl font-semibold tracking-tight"
            style={{
              fontFamily:
                "'Inter Tight', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
            }}
          >
            Your Secrets, Under Surveillance
          </h1>
          <p className="mt-1 text-xs text-neutral-500">
            Only you see this dashboard. Heat index is based on how often your ID is hunted on
            /reveal.
          </p>
          {userName && (
            <p className="mt-2 text-[11px] text-neutral-400">
              Logged in as <span className="text-neutral-100">{userName}</span>
            </p>
          )}
        </header>

        {loading ? (
          <div className="text-xs text-neutral-500">Loading your vault…</div>
        ) : rows.length === 0 ? (
          <div className="text-xs text-neutral-500">
            You haven&apos;t locked anything into The V4ULT yet.
          </div>
        ) : (
          <div className="mt-4 space-y-3">
            {rows.map((row) => {
              const lastTracked = row.lastTrackedAt
                ? new Date(row.lastTrackedAt)
                : null;
              const hot =
                lastTracked &&
                Date.now() - lastTracked.getTime() < 60 * 60 * 1000; // last hour

              const heatLabel = hot
                ? "Status: Being Tracked"
                : "Status: Quiet (for now)";

              const recentViewsEstimate = hot
                ? (row.viewCount % 5) + 1
                : 0;

              return (
                <motion.div
                  key={row.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="border border-neutral-800 rounded-2xl bg-neutral-900/60 px-4 py-3 flex flex-col md:flex-row md:items-center gap-3"
                >
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2 text-[11px]">
                      <span className="font-mono text-neutral-300">
                        #{row.shortId}
                      </span>
                      {row.department && (
                        <span className="inline-flex items-center rounded-full border border-cyan-500/60 bg-cyan-500/10 px-2 py-0.5 text-[9px] uppercase tracking-[0.18em] text-cyan-300">
                          {row.department}
                        </span>
                      )}
                      <span className="text-[10px] text-neutral-500">
                        {row.vibe}
                      </span>
                    </div>
                    <div className="mt-1 text-[11px] text-neutral-400">
                      Shadow: <span className="text-neutral-100">{row.shadowName}</span>
                    </div>
                    <div className="mt-1 text-[10px] text-neutral-500">
                      Locked {formatRelative(row.createdAt)} · Last tracked{" "}
                      {formatRelative(row.lastTrackedAt)}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1 text-right">
                    <div className="flex items-center gap-1">
                      {hot && (
                        <span className="inline-flex h-2 w-2 rounded-full bg-pink-500 animate-pulse" />
                      )}
                      <span
                        className={`text-[10px] uppercase tracking-[0.18em] ${
                          hot ? "text-pink-400" : "text-neutral-500"
                        }`}
                      >
                        {heatLabel}
                      </span>
                    </div>
                    <span className="text-[10px] text-neutral-400">
                      Total views: <span className="text-neutral-100">{row.viewCount}</span>
                    </span>
                    {hot && (
                      <span className="text-[10px] text-pink-400">
                        ~{recentViewsEstimate} views in last hour
                      </span>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

