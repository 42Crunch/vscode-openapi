import { useWatch } from "react-hook-form";
import styled from "styled-components";
import * as z from "zod";

import { Config } from "@xliic/common/config";

import Input from "../../../components/Input";
import ValidProgressButton from "../../../components/form/ValidProgressButton";
import {
  ConfigScreen,
  showEditorSettings,
  testPlatformConnection,
  useFeatureDispatch,
  useFeatureSelector,
} from "../../../features/config/slice";
import ConnectionTestBanner from "../ConnectionTestBanner";
import { Container, Test, Title } from "../layout";

type Section = Pick<Config, "platformUrl" | "platformApiToken">;

function PlatformConnection() {
  const dispatch = useFeatureDispatch();
  const token = useWatch({ name: "platformApiToken" });

  const isBase64 =
    typeof token === "string" &&
    token.length > 100 &&
    token.match(
      /^(?:[A-Za-z0-9+\/]{4})*(?:[A-Za-z0-9+\/]{4}|[A-Za-z0-9+\/]{3}=|[A-Za-z0-9+\/]{2}={2})$/gm
    );

  console.log("me base64", isBase64);

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
        {isBase64 && (
          <Hint>
            <div>
              The token you've provided appears to be an API Security Audit token received via
              email, rather than an IDE Token.
            </div>
            <div>
              Please use this token in "Settings &gt; Extensions &gt; OpenAPI &gt; Security Audit
              Token" in{" "}
              <a
                href="#"
                onClick={(e) => {
                  dispatch(showEditorSettings("openapi.securityAuditToken"));
                  e.preventDefault();
                  e.stopPropagation();
                }}
              >
                VS Code Settings
              </a>
            </div>
          </Hint>
        )}
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

const Hint = styled.div`
  > div {
    margin-bottom: 8px;
  }
`;

const schema = z.object({
  platformUrl: z.string().url().startsWith("https://"),
  platformApiToken: z
    .string()
    .regex(
      /^(ide_|api_)?[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
      "Token is invalid, valid token must start with 'ide_' or 'api_' and contain numbers, letters and dashes"
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
