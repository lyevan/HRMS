import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppAdminSidebar } from "@/components/sidebars/app-admin-sidebar";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <AppAdminSidebar />
      <main className="flex h-screen w-full flex-col">
        <div className="flex flex-col sm:gap-4 sm:py-4">
          <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
            <SidebarTrigger className="-ml-3" />
            <div className="relative ml-auto flex-1 md:grow-0">Headers</div>
          </header>
          <main className="grid flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8">
            {children}
          </main>
        </div>
      </main>
    </SidebarProvider>
  );
}
