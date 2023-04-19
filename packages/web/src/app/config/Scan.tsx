import styled from "styled-components";
import { useWatch } from "react-hook-form";

import Input from "../../components/Input";
import {
  useFeatureDispatch,
  useFeatureSelector,
  testOverlordConnection,
  testScandManagerConnection,
} from "../../features/config/slice";
import { Banner, ErrorBanner } from "../../components/Banner";
import { ConnectionTestResult } from "../../../../common/src/config";
import { NormalProgressButton } from "../../components/ProgressButton";
import Select from "../../components/Select";

export default function Scan() {
  const dispatch = useFeatureDispatch();
  const {
    overlordConnectionTestResult: overlordTestResult,
    waitingForOverlordConnectionTest: waitingForOverlordTest,
    scandManagerConnectionTestResult: scandManagerTestResult,
    waitingForScandManagerConnectionTest: waitingForScandManagerTest,
  } = useFeatureSelector((state) => state.config);

  const source = useWatch({ name: "platformServices.source" });
  const scanRuntime = useWatch({ name: "scanRuntime" });
  const scanAuth = useWatch({ name: "scandManager.auth" });

  return (
    <>
      <Title>Scan connection parameters</Title>
      <Container>
        <div>
          <Input label="Scand Agent Image" name="scanImage" />

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
              waiting={waitingForOverlordTest}
              onClick={(e) => {
                dispatch(testOverlordConnection());
                e.preventDefault();
                e.stopPropagation();
              }}
            />
          </div>
        </div>
        <div>{makeBanner(overlordTestResult)}</div>
      </Container>
      <Container>
        <div>
          <Select
            name="scanRuntime"
            options={[
              { value: "docker", label: "docker" },
              { value: "scand-manager", label: "scand-manager" },
            ]}
          />
          {scanRuntime === "scand-manager" && (
            <>
              <Input label="Scand Manager URL" name="scandManager.url" />
              <Select
                name="scandManager.auth"
                options={[
                  { value: "none", label: "no authentication" },
                  { value: "header", label: "header authentication" },
                ]}
              />
              {scanAuth === "header" && (
                <>
                  <Input label="Header Name" name="scandManager.header.name" />
                  <Input label="Header Value" name="scandManager.header.value" />
                </>
              )}
              <div>
                <NormalProgressButton
                  label="Test connection"
                  waiting={waitingForScandManagerTest}
                  onClick={(e) => {
                    dispatch(testScandManagerConnection());
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                />
              </div>
            </>
          )}
        </div>
        <div>{makeBanner(scandManagerTestResult)}</div>
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
  @media (max-width: 800px) {
    flex-direction: column;
  }
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
