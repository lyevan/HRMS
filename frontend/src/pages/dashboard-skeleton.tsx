import { Skeleton } from "@/components/ui/skeleton";

const DashboardSkeleton = () => {
  return (
    <div className="flex flex-row h-[100vh] w-[100vw]">
      <section className="w-[19rem] bg-sidebar h-[100vh] flex flex-col items-start pt-10 px-4 gap-4">
        <Skeleton className="h-3 w-1/8 bg-sidebar-foreground/20" />
        <Skeleton className="h-6 w-2/8 bg-sidebar-foreground/20" />
        <Skeleton className="h-6 w-4/8 bg-sidebar-foreground/20" />
        <Skeleton className="h-6 w-5/8 bg-sidebar-foreground/20" />
        <Skeleton className="h-6 w-3/8 bg-sidebar-foreground/20" />
        <Skeleton className="h-6 w-2/8 bg-sidebar-foreground/20" />
        <Skeleton className="h-6 w-3/8 mb-10 bg-sidebar-foreground/20" />

        <Skeleton className="h-3 w-1/8 bg-sidebar-foreground/20" />
        <Skeleton className="h-6 w-3/8 bg-sidebar-foreground/20" />
      </section>
      <section className="flex flex-col w-full h-[100vh]">
        <header className="h-14 w-full bg-background flex justify-end items-center px-6 gap-2">
          <div className="flex flex-col gap-2 items-end">
            <Skeleton className="h-3 w-20 bg-foreground/30" />
            <Skeleton className="h-5 w-30 bg-foreground/30" />
          </div>

          <Skeleton className="h-10 w-10 bg-primary-foreground/20 rounded-full" />
        </header>
        <main className="flex-1 p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 lg:grid-rows-5 gap-4">
          <Skeleton className="h-full w-full bg-foreground/30 row-span-1" />
          <Skeleton className="h-full w-full bg-foreground/30 row-span-1" />
          <Skeleton className="h-full w-full bg-foreground/30 row-span-1" />
          <Skeleton className="h-full w-full bg-foreground/30 row-span-1" />
          <Skeleton className="h-full w-full bg-foreground/30 row-span-1" />

          <Skeleton className="h-full w-full bg-foreground/30 col-span-2 row-span-2" />
          <Skeleton className="h-full w-full bg-foreground/30 col-span-3 row-span-4" />
          <Skeleton className="h-full w-full bg-foreground/30 col-span-2 row-span-2" />
        </main>
      </section>
    </div>
  );
};

export default DashboardSkeleton;
