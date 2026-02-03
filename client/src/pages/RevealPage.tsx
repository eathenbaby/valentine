import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

type RevealPreview = {
  shortId: string;
  vibe: string;
  viewCount: number;
  trackingCount: number;
  avatarUrl: string | null;
};

export default function RevealPage() {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<RevealPreview | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [revealed, setRevealed] = useState(false);

  const normalizedId = input.trim().toUpperCase().replace(/^#/, "");

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!normalizedId) return;

    setLoading(true);
    setNotFound(false);
    setPreview(null);
    setRevealed(false);

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
    setRevealed(true);
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8">
      <div className="relative z-10 w-full max-w-2xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-5xl font-bold gradient-text mb-2">Track a Secret 💕</h1>
          <p className="text-gray-700 text-lg">Enter the receipt code and discover who's been thinking about you</p>
        </motion.div>

        {/* Search Form */}
        <motion.form
          onSubmit={handleSearch}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass-card rounded-3xl p-6 border-4 border-pink-300 mb-8"
        >
          <label className="block text-sm font-bold text-gray-800 mb-3">Enter V4ULT ID</label>
          <div className="flex gap-3">
            <input
              className="flex-1 p-4 glass-card rounded-2xl border-4 border-pink-300 focus:border-pink-500 focus:outline-none text-lg font-mono input-glow"
              placeholder="#STC-1234"
              value={input}
              onChange={(e) => setInput(e.target.value)}
            />
            <motion.button
              type="submit"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-8 py-4 bg-gradient-to-r from-pink-400 to-pink-600 text-white font-bold rounded-full shadow-lg hover:shadow-xl disabled:opacity-50"
              disabled={loading}
            >
              {loading ? "Searching..." : "Find"}
            </motion.button>
          </div>
        </motion.form>

        {/* Not Found State */}
        <AnimatePresence>
          {notFound && (
            <motion.div
              key="notfound"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="glass-card rounded-3xl p-6 border-4 border-red-300 bg-red-50/40 text-center"
            >
              <div className="text-4xl mb-3">🔍</div>
              <p className="text-red-700 font-bold text-lg">Secret Not Found</p>
              <p className="text-red-600 text-sm mt-2">Check the ID and try again</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Preview Card */}
        <AnimatePresence>
          {preview && (
            <motion.div
              key="preview"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="space-y-6"
            >
              {/* Header Info */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center"
              >
                <div className="inline-block glass-card rounded-2xl px-4 py-2 border-2 border-pink-300">
                  <p className="text-xs font-bold text-gray-700">Receipt ID</p>
                  <p className="font-mono text-xl font-bold text-pink-600">#{preview.shortId}</p>
                </div>
              </motion.div>

              {/* Main Content */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Vibe Card */}
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 }}
                  className="glass-card rounded-3xl p-6 border-4 border-pink-300 text-center"
                >
                  <p className="text-sm font-bold text-gray-700 mb-2">The Vibe</p>
                  <p className="text-3xl font-bold text-pink-600">{preview.vibe}</p>
                </motion.div>

                {/* Tracking Count */}
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 }}
                  className="glass-card rounded-3xl p-6 border-4 border-hot-pink text-center bg-pink-50/40"
                >
                  <p className="text-sm font-bold text-gray-700 mb-2">People Tracking</p>
                  <motion.div
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ repeat: Infinity, duration: 1.5 }}
                    className="text-4xl font-bold text-pink-600"
                  >
                    {preview.trackingCount}
                  </motion.div>
                  <p className="text-xs text-gray-600 mt-2">are waiting to find out...</p>
                </motion.div>
              </div>

              {/* Heart Frame Profile */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="relative glass-card rounded-3xl p-8 border-4 border-pink-300 text-center"
              >
                {/* Heart SVG in background */}
                <svg
                  className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-pink-300 opacity-30"
                  width="120"
                  height="120"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                </svg>

                <div className="relative z-10">
                  <p className="text-sm font-bold text-gray-700 mb-4">Their Identity (Sealed)</p>

                  {/* Blurred Avatar in Heart Shape */}
                  <div className="flex justify-center mb-6">
                    <motion.div
                      initial={{ scale: 0.8 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 100 }}
                      className="relative w-32 h-32 rounded-full border-4 border-pink-400 overflow-hidden shadow-lg"
                      style={{
                        clipPath: "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)",
                      }}
                    >
                      {preview.avatarUrl ? (
                        <motion.img
                          src={preview.avatarUrl}
                          alt="Blurred profile"
                          className="w-full h-full object-cover"
                          style={{ filter: revealed ? "blur(0px)" : "blur(25px)" }}
                          animate={{ filter: revealed ? "blur(0px)" : "blur(25px)" }}
                          transition={{ duration: 0.5 }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-pink-300 to-pink-600 text-white text-5xl">
                          ?
                        </div>
                      )}
                    </motion.div>
                  </div>

                  <p className="text-xs text-gray-600 mb-6">
                    {revealed
                      ? "Identity revealed!"
                      : "Their face is sealed behind the V4ULT. Unlock to see who wrote this."}
                  </p>

                  {!revealed && (
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={handleUnlock}
                      className="px-8 py-3 bg-gradient-to-r from-hot-pink to-pink-600 text-white font-bold rounded-full shadow-lg hover:shadow-xl"
                      style={{
                        boxShadow: "0 0 20px rgba(255, 105, 180, 0.6)",
                      }}
                    >
                      💕 Unlock Identity
                    </motion.button>
                  )}

                  {revealed && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="text-pink-600 font-bold text-lg"
                    >
                      Payment sent! Check your WhatsApp for confirmation.
                    </motion.div>
                  )}
                </div>
              </motion.div>

              {/* Footer Info */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="text-center text-xs text-gray-600"
              >
                <p>📊 View count: {preview.viewCount}</p>
                <p className="mt-2 text-gray-500">Admin-only metric</p>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

