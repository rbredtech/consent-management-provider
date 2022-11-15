declare global {
  namespace Express {
    interface Request {
      timestamp: number;
      withBanner: boolean;
    }
  }
}

export {};
