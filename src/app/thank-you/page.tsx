import { CheckCircle, Mail, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import Link from "next/link"

export default function ThankYouPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
          <CardContent className="p-8 text-center space-y-6">
            {/* Success Icon */}
            <div className="flex justify-center">
              <div className="relative">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
                <div className="absolute inset-0 w-16 h-16 bg-green-200 rounded-full animate-ping opacity-20"></div>
              </div>
            </div>

            {/* Main Content */}
            <div className="space-y-3">
              <h1 className="text-2xl font-bold text-slate-900">Gracias por suscribirte!</h1>
              <p className="text-slate-600 leading-relaxed">
                Gracias por suscribirte. Tu cuenta ha sido creada y ya puedes empezar a usar nuestra plataforma.
              </p>
            </div>

            {/* Action Button */}
            <Link href="/application/dashboard">
            <Button className="w-full bg-slate-900 hover:bg-slate-800 text-white font-medium py-3 rounded-lg transition-all duration-200 group">
              Empezar
              <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
            </Link>
            {/* Support Contact - Subtle */}
            <div className="pt-4 border-t border-slate-100">
              <div className="flex items-center justify-center space-x-2 text-sm text-slate-500">
                <Mail className="w-4 h-4" />
                <span>¿Necesitas ayuda? Contacta con nosotros en</span>
                <a
                  href="mailto:info@karolai.co"
                  className="text-slate-700 hover:text-slate-900 font-medium transition-colors underline decoration-slate-300 hover:decoration-slate-500"
                >
                  info@karolai.co
                </a>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Additional subtle branding */}
        <div className="text-center mt-6">
          <p className="text-slate-400 text-sm">
            <span className="font-semibold text-slate-600">Karolai</span>
          </p>
        </div>
      </div>
    </div>
  )
}
