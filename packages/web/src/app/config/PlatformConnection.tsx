import styled from "styled-components";
import { useFormContext } from "react-hook-form";
import { Config as ConfigData } from "@xliic/common/config";

import Input from "../../components/Input";
import {
  useFeatureDispatch,
  useFeatureSelector,
  testPlatformConnection,
} from "../../features/config/slice";
import { Banner, ErrorBanner } from "../../components/Banner";
import { PlatformConnectionTestResult } from "../../../../common/src/config";
import { NormalProgressButton } from "../../components/ProgressButton";
import Select from "../../components/Select";

export default function PlatformConnection() {
  const dispatch = useFeatureDispatch();
  const {
    platformConnectionTestResult: testResult,
    waitingForPlatformConnectionTest: waitingForTest,
  } = useFeatureSelector((state) => state.config);

  const { watch } = useFormContext();

  const source = watch("platformServices.source");

  return (
    <>
      <Title>42Crunch Platform connection parameters</Title>
      <Container>
        <div>
          <Input label="Platform URL" name="platformUrl" />
          <Input label="IDE token" name="platformApiToken" password />
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
                dispatch(testPlatformConnection());
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

function makeBanner(result: PlatformConnectionTestResult | undefined) {
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
