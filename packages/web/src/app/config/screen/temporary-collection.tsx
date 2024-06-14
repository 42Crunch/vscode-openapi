import * as z from "zod";

import { DefaultCollectionNamingPattern, NamingConvention } from "@xliic/common/platform";

import Input from "../../../components/Input";
import { ConfigScreen } from "../../../features/config/slice";
import { Container, Title } from "../layout";

export function TemporaryCollection() {
  return (
    <>
      <Title>Temporary Collection Name</Title>
      <p>
        The name of the collection for temporary APIs. Make sure that the name matches the
        collection naming pattern defined in your organization.
      </p>
      <p>
        WARNING: Do not use existing collection name. This collection will be used for temporary
        APIs, and all existing APIs in this collection will be deleted.
      </p>
      <Container>
        <Input label="Collection Name" name="platformTemporaryCollectionName" />
      </Container>
    </>
  );
}

export default function screen(namingConvention?: NamingConvention): ConfigScreen {
  const emptyNamingConvention: NamingConvention = {
    pattern: ".*",
    example: "",
    description: "Any string",
  };

  const convention = namingConvention || emptyNamingConvention;

  const schema = z.object({
    platformTemporaryCollectionName: z.intersection(
      z
        .string()
        .regex(
          new RegExp(DefaultCollectionNamingPattern),
          `Collection name is invalid, must match default pattern: ${DefaultCollectionNamingPattern}`
        ),
      z
        .string()
        .regex(
          new RegExp(convention.pattern),
          `Collection name does not match your origanization naming convention. Example of a valid name: ${convention.example}`
        )
    ),
  });

  return {
    id: "temporary-collection",
    label: "Temporary Collection",
    schema,
    form: TemporaryCollection,
  };
}
