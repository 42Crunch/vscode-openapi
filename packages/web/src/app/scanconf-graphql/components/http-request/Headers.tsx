import styled from "styled-components";
import { HttpRequest } from "@xliic/common/http";
import { ThemeColorVariables } from "@xliic/common/theme";

export default function Headers({ headers }: { headers: HttpRequest["headers"] }) {
  return (
    <Container>
      <Header>
        <div>Name</div>
        <div>Value</div>
      </Header>
      {Object.entries(headers).map(([name, value], index) => (
        <Row key={index}>
          <div>{name}</div>
          <div>{value}</div>
        </Row>
      ))}
    </Container>
  );
}

const Container = styled.div`
  display: grid;
  grid-template-columns: 2fr 5fr;
`;

const Header = styled.div`
  display: contents;
  & > div {
    padding: 4px 8px;
    background-color: var(${ThemeColorVariables.computedOne});
    text-transform: uppercase;
    font-size: 90%;
    font-weight: 600;
  }
`;

const Row = styled.div`
  display: contents;
  > div {
    padding: 4px 8px;
    white-space: pre-wrap;
    word-break: break-all;
    font-family: monospace;
  }
`;
