declare global {
  namespace Express {
    interface Request {
      withBanner: boolean;
    }
  }
}

export {};
