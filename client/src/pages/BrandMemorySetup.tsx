import { useState } from "react";
import { useForm } from "react-hook-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Brain, CheckCircle, ChevronRight, ChevronLeft, Sparkles, Building, Users, Megaphone, Target } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

type FormData = {
  companyName: string;
  tagline: string;
  industry: string;
  website: string;
  targetAudience: string;
  brandVoice: string;
  uniqueValue: string;
  products: string;
  painPoints: string;
  pastCampaigns: string;
};

const STEPS = [
  { id: 1, title: "Základní info", icon: Building, desc: "Název firmy, obor, web" },
  { id: 2, title: "Cílová skupina", icon: Users, desc: "Kdo jsou vaši zákazníci" },
  { id: 3, title: "Brand & Hlas", icon: Megaphone, desc: "Jak komunikujete" },
  { id: 4, title: "Produkty & USP", icon: Target, desc: "Co nabízíte a proč vy" },
];

type Props = {
  onComplete?: () => void;
  initialData?: Partial<FormData>;
};

export default function BrandMemorySetup({ onComplete, initialData }: Props) {
  const [step, setStep] = useState(1);
  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<FormData>({
    defaultValues: initialData || {},
  });

  const saveMutation = trpc.brandMemory.save.useMutation({
    onSuccess: () => {
      toast.success("Brand Memory uložena! AI agenti nyní znají vaši firmu.");
      onComplete?.();
    },
    onError: (err) => toast.error("Nepodařilo se uložit: " + err.message),
  });

  const onSubmit = (data: FormData) => {
    saveMutation.mutate(data);
  };

  const VOICE_OPTIONS = [
    "Přátelský a přístupný",
    "Profesionální a formální",
    "Odvážný a přímý",
    "Inspirativní a motivující",
    "Odborný a analytický",
    "Lidský a empatický",
  ];

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 bg-violet-100 text-violet-700 px-4 py-2 rounded-full text-sm font-medium mb-4">
          <Brain className="w-4 h-4" />
          Brand Memory — paměť značky
        </div>
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Naučte AI vašeho brandu</h1>
        <p className="text-slate-500 max-w-md mx-auto">
          Jednou nastavíte — každý agent pak automaticky ví kdo jste, jak komunikujete a co prodáváte.
        </p>
      </div>

      {/* Steps */}
      <div className="flex items-center justify-between mb-8 px-2">
        {STEPS.map((s, i) => (
          <div key={s.id} className="flex items-center">
            <div className="flex flex-col items-center gap-1">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                step === s.id
                  ? "bg-violet-600 text-white shadow-lg shadow-violet-200"
                  : step > s.id
                  ? "bg-green-500 text-white"
                  : "bg-slate-100 text-slate-400"
              }`}>
                {step > s.id ? <CheckCircle className="w-5 h-5" /> : s.id}
              </div>
              <span className={`text-xs font-medium hidden sm:block ${step === s.id ? "text-violet-600" : "text-slate-400"}`}>
                {s.title}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`h-0.5 w-12 sm:w-20 mx-2 mt-[-16px] ${step > s.id ? "bg-green-400" : "bg-slate-200"}`} />
            )}
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        <Card className="border-0 shadow-lg">
          <CardContent className="p-6 space-y-5">

            {/* Step 1: Basic Info */}
            {step === 1 && (
              <>
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-violet-100 rounded-xl flex items-center justify-center">
                    <Building className="w-5 h-5 text-violet-600" />
                  </div>
                  <div>
                    <h2 className="font-semibold text-slate-900">Základní informace o firmě</h2>
                    <p className="text-sm text-slate-500">Základ, který agent vždy použije</p>
                  </div>
                </div>
                <Separator />
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="companyName">Název firmy *</Label>
                    <Input id="companyName" placeholder="např. OPTIVIO" {...register("companyName", { required: true })} className="mt-1" />
                  </div>
                  <div>
                    <Label htmlFor="tagline">Slogan / Tagline</Label>
                    <Input id="tagline" placeholder="např. Weby které prodávají, ne jen vypadají" {...register("tagline")} className="mt-1" />
                  </div>
                  <div>
                    <Label htmlFor="industry">Obor / Odvětví</Label>
                    <Input id="industry" placeholder="např. Webdesign, SaaS, E-commerce, Stavebnictví..." {...register("industry")} className="mt-1" />
                  </div>
                  <div>
                    <Label htmlFor="website">Web</Label>
                    <Input id="website" placeholder="https://optivio.cz" {...register("website")} className="mt-1" />
                  </div>
                </div>
              </>
            )}

            {/* Step 2: Target Audience */}
            {step === 2 && (
              <>
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                    <Users className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h2 className="font-semibold text-slate-900">Vaši zákazníci</h2>
                    <p className="text-sm text-slate-500">Čím přesněji, tím lepší výstupy od agentů</p>
                  </div>
                </div>
                <Separator />
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="targetAudience">Cílová skupina</Label>
                    <Textarea
                      id="targetAudience"
                      placeholder="např. Majitelé malých firem (5-50 zaměstnanců) v ČR, kteří chtějí profesionální web ale nemají čas ani znalosti..."
                      {...register("targetAudience")}
                      className="mt-1 min-h-[100px]"
                    />
                    <p className="text-xs text-slate-400 mt-1">Věk, profese, co chtějí, čeho se bojí, kde jsou online</p>
                  </div>
                  <div>
                    <Label htmlFor="painPoints">Bolesti zákazníků které řešíte</Label>
                    <Textarea
                      id="painPoints"
                      placeholder="např. Stávající web nevypadá dobře na mobilu, nedostávají poptávky z webu, agentura je příliš drahá..."
                      {...register("painPoints")}
                      className="mt-1 min-h-[100px]"
                    />
                  </div>
                </div>
              </>
            )}

            {/* Step 3: Brand Voice */}
            {step === 3 && (
              <>
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
                    <Megaphone className="w-5 h-5 text-amber-600" />
                  </div>
                  <div>
                    <h2 className="font-semibold text-slate-900">Hlas a styl komunikace</h2>
                    <p className="text-sm text-slate-500">Jak mluvíte se zákazníky</p>
                  </div>
                </div>
                <Separator />
                <div className="space-y-4">
                  <div>
                    <Label>Hlas značky</Label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {VOICE_OPTIONS.map(v => {
                        const current = watch("brandVoice");
                        return (
                          <button
                            type="button"
                            key={v}
                            onClick={() => setValue("brandVoice", v)}
                            className={`px-3 py-1.5 rounded-full text-sm border transition-all ${
                              current === v
                                ? "bg-violet-600 text-white border-violet-600"
                                : "bg-white text-slate-600 border-slate-200 hover:border-violet-300"
                            }`}
                          >
                            {v}
                          </button>
                        );
                      })}
                    </div>
                    <Input
                      id="brandVoice"
                      placeholder="nebo napište vlastní styl..."
                      {...register("brandVoice")}
                      className="mt-3"
                    />
                  </div>
                  <div>
                    <Label htmlFor="pastCampaigns">Co vám v minulosti fungovalo</Label>
                    <Textarea
                      id="pastCampaigns"
                      placeholder="např. Facebook Ads na Kavárny měly skvělé výsledky, emaily s case studies mají 40% open rate, video testimonials konvertují nejlépe..."
                      {...register("pastCampaigns")}
                      className="mt-1 min-h-[100px]"
                    />
                  </div>
                </div>
              </>
            )}

            {/* Step 4: Products & USP */}
            {step === 4 && (
              <>
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                    <Target className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <h2 className="font-semibold text-slate-900">Produkty a unikátní hodnota</h2>
                    <p className="text-sm text-slate-500">Co nabízíte a proč právě vy</p>
                  </div>
                </div>
                <Separator />
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="products">Produkty / Služby</Label>
                    <Textarea
                      id="products"
                      placeholder="např. Lite Web (3 490 Kč), Basic Web (4 999 Kč), Web + Lead Gen (6 990 Kč), LeadOS SaaS (990 Kč/měs)..."
                      {...register("products")}
                      className="mt-1 min-h-[100px]"
                    />
                  </div>
                  <div>
                    <Label htmlFor="uniqueValue">USP — Proč právě vy?</Label>
                    <Textarea
                      id="uniqueValue"
                      placeholder="Co vás odlišuje od konkurence? Proč by zákazník měl vybrat vás a ne agenturu za 50 000 Kč?"
                      {...register("uniqueValue")}
                      className="mt-1 min-h-[100px]"
                    />
                  </div>
                </div>
              </>
            )}

          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex justify-between mt-6">
          <Button
            type="button"
            variant="outline"
            onClick={() => setStep(s => s - 1)}
            disabled={step === 1}
            className="gap-2"
          >
            <ChevronLeft className="w-4 h-4" />
            Zpět
          </Button>

          {step < STEPS.length ? (
            <Button
              type="button"
              onClick={() => setStep(s => s + 1)}
              className="gap-2 bg-violet-600 hover:bg-violet-700"
            >
              Další
              <ChevronRight className="w-4 h-4" />
            </Button>
          ) : (
            <Button
              type="submit"
              disabled={saveMutation.isPending}
              className="gap-2 bg-violet-600 hover:bg-violet-700"
            >
              <Sparkles className="w-4 h-4" />
              {saveMutation.isPending ? "Ukládám..." : "Uložit Brand Memory"}
            </Button>
          )}
        </div>
      </form>
    </div>
  );
}
