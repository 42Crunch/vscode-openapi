import styled from "styled-components";
import Form from "react-bootstrap/Form";

import { useEffect } from "react";
import { useForm, FormProvider } from "react-hook-form";

import Servers from "../Servers";

import { HttpMethod } from "@xliic/common/http";
import { TryitConfig } from "@xliic/common/messages/tryit";
import { BundledOpenApiSpec, getOperation, OasRequestBody } from "@xliic/common/oas30";
import { deref } from "@xliic/common/jsonpointer";
import { getParameters, getSecurity } from "../../util";
import OperationHeader from "./OperationHeader";
import OperationTabs from "./OperationTabs";

export default function Operation({
  oas,
  config,
  path,
  method,
  defaultValues,
  onSubmit,
  buttonText,
}: {
  oas: BundledOpenApiSpec;
  config: TryitConfig;
  path: string;
  method: HttpMethod;
  defaultValues: Record<string, any>;
  onSubmit: (data: Record<string, any>) => void;
  buttonText: string;
}) {
  const parameters = getParameters(oas, path, method);
  const operation = getOperation(oas, path, method);
  const security = getSecurity(oas, path, method);

  const requestBody = deref<OasRequestBody>(oas, operation?.requestBody);

  const methods = useForm({
    reValidateMode: "onChange",
    defaultValues,
  });

  const { handleSubmit, reset, formState } = methods;

  useEffect(() => {
    reset(defaultValues);
  }, [defaultValues]);

  const hasErrors = Object.keys(formState.errors || {}).length > 0;

  return (
    <Container>
      <FormProvider {...methods}>
        <Form>
          <OperationHeader
            method={method}
            path={path}
            onSubmit={handleSubmit(onSubmit)}
            buttonText={buttonText}
            submitDisabled={formState.isSubmitSuccessful || hasErrors}
          />
          <Servers servers={oas?.servers || []} />
          <OperationTabs
            oas={oas}
            config={config}
            requestBody={requestBody}
            parameters={parameters}
            security={security}
          />
        </Form>
      </FormProvider>
    </Container>
  );
}

const Container = styled.div``;
