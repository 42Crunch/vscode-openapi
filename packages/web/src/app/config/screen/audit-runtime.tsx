import { useWatch } from "react-hook-form";
import * as z from "zod";

import { Banner } from "../../../components/Banner";
import Select from "../../../components/Select";
import { ConfigScreen } from "../../../features/config/slice";
import { Container, Title } from "../layout";

export function AuditRuntime() {
  const platformAuthType = useWatch({ name: "platformAuthType" });

  return (
    <>
      <Title>Runtime for API Audit</Title>
      <Container>
        {/* Only paid customers can select audit runtime */}
        {platformAuthType === "api-token" && (
          <p>TODO</p>
          // <Select
          //   label="Runtime"
          //   name="scanRuntime"
          //   options={[
          //     { value: "docker", label: "Docker" },
          //     { value: "scand-manager", label: "Scand manager" },
          //     { value: "cli", label: "42Crunch API Security Testing Binary" },
          //   ]}
          // />
        )}

        {platformAuthType === "anond-token" && (
          <Banner message="Audit runtime is set to use 42Crunch API Security Testing Binary" />
        )}
      </Container>
    </>
  );
}

const schema = z.object({});

const screen: ConfigScreen = {
  id: "audit-runtime",
  label: "API Audit runtime",
  schema,
  form: AuditRuntime,
};

export default screen;
