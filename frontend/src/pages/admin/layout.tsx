import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { UserCircle2Icon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AppAdminSidebar } from "@/components/sidebars/app-admin-sidebar";
import { useUserSessionStore } from "@/store/userSessionStore";
import { ModeToggle } from "@/components/dark-light-toggle";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { logout } = useUserSessionStore();
  return (
    <SidebarProvider>
      <AppAdminSidebar />
      <main className="flex h-screen w-full flex-col relative">
        <div className="flex flex-col h-full">
          <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background sm:static sm:border-0 sm:bg-transparent sm:px-6">
            <SidebarTrigger className="-ml-3" />
            <div className="relative ml-auto flex-1 flex items-center gap-2 md:grow-0">
              <div className="flex flex-col mr-2 items-end w-50">
                <p>Employee Name</p>
                <p className="text-xs text-muted-foreground">
                  user@example.com
                </p>
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
                  {/* <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">
                        User Name
                      </p>
                      <p className="text-xs leading-none text-muted-foreground">
                        user@example.com
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator /> */}
                  <DropdownMenuItem onClick={logout}>Logout</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <ModeToggle />
            </div>
          </header>
          <main className="flex-9 items-start p-4 py-0 sm:p-2">{children}</main>
        </div>
      </main>
    </SidebarProvider>
  );
}
