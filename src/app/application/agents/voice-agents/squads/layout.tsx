import { SquadProvider } from "@/context/squad-context";
import { Sidebar } from "./_components/sidebar";

export default function SquadsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SquadProvider>
      <div className="flex h-screen w-full overflow-hidden">
        <Sidebar />
        <div className="flex-1 overflow-auto">{children}</div>
      </div>
    </SquadProvider>
  );
} 