import {
  LayoutDashboard,
  Users,
  Settings,
  // ClipboardList,
  DollarSign,
  Clock,
  ChevronRight,
  Network,
  UserCog,
  ClipboardClock,
  FileClock,
  ListTodo,
  FileSpreadsheet,
  // Shredder,
  CalendarClock,
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

// Types for menu structure
interface MenuItemType {
  title: string;
  url?: string;
  icon: React.ComponentType<any>;
  children?: MenuItemType[];
}

// Utility function to check if any nested child is active
const hasActiveChild = (
  children: MenuItemType[],
  pathname: string
): boolean => {
  return children.some(
    (child) =>
      child.url === pathname ||
      (child.children && hasActiveChild(child.children, pathname))
  );
};

// HRMS Menu items
const items: MenuItemType[] = [
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
        title: "Shift Management",
        url: `${baseUrl}/tk/shift-management`,
        icon: CalendarClock,
      },
      {
        title: "Timesheet Management",
        icon: ClipboardClock,
        children: [
          {
            title: "Raw Timesheet",
            url: `${baseUrl}/tk/tm/raw-timesheet`,
            icon: FileClock,
          },
          {
            title: "Filing and Approval",
            url: `${baseUrl}/tk/tm/filing-and-approval`,
            icon: ListTodo,
          },
          {
            title: "Processing Timesheet",
            url: `${baseUrl}/tk/tm/processing-timesheet`,
            icon: FileSpreadsheet,
          },
          // {
          //   title: "Deleted Logs",
          //   url: `${baseUrl}/tk/tm/deleted-logs`,
          //   icon: Shredder,
          // },
        ],
      },
    ],
    icon: Clock,
  },
  {
    title: "Payroll",
    url: `${baseUrl}/payroll`,
    icon: DollarSign,
  },
  // {
  //   title: "ATS",
  //   children: [
  //     {
  //       title: "Job Postings",
  //       url: `${baseUrl}/ats/jobs`,
  //       icon: ClipboardList,
  //     },
  //     {
  //       title: "Applications",
  //       url: `${baseUrl}/ats/applications`,
  //       icon: Users,
  //     },
  //   ],
  //   icon: BriefcaseBusiness,
  // },
  // {
  //   title: "Reports",
  //   url: `${baseUrl}/reports`,
  //   icon: ClipboardList,
  // },
  {
    title: "Loan Management",
    url: `${baseUrl}/loan`,
    icon: DollarSign,
  },
];

const adminItems: MenuItemType[] = [
  {
    title: "Settings",
    url: `${baseUrl}/settings`,
    icon: Settings,
  },
];

// Recursive Menu Item Component
interface MenuItemProps {
  item: MenuItemType;
  navigate: (url: string) => void;
  location: { pathname: string };
  level?: number;
}

const MenuItem: React.FC<MenuItemProps> = ({
  item,
  navigate,
  location,
  level = 0,
}) => {
  const isActive = location.pathname === item.url;
  const hasChildren = item.children && item.children.length > 0;
  const hasChildActive = hasChildren
    ? hasActiveChild(item.children!, location.pathname)
    : false;
  const isParentLevel = level === 0;
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
            <SidebarMenuButton
              className={`cursor-pointer font-[Nunito] font-normal ${
                !isParentLevel ? "" : ""
              }`}
            >
              <item.icon
                className={`h-4 w-4 ${
                  hasChildActive ? "text-primary" : "text-sidebar-foreground"
                }`}
              />
              <span>{item.title}</span>
              <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
            </SidebarMenuButton>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <SidebarMenuSub>
              {item.children?.map((child) => {
                const childHasChildren =
                  child.children && child.children.length > 0;

                if (childHasChildren) {
                  // For nested items with children, don't wrap in SidebarMenuSubItem
                  return (
                    <MenuItem
                      key={child.title}
                      item={child}
                      navigate={navigate}
                      location={location}
                      level={level + 1}
                    />
                  );
                } else {
                  // For leaf items, wrap in SidebarMenuSubItem
                  return (
                    <SidebarMenuSubItem key={child.title} className="relative">
                      <MenuItem
                        item={child}
                        navigate={navigate}
                        location={location}
                        level={level + 1}
                      />
                    </SidebarMenuSubItem>
                  );
                }
              })}
            </SidebarMenuSub>
          </CollapsibleContent>
        </SidebarMenuItem>
      </Collapsible>
    );
  } else {
    // For leaf items at nested levels, don't render SidebarMenuItem wrapper
    if (!isParentLevel) {
      return (
        <SidebarMenuButton
          asChild
          className={`cursor-pointer w-full ${isActive ? "bg-primary/10" : ""}`}
        >
          <div
            onClick={() => navigate(item.url || "")}
            className="flex items-center gap-2 w-full font-[Nunito] font-normal pl-2"
          >
            {isActive && (
              <span className="bg-primary h-full w-1.5 absolute -left-0.75 rounded-r" />
            )}
            <item.icon
              className={`h-4 w-4 ${
                isActive ? "text-primary" : "text-sidebar-foreground"
              }`}
            />
            <span>{item.title}</span>
          </div>
        </SidebarMenuButton>
      );
    } else {
      // For top-level items without children
      return (
        <SidebarMenuItem key={item.title} className="relative">
          <SidebarMenuButton
            asChild
            className={`cursor-pointer rounded-l-none hover:bg-primary/10 ${
              isActive ? "bg-primary/10" : ""
            }`}
          >
            <div
              onClick={() => navigate(item.url || "")}
              className="flex items-center gap-2 w-full font-[Nunito] font-normal"
            >
              {isActive && (
                <span className="bg-primary h-full w-1.5 absolute -left-0.75 rounded-r" />
              )}
              <item.icon
                className={`h-4 w-4 ${
                  isActive ? "text-primary" : "text-sidebar-foreground"
                }`}
              />
              <span>{item.title}</span>
            </div>
          </SidebarMenuButton>
        </SidebarMenuItem>
      );
    }
  }
};

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
            <SidebarGroupLabel>Main</SidebarGroupLabel>{" "}
            <SidebarGroupContent>
              <SidebarMenu>
                {items.map((item) => (
                  <MenuItem
                    key={item.title}
                    item={item}
                    navigate={navigate}
                    location={location}
                  />
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
          <SidebarSeparator className="transform -translate-x-2" />
          <SidebarGroup>
            <SidebarGroupLabel>Administration</SidebarGroupLabel>{" "}
            <SidebarGroupContent>
              <SidebarMenu>
                {adminItems.map((item) => (
                  <MenuItem
                    key={item.title}
                    item={item}
                    navigate={navigate}
                    location={location}
                  />
                ))}
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
