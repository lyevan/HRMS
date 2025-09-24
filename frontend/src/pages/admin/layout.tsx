import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { UserCircle2Icon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AppAdminSidebar } from "@/components/sidebars/app-admin-sidebar";
import { useUserSessionStore } from "@/store/userSessionStore";
import { ModeToggle } from "@/components/dark-light-toggle";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { logout, user, employee } = useUserSessionStore();
  return (
    <SidebarProvider>
      <AppAdminSidebar />
      <main className="flex h-screen w-full flex-col relative">
        <div className="flex flex-col h-full">
          <header className="sticky px-0 top-0 z-30 py-2 flex h-18 items-center gap-4 border-b border-muted bg-background sm:py-0 sm:static sm:bg-transparent sm:px-6 flex-shrink-0">
            <SidebarTrigger className="ml-2 sm:-ml-3" />
            <div className="relative ml-auto flex-1 flex items-center gap-2 md:grow-0">
              <div className="flex flex-col mr-2 items-end w-50">
                <p>
                  {employee?.first_name} {employee?.last_name}
                </p>
                <p className="text-xs text-muted-foreground">{user?.email}</p>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size={"icon"}
                    className="relative rounded-full bg-card"
                  >
                    <span className="sr-only">Open user menu</span>
                    <UserCircle2Icon />
                    {/* <img
                      alt="User Avatar"
                      src="/default-avatar.png"
                      className="h-8 w-8 rounded-full"
                    /> */}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-48" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">
                        Account role
                      </p>
                      <Badge>
                        {user?.role &&
                          user?.role.charAt(0).toUpperCase() +
                            user?.role.slice(1)}
                      </Badge>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem variant="destructive" onClick={logout}>
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <ModeToggle />
            </div>
          </header>
          <main className="flex-1 items-start p-4 py-0 sm:p-2 overflow-auto">
            {children}
          </main>
        </div>
      </main>
    </SidebarProvider>
  );
}
