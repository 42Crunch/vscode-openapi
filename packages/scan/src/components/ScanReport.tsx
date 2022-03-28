import styled from "styled-components";
import Button from "react-bootstrap/Button";

import { useAppDispatch, useAppSelector } from "../store/hooks";
import { goBack } from "../store/oasSlice";
import ScanIssues from "./ScanIssues";
import HappyPath from "./HappyPath";

export default function ScanReport() {
  const dispatch = useAppDispatch();
  const { scanReport, path, method } = useAppSelector((state) => state.oas);
  const happyPath = scanReport.paths?.[path!]?.[method!]?.["happyPaths"]?.[0];
  const issues = scanReport.paths?.[path!]?.[method!]?.["issues"];
  const error = scanReport?.paths?.[path!]?.[method!]?.happyPaths[0]?.endStateError;

  return (
    <Container>
      <HappyPath happyPath={happyPath} />
      <ScanIssues issues={issues} error={error} />
      <Button variant="primary" onClick={() => dispatch(goBack())}>
        Back
      </Button>
    </Container>
  );
}

const Container = styled.div``;
