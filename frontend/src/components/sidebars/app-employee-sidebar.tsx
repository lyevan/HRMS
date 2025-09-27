import {
  LayoutDashboard,
  Settings,
  DollarSign,
  Clock,
  ChevronRight,
  FileSpreadsheet,
  Calendar,
  CalendarDays,
  FileText,
  User,
  UserCheck,
  Wallet,
  History,
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

const baseUrl = "/app/employee";

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

// Employee menu items - focused on self-service functionality
const employeeItems = [
  {
    title: "Dashboard",
    url: `${baseUrl}/dashboard`,
    icon: LayoutDashboard,
  },
  {
    title: "Time & Attendance",
    children: [
      {
        title: "Clock In/Out",
        url: `${baseUrl}/time/clock`,
        icon: Clock,
      },
      {
        title: "My Timesheet",
        url: `${baseUrl}/time/timesheet`,
        icon: FileSpreadsheet,
      },
      {
        title: "Attendance History",
        url: `${baseUrl}/time/history`,
        icon: History,
      },
    ],
    icon: Clock,
  },
  {
    title: "Leave Management",
    children: [
      {
        title: "Request Leave",
        url: `${baseUrl}/leave/request`,
        icon: Calendar,
      },
      {
        title: "My Leave History",
        url: `${baseUrl}/leave/history`,
        icon: CalendarDays,
      },
      {
        title: "Leave Balance",
        url: `${baseUrl}/leave/balance`,
        icon: FileText,
      },
    ],
    icon: Calendar,
  },
  {
    title: "Payroll",
    children: [
      {
        title: "Payslips",
        url: `${baseUrl}/payroll/payslips`,
        icon: FileText,
      },
      // {
      //   title: "Tax Documents",
      //   url: `${baseUrl}/payroll/tax-docs`,
      //   icon: FileSpreadsheet,
      // },
    ],
    icon: DollarSign,
  },
  {
    title: "My Profile",
    children: [
      {
        title: "Personal Information",
        url: `${baseUrl}/profile/personal`,
        icon: User,
      },
      {
        title: "Emergency Contacts",
        url: `${baseUrl}/profile/emergency`,
        icon: UserCheck,
      },
      {
        title: "Bank Details",
        url: `${baseUrl}/profile/banking`,
        icon: Wallet,
      },
    ],
    icon: User,
  },
];

// Employee settings (limited compared to admin)
const employeeSettings = [
  {
    title: "Account Settings",
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

export default function AppEmployeeSidebar() {
  const { user } = useUserSessionStore();
  const navigate = useNavigate();
  const location = useLocation();

  if (user?.role === "employee") {
    return (
      <Sidebar collapsible="icon">
        <SidebarContent className="overflow-x-hidden h-screen">
          <SidebarGroup></SidebarGroup>
          <SidebarGroup>
            <SidebarGroupLabel>Main</SidebarGroupLabel>{" "}
            <SidebarGroupContent>
              <SidebarMenu>
                {employeeItems.map((item) => (
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
                {employeeSettings.map((item) => (
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
