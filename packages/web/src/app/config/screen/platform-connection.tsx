import * as z from "zod";
import Input from "../../../components/Input";
import ValidProgressButton from "../../../components/form/ValidProgressButton";
import {
  ConfigScreen,
  testPlatformConnection,
  useFeatureDispatch,
  useFeatureSelector,
} from "../../../features/config/slice";
import ConnectionTestBanner from "../ConnectionTestBanner";
import { Container, Test, Title } from "../layout";

function PlatformConnection() {
  const dispatch = useFeatureDispatch();

  const {
    platformConnectionTestResult: testResult,
    waitingForPlatformConnectionTest: waitingForTest,
  } = useFeatureSelector((state) => state.config);

  return (
    <>
      <Title>Connection to 42Crunch Platform</Title>
      <Container>
        <Input label="Platform URL" name="platformUrl" />
        <Input label="IDE token" name="platformApiToken" password />
        <Test>
          <ValidProgressButton
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

const schema = z.object({
  platformUrl: z.string().url().startsWith("https://"),
  platformApiToken: z
    .string()
    .regex(
      /^(ide_|api_)?[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
      "Token is invalid"
    )
    .or(z.literal("")),
});

const screen: ConfigScreen = {
  id: "platform-connection",
  label: "Connection",
  schema,
  form: PlatformConnection,
};

export default screen;
