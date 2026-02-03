import { useEffect, useState, useRef } from "react";
import { Link } from "wouter";
import { motion } from "framer-motion";

type AdminConfessionRow = {
  id: string;
  shortId: string;
  senderRealName: string;
  targetCrushName: string;
  body: string;
  vibe: string;
  shadowName: string;
  status: string;
  viewCount: number;
  validationScore: number;
  toxicityScore: number;
  toxicityFlagged: boolean;
  department: string | null;
  createdAt: string | null;
  paymentStatus?: string | null;
  paymentRef?: string | null;
  revealCount?: number | null;
  senderSocial?: string | null;
};

export default function V4ultAdminPage() {
  const [rows, setRows] = useState<AdminConfessionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [paymentRefs, setPaymentRefs] = useState<Record<string, string>>({});

  const loadData = async () => {
    try {
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
    } catch (error) {
      console.error("Failed to load confessions:", error);
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
    // Poll every 10 seconds for new confessions
    const interval = setInterval(() => void loadData(), 10000);
    return () => clearInterval(interval);
  }, []);

  const handleStatusUpdate = async (id: string, newStatus: string) => {
    if (!window.confirm(`Mark confession as "${newStatus}"?`)) return;

    setUpdating(id);
    try {
      const res = await fetch(`/api/v4ult/admin/confessions/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-v4ult-admin-token": import.meta.env.VITE_V4ULT_ADMIN_TOKEN as string,
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (res.ok) {
        setRows((prev) =>
          prev.map((row) => (row.id === id ? { ...row, status: newStatus } : row))
        );
      }
    } catch (error) {
      console.error("Failed to update status:", error);
    } finally {
      setUpdating(null);
    }
  };

  const handleMarkPaid = async (id: string) => {
    const paymentRef = paymentRefs[id] || "";
    if (!paymentRef) {
      alert("Please enter a payment reference before marking paid.");
      return;
    }
    if (!window.confirm(`Mark confession ${id} as PAID with ref ${paymentRef}?`)) return;

    setUpdating(id);
    try {
      const res = await fetch(`/api/v4ult/admin/confessions/${id}/mark-paid`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-v4ult-admin-token": import.meta.env.VITE_V4ULT_ADMIN_TOKEN as string,
        },
        body: JSON.stringify({ paymentRef }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        alert(err.message || "Failed to mark paid");
        return;
      }

      const data = await res.json();
      // Update local rows with new payment status
      setRows((prev) => prev.map((r) => (r.id === id ? { ...r, paymentStatus: "paid", paymentRef } : r)));
      alert("Marked as paid");
    } catch (error) {
      console.error("Failed to mark paid:", error);
      alert("Failed to mark paid");
    } finally {
      setUpdating(null);
    }
  };

  return (
    <div className="min-h-screen bg-black text-neutral-100 px-4 py-6 md:px-10 md:py-10">
      {/* Hidden IG canvas used for exporting posts */}
      <div
        id="ig-export-canvas"
        ref={(el) => {
          /* kept as DOM node for html-to-image rendering; positioned offscreen */
        }}
        style={{
          position: "absolute",
          left: -9999,
          top: -9999,
          width: 1080,
          height: 1080,
          padding: 40,
          boxSizing: "border-box",
          background: "#0b0b0b",
          color: "#fff",
        }}
      >
        <div id="ig-template" style={{ width: 1080, height: 1080, position: "relative", boxSizing: "border-box", padding: 80, background: "linear-gradient(145deg,#fff5f7,#ffe4e8)" }}>
          <style>{`
            @import url('https://fonts.googleapis.com/css2?family=Fredoka:wght@400;600&family=Pacifico&display=swap');
            .coquette-card{ width:920px; height:920px; background: linear-gradient(145deg, #fff5f7, #ffe4e8); color:#3b1038; padding:48px; box-sizing:border-box; font-family: 'Fredoka', 'Arial', sans-serif; position:relative; overflow:hidden; border:5px solid #ffb7c5; border-radius:40px; box-shadow: 0 20px 40px rgba(255, 182, 197, 0.3); }
            .post-vibe{ position:absolute; left:56px; top:56px; font-size:84px; transform:translateY(4px); }
            .speech-bubble{ position:absolute; left:56px; right:56px; top:180px; bottom:140px; background:rgba(255,255,255,0.9); border-radius:30px; padding:32px; color:#6b2744; font-size:36px; line-height:1.25; box-shadow: 0 12px 30px rgba(107,39,68,0.06); overflow:hidden; font-family: 'Fredoka', sans-serif; }
            .watermark{ position:absolute; right:56px; bottom:56px; font-size:18px; opacity:0.95; font-family: 'Pacifico', cursive; color:#a13b63 }
            .heart-seal{ position:absolute; right:56px; top:56px; background: linear-gradient(180deg,#ffd6e0,#ffb7c5); color:#6b2744; padding:8px 14px; font-size:13px; border-radius:999px; box-shadow: 0 8px 24px rgba(255,182,197,0.18); display:flex; align-items:center; gap:8px; font-weight:600 }
            .glossy-shine{ position:absolute; left:0; top:0; width:100%; height:100%; pointer-events:none; background: linear-gradient(135deg, rgba(255,255,255,0.42) 0%, rgba(255,255,255,0) 50%); mix-blend-mode:screen; opacity:0.9; border-radius:40px }
            .hearts-pattern{ position:absolute; inset:0; background-image: radial-gradient(circle at 10% 20%, rgba(255,183,197,0.08) 6%, transparent 7%), radial-gradient(circle at 40% 80%, rgba(255,199,208,0.06) 6%, transparent 7%), radial-gradient(circle at 80% 30%, rgba(255,183,197,0.05) 6%, transparent 7%); pointer-events:none; }
          `}</style>

          <div className="coquette-card" id="post-card">
            <div className="hearts-pattern" />
            <div id="post-vibe" className="post-vibe">🎀</div>
            <div id="post-message" className="speech-bubble">"..."</div>
            <div className="heart-seal">💗 Verified Identity</div>
            <div className="watermark">✨ @stcp_matrimony ✨</div>
            <div className="glossy-shine" />
          </div>
        </div>
      </div>
      <div className="pointer-events-none fixed inset-0 mix-blend-overlay opacity-40 bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />

      <div className="relative z-10 max-w-7xl mx-auto">
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
              {rows.length} secret{rows.length !== 1 ? 's' : ''} in V4ULT • Review & post to IG
            </p>
          </div>
          <button
            onClick={() => void loadData()}
            className="px-3 py-1 text-xs uppercase tracking-[0.18em] border border-pink-500/60 bg-pink-500/10 text-pink-300 rounded-full hover:bg-pink-500/20"
          >
            {loading ? "Refreshing…" : "Refresh"}
          </button>
        </header>

        <div className="border border-neutral-800 rounded-3xl bg-neutral-950/80 shadow-[0_0_80px_rgba(0,0,0,0.9)] overflow-hidden">
          <div className="px-4 py-3 border-b border-neutral-800 grid grid-cols-12 gap-2 text-[11px] uppercase tracking-[0.18em] text-neutral-500 overflow-x-auto">
            <div className="col-span-1">Heat</div>
            <div className="col-span-1">ID</div>
            <div className="col-span-2">Sender | Crush</div>
            <div className="col-span-3">Confession Preview</div>
            <div className="col-span-1">Vibe</div>
            <div className="col-span-1">Score</div>
            <div className="col-span-1">Status</div>
            <div className="col-span-2">Actions</div>
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
            <div className="divide-y divide-neutral-900 max-h-[calc(100vh-300px)] overflow-y-auto">
              {rows.map((row) => (
                <motion.div
                  key={row.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="px-4 py-3 grid grid-cols-12 gap-2 items-center text-xs hover:bg-neutral-900/50 transition"
                >
                  {/* Heat */}
                  <div className="col-span-1">
                    <span className="inline-flex items-center justify-center rounded-full border border-pink-500/60 bg-pink-500/10 px-1 py-0.5 text-[10px] text-pink-400">
                      {row.viewCount} 👀
                    </span>
                  </div>

                  {/* ID */}
                  <div className="col-span-1 font-mono text-[11px] text-neutral-300">
                    #{row.shortId}
                  </div>

                  {/* Sender | Crush */}
                  <div className="col-span-2 flex flex-col gap-1 truncate">
                    <div className="text-[10px] text-neutral-200 truncate">
                      <strong>{row.senderRealName}</strong>
                    </div>
                    <div className="text-[10px] text-pink-400 truncate">
                      → {row.targetCrushName}
                    </div>
                  </div>

                  {/* Confession Preview */}
                  <div className="col-span-3 text-[10px] text-neutral-400 truncate">
                    "{row.body.substring(0, 50)}…"
                  </div>

                  {/* Vibe */}
                  <div className="col-span-1 text-[10px]">
                    {row.vibe}
                  </div>

                  {/* Validation Score */}
                  <div className="col-span-1 text-center">
                    <span className={`text-[10px] font-bold ${row.validationScore >= 80 ? 'text-green-500' :
                      row.validationScore >= 60 ? 'text-yellow-600' : 'text-red-600'
                      }`}>
                      {row.validationScore}%
                    </span>
                    {row.toxicityFlagged && (
                      <div className="text-[9px] text-red-500">⚠️ Flagged</div>
                    )}
                  </div>

                  {/* Status */}
                  <div className="col-span-1">
                    <div className="flex flex-col gap-1">
                      <select
                        value={row.status}
                        onChange={(e) => handleStatusUpdate(row.id, e.target.value)}
                        disabled={updating === row.id}
                        className="bg-neutral-900 border border-neutral-700 rounded px-1.5 py-0.5 text-[10px] text-neutral-200 focus:border-pink-500 outline-none"
                      >
                        <option value="pending">Pending</option>
                        <option value="approved">Approved</option>
                        <option value="posted">Posted</option>
                        <option value="revealed">Revealed</option>
                        <option value="rejected">Rejected</option>
                      </select>

                      <div className="text-[10px]">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] ${row.paymentStatus === 'paid' ? 'bg-green-600 text-white' : row.paymentStatus === 'pending' ? 'bg-yellow-600 text-white' : 'bg-neutral-800 text-neutral-300'}`}>
                          {row.paymentStatus ?? 'unpaid'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="col-span-2 flex gap-1 justify-end">
                    <Link href={`/admin/export/${row.shortId}`}>
                      <a className="inline-flex items-center justify-center rounded-full border border-cyan-500/70 bg-cyan-500/10 px-2 py-0.5 text-[10px] uppercase tracking-[0.1em] text-cyan-300 hover:bg-cyan-500/20">
                        Story
                      </a>
                    </Link>
                    <div className="flex items-center gap-2">
                      <input
                        value={paymentRefs[row.id] ?? row.paymentRef ?? ''}
                        onChange={(e) => setPaymentRefs((p) => ({ ...p, [row.id]: e.target.value }))}
                        placeholder="Txn ref"
                        className="bg-neutral-900 border border-neutral-700 rounded px-2 py-1 text-[10px] text-neutral-200"
                      />
                      <button
                        onClick={() => void handleMarkPaid(row.id)}
                        disabled={updating === row.id || row.paymentStatus === 'paid'}
                        className="inline-flex items-center justify-center rounded-full border border-emerald-500/70 bg-emerald-500/10 px-2 py-0.5 text-[10px] uppercase tracking-[0.1em] text-emerald-300 hover:bg-emerald-500/20"
                      >
                        {row.paymentStatus === 'paid' ? 'Paid' : 'Mark Paid'}
                      </button>
                    </div>
                    <button
                      onClick={() => void (async () => {
                        try {
                          // populate template
                          const tpl = document.getElementById('ig-template');
                          if (!tpl) return alert('Template not available');
                          const msg = tpl.querySelector('#post-message');
                          const vibe = tpl.querySelector('#post-vibe');
                          if (msg) msg.textContent = row.body || '';
                          if (vibe) vibe.textContent = row.vibe || '☕';

                          // ensure webfont is loaded before capture
                          try {
                            if ((document as any).fonts && (document as any).fonts.ready) {
                              await (document as any).fonts.ready;
                            }
                          } catch (e) {
                            // ignore font loading issues
                          }
                          // small delay to allow layout to settle
                          await new Promise((r) => setTimeout(r, 120));

                          // dynamic import to avoid bundling issues
                          const mod = await import('html-to-image');
                          const toPng = mod.toPng || (mod as any).default?.toPng || mod.default;
                          const node = document.getElementById('post-card') || document.getElementById('ig-template');
                          if (!node) return alert('Failed to locate template');
                          const dataUrl = await toPng(node as HTMLElement, { width: 1080, height: 1080, backgroundColor: '#0b0b0b' });
                          const a = document.createElement('a');
                          a.href = dataUrl;
                          a.download = `${row.shortId || 'v4ult'}-post.png`;
                          document.body.appendChild(a);
                          a.click();
                          a.remove();
                        } catch (err) {
                          console.error('Failed to generate image', err);
                          alert('Failed to generate image');
                        }
                      })()}
                      className="inline-flex items-center justify-center rounded-full border border-yellow-500/70 bg-yellow-500/10 px-2 py-0.5 text-[10px] uppercase tracking-[0.1em] text-yellow-300 hover:bg-yellow-500/20"
                    >
                      Download for IG
                    </button>
                    <button
                      onClick={() => {
                        if (window.confirm(`Delete ${row.senderRealName}'s confession?`)) {
                          // TODO: Implement delete
                        }
                      }}
                      className="inline-flex items-center justify-center rounded-full border border-red-500/70 bg-red-500/10 px-2 py-0.5 text-[10px] uppercase tracking-[0.1em] text-red-300 hover:bg-red-500/20"
                    >
                      Del
                    </button>
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

