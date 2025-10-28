import { Playbook } from "@xliic/scanconf";
import { SearchSidebarControlled } from "../../../components/layout/SearchSidebar";
import { selectTest } from "../slice";
import { useAppDispatch, useAppSelector } from "../store";
import { Menu, MenuItem } from "../../../new-components/Menu";
import Test from "./Test";
import Overview from "./Overview";

import { TrashCan } from "../../../icons";

export default function AuthorizationTests() {
  const dispatch = useAppDispatch();

  const {
    playbook: { authenticationDetails },
    selectedTest,
  } = useAppSelector((state) => state.scanconf);

  const sections = [
    {
      id: "identityTests",
      title: "Identity Tests",
      items: [
        {
          id: "httpBasicTests",
          label: "HTTP Basic Tests",
        },
      ],
    },
  ];

  return <Overview />;

  // return (
  //   <SearchSidebarControlled
  //     title="tests"
  //     sections={sections}
  //     //render={(selected) => <Test selected={selected} credentials={authenticationDetails[0]} />}
  //     render={Overview}
  //     renderEmpty={Overview}
  //     onSelected={(selected) => {
  //       dispatch(selectTest({ id: selected.itemId }));
  //     }}
  //     selected={
  //       selectedTest !== undefined
  //         ? { sectionId: "identityTests", itemId: selectedTest }
  //         : undefined
  //     }
  //   />
  // );
}
