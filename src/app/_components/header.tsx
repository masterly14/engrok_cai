"use client";
import { Menu, X, ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import Link from "next/link";

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-b border-black/10">
      <div className="max-w-7xl mx-auto px-8 py-6">
        <nav className="flex items-center justify-between">
          <div className="font-mono font-light text-xl tracking-wider text-black">
            Karol<span className="text-cyan-500">AI</span>
          </div>

          <div className="hidden md:flex items-center space-x-12">
            <a
              href="#features"
              className="text-black/70 hover:text-black transition-all duration-300 font-light tracking-wide text-sm"
            >
              Características
            </a>
            <a
              href="#pricing"
              className="text-black/70 hover:text-black transition-all duration-300 font-light tracking-wide text-sm"
            >
              Precios
            </a>
            <a
              href="#about"
              className="text-black/70 hover:text-black transition-all duration-300 font-light tracking-wide text-sm"
            >
              Nosotros
            </a>
            <Link href="/sign-in">
              <Button
                variant="ghost"
                className="font-light border-0 text-sm tracking-wide text-black/70 hover:text-black hover:bg-black/5"
              >
                Iniciar sesión
              </Button>
            </Link>
            <Link href="#pricing">
              <Button className="font-light text-sm tracking-wide px-6 py-2 h-auto rounded-full bg-black text-white hover:bg-black/90">
                Comenzar
                <ArrowUpRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>

          <button
            className="md:hidden text-black/70 hover:text-black"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </nav>

        {isMenuOpen && (
          <div className="md:hidden mt-8 py-6 border-t border-black/10">
            <div className="flex flex-col space-y-6">
              <a
                href="#features"
                className="text-black/70 hover:text-black transition-all duration-300 font-light text-sm tracking-wide"
              >
                Características
              </a>
              <a
                href="#pricing"
                className="text-black/70 hover:text-black transition-all duration-300 font-light text-sm tracking-wide"
              >
                Precios
              </a>
              <a
                href="#about"
                className="text-black/70 hover:text-black transition-all duration-300 font-light text-sm tracking-wide"
              >
                Nosotros
              </a>
              <Button
                variant="ghost"
                className="font-light w-full justify-start px-0 text-black/70 hover:text-black"
              >
                Acceder
              </Button>
              <Button className="font-light w-full rounded-full bg-black text-white hover:bg-black/90">
                Comenzar
                <ArrowUpRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
