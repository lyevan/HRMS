import {
  Calendar,
  LayoutDashboard,
  Users,
  UserCheck,
  Settings,
  Building2,
  ClipboardList,
  DollarSign,
  Clock,
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import { Button } from "./ui/button";
import { useUserSessionStore } from "@/store/userSessionStore";

import { useNavigate } from "react-router";

const baseUrl = "/app/admin";

// HRMS Menu items
const items = [
  {
    title: "Dashboard",
    url: baseUrl,
    icon: LayoutDashboard,
  },
  {
    title: "Employees",
    url: `${baseUrl}/employees`,
    icon: Users,
  },
  {
    title: "Attendance",
    url: `${baseUrl}/attendance`,
    icon: Clock,
  },
  {
    title: "Departments",
    url: `${baseUrl}/departments`,
    icon: Building2,
  },
  {
    title: "Payroll",
    url: `${baseUrl}/payroll`,
    icon: DollarSign,
  },
  {
    title: "Requests",
    url: `${baseUrl}/requests`,
    icon: ClipboardList,
  },
  {
    title: "Schedule",
    url: `${baseUrl}/schedule`,
    icon: Calendar,
  },
  {
    title: "Pending Applications",
    url: `${baseUrl}/pending`,
    icon: UserCheck,
  },
];

const adminItems = [
  {
    title: "Settings",
    url: "/admin/settings",
    icon: Settings,
  },
];

export function AppSidebar() {
  const { logout } = useUserSessionStore();
  const navigate = useNavigate();
  return (
    <Sidebar collapsible="icon" className="w-50 overflow-hidden">
      <SidebarContent className="overflow-x-hidden">
        <SidebarGroup></SidebarGroup>
        <SidebarGroup>
          <SidebarGroupLabel>HRMS</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild className="cursor-pointer">
                    <p onClick={() => navigate(item.url)}>
                      <item.icon />
                      <span>{item.title}</span>
                    </p>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarSeparator className="transform -translate-x-2" />
        <SidebarGroup>
          <SidebarGroupLabel>Administration</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {adminItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <a href={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <div className="">
          <Button
            className="text-sm text-muted-foreground hover:underline"
            onClick={logout}
          >
            Logout
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
