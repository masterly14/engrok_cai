"use client"

import type React from "react"

import {
  Bot,
  ChevronRight,
  LayoutDashboard,
  LucideBotMessageSquare,
  Phone,
  Users,
  Workflow,
  Wrench,
  PhoneCall,
  BarChart3,
  MessageSquare,
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
  icon?: React.ElementType
}

interface SubMenuItem {
  title: string
  url: string
  icon?: React.ElementType
  hasSubmenu?: boolean
  items?: NestedMenuItem[]
}

interface MenuItem {
  title: string
  url: string
  icon?: React.ElementType
  isActive?: boolean
  hasSubmenu?: boolean
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
          title: "Agentes de chat",
          url: "/application/agents/chat",
          icon: LucideBotMessageSquare,
          items: [
            {
              title: "Lineas WhatsApp",
              url: "/application/agents/chat/whatsapp-lines",
              icon: Phone,
            },
            {
              title: "Flujos",
              url: "/application/agents/chat/workflows",
              icon: Workflow,
            },
            {
              title: "Chat",
              url: "/application/agents/chat/interface-chat",
              icon: MessageSquare,
            }
          ]
        },
        {
          title: "Agentes de voz",
          url: "/application/agents/voice",
          icon: PhoneCall,
          hasSubmenu: true,
          items: [
            {
              title: "Agentes",
              url: "/application/agents/voice-agents/agents",
              icon: Bot,
            },
            {
              title: "Números de teléfono",
              url: "/application/agents/voice-agents/numbers",
              icon: Phone,
            },
            {
              title: "Tools",
              url: "/application/agents/voice-agents/tools",
              icon: Wrench,
            },
            {
              title: "Flujos",
              url: "/application/agents/voice-agents/workflows",
              icon: Workflow,
            },
          ],
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
      url: "/application/analytics",
      icon: BarChart3,
    },
    {
      title: "Historial de llamadas",
      url: "/application/call-history",
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
                      subItem.hasSubmenu && subItem.items ? (
                        <Collapsible key={subItem.title} asChild className="group/subcollapsible">
                          <SidebarMenuSubItem>
                            <CollapsibleTrigger asChild>
                              <SidebarMenuSubButton>
                                {subItem.icon && <subItem.icon />}
                                <span>{subItem.title}</span>
                                <ChevronRight className="ml-auto h-4 w-4 transition-transform duration-200 group-data-[state=open]/subcollapsible:rotate-90" />
                              </SidebarMenuSubButton>
                            </CollapsibleTrigger>
                            <CollapsibleContent>
                              <div className="ml-2 mt-1 border-l border-sidebar-border pl-2">
                                {subItem.items.map((nestedItem) => (
                                  <SidebarMenuSubItem key={nestedItem.title}>
                                    <SidebarMenuSubButton asChild size="sm">
                                      <a href={nestedItem.url}>
                                        {nestedItem.icon && <nestedItem.icon />}
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
                              {subItem.icon && <subItem.icon />}
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
