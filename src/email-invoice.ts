import { EmailReportDb } from "./db";
import { getReportPeriod, sendEmailInvoiceReports } from "./utils";

async function fetchEmailInvoice() {
  const emailReport = new EmailReportDb();
  const period = getReportPeriod();
  const apiInvoiceReport = await emailReport.fetchMonthlyStats("api", period);
  const webInvoiceReport = await emailReport.fetchMonthlyStats("web", period);

  const report = {
    month: period.startAt.slice(0, 7),
    api_report: apiInvoiceReport,
    web_report: webInvoiceReport,
  };

  await emailReport.close();
  await sendEmailInvoiceReports(report);
}

fetchEmailInvoice();
