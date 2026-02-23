import { useFieldArray } from "react-hook-form";
import styled from "styled-components";
import { ThemeColorVariables } from "@xliic/common/theme";
import ParameterRow from "./ParameterRow";

export default function ParameterGroup({ name }: { name: string }) {
  const { fields, append, remove } = useFieldArray({
    name: name,
  });

  return (
    <Container>
      <Header>
        <div>Name</div>
        <div>Value</div>
        <div></div>
      </Header>
      <Body>
        {fields.map((field: any, index) => {
          return <ParameterRow name={field.key} key={field.id} value={field.value} />;
        })}
      </Body>
    </Container>
  );
}

const Container = styled.div`
  padding: 8px;
  display: grid;
  row-gap: 4px;
  grid-template-columns: 1fr 2fr 1em;
`;

const Header = styled.div`
  display: contents;
  & > div {
    padding: 4px 8px;
    background-color: var(${ThemeColorVariables.computedOne});
    text-transform: uppercase;
    font-size: 90%;
    font-weight: 600;
  }
`;

const Body = styled.div`
  display: contents;
  & > div > div {
    padding: 4px 8px;
    border-bottom: 1px solid var(${ThemeColorVariables.border});
  }
  & > div > div:last-child {
    padding: 2px 5px;
  }
  // for now keep with of a new entry selector to 1 column
  // & > div:last-child {
  //   grid-column: span 3;
  // }
`;
