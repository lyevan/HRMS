import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  UserPlusIcon,
  Megaphone,
  FileCheck2,
  BanknoteArrowUp,
  Menu,
} from "lucide-react";
import { Pie, PieChart, Cell, ResponsiveContainer } from "recharts";
import { useEffect, useState } from "react";
import { Calendar } from "@/components/ui/calendar";

import { ChartTooltip } from "@/components/ui/chart";

import AddEmployeeForm from "@/components/forms/add-employee-form";
import Modal from "@/components/modal";

import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";

import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useFetchEmployees, useEmployees } from "../../store/employeeStore";
import { useAttendanceStore } from "@/store/attendanceStore";

export const description = "Attendance today";

const Dashboard = () => {
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState<Date | undefined>(new Date());
  const employees = useEmployees();
  const fetchEmployees = useFetchEmployees();

  // Attendance store
  const {
    todayAttendance,
    attendanceStats,
    loading: attendanceLoading,
    error: attendanceError,
    fetchTodayAttendanceRecords,
    fetchAttendanceRecords,
  } = useAttendanceStore();

  useEffect(() => {
    fetchEmployees();
    fetchTodayAttendanceRecords();
    fetchAttendanceRecords();
  }, [fetchEmployees, fetchTodayAttendanceRecords, fetchAttendanceRecords]);

  // Calculate dynamic chart data from real attendance data
  const chartData = [
    {
      status: "present",
      count: todayAttendance.filter(
        (record) => record.is_present && !record.is_late
      ).length,
      fill: "#22c55e",
      label: "Present",
    },
    {
      status: "late",
      count: todayAttendance.filter(
        (record) => record.is_present && record.is_late
      ).length,
      fill: "#f59e0b",
      label: "Late",
    },
    {
      status: "absent",
      count: attendanceStats.absent,
      fill: "#ef4444",
      label: "Absent",
    },
    {
      status: "leave",
      count: attendanceStats.leave,
      fill: "#3b82f6",
      label: "On Leave",
    },
  ].filter((item) => item.count > 0); // Only show segments with data

  const quickActions = [
    {
      label: "Add Employee",
      icon: <UserPlusIcon />,
      onClick: () => {
        // setOpen(true);
        toast.error("Add Employee currently in maintenance");
      },
    },
    {
      label: "Announce",
      icon: <Megaphone />,
      onClick: () => {
        toast.warning("Announcements coming soon");
      },
    },
    {
      label: "Approve Leave",
      icon: <FileCheck2 />,
      onClick: () => {
        toast.warning("Leaves coming soon");
      },
    },
    {
      label: "Run Payroll",
      icon: <BanknoteArrowUp />,
      onClick: () => {
        toast.warning("Payrolls coming soon");
      },
    },
  ];
  return (
    <>
      {/* Add Employee Modal */}
      <Modal
        open={open}
        setOpen={setOpen}
        title="Add Employee"
        description="Fill in the details to add a new employee"
      >
        <AddEmployeeForm setOpen={setOpen} />
      </Modal>

      {/* TODO Quick announce Modal */}

      {/* TODO Approve Leave Modal */}

      {/* TODO Run Payroll Modal */}

      {/* Dashboard Cards */}

      <div className="flex flex-col h-[calc(100vh-4.5rem)] md:grid gap-4 grid-cols-1 md:grid-cols-3 lg:grid-cols-5 2xl:grid-rows-6 lg:grid-rows-4 w-full">
        <Card className="flex flex-col row-span-1 col-span-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Employees
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{employees.length}</div>
            <p className="text-xs text-muted-foreground">
              +20% from last month
            </p>
          </CardContent>
        </Card>

        <Card className="flex flex-col row-span-1 col-span-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Present Today</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {attendanceLoading
                ? "..."
                : todayAttendance.filter((r) => r.is_present).length}
            </div>
            <p className="text-xs text-muted-foreground">
              {attendanceLoading
                ? "Loading..."
                : `${
                    todayAttendance.filter((r) => r.is_late).length
                  } late arrivals`}
            </p>
          </CardContent>
        </Card>

        <Card className="flex flex-col row-span-1 col-span-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Absent Today</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {attendanceLoading ? "..." : attendanceStats.absent}
            </div>
            <p className="text-xs text-muted-foreground">
              {attendanceLoading
                ? "Loading..."
                : `${attendanceStats.leave} on leave`}
            </p>
          </CardContent>
        </Card>

        <Card className="flex flex-col row-span-1 col-span-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Hours Today
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {attendanceLoading
                ? "..."
                : Math.round(attendanceStats.totalHours)}
            </div>
            <p className="text-xs text-muted-foreground">
              {attendanceLoading
                ? "Loading..."
                : `${Math.round(
                    attendanceStats.averageHours
                  )}h avg per employee`}
            </p>
          </CardContent>
        </Card>

        <Card className="flex flex-col row-span-1 col-span-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Attendance Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {attendanceLoading
                ? "..."
                : `${Math.round(attendanceStats.attendanceRate)}%`}
            </div>
            <p className="text-xs text-muted-foreground">
              {attendanceLoading ? "Loading..." : "Today's rate"}
            </p>
          </CardContent>
        </Card>

        <div className="flex flex-col items-center gap-4 w-full col-span-1 row-span-3 flex-1">
          <Calendar
            mode="single"
            selected={date}
            onSelect={setDate}
            className="rounded-lg border h-fit"
          />

          <Card className="h-full w-full">
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-md font-medium">
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 place-self-center gap-2">
                {quickActions.map((action, index) => (
                  <Tooltip key={action.label}>
                    <TooltipTrigger className="cursor-pointer flex items-center justify-center">
                      <Button
                        asChild
                        variant="outline"
                        size="icon"
                        className="bg-primary text-primary-foreground p-2 cursor-pointer"
                        onClick={action.onClick}
                      >
                        {action.icon}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent
                      className="pointer-events-none"
                      side={index > 1 ? "bottom" : "top"}
                    >
                      <span className="text-xs">{action.label}</span>
                    </TooltipContent>
                  </Tooltip>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
        <div className="flex flex-col gap-4 w-full col-span-1 row-span-3">
          <Card className="flex flex-col h-inherit gap-2">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-md font-medium">Notes</CardTitle>
              <Tooltip>
                <TooltipTrigger>
                  <Button
                    asChild
                    variant="outline"
                    size={"icon"}
                    className="bg-card cursor-pointer"
                    onClick={() => toast.info("Notes feature coming soon")}
                  >
                    <Menu className="p-2" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent className="pointer-events-none">
                  <span className="text-xs">View All Notes</span>
                </TooltipContent>
              </Tooltip>
            </CardHeader>
            <CardContent className="p-2 justify-center items-center">
              <form onSubmit={(e) => e.preventDefault()}>
                <textarea
                  placeholder="Add a note..."
                  className="align-top justify-start w-full border border-muted mb-2 rounded items-start text-start p-2 text-xs flex-1 resize-none"
                  rows={5}
                />
                <Button size="sm" className="float-right" onClick={() => {}}>
                  Save
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card className="h-fit flex-1">
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-md font-medium">Holidays</CardTitle>
            </CardHeader>
            <CardContent className="overflow-y-auto max-h-40 2xl:max-h-35 no-scrollbar">
              <ul className="list-disc list-inside marker:text-muted-foreground text-sm font-[Nunito]">
                {/* Philippine Holidays */}
                <li>New Year's Day - January 1</li>
                <li>EDSA People Power Revolution - February 25</li>
                <li>Holy Week - March 28 to April 1</li>
                <li>Labor Day - May 1</li>
                <li>Independence Day - June 12</li>
                <li>National Heroes Day - August 28</li>
                <li>Bonifacio Day - November 30</li>
                <li>Christmas Day - December 25</li>
              </ul>
            </CardContent>
          </Card>
        </div>

        <Card className="flex flex-col h-full col-span-3 row-span-3 flex-3">
          <CardHeader className="items-center pb-4">
            <CardTitle className="text-xl font-semibold">
              Today's Attendance Overview
            </CardTitle>
            <CardDescription className="text-center">
              {new Date().toLocaleDateString("en-US", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </CardDescription>
          </CardHeader>
          <CardContent className="pb-4">
            {attendanceLoading ? (
              <div className="flex items-center justify-center h-[350px]">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                  <p className="text-muted-foreground">
                    Loading attendance data...
                  </p>
                </div>
              </div>
            ) : attendanceError ? (
              <div className="flex items-center justify-center h-[350px]">
                <div className="text-center">
                  <p className="text-red-500 text-lg font-medium mb-2">
                    Error loading attendance data
                  </p>
                  <p className="text-muted-foreground text-sm">
                    Please try refreshing the page
                  </p>
                </div>
              </div>
            ) : chartData.length === 0 ? (
              <div className="flex items-center justify-center h-[350px]">
                <div className="text-center">
                  <p className="text-muted-foreground text-lg font-medium mb-2">
                    No attendance data available
                  </p>
                  <p className="text-muted-foreground text-sm">
                    Check back later for updates
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Pie Chart */}
                <div className="flex justify-center">
                  <ResponsiveContainer width="100%" height={280}>
                    <PieChart>
                      <Pie
                        data={chartData}
                        dataKey="count"
                        nameKey="label"
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        innerRadius={40}
                        paddingAngle={2}
                        stroke="#ffffff"
                        strokeWidth={2}
                      >
                        {chartData.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={entry.fill}
                            className="hover:opacity-80 transition-opacity cursor-pointer"
                          />
                        ))}
                      </Pie>
                      <ChartTooltip
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const data = payload[0].payload;
                            return (
                              <div className="bg-background border border-border rounded-lg shadow-lg p-3">
                                <div className="flex items-center gap-2 mb-1">
                                  <div
                                    className="w-3 h-3 rounded-full"
                                    style={{ backgroundColor: data.fill }}
                                  />
                                  <span className="font-medium">
                                    {data.label}
                                  </span>
                                </div>
                                <p className="text-sm text-muted-foreground">
                                  Count:{" "}
                                  <span className="font-semibold text-foreground">
                                    {data.count}
                                  </span>
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  Percentage:{" "}
                                  <span className="font-semibold text-foreground">
                                    {(
                                      (data.count /
                                        chartData.reduce(
                                          (sum, item) => sum + item.count,
                                          0
                                        )) *
                                      100
                                    ).toFixed(1)}
                                    %
                                  </span>
                                </p>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                {/* Custom Legend with Statistics */}
                <div className="grid grid-cols-2 gap-4">
                  {chartData.map((entry) => {
                    const total = chartData.reduce(
                      (sum, item) => sum + item.count,
                      0
                    );
                    const percentage =
                      total > 0
                        ? ((entry.count / total) * 100).toFixed(1)
                        : "0";

                    return (
                      <div
                        key={entry.status}
                        className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className="w-4 h-4 rounded-full flex-shrink-0"
                            style={{ backgroundColor: entry.fill }}
                          />
                          <div>
                            <p className="font-medium text-sm">{entry.label}</p>
                            <p className="text-xs text-muted-foreground">
                              {percentage}% of total
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-lg">{entry.count}</p>
                          <p className="text-xs text-muted-foreground">
                            employees
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Summary Stats */}
                <div className="border-t pt-4">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">
                      Total Employees:
                    </span>
                    <span className="font-semibold">{employees.length}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm mt-1">
                    <span className="text-muted-foreground">
                      Tracked Today:
                    </span>
                    <span className="font-semibold">
                      {chartData.reduce((sum, item) => sum + item.count, 0)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-sm mt-1">
                    <span className="text-muted-foreground">
                      Attendance Rate:
                    </span>
                    <span className="font-semibold text-green-600">
                      {Math.round(attendanceStats.attendanceRate)}%
                    </span>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
};

export default Dashboard;
