import { Building2, Stethoscope, GraduationCap, ShoppingCart, Factory, Briefcase } from "lucide-react";

const industries = [
  {
    icon: Building2,
    name: "Fintech",
    description: "Automatiza recordatorios de pago, verifica la identidad de clientes y ofrece soporte 24/7 sobre productos financieros.",
    benefits: ["Reduce la morosidad", "Autenticación segura", "Soporte 24/7"],
    gradient: "from-green-400/20 to-emerald-500/20"
  },
  {
    icon: Stethoscope,
    name: "Salud",
    description: "Confirma citas, envía recordatorios de medicación y resuelve preguntas frecuentes, liberando al personal para atención crítica.",
    benefits: ["Reduce inasistencias", "Mejora la adherencia", "Atención inmediata"],
    gradient: "from-blue-400/20 to-cyan-500/20"
  },
  {
    icon: GraduationCap,
    name: "Educación",
    description: "Gestiona inscripciones, envía notificaciones académicas y ofrece soporte a estudiantes a cualquier hora del día.",
    benefits: ["Automatiza admisiones", "Comunicación masiva", "Soporte estudiantil 24/7"],
    gradient: "from-purple-400/20 to-violet-500/20"
  },
  {
    icon: ShoppingCart,
    name: "E-commerce",
    description: "Recupera carritos abandonados, confirma pedidos, gestiona devoluciones y ofrece soporte post-venta de forma automática.",
    benefits: ["Recupera ventas +20%", "Logística automatizada", "Mejora la satisfacción"],
    gradient: "from-orange-400/20 to-red-500/20"
  },
  {
    icon: Factory,
    name: "Inmobiliaria",
    description: "Califica leads, agenda visitas y da seguimiento a clientes potenciales de forma instantánea y personalizada.",
    benefits: ["Calificación automática", "Agenda 24/7", "Seguimiento constante"],
    gradient: "from-gray-400/20 to-slate-500/20"
  },
  {
    icon: Briefcase,
    name: "Agencias",
    description: "Ofrece servicios de automatización a tus clientes y gestiona múltiples cuentas desde una sola plataforma.",
    benefits: ["Nuevo flujo de ingresos", "Gestiona multi-cliente", "Servicios de IA"],
    gradient: "from-indigo-400/20 to-blue-500/20"
  }
];

const IndustriesSection = () => {
  return (
    <section className="py-32 bg-black relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 right-1/4 w-[600px] h-[400px] bg-gradient-to-br from-cyan-500/5 via-blue-500/5 to-purple-600/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 left-1/4 w-[500px] h-[500px] bg-gradient-to-tr from-purple-500/5 to-pink-400/5 rounded-full blur-3xl"></div>
      </div>

      <div className="max-w-7xl mx-auto px-8 relative z-10">
        {/* Header */}
        <div className="text-center mb-20">
          <h2 className="font-light text-5xl md:text-6xl leading-tight mb-8 tracking-tight">
            <span className="text-white">Para todas</span>
            <br />
            <span className="bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent">
              las industrias
            </span>
          </h2>
          <p className="text-lg text-white/60 font-light max-w-3xl mx-auto leading-relaxed tracking-wide">
            Desde startups hasta grandes corporaciones, KarolAI impulsa la comunicación inteligente en cada sector.
          </p>
        </div>

        {/* Industries Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {industries.map((industry, index) => (
            <div
              key={index}
              className="group relative bg-white/[0.02] backdrop-blur-sm border border-white/10 rounded-2xl p-8 hover:bg-white/[0.04] hover:border-white/20 transition-all duration-500 hover:-translate-y-2 overflow-hidden"
              style={{animationDelay: `${index * 0.1}s`}}
            >
              {/* Background Gradient */}
              <div className={`absolute inset-0 bg-gradient-to-br ${industry.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl`}></div>
              
              <div className="relative z-10">
                {/* Icon */}
                <div className={`w-16 h-16 bg-gradient-to-br ${industry.gradient} rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                  <industry.icon className="h-8 w-8 text-white" />
                </div>

                {/* Title */}
                <h3 className="font-light text-2xl text-white mb-4 tracking-wide">
                  {industry.name}
                </h3>

                {/* Description */}
                <p className="text-white/60 leading-relaxed font-light text-sm tracking-wide mb-6">
                  {industry.description}
                </p>

                {/* Benefits */}
                <div className="space-y-2">
                  {industry.benefits.map((benefit, benefitIndex) => (
                    <div key={benefitIndex} className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-cyan-400 rounded-full flex-shrink-0"></div>
                      <span className="text-white/80 text-sm font-light tracking-wide">{benefit}</span>
                    </div>
                  ))}
                </div>

                {/* Hover Arrow */}
                
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default IndustriesSection;