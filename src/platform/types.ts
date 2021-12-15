/*
 Copyright (c) 42Crunch Ltd. All rights reserved.
 Licensed under the GNU Affero General Public License version 3. See LICENSE.txt in the project root for license information.
*/
import * as vscode from "vscode";

import { CollectionsProvider } from "./explorer/provider";
import { ExplorerNode } from "./nodes/base";

export const platformUriScheme = "openapi-42crunch";
export const MAX_NAME_LEN = 2048;
export const ASSESSMENT_MAX_WAIT = 60000;
export const ASSESSMENT_RETRY = 5000;

export interface ListCollectionsResponse {
  list: CollectionData[];
}

export interface ListApisResponse {
  list: Api[];
}

export interface Api {
  desc: ApiDescriptor;
  assessment: AssessSummary;
}

export interface ApiDescriptor {
  id: string;
  cid: string;
  name: string;
  technicalName: string;
  specfile?: string;
}

export interface AssessSummary {
  last: string;
  isValid: boolean;
  isProcessed: boolean;
  grade: number;
  numErrors: number;
  numInfos: number;
  numLows: number;
  numMediums: number;
  numHighs: number;
  numCriticals: number;
  releasable: boolean;
  oasVersion: string;
}

export interface CollectionData {
  desc: {
    id: string;
    name: string;
    technicalName: string;
  };
  summary: {
    apis: number;
    writeApis: boolean;
  };
  teamCounter: number;
  userCounter: number;
}

export interface UserData {
  id: string;
  firstname: string;
  lastname: string;
  username: string;
  read: boolean;
  write: boolean;
}

// GOOD ABOVE

export interface ApiStatus {
  isAssessmentProcessed: boolean;
  lastAssessment: Date;
  isScanProcessed: boolean;
  lastScan: Date;
}

export interface ApiResponse {
  desc: {
    id: string;
    name: string;
    technicalName: string;
  };
}

export interface ApiCollectionResponse {
  list: ApiResponse[];
}

export interface JsonMapping {
  file: string;
  hash: string;
}

export interface MappingTreeNode {
  value: JsonMapping;
  children: {
    [key: string]: MappingTreeNode;
  };
}

export interface RemoteApiError {
  statusCode: number | null;
  error: any;
  description: string | null;
}

export interface ApiErrors {
  errors: {
    parsing?: string;
    bundling?: string;
    remote?: {
      statusCode: number | null;
      error: any;
      description: string | null;
    };
  };
}

export interface Issue {
  id: string;
  description: string;
  pointer: string;
  score: number;
  displayScore: string;
  criticality: number;
  file?: string;
  line?: number;
  severity: string;
}

export interface AuditApi extends Api {
  score: number;
  failures: string[];
  issues: Issue[];
}

export type FileAuditMap = Map<string, AuditApi | ApiErrors>;

export interface AuditResult {
  files: FileAuditMap;
  failures: number;
}

export type SeverityEnum = "critical" | "high" | "medium" | "low" | "info";

export interface Score {
  data?: number;
  security?: number;
  overall?: number;
}

export interface SeverityPerCategory {
  data?: SeverityEnum;
  security?: SeverityEnum;
}

export interface Mapping {
  [k: string]: string;
}

export interface CollectionFilter {
  name: string;
  owner: "OWNER" | "ALL";
}

export interface PlatformConnection {
  apiToken: string;
  userAgent: string;
  referer: string;
  platformUrl: string;
}

export interface PlatformContext {
  explorer: {
    provider: CollectionsProvider;
    tree: vscode.TreeView<ExplorerNode>;
  };
  memento: vscode.Memento;
  context: any;
  logger: Logger;
  connection: PlatformConnection;
}

export interface Logger {
  fatal(message: string): void;
  error(message: string): void;
  warning(message: string): void;
  info(message: string): void;
  debug(message: string): void;
}
