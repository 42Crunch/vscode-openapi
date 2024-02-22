import styled from "styled-components";

import { ThemeColorVariables } from "@xliic/common/theme";

export default function JsonData({
  value,
  trailingComma = false,
}: {
  value: any;
  trailingComma: boolean;
}) {
  if (typeof value === "object") {
    if (Array.isArray(value)) {
      return <ArrayRenderer array={value} trailingComma={trailingComma} />;
    } else {
      return <ObjectRenderer object={value} trailingComma={trailingComma} />;
    }
  } else {
    return <PrimitiveRenderer value={value} trailingComma={trailingComma} />;
  }
}

function ObjectRenderer({
  object,
  trailingComma,
}: {
  object: Record<string, any>;
  trailingComma: boolean;
}) {
  if (object === null) {
    return <code>null</code>;
  }

  const entries = Object.entries(object);

  if (entries.length === 0) {
    return <code>{trailingComma ? "{}," : "{}"}</code>;
  }

  return (
    <Container>
      <code>{"{"}</code>
      <div style={{ marginLeft: "20px" }}>
        {entries.map(([key, value], index, array) => (
          <div key={key}>
            <code>{`"${key}": `}</code>
            <JsonData value={value} trailingComma={index < array.length - 1} />
          </div>
        ))}
      </div>
      <code>{trailingComma ? "}," : "}"}</code>
    </Container>
  );
}

function ArrayRenderer({ array, trailingComma }: { array: any[]; trailingComma: boolean }) {
  return (
    <Container>
      <code>[</code>
      <div style={{ marginLeft: "20px" }}>
        {array.map((item, index) => (
          <div key={index}>
            <JsonData value={item} trailingComma={index < array.length - 1} />
          </div>
        ))}
      </div>
      <code>{trailingComma ? "]," : "]"}</code>
    </Container>
  );
}

function PrimitiveRenderer({ value, trailingComma }: { value: any; trailingComma: boolean }) {
  const serialized = JSON.stringify(value);
  return <code>{trailingComma ? `${serialized},` : `${serialized}`}</code>;
}

const Container = styled.div`
  code {
    color: var(${ThemeColorVariables.foreground});
    background-color: var(${ThemeColorVariables.background});
    border: none;
    padding: none;
  }
`;
