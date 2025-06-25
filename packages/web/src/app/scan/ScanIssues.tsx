import styled from "styled-components";

import { HttpError, HttpResponse } from "@xliic/common/http";
import { ThemeColorVariables } from "@xliic/common/theme";
import { TestLogReport } from "@xliic/common/scan-report";

import ScanIssue from "./ScanIssue";
import FilterPanel from "./FilterPanel";
import { ChevronLeft, ChevronRight } from "../../icons";

import { useAppDispatch, useAppSelector } from "./store";
import { loadTestsPage } from "./slice";

export default function ScanIssues() {
  const { testsPage, testsPageIndex } = useAppSelector((state) => state.scan);

  if (testsPage.total === 0) {
    return (
      <Container>
        <NoTests>No test results available</NoTests>
      </Container>
    );
  }

  //   <Container>
  //   <FilterPanel />
  //   {Object.keys(grouped).map((key) => (
  //     <div key={key}>
  //       <GroupTitle>{kdbTitles[key] ?? "Unknown test type"}</GroupTitle>
  //       {grouped[key].map((issue, index) => {
  //         const id = `${key}-${index}`;
  //         return (
  //           <ScanIssue
  //             issue={issue}
  //             httpResponse={responses[id]}
  //             error={errors[id]}
  //             waiting={waitings[id]}
  //             key={id}
  //             id={id}
  //           />
  //         );
  //       })}
  //     </div>
  //   ))}
  // </Container>

  return (
    <Container>
      <FilterPanel />
      {testsPage.items.map((issue, index) => (
        <ScanIssue issue={issue} key={index} />
      ))}
      <Paginator>
        <Arrow>
          <ChevronLeft />
        </Arrow>
        Page {testsPageIndex + 1} of {testsPage.pages}
        <Arrow>
          <ChevronRight />
        </Arrow>
      </Paginator>
    </Container>
  );
}

const Paginator = styled.div`
  margin: 8px;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const Arrow = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
  display: flex;
}`;

const Container = styled.div`
  margin-top: 8px;
`;

const NoTests = styled.div`
  margin: 8px;
  padding: 4px;
  border: 1px solid var(${ThemeColorVariables.border});
`;

const GroupTitle = styled.div`
  padding: 10px;
  font-size: 1.1em;
  font-weight: 600;
`;

const kdbTitles: Record<string, string> = {
  "authentication-swapping-bfla":
    "Broken Function Level Access test performed by swapping user credentials",
  "authentication-swapping-bola":
    "Broken Object Access Level Authorization test performed swapping user credentials.",
  "custom-request": "Custom client request",
  "parameter-header-contenttype-wrong-scan":
    "Scan sends a request where the request body does not match the 'Content-Type' specified in the header.",
  "parameter-required-scan":
    "Scan sends a request that is missing a parameter that has been defined as required in the OpenAPI definition.",
  "partial-security-accepted":
    "Scan sends a request where a required security requirement is missing",
  "path-item-method-not-allowed-scan":
    "Scan sends a request using a verb (method) that is not defined for the path in the OpenAPI definition.",
  "path-item-method-not-allowed-no-authn-scan":
    "Scan sends a request without authentication using a verb (method) that is not defined for the path in the OpenAPI definition.",
  "schema-additionalproperties-scan": "Scan sends a request that contains an undefined property.",
  "schema-enum-scan":
    "Scan sends a request that contains a enum value not present in the property '%s' constraining this value.",
  "schema-format-scan": "Scan sends a request containing a string value with wrong format",
  "schema-maxitems-scan":
    "Scan sends a request containing an array which has more items than what is defined by the property 'maxItems'",
  "schema-maxlength-scan":
    "Scan sends a request containing a string where length is greater than the value set by 'maxLength'",
  "schema-maximum-scan":
    "Scan sends a request containing an integer or number value larger than the defined maximum for it.",
  "schema-minitems-scan":
    "Scan sends a request containing an array value with less items than defined in the property 'minItems' constraining it.",
  "schema-minlength-scan":
    "Scan sends a request containing a string value that is shorter than the set 'minLength'.",
  "schema-minimum-scan":
    "Scan sends a request containing an integer or number value smaller than the defined minimum for it.",
  "schema-multipleof-scan":
    "Scan sends a request containing an integer or number value that does not follow the property 'multipleOf' defined for it.",
  "schema-pattern-scan":
    "Scan sends a request containing a string value that does not match the regular expression pattern defined for it.",
  "schema-required-scan": "Scan sends a request that is missing a property defined as 'required'.",
  "schema-type-wrong-array-scan":
    "Scan sends a request containing an array instead of the value type that the OpenAPI definition expects.",
  "schema-type-wrong-bool-scan":
    "Scan sends a request containing a Boolean value instead of the type that the OpenAPI definition expects.",
  "schema-type-wrong-integer-scan":
    "Scan sends a request containing an integer value instead of the type that the OpenAPI definition expects.",
  "schema-type-wrong-number-scan":
    "Scan sends a request containing a number value instead of the type that the OpenAPI definition expects.",
  "schema-type-wrong-object-scan":
    "Scan sends a request containing an object instead of the value type that the OpenAPI definition expects.",
  "schema-type-wrong-string-scan":
    "Scan sends a request containing a string value instead of the type that the OpenAPI definition expects.",
  "schema-uniqueitems-unique-scan":
    "Scan sends a request containing an array value that does not follow the property 'uniqueItems' that constrains this value.",
};
