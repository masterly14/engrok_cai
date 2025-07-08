"use client";
import { Star, Quote } from "lucide-react";
import { useState, useEffect } from "react";

const testimonials = [
  {
    name: "Lucía Fernández",
    role: "Directora de Operaciones",
    company: "InmoGlobal",
    image: "/placeholder.svg",
    content:
      "Implementamos KarolAI y automatizamos el 80% de nuestras consultas por WhatsApp. Nuestro equipo ahora se enfoca en cierres de ventas. Increíble.",
    rating: 5,
    metrics: "+40% Agendamientos",
  },
  {
    name: "Javier Ríos",
    role: "CTO, CreceLibre",
    company: "CreceLibre SaaS",
    image: "/placeholder.svg",
    content:
      "El constructor de flujos nos permitió crear un agente de voz para calificación de leads que funciona 24/7. La calidad de las voces es impresionante.",
    rating: 5,
    metrics: "Costo por lead -60%",
  },
  {
    name: "Sofía Vega",
    role: "Gerente de Marketing",
    company: "ModaFly",
    image: "/placeholder.svg",
    content:
      "Las campañas de WhatsApp son un cambio de juego. Alcanzamos a miles de clientes en minutos con mensajes personalizados y relevantes.",
    rating: 5,
    metrics: "+25% Tasa de Compra",
  },
];

const TestimonialsSection = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setIsAnimating(true);
      setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % testimonials.length);
        setIsAnimating(false);
      }, 300);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  return (
    <section className="py-32 bg-white relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0">
        <div className="absolute top-1/3 left-1/3 w-[500px] h-[300px] bg-gradient-to-r from-cyan-500/4 to-blue-500/4 rounded-full blur-3xl animate-pulse"></div>
        <div
          className="absolute bottom-1/3 right-1/3 w-[400px] h-[400px] bg-gradient-to-l from-purple-500/4 to-pink-500/4 rounded-full blur-3xl animate-pulse"
          style={{ animationDelay: "2s" }}
        ></div>
      </div>

      <div className="max-w-7xl mx-auto px-8 relative z-10">
        {/* Header */}
        <div className="text-center mb-20">
          <h2 className="font-light text-5xl md:text-6xl leading-tight mb-8 tracking-tight">
            <span className="text-black">Lo que dicen</span>
            <br />
            <span className="bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent">
              nuestros clientes
            </span>
          </h2>
          <p className="text-lg text-black/60 font-light max-w-2xl mx-auto leading-relaxed tracking-wide">
            Líderes de la industria comparten cómo KarolAI revolucionó la
            comunicación con sus clientes.
          </p>
        </div>

        {/* Testimonial Card */}
        <div className="max-w-4xl mx-auto">
          <div
            className={`transition-all duration-500 ${isAnimating ? "opacity-0 transform scale-95" : "opacity-100 transform scale-100"}`}
          >
            <div className="bg-black/[0.015] backdrop-blur-xl border border-black/8 rounded-3xl p-12 relative overflow-hidden">
              {/* Quote Icon */}
              <div className="absolute top-8 right-8 opacity-10">
                <Quote className="h-16 w-16 text-cyan-400" />
              </div>

              {/* Stars */}
              <div className="flex space-x-1 mb-8 justify-center">
                {[...Array(testimonials[currentIndex].rating)].map((_, i) => (
                  <Star
                    key={i}
                    className="h-5 w-5 text-yellow-400 fill-current animate-pulse"
                    style={{ animationDelay: `${i * 0.1}s` }}
                  />
                ))}
              </div>

              {/* Content */}
              <blockquote className="text-2xl md:text-3xl font-light text-black text-center leading-relaxed mb-12 tracking-wide">
                "{testimonials[currentIndex].content}"
              </blockquote>

              {/* Author Info */}
              <div className="flex items-center justify-center space-x-6">
                <div className="w-16 h-16 bg-gradient-to-br from-cyan-400/20 to-purple-500/20 rounded-full flex items-center justify-center border border-black/10">
                  <div className="w-12 h-12 bg-black/10 rounded-full"></div>
                </div>
                <div className="text-center">
                  <div className="text-black font-light text-lg">
                    {testimonials[currentIndex].name}
                  </div>
                  <div className="text-black/60 text-sm">
                    {testimonials[currentIndex].role}
                  </div>
                  <div className="text-cyan-400 text-sm font-mono">{`en ${testimonials[currentIndex].company}`}</div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-light text-cyan-400">
                    {testimonials[currentIndex].metrics}
                  </div>
                  <div className="text-black/40 text-xs uppercase tracking-wider">
                    Mejora
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Navigation Dots */}
          <div className="flex justify-center space-x-3 mt-12">
            {testimonials.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={`w-3 h-3 rounded-full transition-all duration-300 ${
                  index === currentIndex
                    ? "bg-cyan-400 scale-125"
                    : "bg-black/20 hover:bg-black/40"
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;
