import { useEffect, useMemo } from "react";
import styled from "styled-components";
import { useForm, FormProvider, useFormContext, useWatch, FieldValues } from "react-hook-form";

import { ThemeColorVariables } from "@xliic/common/theme";
import { BundledSwaggerOrOasSpec } from "@xliic/common/openapi";
import * as playbook from "@xliic/common/playbook";
import { wrapCredential, unwrapCredential } from "./form";
import CollapsibleCard, {
  BottomDescription,
  BottomItem,
  TopDescription,
} from "../../../components/CollapsibleCard";
import Credential from "./Credential";
import Form from "../../../new-components/Form";

export default function CredentialCard({
  credentialName,
  credential,
  saveCredential,
}: {
  credentialName: string;
  credential: playbook.Credential;
  saveCredential: (credential: playbook.Credential) => void;
}) {
  return (
    <Container>
      <CollapsibleCard defaultCollapsed={false}>
        <TopDescription>{credentialName}</TopDescription>
        <BottomDescription>
          <BottomItem>Type: {credential.type}</BottomItem>
          <BottomItem>Location: {credential.in}</BottomItem>
          <BottomItem>Name: {credential.name}</BottomItem>
        </BottomDescription>
        <Form
          data={credential}
          saveData={saveCredential}
          wrapFormData={wrapCredential}
          unwrapFormData={unwrapCredential}
        >
          <Credential />
        </Form>
      </CollapsibleCard>
    </Container>
  );
}

const Container = styled.div``;
