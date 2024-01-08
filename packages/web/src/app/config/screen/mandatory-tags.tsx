import React from "react";
import * as z from "zod";
import Input from "../../../components/Input";
import { ConfigScreen, useFeatureDispatch } from "../../../features/config/slice";
import { Container, Test, Title } from "../layout";

export function MandatoryTags() {
  return (
    <>
      <Title>Mandatory Tags</Title>

      <Container>
        <Input label="Collection Name" name="platformServices.auto" />
      </Container>
    </>
  );
}

const schema = z.object({}).catchall(z.unknown());

const screen: {
  id: ConfigScreen;
  label: string;
  schema: z.ZodObject<any>;
  form: React.FC;
} = {
  id: "mandatory-tags",
  label: "Mandatory Tags",
  schema,
  form: MandatoryTags,
};

export default screen;
