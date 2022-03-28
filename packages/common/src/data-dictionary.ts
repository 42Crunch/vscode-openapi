export type YesNo = "yes" | "no";

export interface DataDictionary {
  id: string;
  name: string;
  description: string;
}

interface BasicDataFormat {
  name: string;
  type: "string" | "integer";
  description: string;

  readOnly: boolean;
  writeOnly: boolean;
  nullable: boolean;

  pii: YesNo;
  objectIdentifier: YesNo;

  example: string | number;

  lastUpdate: number;
  lastChangeBy?: string;
}

export interface DataFormatString extends BasicDataFormat {
  type: "string";
  pattern?: string;
  minLength?: number;
  maxLength?: number;
}

export interface DataFormatEnum extends BasicDataFormat {
  type: "string";
  enum: string[];
  default?: string;
}

export interface DataFormatInteger extends BasicDataFormat {
  type: "integer";
  exclusiveMinimum?: boolean;
  exclusiveMaximum?: boolean;
  minimum?: number;
  maximum?: number;
  multipleOf?: number;
}

export type DataFormat = DataFormatString | DataFormatEnum | DataFormatInteger;

export type DataFormats = Record<string, DataFormat>;

export type FlattenedDataFormat = DataFormat & {
  dictionaryId: string;
};

export interface FullDataDictionary extends DataDictionary {
  formats: DataFormats;
}
