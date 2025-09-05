import Departments from "@/components/tab-contents/departments";
import Positions from "@/components/tab-contents/positions";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Briefcase, Building2 } from "lucide-react";

const Organization = () => {
  return (
    <Tabs defaultValue="departments" className="w-full">
      <TabsList>
        <TabsTrigger value="departments">
          <Building2 />
          Departments
        </TabsTrigger>
        <TabsTrigger value="positions">
          <Briefcase />
          Positions
        </TabsTrigger>
      </TabsList>
      <TabsContent value="departments">
        <Departments />
      </TabsContent>
      <TabsContent value="positions">
        <Positions />
      </TabsContent>
    </Tabs>
  );
};

export default Organization;
