import React from "react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
  SidebarSeparator,
} from "../../ui/sidebar";
import { Team } from "./team";
import { NavMain } from "./nav-main";
import { CreditDisplay } from "./credit-display";
import { onBoardUser } from "@/actions/user";
import { NavUser } from "./nav-user";
import { ModeToggle } from "@/components/mode-toggle";

export async function AppSidebar({
  ...props
}: React.ComponentProps<typeof Sidebar>) {
  const user = await onBoardUser();
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <Team />
      </SidebarHeader>
      <SidebarContent>
        <NavMain />
        <CreditDisplay
          amount={user?.credits!}
          maxAmount={user?.initialCredits}
        />
      </SidebarContent>
      <SidebarFooter>
        <SidebarSeparator />
        <div className="flex gap-x-3 items-center">
          <NavUser user={user?.data} />
          <ModeToggle />
        </div>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}

export default AppSidebar;
