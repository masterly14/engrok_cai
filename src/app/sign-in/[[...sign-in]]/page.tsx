import { SignIn } from "@clerk/nextjs"
import Image from "next/image"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

export default function SignInPage() {
  return (
    <div className="relative flex min-h-screen flex-col md:flex-row bg-gradient-to-b from-slate-900 to-slate-800">
      {/* Background pattern global */}
      <div className="absolute inset-0 -z-10 opacity-20">
        <Image
          src="/bg-log-in.svg"
          alt="Background pattern"
          fill
          className="object-cover"
          priority
        />
      </div>

      {/* Branding Column */}
      <div className="hidden w-full md:flex md:w-1/2 md:flex-col md:items-center md:justify-center">
        <div className="z-10 flex flex-col items-center justify-center px-8 text-center">
          <div className="mb-6 rounded-full p-2">
            <Image
              src="/engrok-icon-theme-black.png"
              alt="Company logo"
              width={80}
              height={80}
              className="h-full w-full object-contain rounded-full"
            />
          </div>
          <h1 className="mb-4 text-3xl font-bold text-white">Welcome Back</h1>
          <p className="max-w-md text-slate-300">
            Sign in to your account to access your dashboard, manage your settings, and view your analytics.
          </p>
          <div className="mt-12">
            <div className="flex flex-col items-center space-y-4">
              <div className="flex items-center space-x-4">
                <div className="h-10 w-10 overflow-hidden rounded-full bg-white">
                  <Image
                    src="/placeholder.svg?height=100&width=100"
                    alt="User testimonial"
                    width={40}
                    height={40}
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="text-left">
                  <p className="text-sm text-white">"This platform has transformed how we manage our business."</p>
                  <p className="text-xs text-slate-400">— Sarah Johnson, CEO</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sign In Column */}
      <div className="flex w-full flex-col md:w-1/2">
        <div className="flex items-center p-4 md:p-6">
          <Link href="/" className="flex items-center text-sm text-slate-300 hover:text-white">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to home
          </Link>
        </div>
        <div className="flex flex-1 flex-col items-center justify-center px-4 py-8 sm:px-6 md:px-8 lg:px-12 xl:px-16">
          <div className="mb-6 block md:hidden text-white">
            <h1 className="text-2xl font-bold">Welcome Back</h1>
            <p className="text-sm text-slate-300">Sign in to your account</p>
          </div>

          <div className="w-full max-w-md">
            <SignIn
              appearance={{
                elements: {
                  rootBox: "w-full",
                  card: "shadow-none bg-white/90 backdrop-blur-sm",
                  headerTitle: "text-xl font-semibold",
                  headerSubtitle: "text-sm text-slate-600",
                  formButtonPrimary: "bg-slate-900 hover:bg-slate-800",
                  footerAction: "text-sm",
                  formFieldLabel: "text-sm font-medium text-slate-700",
                  formFieldInput: "rounded-md border-slate-300 focus:border-slate-500 focus:ring-slate-500",
                },
              }}
            />
          </div>

          <div className="mt-8 text-center text-sm text-slate-300">
            <p>
              Need help?{" "}
              <Link href="/support" className="font-medium text-white hover:underline">
                Contact support
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
