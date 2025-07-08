"use client";

import { useState } from "react";
import { Sparkles, Zap, Brain, LucideIcon } from "lucide-react";

interface AIButtonProps {
  variant?: "primary" | "secondary" | "neural";
  children: React.ReactNode;
  icon?: LucideIcon;
  label?: string;
}

export function AIButton({
  variant = "primary",
  children,
  icon,
  label,
}: AIButtonProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isClicked, setIsClicked] = useState(false);

  const handleClick = () => {
    setIsClicked(true);
    setTimeout(() => setIsClicked(false), 200);
    // Aquí puedes agregar la lógica del botón
    console.log("AI Button clicked!");
  };

  const variants = {
    primary: {
      container: `
        relative overflow-hidden
        bg-gradient-to-r from-slate-900 via-purple-900 to-slate-900
        border border-purple-500/30
        hover:border-purple-400/50
        shadow-lg shadow-purple-500/25
        hover:shadow-purple-500/40
      `,
      text: "text-white",
      defaultIcon: Sparkles,
      defaultLabel: "Generate with AI",
    },
    secondary: {
      container: `
        relative overflow-hidden
        bg-gradient-to-r from-gray-900 via-blue-900 to-gray-900
        border border-blue-500/30
        hover:border-blue-400/50
        shadow-lg shadow-blue-500/25
        hover:shadow-blue-500/40
      `,
      text: "text-white",
      defaultIcon: Zap,
      defaultLabel: "AI Assistant",
    },
    neural: {
      container: `
        relative overflow-hidden
        bg-gradient-to-r from-black via-emerald-900 to-black
        border border-emerald-500/30
        hover:border-emerald-400/50
        shadow-lg shadow-emerald-500/25
        hover:shadow-emerald-500/40
      `,
      text: "text-white",
      defaultIcon: Brain,
      defaultLabel: "Neural Network",
    },
  };

  const currentVariant = variants[variant];
  const Icon = icon || currentVariant.defaultIcon;
  const buttonLabel = label || currentVariant.defaultLabel;

  return (
    <button
      className={`
        ${currentVariant.container}
        px-8 py-4 rounded-xl
        font-semibold text-lg
        transition-all duration-300 ease-out
        transform hover:scale-105
        ${isClicked ? "scale-95" : ""}
        group
      `}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleClick}
    >
      {/* Efecto de brillo animado */}
      <div
        className={`
        absolute inset-0 opacity-0 group-hover:opacity-100
        bg-gradient-to-r from-transparent via-white/10 to-transparent
        transform -skew-x-12 -translate-x-full group-hover:translate-x-full
        transition-transform duration-1000 ease-out
      `}
      />

      {/* Partículas flotantes */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className={`
              absolute w-1 h-1 bg-white/30 rounded-full
              animate-pulse
              ${isHovered ? "opacity-100" : "opacity-0"}
              transition-opacity duration-500
            `}
            style={{
              left: `${20 + i * 15}%`,
              top: `${30 + (i % 2) * 40}%`,
              animationDelay: `${i * 0.2}s`,
              animationDuration: `${2 + i * 0.3}s`,
            }}
          />
        ))}
      </div>

      {/* Contenido del botón */}
      <div className="relative flex items-center justify-center gap-3">
        <Icon
          className={`
            w-6 h-6 ${currentVariant.text}
            transition-transform duration-300
            ${isHovered ? "rotate-12 scale-110" : ""}
          `}
        />
        <span className={`${currentVariant.text} relative z-10`}>
          {buttonLabel}
        </span>

        {/* Efecto de carga AI */}
        <div
          className={`
          w-2 h-2 rounded-full bg-current
          ${isHovered ? "animate-ping" : ""}
          transition-all duration-300
        `}
        />
      </div>

      {/* Borde interno brillante */}
      <div
        className={`
        absolute inset-0 rounded-xl
        bg-gradient-to-r from-transparent via-white/5 to-transparent
        opacity-0 group-hover:opacity-100
        transition-opacity duration-300
      `}
      />
    </button>
  );
}
