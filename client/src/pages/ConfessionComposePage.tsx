import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { confessionComposeSchema, type ConfessionCompose, type SenderInfo } from "@shared/schema";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Heart, Sparkles, Loader2, ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useCreateConfession } from "@/hooks/use-confessions";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { FloatingHearts } from "@/components/FloatingHearts";
import { Sparkles as SparklesComponent } from "@/components/Sparkles";
import confetti from "canvas-confetti";

const SUBMIT_BUTTONS = [
  "🙈 Oopsy, I confessed!",
  "💕 My secret has been spilled!",
  "💌 Send my confession!",
  "🎭 Reveal my heart (anonymously!)",
];

export default function ConfessionComposePage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const createMutation = useCreateConfession();
  const [createdId, setCreatedId] = useState<string | null>(null);
  const [senderInfo, setSenderInfo] = useState<SenderInfo | null>(null);
  const [submitButtonText, setSubmitButtonText] = useState(SUBMIT_BUTTONS[0]);

  useEffect(() => {
    const stored = sessionStorage.getItem("senderInfo");
    if (!stored) {
      setLocation("/");
      return;
    }
    setSenderInfo(JSON.parse(stored));
    setSubmitButtonText(SUBMIT_BUTTONS[Math.floor(Math.random() * SUBMIT_BUTTONS.length)]);
  }, [setLocation]);

  const form = useForm<ConfessionCompose>({
    resolver: zodResolver(confessionComposeSchema),
    defaultValues: {
      message: "",
    },
  });

  const onSubmit = async (data: ConfessionCompose) => {
    if (!senderInfo) {
      toast({
        title: "Error",
        description: "Please start from the beginning",
        variant: "destructive",
      });
      setLocation("/");
      return;
    }

    // Trigger confetti
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#FF6B9D', '#FFC2E2', '#FFD700', '#E6B8E8']
    });

    createMutation.mutate(
      {
        senderName: senderInfo.senderName,
        intentOption: senderInfo.intentOption,
        message: data.message,
      },
      {
        onSuccess: (confession) => {
          setCreatedId(confession.id);
          sessionStorage.removeItem("senderInfo");
          toast({
            title: "Confession Sent! 💌",
            description: "Your secret is on its way to their heart ✨",
          });
        },
        onError: () => {
          toast({
            title: "Oops! 💔",
            description: "Something went wrong. Try again!",
            variant: "destructive",
          });
        },
      }
    );
  };

  const copyLink = () => {
    if (!createdId) return;
    const link = `${window.location.origin}/v/${createdId}`;
    navigator.clipboard.writeText(link);
    toast({
      title: "Copied! 🔗",
      description: "Send it to your crush ASAP!",
    });
  };

  const messageLength = form.watch("message")?.length || 0;

  if (!senderInfo) {
    return null;
  }

  return (
    <>
      <div className="min-h-screen w-full flex flex-col items-center justify-center p-4 relative overflow-hidden">
        <FloatingHearts />
        <SparklesComponent />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-2xl mx-auto relative z-10"
        >
          <Button
            variant="ghost"
            onClick={() => setLocation("/")}
            className="mb-4 text-gray-600 hover:text-foreground"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>

          <div className="glass-card rounded-3xl p-8 border-2 border-pink-100 shadow-xl">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-center mb-8"
            >
              <h2 className="text-4xl md:text-5xl font-bold gradient-text mb-2">
                💌 Time to Confess 💌
              </h2>
              <p className="text-lg text-gray-600 italic mt-2">
                Pour your heart out... they'll never know it's you 💭
              </p>
            </motion.div>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="message"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-lg font-semibold text-deep-romantic">
                        Your Anonymous Confession
                      </FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="I've been thinking about you for so long..."
                          className="confession-box w-full min-h-[280px] p-6 rounded-[20px] border-3 border-dashed border-[#FFC2E2] bg-gradient-to-b from-white to-[#FFF0F5] text-lg font-['Poppins'] leading-relaxed resize-y shadow-[inset_0_2px_10px_rgba(255,107,157,0.05)] transition-all duration-300 focus:border-solid focus:border-[#FF6B9D] focus:shadow-[0_0_0_4px_rgba(255,107,157,0.1),inset_0_2px_10px_rgba(255,107,157,0.1)] focus:outline-none focus:bg-white"
                          style={{
                            borderWidth: "3px",
                            fontFamily: "'Poppins', sans-serif",
                          }}
                          maxLength={1000}
                          {...field}
                        />
                      </FormControl>
                      <div className="flex justify-between items-center">
                        <p className={`text-sm ${messageLength > 900 ? 'text-[#FF6B9D] font-semibold' : 'text-gray-500'}`}>
                          {messageLength} / 1000 characters
                        </p>
                        <FormMessage />
                      </div>
                    </FormItem>
                  )}
                />

                <div className="tips-box bg-[rgba(255,240,245,0.5)] border-l-4 border-[#FF6B9D] p-5 rounded-xl">
                  <h4 className="text-base text-[#C73866] font-semibold mb-2">💡 Tips:</h4>
                  <ul className="list-none pl-0 space-y-1.5">
                    <li className="pl-6 relative text-gray-600">
                      <span className="absolute left-0">💕</span>
                      Be genuine and heartfelt
                    </li>
                    <li className="pl-6 relative text-gray-600">
                      <span className="absolute left-0">✨</span>
                      Share a specific memory or moment
                    </li>
                    <li className="pl-6 relative text-gray-600">
                      <span className="absolute left-0">🎭</span>
                      Don't give away who you are!
                    </li>
                    <li className="pl-6 relative text-gray-600">
                      <span className="absolute left-0">🌹</span>
                      Keep it sweet and respectful
                    </li>
                  </ul>
                </div>

                <div className="bg-pink-50 p-4 rounded-xl border border-pink-200">
                  <p className="text-sm text-gray-600 text-center">
                    <strong>Remember:</strong> Your name stays completely anonymous. 
                    They'll only see "{senderInfo.intentOption}" and your message! 🔒
                  </p>
                </div>

                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Button 
                    type="submit" 
                    disabled={createMutation.isPending}
                    className="submit-button w-full h-14 text-xl font-bold rounded-[50px] bg-gradient-to-r from-[#FF6B9D] to-[#FFD700] text-white border-none shadow-[0_10px_30px_rgba(255,107,157,0.4)] hover:shadow-[0_15px_40px_rgba(255,107,157,0.6)] transition-all button-ripple relative overflow-hidden"
                    style={{
                      animation: createMutation.isPending ? "heartbeat-loading 0.8s infinite" : "gentle-bounce 2s ease-in-out infinite",
                      fontFamily: "'Inter', 'Poppins', sans-serif",
                    }}
                  >
                    {createMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-6 w-6 animate-spin inline-block" />
                        Making magic happen... ✨
                      </>
                    ) : (
                      <>
                        {submitButtonText} <Sparkles className="ml-2 h-5 w-5 fill-white inline-block" />
                      </>
                    )}
                  </Button>
                </motion.div>
              </form>
            </Form>
          </div>
        </motion.div>
      </div>

      <Dialog open={!!createdId} onOpenChange={() => setCreatedId(null)}>
        <DialogContent className="success-modal glass-card sm:max-w-md border-2 border-pink-200 text-center p-12 shadow-[0_20px_60px_rgba(255,107,157,0.4)]" style={{ animation: "modal-appear 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55)" }}>
          <DialogHeader>
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200 }}
              className="text-6xl mb-4"
            >
              💌
            </motion.div>
            <DialogTitle className="text-3xl text-center text-primary pt-4">Confession Sent!</DialogTitle>
            <DialogDescription className="text-center text-lg text-foreground/80 mt-2">
              Your secret is on its way to their heart ✨
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center gap-6 py-6">
            <div className="bg-pink-50 p-4 rounded-xl border border-pink-200 w-full text-center break-all font-mono text-sm text-pink-600">
              {window.location.origin}/v/{createdId}
            </div>
            <Button 
              onClick={copyLink}
              className="w-full h-12 text-lg bg-primary hover:bg-primary/90 text-white rounded-xl shadow-md"
            >
              📋 Copy Link
            </Button>
            <p className="text-xs text-muted-foreground text-center px-4">
              Remember: Send this link to your crush! They'll never know it's you 🎭
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
