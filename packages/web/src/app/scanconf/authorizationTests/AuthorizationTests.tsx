import { Playbook } from "@xliic/scanconf";
import { SearchSidebarControlled } from "../../../components/layout/SearchSidebar";
import { addAuthorizationTest, removeAuthorizationTest, selectAuthorizationTest } from "../slice";
import { useAppDispatch, useAppSelector } from "../store";
import { Menu, MenuItem } from "../../../new-components/Menu";
import Test from "./Test";
import NewAuthorizationTestDialog from "./NewAuthorizationTestDialog";
import { TrashCan } from "../../../icons";

export default function AuthorizationTests() {
  const dispatch = useAppDispatch();

  const {
    playbook: { authorizationTests, authenticationDetails },
    selectedAuthorizationTest,
  } = useAppSelector((state) => state.scanconf);

  const onAddAuthorizationTest = (id: string, test: Playbook.AuthenticationSwappingTest) => {
    dispatch(addAuthorizationTest({ id, test }));
    dispatch(selectAuthorizationTest({ id }));
  };

  const items = Object.keys(authorizationTests).map((id) => ({
    id,
    label: id,
    menu: (
      <Menu>
        <MenuItem
          onClick={(e) => e.stopPropagation()}
          onSelect={() => dispatch(removeAuthorizationTest({ id }))}
        >
          <TrashCan />
          Delete
        </MenuItem>
      </Menu>
    ),
  }));

  const sections = [
    {
      id: "authorizationTests",
      title: "Authorization Tests",
      items,
    },
  ];

  return (
    <SearchSidebarControlled
      title="tests"
      sections={sections}
      render={(selected) =>
        selected === undefined ? null : (
          <Test selected={selected} credentials={authenticationDetails[0]} />
        )
      }
      renderButtons={() => (
        <NewAuthorizationTestDialog
          credentials={authenticationDetails[0]}
          existing={Object.keys(authorizationTests)}
          onAddTest={onAddAuthorizationTest}
        />
      )}
      selected={
        selectedAuthorizationTest !== undefined
          ? { sectionId: "authorizationTests", itemId: selectedAuthorizationTest }
          : undefined
      }
      onSelected={(selected) => {
        dispatch(selectAuthorizationTest({ id: selected.itemId }));
      }}
    />
  );
}
