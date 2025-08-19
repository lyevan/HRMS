import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import {
  TrendingUp,
  UserPlusIcon,
  Megaphone,
  FileCheck2,
  BanknoteArrowUp,
} from "lucide-react";
import { Pie, PieChart } from "recharts";
import { useState } from "react";

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
  { status: "present", count: 275, fill: "var(--primary)" },
  { status: "absent", count: 200, fill: "var(--destructive)" },
  { status: "leave", count: 187, fill: "var(--chart-5)" },
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
  const quickActions = [
    {
      label: "Add Employee",
      icon: <UserPlusIcon />,
      onClick: () => {
        setOpen(true);
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

      <div className="flex flex-col w-full gap-4">
        <Card className="w-40 max-h-full">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 place-self-center gap-2">
              {quickActions.map((action, index) => (
                <Tooltip key={action.label}>
                  <TooltipTrigger className="cursor-pointer flex items-center justify-center">
                    <Button
                      variant="outline"
                      size="icon"
                      className="bg-primary text-primary-foreground cursor-pointer"
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
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 w-full">
          <Card>
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

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Present Today
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">189</div>
              <p className="text-xs text-muted-foreground">
                +2% from yesterday
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Pending Applications
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">12</div>
              <p className="text-xs text-muted-foreground">
                -5% from last week
              </p>
            </CardContent>
          </Card>

          <Card>
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
        </div>
      </div>
      <Card className="flex flex-col">
        <CardHeader className="items-center pb-0">
          <CardTitle>Attendance Today</CardTitle>
          <CardDescription>{new Date().toLocaleDateString()}</CardDescription>
        </CardHeader>
        <CardContent className="flex-1 pb-0">
          <ChartContainer
            config={chartConfig}
            className="[&_.recharts-pie-label-text]:fill-foreground mx-auto aspect-square max-h-[250px] pb-0"
          >
            <PieChart>
              <ChartTooltip content={<ChartTooltipContent hideLabel />} />
              <Pie data={chartData} dataKey="count" label nameKey="status" />
            </PieChart>
          </ChartContainer>
        </CardContent>
        <CardFooter className="flex-col gap-2 text-sm">
          <div className="flex items-center gap-2 leading-none font-medium">
            Presents up by 5.2% than yesterday{" "}
            <TrendingUp className="h-4 w-4" />
          </div>
          <div className="text-muted-foreground leading-none">
            Showing total attendance for today
          </div>
        </CardFooter>
      </Card>
    </>
  );
};

export default Dashboard;
