import fs from "fs";
import { StatReportDbConn } from "./db";
import { JOBIDS_FILE_PATH } from "./contants";
import { getStatReport } from "./utils";

const getJobs = (filepath: string) =>
  fs.readFileSync(filepath, { encoding: "utf-8" }).split("\n");

export async function FixStatusUpdate() {
  const jobs = getJobs(JOBIDS_FILE_PATH);
  const statsDb = new StatReportDbConn();

  for (const job of jobs) {
    if (!job || job.includes("sing")) continue;

    const statIds = await statsDb.getStatIds(job);
    if (statIds.length === 0) continue;

    const selected = statIds.pop()!;
    await statsDb.deleteDuplicateRecords(statIds.map((e) => e.id));

    const response = await getStatReport(job);
    if (!response.status) continue;

    await statsDb.updateStatsCounts(selected.id, response.data);
  }

  await statsDb.close();
}

FixStatusUpdate();
