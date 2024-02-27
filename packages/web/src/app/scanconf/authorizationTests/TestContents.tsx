import { Playbook } from "@xliic/scanconf";

import DownshiftSelect from "../../../new-components/fat-fields/DownshiftSelect";

export default function TestContents({ credentials }: { credentials: Playbook.Credentials }) {
  const options = flattenCredentials(credentials).map(({ name }) => ({ label: name, value: name }));

  return (
    <>
      <DownshiftSelect
        label="Type"
        name="key"
        options={[
          { value: "authentication-swapping-bola", label: "BOLA" },
          { value: "authentication-swapping-bfla", label: "BFLA" },
        ]}
      />

      <DownshiftSelect label="Source" name="source.0" options={options} />

      <DownshiftSelect label="Target" name="target.0" options={options} />
    </>
  );
}

function flattenCredentials(credentials: Playbook.Credentials) {
  return Object.entries(credentials)
    .map(([credentialName, credential]) => {
      return Object.entries(credential.methods || {}).map(([methodName, method]) => {
        const name = `${credentialName}/${methodName}`;
        return { name, credential };
      });
    })
    .flat();
}
