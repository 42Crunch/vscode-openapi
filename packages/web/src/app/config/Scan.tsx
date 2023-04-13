import styled from "styled-components";
import { useWatch } from "react-hook-form";

import Input from "../../components/Input";
import {
  useFeatureDispatch,
  useFeatureSelector,
  testOverlordConnection,
} from "../../features/config/slice";
import { Banner, ErrorBanner } from "../../components/Banner";
import { ConnectionTestResult } from "../../../../common/src/config";
import { NormalProgressButton } from "../../components/ProgressButton";
import Select from "../../components/Select";

export default function Scan() {
  const dispatch = useFeatureDispatch();
  const {
    overlordConnectionTestResult: testResult,
    waitingForOverlordConnectionTest: waitingForTest,
  } = useFeatureSelector((state) => state.config);

  const source = useWatch({ name: "platformServices.source" });

  return (
    <>
      <Title>Scan connection parameters</Title>
      <Container>
        <div>
          <Select
            name="platformServices.source"
            options={[
              { value: "auto", label: "Automatically detect services host" },
              { value: "manual", label: "Specify services host manually" },
            ]}
          />
          {source == "manual" && <Input label="Services host" name="platformServices.manual" />}
          {source == "auto" && (
            <Input
              label="Services host (automatic, read-only)"
              name="platformServices.auto"
              disabled
            />
          )}
          <div>
            <NormalProgressButton
              label="Test connection"
              waiting={waitingForTest}
              onClick={(e) => {
                dispatch(testOverlordConnection());
                e.preventDefault();
                e.stopPropagation();
              }}
            />
          </div>
        </div>
        <div>{makeBanner(testResult)}</div>
      </Container>
    </>
  );
}

function makeBanner(result: ConnectionTestResult | undefined) {
  if (result !== undefined) {
    if (result.success) {
      return <Banner message="Successfully connected" />;
    } else {
      return <ErrorBanner message="Failed to connect">{result.message}</ErrorBanner>;
    }
  }
}

const Container = styled.div`
  display: flex;
  gap: 8px;
  > div {
    flex: 1;
    display: flex;
    flex-flow: column;
    gap: 8px;
  }
`;

const Title = styled.div`
  font-weight: 700;
  margin-bottom: 16px;
`;
