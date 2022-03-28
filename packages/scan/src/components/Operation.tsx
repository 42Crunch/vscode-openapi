import styled from "styled-components";
import Button from "react-bootstrap/Button";
import Form from "react-bootstrap/Form";
import Badge from "react-bootstrap/Badge";
import { useEffect } from "react";
import { useForm, FormProvider } from "react-hook-form";

import Parameters from "./Parameters";
import Servers from "./Servers";
import RequestBody from "./RequestBody";

import { HttpMethod } from "@xliic/common/http";
import { BundledOpenApiSpec, getOperation, OasRequestBody } from "@xliic/common/oas30";
import { deref } from "@xliic/common/jsonpointer";
import { getParameters } from "../util";

function Operation({
  oas,
  path,
  method,
  defaultValues,
  onSubmit,
  buttonText,
}: {
  oas: BundledOpenApiSpec;
  path: string;
  method: HttpMethod;
  defaultValues: Record<string, any>;
  onSubmit: (data: Record<string, any>) => void;
  buttonText: string;
}) {
  const parameters = getParameters(oas, path, method);
  const operation = getOperation(oas, path, method);
  const requestBody = deref<OasRequestBody>(oas, operation?.requestBody);

  const methods = useForm({
    mode: "onBlur",
    defaultValues,
  });

  const { handleSubmit, reset } = methods;

  useEffect(() => {
    reset(defaultValues);
  }, [defaultValues]);

  return (
    <Container>
      <FormProvider {...methods}>
        <Form>
          <h5 className="m-2">
            <Badge>{method.toUpperCase()}</Badge>
            <code> {path}</code>
          </h5>
          <Servers name="server" servers={oas?.servers} />
          <Parameters oas={oas} parameters={parameters} />
          <RequestBody oas={oas} requestBody={requestBody} />
          <Button variant="primary" className="m-1" onClick={handleSubmit(onSubmit)}>
            {buttonText}
          </Button>
        </Form>
      </FormProvider>
    </Container>
  );
}

const Container = styled.div``;

export default Operation;
