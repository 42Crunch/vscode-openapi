import styled, { keyframes } from "styled-components";

import { ThemeColorVariables } from "@xliic/common/theme";

import Separator from "../../../../components/Separator";
import { CircleCheckLight, CircleExclamation, Spinner } from "../../../../icons";
import { ErrorBanner } from "../Banner";
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

      {operation.httpRequestPrepareError !== undefined && (
        <ErrorBanner message="Failed to prepare HTTP request for sending">
          {operation.httpRequestPrepareError}
        </ErrorBanner>
      )}

      {operation.httpRequest !== undefined && (
        <HttpRequest
          operationId={operation.operationId}
          request={operation.httpRequest}
          statusCode={operation?.httpResponse?.statusCode}
          requestRef={operation.ref}
        />
      )}

      {operation.httpError !== undefined && (
        <ErrorBanner message="HTTP Error">
          {operation.httpError.code} {operation.httpError.message}
        </ErrorBanner>
      )}

      {operation.httpResponse !== undefined && operation.httpResponse !== null && (
        <OperationHttpResponse
          response={operation.httpResponse}
          variables={operation.variablesAssigned}
          requestRef={operation.ref}
        />
      )}

      {operation.responseProcessingError !== undefined && (
        <ErrorBanner message={operation.responseProcessingError} />
      )}
    </Container>
  );
}

const Container = styled.div`
  display: flex;
  flex-flow: column;
  gap: 8px;
`;

function getStatusIcon(status: string) {
  if (status === "success") {
    return <CircleCheckLight />;
  } else if (status === "failure") {
    return <CircleExclamation style={{ fill: `var(${ThemeColorVariables.errorForeground})` }} />;
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
