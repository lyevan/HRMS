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
import {
  formatDate,
  formatMilitaryTimeToAMPM,
  getAllDaysWithScheduleStatus,
} from "@/lib/stringMethods";
import {
  LogIn,
  LogOut,
  Clock,
  User,
  Calendar,
  TrendingUp,
  AlertTriangle,
} from "lucide-react";
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
import { useSchedulesStore } from "@/store/schedulesStore";

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
  const { schedule, getScheduleById } = useSchedulesStore();

  useEffect(() => {
    fetchAttendanceRecords();
    getScheduleById(employee?.employee_id || "0");
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
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-primary" />
                Your Attendance Status Today
                <span className="text-sm font-normal text-muted-foreground ml-2">
                  {formatDate(Date.now() as any)}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Schedule Information */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Your Schedule Today
                </h3>
                {schedule ? (
                  <div className="grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">
                          Schedule:
                        </span>
                        <span className="text-sm font-medium">
                          {schedule.schedule_name}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">
                          Start Time:
                        </span>
                        <span className="text-sm font-medium">
                          {formatMilitaryTimeToAMPM(schedule.start_time)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">
                          End Time:
                        </span>
                        <span className="text-sm font-medium">
                          {formatMilitaryTimeToAMPM(schedule.end_time)}
                        </span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">
                          Break Duration:
                        </span>
                        <span className="text-sm font-medium">
                          {schedule.break_duration} min
                        </span>
                      </div>
                      <div className="flex flex-col gap-1">
                        <span className="text-sm text-muted-foreground">
                          Work Days:
                        </span>
                        <div className="flex flex-wrap gap-1">
                          {getAllDaysWithScheduleStatus(
                            schedule.days_of_week
                          ).map(({ day, isScheduled }) => (
                            <span
                              key={day}
                              className={`px-2 py-1 text-xs font-medium rounded-md capitalize ${
                                isScheduled
                                  ? "bg-primary/10 text-primary"
                                  : "bg-destructive/10 text-destructive"
                              }`}
                            >
                              {day.slice(0, 3)}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
                    <div className="flex items-center gap-2 text-destructive">
                      <AlertTriangle className="h-4 w-4" />
                      <span className="text-sm font-medium">
                        No schedule assigned!
                      </span>
                    </div>
                    <p className="text-sm text-destructive/80 mt-1">
                      Contact HR for schedule assignment.
                    </p>
                  </div>
                )}
              </div>

              {/* Clock In/Out Buttons */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold">Quick Actions</h3>
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    onClick={() => handleClockIn()}
                    disabled={isLoading || schedule == null}
                    className="h-12 flex items-center justify-center gap-2"
                    size="lg"
                  >
                    <LogIn className="h-4 w-4" />
                    Clock In
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => handleClockOut()}
                    disabled={isLoading || schedule == null}
                    className="h-12 flex items-center justify-center gap-2"
                    size="lg"
                  >
                    <LogOut className="h-4 w-4" />
                    Clock Out
                  </Button>
                </div>

                {(isLoading || schedule == null) && (
                  <p className="text-xs text-muted-foreground text-center">
                    {isLoading
                      ? "Processing..."
                      : "Schedule required for attendance actions"}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default TimekeepingPage;
