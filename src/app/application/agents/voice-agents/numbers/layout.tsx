import { PhoneNumberProvider } from "@/context/number-context";
import { Sidebar } from "./_components/sidebar";

export default function PhoneNumbersLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <PhoneNumberProvider>
      <div className="flex h-screen w-full overflow-hidden">
        <Sidebar />
        <div className="flex-1 overflow-auto">
          {children}
        </div>
      </div>
    </PhoneNumberProvider>
  );
}
