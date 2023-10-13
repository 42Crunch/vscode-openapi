import styled from "styled-components";

import { ThemeColorVariables } from "@xliic/common/theme";
import { Plus } from "../../../../icons";
import { useState } from "react";
import NewStageCombo from "./NewStageCombo";
import { RequestRef } from "@xliic/common/playbook";

export default function AddRequest({
  operationIds,
  requestIds,
  onSelect,
}: {
  operationIds: string[];
  requestIds: string[];
  onSelect: (ref: RequestRef) => void;
}) {
  const [showCombo, setShowCombo] = useState(false);

  return showCombo ? (
    <NewStageCombo
      onSelect={(selected) => {
        if (selected !== undefined) {
          onSelect(selected);
        }
        setShowCombo(false);
      }}
      requestIds={requestIds}
      operationIds={operationIds}
    />
  ) : (
    <Container
      onClick={(e) => {
        e.stopPropagation();
        e.preventDefault();
        setShowCombo(true);
      }}
    >
      <Plus /> Add request
    </Container>
  );
}

const Container = styled.div`
  display: flex;
  padding: 8px 12px;
  gap: 4px;
  cursor: pointer;
  align-items: center;
  cusror: pointer;
  border: 1px dashed var(${ThemeColorVariables.border});
  color: var(${ThemeColorVariables.linkForeground});
  > svg {
    fill: var(${ThemeColorVariables.linkForeground});
  }
`;
