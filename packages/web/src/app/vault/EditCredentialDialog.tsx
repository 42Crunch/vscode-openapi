import { CredentialIdentifier, SchemeType, SecurityCredential } from "@xliic/common/vault";

import FormDialog from "../../new-components/FormDialog";
import EditCredentialForm from "./EditCredentialForm";
import { credentialFormSchema } from "./credential-schema";

export default function EditCredentialDialog({
  onCredentialUpdate,
  id,
  credential,
  schemeType,
  existing,
  isOpen,
  setOpen,
}: {
  onCredentialUpdate: (id: CredentialIdentifier, name: string, value: SecurityCredential) => void;
  id: CredentialIdentifier;
  credential: SecurityCredential;
  schemeType: SchemeType;
  existing: string[];
  isOpen: boolean;
  setOpen: (open: boolean) => void;
}) {
  const defaultValues = {
    name: id.credential,
    ...credential,
  };

  const onSubmit = (data: any) => {
    const name = data.name;
    delete data.name;
    onCredentialUpdate(id, name, data);
  };

  return (
    <FormDialog
      title="Edit credential"
      defaultValues={defaultValues}
      schema={credentialFormSchema(id.credential, existing)[schemeType]}
      onSubmit={onSubmit}
      open={isOpen}
      onOpenChange={setOpen}
      noOverflow
    >
      <EditCredentialForm schemeType={schemeType} />
    </FormDialog>
  );
}
