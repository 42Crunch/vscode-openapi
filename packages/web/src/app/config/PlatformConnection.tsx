import Input from "../../components/Input";
import {
  useFeatureDispatch,
  useFeatureSelector,
  testPlatformConnection,
} from "../../features/config/slice";
import { NormalProgressButton } from "../../components/ProgressButton";
import ConnectionTestBanner from "./ConnectionTestBanner";
import { Container, Test, Title } from "./layout";
import { useFormContext } from "react-hook-form";

export default function PlatformConnection() {
  const dispatch = useFeatureDispatch();
  const {
    platformConnectionTestResult: testResult,
    waitingForPlatformConnectionTest: waitingForTest,
  } = useFeatureSelector((state) => state.config);

  const {
    formState: { isValid },
  } = useFormContext();

  return (
    <>
      <Title>42Crunch Platform connection parameters</Title>
      <Container>
        <Input label="Platform URL" name="platformUrl" />
        <Input label="IDE token" name="platformApiToken" password />
        <Test>
          <NormalProgressButton
            disabled={!isValid}
            label="Test connection"
            waiting={waitingForTest}
            onClick={(e) => {
              dispatch(testPlatformConnection());
              e.preventDefault();
              e.stopPropagation();
            }}
          />
          <ConnectionTestBanner result={testResult} />
        </Test>
      </Container>
    </>
  );
}
