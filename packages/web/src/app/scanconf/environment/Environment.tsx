import { Playbook } from "@xliic/scanconf";
import { makeEnvEnv } from "../../../core/playbook/execute";
import Form from "../../../new-components/Form";
import { useAppDispatch, useAppSelector } from "../store";
import EnvironmentForm from "./EnvironmentForm";
import { ErrorBanner } from "../components/Banner";
import { saveEnvironment } from "../slice";

export default function Environment({ name }: { name: string }) {
  const dispatch = useAppDispatch();

  const {
    playbook: { environments },
  } = useAppSelector((state) => state.scanconf);

  const env = useAppSelector((state) => state.env.data);

  const environment = environments[name];

  const { missing } = makeEnvEnv(environment, env);

  return (
    <Form
      wrapFormData={wrapEnvironment}
      unwrapFormData={unwrapEnvironment}
      data={environment}
      saveData={(environment) => dispatch(saveEnvironment({ name, environment }))}
    >
      <EnvironmentForm missing={missing} />
      {missing.length > 0 && (
        <ErrorBanner
          message={
            "Some of the required variables are not set, create these in the IDE Environment: " +
            missing.join(", ")
          }
        ></ErrorBanner>
      )}
    </Form>
  );
}

function wrapEnvironment(env: Playbook.Environment) {
  return {
    variables: Object.entries(env.variables).map(([key, value]) => ({ key, value })),
  };
}

function unwrapEnvironment(data: any): Playbook.Environment {
  const env: Playbook.Environment = {
    variables: {},
  };

  for (const { key, value } of data.variables) {
    env.variables[key] = value;
  }

  return env;
}
