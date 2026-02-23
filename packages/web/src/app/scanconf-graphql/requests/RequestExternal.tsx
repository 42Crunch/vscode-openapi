import { useEffect, useState } from "react";
import styled from "styled-components";

import { Environment as UnknownEnvironment } from "@xliic/common/env";
import { ThemeColorVariables } from "@xliic/common/theme";
import { Playbook } from "@xliic/scanconf";

import { DynamicVariableNames } from "../../../core/playbook/builtin-variables";
import { makeEnvEnv } from "../../../core/playbook/execute";
import DescriptionTooltip from "../../../new-components/DescriptionTooltip";
import Form from "../../../new-components/Form";
import CollapsibleSection from "../../scanconf/components/CollapsibleSection";
import Environment from "../../scanconf/components/environment/Environment";
import Execution from "../../scanconf/components/execution/Execution";
import {
  getVariableNamesFromEnvStack,
  unwrapEnvironment,
  wrapEnvironment,
} from "../../scanconf/requests/RequestExternal";
import RequestCardExternal from "../components/scenario/RequestCardExternal";
import TryAndServerSelector from "../components/TryAndServerSelector";
import { saveRequest } from "../slice";
import { useAppDispatch, useAppSelector } from "../store";
import { executeRequest } from "./slice";

export default function RequestExternal({
  request,
  requestRef,
}: {
  request: Playbook.ExternalStageContent;
  requestRef: Playbook.RequestRef;
}) {
  const useGlobalBlocks = useAppSelector((state) => state.prefs.useGlobalBlocks);

  const {
    tryResult,
    mockResult,
    mockMissingVariables: missingVariables,
  } = useAppSelector((state) => state.requests);

  const dispatch = useAppDispatch();
  const { playbook, servers } = useAppSelector((state) => state.scanconf);
  const env = useAppSelector((state) => state.env.data);

  const onRun = (server: string, inputs: UnknownEnvironment) =>
    dispatch(executeRequest({ server, inputs }));

  const onSaveRequest = (stage: Playbook.ExternalStageContent) =>
    dispatch(saveRequest({ ref: requestRef, stage }));

  const variables = [...DynamicVariableNames, ...getVariableNamesFromEnvStack([])];

  const [inputs, setInputs] = useState<UnknownEnvironment>({});

  const {
    environment: {
      env: { host },
    },
  } = makeEnvEnv(Playbook.getCurrentEnvironment(playbook), env);

  useEffect(() => {
    const updated = { ...inputs };
    // remove stale variables
    for (const name of Object.keys(updated)) {
      if (!missingVariables.includes(name)) {
        delete updated[name];
      }
    }
    // create new variables
    for (const name of missingVariables) {
      if (updated[name] === undefined) {
        updated[name] = "";
      }
    }
    setInputs(updated);
  }, [missingVariables]);

  return (
    <Container>
      <TryAndServerSelector
        servers={servers}
        host={host as string | undefined}
        onTry={(server: string) => onRun(server, inputs)}
        menu
      />

      <CollapsibleSection title="Request">
        <RequestCardExternal
          defaultCollapsed={false}
          variables={variables}
          requestRef={requestRef}
          stage={request!}
          saveRequest={onSaveRequest}
        />
        <Title>
          Unset variables
          <DescriptionTooltip>
            Enter values for these unset variables to 'Try' the Operation. Note that these values
            will not be persisted in the Scan configuration.
          </DescriptionTooltip>
        </Title>
        <Inputs>
          <Form
            wrapFormData={wrapEnvironment}
            unwrapFormData={unwrapEnvironment}
            data={inputs}
            saveData={(data) => setInputs(data)}
          >
            <Environment name="env" />
          </Form>
        </Inputs>
      </CollapsibleSection>

      {tryResult.length > 0 && (
        <CollapsibleSection title="Result">
          <Execution result={tryResult} collapsible={useGlobalBlocks} />
        </CollapsibleSection>
      )}
    </Container>
  );
}

const Container = styled.div`
  padding: 8px;
`;

const Inputs = styled.div`
  border: 1px solid var(${ThemeColorVariables.border});
  background-color: var(${ThemeColorVariables.background});
`;

const Title = styled.div`
  display: flex;
  padding-top: 12px;
  padding-bottom: 12px;
  font-weight: 600;
  gap: 8px;
  cursor: pointer;
  align-items: center;
`;
