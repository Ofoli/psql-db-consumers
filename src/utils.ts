import winston from "winston";
import crypto from "crypto";
import axios, { type AxiosError } from "axios";
import { SYSLOG, config } from "./contants";
import type {
  BlastUpdateAPIFailedResponse,
  BlastUpdateAPISuccessResponse,
  EmailInvoiceReport,
  Period,
} from "./types";

const { timestamp, printf, combine } = winston.format;
const formatter = (log: Record<string, string>) =>
  `${log.timestamp} - ${log.level.toUpperCase()} - ${JSON.stringify(
    log.message
  )}`;

export const logger = winston.createLogger({
  level: "info",
  format: combine(
    timestamp({ format: "YYYY-MM-DD HH:mm:ss.SSS" }),
    printf(formatter)
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: SYSLOG }),
  ],
});

const createUserAndApiKey = (jobid: string) => {
  const today = new Date().toISOString().slice(0, 10).split("-").join("");
  const user = jobid.split(".")[1];
  const hashStr = user + today;
  const key = crypto.createHash("md5").update(hashStr).digest("hex");
  return { user, key, jobid };
};
const postApiRequest = async (url: string, values: Record<string, {}>) => {
  try {
    const { data } = await axios.post(url, values);
    return { status: true, data };
  } catch (err) {
    const { response } = err as AxiosError;
    const error = response?.data ?? (err as Error).message;
    return { status: false, message: JSON.stringify(error) };
  }
};
async function fetchBlastUpdate(url: string, payload: Record<string, string>) {
  const res = await postApiRequest(url, payload);
  if (res.status)
    return { ...res, ...res.data } as BlastUpdateAPISuccessResponse;

  logger.error({ action: "fetchBlastUpdate", err: res.message });
  return res as BlastUpdateAPIFailedResponse;
}

export function getStatReport(jobid: string) {
  const values = createUserAndApiKey(jobid);
  return fetchBlastUpdate(config.urls.blastUpdate, values);
}
export function getReportPeriod(): Period {
  const now = new Date();
  const startDay = new Date(now.getFullYear(), now.getMonth(), 1);
  const endDay = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const toFormat = (d: Date) => d.toISOString().slice(0, 10);
  return { startAt: toFormat(startDay), endAt: toFormat(endDay) };
}
export async function sendEmailInvoiceReports(report: EmailInvoiceReport) {
  const response = await postApiRequest(config.urls.invoiceBackend, report);
  logger.info({ action: "sendEmailInvoiceReports", response });
}
