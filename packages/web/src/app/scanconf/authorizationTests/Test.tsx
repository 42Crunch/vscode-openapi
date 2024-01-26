import styled from "styled-components";

import * as playbook from "@xliic/common/playbook";

import { ItemId } from "../../../components/layout/SearchSidebar";
import Form from "../../../new-components/Form";

import { saveAuthorizationTest, saveCredential } from "../slice";
import { useAppDispatch, useAppSelector } from "../store";
import TestContents from "./TestContents";

export default function Test({
  selected,
  credentials,
}: {
  selected: ItemId;
  credentials: playbook.Credentials;
}) {
  const dispatch = useAppDispatch();

  const {
    playbook: { authorizationTests },
  } = useAppSelector((state) => state.scanconf);

  const onUpdateTest = (id: string, test: playbook.AuthenticationSwappingTest) =>
    dispatch(saveAuthorizationTest({ id, test }));

  const authorizationTest = authorizationTests[selected.itemId];

  return (
    <Container>
      <h4>{selected.itemId}</h4>

      <Form
        data={authorizationTest}
        wrapFormData={(x) => x}
        unwrapFormData={(x) => x as playbook.AuthenticationSwappingTest}
        saveData={(test) => onUpdateTest(selected.itemId, test)}
      >
        <TestContents credentials={credentials} />
      </Form>
    </Container>
  );
}

const Container = styled.div`
  padding: 8px;
  gap: 8px;
  display: flex;
  flex-direction: column;
`;
