import { ThemeColorVariables } from "@xliic/common/theme";
import styled from "styled-components";
import { RootSearchSelector, SelectOption } from "./RootSearchSelector";
import { ApiResponseEntry, CollectionResponseEntry, TagResponseEntry } from "./types";

export function CollectionSearchSelector({
  collections,
  onItemSelected,
}: {
  collections: CollectionResponseEntry[] | undefined;
  onItemSelected: (item: SelectOption<CollectionResponseEntry>) => void;
}) {
  const options: SelectOption<CollectionResponseEntry>[] = [];
  if (collections) {
    collections.forEach((collEntry) =>
      options.push({
        value: collEntry,
        label: collEntry.desc.name,
      })
    );
  }
  return (
    <RootSearchSelector
      options={options}
      placeholder="Collection name or UUID"
      filter={(
        items: SelectOption<CollectionResponseEntry>[],
        inputValue: string
      ): SelectOption<CollectionResponseEntry>[] => {
        const searchValue = inputValue.toLowerCase();
        return items.filter((item) => {
          return (
            item.value.desc.name.toLocaleLowerCase().includes(searchValue) ||
            item.value.desc.id.toLocaleLowerCase().includes(searchValue)
          );
        });
      }}
      renderer={(
        item: SelectOption<CollectionResponseEntry>,
        index: number,
        inputValue: string
      ) => {
        return (
          <>
            <SearchSpan value={item.label} searchValue={inputValue}></SearchSpan>
            <CategoryNoteSpan>UUID: {item.value.desc.id}</CategoryNoteSpan>
            <CategorySeparator />
          </>
        );
      }}
      onItemSelected={onItemSelected}
    />
  );
}

export function ApiSearchSelector({
  apis,
  onItemSelected,
}: {
  apis: ApiResponseEntry[] | undefined;
  onItemSelected: (item: SelectOption<ApiResponseEntry>) => void;
}) {
  const options: SelectOption<ApiResponseEntry>[] = [];
  if (apis) {
    apis.forEach((collEntry) =>
      options.push({
        value: collEntry,
        label: collEntry.desc.name,
      })
    );
  }
  return (
    <RootSearchSelector
      options={options}
      placeholder="API name or UUID"
      filter={(
        items: SelectOption<ApiResponseEntry>[],
        inputValue: string
      ): SelectOption<ApiResponseEntry>[] => {
        const searchValue = inputValue.toLowerCase();
        return items.filter((item) => {
          return (
            item.value.desc.name.toLocaleLowerCase().includes(searchValue) ||
            item.value.desc.id.toLocaleLowerCase().includes(searchValue)
          );
        });
      }}
      renderer={(item: SelectOption<ApiResponseEntry>, index: number, inputValue: string) => {
        return (
          <>
            <SearchSpan value={item.label} searchValue={inputValue}></SearchSpan>
            <CategoryNoteSpan>UUID: {item.value.desc.id}</CategoryNoteSpan>
            {item.value.tags.length > 0 && (
              <div>
                {item.value.tags.map((tagItem: TagResponseEntry, tagItemIndex) => {
                  return <span key={`api-tag-${tagItemIndex}`}>{tagItem.tagName} </span>;
                })}
              </div>
            )}
            <CategorySeparator />
          </>
        );
      }}
      onItemSelected={onItemSelected}
    />
  );
}

// export function SearchSelector({
//   itemsList,
//   onItemSelected,
// }: {
//   itemsList: SearchableItem[];
//   onItemSelected: (item: SearchableItem) => void;
// }) {
//   const [inputValue, setInputValue] = React.useState("");

//   function getFilteredItems(items: SearchableItem[], inputValue: string): SearchableItem[] {
//     const searchValue = inputValue.toLowerCase();
//     return items.filter((item) => {
//       return (
//         item.name.toLocaleLowerCase().includes(searchValue) ||
//         item.id.toLocaleLowerCase().includes(searchValue)
//       );
//     });
//   }

//   const items = React.useMemo(
//     () => getFilteredItems(itemsList, inputValue),
//     [itemsList, inputValue]
//   );
//   const { getDropdownProps } = useMultipleSelection({
//     selectedItems: itemsList,
//   });

//   const { isOpen, getToggleButtonProps, getMenuProps, getInputProps, getItemProps } = useCombobox({
//     items,
//     itemToString(item) {
//       return item ? item.name : "null";
//     },
//     inputValue,
//     stateReducer(state, actionAndChanges) {
//       const { changes, type } = actionAndChanges;
//       switch (type) {
//         case useCombobox.stateChangeTypes.InputKeyDownEnter:
//         case useCombobox.stateChangeTypes.ItemClick:
//           return {
//             ...changes,
//             isOpen: false,
//           };
//         default:
//           return changes;
//       }
//     },
//     onStateChange({ inputValue: newInputValue, type, selectedItem: newSelectedItem }) {
//       switch (type) {
//         case useCombobox.stateChangeTypes.InputKeyDownEnter:
//         case useCombobox.stateChangeTypes.ItemClick:
//         case useCombobox.stateChangeTypes.InputBlur:
//           if (newSelectedItem) {
//             onItemSelected(newSelectedItem);
//             setInputValue("");
//           }
//           break;
//           break;
//         case useCombobox.stateChangeTypes.InputChange:
//           setInputValue(newInputValue || "");
//           break;
//         default:
//           break;
//       }
//     },
//   });

//   return (
//     <MainComboboxContainer>
//       <DownShiftContainer>
//         <DownShiftInput
//           placeholder="Name or UUID"
//           {...getInputProps(getDropdownProps({ preventKeyAction: isOpen }))}
//         />
//         <AngleDown {...getToggleButtonProps()} />
//       </DownShiftContainer>
//       <DropDownList className={`${!(isOpen && items.length) && "hidden"}`} {...getMenuProps()}>
//         {isOpen &&
//           items.map((item, index) => (
//             <DropDownListElement key={item.id} {...getItemProps({ item, index })}>
//               <SearchSpan value={item.name} searchValue={inputValue}></SearchSpan>
//               <CategoryNoteSpan>UUID: {item.id}</CategoryNoteSpan>
//               {item.children && (
//                 <div>
//                   {item.children.map((tagItem, tagItemIndex) => {
//                     return <span key={`${item.id}-${tagItemIndex}`}>{tagItem} </span>;
//                   })}
//                 </div>
//               )}
//               <CategorySeparator />
//             </DropDownListElement>
//           ))}
//       </DropDownList>
//     </MainComboboxContainer>
//   );
// }

function SearchSpan({ value, searchValue }: { value: string; searchValue: string }) {
  if (!searchValue || !value) {
    return <span>{value}</span>;
  }
  let i = -1;
  let j = 0;
  value = value.toLowerCase();
  searchValue = searchValue.toLocaleLowerCase();
  const chunks: { text: string; mark: boolean }[] = [];
  while ((i = value.indexOf(searchValue, i + 1)) != -1) {
    chunks.push({ text: value.substring(j, i), mark: false });
    j = i + searchValue.length;
    chunks.push({ text: value.substring(i, j), mark: true });
  }
  chunks.push({ text: value.substring(j), mark: false });
  return (
    <span>
      {chunks.map((chunk, index) => {
        if (chunk.mark) {
          return <mark key={index}>{chunk.text}</mark>;
        } else {
          return chunk.text;
        }
      })}
    </span>
  );
}

const MainComboboxContainer = styled.div`
  width: 592px;
`;

const DownShiftContainer = styled.div`
  display: flex;
  flex-direction: row;
  gap: 0.5rem;
  align-items: center;
  > svg {
    margin-left: 3px;
    fill: var(${ThemeColorVariables.foreground});
  }
`;

const DownShiftInput = styled.input`
  min-width: 540px;
  background-color: var(${ThemeColorVariables.inputBackground});
  border-radius: 3px;
  border: 1px solid var(${ThemeColorVariables.border});
  color: var(${ThemeColorVariables.inputForeground});
  height: 25px;
  cursor: pointer;
`;

const DropDownList = styled.ul`
  position: absolute;
  width: inherit;
  background-color: var(${ThemeColorVariables.dropdownBackground});
  overflow-y: scroll;
  max-height: 30rem;
  z-index: 10;
  margin-top: 5px;
  padding-inline-start: 1px;
`;

const DropDownListElement = styled.li`
  display: flex;
  gap: 5px;
  flex-direction: column;
  padding-bottom: 0.5rem;
  padding-top: 0.5rem;
  padding-left: 0.75rem;
  padding-right: 0.75rem;
  cursor: pointer;
`;

const CategorySpan = styled.span`
  font-weight: bold;
`;

const CategoryNoteSpan = styled.span`
  font-weight: smaller;
  color: var(${ThemeColorVariables.disabledForeground});
`;

const CategoryWarningNoteSpan = styled.span`
  font-weight: smaller;
  color: var(${ThemeColorVariables.errorForeground});
`;

const CategoryTagsContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 5px;
  padding-bottom: 15px;
`;

const CategorySeparator = styled.div`
  height: 1px;
  background-color: var(${ThemeColorVariables.border});
`;

const Input = styled.input`
  accent-color: var(${ThemeColorVariables.checkboxBackground});
`;
