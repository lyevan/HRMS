import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ClipboardClock, TrendingDown, Handshake } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import PendingEmployees from "@/components/tab-contents/pending-employees";

const EmployeeManagement = () => {
  const isMobile = useIsMobile();
  return (
    <Tabs defaultValue="pending" className="w-full">
      <TabsList className="w-full md:w-fit">
        <TabsTrigger value="pending">
          <ClipboardClock /> {isMobile ? "Pending" : "Pending Employees"}
        </TabsTrigger>
        <TabsTrigger value="attrition">
          <TrendingDown /> {isMobile ? "Attrition" : "Employee Attrition"}
        </TabsTrigger>
        <TabsTrigger value="relations">
          <Handshake /> {isMobile ? "Relations" : "Employee Relations"}
        </TabsTrigger>
      </TabsList>
      <TabsContent value="pending">
        <PendingEmployees />
      </TabsContent>
      <TabsContent value="attrition">
        <div>Employee Attrition Content</div>
      </TabsContent>
      <TabsContent value="relations">
        <div>Employee Relations Content</div>
      </TabsContent>
    </Tabs>
  );
};

export default EmployeeManagement;
