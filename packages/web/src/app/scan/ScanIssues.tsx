import styled from "styled-components";

import { HttpError, HttpResponse } from "@xliic/common/http";
import { ThemeColorVariables } from "@xliic/common/theme";
import { TestLogReport } from "@xliic/common/scan-report";

import ScanIssue from "./ScanIssue";
import FilterPanel from "./FilterPanel";
import { ChevronLeft, ChevronRight } from "../../icons";

import { useAppDispatch, useAppSelector } from "./store";
import { loadTestsPage } from "./slice";

function Paginator({
  current,
  total,
  onPageChange,
}: {
  current: number;
  total: number;
  onPageChange: (page: number) => void;
}) {
  const handlePrevious = () => {
    if (current > 0) {
      onPageChange(current - 1);
    }
  };

  const handleNext = () => {
    if (current < total - 1) {
      onPageChange(current + 1);
    }
  };

  return (
    <PaginatorContainer>
      <Arrow onClick={handlePrevious} disabled={current === 0}>
        <ChevronLeft />
      </Arrow>
      Page {current + 1} of {total}
      <Arrow onClick={handleNext} disabled={current === total - 1}>
        <ChevronRight />
      </Arrow>
    </PaginatorContainer>
  );
}

export default function ScanIssues() {
  const { testsPage } = useAppSelector((state) => state.scan);
  const dispatch = useAppDispatch();

  const handlePageChange = (pageIndex: number) => {
    dispatch(loadTestsPage(pageIndex));
  };

  if (testsPage.total === 0) {
    return (
      <Container>
        <NoTests>No test results available</NoTests>
      </Container>
    );
  }

  return (
    <Container>
      <FilterPanel />
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

const PaginatorContainer = styled.div`
  padding: 8px;
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
  padding: 4px;

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const Container = styled.div`
  margin-top: 8px;
`;

const NoTests = styled.div`
  margin: 8px;
  padding: 4px;
  border: 1px solid var(${ThemeColorVariables.border});
`;
