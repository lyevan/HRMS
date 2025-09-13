import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Leaves from "@/components/tab-contents/leaves";
import Overtime from "@/components/tab-contents/overtime";
// import OutOfBusiness from "@/components/tab-contents/out-of-business";
// import ChangeShift from "@/components/tab-contents/change-shift";
// import ChangeDayOff from "@/components/tab-contents/change-day-off";
// import Undertime from "@/components/tab-contents/undertime";
import ManualLog from "@/components/tab-contents/manual-log";

const FilingAndApproval = () => {
  return (
    <div className="space-y-6">
      {/* Tabs for Different Request Types */}
      <Tabs defaultValue="leaves" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="leaves">Leaves</TabsTrigger>
          <TabsTrigger value="overtime">Overtime</TabsTrigger>
          {/* <TabsTrigger value="out-of-business">Out of Business</TabsTrigger>
          <TabsTrigger value="change-shift">Change Shift</TabsTrigger>
          <TabsTrigger value="change-day-off">Change Day-off</TabsTrigger>
          <TabsTrigger value="undertime">Undertime</TabsTrigger> */}
          <TabsTrigger value="manual-log">Manual Log</TabsTrigger>
        </TabsList>

        <TabsContent value="leaves">
          <Leaves />
        </TabsContent>

        <TabsContent value="overtime">
          <Overtime />
        </TabsContent>

        {/* <TabsContent value="out-of-business">
          <OutOfBusiness />
        </TabsContent>

        <TabsContent value="change-shift">
          <ChangeShift />
        </TabsContent>

        <TabsContent value="change-day-off">
          <ChangeDayOff />
        </TabsContent>

        <TabsContent value="undertime">
          <Undertime />
        </TabsContent> */}

        <TabsContent value="manual-log">
          <ManualLog />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default FilingAndApproval;
