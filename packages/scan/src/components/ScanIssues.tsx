import Card from "react-bootstrap/Card";
import Badge from "react-bootstrap/Badge";
import ListGroup from "react-bootstrap/ListGroup";
import { ExclamationCircle, Check } from "@xliic/web-icons";

function ScanIssues({ issues, error }: { issues: any; error: any }) {
  const sorted = issues
    ? [...issues].sort((a: any, b: any) => (a.status === "unexpected" ? -1 : 1))
    : [];

  return (
    <>
      {issues && sorted.map((issue: any, index: number) => <ScanIssue issue={issue} key={index} />)}
      {issues === undefined && <p>scan failed: {error}</p>}
    </>
  );
}

function ScanIssue({ issue }: { issue: any }) {
  return (
    <Card style={{ margin: "1em" }}>
      <Card.Body>
        <Card.Title>
          {issue.status === "unexpected" ? "Unexpected response " : "Expected response "}
          {issue.responseHttpStatusCode}
          {": "} {issue.injectionDescription}{" "}
          {issue.status === "unexpected" && (
            <Badge bg="warning">
              <ExclamationCircle />
            </Badge>
          )}
        </Card.Title>
      </Card.Body>
      <ListGroup variant="flush">
        <ListGroup.Item>
          <div>
            <code style={{ lineBreak: "anywhere", whiteSpace: "pre-line" }}>{issue.curl}</code>
          </div>
        </ListGroup.Item>
        <ListGroup.Item>
          <div>
            <code style={{ lineBreak: "anywhere", whiteSpace: "pre-line" }}>
              {atob(issue.responseHttp)}
            </code>
          </div>
        </ListGroup.Item>
      </ListGroup>
    </Card>
  );
}

export default ScanIssues;
