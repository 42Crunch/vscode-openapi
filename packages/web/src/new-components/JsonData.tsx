import styled from "styled-components";

import { ThemeColorVariables } from "@xliic/common/theme";
import { joinJsonPointer, Path } from "@xliic/preserving-json-yaml-parser";

import { ContextMenu, MenuItem } from "./ContextMenu";
import { useState } from "react";
import { BracketsCurly, Copy } from "../icons";
import CreateVariableDialog from "./CreateVariableDialog";

type MenuHandlers = {
  onCopy: (value: string) => void;
  onCreateVariable: (varname: string, jsonPointer: string) => void;
};

export default function JsonDataDefault({
  value,
  menuHandlers,
}: {
  value: unknown;
  menuHandlers?: MenuHandlers;
}) {
  return <JsonData path={[]} value={value} trailingComma={false} menuHandlers={menuHandlers} />;
}

function JsonData({
  value,
  trailingComma,
  menuHandlers,
  path,
}: {
  value: unknown;
  trailingComma: boolean;
  menuHandlers?: MenuHandlers;
  path: Path;
}) {
  if (typeof value === "object") {
    if (Array.isArray(value)) {
      return (
        <ArrayRenderer
          array={value}
          path={path}
          menuHandlers={menuHandlers}
          trailingComma={trailingComma}
        />
      );
    } else {
      return (
        <ObjectRenderer
          object={value}
          path={path}
          menuHandlers={menuHandlers}
          trailingComma={trailingComma}
        />
      );
    }
  } else {
    return (
      <PrimitiveRenderer
        value={value}
        path={path}
        menuHandlers={menuHandlers}
        trailingComma={trailingComma}
      />
    );
  }
}

function ObjectRenderer({
  object,
  trailingComma,
  menuHandlers,
  path,
}: {
  object: object | null;
  menuHandlers?: MenuHandlers;
  trailingComma: boolean;
  path: Path;
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
            <JsonData
              value={value}
              path={[...path, key]}
              menuHandlers={menuHandlers}
              trailingComma={index < array.length - 1}
            />
          </div>
        ))}
      </div>
      <code>{trailingComma ? "}," : "}"}</code>
    </Container>
  );
}

function ArrayRenderer({
  array,
  trailingComma,
  menuHandlers,
  path,
}: {
  array: unknown[];
  trailingComma: boolean;
  menuHandlers?: MenuHandlers;
  path: Path;
}) {
  return (
    <Container>
      <code>[</code>
      <div style={{ marginLeft: "20px" }}>
        {array.map((item, index) => (
          <div key={index}>
            <JsonData
              value={item}
              path={[...path, index]}
              menuHandlers={menuHandlers}
              trailingComma={index < array.length - 1}
            />
          </div>
        ))}
      </div>
      <code>{trailingComma ? "]," : "]"}</code>
    </Container>
  );
}

function PrimitiveRenderer({
  value,
  trailingComma,
  menuHandlers,
  path,
}: {
  value: unknown;
  trailingComma: boolean;
  menuHandlers?: MenuHandlers;
  path: Path;
}) {
  const serialized = JSON.stringify(value);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const primitive = (
    <PrimitiveValue>
      <span>{serialized}</span>
      {trailingComma && <span>,</span>}
    </PrimitiveValue>
  );

  if (menuHandlers) {
    const contextMenu = (
      <>
        <MenuItem onSelect={() => menuHandlers.onCopy(serialized)}>
          <Copy />
          Copy
        </MenuItem>
        <MenuItem onSelect={() => setIsDialogOpen(true)}>
          <BracketsCurly />
          Create variable
        </MenuItem>
      </>
    );

    const jsonPointer = joinJsonPointer(path);

    return (
      <>
        <CreateVariableDialog
          open={isDialogOpen}
          onOpenChange={setIsDialogOpen}
          jsonPointer={jsonPointer}
          onCreateVariable={menuHandlers.onCreateVariable}
        />
        <ContextMenu menu={contextMenu}>{primitive}</ContextMenu>
      </>
    );
  } else {
    return primitive;
  }
}

const Container = styled.div`
  code {
    color: var(${ThemeColorVariables.foreground});
    background-color: var(${ThemeColorVariables.background});
    border: none;
    padding: none;
  }
`;

const PrimitiveValue = styled.span`
  & > span:first-child {
    &:hover {
      background-color: var(${ThemeColorVariables.computedOne});
    }
  }
`;
