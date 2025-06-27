'use client'
import { useEffect, useState, useRef } from "react";
import { Users, Zap, TrendingUp, Clock } from "lucide-react";

const stats = [
  {
    icon: Users,
    value: 50000,
    suffix: "+",
    label: "Conversaciones/mes",
    description: "Gestionadas por nuestros agentes de IA"
  },
  {
    icon: Zap,
    value: 90,
    suffix: "%",
    label: "Tasa de Resolución",
    description: "En el primer contacto, sin intervención humana"
  },
  {
    icon: TrendingUp,
    value: 40,
    suffix: "%",
    label: "Reducción de Costos",
    description: "En operaciones de soporte y atención"
  },
  {
    icon: Clock,
    value: 1000,
    suffix: "+",
    label: "Horas Ahorradas",
    description: "En tareas manuales y repetitivas cada mes"
  }
];

const AnimatedCounter = ({ end, duration = 2000, suffix = "" }: { end: number; duration?: number; suffix?: string }) => {
  const [count, setCount] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !isVisible) {
          setIsVisible(true);
        }
      },
      { threshold: 0.1 }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, [isVisible]);

  useEffect(() => {
    if (!isVisible) return;

    let startTime: number;
    let animationFrame: number;

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      setCount(end * easeOutQuart);

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      }
    };

    animationFrame = requestAnimationFrame(animate);

    return () => cancelAnimationFrame(animationFrame);
  }, [isVisible, end, duration]);

  return (
    <div ref={ref} className="text-4xl md:text-5xl font-light tracking-tight text-black">
      {Math.floor(count).toLocaleString()}{suffix}
    </div>
  );
};

const StatsSection = () => {
  return (
    <section className="py-32 relative overflow-hidden bg-white">
      {/* Background Effects */}
      <div className="absolute inset-0">
        <div className="absolute top-0 left-1/4 w-[300px] h-[300px] bg-gradient-to-br from-blue-500/2 to-cyan-400/2 rounded-full blur-3xl animate-float"></div>
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-gradient-to-tl from-purple-500/2 to-pink-400/2 rounded-full blur-3xl animate-float" style={{animationDelay: '3s'}}></div>
      </div>

      <div className="max-w-7xl mx-auto px-8 relative z-10">
        {/* Header */}
        <div className="text-center mb-20">
          <h2 className="font-light text-5xl md:text-6xl leading-tight mb-8 tracking-tight">
            <span className="text-black">Resultados que</span>
            <br />
            <span className="bg-gradient-to-r from-cyan-500 to-purple-600 bg-clip-text text-transparent">
              generan impacto
            </span>
          </h2>
          <p className="text-lg text-black/60 font-light max-w-2xl mx-auto leading-relaxed tracking-wide">
            Nuestra tecnología en acción, reflejada en números reales de nuestros clientes.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {stats.map((stat, index) => (
            <div
              key={index}
              className="group text-center p-8 bg-black/[0.015] backdrop-blur-sm border border-black/8 rounded-2xl hover:bg-black/[0.025] hover:border-black/15 transition-all duration-500 hover:-translate-y-2"
              style={{animationDelay: `${index * 0.1}s`}}
            >
              {/* Icon */}
              <div className="w-16 h-16 bg-gradient-to-br from-cyan-400/12 to-purple-500/12 rounded-xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                <stat.icon className="h-8 w-8 text-cyan-500" />
              </div>

              {/* Counter */}
              <AnimatedCounter 
                end={stat.value} 
                suffix={stat.suffix}
                duration={2000 + index * 200}
              />

              {/* Label */}
              <div className="font-light text-lg mb-2 tracking-wide text-black">
                {stat.label}
              </div>

              {/* Description */}
              <div className="text-sm leading-relaxed tracking-wide text-black/60">
                {stat.description}
              </div>

              {/* Glow effect on hover */}
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-400/2 via-transparent to-purple-500/2 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default StatsSection;