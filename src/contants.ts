import dotenv from "dotenv";
import path from "path";

const ENV_FILE_PATH = path.join(__dirname, "..", ".env");
export const SYSLOG = path.join(__dirname, "..", "logs", "syslog.log");
export const JOBIDS_FILE_PATH = path.join(
  __dirname,
  "..",
  "files",
  "jobids.txt"
);

dotenv.config({ path: ENV_FILE_PATH });

export const config = {
  db: {
    host: process.env.REPORT_DB_HOST!,
    port: parseInt(process.env.REPORT_DB_PORT!),
    user: process.env.REPORT_DB_USER!,
    password: process.env.REPORT_DB_PASS!,
    database: process.env.REPORT_DB_NAME!,
  },
  urls: {
    blastUpdate: process.env.BLAST_UPDATE_URL!,
    invoiceBackend: process.env.INVOICE_BACKEND_URL!,
  },
};
