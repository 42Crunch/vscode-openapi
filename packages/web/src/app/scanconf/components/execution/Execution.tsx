import styled from "styled-components";

import { ExecutionResult } from "../scenario/types";
import PlaybookExecution from "./PlaybookExecution";

export default function Execution({
  result,
  collapsible,
}: {
  result: ExecutionResult;
  collapsible?: boolean;
}) {
  return (
    <Container>
      {result.map((playbook, index) => (
        <PlaybookExecution playbook={playbook} key={index} collapsible={collapsible} />
      ))}
    </Container>
  );
}

const Container = styled.div``;
