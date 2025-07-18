import { ReactNode } from "react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import AppSidebar from "@/components/application/sidebar/app-sidebar";
import { NotificationBell } from "@/components/application/notification-bell";
import VoiceWidgetEmbed from "@/components/voice-widget-embed";

export default async function ApplicationLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center justify-between gap-2 pr-4 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
          <div className="flex items-center gap-2 px-4">
            <div className="flex items-center gap-2">
              <SidebarTrigger className="-ml-1" />
              <p className="text-sm font-medium text-gray-500">
                Workspace 9f4b5e38-3d8f-4c2a-90ec-1f073bafaf76
              </p>
            </div>
            <Separator orientation="vertical" className="mr-2 h-4" />
          </div>
          <NotificationBell />
        </header>
        <div className="h-[calc(100vh-4rem)]">{children}</div>
        {/* Widget de voz global */}
        <VoiceWidgetEmbed agentId={process.env.NEXT_PUBLIC_ELEVENLABS_REFERENCE_WIDGET_ID} />
      </SidebarInset>
    </SidebarProvider>
  );
}
