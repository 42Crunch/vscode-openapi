import * as z from "zod";

import { Banner, ErrorBanner } from "../../../components/Banner";
import Input from "../../../components/Input";
import ValidProgressButton from "../../../components/form/ValidProgressButton";
import {
  downloadCli,
  testCli,
  useFeatureDispatch,
  useFeatureSelector,
  ConfigScreen,
} from "../../../features/config/slice";
import CliVersionBanner from "../CliVersionBanner";
import ProgressBar from "../ProgressBar";
import { Container, Test, Title } from "../layout";

export function RuntimeBinary() {
  const dispatch = useFeatureDispatch();

  const {
    waitingForCliTest,
    cliTestResult,
    waitingForCliDownload,
    cliDownloadPercent,
    cliDownloadError,
    data: { cli },
  } = useFeatureSelector((state) => state.config);

  return (
    <>
      <Title>Configuration for 42Crunch Binary runtime</Title>
      <Container>
        <>
          <Input label="Download URL" name="repository" />
          <Input
            label="Custom binary location (optional, uses default directory if empty)"
            name="cliDirectoryOverride"
          />
        </>

        {(!cli.found || cliTestResult?.success === false || waitingForCliDownload) && (
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

        {cliDownloadError !== undefined && <ErrorBanner message={cliDownloadError} />}

        {cli.found && (
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
  id: "runtime-binary",
  label: "42Crunch Binary",
  schema,
  form: RuntimeBinary,
};

export default screen;
