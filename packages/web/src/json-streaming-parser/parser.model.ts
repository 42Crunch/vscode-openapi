export const stringTokenPatternValue: RegExp = /[\\"\n]/g;
export const defaultMaxBufferLength: number = 256 * 1024;

export const charMap: { [key: string]: any } = {
  tab: 0x09, // \t
  lineFeed: 0x0a, // \n
  carriageReturn: 0x0d, // \r
  space: 0x20, // " "

  doubleQuote: 0x22, // "
  plus: 0x2b, // +
  comma: 0x2c, // ,
  minus: 0x2d, // -
  period: 0x2e, // .

  _0: 0x30, // 0
  _9: 0x39, // 9

  colon: 0x3a, // :

  E: 0x45, // E

  openBracket: 0x5b, // [
  backslash: 0x5c, // \
  closeBracket: 0x5d, // ]

  a: 0x61, // a
  b: 0x62, // b
  e: 0x65, // e
  f: 0x66, // f
  l: 0x6c, // l
  n: 0x6e, // n
  r: 0x72, // r
  s: 0x73, // s
  t: 0x74, // t
  u: 0x75, // u

  openBrace: 0x7b, // {
  closeBrace: 0x7d // }
};

export enum ParserEvent {
  Value = 'value',
  String = 'string',
  Key = 'key',
  OpenObject = 'openobject',
  CloseObject = 'closeobject',
  OpenArray = 'openarray',
  CloseArray = 'closearray',
  Error = 'error',
  End = 'end',
  Ready = 'ready'
}

export const events: string[] = Object.values(ParserEvent).map((event: string) => event);

export interface Options {
  trim?: boolean | undefined;
  normalize?: boolean | undefined;
}

export interface STATE {
  '0': string;
  '1': string;
  '10': string;
  '11': string;
  '12': string;
  '13': string;
  '14': string;
  '15': string;
  '16': string;
  '17': string;
  '18': string;
  '19': string;
  '2': string;
  '20': string;
  '21': string;
  '22': string;
  '23': string;
  '3': string;
  '4': string;
  '5': string;
  '6': string;
  '7': string;
  '8': string;
  '9': string;
  BACKSLASH: number;
  BEGIN: number;
  CLOSE_ARRAY: number;
  CLOSE_KEY: number;
  CLOSE_OBJECT: number;
  END: number;
  FALSE: number;
  FALSE2: number;
  FALSE3: number;
  FALSE4: number;
  NULL: number;
  NULL2: number;
  NULL3: number;
  NUMBER_DECIMAL_POINT: number;
  NUMBER_DIGIT: number;
  OPEN_ARRAY: number;
  OPEN_KEY: number;
  OPEN_OBJECT: number;
  STRING: number;
  TEXT_ESCAPE: number;
  TRUE: number;
  TRUE2: number;
  TRUE3: number;
  VALUE: number;
}
