import React from "react";
import * as z from "zod";

import { TagRegex } from "@xliic/common/platform";

import Input from "../../../components/Input";
import { ConfigScreen } from "../../../features/config/slice";
import { Container, Title } from "../layout";

export function MandatoryTags() {
  return (
    <>
      <Title>Mandatory Tags</Title>

      <Container>
        <Input label="Tags" name="platformMandatoryTags" />
      </Container>
    </>
  );
}

const schema = z
  .object({
    platformMandatoryTags: z
      .string()
      .regex(
        new RegExp(TagRegex),
        "Tags are invalid, must be a space separated list of key:value pairs, e.g. env:dev app:myapp"
      ),
  })
  .catchall(z.unknown());

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
