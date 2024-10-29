export type Period = { startAt: string; endAt: string };
export type EmailReport = Array<Record<string, string>>;
export type BlastUpdatePayload = {
  user: string;
  key: string;
  jobid: string;
};

export type BlastUpdateData = {
  acknowledged: number;
  delivered: number;
  expired: number;
  undelivered: number;
  rejected: number;
};
export type BlastUpdateAPIFailedResponse = { status: false; message: string };
export type BlastUpdateAPISuccessResponse = {
  status: true;
  data: BlastUpdateData;
};
export type EmailInvoiceReport = {
  month: string;
  api_reports: EmailReport;
  web_reports: EmailReport;
};
