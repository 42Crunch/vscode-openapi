import Card from "react-bootstrap/Card";
import ListGroup from "react-bootstrap/ListGroup";

export function HappyPath({ happyPath }: { happyPath: any }) {
  return (
    <Card style={{ margin: "1em" }}>
      <Card.Body>
        <Card.Title>Happy Path request</Card.Title>
      </Card.Body>
      <ListGroup variant="flush">
        <ListGroup.Item>
          <div>
            <code style={{ lineBreak: "anywhere", whiteSpace: "pre-line" }}>{happyPath.curl}</code>
          </div>
        </ListGroup.Item>
        <ListGroup.Item>
          <div>
            <code style={{ lineBreak: "anywhere", whiteSpace: "pre-line" }}>
              {atob(happyPath.responseHttp)}
            </code>
          </div>
        </ListGroup.Item>
      </ListGroup>
    </Card>
  );
}

export default HappyPath;
