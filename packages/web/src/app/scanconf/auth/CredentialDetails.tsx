import styled from "styled-components";
import { useFormContext } from "react-hook-form";
import * as z from "zod";

import { Playbook } from "@xliic/scanconf";

import Form from "../../../new-components/Form";
import { unwrapCredential, wrapCredential } from "./form";
import Input from "../../../new-components/fat-fields/Input";
import Select from "../../../new-components/fat-fields/Select";
import { parseDuration } from "../../../core/duration";

export default function CredentialDetails({
  credential,
  saveCredential,
}: {
  credential: Playbook.Credential;
  saveCredential: (credential: Playbook.Credential) => void;
}) {
  const schema = z.object({
    type: z.string(),
    in: z.string(),
    name: z.string(),
    ttl: z.union([
      z.literal(""),
      z.string().refine((value) => parseDuration(value) !== undefined, {
        message: "Invalid duration format. Examples: '500ms', '15s', '2h30m'",
      }),
    ]),
    tti: z.union([
      z.literal(""),
      z.string().refine((value) => parseDuration(value) !== undefined, {
        message: "Invalid duration format. Examples: '500ms', '15s', '2h30m'",
      }),
    ]),
    default: z.string(),
    methods: z.any(),
  });

  return (
    <Form
      data={credential}
      saveData={saveCredential}
      wrapFormData={wrapCredential}
      unwrapFormData={unwrapCredential}
      schema={schema}
    >
      <CredentialGeneral />
    </Form>
  );
}

export function CredentialGeneral() {
  const { getValues } = useFormContext();
  const methods = getValues("methods") || [];
  const type = getValues("type");

  return (
    <Container>
      <Input label="Type" name="type" disabled />
      {type !== "basic" && type !== "bearer" && (
        <>
          <Input label="Location" name="in" disabled />
          <Input label="Name" name="name" disabled />
        </>
      )}
      <Input
        label="TTL"
        name="ttl"
        // description="The hard timeout before re-running requests defined for each credentials values. Example values: '300s', '300ms', '1h',  valid time units are 'ns', 'us' (or 'µs'), 'ms', 's', 'm', 'h'."
      />
      <Input
        label="TTI"
        name="tti"
        // description="The idle timeout before re-running requests defined for each credentials value. Example values: '300s', '300ms', '1h',  valid time units are 'ns', 'us' (or 'µs'), 'ms', 's', 'm', 'h'."
      />
      <Select
        label="Default credential name"
        name="default"
        options={methods.map((method: any) => ({ label: method.key, value: method.key }))}
      />
    </Container>
  );
}

export const Container = styled.div`
  padding-top: 8px;
  display: flex;
  flex-direction: column;
  gap: 8px;
`;
