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
import { Pie, PieChart } from "recharts";
import { useState } from "react";
import { Calendar } from "@/components/ui/calendar";

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

import AddEmployeeForm from "@/components/forms/add-employee-form";
import Modal from "@/components/modal";

import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";

import type { ChartConfig } from "@/components/ui/chart";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export const description = "Attendance today";
const chartData = [
  { status: "present", count: 275, fill: "var(--chart-1)" },
  { status: "absent", count: 200, fill: "var(--chart-2)" },
  { status: "leave", count: 187, fill: "var(--chart-3)" },
];
const chartConfig = {
  count: {
    label: "Attendance Counts",
  },
  present: {
    label: "Present",
    color: "var(--chart-1)",
  },
  absent: {
    label: "Absent",
    color: "var(--chart-2)",
  },
  leave: {
    label: "On Leave",
    color: "var(--chart-3)",
  },
} satisfies ChartConfig;

const Dashboard = () => {
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState<Date | undefined>(new Date());
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
            <div className="text-2xl font-bold">245</div>
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
            <div className="text-2xl font-bold">189</div>
            <p className="text-xs text-muted-foreground">+2% from yesterday</p>
          </CardContent>
        </Card>

        <Card className="flex flex-col row-span-1 col-span-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Pending Applications
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12</div>
            <p className="text-xs text-muted-foreground">-5% from last week</p>
          </CardContent>
        </Card>

        <Card className="flex flex-col row-span-1 col-span-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Active Departments
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">8</div>
            <p className="text-xs text-muted-foreground">No change</p>
          </CardContent>
        </Card>

        <Card className="flex flex-col row-span-1 col-span-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Active Departments
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">8</div>
            <p className="text-xs text-muted-foreground">No change</p>
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
          <CardHeader className="items-center pb-0">
            <CardTitle>Attendance Today</CardTitle>
            <CardDescription>{new Date().toLocaleDateString()}</CardDescription>
          </CardHeader>
          <CardContent className="pb-0">
            <ChartContainer
              config={chartConfig}
              className="[&_.recharts-pie-label-text]:fill-foreground mx-auto aspect-square max-h-[300px] pb-0"
            >
              <PieChart>
                <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                <Pie data={chartData} dataKey="count" label nameKey="status" />
              </PieChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>
    </>
  );
};

export default Dashboard;
