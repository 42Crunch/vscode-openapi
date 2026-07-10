import styled from "styled-components";
import * as z from "zod";

import { Playbook } from "@xliic/scanconf";

import Form from "../../../new-components/Form";
import Input from "../../../new-components/fat-fields/Input";
import FileInput from "../../../new-components/fat-fields/FileInput";
import { setSecurityProfile } from "../slice";
import { useAppDispatch, useAppSelector } from "../store";
import { CERTIFICATE_EXTENSIONS } from "./mtls";

// Detail page for the synthetic "mTLS" security scheme backed by
// playbook.securityProfile.
export default function SecurityProfile() {
  const dispatch = useAppDispatch();
  const { securityProfile } = useAppSelector((state) => state.scanconf.playbook);

  if (securityProfile === undefined) {
    return (
      <Container>
        <Description>No mutual TLS security profile is configured.</Description>
      </Container>
    );
  }

  const schema = z.object({
    clientCertificate: z.string().min(1, { message: "Required" }),
    clientCertificatePassword: z.string().min(1, { message: "Required" }),
    caServerCertificate: z.string(),
  });

  return (
    <Container>
      <Form
        data={securityProfile}
        saveData={(profile) => dispatch(setSecurityProfile(profile))}
        wrapFormData={wrapSecurityProfile}
        unwrapFormData={unwrapSecurityProfile}
        schema={schema}
      >
        <SecurityProfileFields />
      </Form>
    </Container>
  );
}

function SecurityProfileFields() {
  return (
    <Fields>
      <FileInput
        label="Client certificate"
        name="clientCertificate"
        title="Select client certificate"
        extensions={CERTIFICATE_EXTENSIONS}
      />
      <Input label="Client certificate password" name="clientCertificatePassword" password />
      <FileInput
        label="CA server certificate (optional)"
        name="caServerCertificate"
        title="Select CA certificate"
        extensions={CERTIFICATE_EXTENSIONS}
      />
    </Fields>
  );
}

function wrapSecurityProfile(profile: Playbook.SecurityProfile) {
  return {
    clientCertificate: profile.clientCertificate,
    clientCertificatePassword: profile.clientCertificatePassword,
    caServerCertificate: profile.caServerCertificate ?? "",
  };
}

function unwrapSecurityProfile(data: any): Playbook.SecurityProfile {
  return {
    clientCertificate: data.clientCertificate,
    clientCertificatePassword: data.clientCertificatePassword,
    caServerCertificate: data.caServerCertificate === "" ? undefined : data.caServerCertificate,
  };
}

const Container = styled.div`
  padding: 8px;
`;

const Fields = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const Description = styled.div`
  opacity: 0.8;
`;
