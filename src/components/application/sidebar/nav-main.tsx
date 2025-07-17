"use client";

import type React from "react";
import {
  Bot,
  ChevronRight,
  LayoutDashboard,
  LucideBotMessageSquare,
  Phone,
  Users,
  Workflow,
  PhoneCall,
  MessageSquare,
  Contact,
  Megaphone,
  PhoneIcon,
  PhoneIncoming,
} from "lucide-react";

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar";

interface NestedMenuItem {
  title: string;
  url: string;
  icon?: React.ElementType;
}

interface SubMenuItem {
  title: string;
  url: string;
  icon?: React.ElementType;
  hasSubmenu?: boolean;
  items?: NestedMenuItem[];
}

interface MenuItem {
  title: string;
  url: string;
  icon?: React.ElementType;
  isActive?: boolean;
  hasSubmenu?: boolean;
  items?: SubMenuItem[];
}

export function NavMain() {
  const chatAgentItems: SubMenuItem = {
    title: "Agentes de chat",
    url: "/application/agents/chat",
    icon: LucideBotMessageSquare,
    hasSubmenu: true,
    items: [
      {
        title: "Agentes",
        url: "/application/agents/chat-agents/agents",
        icon: Bot,
      },
      {
        title: "Contactos",
        url: "/application/agents/chat-agents/contacts",
        icon: Contact,
      },
      {
        title: "Campañas",
        url: "/application/agents/chat-agents/campaign",
        icon: Megaphone,
      },
      {
        title: "Flujos",
        url: "/application/agents/chat-agents/flows",
        icon: Workflow,
      },
      {
        title: "Plantillas",
        url: "/application/agents/chat-agents/templates",
        icon: MessageSquare,
      },
    ],
  };

  const voiceAgentItems: SubMenuItem = {
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
        title: "Flujos",
        url: "/application/agents/voice-agents/workflows",
        icon: Workflow,
      },
      {
        title: "Widgets",
        url: "/application/agents/voice-agents/widgets",
        icon: LucideBotMessageSquare,
      },
    ],
  };

  const agentSubItems = [chatAgentItems];
  agentSubItems.push(voiceAgentItems);

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
      isActive: true,
      items: agentSubItems,
    },
    {
      title: "Números",
      url: "/application/numbers",  
      icon: PhoneIncoming,
    },
    {
      title: "Crm",
      url: "/application/crm",
      icon: Users,
    },
    {
      title: "Historial de llamadas",
      url: "/application/call-history",
      icon: Phone,
    },
  ];

  return (
    <SidebarGroup>
      <SidebarGroupLabel>Plataforma</SidebarGroupLabel>
      <SidebarMenu>
        {items.map((item) =>
          item.items ? (
            <Collapsible
              key={item.title}
              asChild
              defaultOpen={item.isActive}
              className="group/collapsible"
            >
              <SidebarMenuItem>
                <CollapsibleTrigger asChild>
                  <SidebarMenuButton
                    data-tour-id={`tour-${item.title.toLowerCase().replace(/\s+/g, "-")}`}
                    tooltip={item.title}
                  >
                    {item.icon && <item.icon />}
                    <span>{item.title}</span>
                    <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                  </SidebarMenuButton>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <SidebarMenuSub>
                    {item.items.map((subItem) =>
                      subItem.hasSubmenu && subItem.items ? (
                        <Collapsible
                          key={subItem.title}
                          asChild
                          className="group/subcollapsible"
                        >
                          <SidebarMenuSubItem>
                            <CollapsibleTrigger asChild>
                              <SidebarMenuSubButton
                                data-tour-id={`tour-${subItem.title.toLowerCase().replace(/\s+/g, "-")}`}
                              >
                                {subItem.icon && <subItem.icon />}
                                <span>{subItem.title}</span>
                                <ChevronRight className="ml-auto h-4 w-4 transition-transform duration-200 group-data-[state=open]/subcollapsible:rotate-90" />
                              </SidebarMenuSubButton>
                            </CollapsibleTrigger>
                            <CollapsibleContent>
                              <div className="ml-2 mt-1 border-l border-sidebar-border pl-2">
                                {subItem.items.map((nestedItem) => (
                                  <SidebarMenuSubItem key={nestedItem.title}>
                                    <SidebarMenuSubButton
                                      data-tour-id={`tour-${nestedItem.title.toLowerCase().replace(/\s+/g, "-")}`}
                                      asChild
                                      size="sm"
                                    >
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
                          <SidebarMenuSubButton
                            data-tour-id={`tour-${subItem.title.toLowerCase().replace(/\s+/g, "-")}`}
                            asChild
                          >
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
              <SidebarMenuButton
                data-tour-id={`tour-${item.title.toLowerCase().replace(/\s+/g, "-")}`}
                tooltip={item.title}
                asChild
              >
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
  );
}
