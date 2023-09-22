import styled from "styled-components";

import Separator from "../../../../components/Separator";
import { PlaybookResult } from "../scenario/types";
import OperationExecution from "./OperationExecution";
import { ErrorBanner } from "../Banner";

export default function PlaybookExecution({ playbook }: { playbook: PlaybookResult }) {
  const operations = playbook.results;

  return (
    <Container>
      {playbook.name !== "" && <Separator title={playbook.name} />}
      {operations.map((operation, index) => (
        <OperationExecution operation={operation} key={index} />
      ))}
      {playbook.error && (
        <ErrorBanner message="Error executing scenario">{playbook.error}</ErrorBanner>
      )}
    </Container>
  );
}

const Container = styled.div`
  display: flex;
  flex-flow: column;
  gap: 8px;
`;
