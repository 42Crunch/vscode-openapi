import React from "react";
import * as z from "zod";
import Input from "../../../components/Input";
import { ConfigScreen, useFeatureDispatch } from "../../../features/config/slice";
import { Container, Test, Title } from "../layout";

export function TemporaryCollection() {
  return (
    <>
      <Title>Temporary Collection Name</Title>

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
  id: "temporary-collection",
  label: "Temporary Collection",
  schema,
  form: TemporaryCollection,
};

export default screen;
