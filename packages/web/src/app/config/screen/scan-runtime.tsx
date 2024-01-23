import { useWatch } from "react-hook-form";
import * as z from "zod";

import { Banner, ErrorBanner } from "../../../components/Banner";
import { Checkbox } from "../../../components/Checkbox";
import Input from "../../../components/Input";
import Select from "../../../components/Select";
import ValidProgressButton from "../../../components/form/ValidProgressButton";
import {
  downloadCli,
  testCli,
  testScandManagerConnection,
  useFeatureDispatch,
  useFeatureSelector,
  openLink,
  ConfigScreen,
} from "../../../features/config/slice";
import CliVersionBanner from "../CliVersionBanner";
import ConnectionTestBanner from "../ConnectionTestBanner";
import ProgressBar from "../ProgressBar";
import { Container, Test, Title } from "../layout";

export function PlatformServices() {
  const dispatch = useFeatureDispatch();

  const {
    scandManagerConnectionTestResult: scandManagerTestResult,
    waitingForScandManagerConnectionTest: waitingForScandManagerTest,
    waitingForCliTest,
    cliTestResult,
    waitingForCliDownload,
    cliDownloadPercent,
    cliDownloadError,
    data: { cli },
  } = useFeatureSelector((state) => state.config);

  const scanRuntime = useWatch({ name: "scanRuntime" });
  const scanAuth = useWatch({ name: "scandManager.auth" });

  return (
    <>
      <Title>Runtime for API Conformance Scan</Title>
      <Container>
        <Select
          label="Runtime"
          name="scanRuntime"
          options={[
            { value: "docker", label: "Docker" },
            { value: "scand-manager", label: "Scand manager" },
            { value: "cli", label: "42Crunch CLI" },
          ]}
        />

        {scanRuntime === "docker" && (
          <>
            <Input label="Docker image for 'scand-agent'" name="scanImage" />

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

            <Input label="Docker image for 'scand-agent'" name="scanImage" />

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

        {scanRuntime === "cli" && <Input label="Download URL" name="repository" />}

        {scanRuntime === "cli" && cli.found && (
          <>
            <Banner message={`Using 42Crunch CLI in ${cli.location}`} />
            <Test>
              <ValidProgressButton
                label="Check version"
                waiting={waitingForCliTest}
                onClick={(e) => {
                  dispatch(testCli());
                  e.preventDefault();
                  e.stopPropagation();
                }}
              />

              <CliVersionBanner result={cliTestResult} />
            </Test>
          </>
        )}

        {scanRuntime === "cli" && !cli.found && (
          <>
            <Test>
              <ValidProgressButton
                label="Download CLI"
                waiting={waitingForCliDownload}
                onClick={(e) => {
                  dispatch(downloadCli());
                  e.preventDefault();
                  e.stopPropagation();
                }}
              />
              {waitingForCliDownload && <ProgressBar progress={cliDownloadPercent} />}
            </Test>
            <Banner
              message={`Download 42Crunch CLI, the binary was not found in ${cli.location}`}
            />
          </>
        )}

        {scanRuntime === "cli" && cliDownloadError !== undefined && (
          <ErrorBanner message={cliDownloadError} />
        )}

        {scanRuntime === "cli" && (
          <div>
            <p>
              In addition to to executing the Conformance Scan, we will use the CLI to perform
              Security Audit.
            </p>

            <p>
              A Security Audit Token is required for the CLI, IDE Tokens are not currently
              supported.
            </p>

            <p>
              42Crunch CLI is subject to usage limits, find more details at{" "}
              <a
                href="https://42crunch.com/free-user-faq/"
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  dispatch(openLink("https://42crunch.com/free-user-faq/"));
                }}
              >
                Free User FAQ
              </a>
            </p>
          </div>
        )}
      </Container>
    </>
  );
}

const schema = z.object({}).catchall(z.unknown());

const screen: ConfigScreen = {
  id: "scan-runtime",
  label: "Runtime",
  schema,
  form: PlatformServices,
};

export default screen;
