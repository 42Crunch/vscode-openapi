import styled from "styled-components";
import * as Tabs from "@radix-ui/react-tabs";

import { useState } from "react";

import { TabList, RoundTabButton } from "../../components/Tabs";

import { BundledSwaggerOrOasSpec } from "@xliic/common/openapi";

import { useFieldArray } from "react-hook-form";
import VariableAssignments from "./VariableAssignments";
import AddResponse from "./AddResponse";

export default function ResponseProcessing({ oas }: { oas: BundledSwaggerOrOasSpec }) {
  const { fields, prepend } = useFieldArray({
    name: "responses",
  });

  const [activeTab, setActiveTab] = useState(fields?.[0]?.id);

  return (
    <Tabs.Root value={activeTab} onValueChange={setActiveTab}>
      <TabList>
        {fields.map((field: any) => (
          <RoundTabButton key={field.id} value={field.id}>
            {field.key}
          </RoundTabButton>
        ))}
        <Spacer />

        <AddResponse add={prepend} />
      </TabList>
      {fields.map((field: any, index: number) => (
        <Tabs.Content key={field.id} value={field.id}>
          <VariableAssignments name={field.key} index={index} />
        </Tabs.Content>
      ))}
    </Tabs.Root>
  );
}

const Spacer = styled.div`
  flex: 1;
`;
