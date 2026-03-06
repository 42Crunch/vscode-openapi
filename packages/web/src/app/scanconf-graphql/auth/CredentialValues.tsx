import * as Tabs from "@radix-ui/react-tabs";
import { useFieldArray } from "react-hook-form";
import styled from "styled-components";
import Input from "../../../components/Input";
import { TabContainer } from "../../../new-components/Tabs";
import * as actions from "../slice";
import { useAppDispatch, useAppSelector } from "../store";

export default function CredentialValues({
  group,
  credentialId,
}: {
  group: number;
  credentialId: string;
}) {
  const dispatch = useAppDispatch();

  const {
    playbook,
    graphQl: string,
    selectedSubcredential,
  } = useAppSelector((state) => state.scanconf);

  const { fields, append, remove } = useFieldArray({
    name: "methods",
  });

  const tabs = fields.map((method: any, index) => {
    return {
      id: method.key,
      title: method.key,
      content: (
        <Content value={method.key}>
          <Input
            label="Credential value"
            name={`methods.${index}.value.credential`}
            disabled={true}
          />
          <Requests></Requests>
        </Content>
      ),
    };
  });

  return (
    <TabContainer
      activeTab={selectedSubcredential}
      setActiveTab={(tab: string) => dispatch(actions.selectSubcredential(tab))}
      tabs={tabs}
    />
  );
}

const Content = styled(Tabs.Content)`
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding-top: 8px;
`;

const Requests = styled.div`
  padding-top: 8px;
  display: flex;
  flex-direction: column;
  gap: 8px;
`;
