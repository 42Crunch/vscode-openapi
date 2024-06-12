import * as z from "zod";
import styled from "styled-components";

import { ENV_VAR_NAME_REGEX, ENV_VAR_NAME_REGEX_MESSAGE } from "../core/playbook/variables";

import FormDialog from "./FormDialog";
import Input from "./fat-fields/Input";
import Textarea from "./fat-fields/Textarea";

export default function CreateVariableDialog({
  open,
  onOpenChange,
  onCreateVariable,
  jsonPointer,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreateVariable: (varname: string, jsonPointer: string) => void;
  jsonPointer: string;
}) {
  const defaultValues = {
    varname: "",
    jsonPointer,
  };
  const existing: string[] = [];

  const schema = z.object({
    varname: z
      .string()
      .min(1)
      .regex(ENV_VAR_NAME_REGEX(), {
        message: ENV_VAR_NAME_REGEX_MESSAGE,
      })
      .refine((value) => !existing.includes(value), {
        message: "Already exists",
      }),
    jsonPointer: z.string().min(1),
  });

  const onSubmit = (data: any) => {
    onCreateVariable(data.varname, data.jsonPointer);
  };

  return (
    <FormDialog
      title="Create variable"
      defaultValues={defaultValues}
      schema={schema}
      onSubmit={onSubmit}
      open={open}
      onOpenChange={onOpenChange}
    >
      <Container>
        <Input label="Name" name="varname" />
        <Textarea label="JSON Pointer" name="jsonPointer" />
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
