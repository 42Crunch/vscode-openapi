import * as z from "zod";
import {
  ConfigScreen,
} from "../../../features/config/slice";
import { Container, Title } from "../layout";
import Select from "../../../components/Select";

export function DataDictionary() {
  return (
    <>
      <Title>Data Dictionary Pre Audit Fix</Title>
      <p>
        Update document to match Data Dictionary definitions before running Security Audit
      </p>
      <Container>
      <Select
            label="Pre Audit Fix"
            name="dataDictionaryPreAuditFix"
            options={[
              { value: "ask", label: "Ask before updating" },
              { value: "always", label: "Always update, don't ask for confirmation" },
              { value: "never", label: "Never update, don't ask for confirmation" },
          ]}
          />
      </Container>
    </>
  );
}

const schema = z.object({
    dataDictionaryPreAuditFix: z.enum(["ask", "always", "never"]),
});

const screen: ConfigScreen = {
  id: "data-dictionary",
  label: "Data Dictionary",
  schema,
  form: DataDictionary,
};

export default screen;