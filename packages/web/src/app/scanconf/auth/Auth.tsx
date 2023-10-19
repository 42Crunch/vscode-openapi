import * as playbook from "@xliic/common/playbook";
import { ThemeColorVariables } from "@xliic/common/theme";
import { useState } from "react";
import styled from "styled-components";
import { SearchSidebarControlled } from "../../../components/layout/SearchSidebar";
import CollapsibleSection from "../components/CollapsibleSection";
import { addCredential, saveCredential, selectCredential, selectSubcredential } from "../slice";
import { useAppDispatch, useAppSelector } from "../store";
import CredentialAddNewDialog from "./CredentialAddNewDialog";
import CredentialCard from "./CredentialCard";
import CredentialMethods from "./CredentialMethods";

export default function Auth() {
  const dispatch = useAppDispatch();

  const {
    playbook: { authenticationDetails },
    selectedCredentialGroup,
    selectedCredential,
  } = useAppSelector((state) => state.scanconf);

  const sections = authenticationDetails.map((credentials, index) => {
    const items = Object.entries(credentials).map(([id, credential]) => ({ id, label: id }));
    const title = index === 0 ? "Default credential group" : `Credential group ${index}`;
    return {
      id: `${index}`,
      title,
      items,
    };
  });

  const [isCredentialsOpen, setCredenialsOpen] = useState(true);
  const [isRequestsOpen, setRequestsOpen] = useState(true);

  const onAddCredential = (id: string, credential: playbook.Credential) => {
    // no way to select credentialGroup for now
    dispatch(addCredential({ credentialGroup: 0, id, credential }));
    dispatch(selectCredential({ group: 0, credential: id }));
  };

  const onUpdateCredential = (group: string, id: string, credential: playbook.Credential) =>
    dispatch(saveCredential({ group: parseInt(group), id, credential }));

  return (
    <SearchSidebarControlled
      selected={
        selectedCredential !== undefined
          ? { sectionId: `${selectedCredentialGroup}`, itemId: selectedCredential }
          : undefined
      }
      sections={sections}
      onSelected={(selected) => {
        dispatch(
          selectCredential({ group: parseInt(selected.sectionId), credential: selected.itemId })
        );
      }}
      render={(selected) => {
        if (selected !== undefined) {
          const group = parseInt(selected.sectionId);
          const credentialId = selected.itemId;
          const credential = authenticationDetails[group][credentialId];
          return (
            <>
              {/* <Try>
                <Action
                  onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    //onRun(server, inputEnv);
                  }}
                >
                  <FileExport />
                  Try
                </Action>
              </Try> */}
              <CollapsibleSection
                isOpen={isCredentialsOpen}
                onClick={(e) => setCredenialsOpen(!isCredentialsOpen)}
                title="Credential"
              >
                <CredentialCard
                  credentialName={selected.itemId}
                  credential={credential}
                  saveCredential={(credential) =>
                    onUpdateCredential(selected.sectionId, selected.itemId, credential)
                  }
                  key={selected.itemId}
                />
              </CollapsibleSection>
              <CollapsibleSection
                isOpen={isRequestsOpen}
                onClick={(e) => setRequestsOpen(!isRequestsOpen)}
                title="Requests"
              >
                <CredentialMethods
                  group={group}
                  credentialId={credentialId}
                  credential={credential}
                />
              </CollapsibleSection>
            </>
          );
        }
      }}
      renderButtons={() => <CredentialAddNewDialog onAddCredential={onAddCredential} />}
    />
  );
}

const Try = styled.div`
  border: 1px solid var(${ThemeColorVariables.border});
  display: flex;
  justify-content: flex-end;
`;

const Action = styled.div`
  display: flex;
  padding: 8px 12px;
  gap: 4px;
  cursor: pointer;
  align-items: center;
  cusror: pointer;
  color: var(${ThemeColorVariables.linkForeground});
  > svg {
    fill: var(${ThemeColorVariables.linkForeground});
  }
`;
