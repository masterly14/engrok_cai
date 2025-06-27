"use client";
import { Check, Sparkles, Zap, Crown } from "lucide-react";
import { Button } from "../ui/button";
import { ArrowUpRight } from "lucide-react";
import { createCheckoutAction } from "@/actions/lemon-squeezy";
import { useRouter } from "next/navigation";

type PlanUI = {
  id?: string;
  name: string;
  price: string | number | null;
  period?: string | null;
  interval?: string | null;
  variantId: number | string;
  ui?: any; // JSON from DB; validated at runtime
};

export default function PricingPlansClient({
  plans,
  userId,
  currentPlan
}: {
  plans: PlanUI[];
  userId: string | null;
  currentPlan: string | null;
}) {
  const visiblePlans = plans.filter((p) => p.ui && typeof p.ui === "object");
  const router = useRouter();
  console.log(visiblePlans);
  const handleCreateCheckout = async (variantId: number) => {
    if (userId) {
      // Usuario logueado: genera el checkout
      const checkoutUrl = await createCheckoutAction(userId, variantId);
      window.location.href = checkoutUrl;
    } else {
      // Usuario no logueado: guarda el variantId en localStorage y redirige
      localStorage.setItem("variantId", variantId.toString());
      router.push(`/sign-up`);
    }
  };
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {visiblePlans.map((plan, index) => {
        // Si el usuario ya tiene un plan activo, solo permitimos acción en ese plan
        const hasCurrentPlan = currentPlan !== null && currentPlan !== undefined;
        const isUserPlan = currentPlan === plan.name;
        const isDisabled = hasCurrentPlan && !isUserPlan;
        return (
          <div
            key={index}
            className={`group relative bg-white/[0.02] backdrop-blur-sm border rounded-3xl p-8 transition-all duration-500 hover:-translate-y-2 ${
              plan.ui?.popular
                ? "border-cyan-400/50 bg-white/[0.04] scale-105"
                : "border-white/10 hover:border-white/20"
            }`}
            style={{ animationDelay: `${index * 0.2}s` }}
          >
            {plan.ui?.popular && (
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <div className="bg-gradient-to-r from-cyan-400 to-purple-500 text-black text-xs font-medium px-4 py-2 rounded-full tracking-wider uppercase">
                  Más Popular
                </div>
              </div>
            )}
            <div
              className={`absolute inset-0 bg-gradient-to-br ${plan.ui?.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-3xl`}
            ></div>
            <div className="relative z-10">
              <div className="text-center mb-8">
                <h3 className="font-light text-2xl text-white mb-2 tracking-wide">
                  {plan.name} {isUserPlan ? <span className="text-cyan-400"> - Tu plan actual</span> : null}
                </h3>
              </div>
              <div className="text-center mb-8">
                {plan.price ? (
                  <div>
                    <div className="flex items-baseline justify-center space-x-2">
                      <span className="text-5xl font-light text-white tracking-tight">
                        ${Number(plan.price)}
                      </span>
                      <span className="text-white/60 text-lg">/{plan.period ?? plan.interval ?? "mes"}</span>
                    </div>
                  </div>
                ) : (
                  <div className="text-3xl font-light text-white tracking-tight">
                    Contactanos
                  </div>
                )}
              </div>
              <div className="space-y-4 mb-8">
                {(plan.ui?.features as string[]).map((feature: string, featureIndex: number) => (
                  <div key={featureIndex} className="flex items-start space-x-3">
                    <div className="w-5 h-5 bg-cyan-400/20 rounded-full flex items-center justify-center mt-0.5 flex-shrink-0">
                      <Check className="h-3 w-3 text-cyan-400" />
                    </div>
                    <span className="text-white/80 text-sm leading-relaxed tracking-wide">
                      {feature}
                    </span>
                  </div>
                ))}
              </div>
              <Button
                className={`w-full font-light text-sm tracking-wide px-6 py-3 h-auto rounded-full transition-all duration-300 ${
                  plan.ui?.popular
                    ? "bg-white text-black hover:bg-white/90 hover:scale-105"
                    : "bg-white/10 text-white hover:bg-white/20 border border-white/20 hover:border-white/40"
                } ${isDisabled ? "opacity-50 cursor-not-allowed pointer-events-none" : ""}`}
                onClick={isUserPlan ? () => {
                  router.push("/application/credits");
                } : () => handleCreateCheckout(Number(plan.variantId))}
                disabled={isDisabled}
              >
                {isUserPlan ? "Tu plan" : hasCurrentPlan ? "No disponible" : "Comenzar ahora"}
                <ArrowUpRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
