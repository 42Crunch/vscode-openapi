import * as z from "zod";
import styled from "styled-components";

import { PrepareOptions } from "@xliic/common/capture";

import Input from "../../components/Input";
import Form from "../../new-components/Form";
import Separator from "../../components/Separator";
import { setPrepareOptions } from "./slice";
import { useAppDispatch, useAppSelector } from "./store";

export default function CaptureJob() {
  const dispatch = useAppDispatch();
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
      {item.log.map((log, index) => (
        <div key={index}>
          <div>{log}</div>
        </div>
      ))}
      <BiggerSeparator title="Logs" />
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
