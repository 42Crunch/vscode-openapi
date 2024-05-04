import { useEffect, useState } from "react";
import { useFieldArray } from "react-hook-form";
import styled from "styled-components";

import { TabContainer } from "../../../../new-components/Tabs";
import AddResponseDialog from "./AddResponseDialog";
import VariableAssignments from "./VariableAssignments";
import { Menu, MenuItem } from "../../../../new-components/Menu";
import { TrashCan } from "../../../../icons";

export default function ResponseProcessing({
  responseCodes,
  editable,
}: {
  responseCodes?: string[];
  editable?: boolean;
}) {
  const { fields, prepend, remove } = useFieldArray({
    name: "responses",
  });

  const [activeTab, setActiveTab] = useState<string | undefined>(fields?.[0]?.id);

  useEffect(() => {
    setActiveTab(fields?.[0]?.id);
  }, [fields]);

  const existingCodes = fields.map((field: any) => field.key);

  const tabs = fields.map((field: any, index) => ({
    id: field.id,
    title: field.key,
    menu: editable ? (
      <Menu>
        <MenuItem onClick={(e) => e.stopPropagation()} onSelect={() => remove(index)}>
          <TrashCan />
          Delete
        </MenuItem>
      </Menu>
    ) : undefined,
    content: <VariableAssignments name={field.key} index={index} />,
  }));

  return (
    <Container>
      <TabContainer
        round
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        tabs={tabs}
        menu={
          editable ? (
            <AddResponseDialog
              add={prepend}
              responseCodes={responseCodes!}
              existingCodes={existingCodes}
            />
          ) : undefined
        }
      />
    </Container>
  );
}

const Container = styled.div`
  margin-top: 4px;
`;
