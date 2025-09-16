import * as ExcelJS from "exceljs";
import { saveAs } from "file-saver";

interface ExportColumn {
  header: string;
  key: string;
  width?: number;
  style?: Partial<ExcelJS.Style>;
}

interface ExportData {
  [key: string]: any;
}

interface ExportOptions {
  fileName: string;
  sheetName?: string;
  title?: string;
  subtitle?: string;
  columns: ExportColumn[];
  data: ExportData[];
  includeFilters?: boolean;
  includeTimestamp?: boolean;
}

export async function exportToExcel(options: ExportOptions): Promise<void> {
  const {
    fileName,
    sheetName = "Data",
    title,
    subtitle,
    columns,
    data,
    includeFilters = true,
    includeTimestamp = true,
  } = options;

  // Create workbook and worksheet
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet(sheetName);

  let currentRow = 1;

  // Add title if provided
  if (title) {
    const titleCell = worksheet.getCell(`A${currentRow}`);
    titleCell.value = title;
    titleCell.font = { size: 16, bold: true };
    titleCell.alignment = { horizontal: "center" };

    // Merge cells for title
    worksheet.mergeCells(
      `A${currentRow}:${String.fromCharCode(64 + columns.length)}${currentRow}`
    );
    currentRow += 2;
  }

  // Add subtitle if provided
  if (subtitle) {
    const subtitleCell = worksheet.getCell(`A${currentRow}`);
    subtitleCell.value = subtitle;
    subtitleCell.font = { size: 12, italic: true };
    subtitleCell.alignment = { horizontal: "center" };

    // Merge cells for subtitle
    worksheet.mergeCells(
      `A${currentRow}:${String.fromCharCode(64 + columns.length)}${currentRow}`
    );
    currentRow += 2;
  }

  // Add timestamp if enabled
  if (includeTimestamp) {
    const timestampCell = worksheet.getCell(`A${currentRow}`);
    timestampCell.value = `Generated on: ${new Date().toLocaleString()}`;
    timestampCell.font = { size: 10, italic: true };
    currentRow += 2;
  }

  // Set up columns
  worksheet.columns = columns.map((col) => ({
    header: col.header,
    key: col.key,
    width: col.width || 15,
    style: col.style || {},
  }));

  // Style headers
  const headerRow = worksheet.getRow(currentRow);
  headerRow.font = { bold: true };
  headerRow.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FFE6F3FF" },
  };
  headerRow.border = {
    top: { style: "thin" },
    left: { style: "thin" },
    bottom: { style: "thin" },
    right: { style: "thin" },
  };

  // Add data
  data.forEach((item, index) => {
    const row = worksheet.addRow(item);

    // Add borders to data rows
    row.eachCell((cell) => {
      cell.border = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" },
      };
    });

    // Alternate row colors
    if (index % 2 === 0) {
      row.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFF8F9FA" },
      };
    }
  });

  // Add filters if enabled
  if (includeFilters && data.length > 0) {
    const lastColumn = String.fromCharCode(64 + columns.length);
    const lastRow = currentRow + data.length;
    worksheet.autoFilter = `A${currentRow}:${lastColumn}${lastRow}`;
  }

  // Auto-fit columns
  worksheet.columns.forEach((column) => {
    if (column.eachCell) {
      let maxLength = 0;
      column.eachCell({ includeEmpty: true }, (cell) => {
        const columnLength = cell.value ? cell.value.toString().length : 10;
        if (columnLength > maxLength) {
          maxLength = columnLength;
        }
      });
      column.width = maxLength < 10 ? 10 : maxLength + 2;
    }
  });

  // Generate Excel file and download
  try {
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });

    saveAs(blob, `${fileName}_${new Date().toISOString().split("T")[0]}.xlsx`);
  } catch (error) {
    console.error("Error generating Excel file:", error);
    throw new Error("Failed to export to Excel");
  }
}

// Specific export function for attendance/timesheet data
export async function exportTimesheetToExcel(
  data: any[],
  title: string = "Timesheet Report"
): Promise<void> {
  const columns: ExportColumn[] = [
    { header: "Employee ID", key: "employee_id", width: 15 },
    { header: "Employee Name", key: "employee_name", width: 25 },
    { header: "Date", key: "date", width: 12 },
    { header: "Time In", key: "time_in", width: 12 },
    { header: "Time Out", key: "time_out", width: 12 },
    { header: "Total Hours", key: "total_hours", width: 12 },
    { header: "Overtime Hours", key: "overtime_hours", width: 15 },
    { header: "Late Minutes", key: "late_minutes", width: 12 },
    { header: "Undertime Minutes", key: "undertime_minutes", width: 15 },
    { header: "Night Diff Hours", key: "night_differential_hours", width: 15 },
    { header: "Rest Day Hours", key: "rest_day_hours_worked", width: 15 },
    { header: "Status", key: "status", width: 12 },
    { header: "Holiday", key: "is_regular_holiday", width: 10 },
    { header: "Day Off", key: "is_dayoff", width: 10 },
  ];

  // Format data for export
  const formattedData = data.map((record) => ({
    employee_id: record.employee_id,
    employee_name: `${record.first_name} ${record.last_name}`,
    date: new Date(record.date).toLocaleDateString(),
    time_in: record.time_in || "-",
    time_out: record.time_out || "-",
    total_hours: record.total_hours || "0.00",
    overtime_hours: record.overtime_hours || "0.00",
    late_minutes: record.late_minutes || "0",
    undertime_minutes: record.undertime_minutes || "0",
    night_differential_hours: record.night_differential_hours || "0.00",
    rest_day_hours_worked: record.rest_day_hours_worked || "0.00",
    status: getAttendanceStatus(record),
    is_regular_holiday: record.is_regular_holiday ? "Yes" : "No",
    is_dayoff: record.is_dayoff ? "Yes" : "No",
  }));

  await exportToExcel({
    fileName: "timesheet_report",
    sheetName: "Timesheet Data",
    title,
    subtitle: `Period: ${new Date().toLocaleDateString()}`,
    columns,
    data: formattedData,
    includeFilters: true,
    includeTimestamp: true,
  });
}

// Specific export function for employee data
export async function exportEmployeesToExcel(
  data: any[],
  title: string = "Employee Directory"
): Promise<void> {
  const columns: ExportColumn[] = [
    { header: "Employee ID", key: "employee_id", width: 15 },
    { header: "First Name", key: "first_name", width: 20 },
    { header: "Last Name", key: "last_name", width: 20 },
    { header: "Email", key: "email", width: 25 },
    { header: "Phone", key: "phone", width: 15 },
    { header: "Department", key: "department_name", width: 20 },
    { header: "Position", key: "position_title", width: 20 },
    { header: "Employment Type", key: "employment_type_name", width: 18 },
    { header: "Hire Date", key: "hire_date", width: 12 },
    { header: "Salary", key: "salary", width: 12 },
    { header: "Status", key: "employment_status", width: 12 },
  ];

  // Format data for export
  const formattedData = data.map((employee) => ({
    employee_id: employee.employee_id,
    first_name: employee.first_name,
    last_name: employee.last_name,
    email: employee.email,
    phone: employee.phone || "-",
    department_name: employee.department_name || "-",
    position_title: employee.position_title || "-",
    employment_type_name: employee.employment_type_name || "-",
    hire_date: employee.hire_date
      ? new Date(employee.hire_date).toLocaleDateString()
      : "-",
    salary: employee.salary
      ? `₱${Number(employee.salary).toLocaleString()}`
      : "-",
    employment_status: employee.employment_status || "Active",
  }));

  await exportToExcel({
    fileName: "employee_directory",
    sheetName: "Employee Data",
    title,
    subtitle: `Total Employees: ${data.length}`,
    columns,
    data: formattedData,
    includeFilters: true,
    includeTimestamp: true,
  });
}

// Helper function to determine attendance status
function getAttendanceStatus(record: any): string {
  if (record.is_absent) return "Absent";
  if (record.on_leave) return "On Leave";
  if (record.is_halfday) return "Half Day";
  if (record.is_present) return "Present";
  return "No Record";
}
