import { ThemeColorVariables } from "@xliic/common/theme";
import styled, { keyframes } from "styled-components";
import Separator from "../../../../components/Separator";
import { CircleCheckLight, CircleExclamationLight, Spinner } from "../../../../icons";
import HttpRequest from "../http-request/HttpRequest";
import { OperationResult } from "../scenario/types";
import { OperationAuthentication } from "./OperationAuthentication";
import OperationHttpResponse from "./OperationHttpResponse";

export default function OperationExecution({ operation }: { operation: OperationResult }) {
  return (
    <Container>
      {operation.ref && (
        <Separator
          icon={getStatusIcon(operation.status)}
          title={`${operation.ref.type}/${operation.ref.id}`}
        />
      )}

      {Object.keys(operation.auth).length > 0 && (
        <OperationAuthentication results={operation.auth} />
      )}

      {operation.httpRequest !== undefined && (
        <HttpRequest operationId={operation.operationId} request={operation.httpRequest} />
      )}

      {operation.httpResponse !== undefined && operation.httpResponse !== null && (
        <OperationHttpResponse
          response={operation.httpResponse}
          variables={operation.variablesAssigned}
        />
      )}
    </Container>
  );
}

const Container = styled.div`
  svg {
    width: 14px;
    height: 14px;
    fill: var(${ThemeColorVariables.foreground});
  }
`;

function getStatusIcon(status: string) {
  if (status === "success") {
    return <CircleCheckLight />;
  } else if (status === "failure") {
    return (
      <CircleExclamationLight style={{ fill: `var(${ThemeColorVariables.errorForeground})` }} />
    );
  } else {
    return <SpinningSpinner />;
  }
}

const rotation = keyframes`
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(359deg);
  }
`;

const SpinningSpinner = styled(Spinner)`
  animation: ${rotation} 2s infinite linear;
  transition: width 0.2s linear;
`;
