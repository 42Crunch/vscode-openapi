import React, { useState } from "react";
import {
  ParserFieldSortOrder,
  ScanReportIntegralFilter,
  SortOrder,
} from "../../json-streaming-parser/types";
import styled from "styled-components";
import { SearchSelector, SelectOption } from "../tags/SearchSelector";

export const issuesPerPage = 25;
type SortDirection = "asc" | "desc";

// Define types for our data and props
export type TableColumn<T> = {
  header: string;
  accessor: keyof T;
  render?: (value: any, row: T) => React.ReactNode;
  sortable: boolean;
};

export type TableProps<T> = {
  data: T[];
  size: number;
  columns: TableColumn<T>[];
  onPageChange: (
    page: number,
    pageSize: number,
    sorter: ParserFieldSortOrder,
    filter: ScanReportIntegralFilter
  ) => void;
  pageSize?: number;
  defaultSort?: {
    key: string;
    direction: SortDirection;
  };
  options: SelectOption<string>[];
};

function getKey<T>(column: TableColumn<T>): string {
  return column.header.toLowerCase().toString();
}

function getPageIndexes(totalPages: number): number[] {
  if (totalPages > 10) {
    const x = totalPages - 5 + 1;
    return Array.from({ length: 5 }, (_, i) => i + 1).concat(
      Array.from({ length: 5 }, (_, i) => x + i)
    );
  } else {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }
}

export const Table = <T,>({
  data,
  size,
  columns,
  onPageChange,
  pageSize = issuesPerPage,
  defaultSort,
  options,
}: TableProps<T>) => {
  // State for filter
  const [pathToFilter, setPathToFilter] = React.useState("");

  // State for pagination
  const [currentPage, setCurrentPage] = useState(1);

  // State for sorting
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: SortDirection;
  }>(defaultSort || { key: getKey(columns[0]), direction: "asc" });

  // Calculate pagination values
  const totalPages = Math.ceil(size / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, size);
  const currentData = data; //.slice(startIndex, endIndex);

  // Handle page change
  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
    onPageChange(
      page,
      pageSize,
      new ParserFieldSortOrder(
        sortConfig.key,
        sortConfig.direction === "asc" ? SortOrder.Asc : SortOrder.Desc
      ),
      new ScanReportIntegralFilter(pathToFilter)
    );
  };

  // Handle sort
  const requestSort = (key: string) => {
    let direction: SortDirection = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
    setCurrentPage(1); // Reset to first page when sorting changes
    onPageChange(
      1,
      pageSize,
      new ParserFieldSortOrder(key, direction === "asc" ? SortOrder.Asc : SortOrder.Desc),
      new ScanReportIntegralFilter(pathToFilter)
    );
  };

  // Handle filter
  const requestFilter = (key: string) => {
    setPathToFilter(key);
    setCurrentPage(1); // Reset to first page when sorting changes
    onPageChange(
      1,
      pageSize,
      new ParserFieldSortOrder(
        sortConfig.key,
        sortConfig.direction === "asc" ? SortOrder.Asc : SortOrder.Desc
      ),
      new ScanReportIntegralFilter(key)
    );
  };

  return (
    <TableContainer>
      {/* <div>
        <SearchSelector
          options={options}
          placeholder={"todo: selector"}
          keepOpen={false}
          applyHoverCss={true}
          filter={(items: SelectOption<string>[], inputValue: string): SelectOption<string>[] => {
            const searchValue = inputValue.toLowerCase();
            return items.filter((item) => {
              return item.value.toLocaleLowerCase().includes(searchValue);
            });
          }}
          renderer={(item: SelectOption<string>, index: number, inputValue: string) => {
            return <div>{(pathToFilter === item.value ? "* " : "") + item.value}</div>;
          }}
          onItemSelected={(item: SelectOption<string>) => {
            requestFilter(item.value);
          }}
        />
      </div> */}

      <Pagination>
        <button onClick={() => goToPage(1)} disabled={currentPage === 1}>
          &laquo;
        </button>
        <button onClick={() => goToPage(currentPage - 1)} disabled={currentPage === 1}>
          &lsaquo;
        </button>

        {getPageIndexes(totalPages).map((page) => (
          <button
            key={page}
            onClick={() => goToPage(page)}
            className={currentPage === page ? "active" : ""}
          >
            {page}
          </button>
        ))}

        <button onClick={() => goToPage(currentPage + 1)} disabled={currentPage === totalPages}>
          &rsaquo;
        </button>
        <button onClick={() => goToPage(totalPages)} disabled={currentPage === totalPages}>
          &raquo;
        </button>
      </Pagination>

      <PageInfo>
        Showing page {currentPage} ({startIndex + 1}-{endIndex} of {size} items)
      </PageInfo>

      <TableDiv>
        <thead>
          <TableTr>
            {columns.map((column) => (
              <TableTh
                key={getKey(column)}
                onClick={() => column.sortable && requestSort(getKey(column))}
                className={column.sortable ? "sortable" : ""}
              >
                <div className="header-content">
                  {column.header}
                  {column.sortable && (
                    <span className="sort-icon">
                      {sortConfig.key === getKey(column)
                        ? sortConfig.direction === "asc"
                          ? "↑"
                          : "↓"
                        : "↕"}
                    </span>
                  )}
                </div>
              </TableTh>
            ))}
          </TableTr>
        </thead>
        <tbody>
          {currentData.length > 0 ? (
            currentData.map((row, rowIndex) => (
              <TableTr key={rowIndex}>
                {columns.map((column) => (
                  <TableTd key={getKey(column)}>
                    {column.render
                      ? column.render(getRowData(column.accessor as string, row), row)
                      : String(getRowData(column.accessor as string, row))}
                  </TableTd>
                ))}
              </TableTr>
            ))
          ) : (
            <TableTr>
              <TableTd {...{ colspan: `${columns.length}` }}>No data available</TableTd>
            </TableTr>
          )}
        </tbody>
      </TableDiv>
    </TableContainer>
  );
};

function getRowData(accessor: string, row: any): any {
  if (accessor !== "test") {
    return row[accessor];
  } else {
    return !row[accessor] && row["happyPath"] ? row["happyPath"] : row[accessor];
  }
}

const TableContainer = styled.div`
  width: 100%;
  overflow-x: auto;
`;

const TableDiv = styled.table`
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 1rem;
`;

const TableTh = styled.th`
  padding: 0.75rem;
  text-align: left;
  border: 1px solid #ddd;
  background-color: #f8f9fa;
  position: sticky;
  top: 0;
`;

const TableTd = styled.td`
  padding: 0.75rem;
  text-align: left;
  border: 1px solid #ddd;
`;

const TableTr = styled.tr``;

const Pagination = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 3px;
  padding-top: 5px;
`;

const PageInfo = styled.div`
  padding-bottom: 5px;
`;
