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

export function ScanRuntime() {
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

  const platformAuthType = useWatch({ name: "platformAuthType" });
  const scanAuth = useWatch({ name: "scandManager.auth" });
  const configuredScanRuntime = useWatch({ name: "scanRuntime" });
  const scanRuntime = platformAuthType === "api-token" ? configuredScanRuntime : "cli";

  return (
    <>
      <Title>Runtime for API Conformance Scan</Title>
      <Container>
        {/* Only paid customers can select scan runtime */}
        {platformAuthType === "api-token" && (
          <Select
            label="Runtime"
            name="scanRuntime"
            options={[
              { value: "docker", label: "Docker" },
              { value: "scand-manager", label: "Scand manager" },
              { value: "cli", label: "42Crunch API Security Testing Binary" },
            ]}
          />
        )}

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
        )}

        {scanRuntime === "cli" && (
          <>
            <Input label="Download URL" name="repository" />
            <Input
              label="Custom binary location (optional, uses default directory if empty)"
              name="cliDirectoryOverride"
            />
          </>
        )}

        {platformAuthType === "anond-token" && (
          <Banner message="Scan runtime is set to use 42Crunch API Security Testing Binary" />
        )}

        {scanRuntime === "cli" &&
          (!cli.found || cliTestResult?.success === false || waitingForCliDownload) && (
            <>
              <Test>
                <ValidProgressButton
                  label="Download"
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
                message={`Download 42Crunch API Security Testing Binary, the binary was not found in ${cli.location}`}
              />
            </>
          )}

        {scanRuntime === "cli" && cliDownloadError !== undefined && (
          <ErrorBanner message={cliDownloadError} />
        )}

        {scanRuntime === "cli" && cli.found && (
          <>
            <Banner message={`Using 42Crunch API Security Testing Binary in ${cli.location}`} />
            <Test>
              <ValidProgressButton
                label="Check"
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
  repository: z.string().url(),
  cliDirectoryOverride: z.union([
    z.literal(""),
    z.string().regex(/^(\/.+|[A-Za-z]:\\.+)$/, {
      message:
        "Must be an absolute path (e.g. /home/username/42crunch-cli or C:\\Users\\username\\42crunch-cli)",
    }),
  ]),
});

const screen: ConfigScreen = {
  id: "scan-runtime",
  label: "Runtime",
  schema,
  form: ScanRuntime,
};

export default screen;
