import { SearchSidebarControlled } from "../../../components/layout/SearchSidebar";
import { useAppDispatch, useAppSelector } from "../store";
import Test from "./Test";

import { setTestSuiteId } from "./slice";

import Button from "../../../new-components/Button";
import { SuiteId } from "../../../core/playbook-tests";

export default function Tests() {
  const dispatch = useAppDispatch();

  const { config, suiteId } = useAppSelector((state) => state.tests);

  const errors = Object.keys(config)
    .map((key) => {
      const [tests, failures] = config[key as SuiteId];
      if (failures && Object.values(failures).some((f) => f.length > 0)) {
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
      ],
    },
    {
      id: "bolaAndBflaTests",
      title: "BOLA and BFLA Tests",
      items: [
        {
          id: "basicBola",
          label: "Basic BOLA",
        },
        {
          id: "basicSecurityRequirements",
          label: "Basic Security Requirements",
        },
      ],
    },
  ];

  return (
    <SearchSidebarControlled
      title="test suites"
      sections={sections}
      errors={Object.fromEntries(errors)}
      render={(selected) => (
        <Test suite={config[selected.itemId as SuiteId]} suiteId={selected.itemId} />
      )}
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
