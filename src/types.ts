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
