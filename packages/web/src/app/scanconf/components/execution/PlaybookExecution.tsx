import styled from "styled-components";

import { PlaybookResult } from "../scenario/types";
import OperationExecution from "./OperationExecution";
import CollapsibleSection from "../CollapsibleSection";
import { useEffect, useState } from "react";

export default function PlaybookExecution({
  playbook,
  collapsible,
}: {
  playbook: PlaybookResult;
  collapsible?: boolean;
}) {
  const [isOpen, setOpen] = useState(false);

  useEffect(() => {
    setOpen(
      playbook.status === "failure" ||
        playbook.status === "pending" ||
        playbook.name === "Scenario" ||
        playbook.name === "Request"
    );
  }, [playbook.status]);

  const execution = playbook.results.map((operation, index) => (
    <OperationExecution operation={operation} key={index} />
  ));

  if (collapsible) {
    return (
      <CollapsibleSection
        isOpen={isOpen}
        setOpen={setOpen}
        title={<SectionTitle>{playbook.name || ""}</SectionTitle>}
      >
        <Container>{execution}</Container>
      </CollapsibleSection>
    );
  }

  return <Container>{execution}</Container>;
}

const Container = styled.div`
  display: flex;
  flex-flow: column;
  gap: 8px;
`;

const SectionTitle = styled.div`
  opacity: 0.8;
`;
