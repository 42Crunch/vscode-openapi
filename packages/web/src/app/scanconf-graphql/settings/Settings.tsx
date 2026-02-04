import SearchSidebar from "../../../components/layout/SearchSidebar";
import Form from "../../../new-components/Form";
import * as actions from "../slice";
import { useAppDispatch, useAppSelector } from "../store";
import environment from "./screen/environment";
import logging from "./screen/logging";
import general from "./screen/general";
import { unwrapSettings, wrapSettings } from "./schema";

const sections = [
  {
    id: "logging",
    title: "Logging",
    items: [logging],
  },
  {
    id: "environment",
    title: "Environment",
    items: [environment],
  },
  {
    id: "general",
    title: "General",
    items: [general],
  },
];

const screenById = {
  [general.id]: general,
  [logging.id]: logging,
  [environment.id]: environment,
};

export default function Config() {
  const dispatch = useAppDispatch();

  const runtimeConfiguration = useAppSelector(
    (state) => state.scanconf.playbook.runtimeConfiguration
  );

  return (
    <SearchSidebar
      noSectionTitles
      sections={sections}
      defaultSelection={{ sectionId: "logging", itemId: "logging" }}
      render={(selected) => {
        const { id, form: ConfigScreen, schema } = screenById[selected.itemId];
        return (
          <Form
            schema={schema}
            wrapFormData={wrapSettings}
            unwrapFormData={unwrapSettings}
            data={runtimeConfiguration || {}}
            saveData={(settings) => dispatch(actions.saveSettings(settings))}
          >
            <ConfigScreen />
          </Form>
        );
      }}
    />
  );
}
