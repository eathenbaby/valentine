import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";
import { useMutation } from "@tanstack/react-query";

const VIBES = [
  { id: "coffee", label: "☕ Coffee", desc: "A cup of coffee together" },
  { id: "movie", label: "🎬 Movie Night", desc: "A movie with you" },
  { id: "late-night", label: "🌙 Late Night Study", desc: "3AM vibes" },
  { id: "one-got-away", label: "💔 The One That Got Away", desc: "Could've been..." },
  { id: "chaos-love", label: "🎪 Chaos Love", desc: "Beautiful chaos" },
];

const DEPARTMENTS = [
  "Physics", "Chemistry", "Biology", "Mathematics",
  "Commerce", "Economics", "Management", "Psychology",
  "English", "History", "Philosophy", "Other"
];

export default function VaultSubmitPage() {
  const [, setLocation] = useLocation();
  const [loadingUser, setLoadingUser] = useState(true);
  const [userFullName, setUserFullName] = useState<string | null>(null);
  const [shadowName, setShadowName] = useState("");
  const [selectedVibe, setSelectedVibe] = useState<VibeOption | null>(null);
  const [body, setBody] = useState("");
  const [department, setDepartment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submittedId, setSubmittedId] = useState<string | null>(null);
  const [shredded, setShredded] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const init = async () => {
      if (!supabase) {
        setLoadingUser(false);
        return;
      }
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!isMounted) return;

      if (!user) {
        setLocation("/v4ult-login");
        return;
      }

      const fullName =
        (user.user_metadata as any)?.full_name ||
        (user.user_metadata as any)?.name ||
        user.email ||
        "Verified Student";

      setUserFullName(fullName);
      setLoadingUser(false);
    };

    void init();

    return () => {
      isMounted = false;
    };
  }, [setLocation]);

  const handleOAuth = async () => {
    if (!supabase) return;
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: window.location.origin + "/vault-submit",
      },
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVibe || !body.trim() || !shadowName.trim()) return;

    try {
      setSubmitting(true);
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setLocation("/v4ult-login");
        return;
      }

      const res = await fetch("/api/v4ult/confessions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          supabaseUserId: user.id,
          fullName:
            (user.user_metadata as any)?.full_name ||
            (user.user_metadata as any)?.name ||
            user.email,
          avatarUrl: (user.user_metadata as any)?.avatar_url ?? null,
          vibe: selectedVibe.id,
          shadowName,
          body,
          department: department || null,
        }),
      });

      if (!res.ok) {
        console.error("Failed to submit confession to V4ULT");
        return;
      }

      const data = await res.json();
      setSubmittedId(data.shortId as string);

      // Trigger shredder animation: slide + fade textarea, then clear it
      setShredded(true);
      if (window.navigator && "vibrate" in window.navigator) {
        window.navigator.vibrate(30);
      }
      setTimeout(() => {
        setBody("");
      }, 400);
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-pink-400 font-mono">
        <span className="animate-pulse tracking-[0.25em] text-xs uppercase">
          Booting V4ULT…
        </span>
      </div>
    );
  }

  if (!supabase) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-black text-pink-400 font-mono p-6 text-center">
        <p className="mb-4 text-lg">V4ULT auth is offline.</p>
        <p className="text-sm text-neutral-400">
          Set <code>VITE_SUPABASE_URL</code> and <code>VITE_SUPABASE_ANON_KEY</code> in your
          environment to enable verified mystery.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-black text-neutral-100 flex items-center justify-center relative overflow-hidden">
      <div className="pointer-events-none fixed inset-0 mix-blend-overlay opacity-40 bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />

      <motion.div
        initial={{ opacity: 0, y: 32 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 w-full max-w-3xl border border-neutral-800 bg-neutral-950/80 rounded-3xl px-6 py-8 md:px-10 md:py-10 shadow-[0_0_120px_rgba(255,45,85,0.35)]"
        style={{ fontFamily: "'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace" }}
      >
        <header className="flex items-center justify-between gap-4 mb-8">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-pink-500 mb-1">
              STC CONFIDENTIAL ENGINE
            </p>
            <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">
              The V4ULT Intake Terminal
            </h1>
          </div>
          <div className="flex flex-col items-end gap-1">
            <span className="text-[10px] uppercase tracking-[0.2em] text-neutral-500">
              Logged in as
            </span>
            <span className="text-xs text-neutral-100 max-w-[10rem] text-right line-clamp-2">
              {userFullName}
            </span>
            <Button
              variant="outline"
              size="xs"
              className="mt-1 border-pink-500/40 text-[10px] uppercase tracking-[0.2em] bg-neutral-950/60 hover:bg-pink-500/10"
              onClick={handleOAuth}
            >
              Re-auth Google
            </Button>
          </div>
        </header>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Vibe grid */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xs uppercase tracking-[0.25em] text-neutral-400">
                Pick your market
              </h2>
              <span className="text-[10px] text-neutral-500">
                {selectedVibe ? selectedVibe.label : "No vibe selected"}
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {VIBES.map((vibe) => (
                <motion.button
                  key={vibe.id}
                  type="button"
                  onClick={() => setSelectedVibe(vibe)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={`relative flex flex-col items-start gap-1 border text-left px-4 py-3 rounded-2xl bg-neutral-950/70 transition-shadow ${selectedVibe?.id === vibe.id
                      ? "border-pink-500 shadow-[0_0_40px_rgba(255,45,85,0.45)]"
                      : "border-neutral-800 hover:border-pink-500/60 hover:shadow-[0_0_24px_rgba(255,45,85,0.25)]"
                    }`}
                >
                  <span className="text-xs font-semibold tracking-[0.16em] uppercase text-pink-400">
                    {vibe.label}
                  </span>
                  <p className="text-[11px] text-neutral-400 leading-snug">
                    {vibe.description}
                  </p>
                </motion.button>
              ))}
            </div>
          </section>

          {/* Shadow name + department */}
          <section className="space-y-3">
            <div className="space-y-2">
              <label className="block text-xs uppercase tracking-[0.25em] text-neutral-400">
                Shadow Name
              </label>
              <input
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-sm outline-none focus:border-pink-500 focus:ring-0 font-mono"
                placeholder='eg. "The Econ Lab Ghost"'
                value={shadowName}
                onChange={(e) => setShadowName(e.target.value)}
              />
              <p className="text-[10px] text-neutral-500">
                This is what STC will see on IG. Your legal name never leaves the V4ULT.
              </p>
            </div>

            <div className="space-y-2">
              <label className="block text-xs uppercase tracking-[0.25em] text-neutral-400">
                Department Tag
              </label>
              <select
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-sm outline-none focus:border-pink-500 focus:ring-0 font-mono"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
              >
                <option value="">Select department (optional)</option>
                <option value="Physics">Physics</option>
                <option value="Commerce">Commerce</option>
                <option value="Computer Science">Computer Science</option>
                <option value="English">English</option>
                <option value="Maths">Maths</option>
                <option value="Biology">Biology</option>
                <option value="Management">Management</option>
              </select>
              <p className="text-[10px] text-neutral-500">
                Lets us post \"New secret from the {department || "____"} Dept\" and shrink the suspect
                pool.
              </p>
            </div>
          </section>

          {/* Confession body + shredder animation */}
          <section className="space-y-2">
            <label className="block text-xs uppercase tracking-[0.25em] text-neutral-400">
              Confession Payload
            </label>
            <div className="relative overflow-hidden">
              <AnimatePresence>
                {!shredded && (
                  <motion.div
                    key="textarea"
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 40 }}
                    transition={{ duration: 0.35 }}
                  >
                    <Textarea
                      value={body}
                      onChange={(e) => setBody(e.target.value)}
                      placeholder="Type the thing you’d never say in the canteen..."
                      className="min-h-[200px] bg-neutral-950 border border-neutral-800 rounded-2xl text-sm leading-relaxed text-neutral-100 outline-none focus:border-pink-500 focus:ring-0 resize-y font-mono"
                      style={{
                        fontFamily:
                          "'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
                      }}
                      maxLength={1200}
                    />
                    <div className="absolute bottom-2 right-3 text-[10px] text-neutral-500">
                      {body.length} / 1200
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
              {shredded && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="mt-4 flex flex-col items-center justify-center py-10 gap-2"
                >
                  <svg
                    width="64"
                    height="64"
                    viewBox="0 0 64 64"
                    className="text-pink-500 mb-2"
                  >
                    <motion.circle
                      cx="32"
                      cy="32"
                      r="20"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: 1 }}
                      transition={{ duration: 0.6 }}
                    />
                    <motion.path
                      d="M22 32h20"
                      stroke="currentColor"
                      strokeWidth="3"
                      strokeLinecap="round"
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: 1 }}
                      transition={{ duration: 0.4, delay: 0.2 }}
                    />
                  </svg>
                  <p className="text-[11px] uppercase tracking-[0.22em] text-neutral-400">
                    Vault Locked
                  </p>
                </motion.div>
              )}
            </div>
            <p className="text-[10px] text-neutral-500">
              Vibes only. No slurs, no doxxing, no staff harassment. The V4ULT is ruthless, not
              reckless.
            </p>
          </section>

          <section className="flex items-center justify-between gap-4 pt-2">
            <div className="flex flex-col gap-1 text-[10px] text-neutral-500">
              <span>Submissions are fingerprinted to your STC identity via OAuth.</span>
              <span className="text-green-500">
                VERIFIED MYSTERY ENABLED
              </span>
            </div>
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button
                type="submit"
                disabled={submitting || !selectedVibe || !shadowName.trim() || !body.trim()}
                className="relative overflow-hidden bg-pink-600 hover:bg-pink-500 text-black font-semibold px-6 py-2 rounded-full text-xs uppercase tracking-[0.22em] border border-pink-400 shadow-[0_0_45px_rgba(255,45,85,0.7)]"
              >
                {submitting ? "LOCKING V4ULT…" : "SEND TO V4ULT"}
              </Button>
            </motion.div>
          </section>
        </form>

        <AnimatePresence>
          {submittedId && (
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 24 }}
              className="mt-8 border border-green-500/40 rounded-2xl bg-neutral-950/80 px-4 py-3 text-xs text-neutral-100 flex items-center justify-between gap-4"
            >
              <div>
                <p className="uppercase tracking-[0.25em] text-[10px] text-green-500">
                  Vault Locked
                </p>
                <p className="mt-1 text-[11px] text-neutral-300">
                  Your confession has been sealed. Receipt ID:&nbsp;
                  <span className="text-green-400">{submittedId}</span>
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}

