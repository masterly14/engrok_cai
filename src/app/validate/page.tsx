"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { onBoardUser } from "@/actions/user";
import { createCheckoutAction } from "@/actions/lemon-squeezy";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export default function ValidatePage() {
  const router = useRouter();
  const { isLoaded, isSignedIn } = useUser();

  useEffect(() => {
    if (!isLoaded) {
      return; // Esperar a que Clerk esté listo
    }

    if (!isSignedIn) {
      router.push("/sign-in");
      return;
    }

    const handleValidation = async () => {
      try {
        await sleep(2000);

        const variantId = localStorage.getItem("variantId");

        if (!variantId) {
          router.push("/application/dashboard");
          return;
        }

        const user = await onBoardUser();
        if (!user || !user.data) {
          throw new Error("Failed to onboard user.");
        }

        // 2. Verificar si el usuario ya tiene un plan activo
        const plansResponse = await fetch("/api/plans/public").then((r) => r.json());
        const alreadyHasPlan = !!plansResponse.currentPlan;

        if (alreadyHasPlan) {
          toast("Ya cuentas con un plan activo y no puedes adquirir otro en este momento.");
          // Limpiar la intención de compra guardada
          localStorage.removeItem("variantId");
          router.push("/application/dashboard");
          return; // Detener flujo
        }

        // 3. El usuario no tiene plan activo → proceder con la compra
        //    Eliminar variantId para que no se reutilice
        localStorage.removeItem("variantId");

        // 4. Crear el checkout y redirigir
        console.log(`User validated, creating checkout for variant ${variantId}...`);
        const checkoutUrl = await createCheckoutAction(user.data.id, Number(variantId));
        window.location.href = checkoutUrl;
      } catch (error) {
        console.error("Validation or checkout failed:", error);
        router.push("/"); // En caso de cualquier error, ir a la página principal.
      }
    };

    handleValidation();
  }, [isLoaded, isSignedIn, router]);

  return (
    <div className="flex h-screen w-full items-center justify-center bg-background">
      <div className="flex flex-col items-center space-y-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="text-muted-foreground">Validando tu cuenta y preparando tu espacio...</p>
      </div>
    </div>
  );
}
