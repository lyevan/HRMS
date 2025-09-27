import { Card, CardContent, CardTitle } from "@/components/ui/card";
import {
  Clock,
  Calendar,
  User,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  CalendarDays,
  FileText,
  Timer,
  Megaphone,
  Flame,
} from "lucide-react";
import { useUserSessionStore } from "@/store/userSessionStore";

// import { useAttendanceStore } from "@/store/attendanceStore";

const EmployeeUserDashboard = () => {
  const { employee: employeeData } = useUserSessionStore();

  // Clock In Functions
  // const { clockIn, clockOut } = useAttendanceStore();

  // Mock data - in real app this would come from stores/APIs
  const employee = {
    name: employeeData?.first_name + " " + employeeData?.last_name,
    position: employeeData?.position || "N/A",
    department: employeeData?.department || "N/A",
    employeeId: employeeData?.employee_id || "N/A",
  };

  const todayData = {
    clockInTime: "09:00 AM",
    hoursWorked: "6h 30m",
    overtimeWorkHours: "2h 15m",
    status: "clocked-in",
  };

  const recentAttendance = [
    {
      date: "Sep 26, 2025",
      clockIn: "09:00 AM",
      clockOut: "05:30 PM",
      status: "present",
    },
    {
      date: "Sep 25, 2025",
      clockIn: "08:45 AM",
      clockOut: "05:15 PM",
      status: "present",
    },
    {
      date: "Sep 24, 2025",
      clockIn: "09:15 AM",
      clockOut: "05:45 PM",
      status: "present",
    },
  ];

  const quickStats = {
    leaveBalance: 12,
    overtimeThisMonth: "8h 45m",
    nextDayOff: "10/05/2025",
    pendingRequests: 2,
  };

  return (
    <div className="p-2 space-y-6 h-[calc(100%-4.5rem)]">
      {/* Header */}
      <div className="bg-card rounded-lg p-6 shadow-sm border">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-primary">
              Welcome back, {employee.name}!
            </h1>
            <p className="text-muted-foreground mt-1">
              {employee.position} • {employee.department}
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Employee ID</p>
            <p className="font-semibold">{employee.employeeId}</p>
            <p className="text-sm text-muted-foreground mt-1">
              {new Date().toLocaleDateString("en-US", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-card rounded-lg p-6 shadow-sm border">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Flame className="h-5 w-5 text-primary" />
          Quick Actions
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {todayData.status === "clocked-in" ? (
            <div className="relative overflow-hidden p-4 pr-10 border-2 hover:border-destructive dark:hover:border-destructive flex flex-col items-end justify-center h-full dark:hover:bg-destructive/20 dark:hover:text-foreground hover:bg-destructive/10 hover:text-foreground border-dashed rounded-lg transition-colors cursor-pointer">
              <Clock className="h-32 w-32 text-destructive mb-2 absolute top-0 left-0 opacity-50" />
              <p className="text-lg font-medium">Clock Out</p>
            </div>
          ) : (
            <div className="relative overflow-hidden p-4 pr-10 border-2 hover:border-primary dark:hover:border-primary flex flex-col items-end justify-center h-full dark:hover:bg-primary/20 dark:hover:text-foreground hover:bg-primary/10 hover:text-foreground border-dashed rounded-lg transition-colors cursor-pointer">
              <User className="h-32 w-32 text-primary mb-2 absolute top-0 left-0 opacity-50" />
              <p className="text-lg font-medium">Clock In</p>
            </div>
          )}
          <div className="relative overflow-hidden p-4 pr-10 border-2 hover:border-accent dark:hover:border-accent flex flex-col items-end justify-center h-full dark:hover:bg-accent/20 dark:hover:text-foreground hover:bg-accent/10 hover:text-foreground border-dashed rounded-lg transition-colors cursor-pointer">
            <Calendar className="h-32 w-32 text-accent mb-2 absolute top-0 left-0 opacity-50" />
            <p className="text-lg font-medium">Request Leave</p>
          </div>
          <div
            className={`relative overflow-hidden p-4 pr-10 border-2 flex flex-col items-end justify-center h-full dark:hover:text-foreground hover:text-foreground border-dashed rounded-lg transition-colors cursor-pointer ${
              todayData.status === "clocked-in"
                ? "hover:border-primary dark:hover:border-primary dark:hover:bg-primary/20 hover:bg-primary/10"
                : "hover:border-destructive dark:hover:border-destructive dark:hover:bg-destructive/20 hover:bg-destructive/10"
            }`}
          >
            <Timer
              className={`h-32 w-32 mb-2 absolute top-0 left-0 opacity-50 ${
                todayData.status === "clocked-in"
                  ? "text-primary"
                  : "text-destructive"
              }`}
            />
            <p className="text-lg font-medium">Request Overtime</p>
          </div>
          <div className="relative overflow-hidden p-4 pr-10 border-2 hover:border-secondary dark:hover:border-secondary flex flex-col items-end justify-center h-24 dark:hover:bg-secondary/20 dark:hover:text-foreground hover:bg-secondary/10 hover:text-foreground border-dashed rounded-lg transition-colors cursor-pointer">
            <FileText className="h-32 w-32 text-secondary mb-2 absolute top-0 left-0 opacity-50" />
            <p className="text-lg font-medium">View Payslip</p>
          </div>
        </div>
      </div>

      {/* Today's Activity */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-card rounded-lg p-6 shadow-sm border col-span-1">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Megaphone className="h-5 w-5 text-primary" />
            Announcements
          </h2>
          <div className="flex justify-center items-center self-center justify-self-center border border-dashed rounded-lg h-40 w-full">
            <p className="text-sm text-muted-foreground">
              No new announcements
            </p>
          </div>
        </div>
        <div className="bg-card rounded-lg p-6 shadow-sm border col-span-2">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            Today's Activity
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="text-center p-4 border rounded-lg">
              <CardTitle>Clock In</CardTitle>
              <CardContent>
                <CheckCircle className="h-6 w-6 text-primary mx-auto mb-2" />
                <p className="font-semibold text-foreground">
                  {todayData.clockInTime}
                </p>
              </CardContent>
            </Card>

            <Card className="text-center p-4 border rounded-lg">
              <CardTitle>Clock Out</CardTitle>
              <CardContent>
                <Clock className="h-6 w-6 text-destructive mx-auto mb-2" />
                <p className="font-semibold text-foreground">
                  Not clocked out yet
                </p>
              </CardContent>
            </Card>
            <Card className="text-center p-4 border rounded-lg">
              <CardTitle>Hours Worked</CardTitle>
              <CardContent>
                <Timer className="h-6 w-6 text-accent mx-auto mb-2" />
                <p className="font-semibold text-foreground">
                  {todayData.hoursWorked}
                </p>
              </CardContent>
            </Card>
            <Card className="text-center p-4 border rounded-lg">
              <CardTitle>Overtime Work Hours</CardTitle>
              <CardContent>
                <Timer className="h-6 w-6 text-secondary mx-auto mb-2" />
                <p className="font-semibold text-foreground">
                  {todayData.overtimeWorkHours}
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Quick Stats */}
        <div className="lg:col-span-2">
          <div className="bg-card rounded-lg p-6 shadow-sm border">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Quick Stats
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 border rounded-lg hover:bg-primary/10 hover:border-primary cursor-pointer">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Leave Balance
                    </p>
                    <p className="text-2xl font-bold text-primary">
                      {quickStats.leaveBalance}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      days remaining
                    </p>
                  </div>
                  <CalendarDays className="h-8 w-8 text-primary" />
                </div>
              </div>
              <div className="p-4 border rounded-lg hover:bg-primary/10 hover:border-primary cursor-pointer">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Next Day Off
                    </p>
                    <p className="text-2xl font-bold text-primary">
                      {quickStats.nextDayOff}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      next day off
                    </p>
                  </div>
                  <CalendarDays className="h-8 w-8 text-primary" />
                </div>
              </div>
              <div className="p-4 border rounded-lg hover:bg-primary/10 hover:border-primary cursor-pointer">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Overtime (Month)
                    </p>
                    <p className="text-2xl font-bold text-primary">
                      {quickStats.overtimeThisMonth}
                    </p>
                    <p className="text-xs text-muted-foreground">this month</p>
                  </div>
                  <Clock className="h-8 w-8 text-primary" />
                </div>
              </div>
              <div className="p-4 border rounded-lg hover:bg-primary/10 hover:border-primary cursor-pointer">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Pending Requests
                    </p>
                    <p className="text-2xl font-bold text-primary">
                      {quickStats.pendingRequests}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      awaiting approval
                    </p>
                  </div>
                  <AlertCircle className="h-8 w-8 text-primary" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Attendance Records */}
        <div className="space-y-6">
          <div className="bg-card rounded-lg p-6 shadow-sm border h-full">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              Recent Attendance Records
            </h2>
            <div className="space-y-3">
              {recentAttendance.map((record, index) => (
                <div
                  key={index}
                  className="flex items-center gap-3 p-3 border rounded-lg hover:bg-secondary/10 cursor-pointer hover:border-secondary"
                >
                  <div className="h-2 w-2 rounded-full bg-secondary" />
                  <div className="flex-1">
                    <p className="font-medium text-sm">{record.date}</p>
                    <p className="text-xs text-muted-foreground">
                      {record.clockIn} - {record.clockOut}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmployeeUserDashboard;
