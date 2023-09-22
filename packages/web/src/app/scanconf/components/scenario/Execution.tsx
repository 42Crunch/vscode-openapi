import styled from "styled-components";
import { ThemeColorVariables } from "@xliic/common/theme";
import { BundledSwaggerOrOasSpec } from "@xliic/common/openapi";
import CollapsibleSection from "../CollapsibleSection";
import { CircleCheckLight } from "../../../../icons";

import {
  PlaybookExecutorStep,
  PlaybookStarted,
  PlaybookPayloadVariablesReplaced,
  PlaybookHttpRequestPrepared,
  PlaybookHttpResponseReceived,
  PlaybookVariablesAssigned,
  PlaybookFinished,
} from "../../../../core/playbook/playbook";

export default function Execution({ execution }: { execution: PlaybookExecutorStep[] }) {
  return (
    <Container>
      {execution.map((event, index, array) => (
        <div key={index}>
          <Peg first={index === 0} last={index === array.length - 1} />
          <Card>{renderEvent(event)}</Card>
        </div>
      ))}
    </Container>
  );
}

const eventComponents: Record<string, React.FunctionComponent<any>> = {
  "playbook-started": PlaybookStartedEvent,
  "payload-variables-substituted": PayloadVariablesSubstitutedEvent,
  "http-request-prepared": HttpRequestPreparedEvent,
  "http-response-received": HttpResponseReceivedEvent,
  "variables-assigned": VariablesAssignedEvent,
  "playbook-finished": PlaybookFinishedEvent,
};

const renderEvent = (event: PlaybookExecutorStep) => {
  const EventComponent = eventComponents[event.event];
  if (EventComponent) {
    return <EventComponent {...event} />;
  } else {
    return <p>{`Unknown event: ${event.event}`}</p>;
  }
};

function PlaybookStartedEvent(event: PlaybookStarted) {
  return <p>{`Playbook started`}</p>;
}

function PayloadVariablesSubstitutedEvent({ found, missing }: PlaybookPayloadVariablesReplaced) {
  return (
    <div>
      <p>Payload Variables Substituted:</p>
      <ul>
        {found.map((variable, index) => (
          <li key={index}>{`Found: ${variable.name}: ${JSON.stringify(variable.value)}`}</li>
        ))}
        {missing.map((variable, index) => (
          <li key={index}>{`Missing: ${variable}`}</li>
        ))}
      </ul>
    </div>
  );
}

function HttpRequestPreparedEvent({ request }: PlaybookHttpRequestPrepared) {
  return <p>{`HTTP Request Prepared - Method: ${request.method}, URL: ${request.url}`}</p>;
}

function HttpResponseReceivedEvent({ response }: PlaybookHttpResponseReceived) {
  return (
    <div>Nope FIXME</div>

    // <div>
    //   <p>HTTP Response Received:</p>
    //   <p>Status Code: {response.statusCode}</p>
    //   <p>Body: {response.body}</p>
    // </div>
  );
}

function VariablesAssignedEvent({ assignments }: PlaybookVariablesAssigned) {
  return (
    <div>
      <p>Variables Assigned:</p>
      <div>Nope FIXME</div>
      {/* <ul>
        {assignments.map((assignment, index) => (
          <li key={index}>{`${assignment.name}: ${JSON.stringify(assignment.value)}`}</li>
        ))}
      </ul> */}
    </div>
  );
}

function PlaybookFinishedEvent(step: PlaybookFinished) {
  return <p>{`Playbook finished - Name`}</p>;
}

const Container = styled.div`
  color: var(${ThemeColorVariables.foreground});
  background-color: var(${ThemeColorVariables.background});
  line-break: anywhere;
  padding: 8px;

  > div {
    display: flex;
    align-items: center;
    font-family: monospace;
    > div:last-child {
      padding: 4px 0px 4px 4px;
      flex: 1;
      background-color: var(${ThemeColorVariables.computedOne});
    }
  }
`;

function Peg({ first, last }: { first: boolean; last: boolean }) {
  return (
    <PegContainer first={first} last={last}>
      <div />
      <CircleCheckLight />
      <div />
    </PegContainer>
  );
}

const Card = styled.div`
  padding: 8px;
  border: 1px solid var(${ThemeColorVariables.border});
  margin: 4px;
`;

const PegContainer = styled.div`
  display: flex;
  flex-flow: column;
  align-items: center;
  align-self: stretch;
  > div:first-child {
    flex: 1;
    width: 1px;
    height: 8px;
    ${({ first }: { first: boolean; last: boolean }) =>
      !first && `background-color: var(${ThemeColorVariables.border});`}
  }
  > svg {
    fill: var(${ThemeColorVariables.foreground});
  }
  > div:last-child {
    flex: 1;
    width: 1px;
    ${({ last }: { first: boolean; last: boolean }) =>
      !last && `background-color: var(${ThemeColorVariables.border});`}
  }
`;
