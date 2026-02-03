import { useEffect, useRef, useState } from "react";
import { useRoute, Link } from "wouter";
import { motion } from "framer-motion";
import type { toPng as ToPngType } from "html-to-image";

type ExportConfession = {
  shortId: string;
  body: string;
  vibe: string;
  shadowName: string;
  fullName: string | null;
};

export default function AdminExportStoryPage() {
  const [, params] = useRoute("/admin/export/:shortId");
  const shortId = params?.shortId || "";
  const [data, setData] = useState<ExportConfession | null>(null);
  const [loading, setLoading] = useState(true);
  const storyRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const load = async () => {
      const res = await fetch(`/api/v4ult/admin/confessions/${shortId}`, {
        headers: {
          "x-v4ult-admin-token": import.meta.env.VITE_V4ULT_ADMIN_TOKEN as string,
        },
      });
      if (!res.ok) {
        setLoading(false);
        return;
      }
      const json = await res.json();
      setData({
        shortId: json.shortId,
        body: json.body,
        vibe: json.vibe,
        shadowName: json.shadowName,
        fullName: json.fullName,
      });
      setLoading(false);
    };
    if (shortId) void load();
  }, [shortId]);

  const handleDownload = async () => {
    if (!storyRef.current) return;
    try {
      const { toPng } = await import("html-to-image");
      const dataUrl = await toPng(storyRef.current, {
        cacheBust: true,
        width: 1080,
        height: 1920,
      });
      const link = document.createElement("a");
      link.href = dataUrl;
      link.download = `${data?.shortId ?? "v4ult-story"}.png`;
      link.click();
    } catch (err) {
      console.error("Failed to export story image", err);
    }
  };

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center py-6">
      <div className="mb-4 w-full max-w-4xl flex items-center justify-between px-4 text-xs text-neutral-400">
        <Link href="/v4ult-admin">
          <a className="uppercase tracking-[0.18em] hover:text-pink-400">
            ← Back to Factory
          </a>
        </Link>
        <span className="uppercase tracking-[0.18em] text-pink-500">
          V4ULT // Story Export
        </span>
        <button
          onClick={handleDownload}
          className="px-3 py-1 rounded-full border border-pink-500/60 bg-pink-500/10 text-pink-300 uppercase tracking-[0.18em] text-[10px] shadow-[0_0_22px_rgba(255,45,85,0.7)]"
        >
          Download PNG
        </button>
      </div>

      <div className="pointer-events-none fixed inset-0 mix-blend-overlay opacity-40 bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />

      <motion.div
        ref={storyRef}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 w-[360px] h-[640px] md:w-[405px] md:h-[720px] lg:w-[432px] lg:h-[768px] aspect-[9/16] bg-[#050505] rounded-[32px] border border-neutral-800 overflow-hidden shadow-[0_0_120px_rgba(0,0,0,0.9)]"
        style={{
          backgroundImage:
            "radial-gradient(circle at top, rgba(255,45,85,0.18), transparent 60%), radial-gradient(circle at bottom, rgba(34,197,235,0.2), transparent 55%)",
        }}
      >
        {/* Noise overlay */}
        <div className="absolute inset-0 mix-blend-overlay opacity-50 bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />

        {/* Frame */}
        <div className="relative z-10 flex flex-col h-full px-6 py-6">
          <header className="flex items-center justify-between text-[10px] uppercase tracking-[0.2em] text-neutral-400 mb-6">
            <span>V4ULT // STC</span>
            <span className="text-pink-400">{data?.vibe ?? (loading ? "Loading…" : "—")}</span>
          </header>

          <main className="flex-1 flex items-center">
            <p
              className="text-[15px] leading-relaxed text-neutral-100"
              style={{
                fontFamily:
                  "Georgia, 'Times New Roman', ui-serif, system-ui, -apple-system",
              }}
            >
              {loading
                ? "Compiling secret..."
                : data?.body ?? "No confession text available."}
            </p>
          </main>

          <footer className="mt-6 text-[10px] uppercase tracking-[0.2em] text-neutral-500">
            <div className="flex items-center justify-between">
              <span>
                Reveal Status: <span className="text-red-400">Locked</span>
              </span>
              <span>
                ID:&nbsp;
                <span className="text-neutral-200">
                  #{data?.shortId ?? shortId}
                </span>
              </span>
            </div>
            <div className="mt-2 text-[9px] text-neutral-600">
              Shadow: {data?.shadowName ?? "—"}
            </div>
          </footer>
        </div>
      </motion.div>
    </div>
  );
}

