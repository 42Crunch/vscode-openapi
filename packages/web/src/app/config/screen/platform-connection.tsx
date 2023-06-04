import * as z from "zod";
import { Config } from "@xliic/common/config";

import {
  ConfigScreen,
  useFeatureDispatch,
  useFeatureSelector,
  testPlatformConnection,
} from "../../../features/config/slice";
import Input from "../../../components/Input";
import ConnectionTestBanner from "../ConnectionTestBanner";
import { Container, Test, Title } from "../layout";
import ValidProgressButton from "../../../components/form/ValidProgressButton";

type Section = Pick<Config, "platformUrl" | "platformApiToken">;

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
        <Input<Section> label="Platform URL" name="platformUrl" />
        <Input<Section> label="IDE token" name="platformApiToken" password />
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

const screen: {
  id: ConfigScreen;
  label: string;
  schema: z.ZodObject<any>;
  form: React.FC;
} = {
  id: "platform-connection",
  label: "Connection",
  schema,
  form: PlatformConnection,
};

export default screen;
