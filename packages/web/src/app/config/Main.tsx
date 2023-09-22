import { useFeatureSelector } from "../../features/config/slice";
import SearchSidebar from "../../components/layout/SearchSidebar";
import ConfigurationForm from "./ConfigurationForm";

import platformConnection from "./screen/platform-connection";
import platformServices from "./screen/platform-services";
import scanImage from "./screen/scan-image";
import scanRuntime from "./screen/scan-runtime";
import { wrapFormValues } from "./util";

const sections = [
  {
    id: "platform",
    title: "42Crunch Platform",
    items: [platformConnection, platformServices],
  },
  {
    id: "scan",
    title: "API Conformance Scan",
    items: [scanImage, scanRuntime],
  },
];

const screenById = {
  [platformConnection.id]: platformConnection,
  [platformServices.id]: platformServices,
  [scanImage.id]: scanImage,
  [scanRuntime.id]: scanRuntime,
};

export default function Config() {
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
          const { form: Form, schema, id } = screenById[selected.itemId];

          return (
            <ConfigurationForm id={id} values={wrapFormValues(data)} schema={schema}>
              <Form />
            </ConfigurationForm>
          );
        }
      }}
    />
  );
}
