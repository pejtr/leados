import { useLocation } from "wouter";
import { OptimateoLogo } from "@/components/OptimateoLogo";
import { Button } from "@/components/ui/button";
import { XCircle, ArrowLeft, HeadphonesIcon } from "lucide-react";

export default function PaymentCancel() {
  const [, setLocation] = useLocation();

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
            <div className="w-24 h-24 rounded-full bg-red-50 text-red-500 flex items-center justify-center mx-auto mb-8 ring-8 ring-red-50/50">
              <XCircle className="w-12 h-12" />
            </div>

            <h1 className="text-3xl font-extrabold text-slate-900 mb-4 tracking-tight">Platba byla přerušena</h1>
            <p className="text-slate-600 text-lg mb-8 leading-relaxed max-w-sm mx-auto">
              Záloha nebyla uhrazena a žádné prostředky nebyly strženy z vašeho účtu.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                onClick={() => setLocation("/")}
                variant="outline"
                className="w-full sm:w-auto rounded-xl py-6 h-auto text-base font-bold border-slate-300 text-slate-700 hover:bg-slate-100 transition-colors"
              >
                <ArrowLeft className="w-5 h-5 mr-2" /> Zpět na hlavní stranu
              </Button>
              <Button
                onClick={() => window.open('mailto:info@optimateo.com', '_blank')}
                className="w-full sm:w-auto bg-slate-900 hover:bg-slate-800 text-white rounded-xl py-6 h-auto text-base font-bold transition-all shadow-lg shadow-slate-900/20"
              >
                <HeadphonesIcon className="w-5 h-5 mr-2" /> Kontaktovat podporu
              </Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
