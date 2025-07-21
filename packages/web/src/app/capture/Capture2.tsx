import { SearchSidebarControlled } from "../../components/layout/SearchSidebar";
import { TrashCan } from "../../icons";
import Button from "../../new-components/Button";
import { Menu, MenuItem } from "../../new-components/Menu";
import CaptureJob from "./CaptureJob";
import { browseFiles, deleteJob, setSelectedItemId } from "./slice";
import Start from "./Start";
import { useAppDispatch, useAppSelector } from "./store";

export default function Capture2() {
  const dispatch = useAppDispatch();

  const { items, selectedItem } = useAppSelector((state) => state.capture);

  const onSetItemId = ({ sectionId, itemId }: { sectionId: string; itemId: string }) =>
    dispatch(setSelectedItemId(itemId));

  const sections = [
    {
      id: "capture",
      title: "Capture",
      items: items.map((item) => ({
        id: item.id,
        label: item.id,
        menu: (
          <Menu>
            <MenuItem
              onClick={(e) => e.stopPropagation()}
              disabled={item.progressStatus === "In progress"}
              onSelect={() => dispatch(deleteJob({ id: item.id, quickgenId: item.quickgenId! }))}
            >
              <TrashCan />
              Delete
            </MenuItem>
          </Menu>
        ),
      })),
    },
  ];

  return (
    <SearchSidebarControlled
      selected={selectedItem ? { sectionId: "capture", itemId: selectedItem.id } : undefined}
      onSelected={onSetItemId}
      title="operations"
      noSectionTitles
      hideEmptySidebar
      sections={sections}
      render={() => <CaptureJob />}
      renderEmpty={() => <Start />}
      renderButtons={() => (
        <div>
          <Button
            style={{ width: "100%" }}
            onClick={(e) => {
              dispatch(browseFiles({ id: "", options: undefined }));
            }}
          >
            Upload
          </Button>
        </div>
      )}
    />
  );
}
