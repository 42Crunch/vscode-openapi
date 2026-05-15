import { graphqlExtensions } from "@xliic/common/graphql";

export const yamlSelectors = [{ scheme: "file", language: "yaml" }];

export const graphqlSelectors = [
  { scheme: "file", pattern: `**/*.{${graphqlExtensions.join(",")}}` },
];

export const jsonSelectors = [
  { scheme: "file", language: "json" },
  { scheme: "file", language: "jsonc" },
];

export const allSelectors = [...yamlSelectors, ...graphqlSelectors, ...jsonSelectors];
