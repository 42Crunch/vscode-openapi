import { useAppSelector } from "./store";
import FormatCard from "./FormatCard";
import SearchSidebar from "../../components/layout/SearchSidebar";

function App() {
  const formats = useAppSelector((state) => state.formats.formats);
  const dictionaries = useAppSelector((state) => state.formats.dictionaries);

  if (dictionaries?.[0]?.id === undefined) {
    return null;
  }

  const standardDictionary = dictionaries
    .filter((dicttionary) => dicttionary.id === "standard")
    .map((dicttionary) => ({ ...dicttionary, label: dicttionary.name }));

  const userDictionaries = dictionaries
    .filter((dicttionary) => dicttionary.id !== "standard")
    .map((dicttionary) => ({ ...dicttionary, label: dicttionary.name }));

  const sections = [
    { id: "standard", title: "Organization standard dictionary", items: standardDictionary },
    { id: "named", title: "Organization named dictionaries", items: userDictionaries },
  ];

  return (
    <SearchSidebar
      sections={sections}
      render={(selected) => {
        return formats
          .filter((format) => format.dictionaryId === selected.itemId)
          .map((format) => (
            <FormatCard format={format} key={`${format.dictionaryId}-${format.name}`} />
          ));
      }}
    />
  );
}

export default App;
