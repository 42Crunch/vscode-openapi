import { CaptureItem } from "@xliic/common/capture";
import { SearchSidebarControlled } from "../../components/layout/SearchSidebar";
import { TrashCan } from "../../icons";
import Button from "../../new-components/Button";
import { Menu, MenuItem } from "../../new-components/Menu";
import CaptureJob from "./CaptureJob";
import { selectFiles, deleteJob, setSelectedItemId } from "./slice";
import Start from "./Start";
import { useAppDispatch, useAppSelector } from "./store";

export default function Capture() {
  const dispatch = useAppDispatch();

  const { items, selectedId } = useAppSelector((state) => state.capture);

  const onSetItemId = ({ sectionId, itemId }: { sectionId: string; itemId: string }) =>
    dispatch(setSelectedItemId(itemId));

  const sections = [
    {
      id: "capture",
      title: "Capture",
      items: items.map((item) => ({
        id: item.id,
        label: makeLabel(item),
        menu: (
          <Menu>
            <MenuItem
              onClick={(e) => e.stopPropagation()}
              disabled={item.status === "running"}
              onSelect={() => dispatch(deleteJob({ id: item.id }))}
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
      selected={selectedId ? { sectionId: "capture", itemId: selectedId } : undefined}
      onSelected={onSetItemId}
      title="Quickgen sessions"
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
              dispatch(selectFiles({ id: undefined }));
            }}
          >
            New session
          </Button>
        </div>
      )}
    />
  );
}

function makeLabel(item: CaptureItem): string {
  if (!item.files || item.files.length === 0) {
    return "No files";
  }

  const firstFile = item.files[0];
  return item.files.length > 1
    ? `${getFilename(firstFile)}+(${item.files.length - 1})`
    : getFilename(firstFile);
}

function getFilename(url: string): string {
  return decodeURIComponent(url.substring(url.lastIndexOf("/") + 1));
}
