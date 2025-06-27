import { ArrowUpRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

const HeroSection = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-white">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -left-40 w-[800px] h-[800px] bg-gradient-to-br from-blue-500/6 via-cyan-400/6 to-purple-600/6 rounded-full blur-3xl animate-pulse"></div>
        <div
          className="absolute -bottom-40 -right-40 w-[600px] h-[600px] bg-gradient-to-tl from-purple-500/5 via-pink-500/5 to-blue-400/5 rounded-full blur-3xl animate-pulse"
          style={{ animationDelay: "2s" }}
        ></div>
        <div
          className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-gradient-to-r from-cyan-400/4 to-blue-500/4 rounded-full blur-3xl animate-pulse"
          style={{ animationDelay: "4s" }}
        ></div>
      </div>

      <div className="absolute inset-0 opacity-[0.01]">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `
            linear-gradient(rgba(0, 0, 0, 0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0, 0, 0, 0.03) 1px, transparent 1px)
          `,
            backgroundSize: "100px 100px",
          }}
        ></div>
      </div>

      <div className="max-w-7xl mx-auto px-8 py-32 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-center">
          <div className="lg:col-span-7 lg:col-start-1">
            <div className="inline-flex items-center px-4 py-2 bg-black/3 backdrop-blur-sm border border-black/8 rounded-full text-xs font-light mb-12 tracking-wider text-black/70">
              <Sparkles className="w-3 h-3 mr-2 text-cyan-500" />
              AGENTES DE VOZ Y WHATSAPP CON IA
            </div>

            <h1 className="font-light text-6xl md:text-8xl leading-[0.9] mb-8 tracking-tight">
              <span className="text-black">Automatiza la</span>
              <br />
              <span className="bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-600 bg-clip-text text-transparent">
                comunicación
              </span>
              <br />
              <span className="text-5xl md:text-6xl text-black/60">
                con tus clientes
              </span>
            </h1>

            <p className="text-lg md:text-xl mb-16 max-w-2xl leading-relaxed font-light tracking-wide text-black/60">
              Crea agentes de IA para WhatsApp y teléfono con flujos
              personalizados, voces ultra-realistas e integraciones con tus
              herramientas favoritas.
            </p>

            <div className="flex flex-col sm:flex-row gap-6 items-start">
              <Link href="#pricing">
                <Button className="font-light text-sm tracking-wide px-8 py-3 h-auto rounded-full bg-black text-white hover:bg-black/90 transition-all duration-300 hover:scale-105">
                  Comenzar gratis
                  <ArrowUpRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>

          <div className="lg:col-span-4 lg:col-start-9">
            <div className="space-y-12">
              <div className="text-right">
                <div className="text-4xl font-light mb-2 tracking-tight text-black">
                  WhatsApp y Voz
                </div>
                <div className="text-sm tracking-wider uppercase text-black/40">
                  Canales
                </div>
              </div>
              <div className="text-right">
                <div className="text-4xl font-light text-cyan-500 mb-2 tracking-tight">
                  Human-Like
                </div>
                <div className="text-sm tracking-wider uppercase text-black/40">
                  Voces
                </div>
              </div>
              <div className="text-right">
                <div className="text-4xl font-light text-purple-500 mb-2 tracking-tight">
                  Fácil
                </div>
                <div className="text-sm tracking-wider uppercase text-black/40">
                  Integración
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-white via-white/50 to-transparent"></div>
    </section>
  );
};

export default HeroSection;
