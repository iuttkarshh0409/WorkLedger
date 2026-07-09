import * as express from 'express';

declare global {
  namespace Express {
    interface Request {
      requestId: string;
      user?: {
        id: string;
        role: string;
        email: string;
        name: string;
      };
      workspace?: {
        id: string;
      };
    }
  }
}
