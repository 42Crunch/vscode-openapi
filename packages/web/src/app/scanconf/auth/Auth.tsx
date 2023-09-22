import styled from "styled-components";
import * as playbook from "@xliic/common/playbook";
import { useAppSelector, useAppDispatch } from "../store";
import { addCredential, saveCredential, saveScanconf } from "./slice";
import CredentialCard from "./CredentialCard";
import CredentialAddNewDialog from "./CredentialAddNewDialog";
import Button from "../../../components/Button";
import { SearchSidebarControlled } from "../../../components/layout/SearchSidebar";
import { useState } from "react";

export default function Auth() {
  const dispatch = useAppDispatch();

  const {
    playbook: { authenticationDetails },
  } = useAppSelector((state) => state.scanconf);

  const onAddCredential = (id: string, credential: playbook.Credential) =>
    dispatch(addCredential({ id, credential }));

  const onUpdateCredential = (group: string, id: string, credential: playbook.Credential) =>
    dispatch(saveCredential({ group: parseInt(group), id, credential }));

  const sections = authenticationDetails.map((details, index) => {
    const methods = Object.entries(details).map(([id, credential]) => ({ id, label: id }));
    const title = index === 0 ? "Default credential group" : `Credential group ${index}`;
    return {
      id: `${index}`,
      title,
      items: methods,
    };
  });

  const [selected, setSelected] = useState({
    sectionId: sections[0].id,
    itemId: sections[0].items[0].id,
  });

  return (
    <SearchSidebarControlled
      selected={selected}
      sections={sections}
      onSelected={setSelected}
      render={(selected) => {
        if (selected !== undefined) {
          const credential = authenticationDetails[parseInt(selected.sectionId)][selected.itemId];
          return (
            <CredentialCard
              credentialName={selected.itemId}
              credential={credential}
              saveCredential={(credential) =>
                onUpdateCredential(selected.sectionId, selected.itemId, credential)
              }
              key={selected.itemId}
            />
          );
        }
      }}
      renderButtons={() => <CredentialAddNewDialog onAddCredential={onAddCredential} />}
    />
  );
}
