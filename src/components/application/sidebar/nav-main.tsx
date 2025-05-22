"use client"

import {
  BarChart3,
  Bot,
  ChevronRight,
  LayoutDashboard,
  LucideBotMessageSquare,
  Phone,
  Users,
  Workflow,
} from "lucide-react"

import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar"

interface NestedMenuItem {
  title: string
  url: string
}

interface SubMenuItem {
  title: string
  url: string
  hasSubmenu?: boolean
  items?: NestedMenuItem[]
}

interface MenuItem {
  title: string
  url: string
  icon?: React.ElementType
  isActive?: boolean
  items?: SubMenuItem[]
}

export function NavMain() {
  const items: MenuItem[] = [
    {
      title: "Dashboard",
      url: "/application/dashboard",
      icon: LayoutDashboard,
      isActive: true,
    },
    {
      title: "Agentes",
      url: "/application/agents",
      icon: Bot,
      isActive: false,
      items: [
        {
          title: "Agentes de voz",
          url: "/application/agents/voice",
          hasSubmenu: true,
          items: [
            {
              title: "Todos",
              url: "/application/agents/voice",
            },
            {
              title: "Salientes",
              url: "/application/agents/voice/outbound",
            },
            {
              title: "Entrantes",
              url: "/application/agents/voice/inbound",
            },
          ],
        },
        {
          title: "Agentes de chat",
          url: "/application/agents/chat",
        },
      ],
    },
    {
      title: "Flujos de trabajo",
      url: "/application/workflows",
      icon: Workflow,
      items: [
        {
          title: "Flujos de trabajo",
          url: "/application/workflows",
        },
        {
          title: "Estudio",
          url: "/application/workflow-studio",
        },
      ],
    },
    {
      title: "Crm",
      url: "/application/crm",
      icon: Users,
    },
    {
      title: "Análisis",
      url: "/analytics",
      icon: BarChart3,
    },
    {
      title: "Historial de llamadas",
      url: "/call-history",
      icon: Phone,
    },
  ]

  return (
    <SidebarGroup>
      <SidebarGroupLabel>Plataforma</SidebarGroupLabel>
      <SidebarMenu>
        {items.map((item) =>
          item.items ? (
            <Collapsible key={item.title} asChild defaultOpen={item.isActive} className="group/collapsible">
              <SidebarMenuItem>
                <CollapsibleTrigger asChild>
                  <SidebarMenuButton tooltip={item.title}>
                    {item.icon && <item.icon />}
                    <span>{item.title}</span>
                    <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                  </SidebarMenuButton>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <SidebarMenuSub>
                    {item.items.map((subItem) =>
                      subItem.hasSubmenu ? (
                        <Collapsible key={subItem.title} asChild className="group/subcollapsible">
                          <SidebarMenuSubItem>
                            <CollapsibleTrigger asChild>
                              <SidebarMenuSubButton>
                                <span>{subItem.title}</span>
                                <ChevronRight className="ml-auto h-4 w-4 transition-transform duration-200 group-data-[state=open]/subcollapsible:rotate-90" />
                              </SidebarMenuSubButton>
                            </CollapsibleTrigger>
                            <CollapsibleContent>
                              <div className="ml-2 mt-1 border-l border-sidebar-border pl-2">
                                {subItem.items?.map((nestedItem) => (
                                  <SidebarMenuSubItem key={nestedItem.title}>
                                    <SidebarMenuSubButton asChild size="sm">
                                      <a href={nestedItem.url}>
                                        <span>{nestedItem.title}</span>
                                      </a>
                                    </SidebarMenuSubButton>
                                  </SidebarMenuSubItem>
                                ))}
                              </div>
                            </CollapsibleContent>
                          </SidebarMenuSubItem>
                        </Collapsible>
                      ) : (
                        <SidebarMenuSubItem key={subItem.title}>
                          <SidebarMenuSubButton asChild>
                            <a href={subItem.url}>
                              <span>{subItem.title}</span>
                            </a>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      ),
                    )}
                  </SidebarMenuSub>
                </CollapsibleContent>
              </SidebarMenuItem>
            </Collapsible>
          ) : (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton tooltip={item.title} asChild>
                <a href={item.url}>
                  {item.icon && <item.icon />}
                  <span>{item.title}</span>
                </a>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ),
        )}
      </SidebarMenu>
    </SidebarGroup>
  )
}
