/*
 Copyright (c) 42Crunch Ltd. All rights reserved.
 Licensed under the GNU Affero General Public License version 3. See LICENSE.txt in the project root for license information.
*/
import * as vscode from "vscode";

export const platformUriScheme = "openapi-42crunch";
export const MAX_NAME_LEN = 2048;
export const ASSESSMENT_MAX_WAIT = 60000;
export const ASSESSMENT_RETRY = 5000;

export interface ListCollectionsResponse {
  list: CollectionData[];
}

export interface SearchCollectionsResponse {
  list: { id: string; write: boolean; writeApis: boolean; read: boolean; deleteApis: boolean }[];
}

export interface ListApisResponse {
  list: Api[];
}

export interface Api {
  desc: ApiDescriptor;
  assessment: AssessSummary;
  tags?: Tag[];
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

export interface CollectionFilter {
  name: string | undefined;
  owner: "OWNER" | "ALL";
}

export interface ApiFilter {
  name: string | undefined;
}

export interface PlatformConnection {
  apiToken: string | undefined;
  platformUrl: string;
  services: string;
}

export interface PlatformContext {
  memento: vscode.Memento;
  context: any;
}

export interface Logger {
  fatal(message: string): void;
  error(message: string): void;
  warning(message: string): void;
  info(message: string): void;
  debug(message: string): void;
}

export type ApiAuditReport = {
  tid: string;
  data: any;
};

export type Tag = {
  categoryId: string;
  categoryName: string;
  tagName: string;
  tagId: string;
  onlyAdminCanTag?: boolean;
};

export type Category = {
  id: string;
  name: string;
  description?: string;
  isExclusive: boolean;
  isFreeForm: boolean;
  isProtected: boolean;
  onlyAdminCanTag: boolean;
};
