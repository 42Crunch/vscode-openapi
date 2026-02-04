import { Playbook } from "@xliic/scanconf";
import { makeEnvEnv } from "../../../core/playbook/execute";
import Form from "../../../new-components/Form";
import { useAppDispatch, useAppSelector } from "../store";
import EnvironmentForm from "./EnvironmentForm";
import { ErrorBanner } from "../components/Banner";
import ConstantEnvironment from "../components/environment/Environment";
import { saveEnvironment } from "../slice";
import { TabContainer } from "../../../new-components/Tabs";
import { useState } from "react";
import DescriptionTooltip from "../../../new-components/DescriptionTooltip";

export default function Environment({ name }: { name: string }) {
  const dispatch = useAppDispatch();

  const {
    playbook: { environments },
  } = useAppSelector((state) => state.scanconf);

  const env = useAppSelector((state) => state.env.data);

  const [activeTab, setActiveTab] = useState("environment");

  const environment = environments[name];

  const { missing } = makeEnvEnv(environment, env);

  return (
    <Form
      wrapFormData={wrapEnvironment}
      unwrapFormData={unwrapEnvironment}
      data={environment}
      saveData={(environment) => dispatch(saveEnvironment({ name, environment }))}
    >
      <TabContainer
        round
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        menu={
          <DescriptionTooltip>
            Use data from the external sources (such as secrets) to set Scan variables
          </DescriptionTooltip>
        }
        tabs={[
          {
            id: "environment",
            title: "External inputs",
            content: (
              <>
                <EnvironmentForm missing={missing} />
                {missing.length > 0 && (
                  <ErrorBanner
                    message={
                      "Some of the required variables are not set, create these in the IDE Environment: " +
                      missing.join(", ")
                    }
                  ></ErrorBanner>
                )}
              </>
            ),
          },
          // {
          //   id: "constants",
          //   title: "Constants",
          //   content: <ConstantEnvironment name="constants" />,
          // },
        ]}
      />
    </Form>
  );
}

function wrapEnvironment(env: Playbook.Environment) {
  return {
    variables: Object.entries(env.variables)
      .filter(([key, value]) => value.from === "environment")
      .map(([key, value]) => ({ key, value })),
    constants: Object.entries(env.variables)
      .filter(([key, value]) => value.from === "hardcoded")
      .map(([key, value]) => ({
        key,
        value: (value as Playbook.EnvironmentConstant).value,
        type: typeof (value as Playbook.EnvironmentConstant).value,
      })),
  };
}

function unwrapEnvironment(data: any): Playbook.Environment {
  const env: Playbook.Environment = {
    variables: {},
  };

  for (const { key, value } of data.variables) {
    env.variables[key] = value;
  }

  for (const { key, value, type } of data.constants) {
    env.variables[key] = {
      from: "hardcoded",
      value: convertToType(value, type),
    };
  }

  return env;
}

function convertToType(value: string, type: string): unknown {
  if (type !== "string") {
    try {
      return JSON.parse(value);
    } catch (e) {
      // failed to convert, return string value
      return value;
    }
  }

  return `${value}`;
}
