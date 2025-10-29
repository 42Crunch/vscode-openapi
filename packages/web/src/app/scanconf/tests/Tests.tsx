import { Playbook } from "@xliic/scanconf";
import { SearchSidebarControlled } from "../../../components/layout/SearchSidebar";
import { selectTest } from "../slice";
import { useAppDispatch, useAppSelector } from "../store";
import { Menu, MenuItem } from "../../../new-components/Menu";
import Test from "./Test";
import Overview from "./Overview";

import { TrashCan } from "../../../icons";
import Button from "../../../new-components/Button";

export default function AuthorizationTests() {
  const dispatch = useAppDispatch();

  const { selectedTest, identityTestsConfiguration: config } = useAppSelector(
    (state) => state.scanconf
  );

  const errors = Object.keys(config)
    .map((key) => {
      console.log("checking", key, config[key]);
      if (Object.keys(config[key].failures).some((k) => config[key].failures[k].length > 0)) {
        return [key, `${key} has failures`];
      }
    })
    .filter((e) => e !== undefined);

  const sections = [
    {
      id: "identityTests",
      title: "Identity Tests",
      items: [
        {
          id: "basic",
          label: "HTTP Basic Tests",
        },
        {
          id: "api-key",
          label: "API Key Tests",
        },
      ],
    },
  ];

  // return <Overview />;

  return (
    <SearchSidebarControlled
      title="test suites"
      sections={sections}
      errors={Object.fromEntries(errors)}
      render={(selected) => <Test suite={config[selected.itemId]} suiteId={selected.itemId} />}
      // renderEmpty={Overview}
      noSectionTitles
      onSelected={(selected) => {
        dispatch(selectTest({ id: selected.itemId }));
      }}
      selected={
        selectedTest !== undefined
          ? { sectionId: "identityTests", itemId: selectedTest }
          : undefined
      }
      renderButtons={() => (
        <Button
          style={{ width: "100%" }}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
        >
          Run all tests
        </Button>
      )}
    />
  );
}
