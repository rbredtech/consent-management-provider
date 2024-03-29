/* eslint-disable no-unused-vars */
declare global {
  namespace Express {
    interface Request {
      timestamp: number;
      channelId: number | undefined;
      channelName: string | undefined;
      isp7: boolean;
    }
  }
}

export {};
