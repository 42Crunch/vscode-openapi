import styled from "styled-components";
import { ThemeColorVariables } from "@xliic/common/theme";

import { useAppDispatch, useAppSelector } from "../store";
import { skipScanconfUpdate, updateScanconf } from "./slice";
import PathMethodCard from "../../../new-components/PathMethodCard";
import ButtonSecondary from "../../../new-components/ButtonSecondary";
import { ProgressButton } from "../../../new-components/ProgressButton";

export default function UpdatePrompt() {
  const dispatch = useAppDispatch();
  const { changes, updating } = useAppSelector((state) => state.scanconfUpdate);

  return (
    <Container>
      <div>Your OpenAPI file has changes that deviate from your scan configuration.</div>
      <div>
        Please update your scan configuration to reflect the changes in your OpenAPI file. If you
        decide to ignore the changes, the scan will be performed with the outdated configuration.
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

const Change = styled.div`
  border: 1px solid var(${ThemeColorVariables.border});
  padding: 8px;
  background-color: var(${ThemeColorVariables.computedOne});
`;
