import { HttpResponse } from "@xliic/common/http";
import styled from "styled-components";
import { MockHttpResponse } from "../../../../core/playbook/mock-http";
import { PlaybookEnvStack } from "../../../../core/playbook/playbook-env";
import { TabContainer } from "../../../../new-components/Tabs";
import CollapsibleCard, {
  BottomDescription,
  BottomItem,
} from "../../../../new-components/CollapsibleCard";
import HttpRequest from "../http-request/HttpRequest";
import Body from "../response/Body";
import Headers from "../response/Headers";
import VariableAssignments from "./VariableAssignments";
import { OperationResult } from "./types";
import { ErrorBanner } from "../Banner";

export default function ResponseCard({
  response,
  defaultCollapsed,
}: {
  response: OperationResult;
  defaultCollapsed?: boolean;
}) {
  const statusCode =
    response.httpResponse === MockHttpResponse ? 200 : response.httpResponse?.statusCode;

  const statusMessage =
    response.httpResponse === MockHttpResponse ? "MOCK" : response.httpResponse?.statusMessage;

  if (response.httpRequestPrepareError !== undefined) {
    return (
      <ErrorBanner message="Failed to prepare HTTP request for sending">
        {response.httpRequestPrepareError}
      </ErrorBanner>
    );
  }

  if (response.httpError !== undefined) {
    return (
      <ErrorBanner message="Failed to send HTTP request">{response.httpError.message}</ErrorBanner>
    );
  }

  return (
    <Container>
      {response.httpRequest !== undefined && (
        <HttpRequest operationId={response.operationId} request={response.httpRequest} />
      )}
      {response.responseProcessingError !== undefined && (
        <ErrorBanner message="Failed to assign variables">
          {response.responseProcessingError}
        </ErrorBanner>
      )}
      <CollapsibleCard defaultCollapsed={defaultCollapsed}>
        <BottomDescription>
          <BottomItem>Status: {`${statusCode} ${statusMessage}`}</BottomItem>
        </BottomDescription>
        <ResponseTabs result={response} />
      </CollapsibleCard>
    </Container>
  );
}

export function ResponseTabs({ result }: { result: OperationResult }) {
  return (
    <TabContainer
      tabs={[
        {
          id: "body",
          title: "Body",
          content: <Body response={result.httpResponse as HttpResponse} />,
          disabled: result.httpResponse === MockHttpResponse || result.httpResponse === undefined,
        },
        {
          id: "headers",
          title: "Headers",
          content: <Headers headers={(result.httpResponse as HttpResponse)?.headers} />,
          disabled: result.httpResponse === MockHttpResponse || result.httpResponse === undefined,
        },
        {
          id: "variables-assigned",
          title: "Variables",
          content: <VariableAssignments assignment={result.variablesAssigned!} />,
          counter: assignmentCount(result?.variablesAssigned),
          disabled:
            result.variablesAssigned === undefined ||
            assignmentCount(result?.variablesAssigned) === 0,
        },
        // {
        //   id: "variables-used",
        //   title: "Variables",
        //   content: (
        //     <VariableUsed
        //       found={result.variablesReplaced?.found}
        //       missing={result.variablesReplaced?.missing}
        //     />
        //   ),
        //   disabled:
        //     result.variablesReplaced === undefined ||
        //     (result.variablesReplaced.found.length === 0 && result.variablesReplaced.missing.length === 0),
        // },
      ]}
    />
  );
}

function assignmentCount(env?: PlaybookEnvStack): number {
  if (env === undefined) {
    return 0;
  }

  let count = 0;
  for (const e of env) {
    count = count + e.assignments.length;
  }

  return count;
}

const Container = styled.div``;
