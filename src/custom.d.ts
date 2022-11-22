declare global {
  namespace Express {
    interface Request {
      timestamp: number;
      withBanner: boolean;
      channelId: number | undefined;
      channelName: string | undefined;
    }
  }

  interface ConsentCookie {
    consent: boolean;
  }
}

export {};
