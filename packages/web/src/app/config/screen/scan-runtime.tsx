import { useWatch } from "react-hook-form";
import * as z from "zod";

import { Banner } from "../../../components/Banner";
import Input from "../../../new-components/fat-fields/Input";
import Select from "../../../components/Select";
import { ConfigScreen } from "../../../features/config/slice";
import { Container, Title } from "../layout";

export function ScanRuntime() {
  const platformAuthType = useWatch({ name: "platformAuthType" });
  const runtime = useWatch({ name: "scanRuntime" });

  return (
    <>
      <Title>Runtime for API Scan</Title>
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

        {platformAuthType === "anond-token" && (
          <Banner message="API Scan runtime is configured to use 42Crunch API Security Testing Binary" />
        )}

        {(runtime === "docker" || runtime === "cli") && (
          <Container>
            <Input
              label="API proxy URL"
              name="scanProxy"
              description="The proxy URL for target API calls during the scan."
            />{" "}
          </Container>
        )}
      </Container>
    </>
  );
}

const schema = z.object({
  scanRuntime: z.enum(["docker", "scand-manager", "cli"]),
  scanProxy: z.string().url().optional().or(z.literal("")),
});

const screen: ConfigScreen = {
  id: "scan-runtime",
  label: "API Scan runtime",
  schema,
  form: ScanRuntime,
};

export default screen;
