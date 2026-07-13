import * as z from "zod";

import { Playbook } from "@xliic/scanconf";

import Button from "../../../components/Button";

import FormDialog from "../../../new-components/FormDialog";
import { ENV_VAR_NAME_REGEX, ENV_VAR_NAME_REGEX_MESSAGE } from "../../../core/playbook/variables";
import NewCredentialForm from "./NewCredentialForm";

export default function NewCredentialDialog({
  onAddCredential,
  onAddSecurityProfile,
  existing,
}: {
  onAddCredential: (id: string, credential: Playbook.Credential) => void;
  onAddSecurityProfile: (profile: Playbook.SecurityProfile) => void;
  existing: string[];
}) {
  const defaultValues = {
    id: "",
    type: "apiKey",
    in: "header",
    name: "",
    description: "",
    credentialName: "",
    credentialValue: "",
    clientCertificate: "",
    clientCertificatePassword: "",
    caServerCertificate: "",
  };

  // Fields are validated conditionally in superRefine based on the selected
  // type. They are kept optional here because react-hook-form only submits
  // values for the currently mounted fields, so the fields belonging to the
  // other mode may be absent.
  const schema = z
    .object({
      id: z.string().optional(),
      type: z.string(),
      in: z.string().optional(),
      name: z.string().optional(),
      description: z.string().optional(),
      credentialName: z.string().optional(),
      credentialValue: z.string().optional(),
      clientCertificate: z.string().optional(),
      clientCertificatePassword: z.string().optional(),
      caServerCertificate: z.string().optional(),
    })
    .superRefine((data, ctx) => {
      if (data.type === "mTLS") {
        // id/credential fields are not used for the mTLS security profile
        if (!data.clientCertificate) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["clientCertificate"],
            message: "Required",
          });
        }
        if (!data.clientCertificatePassword) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["clientCertificatePassword"],
            message: "Required",
          });
        }
        return;
      }

      if (!ENV_VAR_NAME_REGEX().test(data.id ?? "")) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["id"],
          message: ENV_VAR_NAME_REGEX_MESSAGE,
        });
      } else if (existing.includes(data.id ?? "")) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["id"],
          message: "Already exists",
        });
      }
      if (!ENV_VAR_NAME_REGEX().test(data.credentialName ?? "")) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["credentialName"],
          message: ENV_VAR_NAME_REGEX_MESSAGE,
        });
      }
      if (!data.credentialValue) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["credentialValue"],
          message: "Required",
        });
      }
    });

  const onSubmit = (data: any) => {
    if (data.type === "mTLS") {
      onAddSecurityProfile({
        clientCertificate: data.clientCertificate,
        clientCertificatePassword: data.clientCertificatePassword,
        caServerCertificate: data.caServerCertificate || undefined,
      });
      return;
    }

    const methods = {
      [data.credentialName]: {
        credential: data.credentialValue,
        requests: [],
        description: "",
      },
    };

    onAddCredential(
      data.id,
      data.type === "bearer" || data.type === "basic"
        ? // skip name and in
          {
            type: data.type,
            default: data.credentialName,
            description: data.description,
            methods,
          }
        : {
            type: data.type,
            default: data.credentialName,
            in: data.in,
            name: data.name,
            description: data.description,
            methods,
          }
    );
  };

  return (
    <FormDialog
      title="New security scheme"
      defaultValues={defaultValues}
      schema={schema}
      onSubmit={onSubmit}
      trigger={<Button style={{ width: "100%" }}>New security scheme</Button>}
    >
      <NewCredentialForm />
    </FormDialog>
  );
}
