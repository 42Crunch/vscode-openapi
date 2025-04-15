import { SortOrder } from './sort-order';

export class ParserFieldSortOrder {
  fieldName: string | string[];
  order: SortOrder;

  constructor(fieldName: string, order?: SortOrder) {
    this.fieldName = fieldName || '';
    this.order = order || SortOrder.Asc;
  }
}
