import styled from "styled-components";
import { TabContainer } from "../../new-components/Tabs";
import Environment from "./Environment";
import { useFeatureSelector } from "./slice";

export default function Env() {
  const { data, ready } = useFeatureSelector((state) => state.env);

  if (!ready) {
    return <Container>Loading environment data...</Container>;
  }

  return (
    <Container>
      <TabContainer
        tabs={[
          {
            id: "secrets",
            title: "Secrets",
            content: <Environment name="secrets" data={data.secrets} password />,
          },
          {
            id: "default",
            title: "Default",
            content: <Environment name="default" data={data.default} />,
          },
        ]}
      />
    </Container>
  );
}

const Container = styled.div`
  margin: 4px;
`;
