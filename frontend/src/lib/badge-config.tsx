import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { AttendanceRecord } from "@/models/attendance-model";

// Badge configuration interface
interface BadgeConfig {
  key: string;
  label: string;
  badgeLabel: string;
  className: string;
  ariaDescribedBy?: string;
}

// Badge configuration for different attendance statuses
export const BADGE_CONFIGURATIONS: BadgeConfig[] = [
  // Primary status badges
  {
    key: "is_present",
    label: "Present",
    badgeLabel: "P",
    className: "bg-green-100 text-green-800 border-green-300",
  },
  {
    key: "is_absent",
    label: "Absent",
    badgeLabel: "A",
    className: "bg-red-100 text-red-800 border-red-300",
  },
  {
    key: "on_leave",
    label: "On Leave",
    badgeLabel: "OL",
    className: "bg-blue-100 text-blue-800 border-blue-300",
  },
  // Secondary status badges
  {
    key: "is_late",
    label: "Late",
    badgeLabel: "L",
    className: "bg-orange-100 text-orange-800 border-orange-300",
  },
  {
    key: "is_undertime",
    label: "Undertime",
    badgeLabel: "UT",
    className: "bg-yellow-100 text-yellow-800 border-yellow-300",
    ariaDescribedBy: "undertime-desc",
  },
  {
    key: "is_halfday",
    label: "Half Day",
    badgeLabel: "HD",
    className: "bg-indigo-100 text-indigo-800 border-indigo-300",
  },
  // Special day badges
  {
    key: "is_dayoff",
    label: "Day Off",
    badgeLabel: "DO",
    className: "bg-gray-100 text-gray-800 border-gray-300",
  },
  {
    key: "is_regular_holiday",
    label: "Regular Holiday",
    badgeLabel: "RH",
    className: "bg-purple-100 text-purple-800 border-purple-300",
  },
  {
    key: "is_special_holiday",
    label: "Special Holiday",
    badgeLabel: "SH",
    className: "bg-pink-100 text-pink-800 border-pink-300",
  },
];

// Utility function to generate status badges for attendance records
export const getStatusBadges = (
  record: AttendanceRecord,
  isSmall: boolean = true
) => {
  const badges = BADGE_CONFIGURATIONS.filter(
    (config) => record[config.key as keyof AttendanceRecord]
  ).map((config) =>
    isSmall ? (
      <Tooltip key={config.key}>
        <TooltipTrigger asChild className="cursor-pointer">
          <Badge
            key={config.key}
            className={config.className}
            {...(config.ariaDescribedBy && {
              "aria-describedby": config.ariaDescribedBy,
            })}
          >
            {config.badgeLabel}
          </Badge>
        </TooltipTrigger>
        <TooltipContent className={config.className}>
          <p>{config.label}</p>
        </TooltipContent>
      </Tooltip>
    ) : (
      <Badge
        key={config.key}
        className={config.className}
        {...(config.ariaDescribedBy && {
          "aria-describedby": config.ariaDescribedBy,
        })}
      >
        {config.label}
      </Badge>
    )
  );

  return badges.length > 0 ? (
    <div className="flex flex-wrap gap-1">{badges}</div>
  ) : (
    <Badge variant="outline" className="bg-gray-100 text-gray-800">
      Unknown
    </Badge>
  );
};

export type { BadgeConfig };
