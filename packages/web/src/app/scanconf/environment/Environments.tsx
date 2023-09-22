import styled from "styled-components";
import { useAppSelector, useAppDispatch } from "../store";
import { SearchSidebarControlled } from "../../../components/layout/SearchSidebar";
import { useState } from "react";
import Environment from "./Environment";

export default function Environments() {
  const dispatch = useAppDispatch();

  // const operationId = useAppSelector((state) => state.operations.operationId);
  // const onSetOperationId = (operationId: string) => dispatch(setOperationId(operationId));
  const [environmentId, setEnvironmentId] = useState<string>("default");

  const {
    playbook: { environments },
  } = useAppSelector((state) => state.scanconf);

  const items = Object.keys(environments).map((id) => ({ id, label: id }));

  const sections = [
    {
      id: "environment",
      title: "Environment",
      items,
    },
  ];

  return (
    <SearchSidebarControlled
      noSectionTitles
      selected={environmentId ? { sectionId: "environment", itemId: environmentId } : undefined}
      sections={sections}
      onSelected={(selected) => setEnvironmentId(selected.itemId)}
      render={(selected) => {
        if (selected !== undefined)
          return <Environment key={selected.itemId} name={selected.itemId} />;
      }}
    />
  );
}

const Container = styled.div``;

const Controls = styled.div`
  display: flex;
  justify-content: flex-end;
  margin: 4px;
  gap: 4px;
`;
