import { ThemeColorVariables } from "@xliic/common/theme";
import styled from "styled-components";
import Button from "../../new-components/Button";
import { ProgressButton } from "../../new-components/ProgressButton";
import { browseFile, convert } from "./slice";
import { useAppDispatch, useAppSelector } from "./store";

export function RootContainer() {
  const dispatch = useAppDispatch();
  const { file, chunkSize, counter } = useAppSelector((state) => state.bigfiles);
  return (
    <Container>
      <Header>
        <HeaderConter>Selected file: {file}</HeaderConter>
        <HeaderAction>
          <Button
            disabled={false}
            onClick={(e) => {
              dispatch(browseFile(undefined));
              e.preventDefault();
              e.stopPropagation();
            }}
          >
            Select File
          </Button>
        </HeaderAction>
      </Header>
      {file && (
        <>
          <HeaderConter>Counter: {counter}</HeaderConter>
          <HeaderConter>Chunk Size: {chunkSize}</HeaderConter>
          <BasicProgressButton
            label="Start File Sending"
            waiting={false}
            onClick={(e) => {
              dispatch(convert({ file }));
              e.preventDefault();
              e.stopPropagation();
            }}
          />
        </>
      )}
    </Container>
  );
}

const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 16px;
`;

const Header = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  background-color: var(${ThemeColorVariables.computedOne});
  border-color: var(${ThemeColorVariables.border});
  border-width: 1px;
  border-style: solid;
  border-radius: 3px;
`;

const HeaderConter = styled.div`
  display: flex;
  flex-direction: column;
  padding: 7px;
  padding-left: 16px;
  font-weight: bold;
`;

const HeaderAction = styled.div`
  display: flex;
  flex-direction: column;
  padding: 7px;
  padding-right: 16px;
  width: 120px;
`;

export const TopDescriptionLeft = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
`;

export const TopDescriptionRight = styled.div`
  padding-right: 3px;
`;

export const TopDescriptionAction = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
`;

export const TopDescriptionRemoverSpan = styled.span`
  font-weight: bold;
  cursor: pointer;
  // padding: 16px;
  > svg {
    fill: var(${ThemeColorVariables.foreground});
  }
`;

const BasicProgressButton = styled(ProgressButton)`
  height: 30px;
  width: 120px;
`;
