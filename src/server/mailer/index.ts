import { ConsoleMailer } from "./console";
import type { Mailer } from "./types";

export const mailer: Mailer = new ConsoleMailer();
export type { Mailer } from "./types";
