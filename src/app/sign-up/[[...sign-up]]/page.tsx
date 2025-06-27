"use client";

import Image from "next/image"
import Link from "next/link"
import { ArrowLeft, Sparkles } from "lucide-react"
import { SignUp } from "@clerk/nextjs"

export default function SignUpPage() {
  // La redirección después del registro siempre será a /validate.
  // La lógica de compra leerá el variantId desde localStorage.
  const afterSignUpUrl = "/validate";
  return (
    <div className="min-h-screen bg-white relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-[600px] h-[400px] bg-gradient-to-r from-cyan-500/5 to-blue-500/5 rounded-full blur-3xl animate-pulse"></div>
        <div
          className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-gradient-to-l from-purple-500/5 to-pink-500/5 rounded-full blur-3xl animate-pulse"
          style={{ animationDelay: "2s" }}
        ></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[800px] h-[200px] bg-gradient-to-r from-cyan-400/3 via-transparent to-purple-500/3 rounded-full blur-3xl"></div>
      </div>

      {/* Geometric Patterns */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-20 left-20 w-32 h-32 border border-black/10 rounded-full animate-float"></div>
        <div
          className="absolute top-40 right-32 w-24 h-24 bg-gradient-to-br from-cyan-400/10 to-purple-500/10 rounded-lg rotate-45 animate-float"
          style={{ animationDelay: "1s" }}
        ></div>
        <div
          className="absolute bottom-32 left-40 w-20 h-20 border-2 border-black/10 rotate-12 animate-float"
          style={{ animationDelay: "3s" }}
        ></div>
        <div
          className="absolute bottom-20 right-20 w-16 h-16 bg-gradient-to-r from-purple-400/10 to-pink-500/10 rounded-full animate-float"
          style={{ animationDelay: "2s" }}
        ></div>
      </div>

      <div className="relative z-10 flex min-h-screen">
        {/* Left Side - Branding */}
        <div className="hidden lg:flex lg:w-1/2 flex-col justify-center items-center p-16 relative">
          {/* Abstract Design Elements */}
          <div className="absolute top-1/4 left-1/4 w-64 h-64 border border-black/5 rounded-full"></div>
          <div className="absolute bottom-1/3 right-1/4 w-48 h-48 bg-gradient-to-br from-cyan-400/5 to-purple-500/5 rounded-3xl rotate-12"></div>

          <div className="text-center space-y-4 relative z-10 flex flex-col items-center justify-center">
            {/* Logo */}
            <Image src="/logo-karolai.jpg" alt="KarolAI" width={500} height={500} className="rounded-full" />

            {/* Company Name */}
              <p className="text-lg text-black/60 font-light max-w-md leading-relaxed">
                Bienvenido de vuelta. Accede a tu cuenta para continuar con tu
                experiencia de IA de próxima generación.
              </p>

            {/* Testimonial */}
            <div className="bg-black/[0.015] backdrop-blur-xl border border-black/8 rounded-2xl p-8 max-w-md mx-auto">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-gradient-to-br from-cyan-400/20 to-purple-500/20 rounded-full flex items-center justify-center">
                  <div className="w-8 h-8 bg-black/10 rounded-full"></div>
                </div>
                <div className="text-left">
                  <p className="text-black text-sm leading-relaxed">
                    "KarolAI transformó completamente nuestros procesos de
                    negocio."
                  </p>
                  <p className="text-black/40 text-xs mt-1">
                    — María González, CEO
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Sign In Form */}
        <div className="w-full lg:w-1/2 flex flex-col">
          {/* Header */}
          <div className="p-8 flex items-center justify-between">
            <Link
              href="/"
              className="flex items-center text-black/60 hover:text-black transition-colors group"
            >
              <ArrowLeft className="h-4 w-4 mr-2 group-hover:-translate-x-1 transition-transform" />
              <span className="text-sm font-light">Volver al inicio</span>
            </Link>
            <div className="lg:hidden">
              <div className="w-10 h-10 bg-gradient-to-br from-cyan-400/20 to-purple-500/20 rounded-xl flex items-center justify-center">
                <Sparkles className="h-5 w-5 text-cyan-400" />
              </div>
            </div>
          </div>

          <div className="w-full flex flex-col items-center justify-center flex-1">
            <div className="glass-effect border-black/10 rounded-2xl p-8 space-y-6 w-full max-w-md mx-auto">
              <div className="text-center space-y-2">
                <h2 className="text-2xl font-light text-black">
                  Registrarse
                </h2>
                <p className="text-black/60 text-sm font-light">
                  Crea una cuenta para continuar
                </p>
              </div>

              {/* Placeholder for Clerk Component */}
              <div className="space-y-4 text-center">
                <div className="bg-cyan-50 border border-cyan-200 rounded-xl p-6">
                  <Sparkles className="h-8 w-8 text-cyan-400 mx-auto mb-4" />
                  <div className="mt-4 p-3 bg-black/5 rounded-lg text-xs text-black/60 font-mono text-left">
                    <SignUp
                      afterSignUpUrl={afterSignUpUrl}
                      appearance={{
                        elements: {
                          rootBox: "w-full",
                          card: "shadow-none bg-transparent border-0",
                          headerTitle: "text-xl font-light text-black",
                          headerSubtitle: "text-sm text-black/60 font-light",
                          formButtonPrimary:
                            "bg-gradient-to-r from-cyan-400 to-purple-500 hover:from-cyan-500 hover:to-purple-600 text-white font-light transition-all duration-300 hover:scale-[1.02] hover:shadow-xl rounded-md",
                          footerAction: "text-sm font-light",
                          formFieldLabel: "text-black/80 font-light",
                          formFieldInput:
                            "glass-effect  rounded-md",
                          socialButtonsBlockButton:
                            "glass-effect border-black/10 hover:border-black/20 text-black font-light",
                          dividerLine: "bg-black/10",
                          dividerText: "text-black/40 font-light",
                          formHeaderTitle: "text-xl font-light text-black",
                          formHeaderSubtitle:
                            "text-sm text-black/60 font-light",
                        },
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
