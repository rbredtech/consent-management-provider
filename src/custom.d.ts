declare global {
  namespace Express {
    interface Request {
      timestamp: number;
      channelId: number | undefined;
      channelName: string | undefined;
      channelGroup: string | undefined;
    }
  }
}

export {};
