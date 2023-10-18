import { PlaybookResult } from "../scenario/types";
import styled from "styled-components";
import OperationExecution from "./OperationExecution";
import Separator from "../../../../components/Separator";

export default function PlaybookExecution({ playbook }: { playbook: PlaybookResult }) {
  const operations = playbook.results;
  return (
    <Container>
      {playbook.playbook !== "" && <Separator title={playbook.playbook} />}
      {operations.map((operation, index) => (
        <OperationExecution operation={operation} key={index} />
      ))}
    </Container>
  );
}

const Container = styled.div`
  > div:first-child {
    margin-bottom: 8px;
  }
`;
