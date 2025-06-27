import { Github, Twitter, Linkedin, Mail, ArrowUpRight } from "lucide-react";

const Footer = () => {
  return (
    <footer className="border-t border-black/10 py-24 bg-white text-black">
      <div className="max-w-7xl mx-auto px-8">
        {/* Asymmetric Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 mb-16">
          {/* Brand Section */}
          <div className="lg:col-span-5">
            <div className="font-mono font-light text-2xl tracking-wider mb-6 text-black">
              Nexus<span className="text-cyan-500">AI</span>
            </div>
            <p className="mb-8 max-w-md leading-relaxed font-light tracking-wide text-black/60">
              Redefiniendo los límites de la inteligencia artificial. 
              Precisión, innovación y futuro en cada interacción.
            </p>
            <div className="flex space-x-4">
              {[Twitter, Linkedin, Github, Mail].map((Icon, index) => (
                <a 
                  key={index}
                  href="#" 
                  className="w-10 h-10 bg-black/3 hover:bg-black/8 border border-black/8 hover:border-black/15 rounded-full flex items-center justify-center text-black/60 hover:text-black transition-all duration-300"
                >
                  <Icon size={16} />
                </a>
              ))}
            </div>
          </div>

          {/* Navigation Links */}
          <div className="lg:col-span-6 lg:col-start-7">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-12">
              <div>
                <h3 className="font-light text-sm tracking-wider uppercase mb-6 text-black/40">Producto</h3>
                <ul className="space-y-4">
                  {['Características', 'Precios', 'Integraciones', 'API'].map((item) => (
                    <li key={item}>
                      <a href="#" className="text-black/60 hover:text-black transition-colors duration-300 font-light text-sm tracking-wide flex items-center group">
                        {item}
                        <ArrowUpRight className="ml-1 h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      </a>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h3 className="font-light text-sm tracking-wider uppercase mb-6 text-black/40">Empresa</h3>
                <ul className="space-y-4">
                  {['Nosotros', 'Blog', 'Carreras', 'Contacto'].map((item) => (
                    <li key={item}>
                      <a href="#" className="text-black/60 hover:text-black transition-colors duration-300 font-light text-sm tracking-wide flex items-center group">
                        {item}
                        <ArrowUpRight className="ml-1 h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      </a>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h3 className="font-light text-sm tracking-wider uppercase mb-6 text-black/40">Soporte</h3>
                <ul className="space-y-4">
                  {['Documentación', 'Estado', 'Comunidad', 'Ayuda'].map((item) => (
                    <li key={item}>
                      <a href="#" className="text-black/60 hover:text-black transition-colors duration-300 font-light text-sm tracking-wide flex items-center group">
                        {item}
                        <ArrowUpRight className="ml-1 h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="border-t border-black/10 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-sm mb-4 md:mb-0 font-light tracking-wide text-black/40">
              © 2024 Nexus AI. Construyendo el futuro inteligente.
            </p>
            <div className="flex space-x-8 text-sm">
              {['Privacidad', 'Términos', 'Cookies'].map((item) => (
                <a key={item} href="#" className="text-black/40 hover:text-black/60 transition-colors duration-300 font-light tracking-wide">
                  {item}
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;