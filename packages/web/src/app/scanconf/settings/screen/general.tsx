import * as z from "zod";

import Input from "../../../../new-components/fat-fields/Input";
import Select from "../../../../new-components/fat-fields/Select";
import { Container, Title } from "../layout";
import { schema } from "../schema";

function General() {
  return (
    <>
      <Title>General settings</Title>
      <Container>
        <Input
          name="requestFlowrate"
          label="Flow rate"
          description="How long the scan waits (in milliseconds) before it sends the next request to the API. This setting defines the constant flow rate that the scan uses."
        />

        <Input
          name="requestTimeout"
          label="Timeout"
          description="The maximum time (in seconds) that the scan waits for a response from the API. We do not recommend setting the timeout value to 0, because this switches the timeout off completely. This means that if something goes wrong, the scan might run indefinitely."
        />

        <Select
          name="requestTlsInsecureSkipVerify"
          label="Skip TLS verification"
          options={[
            { value: true, label: "true" },
            { value: false, label: "false" },
          ]}
        />

        <Select
          name="responseFollowRedirection"
          label="Follow redirects"
          description="Define if the scan follows redirects (HTTP 3XX) it receives as responses to the tests requests"
          options={[
            { value: true, label: "true" },
            { value: false, label: "false" },
          ]}
        />

        <Input
          name="maxScanDuration"
          label="Maximum scan duration"
          description="How long the scan runs in total (in seconds) before it stops, even if the whole API was not yet scanned. This limit ensures that the scan process will not run indefinitely even if there was an unexpected error causing a loop in the process."
        />

        <Input
          name="reportMaxSize"
          label="Max scan report size"
          description="The maximum scan report size (in bytes). The scan stops when the size limit is reached."
        />

        <Input
          name="reportMaxIssues"
          label="Max reported issues"
          description="The maximum number of problems that Conformance Scan can uncover and include in the scan report before it must stop. This setting helps to control the report size: you can iterate on scanning your API, and as you fix the problems found in previous scans, the scan keeps including subsequently discovered problems."
        />

        <Input
          name="responseMaxBodySizeScan"
          label="Max size for a response body"
          description="The maximum body size (in bytes) that Conformance Scan consumes from an API response, to avoid massive memory consumption."
        />

        <Input
          name="reportMaxHttpResponseSizeHappyPath"
          label="Max stored happy path response size"
          description="The maximum size (in bytes) of the HTTP responses received for a happy path request that is included in the scan report."
        />

        <Input
          name="reportMaxBodySizeHappyPath"
          label="Max stored response body size for happy path requests"
          description="The maximum response body size (in bytes) that the scan includes in the scan report for a happy path request."
        />

        <Input
          name="reportMaxBodySizeTest"
          label="Max stored response body size for test requests"
          description="The maximum response body size (in bytes) that the scan includes in the scan report for a test request."
        />

        <Input
          name="reportMaxHttpResponseSizeTest"
          label="Max stored response size for test requests"
          description="The maximum size (in bytes) of the HTTP responses received for a test request that is included in the scan report."
        />
      </Container>
    </>
  );
}

const screen: {
  id: string;
  label: string;
  schema: z.ZodObject<any>;
  form: React.FC;
} = {
  id: "general",
  label: "General settings",
  schema,
  form: General,
};

export default screen;
