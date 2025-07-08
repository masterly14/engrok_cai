import type React from "react";
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
import { getUserCredits, onBoardUser } from "@/actions/user";
import { NavUser } from "./nav-user";
import { ModeToggle } from "@/components/mode-toggle";

export async function AppSidebar({
  ...props
}: React.ComponentProps<typeof Sidebar>) {
  const user = await getUserCredits();
  const userData = await onBoardUser();

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <Team />
      </SidebarHeader>
      <SidebarContent>
        <NavMain />
        {/* Ocultar CreditDisplay cuando el sidebar está colapsado */}
        <div className="group-data-[collapsible=icon]:hidden">
          <CreditDisplay
            amount={user?.amountCredits!}
            maxAmount={user?.initialAmountCredits!}
          />
        </div>
      </SidebarContent>
      <SidebarFooter>
        <SidebarSeparator />
        <div className="flex gap-x-3 items-center">
          <NavUser user={userData?.data} />
          <ModeToggle />
        </div>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}

export default AppSidebar;
