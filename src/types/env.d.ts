/* eslint-disable @typescript-eslint/no-empty-interface */
import { z } from "zod";
import { serverSchema, clientSchema } from "../env";

type ServerEnv = z.infer<typeof serverSchema>;
type ClientEnv = z.infer<typeof clientSchema>;

declare global {
  namespace NodeJS {
    // Augment process.env with type-safe keys
    interface ProcessEnv extends ServerEnv, ClientEnv {}
  }
}
