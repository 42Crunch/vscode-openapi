import styled from "styled-components";

import { CaptureItem, Status } from "@xliic/common/capture";
import { ThemeColorVariables } from "@xliic/common/theme";

import { FileImport } from "../../icons";
import { SearchSidebarControlled } from "../../components/layout/SearchSidebar";
import {
  CircleCheckLight,
  CircleDashedLight,
  CircleExclamationLight,
  CircleNotchLight,
  TrashCan,
} from "../../icons";
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
        icon: makeIcon(item.status),
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
      noControls
      noSectionTitles
      hideEmptySidebar
      sections={sections}
      render={() => <CaptureJob />}
      renderEmpty={() => <Start />}
      renderButtons={() => (
        <div>
          <Action
            onClick={(e) => {
              dispatch(selectFiles({ id: undefined }));
              e.stopPropagation();
              e.preventDefault();
            }}
          >
            <FileImport />
            New API Contract
          </Action>
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

function makeIcon(status: Status): JSX.Element {
  switch (status) {
    case "pending":
      return <CircleDashedLight />;
    case "running":
      return <CircleNotchLight className="spinning" />;
    case "finished":
      return <CircleCheckLight />;
    case "failed":
      return <CircleExclamationLight />;
  }
}

const Action = styled.div<{ $disabled?: boolean }>`
  display: flex;
  padding: 0;
  gap: 4px;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: var(
    ${({ $disabled }) =>
      $disabled ? ThemeColorVariables.disabledForeground : ThemeColorVariables.linkForeground}
  );
  > svg {
    fill: var(
      ${({ $disabled }) =>
        $disabled ? ThemeColorVariables.disabledForeground : ThemeColorVariables.linkForeground}
    );
  }
`;
