import { ApiConformanceScanOperationV221 } from './api-conformance-scan-operation';

export class ApiConformanceScanPathV221 {
  readonly path: string;
  readonly operations: ApiConformanceScanOperationV221[];

  constructor({ path, operations }: Partial<ApiConformanceScanPathV221> = {}) {
    this.path = path || '';
    this.operations = operations || [];
  }
}
