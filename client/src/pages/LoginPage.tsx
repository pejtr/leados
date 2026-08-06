import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { OptimateoLogo } from "@/components/OptimateoLogo";
import { Lock } from "lucide-react";

export default function LoginPage() {
  const [, setLocation] = useLocation();

  // Odkaz na Google OAuth flow na backendu
  const handleGoogleLogin = () => {
    // Předáme returnPath, abychom se po přihlášení vrátili do dashboardu
    window.location.href = "/api/auth/google?returnPath=/dashboard";
  };

  return (
    <div className="min-h-screen bg-[#061421] flex flex-col items-center justify-center p-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-sky-500/10 blur-[120px]" />
        <div className="absolute bottom-[0%] -right-[10%] w-[40%] h-[60%] rounded-full bg-sky-900/20 blur-[100px]" />
      </div>

      <div className="relative z-10 w-full max-w-md bg-slate-900/50 backdrop-blur-xl border border-white/10 p-8 rounded-3xl shadow-2xl">
        <div className="flex flex-col items-center mb-8">
          <OptimateoLogo className="h-10 mb-6" light withTagline={false} />
          <h1 className="text-2xl font-bold text-white text-center">ONYX OS</h1>
          <p className="text-sm font-medium tracking-[0.2em] text-sky-400 uppercase mt-2">Operator Authentication</p>
        </div>

        <div className="space-y-4">
          <Button 
            onClick={handleGoogleLogin}
            className="w-full h-12 bg-white hover:bg-slate-100 text-slate-900 text-base font-semibold rounded-xl flex items-center justify-center gap-3 transition-colors"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Přihlásit přes Google
          </Button>

          <div className="relative flex items-center py-4">
            <div className="flex-grow border-t border-white/10"></div>
            <span className="flex-shrink-0 mx-4 text-xs font-medium text-slate-500 uppercase">Nebo</span>
            <div className="flex-grow border-t border-white/10"></div>
          </div>

          <Button 
            variant="outline"
            onClick={() => setLocation("/")}
            className="w-full h-12 bg-transparent border-white/10 text-slate-300 hover:bg-white/5 hover:text-white rounded-xl"
          >
            Zpět na web
          </Button>
        </div>

        <div className="mt-8 flex items-center justify-center gap-2 text-xs text-slate-500">
          <Lock className="w-3 h-3" />
          <span>Přístup pouze pro autorizované operátory</span>
        </div>
      </div>
    </div>
  );
}
