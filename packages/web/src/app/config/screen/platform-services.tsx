import * as z from "zod";
import { Config } from "@xliic/common/config";

import {
  ConfigScreen,
  useFeatureDispatch,
  useFeatureSelector,
  testOverlordConnection,
} from "../../../features/config/slice";
import Input from "../../../components/Input";
import Select from "../../../components/Select";
import ConnectionTestBanner from "../ConnectionTestBanner";
import { Container, Test, Title } from "../layout";
import ValidProgressButton from "../../../components/form/ValidProgressButton";
import { useWatch } from "react-hook-form";
import React from "react";

type Section = Pick<Config, "platformServices">;

export function PlatformServices() {
  const dispatch = useFeatureDispatch();

  const {
    overlordConnectionTestResult: overlordTestResult,
    waitingForOverlordConnectionTest: waitingForOverlordTest,
  } = useFeatureSelector((state) => state.config);

  const source = useWatch({ name: "platformServices.source" });

  return (
    <>
      <Title>42Crunch Platform services</Title>

      <Container>
        <Select<Section>
          label="Platform services"
          name="platformServices.source"
          options={[
            { value: "auto", label: "Detect the host automatically" },
            { value: "manual", label: "Specify the host manually" },
          ]}
        />
        {source == "manual" && <Input<Section> label="Host" name="platformServices.manual" />}
        {source == "auto" && (
          <Input<Section>
            label="Host (automatic, read-only)"
            name="platformServices.auto"
            disabled
          />
        )}
        <Test>
          <ValidProgressButton
            label="Test connection"
            waiting={waitingForOverlordTest}
            onClick={(e) => {
              dispatch(testOverlordConnection());
              e.preventDefault();
              e.stopPropagation();
            }}
          />

          <ConnectionTestBanner result={overlordTestResult} />
        </Test>
      </Container>
    </>
  );
}

const schema = z.object({}).catchall(z.unknown());

const screen: {
  id: ConfigScreen;
  label: string;
  schema: z.ZodObject<any>;
  form: React.FC;
} = {
  id: "platform-services",
  label: "Services",
  schema,
  form: PlatformServices,
};

export default screen;
