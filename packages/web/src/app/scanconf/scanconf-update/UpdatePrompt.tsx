import styled from "styled-components";
import { ThemeColorVariables } from "@xliic/common/theme";

import { useAppDispatch, useAppSelector } from "../store";
import { skipScanconfUpdate, updateScanconf } from "./slice";
import Button from "../../../new-components/Button";
import PathMethodCard from "../../../new-components/PathMethodCard";
import ButtonSecondary from "../../../new-components/ButtonSecondary";

export default function UpdatePrompt() {
  const dispatch = useAppDispatch();
  const changes = useAppSelector((state) => state.scanconfUpdate.changes);

  return (
    <Container>
      <div>Your OpenAPI file has several changes that differ from your scan configuration.</div>
      <div>
        Please update your scan configuration to reflect the changes in your OpenAPI file. If you
        decide to ignore the changes, the scan will be performed with the current configuration.
      </div>

      <Changes>
        <div>Operations added to the OpenAPI file:</div>
        {changes.map((change, index) => {
          if (change.type === "operation-added") {
            return (
              <Change key={index}>
                <PathMethodCard
                  path={change.path}
                  method={change.method}
                  operationId={change.operationId}
                />
              </Change>
            );
          }
          return null;
        })}
      </Changes>

      <Buttons>
        <Button onClick={() => dispatch(updateScanconf())}>Update</Button>
        <ButtonSecondary onClick={() => dispatch(skipScanconfUpdate())}>Skip</ButtonSecondary>
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

const Change = styled.div`
  border: 1px solid var(${ThemeColorVariables.border});
  padding: 8px;
  background-color: var(${ThemeColorVariables.computedOne});
`;
