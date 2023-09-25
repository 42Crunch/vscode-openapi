import { useFieldArray, useFormContext } from "react-hook-form";
import styled from "styled-components";
import { ThemeColorVariables } from "@xliic/common/theme";
import { useAppSelector, useAppDispatch } from "../store";
import Form from "../components/Form";
import EnvironmentForm from "./EnvironmentForm";
import * as playbook from "@xliic/common/playbook";

export default function Environment({ name }: { name: string }) {
  const {
    playbook: { environments },
  } = useAppSelector((state) => state.scanconf);

  const environment = environments[name];

  return (
    <Form
      wrapFormData={wrapEnvironment}
      unwrapFormData={unwrapEnvironment}
      data={environment}
      saveData={(data) => undefined}
    >
      <EnvironmentForm />
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
