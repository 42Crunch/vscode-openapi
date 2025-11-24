import * as z from "zod";

import { Checkbox } from "../../../components/Checkbox";
import { ConfigScreen, selectVaultFile, useFeatureDispatch } from "../../../features/config/slice";
import { Container, Title } from "../layout";
import Input from "../../../new-components/fat-fields/Input";
import Button from "../../../new-components/Button";

export function Vault() {
  const dispatch = useFeatureDispatch();

  return (
    <>
      <Title>Use Vault for secrets management</Title>
      <Container>
        <Checkbox label="Use Vault" name="useVault" />
        <Input label="Vault URI" name="vaultUri" />
        <div>
          <Button
            onClick={(e) => {
              dispatch(selectVaultFile());
              e.preventDefault();
              e.stopPropagation();
            }}
          >
            Browse
          </Button>
        </div>
      </Container>
    </>
  );
}

const schema = z.object({
  useVault: z.boolean(),
  vaultUri: z.string().url().or(z.literal("")),
});

const screen: ConfigScreen = {
  id: "vault",
  label: "Vault",
  schema,
  form: Vault,
};

export default screen;
