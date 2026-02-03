import { motion } from "framer-motion";
import { Link } from "wouter";

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-black text-neutral-100 flex items-center justify-center px-4 py-10">
      <div className="pointer-events-none fixed inset-0 mix-blend-overlay opacity-40 bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 w-full max-w-3xl border border-neutral-800 rounded-3xl bg-neutral-950/90 px-6 py-8 md:px-10 md:py-10 shadow-[0_0_120px_rgba(0,0,0,0.9)]"
        style={{
          fontFamily:
            "'IBM Plex Serif', 'Georgia', 'Times New Roman', ui-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        }}
      >
        <header className="mb-6">
          <p className="text-[10px] uppercase tracking-[0.3em] text-pink-500 mb-1">
            V4ULT // STC
          </p>
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">
            Terms of Service
          </h1>
          <p className="mt-1 text-xs text-neutral-500">
            Read this like a leaked internal memo. By continuing, you agree to everything below.
          </p>
        </header>

        <section className="space-y-4 text-sm leading-relaxed text-neutral-200">
          <p className="text-xs uppercase tracking-[0.2em] text-neutral-500 mb-1">
            1. Verified Mystery Clause
          </p>
          <p className="text-neutral-300">
            V4ULT uses OAuth and similar identity providers to verify that you are a real person
            affiliated with St. Thomas College or its ecosystem. Your legal identity is stored
            securely in encrypted systems and is never shown publicly by default. By submitting any
            confession or content to V4ULT, you acknowledge and consent to the following:
          </p>
          <ul className="list-disc list-inside text-neutral-300 space-y-1">
            <li>
              Your identity may be linked internally to your submissions for safety, moderation, and
              fraud prevention.
            </li>
            <li>
              Your identity may be revealed to another user via premium &quot;Unlock&quot; or
              &quot;Reveal&quot; flows, which you understand and accept as part of the V4ULT
              experience.
            </li>
          </ul>

          <p className="mt-6 text-xs uppercase tracking-[0.2em] text-neutral-500 mb-1">
            2. The No-Liability Protocol
          </p>
          <p className="text-neutral-300">
            V4ULT operates as a neutral carrier of user-generated content. We do not create,
            endorse, or fact-check any confessions, rumors, or reveals published through the
            platform. By using V4ULT, you agree that:
          </p>
          <ul className="list-disc list-inside text-neutral-300 space-y-1">
            <li>
              You are solely responsible for the content you submit and the consequences of sharing
              or revealing identities.
            </li>
            <li>
              V4ULT, its creators, and its operators are not liable for any social, romantic,
              reputational, disciplinary, or academic outcomes that arise from use of the service,
              including but not limited to relationship conflicts, campus drama, or faculty action.
            </li>
            <li>
              You will not pursue legal claims against the platform for actions taken by other
              users, including confessions, reveals, or subsequent offline events.
            </li>
          </ul>

          <p className="mt-6 text-xs uppercase tracking-[0.2em] text-neutral-500 mb-1">
            3. The Anti-Hate Mandate
          </p>
          <p className="text-neutral-300">
            V4ULT is built for curiosity, not cruelty. The following are strictly prohibited:
          </p>
          <ul className="list-disc list-inside text-neutral-300 space-y-1">
            <li>Hate speech targeting any group based on identity or protected characteristic.</li>
            <li>Harassment, bullying, or targeted intimidation of any individual or group.</li>
            <li>
              Doxing, sharing private information, or attempting to identify minors or vulnerable
              individuals.
            </li>
          </ul>
          <p className="text-neutral-300">
            Violations may result in immediate suspension or permanent ban, removal of content, and
            where appropriate, reporting to relevant authorities or campus bodies. We reserve the
            right to cooperate with official investigations while still prioritizing user safety.
          </p>

          <p className="mt-6 text-xs uppercase tracking-[0.2em] text-neutral-500 mb-1">
            4. Platform Operations
          </p>
          <p className="text-neutral-300">
            Features such as &quot;Reveal,&quot; &quot;Heat Index,&quot; and departmental tags are
            experimental and may be changed, paused, or removed at any time. By using V4ULT, you
            acknowledge that the service may experience outages, moderation actions, or content
            removals without prior notice.
          </p>
        </section>

        <footer className="mt-8 flex items-center justify-between text-[11px] text-neutral-500">
          <span>© {new Date().getFullYear()} V4ULT / STC. All rights reserved.</span>
          <Link href="/">
            <a className="uppercase tracking-[0.2em] text-pink-400 hover:text-pink-300">
              Back to Vault
            </a>
          </Link>
        </footer>
      </motion.div>
    </div>
  );
}

