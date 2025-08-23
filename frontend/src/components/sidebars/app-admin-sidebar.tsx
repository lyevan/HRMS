import {
  LayoutDashboard,
  Users,
  Settings,
  ClipboardList,
  DollarSign,
  Clock,
  ChevronRight,
  Network,
  BriefcaseBusiness,
  UserCog,
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  // SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
// import { Button } from "../ui/button";
import { useUserSessionStore } from "@/store/userSessionStore";
import { useNavigate, useLocation } from "react-router";

const baseUrl = "/app/admin";

// HRMS Menu items
const items = [
  {
    title: "Dashboard",
    url: `${baseUrl}/dashboard`,
    icon: LayoutDashboard,
  },
  {
    title: "Employees",
    children: [
      {
        title: "Dashboard",
        url: `${baseUrl}/emp/dashboard`,
        icon: LayoutDashboard,
      },
      {
        title: "Management",
        url: `${baseUrl}/emp/management`,
        icon: UserCog,
      },
      {
        title: "Organization",
        url: `${baseUrl}/emp/organization`,
        icon: Network,
      },
    ],
    icon: Users,
  },
  {
    title: "Timekeeping",
    children: [
      {
        title: "Dashboard",
        url: `${baseUrl}/tk/dashboard`,
        icon: LayoutDashboard,
      },
      {
        title: "Attendance List",
        url: `${baseUrl}/tk/attendance-list`,
        icon: Clock,
      },
      {
        title: "Leave Requests",
        url: `${baseUrl}/tk/leave-requests`,
        icon: ClipboardList,
      },
    ],
    icon: Clock,
  },
  {
    title: "Payroll",
    url: `${baseUrl}/payroll`,
    icon: DollarSign,
  },
  {
    title: "ATS",
    children: [
      {
        title: "Job Postings",
        url: `${baseUrl}/ats/jobs`,
        icon: ClipboardList,
      },
      {
        title: "Applications",
        url: `${baseUrl}/ats/applications`,
        icon: Users,
      },
    ],
    icon: BriefcaseBusiness,
  },
  {
    title: "Reports",
    url: `${baseUrl}/reports`,
    icon: ClipboardList,
  },
];

const adminItems = [
  {
    title: "Settings",
    url: `${baseUrl}/settings`,
    icon: Settings,
  },
];

export function AppAdminSidebar() {
  const { user } = useUserSessionStore();
  const navigate = useNavigate();
  const location = useLocation();

  if (user?.role === "admin") {
    return (
      <Sidebar collapsible="icon">
        <SidebarContent className="overflow-x-hidden h-screen">
          <SidebarGroup></SidebarGroup>
          <SidebarGroup>
            <SidebarGroupLabel>HRMS</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {items.map((item) => {
                  const isActive = location.pathname === item.url;
                  const hasChildren = item.children && item.children.length > 0;
                  const hasChildActive = item.children?.some(
                    (child) => location.pathname === child.url
                  );

                  if (hasChildren) {
                    return (
                      <Collapsible
                        key={item.title}
                        className={`group/collapsible ${
                          hasChildActive ? "bg-primary/3 rounded-lg" : ""
                        }`}
                        defaultOpen={hasChildActive}
                      >
                        <SidebarMenuItem>
                          <CollapsibleTrigger asChild>
                            <SidebarMenuButton className="cursor-pointer font-[Lato] font-normal">
                              <item.icon
                                className={
                                  hasChildActive
                                    ? "text-primary"
                                    : "text-sidebar-foreground"
                                }
                              />
                              <span>{item.title}</span>
                              <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                            </SidebarMenuButton>
                          </CollapsibleTrigger>
                          <CollapsibleContent>
                            <SidebarMenuSub>
                              {item.children.map((child) => {
                                const isChildActive =
                                  location.pathname === child.url;
                                return (
                                  <SidebarMenuSubItem
                                    key={child.title}
                                    className="relative"
                                  >
                                    <SidebarMenuButton
                                      asChild
                                      className={`cursor-pointer w-full ${
                                        isChildActive ? "bg-primary/10" : ""
                                      }`}
                                    >
                                      <div
                                        onClick={() =>
                                          navigate(child.url || "")
                                        }
                                        className="flex items-center gap-2 w-full font-[Lato] font-normal"
                                      >
                                        {isChildActive && (
                                          <span className="bg-primary h-full w-1.5 absolute -left-0.75 rounded-r" />
                                        )}
                                        <child.icon
                                          className={`h-4 w-4 ${
                                            isChildActive
                                              ? "text-primary"
                                              : "text-sidebar-foreground"
                                          }`}
                                        />
                                        <span>{child.title}</span>
                                      </div>
                                    </SidebarMenuButton>
                                  </SidebarMenuSubItem>
                                );
                              })}
                            </SidebarMenuSub>
                          </CollapsibleContent>
                        </SidebarMenuItem>
                      </Collapsible>
                    );
                  } else {
                    return (
                      <SidebarMenuItem key={item.title} className="relative">
                        <SidebarMenuButton
                          asChild
                          className={`cursor-pointer rounded-l-none hover:bg-primary/10 ${
                            isActive ? "bg-primary/10" : ""
                          }`}
                        >
                          <div
                            onClick={() => navigate(item.url ? item.url : "")}
                            className="flex items-center gap-2 w-full font-[Lato] font-normal"
                          >
                            {isActive && (
                              <span className="bg-primary h-full w-1.5 absolute -left-0.75 rounded-r">
                                {" "}
                              </span>
                            )}
                            <item.icon
                              className={`h-4 w-4 ${
                                isActive
                                  ? "text-primary"
                                  : "text-sidebar-foreground"
                              }`}
                            />
                            <span>{item.title}</span>
                          </div>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  }
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
          <SidebarSeparator className="transform -translate-x-2" />
          <SidebarGroup>
            <SidebarGroupLabel>Administration</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {adminItems.map((item) => {
                  const isActive = location.pathname === item.url;
                  return (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton
                        asChild
                        className={`cursor-pointer rounded-l-none hover:bg-primary/10 ${
                          isActive ? "bg-primary/10" : ""
                        }`}
                      >
                        <div
                          onClick={() => navigate(item.url ? item.url : "")}
                          className="flex items-center gap-2 w-full font-[Lato] font-normal"
                        >
                          {isActive && (
                            <span className="bg-primary h-full w-1.5 absolute -left-0.75 rounded-r">
                              {" "}
                            </span>
                          )}
                          <item.icon />
                          <span>{item.title}</span>
                        </div>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        {/* <SidebarFooter>
          <div className="">
            <SidebarMenuButton
              className="text-sm text-muted-foreground hover:underline"
              onClick={logout}
            >
              Logout
            </SidebarMenuButton>
          </div>
        </SidebarFooter> */}
      </Sidebar>
    );
  }
}
