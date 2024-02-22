import styled from "styled-components";

import { ThemeColorVariables } from "@xliic/common/theme";

export default function JsonData({ value }: { value: any }) {
  if (typeof value === "object") {
    if (Array.isArray(value)) {
      return <ArrayRenderer array={value} />;
    } else {
      return <ObjectRenderer object={value} />;
    }
  } else {
    return <PrimitiveRenderer value={value} />;
  }
}

function ObjectRenderer({ object }: { object: Record<string, any> }) {
  if (object === null) {
    return <code>null</code>;
  }

  return (
    <Container>
      <code>{"{"}</code>
      <div style={{ marginLeft: "20px" }}>
        {Object.entries(object).map(([key, value], index, array) => (
          <div key={key}>
            <code>{`"${key}": `}</code>
            <JsonData value={value} />
            {index < array.length - 1 && <code>,</code>}
          </div>
        ))}
      </div>
      <code>{"}"}</code>
    </Container>
  );
}

function ArrayRenderer({ array }: { array: any[] }) {
  return (
    <Container>
      <code>[</code>
      <div style={{ marginLeft: "20px" }}>
        {array.map((item, index) => (
          <div key={index}>
            <JsonData value={item} />
          </div>
        ))}
      </div>
      <code>]</code>
    </Container>
  );
}

function PrimitiveRenderer({ value }: { value: any }) {
  return <code>{JSON.stringify(value)}</code>;
}

const Container = styled.div`
  code {
    color: var(${ThemeColorVariables.foreground});
    background-color: var(${ThemeColorVariables.background});
    border: none;
    padding: none;
  }
`;
