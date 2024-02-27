import * as z from "zod";
import styled from "styled-components";

import { Playbook } from "@xliic/scanconf";

import Button from "../../../components/Button";

import FormDialog from "../../../new-components/FormDialog";
import { ENV_VAR_NAME_REGEX, ENV_VAR_NAME_REGEX_MESSAGE } from "../../../core/playbook/variables";
import TestContents from "./TestContents";
import Input from "../../../new-components/fat-fields/Input";

export default function NewAuthorizationTestDialog({
  onAddTest,
  existing,
  credentials,
}: {
  onAddTest: (id: string, credential: Playbook.AuthenticationSwappingTest) => void;
  existing: string[];
  credentials: Playbook.Credentials;
}) {
  const defaultValues = {
    id: "",
    key: "authentication-swapping-bola",
    source: [""],
    target: [""],
  };

  const schema = z.object({
    id: z
      .string()
      .regex(ENV_VAR_NAME_REGEX(), {
        message: ENV_VAR_NAME_REGEX_MESSAGE,
      })
      .refine((value) => !existing.includes(value), {
        message: "Already exists",
      }),
    key: z.string(),
    source: z.array(z.string().min(1)),
    target: z.array(z.string().min(1)),
  });

  const onSubmit = (data: any) => {
    onAddTest(data.id, { key: data.key, source: data.source, target: data.target });
  };

  return (
    <FormDialog
      title="New authorization test"
      defaultValues={defaultValues}
      schema={schema}
      onSubmit={onSubmit}
      trigger={<Button style={{ width: "100%" }}>New authorization test</Button>}
    >
      <Container>
        <Input label="Test ID" name="id" />
        <TestContents credentials={credentials} />
      </Container>
    </FormDialog>
  );
}

const Container = styled.div`
  padding: 8px;
  gap: 8px;
  display: flex;
  flex-direction: column;
`;
