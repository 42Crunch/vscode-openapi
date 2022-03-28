import styled from "styled-components";
import Button from "react-bootstrap/Button";

import { useAppDispatch, useAppSelector } from "../store/hooks";
import { goBack } from "../store/oasSlice";
import { HttpResponse } from "@xliic/common/http";

export default function Response() {
  const dispatch = useAppDispatch();

  const response = useAppSelector((state) => state.oas.response!);

  return (
    <Container>
      <p>
        <code>
          HTTP {response.httpVersion} {response.statusCode} {response.statusMessage}
        </code>
      </p>
      <p>
        <Headers headers={response.headers} />
      </p>
      <p>
        <code style={{ whiteSpace: "pre-wrap" }}>
          {JSON.stringify(JSON.parse(response.body!), null, 2)}
        </code>
      </p>
      <Button variant="primary" onClick={() => dispatch(goBack())}>
        Back
      </Button>
    </Container>
  );
}

function Headers({ headers }: { headers: HttpResponse["headers"] }) {
  return (
    <>
      {headers.map(([name, value], index) => (
        <div key={index}>
          <code>{name}:</code> <code>{value}</code>
        </div>
      ))}
    </>
  );
}

const Container = styled.div``;
