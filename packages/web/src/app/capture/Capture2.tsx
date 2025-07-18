import { SearchSidebarControlled } from "../../components/layout/SearchSidebar";
import Button from "../../new-components/Button";
import { setSelectedItemId } from "./slice";
import Start from "./Start";
import { useAppDispatch, useAppSelector } from "./store";

export default function Capture2() {
  const dispatch = useAppDispatch();

  const { items, selectedItemId } = useAppSelector((state) => state.capture);

  const onSetItemId = ({ sectionId, itemId }: { sectionId: string; itemId: string }) =>
    dispatch(setSelectedItemId(itemId));

  const sections = [
    {
      id: "capture",
      title: "Capture",
      items: items.map((item) => ({
        id: item.id,
        label: item.id,
      })),
    },
  ];

  return (
    <SearchSidebarControlled
      selected={selectedItemId ? { sectionId: "capture", itemId: selectedItemId } : undefined}
      onSelected={onSetItemId}
      title="operations"
      noSectionTitles
      hideEmptySidebar
      sections={sections}
      render={(selected) => <div>foo</div>}
      renderEmpty={() => <Start />}
      renderButtons={() => (
        <div>
          <Button style={{ width: "100%" }}>Upload</Button>
        </div>
      )}
    />
  );
}
