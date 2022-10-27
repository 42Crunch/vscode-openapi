import styled from "styled-components";
import { SecurityField } from "./SecurityField";

export function SecurityHttpBasic({ name }: { name: string }) {
  return (
    <Container>
      <div>
        <SecurityField name={`${name}.username`} placeholder="username" />
      </div>
      <div>
        <SecurityField name={`${name}.password`} placeholder="password" />
      </div>
    </Container>
  );
}

const Container = styled.div`
  display: flex;
  & > div {
    flex: 1;
    display: flex;
    flex-direction: column;
  }
  & > div:first-child {
    margin-right: 0.25rem;
  }
`;
