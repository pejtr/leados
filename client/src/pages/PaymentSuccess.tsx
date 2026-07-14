import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { OptimateoLogo } from "@/components/OptimateoLogo";
import { Button } from "@/components/ui/button";
import { Check, Rocket, ShieldCheck, ArrowRight } from "lucide-react";
import { trackSklikConversion } from "@/lib/sklik";
import { trackLinkedInConversion } from "@/lib/linkedin";
import { trpc } from "@/lib/trpc";
import { trackEvent } from "@/lib/ab-test";

export default function PaymentSuccess() {
    const [, setLocation] = useLocation();
    const [countdown, setCountdown] = useState(10);
    const confirmCheckout = trpc.stripe.confirmCheckoutSession.useMutation();

    useEffect(() => {
        const sessionId = new URLSearchParams(window.location.search).get("session_id");
        const conversionKey = sessionId ? `payment-conversion:${sessionId}` : null;
        if (sessionId && conversionKey && !window.sessionStorage.getItem(conversionKey)) {
            confirmCheckout.mutateAsync({ sessionId }).then(({ amount, orderId }) => {
                window.sessionStorage.setItem(conversionKey, "1");
                trackSklikConversion({ orderId: sessionId, value: amount });
                trackLinkedInConversion(undefined, amount);
                void trackEvent("deposit_paid", { orderId, amount, currency: "CZK" });
            }).catch(() => {
                // A refresh retries safely if Stripe has not exposed the completed session yet.
            });
        }

        const timer = setInterval(() => {
            setCountdown((prev) => {
                if (prev <= 1) {
                    clearInterval(timer);
                    setLocation("/dashboard");
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(timer);
    }, [setLocation]);

    return (
        <div className="min-h-screen flex flex-col relative bg-slate-50">
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>

            <header className="bg-white/80 backdrop-blur-md border-b border-slate-200 z-10 sticky top-0 relative">
                <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
                    <a href="/">
                        <OptimateoLogo className="h-8" />
                    </a>
                </div>
            </header>

            <main className="flex-1 flex items-center justify-center p-4 relative z-10">
                <div className="max-w-xl w-full">
                    <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden text-center p-12">
                        <div className="w-24 h-24 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-8 ring-8 ring-emerald-50">
                            <Check className="w-12 h-12" />
                        </div>

                        <span className="bg-emerald-100 text-emerald-800 text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full mb-4 inline-block">
                            Úspěšně uhrazeno
                        </span>

                        <h1 className="text-3xl font-extrabold text-slate-900 mb-4 tracking-tight">Platba je potvrzená</h1>
                        <p className="text-slate-600 text-lg mb-8 leading-relaxed max-w-sm mx-auto">
                            Platba proběhla v pořádku. OPTIMATEO teď potvrdí harmonogram a další krok vašeho projektu.
                        </p>

                        <div className="bg-slate-50 border border-slate-100 rounded-2xl p-6 mb-8 text-left flex items-start gap-4">
                            <div className="w-12 h-12 rounded-xl bg-violet-100 text-violet-600 flex items-center justify-center shrink-0">
                                <Rocket className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="font-bold text-slate-900 mb-1">Co se stane teď?</h3>
                                <p className="text-sm text-slate-500">
                                    Na e-mail jsme vám poslali potvrzení. Nejpozději do 24 hodin se ozveme s harmonogramem a potřebnými podklady.
                                </p>
                            </div>
                        </div>

                        <Button
                            onClick={() => setLocation("/dashboard")}
                            className="w-full bg-slate-900 hover:bg-slate-800 text-white rounded-xl py-6 text-base font-bold transition-all shadow-lg shadow-slate-900/20 group"
                        >
                            Přejít do mého portálu <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                        </Button>

                        <p className="text-xs text-slate-400 mt-4 font-medium">
                            Přesměrování proběhne automaticky za <strong>{countdown} s</strong>
                        </p>
                    </div>

                    <div className="mt-8 flex items-center justify-center gap-2 text-xs text-slate-400 font-medium">
                        <ShieldCheck className="w-4 h-4" /> Platba zprocesována bezpečně přes Stripe.
                    </div>
                </div>
            </main>
        </div>
    );
}
