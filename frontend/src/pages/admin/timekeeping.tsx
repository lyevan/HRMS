import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate } from "@/lib/stringMethods";
import { LogIn, LogOut } from "lucide-react";
import axios from "axios";
import { useUserSessionStore } from "@/store/userSessionStore";
import { toast } from "sonner";
import { useState } from "react";

const TimekeepingPage = () => {
  const { employee } = useUserSessionStore();
  const [isLoading, setIsLoading] = useState(false);

  const handleClockIn = async () => {
    try {
      setIsLoading(true);
      const response = await axios.post("/attendance/clock-in", {
        employee_id: employee?.employee_id,
      });
      console.log("Clock-in successful:", response.data);
      toast.success("Clock-in successful!");
    } catch (error) {
      console.error("Error clocking in:", error);
      toast.error((error as any).response?.data?.message || "Clock-in failed.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleClockOut = async () => {
    try {
      setIsLoading(true);
      const response = await axios.post("/attendance/clock-out", {
        employee_id: employee?.employee_id,
      });
      console.log("Clock-out successful:", response.data);
      toast.success("Clock-out successful!");
    } catch (error) {
      console.error("Error clocking out:", error);
      toast.error(
        (error as any).response?.data?.message || "Clock-out failed."
      );
    } finally {
      setIsLoading(false);
    }
  };

  // function handleClockOut(): void {
  //   throw new Error("Function not implemented.");
  // }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Timekeeping Management
        </h1>
        <p className="text-muted-foreground">
          Monitor and manage employee attendance records
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Present Today</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">142</div>
            <p className="text-xs text-muted-foreground">
              Out of 152 employees
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Late Arrivals</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">7</div>
            <p className="text-xs text-muted-foreground">Today</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">On Break</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12</div>
            <p className="text-xs text-muted-foreground">Currently</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Absent</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">10</div>
            <p className="text-xs text-muted-foreground">Today</p>
          </CardContent>
        </Card>

        <Card className="col-span-2">
          <CardHeader>
            <CardTitle>
              Your Attendance Status Today: {formatDate(Date.now() as any)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="w-full flex justify-between">
              <Button onClick={() => handleClockIn()} disabled={isLoading}>
                <LogIn />
                Clock-In
              </Button>
              <Button
                variant={"destructive"}
                onClick={() => handleClockOut()}
                disabled={isLoading}
              >
                <LogOut />
                Clock-Out
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TimekeepingPage;
