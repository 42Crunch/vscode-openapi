import { SearchSidebarControlled } from "../../../components/layout/SearchSidebar";
import { useAppDispatch, useAppSelector } from "../store";
import Test from "./Test";

import { setTestSuiteId } from "./slice";

import Button from "../../../new-components/Button";

export default function AuthorizationTests() {
  const dispatch = useAppDispatch();

  const { config, suiteId } = useAppSelector((state) => state.tests);

  const errors = Object.keys(config)
    .map((key) => {
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

  return (
    <SearchSidebarControlled
      title="test suites"
      sections={sections}
      errors={Object.fromEntries(errors)}
      render={(selected) => <Test suite={config[selected.itemId]} suiteId={selected.itemId} />}
      onSelected={(selected) => {
        dispatch(setTestSuiteId(selected.itemId));
      }}
      selected={suiteId !== undefined ? { sectionId: "identityTests", itemId: suiteId } : undefined}
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
