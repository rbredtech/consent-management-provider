/* eslint-disable no-unused-vars */
declare global {
  namespace Express {
    interface Request {
      timestamp: number;
      channelId: number | undefined;
      channelGroup: string | undefined;
    }
  }
}

export {};
