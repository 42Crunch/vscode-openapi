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
import { RadioGroup } from "../../../components/RadioGroup";
import { useWatch } from "react-hook-form";
import Textarea from "../../../components/Textarea";

function PlatformConnection() {
  const dispatch = useFeatureDispatch();

  const {
    platformConnectionTestResult: testResult,
    waitingForPlatformConnectionTest: waitingForTest,
  } = useFeatureSelector((state) => state.config);

  const platformAuthType = useWatch({ name: "platformAuthType" });

  return (
    <>
      <Title>Connection to 42Crunch Platform</Title>

      <Container>
        <RadioGroup
          name="platformAuthType"
          options={[
            { value: "anond-token", label: "Freemium token" },
            { value: "ide-key", label: "Platform IDE key" },
          ]}
        />

        {platformAuthType === "anond-token" && (
          <div>
            <Textarea label="Freemium token" name="anondToken" />
          </div>
        )}

        {platformAuthType === "ide-key" && (
          <>
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
          </>
        )}
      </Container>
    </>
  );
}

const schema = z.object({
  platformAuthType: z.enum(["anond-token", "ide-key"]),
  platformUrl: z.string().url().startsWith("https://"),
  anondToken: z.string(),
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
