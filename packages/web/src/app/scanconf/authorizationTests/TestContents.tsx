import styled from "styled-components";

import * as playbook from "@xliic/common/playbook";

import DownshiftSelect from "../../../new-components/fat-fields/DownshiftSelect";

export default function TestContents({ credentials }: { credentials: playbook.Credentials }) {
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

function flattenCredentials(credentials: playbook.Credentials) {
  return Object.entries(credentials)
    .map(([credentialName, credential]) => {
      return Object.entries(credential.methods || {}).map(([methodName, method]) => {
        const name =
          credential.default === methodName ? credentialName : `${credentialName}/${methodName}`;
        return { name, credential };
      });
    })
    .flat();
}
