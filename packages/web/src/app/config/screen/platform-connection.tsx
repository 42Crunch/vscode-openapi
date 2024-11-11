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
import { RadioGroup } from "../../../new-components/fields/RadioGroup";
import { useWatch } from "react-hook-form";
import Textarea from "../../../new-components/fat-fields/Textarea";
import Subscription from "../Subscription";

function PlatformConnection() {
  const dispatch = useFeatureDispatch();

  const {
    platformConnectionTestResult: testResult,
    waitingForPlatformConnectionTest: waitingForTest,
  } = useFeatureSelector((state) => state.config);

  const platformAuthType = useWatch({ name: "platformAuthType" });
  const anondToken = useWatch({ name: "anondToken" });

  return (
    <>
      <Title>Connection to 42Crunch Platform</Title>

      <Container>
        <RadioGroup
          name="platformAuthType"
          options={[
            { value: "anond-token", label: "Freemium token" },
            { value: "api-token", label: "Platform IDE token" },
          ]}
        />

        {platformAuthType === "anond-token" && (
          <>
            <Textarea label="Freemium token" name="anondToken" />
            {anondToken !== "" && <Subscription token={anondToken} />}
          </>
        )}

        {platformAuthType === "api-token" && (
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
  platformAuthType: z.enum(["anond-token", "api-token"]),
  platformUrl: z.string().url().startsWith("https://"),
  anondToken: z.string().trim(),
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
