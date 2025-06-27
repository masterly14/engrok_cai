"use client";
import { Check, ArrowUpRight, Sparkles, Zap, Crown, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { onBoardUser } from "@/actions/user";
import { createCheckoutAction } from "@/actions/lemon-squeezy";
import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import PricingPlansClient from "@/components/application/pricingPlansClient";

const sleep = (ms: number) => new Promise((res) => setTimeout(res, ms));

const PricingPlans = ({ userId }: { userId: string | null }) => {
  const [plans, setPlans] = useState<any[]>([]);
  const [currentPlan, setCurrentPlan] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await fetch("/api/plans/public").then((r) => r.json());
        setPlans(data.plans || []);
        console.log(data.plans);
        setCurrentPlan(data.currentPlan);
      } catch (e) {
        console.error("failed to load plans", e);
      }
    };
    load();
  }, []);

  return <PricingPlansClient plans={plans} userId={userId} currentPlan={currentPlan} />;
};

const PricingSection = () => {
  const { isSignedIn, isLoaded } = useUser();
  const [localUser, setLocalUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    if (isLoaded) {
      if (isSignedIn) {
        const fetchLocalUser = async () => {
          try {
            await sleep(1000); // dar tiempo a que la sesión de Clerk se propague
            const onboardedUser = await onBoardUser();
            setLocalUser(onboardedUser);
          } catch (error) {
            console.error("Failed to fetch local user, will retry on next render:", error);
          } finally {
            setLoading(false);
          }
        };
        fetchLocalUser();
      } else {
        setLocalUser(null);
        setLoading(false);
      }
    }
  }, [isSignedIn, isLoaded]);

  useEffect(() => {
    if (!loading && localUser?.data?.temporalVariantId) {
      router.push("/validate");
    }
  }, [loading, localUser, router]);

  return (
    <section id="pricing" className="py-32 bg-black relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0">
        <div className="absolute top-1/3 left-1/2 transform -translate-x-1/2 w-[800px] h-[600px] bg-gradient-to-r from-cyan-500/8 via-purple-500/8 to-pink-500/8 rounded-full blur-3xl animate-pulse"></div>
      </div>

      <div className="max-w-7xl mx-auto px-8 relative z-10">
        {/* Header */}
        <div className="text-center mb-20">
          <h2 className="font-light text-5xl md:text-6xl leading-tight mb-8 tracking-tight">
            <span className="text-white">Planes para cada</span>
            <br />
            <span className="bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent">
              etapa de tu negocio
            </span>
          </h2>
          <p className="text-lg text-white/60 font-light max-w-2xl mx-auto leading-relaxed tracking-wide">
            Desde startups hasta grandes empresas, tenemos la solución perfecta
            para tu escala de comunicación.
          </p>
        </div>

        {loading ? (
           <div className="flex items-center justify-center p-4">
             <Loader2 className="h-12 w-12 animate-spin text-white" />
           </div>
        ) : (
          <PricingPlans userId={localUser?.data?.id || null} />
        )}

        {/* Bottom Text */}
        <div className="text-center mt-16">
          <p className="text-white/40 text-sm tracking-wide">
            Puedes comprar ahora, o agendar una demo y recibir un periodo de prueba de 7 días.
          </p>
        </div>
      </div>
    </section>
  );
};

export default PricingSection;
