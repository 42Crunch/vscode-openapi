import { useFormContext, useWatch } from "react-hook-form";

import Input from "../../components/Input";
import {
  useFeatureDispatch,
  useFeatureSelector,
  testOverlordConnection,
} from "../../features/config/slice";
import { NormalProgressButton } from "../../components/ProgressButton";
import Select from "../../components/Select";
import { Container, Test, Title } from "./layout";
import ConnectionTestBanner from "./ConnectionTestBanner";

export default function Scan() {
  const dispatch = useFeatureDispatch();
  const {
    overlordConnectionTestResult: overlordTestResult,
    waitingForOverlordConnectionTest: waitingForOverlordTest,
  } = useFeatureSelector((state) => state.config);

  const source = useWatch({ name: "platformServices.source" });

  const {
    formState: { isValid },
  } = useFormContext();

  return (
    <>
      <Title>42Crunch Platform services</Title>
      <Container>
        <Select
          label="Platform services"
          name="platformServices.source"
          options={[
            { value: "auto", label: "Detect the host automatically" },
            { value: "manual", label: "Specify the host manually" },
          ]}
        />
        {source == "manual" && <Input label="Host" name="platformServices.manual" />}
        {source == "auto" && (
          <Input label="Host (automatic, read-only)" name="platformServices.auto" disabled />
        )}
        <Test>
          <NormalProgressButton
            disabled={!isValid}
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
