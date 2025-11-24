import { useWatch } from "react-hook-form";
import * as z from "zod";
import styled from "styled-components";

import { Playbook } from "@xliic/scanconf";
import { ThemeColorVariables } from "@xliic/common/theme";

import Input from "../../../new-components/fat-fields/Input";
import FormDialog from "../../../new-components/FormDialog";
import { ENV_VAR_NAME_REGEX, ENV_VAR_NAME_REGEX_MESSAGE } from "../../../core/playbook/variables";
import { RadioGroup } from "../../../new-components/fields/RadioGroup";
import Select, { SelectOption } from "../../../new-components/fat-fields/Select";
import { useAppSelector } from "../store";
import { Plus } from "../../../icons";

export default function NewCredentialValueDialog({
  onAddCredentialValue,
  existing,
  scheme,
}: {
  existing: string[];
  scheme: string;
  onAddCredentialValue: (name: string, value: Playbook.CredentialMethod) => void;
}) {
  const vault = useAppSelector((state) => state.vault.data);
  const vaultScheme = vault.schemes[scheme] || {};

  const credentialNames = Object.keys(
    "credentials" in vaultScheme ? vaultScheme.credentials : {}
  ).map((name) => ({ value: name, label: name }));

  const defaultValues: FormSchema = {
    name: "",
    type: "auto",
    vaultByName: credentialNames[0]?.value || "",
    manual: "",
  };

  const onSubmit = (values: FormSchema) => {
    if (values.type === "auto") {
      onAddCredentialValue(values.name, { credential: "{{$vault}}", requests: [] });
    } else if (values.type === "by-name") {
      onAddCredentialValue(values.name, {
        credential: `{{$vault:${values.vaultByName}}}`,
        requests: [],
      });
    } else if (values.type === "manual") {
      onAddCredentialValue(values.name, { credential: values.manual, requests: [] });
    }
  };

  const schema = formSchema.superRefine((data, ctx) => {
    if (existing.includes(data.name)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Already exists",
        path: ["name"],
      });
    }
    if (data.type === "by-name" && data.vaultByName.trim() === "") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Vault credential name is required",
        path: ["vaultByName"],
      });
    }
    if (data.type === "manual" && data.manual.trim() === "") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Credential value is required",
        path: ["manual"],
      });
    }
  });

  return (
    <FormDialog
      title="New credential"
      defaultValues={defaultValues}
      onSubmit={onSubmit}
      schema={schema}
      trigger={
        <AddRequestButton>
          <Plus />
        </AddRequestButton>
      }
    >
      <ValueForm names={credentialNames} />
    </FormDialog>
  );
}

function ValueForm({ names }: { names: SelectOption[] }) {
  const type = useWatch<FormSchema>({ name: "type" });

  return (
    <FormContainer>
      <Input label="Credential name" name="name" />

      <div>How the credential value is provided</div>
      <RadioGroup
        name="type"
        options={[
          { value: "auto", label: "Automatically" },
          { value: "by-name", label: "By name" },
          { value: "manual", label: "Manually" },
        ]}
      />

      {type == "auto" && <div></div>}

      {type == "by-name" && (
        <Select label="Vault credential name" name="vaultByName" options={names} />
      )}

      {type == "manual" && <Input label="Credential value" name="manual" />}
    </FormContainer>
  );
}

const formSchema = z.object({
  name: z.string().regex(ENV_VAR_NAME_REGEX(), {
    message: ENV_VAR_NAME_REGEX_MESSAGE,
  }),
  type: z.enum(["auto", "by-name", "manual"]),
  vaultByName: z.string(),
  manual: z.string(),
});

type FormSchema = z.infer<typeof formSchema>;

const FormContainer = styled.div`
  min-height: 300px;
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const AddRequestButton = styled.button`
  border: none;
  background-color: transparent;
  cursor: pointer;
  > svg {
    fill: var(${ThemeColorVariables.foreground});
  }
`;
