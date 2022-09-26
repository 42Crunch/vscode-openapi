import styled from "styled-components";
import { useFormContext, useController } from "react-hook-form";
import Form from "react-bootstrap/Form";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";

export default function EnvKeyValue({ name }: { name: string }) {
  const { control } = useFormContext();

  const { field: keyField } = useController({
    name: `${name}.key`,
    control,
  });

  const { field: valueField } = useController({
    name: `${name}.value`,
    control,
  });

  return (
    <Row className="m-1">
      <Col xs={4}>
        <Form.Control
          type="text"
          onBlur={keyField.onBlur}
          onChange={keyField.onChange}
          value={keyField.value}
          ref={keyField.ref}
        />
      </Col>
      <Col xs={8}>
        <Form.Control
          type="text"
          onBlur={valueField.onBlur}
          onChange={valueField.onChange}
          value={valueField.value}
          ref={valueField.ref}
        />
      </Col>
    </Row>
  );
}
