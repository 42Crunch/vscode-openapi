import { useWatch } from "react-hook-form";
import * as z from "zod";

import Input from "../../../components/Input";
import Select from "../../../components/Select";
import ValidProgressButton from "../../../components/form/ValidProgressButton";
import {
  testScandManagerConnection,
  useFeatureDispatch,
  useFeatureSelector,
  ConfigScreen,
} from "../../../features/config/slice";
import ConnectionTestBanner from "../ConnectionTestBanner";
import { Container, Test, Title } from "../layout";

export function RuntimeScandManager() {
  const dispatch = useFeatureDispatch();

  const {
    scandManagerConnectionTestResult: scandManagerTestResult,
    waitingForScandManagerConnectionTest: waitingForScandManagerTest,
  } = useFeatureSelector((state) => state.config);

  const scanAuth = useWatch({ name: "scandManager.auth" });

  return (
    <>
      <Title>Configuration for Scand Manager runtime</Title>
      <Container>
        <>
          <Input label="Scand manager URL" name="scandManager.url" />
          <Select
            label="Authentication method"
            name="scandManager.auth"
            options={[
              { value: "none", label: "None" },
              { value: "header", label: "HTTP header authentication" },
            ]}
          />
          {scanAuth === "header" && (
            <>
              <Input label="Header name" name="scandManager.header.name" />
              <Input label="Header value" name="scandManager.header.value" />
            </>
          )}

          <Input label="Docker image for 'scand-agent'" name="scanImage" />

          <Input
            label="Maximum amount of time to check on scan completion (seconds)"
            name="scandManager.timeout"
          />

          <Test>
            <ValidProgressButton
              label="Test connection"
              waiting={waitingForScandManagerTest}
              onClick={(e) => {
                dispatch(testScandManagerConnection());
                e.preventDefault();
                e.stopPropagation();
              }}
            />
            <ConnectionTestBanner result={scandManagerTestResult} />
          </Test>
        </>
      </Container>
    </>
  );
}

const schema = z.object({
  scandManager: z
    .object({
      timeout: z.coerce
        .number()
        .int()
        .min(1)
        .max(60 * 60 * 24), // 1 day
    })
    .catchall(z.unknown()),
});

const screen: ConfigScreen = {
  id: "runtime-scand-manager",
  label: "Scand Manager",
  schema,
  form: RuntimeScandManager,
};

export default screen;
