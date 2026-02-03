import { useEffect, useState } from "react";
import { Link } from "wouter";
import { motion } from "framer-motion";

type AdminConfessionRow = {
  id: string;
  shortId: string;
  vibe: string;
  shadowName: string;
  status: string;
  viewCount: number;
  createdAt: string | null;
  department: string | null;
  fullName: string | null;
};

export default function V4ultAdminPage() {
  const [rows, setRows] = useState<AdminConfessionRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const res = await fetch("/api/v4ult/admin/confessions", {
        headers: {
          "x-v4ult-admin-token": import.meta.env.VITE_V4ULT_ADMIN_TOKEN as string,
        },
      });
      if (!res.ok) {
        setLoading(false);
        return;
      }
      const data = (await res.json()) as AdminConfessionRow[];
      setRows(data);
      setLoading(false);
    };
    void load();
  }, []);

  return (
    <div className="min-h-screen bg-black text-neutral-100 px-4 py-6 md:px-10 md:py-10">
      <div className="pointer-events-none fixed inset-0 mix-blend-overlay opacity-40 bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />

      <div className="relative z-10 max-w-5xl mx-auto">
        <header className="mb-8 flex items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-pink-500 mb-1">
              V4ULT // STC
            </p>
            <h1
              className="text-2xl md:text-3xl font-semibold tracking-tight"
              style={{
                fontFamily:
                  "'Inter Tight', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
              }}
            >
              Admin Content Factory
            </h1>
            <p className="mt-1 text-xs text-neutral-500">
              Highest curiosity secrets rise to the top. Post the heaviest ones first.
            </p>
          </div>
        </header>

        <div className="border border-neutral-800 rounded-3xl bg-neutral-950/80 shadow-[0_0_80px_rgba(0,0,0,0.9)] overflow-hidden">
          <div className="px-4 py-3 border-b border-neutral-800 flex text-[11px] uppercase tracking-[0.18em] text-neutral-500">
            <div className="w-24">Heat</div>
            <div className="w-32">ID</div>
            <div className="flex-1">Shadow / Real</div>
            <div className="w-32">Vibe</div>
            <div className="w-28 text-right">Status</div>
            <div className="w-32 text-right">Export</div>
          </div>

          {loading ? (
            <div className="px-4 py-10 text-center text-xs text-neutral-500">
              Loading secrets…
            </div>
          ) : rows.length === 0 ? (
            <div className="px-4 py-10 text-center text-xs text-neutral-500">
              No entries in The V4ULT yet.
            </div>
          ) : (
            <div className="divide-y divide-neutral-900">
              {rows.map((row) => (
                <motion.div
                  key={row.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="px-4 py-3 flex items-center text-xs"
                >
                  <div className="w-24">
                    <span className="inline-flex items-center justify-center rounded-full border border-pink-500/60 bg-pink-500/10 px-2 py-0.5 text-[10px] tracking-[0.16em] text-pink-400 shadow-[0_0_20px_rgba(255,45,85,0.6)]">
                      {row.viewCount ?? 0} views
                    </span>
                  </div>
                  <div className="w-32 font-mono text-[11px] text-neutral-300">
                    #{row.shortId}
                  </div>
                  <div className="flex-1 flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-neutral-100">
                        {row.shadowName}
                      </span>
                      <span className="inline-flex items-center rounded-full border border-red-500/70 bg-red-900/40 px-2 py-0.5 text-[9px] uppercase tracking-[0.18em] text-red-200 shadow-[0_0_20px_rgba(239,68,68,0.7)]">
                        {row.fullName ?? "Unknown"}
                      </span>
                    </div>
                    <span className="text-[10px] text-neutral-500">
                      {row.createdAt
                        ? new Date(row.createdAt).toLocaleString()
                        : "—"}
                    </span>
                  </div>
                  <div className="w-32 text-[11px] text-neutral-300">
                    {row.vibe}
                  </div>
                  <div className="w-28 text-right">
                    <span className="inline-flex items-center justify-end text-[10px] uppercase tracking-[0.18em] text-neutral-400">
                      {row.status}
                    </span>
                  </div>
                  <div className="w-32 text-right">
                    <Link href={`/admin/export/${row.shortId}`}>
                      <a className="inline-flex items-center justify-center rounded-full border border-cyan-500/70 bg-cyan-500/10 px-3 py-1 text-[10px] uppercase tracking-[0.18em] text-cyan-300 shadow-[0_0_22px_rgba(34,211,238,0.7)] hover:bg-cyan-500/20">
                        Story
                      </a>
                    </Link>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

