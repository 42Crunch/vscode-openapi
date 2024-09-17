export type TagEntry = { tagId: string; tagName: string };
export type TagData = Record<string, TagEntry[]>;

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
