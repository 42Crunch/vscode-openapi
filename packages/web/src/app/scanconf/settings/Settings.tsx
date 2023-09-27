import * as playbook from "@xliic/common/playbook";
import styled from "styled-components";
import Form from "../../../new-components/Form";
import Input from "../components/Input";
import Select from "../components/Select";
import * as actions from "../slice";
import { useAppDispatch, useAppSelector } from "../store";

export default function Settings() {
  const dispatch = useAppDispatch();

  const runtimeConfiguration = useAppSelector(
    (state) => state.scanconf.playbook.runtimeConfiguration
  );

  return (
    <Container>
      <Form
        wrapFormData={wrapSettings}
        unwrapFormData={unwrapSettings}
        data={runtimeConfiguration || {}}
        saveData={(settings) => dispatch(actions.saveSettings(settings))}
      >
        <Content>
          <Input name="environment" label="Default environment" />
          <Select
            name="logLevel"
            label="Log level"
            options={[
              { value: "debug", label: "debug" },
              { value: "info", label: "info" },
              { value: "error", label: "error" },
              { value: "critical", label: "critical" },
            ]}
          />
          <Input name="logDestination" label="Log destination" />
        </Content>
      </Form>
    </Container>
  );
}

const Container = styled.div`
  padding: 8px;
`;

const Content = styled.div`
  padding: 8px;
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

function wrapSettings(settings: playbook.RuntimeConfiguration) {
  return {
    ...settings,
    logLevel: settings.logLevel !== undefined ? settings.logLevel : "",
  };
}

function unwrapSettings(data: any): playbook.RuntimeConfiguration {
  return { ...data, logLevel: data.logLevel !== "" ? data.logLevel : undefined };
}
