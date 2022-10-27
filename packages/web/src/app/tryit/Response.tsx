import styled from "styled-components";

import { useAppSelector } from "./store";

import ResponseTabs from "../../components/response/Response";
import Tools from "./Tools";

export default function Response() {
  const response = useAppSelector((state) => state.tryit.response!);

  return (
    <Container>
      <ResponseTabs title="Response" response={response} tools={<Tools response={response} />} />
    </Container>
  );
}

const Container = styled.div`
  margin: 8px;
  padding: 4px;
`;
