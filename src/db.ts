import { Pool, PoolClient } from "pg";
import { config } from "./contants";
import { logger } from "./utils";
import type { BlastUpdateData, Period, EmailReport } from "./types";

class DB {
  protected error: string = "";
  protected client: PoolClient | null = null;

  protected async connect() {
    if (this.client) return;

    try {
      const dbpool = new Pool({
        host: config.db.host,
        port: config.db.port,
        user: config.db.user,
        password: config.db.password,
        database: config.db.database,
      });

      const pool = await dbpool.connect();
      this.client = pool;
    } catch (error) {
      this.error = JSON.stringify(error);
    }
  }

  protected async query(sql: string, params?: Array<Array<number>>) {
    if (!this.client) return { status: false, err: this.error };
    try {
      const results = await this.client.query(sql, params);
      return { status: true, data: results };
    } catch (error) {
      const { message } = error as Error;
      return { status: false, err: message };
    }
  }

  public async close() {
    if (this.client) {
      this.client.release();
      this.client = null;
    }
  }
}

export class StatReportDbConn extends DB {
  public async getStatIds(jobid: string): Promise<Array<{ id: number }>> {
    const action = { action: "getStatIds", data: { jobid } };
    logger.info(action);

    await this.connect();
    if (this.error) {
      logger.error({ ...action, err: this.error });
      return [];
    }

    const sql = `SELECT id FROM sms_web_reports WHERE job_id = '${jobid}'`;
    const response = await this.query(sql);
    if (!response.status) {
      logger.error({ ...action, err: response.err });
      return [];
    }
    return response.data?.rows ?? [];
  }
  public async deleteDuplicateRecords(duplicateIds: Array<number>) {
    const sql = `DELETE FROM sms_web_reports WHERE id = ANY($1::int[])`;
    const response = await this.query(sql, [duplicateIds]);
    if (!response.status) {
      logger.error({
        action: "deleteDuplicateRecords",
        data: duplicateIds,
        err: response.err,
      });
    }
  }
  public async updateStatsCounts(id: number, statCounts: BlastUpdateData) {
    const action = { action: "updateStatsCounts", data: { id, statCounts } };
    const { expired, delivered, undelivered, rejected } = statCounts;
    const sql = `UPDATE sms_web_reports 
                 SET acknowledged = 0,
                  expired = ${expired ?? 0},
                  rejected = ${rejected ?? 0},
                  delivered = ${delivered ?? 0},
                  undelivered = ${undelivered ?? 0}
                 WHERE id = '${id}'`;
    const response = await this.query(sql);
    if (!response.status) logger.error({ ...action, err: response.err, sql });
  }
}

export class EmailReportDb extends DB {
  public async fetchMonthlyStats(
    type: "api" | "web",
    period: Period
  ): Promise<EmailReport> {
    const action = { action: "fetchMonthlyStats", data: { type, period } };
    const tableName = `email_${type}_reports`;
    const { startAt, endAt } = period;
    const sql = `SELECT username, 
                  sum(sent) as SENT,
                  sum(delivered) as DELIVERED,
                  sum(clicked) as CLICKED,
                  sum(opened) as OPENED,  
                  sum(bounced) as BOUNCED, 
                  sum(rejected) as REJECTED,
                  sum(complaint) as COMPLAINT,
                  sum(render_failure) + sum(failed) as FAILED
                FROM ${tableName}
                WHERE hour >= '${startAt}' and hour < '${endAt}'
                GROUP BY username;`;

    await this.connect();
    if (this.error) {
      logger.error({ ...action, err: this.error });
      return [];
    }

    const response = await this.query(sql);
    if (!response.status) {
      logger.error({ ...action, err: response.err });
      return [];
    }
    return response.data?.rows ?? [];
  }
}
