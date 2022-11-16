declare global {
  namespace Express {
    interface Request {
      timestamp: number;
      withBanner: boolean;
    }
  }

  interface ConsentCookie {
    consent: boolean;
  }
}

export {};
