import { Pool, PoolClient } from "pg";
import { config } from "./contants";
import { logger } from "./utils";

class DB {
  protected error: string = "";
  protected client: PoolClient | null = null;

  protected async connect() {
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
  private async instantiate() {
    if (!this.client) await this.connect();
  }

  public async getStatusBreakdown(jobid: string) {
    const action = { action: "getStatusBreakdown", data: { jobid } };
    logger.info(action);

    await this.instantiate();
    if (this.error) {
      logger.error({ ...action, err: this.error });
      return [];
    }

    const sql = `SELECT id, hour FROM sms_web_reports WHERE job_id = '${jobid}' ORDER BY id ASC`;
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
}
