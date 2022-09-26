import styled from "styled-components";

import { useForm, useFieldArray, FormProvider } from "react-hook-form";
import Form from "react-bootstrap/Form";
import Button from "react-bootstrap/Button";

import { EnvData, Environment } from "@xliic/common/messages/env";
import { Trash } from "@xliic/web-icons";

import { useAppDispatch } from "../../store/hooks";
import { saveEnv } from "./slice";
import EnvKeyValue from "./EnvKeyValue";
import AddNewRow from "./AddNewRow";
import { useEffect } from "react";

export default function EnvironmentForm({
  name,
  data,
}: {
  name: keyof EnvData;
  data: Environment;
}) {
  const dispatch = useAppDispatch();

  const defaultValues = wrapEnvironment(data);

  const methods = useForm({
    defaultValues,
  });

  const {
    handleSubmit,
    formState: { isDirty },
    control,
    reset,
  } = methods;

  useEffect(() => {
    // reset the form, disabling submit button as a side effect
    // if name, data changes typically after Save button was clicked
    if (isDirty) {
      reset(wrapEnvironment(data));
    }
  }, [name, data]);

  function onSubmit(data: { values: Item[] }) {
    const environment = unwrapEnvironment(data);
    dispatch(saveEnv({ name, environment }));
  }

  const { fields, append, remove } = useFieldArray({
    control,
    name: "values",
  });

  return (
    <FormProvider {...methods}>
      <Form>
        {fields.map((field, index) => (
          <Value key={field.id}>
            <EnvKeyValue name={`values.${index}`} />
            <Delete onClick={() => remove(index)}>
              <Trash />
            </Delete>
          </Value>
        ))}
        <Value>
          <AddNewRow append={append} />
          <Delete></Delete>
        </Value>
      </Form>
      <div className="m-3">
        <Button onClick={handleSubmit(onSubmit)} disabled={!isDirty}>
          Save
        </Button>
      </div>
    </FormProvider>
  );
}

const Value = styled.div`
  display: flex;
  align-items: center;
  > div:first-child {
    flex: 1;
  }
`;

const Delete = styled.div`
  width: 1.5em;
  cursor: pointer;
  display: flex;
  justify-content: flex-start;
`;

interface Item {
  key: string;
  value: string;
}

function wrapEnvironment(environment: Environment): { values: Item[] } {
  const wrapped = Object.entries(environment).map(([key, value]) => ({ key, value }));
  return { values: wrapped };
}

function unwrapEnvironment(data: { values: Item[] }): Environment {
  const environment: Environment = {};
  for (const item of data.values) {
    environment[item.key] = item.value;
  }
  return environment;
}
