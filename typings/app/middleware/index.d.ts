// This file is created by egg-ts-helper@1.25.6
// Do not modify this file!!!!!!!!!

import 'egg';
import ExportAuthentication from '../../../app/middleware/authentication';
import ExportRequestLogging from '../../../app/middleware/requestLogging';

declare module 'egg' {
  interface IMiddleware {
    authentication: typeof ExportAuthentication;
    requestLogging: typeof ExportRequestLogging;
  }
}
