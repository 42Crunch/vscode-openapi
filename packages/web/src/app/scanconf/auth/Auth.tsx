import styled from "styled-components";
import * as playbook from "@xliic/common/playbook";
import { useAppSelector, useAppDispatch } from "../store";
import { addCredential, saveCredential, saveScanconf } from "../slice";
import CredentialCard from "./CredentialCard";
import CredentialAddNewDialog from "./CredentialAddNewDialog";
import Button from "../../../components/Button";
import { SearchSidebarControlled } from "../../../components/layout/SearchSidebar";
import { useState } from "react";
import CollapsibleSection from "../components/CollapsibleSection";
import CredentialMethods from "./CredentialMethods";
import { ThemeColorVariables } from "@xliic/common/theme";
import { FileExport } from "../../../icons";

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

  const [isCredentialsOpen, setCredenialsOpen] = useState(true);
  const [isRequestsOpen, setRequestsOpen] = useState(true);

  return (
    <SearchSidebarControlled
      selected={selected}
      sections={sections}
      onSelected={setSelected}
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
