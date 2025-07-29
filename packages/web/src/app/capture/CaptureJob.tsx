import * as z from "zod";
import styled from "styled-components";

import { PrepareOptions } from "@xliic/common/capture";
import { ProgressButton } from "../../new-components/ProgressButton";

import Input from "../../components/Input";
import Form from "../../new-components/Form";
import Separator from "../../components/Separator";
import { setPrepareOptions, convert, deleteJob } from "./slice";
import { useAppDispatch, useAppSelector } from "./store";
import { useFormContext } from "react-hook-form";
import Button from "../../new-components/Button";

export default function CaptureJob() {
  const dispatch = useAppDispatch();

  // const {
  //   trigger,
  //   formState: { isValid },
  // } = useFormContext();

  const { selectedItem: item } = useAppSelector((state) => state.capture);

  if (!item) {
    return <div>No job selected</div>;
  }

  return (
    <div>
      <div>Selected files</div>
      <div>
        {item.files && (
          <div>
            {item.files.map((file, index) => (
              <span key={`item-${item.id}-file-${index}`}>{file}</span>
            ))}
          </div>
        )}
      </div>

      <ProgressButton
        label="Convert"
        waiting={item.progressStatus === "In progress"}
        onClick={(e) => {
          //if (isValid) {
          dispatch(convert({ id: item.id, files: item.files, options: item.prepareOptions }));
          //} else {
          //  trigger();
          //}
          e.preventDefault();
          e.stopPropagation();
        }}
      />

      <Button
        onClick={(e) => {
          dispatch(deleteJob({ id: item.id, quickgenId: item.quickgenId! }));
          e.preventDefault();
          e.stopPropagation();
        }}
      >
        Delete
      </Button>

      <BiggerSeparator title="Options" />
      <Form
        wrapFormData={wrapPrepareOptions}
        unwrapFormData={unwrapPrepareOptions}
        useFormMode={"onChange"}
        data={item.prepareOptions}
        schema={schema}
        saveData={(data) => {
          dispatch(setPrepareOptions({ id: item.id, ...data }));
        }}
      >
        <Input label="Base Path" name="basePath" />
        <Input label="Servers" name="servers" />
      </Form>

      <BiggerSeparator title="Logs" />

      {item.log.map((log, index) => (
        <div key={index}>
          <div>{log}</div>
        </div>
      ))}
    </div>
  );
}

function wrapPrepareOptions(env: PrepareOptions) {
  return { basePath: env.basePath, servers: env.servers.join(",") };
}

function unwrapPrepareOptions(data: any): PrepareOptions {
  return { basePath: data.basePath, servers: data.servers.split(",") };
}

const BiggerSeparator = styled(Separator)`
  pointer-events: none;
  > div {
    font-weight: 600;
    font-size: 12px;
    margin-bottom: 16px;
    margin-top: 16px;
  }
`;

const schema = z.object({
  basePath: z.string().min(1).trim(),
  servers: z
    .string()
    .min(1)
    .refine(
      (value) =>
        value
          .split(",")
          .map((e) => e.trim())
          .filter((e) => e.length > 0)
          .every((e) => e.startsWith("http://") || e.startsWith("https://")),
      {
        message: "Invalid format. Examples: 'https://foo.com, http://bar.org'",
      }
    ),
});
