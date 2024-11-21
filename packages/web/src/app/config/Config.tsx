import { useEffect } from "react";
import { useFormContext } from "react-hook-form";
import SearchSidebar from "../../components/layout/SearchSidebar";
import {
  saveConfig,
  setError,
  clearError,
  useFeatureDispatch,
  useFeatureSelector,
  ConfigScreenId,
} from "../../features/config/slice";
import Form from "../../new-components/Form";
import platformConnection from "./screen/platform-connection";
import platformServices from "./screen/platform-services";
import temporaryCollectionMaker from "./screen/temporary-collection";
import mandatoryTagsMaker from "./screen/mandatory-tags";
import runtimeBinary from "./screen/runtime-binary";
import runtimeScandManager from "./screen/runtime-scand-manager";
import runtimeDocker from "./screen/runtime-docker";
import auditRuntime from "./screen/audit-runtime";

import scanRuntime from "./screen/scan-runtime";
import openapiExternalRefs from "./screen/openapi-external-refs";
import { unwrapFormValues, wrapFormValues } from "./util";

export default function Config() {
  const dispatch = useFeatureDispatch();
  const { ready, errors, data } = useFeatureSelector((state) => state.config);

  const mandatoryTags = mandatoryTagsMaker();
  const temporaryCollection = temporaryCollectionMaker(data.platformCollectionNamingConvention);

  const sections = [
    {
      id: "platform",
      title: "42Crunch Platform",
      items: [
        platformConnection,
        platformServices,
        temporaryCollection,
        mandatoryTags,
        auditRuntime,
        scanRuntime,
      ],
    },
    {
      id: "runtime",
      title: "Runtimes",
      items: [runtimeBinary, runtimeScandManager, runtimeDocker],
    },
    {
      id: "openapi",
      title: "OpenAPI",
      items: [openapiExternalRefs],
    },
  ];

  const screenById = {
    [platformConnection.id]: platformConnection,
    [platformServices.id]: platformServices,
    [auditRuntime.id]: auditRuntime,
    [scanRuntime.id]: scanRuntime,
    [temporaryCollection.id]: temporaryCollection,
    [mandatoryTags.id]: mandatoryTags,
    [runtimeBinary.id]: runtimeBinary,
    [runtimeScandManager.id]: runtimeScandManager,
    [runtimeDocker.id]: runtimeDocker,
    [openapiExternalRefs.id]: openapiExternalRefs,
  };

  useEffect(() => {
    const formData = wrapFormValues(data);
    for (const screenId of Object.keys(screenById)) {
      const { success } = screenById[screenId].schema.safeParse(formData);
      if (success) {
        dispatch(clearError(screenId as ConfigScreenId));
      } else {
        dispatch(
          setError({
            screen: screenId as ConfigScreenId,
            error: "Validation errors, configuration is not being saved",
          })
        );
      }
    }
  }, [data]);

  if (!ready) {
    return null;
  }

  return (
    <SearchSidebar
      sections={sections}
      errors={errors}
      defaultSelection={{ sectionId: "platform", itemId: "platform-connection" }}
      render={(selected) => {
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
      }}
    />
  );
}

function TriggerValidation({ id }: { id: ConfigScreenId }) {
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
