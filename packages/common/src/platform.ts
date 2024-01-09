export type NamingConvention = {
  pattern: string;
  description: string;
  example: string;
};

export const DefaultCollectionNamingPattern = "^[\\w _.\\/:-]{1,2048}$" as const;
export const DefaultApiNamingPattern = "^[\\w _.-]{1,255}$" as const;
