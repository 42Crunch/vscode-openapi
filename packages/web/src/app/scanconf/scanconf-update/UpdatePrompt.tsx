import styled from "styled-components";
import { ThemeColorVariables } from "@xliic/common/theme";

import { useAppDispatch, useAppSelector } from "../store";
import { updateScanconf } from "./slice";
import Button from "../../../new-components/Button";

export default function UpdatePrompt() {
  const dispatch = useAppDispatch();

  return (
    <Container>
      Changes found, update scanconf?
      <Button onClick={() => dispatch(updateScanconf())}>Update</Button>
    </Container>
  );
}

const Container = styled.div``;
