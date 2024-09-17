// export type SearchableItem = {
//   id: string;
//   name: string;
//   entry: any;
//   children?: string[];
// };

export type CollectionResponseEntry = {
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
};

export type ApiResponseEntry = {
  desc: {
    id: string;
    cid: string;
    name: string;
    technicalName: string;
    specfile?: string;
  };
  assessment: {
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
  };
  tags: TagResponseEntry[];
};

export type ResponseEntry = CollectionResponseEntry | ApiResponseEntry;

export type TagResponseEntry = {
  tagId: string;
  tagName: string;
  tagDescription: string;
  color: string;
  dependencies: any;
  isExclusive: boolean;
  isFreeForm: boolean;
  isProtected: boolean;
  categoryDescription: string;
  categoryId: string;
  categoryName: string;
};

export type CategoryResponseEntry = {
  id: string;
  name: string;
  color: string;
  description: string;
  isExclusive: boolean;
  isFreeForm: boolean;
  isProtected: boolean;
  onlyAdminCanTag: boolean;
};

export type Tag = {
  tagId: string;
  tagName: string;
  tagDescription: string;
  onlyAdminCanTag: boolean;
};

export type Category = {
  categoryId: string;
  categoryName: string;
  categoryDescription: string;
  onlyAdminCanTag: boolean;
  multipleChoicesAllowed: boolean;
  tags: Tag[];
};
