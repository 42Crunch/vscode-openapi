import styled from "styled-components";

import { ExecutionResult } from "../scenario/types";
import PlaybookExecution from "./PlaybookExecution";

export default function Execution({ result }: { result: ExecutionResult }) {
  return (
    <Container>
      {result.map((playbook, index) => (
        <PlaybookExecution playbook={playbook} key={index} />
      ))}
    </Container>
  );
}

const Container = styled.div``;
