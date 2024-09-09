import fs from "fs";
import { StatReportDbConn } from "./db";
import { JOBIDS_FILE_PATH } from "./contants";

export const getJobids = (filepath: string) =>
  fs.readFileSync(filepath, { encoding: "utf-8" }).split("\n");

const getDuplicateIds = (stats: Array<{ id: number; hour: Date }>) => {
  const originalHours = new Set<number>();
  const duplicateIds = [];

  for (const { id, hour } of stats) {
    const statHour = hour.getTime();
    if (originalHours.has(statHour)) {
      duplicateIds.push(id);
    } else {
      originalHours.add(statHour);
    }
  }
  return duplicateIds;
};

export async function cleanUpDuplicateStats() {
  const jobids = getJobids(JOBIDS_FILE_PATH);
  const statsDb = new StatReportDbConn();

  for (const jobid of jobids) {
    if (!jobid) continue;

    const stats = await statsDb.getStatusBreakdown(jobid);
    const duplicateIds = getDuplicateIds(stats);

    if (duplicateIds.length === 0) continue;
    await statsDb.deleteDuplicateRecords(duplicateIds);
  }

  await statsDb.close();
}

cleanUpDuplicateStats();
