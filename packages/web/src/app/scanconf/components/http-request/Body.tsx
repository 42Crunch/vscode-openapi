import styled from "styled-components";
import { HttpRequest } from "@xliic/common/http";

export default function Body({ body }: { body: HttpRequest["body"] }) {
  return <Container>{`${body}`}</Container>;
}

const Container = styled.div`
  padding: 4px 8px;
  white-space: pre-wrap;
  word-break: break-all;
  font-family: monospace;
`;
