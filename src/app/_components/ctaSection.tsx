import { ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const CTASection = () => {
  return (
    <section className="py-32 relative overflow-hidden bg-white">
      {/* Large Background Blurs */}
      <div className="absolute inset-0">
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[600px] bg-gradient-to-r from-cyan-100 via-blue-100 to-purple-100 rounded-full blur-3xl"></div>
        <div className="absolute -top-40 -right-40 w-[400px] h-[400px] bg-gradient-to-bl from-purple-100 to-cyan-100 rounded-full blur-3xl animate-pulse"></div>
      </div>

      <div className="max-w-7xl mx-auto px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-center">
          <div className="lg:col-span-8 lg:col-start-3 text-center">
            <h2 className="font-light text-5xl md:text-7xl leading-tight mb-8 tracking-tight">
              <span className="text-black">¿Listo para revolucionar</span>
              <br />
              <span className="bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-600 bg-clip-text text-transparent">
                tu comunicación?
              </span>
            </h2>

            <p className="text-xl mb-16 max-w-3xl mx-auto leading-relaxed font-light tracking-wide text-gray-700">
              Crea tu primer agente de IA en minutos. Automatiza, personaliza y
              escala la comunicación con tus clientes como nunca antes.
            </p>

            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-16">
              <Button
                size="lg"
                className="font-light text-base tracking-wide px-10 py-4 h-auto rounded-full bg-black text-white hover:bg-gray-900 transition-all duration-300 hover:scale-105"
              >
                Comenzar gratis
                <ArrowUpRight className="ml-3 h-5 w-5" />
              </Button>
            </div>

            <div className="flex flex-col sm:flex-row gap-12 justify-center items-center text-center">
              <div>
                <div className="w-2 h-2 bg-cyan-500 rounded-full mx-auto mb-3"></div>
                <div className="text-sm tracking-wider uppercase font-light text-gray-500">
                  Agendar una demo
                </div>
              </div>
              <div>
                <div className="w-2 h-2 bg-purple-500 rounded-full mx-auto mb-3"></div>
                <div className="text-sm tracking-wider uppercase font-light text-gray-500">
                  Sin compromiso
                </div>
              </div>
              <div>
                <div className="w-2 h-2 bg-blue-500 rounded-full mx-auto mb-3"></div>
                <div className="text-sm tracking-wider uppercase font-light text-gray-500">
                  Soporte premium
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CTASection;
