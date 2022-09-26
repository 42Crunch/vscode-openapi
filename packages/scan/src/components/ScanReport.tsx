import styled from "styled-components";
import Navigation from "./Navigation";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import ScanIssues from "./ScanIssues";
import HappyPath from "./HappyPath";
import ScanSummary from "./ScanSummary";

export default function ScanReport() {
  const { scanReport, path, method } = useAppSelector((state) => state.scan);

  if (scanReport === undefined) {
    return (
      <Container>
        <Navigation
          tabs={[
            ["scanOperation", "Scan"],
            ["scanReport", "Report"],
            ["env", "Environment"],
          ]}
        />
        <Message>Report is not yet available</Message>
      </Container>
    );
  }

  const happyPath = processHappyPath(scanReport.paths?.[path!]?.[method!]?.["happyPaths"]?.[0]);

  const operations = Object.keys(scanReport.paths?.[path!] || {});

  const allIssues = [];

  for (const operation of operations) {
    const issues = scanReport.paths?.[path!]?.[operation]?.["conformanceRequestIssues"];
    if (issues) {
      const processed = issues.map(processIssue);
      allIssues.push(...processed);
    }
  }

  return (
    <Container>
      <Navigation
        tabs={[
          ["scanOperation", "Scan"],
          ["scanReport", "Report"],
          ["env", "Environment"],
        ]}
      />
      <ScanSummary summary={scanReport.summary} happyPathExpected={happyPath.expected} />
      <HappyPath happyPath={happyPath} />
      <ScanIssues issues={allIssues} error={null} />
    </Container>
  );
}

const Container = styled.div``;
const Message = styled.div`
  margin: 1em;
  padding: 10px;
`;

function processHappyPath(happyPath: any) {
  const status = happyPath?.outcome?.status;
  const expected = status === "expected";
  const curl = happyPath?.request?.curl;
  const code = happyPath?.response?.httpStatusCode;
  const responseDescription = happyPath?.outcome?.apiResponseAnalysis?.[0]?.responseDescription;
  const error = happyPath?.outcome?.error;
  return { status, expected, curl, code, responseDescription, error };
}

function processIssue(issue: any) {
  const status = issue?.outcome?.status;
  const curl = issue?.request?.curl;
  const description = issue?.test?.description;
  const responseDescription = issue?.outcome?.apiResponseAnalysis?.[0]?.responseDescription;
  const code = issue?.response?.httpStatusCode;

  return { status, curl, description, responseDescription, code };
}
