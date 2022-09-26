import styled from "styled-components";
import Col from "react-bootstrap/Col";
import Form from "react-bootstrap/Form";
import Row from "react-bootstrap/Row";

export default function AddNewRow({ append }: { append: any }) {
  return (
    <Row className="m-1">
      <Col xs={4}>
        <Form.Control
          type="text"
          onChange={(e) => {
            append({ key: e.target.value, value: "" }, { shouldFocus: true });
          }}
          value={""}
        />
      </Col>
      <Col xs={8}>
        <Form.Control type="text" value={""} disabled />
      </Col>
    </Row>
  );
}
