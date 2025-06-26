import styled from "styled-components";

import { ThemeColorVariables } from "@xliic/common/theme";

import ScanIssue from "./ScanIssue";
import FilterPanel from "./FilterPanel";

import { useAppDispatch, useAppSelector } from "./store";
import { loadTestsPage } from "./slice";
import Paginator from "./Paginator";

export default function ScanIssues() {
  const { testsPage } = useAppSelector((state) => state.scan);
  const dispatch = useAppDispatch();

  const handlePageChange = (pageIndex: number) => {
    dispatch(loadTestsPage(pageIndex));
  };

  // if (testsPage.total === 0) {
  //   return (
  //     <Container>
  //       <NoTests>No test results available</NoTests>
  //     </Container>
  //   );
  // }

  return (
    <Container>
      <FilterPanel total={testsPage.total} />
      {testsPage.items.map((issue, index) => (
        <ScanIssue issue={issue} key={`${testsPage.current}-${index}`} />
      ))}
      <Paginator
        current={testsPage.current}
        total={testsPage.pages}
        onPageChange={handlePageChange}
      />
    </Container>
  );
}

const Container = styled.div`
  margin-top: 8px;
`;

const NoTests = styled.div`
  margin: 8px;
  padding: 4px;
  border: 1px solid var(${ThemeColorVariables.border});
`;
