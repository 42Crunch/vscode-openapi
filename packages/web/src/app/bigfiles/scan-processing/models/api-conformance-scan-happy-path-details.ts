import { StatusCode, ApiConformanceScanHappyPathKey } from '../models';

export class ApiConformanceScanHappyPathDetailsV221 {
  readonly happyPathKey: ApiConformanceScanHappyPathKey | undefined;
  readonly curl: string;
  readonly isCurlBodySkipped: boolean;
  readonly responseHttpStatusCode: StatusCode | undefined;
  readonly responseContentType: string;
  readonly responseBodyLength: number;
  readonly responseHttp: string;
  readonly responseKey: string;
  readonly responseDescription: string;

  constructor({
    happyPathKey,
    curl,
    isCurlBodySkipped,
    responseHttpStatusCode,
    responseContentType,
    responseBodyLength,
    responseHttp,
    responseKey,
    responseDescription
  }: Partial<ApiConformanceScanHappyPathDetailsV221> = {}) {
    this.happyPathKey = happyPathKey;
    this.curl = curl || '';
    this.isCurlBodySkipped = isCurlBodySkipped || true;
    this.responseHttpStatusCode = responseHttpStatusCode;
    this.responseContentType = responseContentType || '';
    this.responseBodyLength = responseBodyLength || 0;
    this.responseHttp = responseHttp || '';
    this.responseKey = responseKey || '';
    this.responseDescription = responseDescription || '';
  }
}
