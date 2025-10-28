import styled from "styled-components";

import { Playbook } from "@xliic/scanconf";

import { ItemId } from "../../../components/layout/SearchSidebar";
import Form from "../../../new-components/Form";

import { saveAuthorizationTest } from "../slice";
import { useAppDispatch, useAppSelector } from "../store";

export default function Test({
  selected,
  credentials,
}: {
  selected: ItemId;
  credentials: Playbook.Credentials;
}) {
  const dispatch = useAppDispatch();

  const {
    playbook: { authorizationTests },
  } = useAppSelector((state) => state.scanconf);

  const onUpdateTest = (id: string, test: Playbook.AuthenticationSwappingTest) =>
    dispatch(saveAuthorizationTest({ id, test }));

  const authorizationTest = authorizationTests[selected.itemId];

  return <Container>harro</Container>;
}

const Container = styled.div`
  padding: 8px;
  gap: 8px;
  display: flex;
  flex-direction: column;
`;
