import { useState } from "react";
import { SearchSidebarControlled } from "../../../components/layout/SearchSidebar";
import { useAppSelector } from "../store";
import Environment from "./Environment";

export default function Environments() {
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
      title="environments"
      noSectionTitles
      selected={environmentId ? { sectionId: "environment", itemId: environmentId } : undefined}
      sections={sections}
      onSelected={(selected) => setEnvironmentId(selected.itemId)}
      render={(selected) => <Environment key={selected.itemId} name={selected.itemId} />}
    />
  );
}
