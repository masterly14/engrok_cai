"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "./ui/button";

// Componente temporal mientras se implementa una alternativa a react-joyride
export default function AppTour() {
  const router = useRouter();
  const [showWelcome, setShowWelcome] = useState(false);

  // Lanzamos el mensaje de bienvenida la primera vez que el usuario visita la app.
  useEffect(() => {
    const alreadyDone = localStorage.getItem("app_tour_completed") === "true";
    if (alreadyDone) return;

    // Mostrar mensaje de bienvenida después de un breve delay
    const timer = setTimeout(() => {
      setShowWelcome(true);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  const handleStart = () => {
    localStorage.setItem("app_tour_completed", "true");
    setShowWelcome(false);
    router.push("/application/agents/voice-agents/agents");
  };

  const handleSkip = () => {
    localStorage.setItem("app_tour_completed", "true");
    setShowWelcome(false);
  };

  if (!showWelcome) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-lg p-6 max-w-md mx-4">
        <h2 className="text-xl font-semibold mb-4">¡Bienvenido a Engrok!</h2>
        <p className="text-gray-700 mb-6">
          Ya conoces las secciones principales. Haz clic para ir al dashboard y
          empezar a usar la plataforma.
        </p>
        <div className="flex gap-3">
          <Button variant="outline" onClick={handleSkip} className="flex-1">
            Saltar
          </Button>
          <Button onClick={handleStart} className="flex-1">
            Crear mi primer agente de voz
          </Button>
        </div>
      </div>
    </div>
  );
}
