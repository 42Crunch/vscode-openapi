import styled from "styled-components";

import { useAppDispatch, useAppSelector } from "./store";

import { PlainSelect } from "../../components/Select";
import { changeFilter } from "./slice";

export default function FilterTitle() {
  const { filter, titles } = useAppSelector((state) => state.scan);
  const dispatch = useAppDispatch();

  const options = [];

  for (const key of titles) {
    if (kdbTitles[key]) {
      options.push({ label: kdbTitles[key], value: key });
    }
  }

  return (
    <Container>
      <PlainSelect
        label="Type"
        options={options}
        placeholder="All"
        onSelectedItemChange={(item) => {
          if (item && item.value !== "all") {
            dispatch(changeFilter({ ...filter, title: item.value as string }));
          } else {
            dispatch(changeFilter({ ...filter, title: undefined }));
          }
        }}
        selected={filter.title || "all"}
      />
    </Container>
  );
}

const Container = styled.div`
  width: 264px;
`;

const kdbTitles: Record<string, string> = {
  "path-item-method-not-allowed-scan": "Scan sends a request using an undefined verb",
  "parameter-required-scan": "Scan sends a request that is missing a required parameter",
  "parameter-header-contenttype-wrong-scan": "Scan sends a request with wrong content type",
  "schema-multipleof-scan":
    "Scan sends a request containing a numeric value conflicting with multipleOf",
  "schema-maximum-scan": "Scan sends a request containing a numeric value overflowing maximum",
  "schema-minimum-scan": "Scan sends a request containing a numeric value under the minimum",
  "schema-minlength-scan": "Scan sends a request containing a string value that is too short",
  "schema-maxlength-scan": "Scan sends a request containing a string value that is too long",
  "schema-pattern-scan": "Scan sends a request containing a string value with wrong pattern",
  "schema-maxitems-scan": "Scan sends a request containing an array with too many items",
  "schema-minitems-scan": "Scan sends a request containing an array with too few items",
  "schema-uniqueitems-unique-scan":
    "Scan sends a request containing an array value that conflicts with ‘uniqueItems’",
  "schema-required-scan": "Scan sends a request that is missing a required property",
  "schema-enum-scan":
    "Scan sends a request containing a value not present in the constraining enum",
  "schema-additionalproperties-scan": "Scan sends a request that contains an undefined property",
  "schema-format-scan": "Scan sends a request containing a string value with wrong format",
  "schema-type-wrong-string-scan":
    "Scan sends a request containing a string value instead of the expected type",
  "schema-type-wrong-bool-scan":
    "Scan sends a request containing a Boolean value instead of the expected type",
  "schema-type-wrong-integer-scan":
    "Scan sends a request containing an integer value instead of the expected type",
  "schema-type-wrong-number-scan":
    "Scan sends a request containing a number value instead of the expected type",
  "schema-type-wrong-array-scan":
    "Scan sends a request containing an array instead of the expected type",
  "schema-type-wrong-object-scan":
    "Scan sends a request containing an object instead of the expected type",
};
