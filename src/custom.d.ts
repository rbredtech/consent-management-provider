declare global {
  namespace Express {
    interface Request {
      timestamp: number;
      withBanner: boolean;
      channelId: number | undefined;
      channelName: string | undefined;
      isp7: boolean;
    }
  }

  interface ConsentCookie {
    consent: boolean;
  }
}

export {};
