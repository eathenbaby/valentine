import { useEffect, useState } from "react";
import { useRoute } from "wouter";
import confetti from "canvas-confetti";

export default function RevealPage() {
  const [match, params] = useRoute("/reveal/:shortId");
  const shortId = params?.shortId as string | undefined;

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [paymentRef, setPaymentRef] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const fetchPreview = async () => {
    if (!shortId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/v4ult/reveal/${shortId}`);
      if (res.status === 402) {
        const body = await res.json();
        setData({ paid: false, ...body });
        setLoading(false);
        return;
      }
      if (!res.ok) throw new Error("Failed to load");
      const body = await res.json();
      setData({ paid: true, ...body });
    } catch (err: any) {
      setError(err?.message ?? "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchPreview();
    const iv = setInterval(() => void fetchPreview(), 8000);
    return () => clearInterval(iv);
  }, [shortId]);

  const upiId = import.meta.env.VITE_UPI_ID || "yourupi@bank";
  const amount = 99;
  const upiLink = `upi://pay?pa=${encodeURIComponent(upiId)}&pn=StcpMatrimony&am=${amount}.00&cu=INR&tn=Reveal-${shortId || 'v4ult'}`;
  const qrUrl = `https://chart.googleapis.com/chart?chs=350x350&cht=qr&chl=${encodeURIComponent(upiLink)}`;

  const handleSubmitPayment = async () => {
    if (!shortId) return;
    if (!paymentRef.trim()) return alert("Enter transaction ID");
    setSubmitting(true);
    setStatusMessage(null);
    try {
      const res = await fetch(`/api/v4ult/reveal/${shortId}/submit-payment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentRef: paymentRef.trim(), viewerEmail: null, paymentProvider: "upi", amount }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "Failed to submit payment proof");
      }
      setStatusMessage("Verifying with the Vault... ⏳ Our handlers are checking. Keep this page open!");
      setData((d: any) => ({ ...d, submitted: true }));
    } catch (err: any) {
      setStatusMessage(err?.message ?? "Submission failed");
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    if (data?.paid) {
      // celebrate when paid
      confetti({
        particleCount: 60,
        spread: 60,
        origin: { y: 0.4 },
        colors: ['#FFC1CC', '#FFD6E0', '#FFF5F7'],
      });
    }
  }, [data?.paid]);

  if (!shortId) {
    return <div className="min-h-screen flex items-center justify-center">Invalid link</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-50 to-[#FFF5F7] flex items-center justify-center p-6 font-['Fredoka']">
      <div className="w-full max-w-xl p-6 rounded-[40px] border-4 border-[#FFB7C5] bg-white/70 backdrop-blur-md shadow-[0_20px_40px_rgba(255,182,197,0.3)]">
        <h1 className="text-center text-3xl mb-4" style={{ fontFamily: 'Pacifico, serif' }}>Someone has a secret for you... 🎀</h1>

        {loading ? (
          <div className="text-center">Loading…</div>
        ) : error ? (
          <div className="text-center text-red-600">Error: {error}</div>
        ) : data?.paid ? (
          <div className="text-center">
            <h2 className="text-2xl font-bold text-[#D14D72] mb-2">It was {data.identity} all along! 💖</h2>
            {data.socialLink && (
              <a href={data.socialLink} target="_blank" rel="noreferrer" className="inline-block mt-2 px-4 py-2 bg-[#FFC1CC] text-[#6b2744] rounded-full font-semibold">Visit profile</a>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            <div className="text-center">
              <div className="inline-block mb-3 p-4 bg-white rounded-2xl shadow-lg">
                <img src={qrUrl} alt="UPI QR" width={260} height={260} />
              </div>
              <div className="text-sm text-[#6b2744]">Scan to Pay ₹{amount}</div>
              <div className="flex gap-2 justify-center mt-3">
                <a href={upiLink} className="px-4 py-2 bg-[#FFC1CC] text-[#6b2744] rounded-full text-sm font-semibold hover:scale-105 active:scale-95 transition-transform">Tap to pay</a>
                <button onClick={() => { navigator.clipboard.writeText(upiId); alert('UPI ID copied!'); }} className="px-4 py-2 bg-[#FFE4E8] text-[#6b2744] rounded-full text-sm hover:scale-105 active:scale-95 transition-transform">Copy UPI ID</button>
              </div>
            </div>

            <div>
              <label className="block text-sm text-[#6b2744] mb-2">Transaction ID (UTR)</label>
              <div className="flex gap-2">
                <input value={paymentRef} onChange={(e) => setPaymentRef(e.target.value)} placeholder="12-digit UTR" className="flex-1 px-4 py-3 rounded-full border border-pink-100 font-['Fredoka']" />
                <button onClick={handleSubmitPayment} disabled={submitting} className="px-6 py-3 bg-[#FFC1CC] rounded-full text-[#6b2744] font-semibold hover:scale-105 active:scale-95 transition-transform disabled:opacity-50">{submitting ? 'Submitting…' : 'Submit'}</button>
              </div>
              {data?.submitted && (
                <p className="mt-2 text-sm text-[#D14D72]">Verifying with the Vault... ⏳ Our handlers are checking. Keep this page open!</p>
              )}
              {statusMessage && <p className="mt-2 text-sm text-[#6b2744]">{statusMessage}</p>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}


