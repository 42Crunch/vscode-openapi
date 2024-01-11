export type NamingConvention = {
  pattern: string;
  description: string;
  example: string;
};

export const DefaultCollectionNamingPattern = "^[\\w _.\\/:-]{1,2048}$" as const;
export const DefaultApiNamingPattern = "^[\\w _.-]{1,255}$" as const;
export const TagRegex = "^([\\w\\-@.+]{1,255}:[\\w\\-@.+]{1,255}[\\s,]*)*$" as const;
