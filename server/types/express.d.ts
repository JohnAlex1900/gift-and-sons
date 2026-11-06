import { Request } from "express";
import { DecodedIdToken } from "firebase-admin/auth";

declare module "express" {
  interface Request {
    user?: DecodedIdToken;
  }
}

export interface AuthenticatedRequest extends Request {
  user?: DecodedIdToken;
}
