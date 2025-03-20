declare module 'json-source-map' {
  export function parse(source: string): FileSourceMap;

  export interface FileSourceMap {
    data: any;
    pointers: { [key: string]: FileSourceMapPointer };
  }

  export interface FileSourceMapPointer {
    value: FileSourceMapPointerPosition;
    valueEnd: FileSourceMapPointerPosition;
    key: FileSourceMapPointerPosition;
    keyEnd: FileSourceMapPointerPosition;
  }

  export interface FileSourceMapPointerPosition {
    line: number;
    column: number;
    pos: number;
  }
}
