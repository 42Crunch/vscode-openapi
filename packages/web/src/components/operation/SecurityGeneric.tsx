import styled from "styled-components";

import { SecurityField } from "./SecurityField";

export function SecurityGeneric({ name, placeholder }: { name: string; placeholder: string }) {
  return (
    <Container>
      <SecurityField name={name} placeholder={placeholder} />
    </Container>
  );
}

const Container = styled.div`
  display: flex;
  flex-direction: column;
`;
