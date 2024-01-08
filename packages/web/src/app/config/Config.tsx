import { useEffect } from "react";
import { useFormContext } from "react-hook-form";
import SearchSidebar from "../../components/layout/SearchSidebar";
import {
  saveConfig,
  setError,
  clearError,
  useFeatureDispatch,
  useFeatureSelector,
  ConfigScreen,
} from "../../features/config/slice";
import Form from "../../new-components/Form";
import platformConnection from "./screen/platform-connection";
import platformServices from "./screen/platform-services";
import temporaryCollection from "./screen/temporary-collection";
import mandatoryTags from "./screen/mandatory-tags";
import scanRuntime from "./screen/scan-runtime";
import { unwrapFormValues, wrapFormValues } from "./util";

const sections = [
  {
    id: "platform",
    title: "42Crunch Platform",
    items: [platformConnection, platformServices, temporaryCollection, mandatoryTags],
  },
  {
    id: "scan",
    title: "API Conformance Scan",
    items: [scanRuntime],
  },
];

const screenById = {
  [platformConnection.id]: platformConnection,
  [platformServices.id]: platformServices,
  [scanRuntime.id]: scanRuntime,
  [temporaryCollection.id]: temporaryCollection,
  [mandatoryTags.id]: mandatoryTags,
};

export default function Config() {
  const dispatch = useFeatureDispatch();
  const { ready, errors, data } = useFeatureSelector((state) => state.config);

  if (!ready) {
    return null;
  }

  return (
    <SearchSidebar
      sections={sections}
      errors={errors}
      defaultSelection={{ sectionId: "platform", itemId: "platform-connection" }}
      render={(selected) => {
        if (selected !== undefined) {
          const { id, form: ConfigScreen, schema } = screenById[selected.itemId];
          return (
            <Form
              data={data}
              wrapFormData={wrapFormValues}
              unwrapFormData={unwrapFormValues}
              saveData={(data) => dispatch(saveConfig(data))}
              schema={schema}
            >
              <ConfigScreen />
              <TriggerValidation id={id} />
            </Form>
          );
        }
      }}
    />
  );
}

function TriggerValidation({ id }: { id: ConfigScreen }) {
  const dispatch = useFeatureDispatch();

  const {
    trigger,
    formState: { isValid },
  } = useFormContext();

  useEffect(() => {
    // triggers form validation each time config screen changes
    trigger();
  }, [id]);

  useEffect(() => {
    if (isValid) {
      dispatch(clearError(id));
    } else {
      dispatch(
        setError({ screen: id, error: "Validation errors, configuration is not being saved" })
      );
    }
  }, [id, isValid]);

  return null;
}
