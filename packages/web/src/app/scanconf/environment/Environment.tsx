import { useFieldArray, useFormContext } from "react-hook-form";
import styled from "styled-components";
import { ThemeColorVariables } from "@xliic/common/theme";
import { useAppSelector, useAppDispatch } from "../store";
import Form from "../components/Form";
import EnvironmentForm from "./EnvironmentForm";
import * as playbook from "@xliic/common/playbook";
import { makeEnvEnv } from "../../../core/playbook/execute";

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
