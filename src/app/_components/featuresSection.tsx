import { Bot, GitBranch, Mic, Plug, BarChart, Voicemail } from "lucide-react";

const features = [
  {
    icon: Bot,
    title: "Agentes de Voz y WhatsApp",
    description:
      "Crea y personaliza agentes de IA para automatizar conversaciones en los canales que tus clientes prefieren.",
  },
  {
    icon: GitBranch,
    title: "Constructor de Flujos Visual",
    description:
      "Diseña flujos de conversación complejos sin código. Arrastra, suelta y conecta nodos para crear la lógica perfecta.",
  },
  {
    icon: Mic,
    title: "Voces Humanas y Multilenguaje",
    description:
      "Elige entre una variedad de voces ultra-realistas y configura tus agentes para que hablen en múltiples idiomas.",
  },
  {
    icon: Plug,
    title: "Integraciones Poderosas",
    description:
      "Conecta con Google Calendar, Sheets, Hubspot y más. Envía y recibe datos para enriquecer cada conversación.",
  },
  {
    icon: BarChart,
    title: "Analítica y Chat en Vivo",
    description:
      "Monitorea el rendimiento de tus agentes con analíticas detalladas y toma el control de las conversaciones cuando lo necesites.",
  },
  {
    icon: Voicemail,
    title: "Widget de Voz Web",
    description:
      "Añade un botón de llamada inteligente a tu sitio web y captura leads de forma instantánea.",
  },
];

const FeaturesSection = () => {
  return (
    <section id="features" className="py-32 relative overflow-hidden bg-white">
      {/* Subtle Background Effects */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 right-1/4 w-[400px] h-[400px] bg-gradient-to-br from-blue-500/2 to-cyan-400/2 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 left-1/4 w-[300px] h-[300px] bg-gradient-to-tr from-purple-500/2 to-pink-400/2 rounded-full blur-3xl"></div>
      </div>

      <div className="max-w-7xl mx-auto px-8 relative z-10">
        {/* Asymmetric Header */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 mb-24">
          <div className="lg:col-span-6">
            <h2 className="font-light text-5xl md:text-6xl leading-tight mb-8 tracking-tight">
              <span className="text-black">Una plataforma,</span>
              <br />
              <span className="bg-gradient-to-r from-cyan-500 to-purple-600 bg-clip-text text-transparent">
                múltiples soluciones
              </span>
            </h2>
          </div>
          <div className="lg:col-span-5 lg:col-start-8 flex items-end">
            <p className="text-lg font-light leading-relaxed tracking-wide text-black/60">
              Todas las herramientas que necesitas para automatizar la
              comunicación con tus clientes, de manera eficiente y escalable.
            </p>
          </div>
        </div>

        {/* Features Grid - Asymmetric Layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div
              key={index}
              className="group relative bg-black/[0.015] backdrop-blur-sm border border-black/8 rounded-2xl p-8 hover:bg-black/[0.025] hover:border-black/15 transition-all duration-500 hover:-translate-y-2"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              {/* Subtle glow effect on hover */}
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-400/2 via-transparent to-purple-500/2 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

              <div className="relative z-10">
                <div className="w-12 h-12 bg-gradient-to-br from-cyan-400/12 to-purple-500/12 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                  <feature.icon className="h-6 w-6 text-cyan-500" />
                </div>

                <h3 className="font-light text-xl mb-4 tracking-wide text-black">
                  {feature.title}
                </h3>

                <p className="leading-relaxed font-light text-sm tracking-wide text-black/60">
                  {feature.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
