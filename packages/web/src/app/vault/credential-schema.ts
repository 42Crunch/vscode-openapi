import { SchemeType } from "@xliic/common/vault";
import * as z from "zod";

const SCHEME_NAME_REGEX = /^[a-zA-Z0-9\._\-]*$/;
const SCHEME_NAME_REGEX_MESSAGE =
  "Only alphanumeric characters, dot, underscore or hyphen are allowed in the scheme name";

const nameSchema = (self: string | undefined, existing: string[]) =>
  z
    .string()
    .regex(SCHEME_NAME_REGEX, {
      message: SCHEME_NAME_REGEX_MESSAGE,
    })
    .refine((value) => !existing.includes(value) || value === self, {
      message: "Already exists",
    });

export function credentialFormSchema(
  self: string | undefined,
  existing: string[]
): Record<SchemeType, z.ZodObject<any> | undefined> {
  return {
    apiKey: z.object({
      name: nameSchema(self, existing),
      key: z.string().trim().min(1, { message: "Api Key is required" }),
    }),
    alias: undefined,
    basic: z.object({
      name: nameSchema(self, existing),
      username: z.string().trim().min(1, { message: "Username is required" }),
      password: z.string().min(1, { message: "Password is required" }),
    }),
    bearer: z.object({
      name: nameSchema(self, existing),
      token: z.string().trim().min(1, { message: "Token is required" }),
      format: z.string().trim().min(1, { message: "Format is required" }),
    }),
    oauth2: z.object({
      name: nameSchema(self, existing),
      token: z.string().trim().min(1, { message: "Access Token is required" }),
    }),
    openIdConnect: z.object({
      name: nameSchema(self, existing),
      token: z.string().trim().min(1, { message: "Access Token is required" }),
    }),
    mutualTLS: z.object({
      name: nameSchema(self, existing),
      pkcsData: z.string().trim().min(1, { message: "PKCS12 Data is required" }),
      pkcsPassword: z.string().min(1, { message: "PKCS12 Password is required" }),
    }),
  };
}
