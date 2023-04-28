import { useFormContext, useWatch } from "react-hook-form";

import Input from "../../components/Input";
import {
  useFeatureDispatch,
  useFeatureSelector,
  testScandManagerConnection,
} from "../../features/config/slice";
import { NormalProgressButton } from "../../components/ProgressButton";
import Select from "../../components/Select";
import ConnectionTestBanner from "./ConnectionTestBanner";
import { Container, Test, Title } from "./layout";
import { Checkbox } from "../../components/Checkbox";

export default function ScanRuntime() {
  const dispatch = useFeatureDispatch();
  const {
    scandManagerConnectionTestResult: scandManagerTestResult,
    waitingForScandManagerConnectionTest: waitingForScandManagerTest,
  } = useFeatureSelector((state) => state.config);

  const scanRuntime = useWatch({ name: "scanRuntime" });
  const scanAuth = useWatch({ name: "scandManager.auth" });

  const {
    formState: { isValid },
  } = useFormContext();

  return (
    <>
      <Title>Runtime for scand-agent</Title>
      <Container>
        <Select
          label="Runtime"
          name="scanRuntime"
          options={[
            { value: "docker", label: "Docker" },
            { value: "scand-manager", label: "Scand manager" },
          ]}
        />
        {scanRuntime === "docker" && (
          <>
            <Checkbox
              name="docker.replaceLocalhost"
              label='Replace "localhost" hostname with "host.docker.internal" (Windows and Mac only)'
            />
            <Checkbox name="docker.useHostNetwork" label='Use "host" network (Linux only)' />
          </>
        )}
        {scanRuntime === "scand-manager" && (
          <>
            <Input label="Scand Manager URL" name="scandManager.url" />
            <Select
              label="Authentication method"
              name="scandManager.auth"
              options={[
                { value: "none", label: "None" },
                { value: "header", label: "HTTP Header Authentication" },
              ]}
            />
            {scanAuth === "header" && (
              <>
                <Input label="Header Name" name="scandManager.header.name" />
                <Input label="Header Value" name="scandManager.header.value" />
              </>
            )}
            <Test>
              <NormalProgressButton
                disabled={!isValid}
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
        )}
      </Container>
    </>
  );
}
