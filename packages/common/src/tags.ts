export type ApiEntry = {
  apiId: string;
  apiName: string;
  collectionId: string;
  collectionName: string;
};
export type TagEntry = { tagId: string; tagName: string };
export type TagDataEntry = TagEntry[] | ApiEntry | null;
export type TagData = Record<string, TagDataEntry>;

export type LoadTags = {
  command: "loadTags";
  payload: {
    targetFileName: string;
    data: TagData;
  };
};

export type SaveTags = {
  command: "saveTags";
  payload: TagData;
};
