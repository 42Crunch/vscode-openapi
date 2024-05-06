import styled from "styled-components";

import { useAppDispatch, useAppSelector } from "../store";
import { skipScanconfUpdate, updateScanconf } from "./slice";
import ButtonSecondary from "../../../new-components/ButtonSecondary";
import { ProgressButton } from "../../../new-components/ProgressButton";
import OperationAdded from "./OperationAdded";
import OperationRemoved from "./OperationRemoved";
import OperationRenamed from "./OperationRenamed";
import SecuritySchemeAdded from "./SecuritySchemeAdded";

export default function UpdatePrompt() {
  const dispatch = useAppDispatch();
  const { changes, updating } = useAppSelector((state) => state.scanconfUpdate);

  const added = changes.filter((change) => change.type === "operation-added");
  const removed = changes.filter((change) => change.type === "operation-removed");
  const renamed = changes.filter((change) => change.type === "operation-renamed");
  const securityAdded = changes.filter((change) => change.type === "security-added");

  return (
    <Container>
      <div>Your OpenAPI file has deviated from your scan configuration.</div>
      <div>
        Please update your scan configuration to reflect the changes in your OpenAPI file. If you
        decide to ignore the changes, the scan will be performed using the old configuration.
      </div>

      <Changes>
        {added.length > 0 && (
          <>
            <div>Added:</div>
            {added.map((change, index) => (
              <OperationAdded key={index} change={change} />
            ))}
          </>
        )}
        {removed.length > 0 && (
          <>
            <div>Removed:</div>
            {removed.map((change, index) => (
              <OperationRemoved key={index} change={change} />
            ))}
          </>
        )}
        {renamed.length > 0 && (
          <>
            <div>OperationId changed:</div>
            {renamed.map((change, index) => (
              <OperationRenamed key={index} change={change} />
            ))}
          </>
        )}
        {securityAdded.length > 0 && (
          <>
            <div>Security scheme added:</div>
            {securityAdded.map((change, index) => (
              <SecuritySchemeAdded key={index} change={change} />
            ))}
          </>
        )}
      </Changes>

      <Buttons>
        <ProgressButton
          label="Update"
          waiting={updating}
          onClick={() => dispatch(updateScanconf())}
        />
        <ButtonSecondary disabled={updating} onClick={() => dispatch(skipScanconfUpdate())}>
          Skip
        </ButtonSecondary>
      </Buttons>
    </Container>
  );
}

const Container = styled.div`
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const Buttons = styled.div`
  display: flex;
  gap: 8px;
`;

const Changes = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 16px;
  margin-bottom: 16px;
`;
