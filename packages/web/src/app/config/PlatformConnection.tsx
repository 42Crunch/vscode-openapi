import styled from "styled-components";
import { ThemeColorVariables } from "@xliic/common/theme";
import Input from "../../components/Input";
import Button from "../../components/Button";
import {
  useFeatureDispatch,
  testPlatformConnection,
  useFeatureSelector,
} from "../../features/config/slice";
import { Banner, ErrorBanner } from "../../components/Banner";
import { PlatformConnectionTestResult } from "../../../../common/src/config";
import { NormalProgressButton } from "../../components/ProgressButton";

export default function PlatformConnection() {
  const dispatch = useFeatureDispatch();
  const {
    platformConnectionTestResult: testResult,
    waitingForPlatformConnectionTest: waitingForTest,
  } = useFeatureSelector((state) => state.config);

  return (
    <>
      <Title>Connection parameters</Title>
      <Container>
        <div>
          <Input label="Platform URL" name="platformUrl" />
          <Input label="IDE token" name="platformApiToken" />
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
