import styled from "styled-components";

import { useAppSelector } from "../../store/hooks";

import ResponseTabs from "../../components/response/ResponseTabs";

export default function Response() {
  const response = useAppSelector((state) => state.scan.response!);

  return (
    <Container>
      <ResponseTabs response={response} />
    </Container>
  );
}

const Container = styled.div``;
