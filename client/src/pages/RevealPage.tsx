import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

type RevealPreview = {
  shortId: string;
  vibe: string;
  viewCount: number;
  avatarUrl: string | null;
};

const MIN_TRACKING = 3;
const MAX_TRACKING = 12;

export default function RevealPage() {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<RevealPreview | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [trackingCount, setTrackingCount] = useState<number | null>(null);

  const normalizedId = input.trim().toUpperCase().replace(/^#/, "");

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!normalizedId) return;

    setLoading(true);
    setNotFound(false);
    setPreview(null);
    setTrackingCount(null);

    try {
      const res = await fetch(`/api/v4ult/reveal/${encodeURIComponent(normalizedId)}`);
      if (res.status === 404) {
        setNotFound(true);
        return;
      }
      if (!res.ok) {
        return;
      }
      const data = (await res.json()) as RevealPreview;
      setPreview(data);
      const fakeCount =
        Math.floor(Math.random() * (MAX_TRACKING - MIN_TRACKING + 1)) + MIN_TRACKING;
      setTrackingCount(fakeCount);
    } finally {
      setLoading(false);
    }
  };

  const handleUnlock = () => {
    const phone = import.meta.env.VITE_V4ULT_WHATSAPP_NUMBER as string | undefined;
    const id = preview?.shortId ?? normalizedId;
    const text = encodeURIComponent(
      `I want to unlock #${id}. Sending payment screenshot now.`
    );
    const base = phone ? `https://wa.me/${phone}` : "https://wa.me/";
    window.open(`${base}?text=${text}`, "_blank");
  };

  return (
    <div className="min-h-screen bg-black text-neutral-100 flex items-center justify-center px-4">
      <div className="pointer-events-none fixed inset-0 mix-blend-overlay opacity-40 bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />

      <div className="relative z-10 w-full max-w-xl border border-neutral-800 rounded-3xl bg-neutral-950/80 px-6 py-8 md:px-8 md:py-10 shadow-[0_0_120px_rgba(0,0,0,0.9)]">
        <header className="mb-6">
          <p className="text-[10px] uppercase tracking-[0.3em] text-pink-500 mb-1">
            V4ULT // REVEAL TERMINAL
          </p>
          <h1
            className="text-2xl md:text-3xl font-semibold tracking-tight"
            style={{
              fontFamily:
                "'Inter Tight', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
            }}
          >
            Track a Secret by ID
          </h1>
          <p className="mt-1 text-xs text-neutral-500">
            Enter the receipt code you got after submitting. No bots. No fake hints. Just heat.
          </p>
        </header>

        <form onSubmit={handleSearch} className="space-y-3 mb-6">
          <label className="text-[10px] uppercase tracking-[0.25em] text-neutral-400">
            V4ULT ID
          </label>
          <div className="flex gap-2">
            <input
              className="flex-1 bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-sm outline-none focus:border-pink-500 focus:ring-0 font-mono"
              placeholder="#STC-XXXX"
              value={input}
              onChange={(e) => setInput(e.target.value)}
            />
            <motion.button
              type="submit"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="px-4 py-2 rounded-full bg-pink-600 hover:bg-pink-500 border border-pink-400 text-black text-xs uppercase tracking-[0.22em] shadow-[0_0_40px_rgba(255,45,85,0.8)]"
            >
              {loading ? "SCANNING…" : "SCAN"}
            </motion.button>
          </div>
        </form>

        <AnimatePresence mode="wait">
          {notFound && (
            <motion.div
              key="notfound"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="text-xs text-red-400"
            >
              No such secret in The V4ULT. Check the ID and try again.
            </motion.div>
          )}

          {preview && (
            <motion.div
              key="preview"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-5 mt-2"
            >
              <div className="flex items-center justify-between text-[11px] text-neutral-400">
                <span>
                  ID:&nbsp;
                  <span className="font-mono text-neutral-100">#{preview.shortId}</span>
                </span>
                {typeof trackingCount === "number" && (
                  <span className="text-pink-400">
                    {trackingCount} students are currently tracking this secret.
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-[1.5fr_2fr] gap-4 items-stretch">
                {/* Vibe icon / card */}
                <div className="flex flex-col gap-3">
                  <div className="relative rounded-2xl border border-pink-500/70 bg-gradient-to-br from-pink-600 via-fuchsia-600 to-emerald-500 p-3 shadow-[0_0_40px_rgba(236,72,153,0.8)]">
                    <div className="absolute inset-0 mix-blend-overlay opacity-60 bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />
                    <div className="relative z-10 text-[11px] uppercase tracking-[0.2em] text-black">
                      Vibe
                    </div>
                    <div className="relative z-10 mt-2 text-sm font-semibold text-black">
                      {preview.vibe}
                    </div>
                  </div>
                </div>

                {/* Blurred profile */}
                <div className="relative rounded-2xl border border-neutral-800 bg-neutral-900/80 p-4 overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-pink-600/20 via-transparent to-emerald-500/20" />
                  <div className="absolute inset-0 backdrop-blur-2xl" />
                  <div className="relative z-10 flex flex-col items-center gap-3">
                    <div className="w-20 h-20 rounded-full border border-pink-500/60 overflow-hidden bg-neutral-800/80">
                      {preview.avatarUrl ? (
                        <div className="w-full h-full overflow-hidden">
                          <img
                            src={preview.avatarUrl}
                            alt="Blurred profile"
                            className="w-full h-full object-cover"
                            style={{ filter: "blur(20px)" }}
                          />
                        </div>
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[24px] text-neutral-500">
                          ?
                        </div>
                      )}
                    </div>
                    <p className="text-[11px] text-neutral-300 text-center">
                      Their identity is sealed behind the V4ULT. Unlock to see the face behind the
                      confession.
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-3 flex flex-col sm:flex-row items-center justify-between gap-3">
                <span className="text-[10px] text-neutral-500">
                  View count: <span className="text-neutral-200">{preview.viewCount}</span>{" "}
                  (admin-only metric)
                </span>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleUnlock}
                  className="w-full sm:w-auto px-5 py-2 rounded-full bg-emerald-500 hover:bg-emerald-400 text-black text-xs uppercase tracking-[0.22em] border border-emerald-300 shadow-[0_0_40px_rgba(16,185,129,0.8)]"
                >
                  Unlock Identity (WhatsApp)
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

