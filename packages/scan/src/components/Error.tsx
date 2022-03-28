import styled from "styled-components";
import Button from "react-bootstrap/Button";

import { useAppDispatch, useAppSelector } from "../store/hooks";
import { goBack } from "../store/oasSlice";

export default function Error() {
  const dispatch = useAppDispatch();
  const error = useAppSelector((state) => state.oas.error!);

  return (
    <Container>
      <p>
        <code>{error.message}</code>
      </p>
      <Button variant="primary" onClick={() => dispatch(goBack())}>
        Back
      </Button>
    </Container>
  );
}

const Container = styled.div``;
