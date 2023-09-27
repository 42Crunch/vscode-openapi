import React from "react";
import { useWatch } from "react-hook-form";
import * as z from "zod";
import { Banner } from "../../../components/Banner";
import { Checkbox } from "../../../components/Checkbox";
import Input from "../../../components/Input";
import Select from "../../../components/Select";
import ValidProgressButton from "../../../components/form/ValidProgressButton";
import {
  ConfigScreen,
  testScandManagerConnection,
  useFeatureDispatch,
  useFeatureSelector,
} from "../../../features/config/slice";
import ConnectionTestBanner from "../ConnectionTestBanner";
import { Container, Test, Title } from "../layout";

export function PlatformServices() {
  const dispatch = useFeatureDispatch();

  const {
    scandManagerConnectionTestResult: scandManagerTestResult,
    waitingForScandManagerConnectionTest: waitingForScandManagerTest,
  } = useFeatureSelector((state) => state.config);

  const scanRuntime = useWatch({ name: "scanRuntime" });
  const scanAuth = useWatch({ name: "scandManager.auth" });
  const scanImage = useWatch({ name: "scanImage" });

  return (
    <>
      <Title>Runtime for scand-agent</Title>
      <Container>
        <Banner
          message={`Using "${scanImage}" image. It can be changed in "Docker image" section`}
        />

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
        )}
      </Container>
    </>
  );
}

const schema = z.object({}).catchall(z.unknown());

const screen: {
  id: ConfigScreen;
  label: string;
  schema: z.ZodObject<any>;
  form: React.FC;
} = {
  id: "scan-runtime",
  label: "Runtime",
  schema,
  form: PlatformServices,
};

export default screen;
