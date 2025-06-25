import styled from "styled-components";
import { ChevronLeft, ChevronRight } from "../../icons";

export default function Paginator({
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
