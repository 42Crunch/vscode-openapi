import React from "react";
import * as z from "zod";
import styled from "styled-components";

import { ThemeColorVariables } from "@xliic/common/theme";
import { DefaultCollectionNamingPattern } from "@xliic/common/platform";

import Input from "../../../components/Input";
import { ConfigScreen, useFeatureSelector } from "../../../features/config/slice";
import { Container, Title } from "../layout";
import { useWatch } from "react-hook-form";

export function TemporaryCollection() {
  const {
    data: { platformCollectionNamingConvention },
  } = useFeatureSelector((state) => state.config);

  const name = useWatch({ name: "platformTemporaryCollectionName" });

  const conventionRegex =
    platformCollectionNamingConvention !== undefined
      ? new RegExp(platformCollectionNamingConvention.pattern)
      : undefined;

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
        {conventionRegex && !conventionRegex.test(name) && (
          <Error>
            <div>Collection name does not match your origanization naming convention.</div>
            <div>Example of a valid name: {platformCollectionNamingConvention?.example}</div>
          </Error>
        )}
      </Container>
    </>
  );
}

const Error = styled.div`
  color: var(${ThemeColorVariables.errorForeground});
`;

const schema = z
  .object({
    platformTemporaryCollectionName: z
      .string()
      .regex(
        new RegExp(DefaultCollectionNamingPattern),
        "Collection name is invalid, must match default pattern: " + DefaultCollectionNamingPattern
      ),
  })
  .catchall(z.unknown());

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
