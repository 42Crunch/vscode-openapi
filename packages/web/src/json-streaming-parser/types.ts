export enum SortOrder {
  Asc = "asc",
  Desc = "desc",
}

export class ParserFieldSortOrder {
  fieldName: string | string[];
  order: SortOrder;

  constructor(fieldName: string, order?: SortOrder) {
    this.fieldName = fieldName || "";
    this.order = order || SortOrder.Asc;
  }
}

export class ScanReportIntegralFilter {
  readonly path: string;

  constructor(path?: string) {
    this.path = path || "";
  }
}

export class FilterStats {
  totalTestedCount: number;
  operationsTestedCount: number;

  constructor({ totalTestedCount, operationsTestedCount }: Partial<FilterStats> = {}) {
    this.totalTestedCount = totalTestedCount || 0;
    this.operationsTestedCount = operationsTestedCount || 0;
  }
}

export interface PaginationResponse {
  list: any[];
  filteredItems: number;
  totalPages: number;
  totalItems: number;
  stats?: FilterStats;
}
