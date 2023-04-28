import { useEffect } from "react";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

import { Config as ConfigData } from "@xliic/common/config";

import { saveConfig, useFeatureDispatch, useFeatureSelector } from "../../features/config/slice";
import PlatformConnection from "./PlatformConnection";
import PlatformServices from "./PlatformServices";
import ScanDockerImage from "./ScanDockerImage";
import ScanRuntime from "./ScanRuntime";
import SearchSidebar from "../../components/layout/SearchSidebar";

const sections = [
  {
    title: "42Crunch Platform",
    items: [
      { id: "platform-connection", label: "Connection" },
      { id: "platform-services", label: "Services" },
    ],
  },
  {
    title: "API Conformance Scan",
    items: [
      { id: "scan-runtime", label: "Runtime" },
      { id: "scan-image", label: "Docker image" },
    ],
  },
];

export default function Config() {
  const { data, ready } = useFeatureSelector((state) => state.config);

  if (!ready) {
    return null;
  }

  return <ConfigForm values={wrapFormValues(data)} />;
}

function ConfigForm({ values }: { values: ConfigData }) {
  const dispatch = useFeatureDispatch();

  const schema = z
    .object({
      platformUrl: z.string().url().startsWith("https://"),
      platformApiToken: z
        .string()
        .regex(
          /^(ide_|api_)?[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
        ),
    })
    .catchall(z.unknown());

  const methods = useForm({
    values,
    mode: "onChange",
    resolver: zodResolver(schema),
  });

  const {
    formState: { isDirty, isValid, isValidating },
  } = methods;

  function onSubmit(values: ConfigData) {
    dispatch(saveConfig(values));
  }

  useEffect(() => {
    if (isDirty && isValid && !isValidating) {
      methods.handleSubmit(onSubmit)();
    }
  }, [isDirty, isValid, isValidating]);

  return (
    <FormProvider {...methods}>
      <SearchSidebar
        sections={sections}
        defaultSelection="platform-connection"
        render={(selected) => {
          return (
            <>
              {selected === "platform-connection" && <PlatformConnection />}
              {selected === "platform-services" && <PlatformServices />}
              {selected === "scan-image" && <ScanDockerImage />}
              {selected === "scan-runtime" && <ScanRuntime />}
            </>
          );
        }}
      />
    </FormProvider>
  );
}

export function wrapFormValues(values: ConfigData): ConfigData {
  const mutable = JSON.parse(JSON.stringify(values)) as ConfigData;
  if (mutable.platformApiToken === undefined) {
    mutable.platformApiToken = "";
  }
  return mutable;
}
