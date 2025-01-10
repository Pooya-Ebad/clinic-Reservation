import 'express';
import { ClinicPayload, TokenPayload } from '../types/payload';

declare module 'express' {
  export interface Request {
    user?: TokenPayload,
    clinic?: ClinicPayload
  }
}