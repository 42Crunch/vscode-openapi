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
    title: "42Crunch Platform",
    items: [platformConnection, platformServices],
  },
  {
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
      defaultSelection="platform-connection"
      render={(selected) => {
        const { form: Form, schema, id } = screenById[selected];

        return (
          <ConfigurationForm id={id} values={wrapFormValues(data)} schema={schema}>
            <Form />
          </ConfigurationForm>
        );
      }}
    />
  );
}
