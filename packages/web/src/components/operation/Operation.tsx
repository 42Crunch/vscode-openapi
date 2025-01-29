import styled from "styled-components";

import { BundledSwaggerOrOas30Spec, HttpMethod } from "@xliic/openapi";

import OperationTabs from "./OperationTabs";

export default function Operation({
  oas,
  settings,
  path,
  method,
}: {
  oas: BundledSwaggerOrOas30Spec;
  settings?: JSX.Element;
  path: string;
  method: HttpMethod;
}) {
  return (
    <Container>
      <OperationTabs oas={oas} settings={settings} path={path} method={method} />
    </Container>
  );
}

const Container = styled.div``;
