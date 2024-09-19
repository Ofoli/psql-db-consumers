import winston from "winston";
import crypto from "crypto";
import axios, { type AxiosError } from "axios";
import { SYSLOG, BLAST_UPDATE_URL } from "./contants";
import type {
  BlastUpdateAPIFailedResponse,
  BlastUpdateAPISuccessResponse,
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

async function fetchBlastUpdate(url: string, payload: Record<string, string>) {
  try {
    const res = await axios.post(url, payload);
    return { status: true, ...res.data } as BlastUpdateAPISuccessResponse;
  } catch (err) {
    const { response } = err as AxiosError;
    let error = response?.data;
    if (!error) error = { status: false, message: (err as Error).message };
    logger.error({ action: "fetchBlastUpdate", err: error });
    return error as BlastUpdateAPIFailedResponse;
  }
}

export function getStatReport(jobid: string) {
  const values = createUserAndApiKey(jobid);
  return fetchBlastUpdate(BLAST_UPDATE_URL, values);
}
