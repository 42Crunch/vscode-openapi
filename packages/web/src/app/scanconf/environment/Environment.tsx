import * as playbook from "@xliic/common/playbook";
import { makeEnvEnv } from "../../../core/playbook/execute";
import Form from "../../../new-components/Form";
import { useAppSelector } from "../store";
import EnvironmentForm from "./EnvironmentForm";
import { ErrorBanner } from "../components/Banner";

export default function Environment({ name }: { name: string }) {
  const {
    playbook: { environments, runtimeConfiguration },
  } = useAppSelector((state) => state.scanconf);

  const env = useAppSelector((state) => state.env.data);

  const environment = environments[runtimeConfiguration?.environment || "default"];

  const [scanenv, scanenvError] = makeEnvEnv(environment, env);

  return (
    <Form
      wrapFormData={wrapEnvironment}
      unwrapFormData={unwrapEnvironment}
      data={environment}
      saveData={(data) => undefined}
    >
      <EnvironmentForm missing={scanenvError} />
      {scanenvError !== undefined && (
        <ErrorBanner
          message={
            "Some of the required variables are not set, plesse set these in the IDE Environment: " +
            scanenvError.join(", ")
          }
        ></ErrorBanner>
      )}
    </Form>
  );
}

function wrapEnvironment(env: playbook.PlaybookEnvironment) {
  return {
    variables: Object.entries(env.variables).map(([key, value]) => ({ key, value })),
  };
}

function unwrapEnvironment(data: any): playbook.PlaybookEnvironment {
  const env: playbook.PlaybookEnvironment = {
    variables: {},
  };

  for (const { key, value } of data.variables) {
    env.variables[key] = value;
  }

  return env;
}
