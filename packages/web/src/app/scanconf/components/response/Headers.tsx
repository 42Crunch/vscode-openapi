import styled from "styled-components";
import { HttpResponse } from "@xliic/common/http";

export default function Headers({ headers }: { headers: HttpResponse["headers"] }) {
  return (
    <Container>
      {headers.map(([name, value], index) => (
        <div key={index}>
          <span>{name}:</span> <span>{value}</span>
        </div>
      ))}
    </Container>
  );
}

const Container = styled.div`
  white-space: pre-wrap;
  word-break: break-all;
  font-family: monospace;
`;
