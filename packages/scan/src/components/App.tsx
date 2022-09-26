import styled from "styled-components";
import { useAppSelector } from "../store/hooks";
import ThemeStyles from "@xliic/web-theme/ThemeStyles";
import Response from "./response/Response";
import Error from "./Error";
import ScanOperation from "./ScanOperation";
import TryOperation from "./TryOperation";
import ScanReport from "./ScanReport";
import Env from "../features/env/Env";
import ScanResponse from "../features/scan/Response";

import { PageName } from "../features/router/slice";

const routes: Record<PageName, JSX.Element> = {
  scanOperation: <ScanOperation />,
  tryOperation: <TryOperation />,
  scanReport: <ScanReport />,
  scanResponse: <ScanResponse />,
  response: <Response />,
  error: <Error />,
  env: <Env />,
  loading: <div>Loading...</div>,
};

function App() {
  const theme = useAppSelector((state) => state.theme);
  const { page } = useAppSelector((state) => state.route);

  return (
    <>
      <ThemeStyles theme={theme} />
      <Container>{routes[page]}</Container>
    </>
  );
}

const Container = styled.div``;

export default App;
