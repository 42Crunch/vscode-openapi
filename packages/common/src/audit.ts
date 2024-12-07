import { YesNo } from "./common";

export interface SummaryData {
  datavalidation: Grade;
  security: Grade;
  oasconformance: Grade;
  all: number;
}

interface Grade {
  value: number;
  max: number;
}

export interface Grades {
  datavalidation: Grade;
  security: Grade;
  oasconformance: Grade;
  all: number;
  errors: boolean;
  invalid: boolean;
}

export interface Summary extends Grades {
  documentUri: string;
  subdocumentUris: string[];
}

export interface ReportedIssue {
  id: string;
  description: string;
  pointer: string;
  score: number;
  displayScore: string;
  criticality: CriticalityLevel;
}

export interface Issue extends ReportedIssue {
  lineNo: number;
  range: {
    start: { line: number; character: number };
    end: { line: number; character: number };
  };
  documentUri: string;
}

export interface IssuesByDocument {
  [uri: string]: Issue[];
}

export interface FilesMap {
  [uri: string]: {
    relative: string;
  };
}

export interface Audit {
  filename: string;
  files: FilesMap;
  summary: Summary;
  issues: IssuesByDocument;
  minimalReport: boolean;
  valid: boolean;
  openapiState: string;
  compliance?: AuditCompliance;
  todo?: IssuesByDocument;
}

export type Sqg = {
  id: string;
  name: string;
  directives: {
    rejectInvalidContract: YesNo;
    minimumAssessmentScores: { global: number; security: number; dataValidation: number };
    subcategoryRules: {
      dataValidation: {
        parameters: SeverityLevelOrNone;
        responseHeaders: SeverityLevelOrNone;
        responseDefinition: SeverityLevelOrNone;
        schema: SeverityLevelOrNone;
        paths: SeverityLevelOrNone;
      };
      security: {
        authentication: SeverityLevelOrNone;
        authorization: SeverityLevelOrNone;
        transport: SeverityLevelOrNone;
      };
    };
    issueRules?: string[];
  };
};

export type ProcessingDetails = {
  blockingSqgId: string;
  blockingRules: string[];
};

export type AuditCompliance = {
  acceptance: YesNo;
  sqgsDetail: Sqg[];
  processingDetails: ProcessingDetails[];
};

export interface Kdb {
  [key: string]: any;
}

export type CriticalityLevel = 1 | 2 | 3 | 4 | 5;

export const SeverityLevels = ["info", "low", "medium", "high", "critical"] as const;
export type SeverityLevel = (typeof SeverityLevels)[number];

export type SeverityLevelOrNone = "info" | "low" | "medium" | "high" | "critical" | "none";

export const Criticality = {
  Info: 1,
  Low: 2,
  Medium: 3,
  High: 4,
  Critical: 5,
} as const;

export const CriticalityLevelId = {
  [Criticality.Info]: "info",
  [Criticality.Low]: "low",
  [Criticality.Medium]: "medium",
  [Criticality.High]: "high",
  [Criticality.Critical]: "critical",
} as const;

export const CriticalityLevelName = {
  [Criticality.Info]: "Info",
  [Criticality.Low]: "Low",
  [Criticality.Medium]: "Medium",
  [Criticality.High]: "High",
  [Criticality.Critical]: "Critical",
} as const;

export type Domain = "security" | "datavalidation" | "oasconformance";
export type OasConformanceGroup = "validation" | "semantics" | "bestpractices";
export type DataValidationGroup =
  | "parameters"
  | "paths"
  | "schema"
  | "responseheader"
  | "responsedefinition";
export type SecurityGroup = "authentication" | "authorization" | "transport";

export const groupNames = {
  oasconformance: {
    validation: "Structure",
    semantics: "Semantics",
    bestpractices: "Best practices",
  },
  datavalidation: {
    parameters: "Parameters",
    paths: "Paths",
    schema: "Schema",
    responseheader: "Response headers",
    responsedefinition: "Response definition",
  },
  security: {
    authentication: "Authentication",
    authorization: "Authorization",
    transport: "Transport",
  },
} as const;
