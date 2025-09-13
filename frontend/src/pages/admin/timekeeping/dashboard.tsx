import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatDate } from "@/lib/stringMethods";
import { LogIn, LogOut, Clock, User, Calendar, TrendingUp } from "lucide-react";
import axios from "axios";
import { useUserSessionStore } from "@/store/userSessionStore";
import { useAttendanceStore } from "@/store/attendanceStore";
import { toast } from "sonner";
import { useState, useEffect, useMemo } from "react";
import {
  type ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts";
import {
  startOfWeek,
  endOfWeek,
  subDays,
  subWeeks,
  subMonths,
  format,
  eachDayOfInterval,
  eachWeekOfInterval,
  eachMonthOfInterval,
} from "date-fns";

export const description = "An area chart showing attendance trends";

const chartConfig = {
  present: {
    label: "Present",
    color: "var(--chart-1)",
  },
  absent: {
    label: "Absent",
    color: "var(--chart-2)",
  },
} satisfies ChartConfig;

const TimekeepingPage = () => {
  const { employee } = useUserSessionStore();
  const { attendanceRecords, attendanceStats, fetchAttendanceRecords } =
    useAttendanceStore();
  const [isLoading, setIsLoading] = useState(false);
  const [chartView, setChartView] = useState<"daily" | "weekly" | "monthly">(
    "monthly"
  );

  useEffect(() => {
    fetchAttendanceRecords();
  }, [fetchAttendanceRecords]);

  // Generate chart data from attendance records based on view type
  const chartData = useMemo(() => {
    const currentDate = new Date();

    if (chartView === "daily") {
      // Last 7 days
      const last7Days = eachDayOfInterval({
        start: subDays(currentDate, 6),
        end: currentDate,
      });

      return last7Days.map((date) => {
        const dayRecords = attendanceRecords.filter((record) => {
          const recordDate = new Date(record.date);
          return (
            format(recordDate, "yyyy-MM-dd") === format(date, "yyyy-MM-dd")
          );
        });

        const presentCount = dayRecords.filter(
          (r) => r.time_in !== null
        ).length;
        const absentCount = dayRecords.filter((r) => r.time_in === null).length;

        return {
          period: format(date, "EEE d"),
          present: presentCount,
          absent: absentCount,
        };
      });
    }

    if (chartView === "weekly") {
      // Last 8 weeks
      const last8Weeks = eachWeekOfInterval({
        start: subWeeks(currentDate, 7),
        end: currentDate,
      });

      return last8Weeks.map((weekStart, index) => {
        const weekEnd = endOfWeek(weekStart);
        const weekRecords = attendanceRecords.filter((record) => {
          const recordDate = new Date(record.date);
          return recordDate >= startOfWeek(weekStart) && recordDate <= weekEnd;
        });

        const presentCount = weekRecords.filter(
          (r) => r.time_in !== null
        ).length;
        const absentCount = weekRecords.filter(
          (r) => r.time_in === null
        ).length;

        return {
          period: `Week ${index + 1}`,
          present: presentCount,
          absent: absentCount,
        };
      });
    }

    // Monthly view (default) - Last 6 months
    const last6Months = eachMonthOfInterval({
      start: subMonths(currentDate, 5),
      end: currentDate,
    });

    return last6Months.map((date) => {
      const monthRecords = attendanceRecords.filter((record) => {
        const recordDate = new Date(record.date);
        return (
          recordDate.getMonth() === date.getMonth() &&
          recordDate.getFullYear() === date.getFullYear()
        );
      });

      const presentCount = monthRecords.filter(
        (r) => r.time_in !== null
      ).length;
      const absentCount = monthRecords.filter((r) => r.time_in === null).length;

      return {
        period: format(date, "MMM"),
        present: presentCount,
        absent: absentCount,
      };
    });
  }, [attendanceRecords, chartView]);

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
      toast.error(
        (error as any).response?.data?.message || "Clock-in failed.",
        {
          description: (error as any).response?.data?.info || null,
        }
      );
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
      toast.success(response.data.message || "Clock-out successful!");
    } catch (error) {
      console.error("Error clocking out:", error);
      toast.error(
        (error as any).response?.data?.message || "Clock-out failed.",
        {
          description: (error as any).response?.data?.info || null,
        }
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
      {/* <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Timekeeping Management
        </h1>
        <p className="text-muted-foreground">
          Monitor and manage employee attendance records
        </p>
      </div> */}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Records</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{attendanceStats.total}</div>
            <p className="text-xs text-muted-foreground">All time entries</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Present Days</CardTitle>
            <User className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {attendanceStats.present}
            </div>
            <p className="text-xs text-muted-foreground">
              {attendanceStats.total > 0
                ? `${Math.round(
                    (attendanceStats.present / attendanceStats.total) * 100
                  )}% attendance rate`
                : "No data"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Hours</CardTitle>
            <Clock className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {Math.round(attendanceStats.totalHours)}h
            </div>
            <p className="text-xs text-muted-foreground">
              {attendanceStats.averageHours.toFixed(1)}h avg per record
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Attendance Rate
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {Math.round(attendanceStats.attendanceRate)}%
            </div>
            <p className="text-xs text-muted-foreground">Overall performance</p>
          </CardContent>
        </Card>

        <Card className="col-span-2">
          <CardHeader>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <CardTitle>Attendance Trends</CardTitle>
                <CardDescription>
                  {chartView === "daily" &&
                    "Showing attendance patterns for the last 7 days"}
                  {chartView === "weekly" &&
                    "Showing attendance patterns for the last 8 weeks"}
                  {chartView === "monthly" &&
                    "Showing attendance patterns for the last 6 months"}
                </CardDescription>
              </div>

              {/* Chart View Selector */}
              <Tabs
                value={chartView}
                onValueChange={(value) =>
                  setChartView(value as "daily" | "weekly" | "monthly")
                }
              >
                <TabsList>
                  <TabsTrigger value="daily">Daily</TabsTrigger>
                  <TabsTrigger value="weekly">Weekly</TabsTrigger>
                  <TabsTrigger value="monthly">Monthly</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig}>
              <AreaChart
                accessibilityLayer
                data={chartData}
                margin={{
                  left: 12,
                  right: 12,
                }}
              >
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="period"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  tickFormatter={(value) => value}
                />
                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent indicator="line" />}
                />
                <Area
                  dataKey="absent"
                  type="natural"
                  fill="var(--color-absent)"
                  fillOpacity={0.4}
                  stroke="var(--color-absent)"
                  stackId="a"
                />
                <Area
                  dataKey="present"
                  type="natural"
                  fill="var(--color-present)"
                  fillOpacity={0.4}
                  stroke="var(--color-present)"
                  stackId="a"
                />
                <ChartLegend content={<ChartLegendContent />} />
              </AreaChart>
            </ChartContainer>
          </CardContent>
          <CardFooter>
            <div className="flex w-full items-start gap-2 text-sm">
              <div className="grid gap-2">
                <div className="flex items-center gap-2 leading-none font-medium">
                  Attendance tracking overview{" "}
                  <TrendingUp className="h-4 w-4" />
                </div>
                <div className="text-muted-foreground flex items-center gap-2 leading-none">
                  {chartView === "daily" && "Last 7 days data"}
                  {chartView === "weekly" && "Last 8 weeks data"}
                  {chartView === "monthly" && "Last 6 months data"}
                </div>
              </div>
            </div>
          </CardFooter>
        </Card>
        <div className="col-span-2">
          <Card>
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
    </div>
  );
};

export default TimekeepingPage;
