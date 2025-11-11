import * as z from "zod";

import { CredentialIdentifier, SchemeType, SecurityCredential } from "@xliic/common/vault";

import FormDialog from "../../new-components/FormDialog";
import EditCredentialForm from "./EditCredentialForm";

const SCHEME_NAME_REGEX = /^[a-zA-Z0-9\._\-]*$/;
const SCHEME_NAME_REGEX_MESSAGE =
  "Only alphanumeric characters, dot, underscore or hyphen are allowed in the scheme name";

export default function EditCredentialDialog({
  onCredentialUpdate,
  id,
  credential,
  schemeType,
  existing,
  isOpen,
  setOpen,
}: {
  onCredentialUpdate: (id: CredentialIdentifier, name: string, value: SecurityCredential) => void;
  id: CredentialIdentifier;
  credential: SecurityCredential;
  schemeType: SchemeType;
  existing: string[];
  isOpen: boolean;
  setOpen: (open: boolean) => void;
}) {
  const defaultValues = {
    name: id.credential,
    ...credential,
  };

  const nameSchema = z
    .string()
    .regex(SCHEME_NAME_REGEX, {
      message: SCHEME_NAME_REGEX_MESSAGE,
    })
    .refine((value) => !existing.includes(value) || value === id.credential, {
      message: "Already exists",
    });

  const credentialFormSchema: Record<SchemeType, z.ZodObject<any> | undefined> = {
    apiKey: z.object({
      name: nameSchema,
      key: z.string().trim().min(1, { message: "Api Key is required" }),
    }),
    alias: undefined,
    basic: z.object({
      name: nameSchema,
      username: z.string().trim().min(1, { message: "Username is required" }),
      password: z.string().min(1, { message: "Password is required" }),
    }),
    bearer: undefined,
    oauth2: undefined,
    openIdConnect: undefined,
    mutualTLS: undefined,
  };

  const onSubmit = (data: any) => {
    console.log("EditCredentialDialog onSubmit:", data);
    onCredentialUpdate(id, data.name, data);
  };

  return (
    <FormDialog
      title="Edit credential"
      defaultValues={defaultValues}
      schema={credentialFormSchema[schemeType]}
      onSubmit={onSubmit}
      open={isOpen}
      onOpenChange={setOpen}
      noOverflow
    >
      <EditCredentialForm schemeType={schemeType} />
    </FormDialog>
  );
}
