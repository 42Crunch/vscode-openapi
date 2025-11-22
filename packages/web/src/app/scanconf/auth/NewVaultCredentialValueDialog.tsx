import { FieldValues, useWatch } from "react-hook-form";
import * as z from "zod";

import { Playbook } from "@xliic/scanconf";

import Input from "../../../components/Input";
import FormDialog from "../../../new-components/FormDialog";
import { ENV_VAR_NAME_REGEX, ENV_VAR_NAME_REGEX_MESSAGE } from "../../../core/playbook/variables";
import { RadioGroup } from "../../../new-components/fields/RadioGroup";
import styled from "styled-components";
import Select, { SelectOption } from "../../../new-components/fat-fields/Select";
import { useAppSelector } from "../store";

export default function NewVaultCredentialValueDialog({
  onAddCredentialValue,
  existing,
  isOpen,
  setOpen,
  scheme,
}: {
  existing: string[];
  scheme: string;
  onAddCredentialValue: (name: string, value: Playbook.CredentialMethod) => void;
  isOpen: boolean;
  setOpen: (open: boolean) => void;
}) {
  const vault = useAppSelector((state) => state.vault.data);
  const vaultScheme = vault.schemes[scheme] || {};

  const credentialNames = Object.keys(
    "credentials" in vaultScheme ? vaultScheme.credentials : {}
  ).map((name) => ({ value: name, label: name }));

  const defaultValues: FormSchema = {
    name: "",
    type: "auto",
    vaultName: credentialNames[0]?.value || "",
  };

  const onSubmit = (values: FormSchema) => {
    if (values.type === "auto") {
      onAddCredentialValue(values.name, { credential: "{{$vault}}", requests: [] });
    } else {
      onAddCredentialValue(values.name, {
        credential: `{{$vault:${values.vaultName}}}`,
        requests: [],
      });
    }
  };

  const schema = formSchema.extend({
    name: formSchema.shape.name.refine((value) => !existing.includes(value), {
      message: "Already exists",
    }),
  });

  return (
    <FormDialog
      title="Select Vault credential"
      open={isOpen}
      onOpenChange={setOpen}
      defaultValues={defaultValues}
      onSubmit={onSubmit}
      schema={schema}
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

      <RadioGroup
        name="type"
        options={[
          { value: "auto", label: "Automatic" },
          { value: "name", label: "By name" },
        ]}
      />

      {type == "auto" && (
        <div>
          The credential will be automatically retrieved from the Vault based on the scan
          configuration.
        </div>
      )}
      {type == "name" && <Select label="Vault credential name" name="vaultName" options={names} />}
    </FormContainer>
  );
}

const formSchema = z.object({
  name: z.string().regex(ENV_VAR_NAME_REGEX(), {
    message: ENV_VAR_NAME_REGEX_MESSAGE,
  }),
  type: z.enum(["auto", "name"]),
  vaultName: z.string().min(1),
});

type FormSchema = z.infer<typeof formSchema>;

const FormContainer = styled.div`
  min-height: 300px;
  display: flex;
  flex-direction: column;
  gap: 16px;
`;
