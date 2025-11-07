import SearchSidebar from "../../components/layout/SearchSidebar";
import { saveVault, useFeatureDispatch, useFeatureSelector } from "../../features/vault/slice";
import Form from "../../new-components/Form";

import { unwrapFormValues, wrapFormValues } from "./util";

export default function Vault() {
  const dispatch = useFeatureDispatch();
  const { ready, data } = useFeatureSelector((state) => state.vault);

  const sections = [
    {
      id: "foo",
      title: "Bar",
      items: [],
    },
  ];

  if (!ready) {
    return null;
  }

  return (
    <SearchSidebar
      sections={sections}
      //errors={errors}
      defaultSelection={{ sectionId: "platform", itemId: "platform-connection" }}
      render={(selected) => {
        return (
          <Form
            data={data}
            wrapFormData={wrapFormValues}
            unwrapFormData={unwrapFormValues}
            saveData={(data) => dispatch(saveVault(wrapFormValues(data)))}
            //schema={schema}
          >
            <div>Vault: {selected?.itemId}</div>
          </Form>
        );
      }}
    />
  );
}
