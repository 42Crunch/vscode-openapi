import { useEffect, useState } from "react";
import styled from "styled-components";
import { useAppSelector } from "../store/hooks";
import FormatCard from "./data-dictionary/FormatCard";
import Alert from "react-bootstrap/Alert";
import List from "@xliic/web-ui/List";
import ThemeStyles from "@xliic/web-theme/ThemeStyles";
import { ThemeColors } from "@xliic/common/theme";

function App() {
  const theme = useAppSelector((state) => state.theme);
  const formats = useAppSelector((state) => state.formats.formats);
  const dictionaries = useAppSelector((state) => state.formats.dictionaries);
  const [selected, setSelected] = useState(dictionaries?.[0]?.id);
  useEffect(() => {
    setSelected(dictionaries?.[0]?.id);
  }, [dictionaries]);

  if (selected === undefined) {
    return (
      <>
        <ThemeStyles theme={theme} />
        <Container>
          <Sidebar>
            <Header>Data Dictionaries</Header>
          </Sidebar>
          <Content>
            <Alert variant="secondary">No data dictionaries added yet</Alert>
          </Content>
        </Container>
      </>
    );
  }

  const cards = formats
    .filter((format) => format.dictionaryId === selected)
    .map((format) => <FormatCard format={format} key={`${format.dictionaryId}-${format.name}`} />);

  return (
    <>
      <ThemeStyles theme={theme} />
      <Container>
        <Sidebar>
          <Header>Data Dictionaries</Header>
          <List selected={selected} setSelected={setSelected} items={dictionaries} />
        </Sidebar>
        <Content>{cards}</Content>
      </Container>
    </>
  );
}

const Header = styled.h3`
  font-weight: 500;
  font-size: 24px;
  line-height: 33px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const Container = styled.div`
  display: flex;
  background-color: var(${ThemeColors.background});
  height: 100vh;
`;

const Sidebar = styled.div`
  padding: 8px 16px 20px;
  width: 400px;
  background-color: var(${ThemeColors.sidebarBackground});
`;

const Content = styled.div`
  width: 100%;
  height: 100vh;
  overflow-x: scroll;
`;

export default App;
