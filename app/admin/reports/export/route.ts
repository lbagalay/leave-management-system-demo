import { requireUser } from "@/lib/auth/guards";
import {
  getManagementReport,
  parseReportRange,
} from "@/lib/db/management-reports";

function csvCell(value: string | number) {
  const text = String(value);
  const protectedText = /^[=+\-@]/.test(text) ? `'${text}` : text;
  return `"${protectedText.replaceAll('"', '""')}"`;
}

function csvRow(values: (string | number)[]) {
  return values.map(csvCell).join(",");
}

export async function GET(request: Request) {
  const user = await requireUser(["ADMIN", "SUPERVISOR"]);
  const range = parseReportRange(new URL(request.url).searchParams.get("range"));

  try {
    const report = await getManagementReport(user.id, user.role, range);
    if (!report) {
      return new Response("Report export is temporarily unavailable.", {
        status: 503,
        headers: { "Content-Type": "text/plain; charset=utf-8" },
      });
    }

    const rows = [
      csvRow(["Leave Management Report", report.period.label]),
      csvRow(["Access scope", user.role === "ADMIN" ? "All departments" : user.department ?? "Department"]),
      "",
      csvRow(["Summary", "Value"]),
      csvRow(["Leave Requests", report.requestsThisPeriod]),
      csvRow(["Approved Requests", report.approvedRequests]),
      csvRow(["Rejected Requests", report.rejectedRequests]),
      csvRow(["Approved Leave Days Used", report.approvedLeaveDaysUsed]),
      "",
      csvRow(["Leave Usage By Employee"]),
      csvRow(["Employee ID", "Employee", "Department", "Vacation Used", "Sick Used", "Total Days Used"]),
      ...report.employeeUsage.map((employee) =>
        csvRow([
          employee.employeeNumber,
          employee.employeeName,
          employee.departmentName,
          employee.vacationUsed,
          employee.sickUsed,
          employee.totalDaysUsed,
        ]),
      ),
      "",
      csvRow(["Leave Usage By Department"]),
      csvRow(["Department", "Total Requests", "Approved Days Used"]),
      ...report.departmentUsage.map((department) =>
        csvRow([
          department.departmentName,
          department.totalRequests,
          department.approvedDaysUsed,
        ]),
      ),
    ];

    return new Response(`\uFEFF${rows.join("\r\n")}\r\n`, {
      headers: {
        "Cache-Control": "no-store",
        "Content-Disposition": `attachment; filename="leave-report-${report.period.filenameLabel}.csv"`,
        "Content-Type": "text/csv; charset=utf-8",
      },
    });
  } catch {
    return new Response("Report export is temporarily unavailable.", {
      status: 503,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }
}
