import { FieldValues } from "react-hook-form";
import styled from "styled-components";

import { ThemeColorVariables } from "@xliic/common/theme";

import FormDialog from "../../../../new-components/FormDialog";
import { Plus } from "../../../../icons";
import DownshiftSelect from "../../../../new-components/fat-fields/DownshiftSelect";

export default function AddResponseDialog({
  add,
  responseCodes,
  existingCodes,
}: {
  add: any;
  responseCodes: string[];
  existingCodes: string[];
}) {
  const defaultValues = { code: "200" };

  const onSubmit = (values: FieldValues) => {
    add({
      key: values.code,
      value: {
        expectations: {
          httpStatus: convertToNumberOrString(values.code),
        },
        variableAssignments: [],
      },
    });
  };

  return (
    <FormDialog
      title="Add response processing"
      defaultValues={defaultValues}
      onSubmit={onSubmit}
      noOverflow
      trigger={
        <AddButton>
          <Plus />
        </AddButton>
      }
    >
      <ResponseForm responseCodes={responseCodes} existingCodes={existingCodes} />
    </FormDialog>
  );
}

function ResponseForm({
  responseCodes,
  existingCodes,
}: {
  responseCodes: string[];
  existingCodes: string[];
}) {
  return (
    <Container>
      <DownshiftSelect
        label="HTTP response code"
        placeholder=""
        name="code"
        options={getOptions(responseCodes, existingCodes)}
      />
    </Container>
  );
}

function getOptions(codes: string[], existing: string[]) {
  return codes
    .filter((code) => !existing.includes(code))
    .map((code) => ({ label: getLabel(code), value: code }));
}

function getLabel(code: string) {
  if (code in httpCodeLabels) {
    return (httpCodeLabels as any)[code];
  } else {
    return code;
  }
}

function convertToNumberOrString(input: string): number | string {
  if (/^\d+$/.test(input)) {
    return parseInt(input, 10);
  } else {
    return input;
  }
}

const httpCodeLabels = {
  default: "default",
  "1XX": "1XX",
  "100": "100 - Continue",
  "101": "101 - Switching Protocols",
  "2XX": "2XX",
  "200": "200 - OK",
  "201": "201 - Created",
  "202": "202 - Accepted",
  "203": "203 - Non-Authoritative Information",
  "204": "204 - No Content",
  "205": "205 - Reset Content",
  "206": "206 - Partial Content",
  "3XX": "3XX",
  "300": "300 - Multiple Choices",
  "301": "301 - Moved Permanently",
  "302": "302 - Found",
  "303": "303 - See Other",
  "304": "304 - Not Modified",
  "305": "305 - Use Proxy",
  "307": "307 - Temporary Redirect",
  "4XX": "4XX",
  "400": "400 - Bad Request",
  "401": "401 - Unauthorized",
  "402": "402 - Payment Required",
  "403": "403 - Forbidden",
  "404": "404 - Not Found",
  "405": "405 - Method Not Allowed",
  "406": "406 - Not Acceptable",
  "407": "407 - Proxy Authentication Required",
  "408": "408 - Request Timeout",
  "409": "409 - Conflict",
  "410": "410 - Gone",
  "411": "411 - Length Required",
  "412": "412 - Precondition Failed",
  "413": "413 - Payload Too Large",
  "414": "414 - URI Too Long",
  "415": "415 - Unsupported Media Type",
  "416": "416 - Range Not Satisfiable",
  "417": "417 - Expectation Failed",
  "426": "426 - Upgrade Required",
  "5XX": "5XX",
  "500": "500 - Internal Server Error",
  "501": "501 - Not Implemented",
  "502": "502 - Bad Gateway",
  "503": "503 - Service Unavailable",
  "504": "504 - Gateway Timeout",
  "505": "505 - HTTP Version Not Supported",
};

const Container = styled.div`
  > div > div {
    padding: 4px;
  }
`;

const AddButton = styled.button`
  border: none;
  background-color: transparent;
  cursor: pointer;
  > svg {
    fill: var(${ThemeColorVariables.linkForeground});
    &:hover {
      fill: var(${ThemeColorVariables.linkActiveForeground});
    }
  }
`;
