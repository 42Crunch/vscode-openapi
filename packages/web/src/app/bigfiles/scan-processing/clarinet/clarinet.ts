// @ts-nocheck
import {
  Char,
  defaultMaxBufferLength,
  events,
  Options,
  ParserEvent,
  STATE,
  stringTokenPatternValue,
} from "../models";

export class Parser {
  stringTokenPattern: any;
  maxBufferLength: number;
  events: string[];
  line: number;
  column: number;
  position: number;
  bufferCheckPosition: number;
  q: string;
  c: string;
  p: any; // string;
  opt: Options;
  closed: boolean;
  closedRoot: boolean;
  sawRoot: boolean;
  error: any;
  tag: any;
  stack: any[];
  slashed: boolean;
  unicodeI: number;
  unicodeS: string;
  depth: number;
  state: STATE;
  buffers: any;
  S: any;
  textNode: string;
  numberNode: string;

  onValue: (value: string | boolean | null) => Promise<void>;
  onKey: (key: string) => Promise<void>;
  onOpenObject: (key: string) => Promise<void>;
  onCloseObject: () => Promise<void>;
  onOpenArray: () => Promise<void>;
  onCloseArray: () => Promise<void>;
  onEnd: () => Promise<void>;
  onError: (e: Error) => Promise<void>;
  onReady: () => void; // TODO MAKE THIS FUNCTION

  constructor({
    maxBufferLength,
    stringTokenPattern,
    onValue,
    onKey,
    onOpenObject,
    onCloseObject,
    onOpenArray,
    onCloseArray,
    onEnd,
    onError,
    onReady,
    opt,
  }: Partial<Parser> = {}) {
    this.stringTokenPattern = stringTokenPattern || stringTokenPatternValue;
    this.maxBufferLength = maxBufferLength || defaultMaxBufferLength;
    this.events = events;
    this.buffers = {
      textNode: undefined,
      numberNode: "",
    };

    this.opt = opt || {};
    this.S = this.prepareState();
    this.onReady = onReady! || function () {};
    this.onValue = onValue!;
    this.onKey = onKey!;
    this.onOpenObject = onOpenObject!;
    this.onCloseObject = onCloseObject!;
    this.onOpenArray = onOpenArray!;
    this.onCloseArray = onCloseArray!;
    this.onEnd = onEnd!;
    this.onError = onError!;
    this.init();
  }

  // TODO CONSIDER MAKING IT PRIVATE
  init(): void {
    this.clearBuffers();
    this.bufferCheckPosition = this.maxBufferLength;
    this.q = "";
    this.c = "";
    this.p = "";
    this.closed = false;
    this.closedRoot = false;
    this.sawRoot = false;
    this.tag = null;
    this.error = null;
    this.state = this.S.BEGIN;
    this.stack = [];
    this.position = 0;
    this.column = 0;
    this.line = 1;
    this.slashed = false;
    this.unicodeI = 0;
    this.unicodeS = "";
    this.depth = 0;
    this.textNode = "";
    this.numberNode = "";
    this.onReady();
  }

  clearBuffers(): void {
    for (let buffer in this.buffers) {
      buffer = this.buffers[buffer];
    }
  }

  async emit(event: ParserEvent, data: any = null): Promise<void> {
    return new Promise(async (resolve) => {
      switch (event) {
        case ParserEvent.Value:
          await this.onValue(data);
          resolve();
          break;
        case ParserEvent.String:
          await this.onValue(data);
          resolve();
          break;
        case ParserEvent.Key:
          await this.onKey(data);
          resolve();
          break;
        case ParserEvent.OpenObject:
          await this.onOpenObject(data);
          resolve();
          break;
        case ParserEvent.CloseObject:
          await this.onCloseObject();
          resolve();
          break;
        case ParserEvent.OpenArray:
          await this.onOpenArray();
          resolve();
          break;
        case ParserEvent.CloseArray:
          await this.onCloseArray();
          resolve();
          break;
        case ParserEvent.Error:
          await this.onError(data);
          resolve();
          break;
        case ParserEvent.End:
          await this.onEnd();
          resolve();
          break;
        case ParserEvent.Ready:
          this.onReady();
          resolve();
          break;
      }
    });
  }

  async emitNode(event: ParserEvent, data: any = null): Promise<void> {
    await this.closeValue();
    await this.emit(event, data);
  }

  async closeValue(event: ParserEvent = undefined): Promise<void> {
    this.textNode = this.textOpts(this.opt, this.textNode);

    if (!!this.textNode) {
      await this.emit(event ? event : ParserEvent.Value, this.textNode);
    }
    this.textNode = "";
  }

  async closeNumber(): Promise<void> {
    if (this.numberNode) {
      await this.emit(ParserEvent.Value, parseFloat(this.numberNode));
    }
    this.numberNode = "";
  }

  private textOpts(opt: Options, text: string | undefined): string {
    if (text === undefined) {
      return "";
    }
    if (opt.trim) {
      text = text.trim();
    }

    if (opt.normalize) {
      text = text.replace(/\s+/g, " ");
    }

    return text;
  }

  async processError(err: string): Promise<void> {
    await this.closeValue();
    const errorText: string = `${err}\nLine: ${this.line}\nColumn: ${this.column}\nChar: ${this.c}`;
    const error = new Error(errorText);
    this.error = error;
    await this.emit(ParserEvent.Error, error);
  }

  async end(): Promise<void> {
    if (this.state !== this.S.VALUE || this.depth !== 0) {
      await this.processError("Unexpected end");
    }

    await this.closeValue();
    this.c = "";
    this.closed = true;
    await this.emit(ParserEvent.End);
    this.init();
  }

  isWhitespace(char: any): boolean {
    return (
      char === Char.carriageReturn ||
      char === Char.lineFeed ||
      char === Char.space ||
      char === Char.tab
    );
  }

  async checkBufferLength(): Promise<void> {
    const maxAllowed = Math.max(this.maxBufferLength, 10);
    let maxActual: number = 0;
    for (var buffer in this.buffers) {
      let len: number = buffer === undefined ? 0 : buffer.length;

      if (len > maxAllowed) {
        switch (buffer) {
          case "text":
            // closeText(parser); TODO CHECK THIS
            break;

          default:
            await this.processError("Max buffer length exceeded: " + buffer);
        }
      }
      maxActual = Math.max(maxActual, len);
    }
    this.bufferCheckPosition = this.maxBufferLength - maxActual + this.position;
  }

  resume(): void {
    this.error = null;
  }

  async close(): Promise<void> {
    await this.write(null);
  }

  async write(chunk): Promise<void> {
    return new Promise(async (resolve, reject) => {
      if (this.error) {
        reject(this.error);
      }

      if (this.closed) {
        await this.processError("Cannot write after close. Assign an onready handler.");
        resolve();
      }

      if (chunk === null) {
        await this.end();
        resolve();
      }

      let i: number = 0;
      let c: number = chunk?.charCodeAt(0);
      let p: any = this.p;
      let lockIncrements: boolean = false;
      // if (clarinet.DEBUG) console.log('write -> [' + chunk + ']');
      while (c) {
        p = c;
        this.c = c = chunk.charCodeAt(i++);
        // if chunk doesn't have next, like streaming char by char
        // this way we need to check if previous is really previous
        // if not we need to reset to what the parser says is the previous
        // from buffer
        if (p !== c) {
          this.p = p;
        } else {
          p = this.p;
        }

        if (!c) {
          resolve();
          break;
        }

        // if (clarinet.DEBUG) console.log(i, c, clarinet.STATE[parser.state]);
        if (!lockIncrements) {
          this.position++;
          if (c === Char.lineFeed) {
            this.line++;
            this.column = 0;
          } else {
            this.column++;
          }
        } else {
          lockIncrements = false;
        }
        switch (this.state) {
          case this.S.BEGIN:
            if (c === Char.openBrace) {
              this.state = this.S.OPEN_OBJECT;
            } else if (c === Char.openBracket) {
              this.state = this.S.OPEN_ARRAY;
            } else if (!this.isWhitespace(c)) {
              await this.processError("Non-whitespace before {[.");
            }
            continue;

          case this.S.OPEN_KEY:
          case this.S.OPEN_OBJECT:
            if (this.isWhitespace(c)) {
              continue;
            }
            if (this.state === this.S.OPEN_KEY) {
              this.stack.push(this.S.CLOSE_KEY);
            } else {
              if (c === Char.closeBrace) {
                await this.emit(ParserEvent.OpenObject);
                this.depth++;
                await this.emit(ParserEvent.CloseObject);
                this.depth--;
                this.state = this.stack.pop() || this.S.VALUE;
                continue;
              } else {
                this.stack.push(this.S.CLOSE_OBJECT);
              }
            }
            if (c === Char.doubleQuote) {
              this.state = this.S.STRING;
            } else {
              await this.processError('Malformed object key should start with "');
            }
            continue;

          case this.S.CLOSE_KEY:
          case this.S.CLOSE_OBJECT:
            if (this.isWhitespace(c)) {
              continue;
            }
            let event = this.state === this.S.CLOSE_KEY ? "key" : "object";

            if (c === Char.colon) {
              if (this.state === this.S.CLOSE_OBJECT) {
                this.stack.push(this.S.CLOSE_OBJECT);
                await this.closeValue(ParserEvent.OpenObject);
                this.depth++;
              } else {
                await this.closeValue(ParserEvent.Key);
              }
              this.state = this.S.VALUE;
            } else if (c === Char.closeBrace) {
              await this.emitNode(ParserEvent.CloseObject);
              this.depth--;
              this.state = this.stack.pop() || this.S.VALUE;
            } else if (c === Char.comma) {
              if (this.state === this.S.CLOSE_OBJECT) {
                this.stack.push(this.S.CLOSE_OBJECT);
              }
              await this.closeValue();
              this.state = this.S.OPEN_KEY;
            } else {
              await this.processError("Bad object");
            }
            continue;

          case this.S.OPEN_ARRAY: // after an array there always a value
          case this.S.VALUE:
            if (this.isWhitespace(c)) {
              continue;
            }
            if (this.state === this.S.OPEN_ARRAY) {
              await this.emit(ParserEvent.OpenArray);
              this.depth++;
              this.state = this.S.VALUE;
              if (c === Char.closeBracket) {
                await this.emit(ParserEvent.CloseArray);
                this.depth--;
                this.state = this.stack.pop() || this.S.VALUE;
                continue;
              } else {
                this.stack.push(this.S.CLOSE_ARRAY);
              }
            }
            if (c === Char.doubleQuote) {
              this.state = this.S.STRING;
            } else if (c === Char.openBrace) {
              this.state = this.S.OPEN_OBJECT;
            } else if (c === Char.openBracket) {
              this.state = this.S.OPEN_ARRAY;
            } else if (c === Char.t) {
              this.state = this.S.TRUE;
            } else if (c === Char.f) {
              this.state = this.S.FALSE;
            } else if (c === Char.n) {
              this.state = this.S.NULL;
            } else if (c === Char.minus) {
              // keep and continue
              this.numberNode += "-";
            } else if (Char._0 <= c && c <= Char._9) {
              this.numberNode += String.fromCharCode(c);
              this.state = this.S.NUMBER_DIGIT;
            } else {
              await this.processError("Bad value");
            }
            continue;

          case this.S.CLOSE_ARRAY:
            if (c === Char.comma) {
              this.stack.push(this.S.CLOSE_ARRAY);
              await this.closeValue(ParserEvent.Value);
              this.state = this.S.VALUE;
            } else if (c === Char.closeBracket) {
              await this.emitNode(ParserEvent.CloseArray);
              this.depth--;
              this.state = this.stack.pop() || this.S.VALUE;
            } else if (this.isWhitespace(c)) {
              continue;
            } else {
              await this.processError("Bad array");
            }
            continue;

          case this.S.STRING:
            if (this.textNode === undefined) {
              this.textNode = "";
            }

            // thanks thejh, this is an about 50% performance improvement.
            let starti: number = i - 1;
            let slashed: boolean = this.slashed;
            let unicodeI: number = this.unicodeI;
            STRING_BIGLOOP: while (true) {
              // if (clarinet.DEBUG) console.log(i, c, clarinet.STATE[parser.state], slashed);
              // zero means "no unicode active". 1-4 mean "parse some more". end after 4.
              while (unicodeI > 0) {
                this.unicodeS += String.fromCharCode(c);
                c = chunk.charCodeAt(i++);
                this.position++;
                if (unicodeI === 4) {
                  // TODO this might be slow? well, probably not used too often anyway
                  this.textNode += String.fromCharCode(parseInt(this.unicodeS, 16));
                  unicodeI = 0;
                  starti = i - 1;
                } else {
                  unicodeI++;
                }
                // we can just break here: no stuff we skipped that still has to be sliced out or so
                if (!c) {
                  break STRING_BIGLOOP;
                }
              }
              if (c === Char.doubleQuote && !slashed) {
                this.state = this.stack.pop() || this.S.VALUE;
                this.textNode += chunk.substring(starti, i - 1);
                this.position += i - 1 - starti;
                break;
              }
              if (c === Char.backslash && !slashed) {
                slashed = true;
                this.textNode += chunk.substring(starti, i - 1);
                this.position += i - 1 - starti;
                c = chunk.charCodeAt(i++);
                this.position++;
                if (!c) {
                  break;
                }
              }
              if (slashed) {
                slashed = false;
                if (c === Char.n) {
                  this.textNode += "\n";
                } else if (c === Char.r) {
                  this.textNode += "\r";
                } else if (c === Char.t) {
                  this.textNode += "\t";
                } else if (c === Char.f) {
                  this.textNode += "\f";
                } else if (c === Char.b) {
                  this.textNode += "\b";
                } else if (c === Char.u) {
                  // \uxxxx. meh!
                  unicodeI = 1;
                  this.unicodeS = "";
                } else {
                  this.textNode += String.fromCharCode(c);
                }
                c = chunk.charCodeAt(i++);
                this.position++;
                starti = i - 1;
                if (!c) {
                  break;
                } else {
                  continue;
                }
              }

              this.stringTokenPattern.lastIndex = i;
              const reResult = this.stringTokenPattern.exec(chunk);
              if (reResult === null) {
                i = chunk.length + 1;
                this.textNode += chunk.substring(starti, i - 1);
                this.position += i - 1 - starti;
                break;
              }
              i = reResult.index + 1;
              c = chunk.charCodeAt(reResult.index);
              if (!c) {
                this.textNode += chunk.substring(starti, i - 1);
                this.position += i - 1 - starti;
                break;
              }
            }
            this.slashed = slashed;
            this.unicodeI = unicodeI;
            continue;

          case this.S.TRUE:
            if (c === Char.r) {
              this.state = this.S.TRUE2;
            } else {
              await this.processError("Invalid true started with t" + c);
            }
            continue;

          case this.S.TRUE2:
            if (c === Char.u) {
              this.state = this.S.TRUE3;
            } else {
              await this.processError("Invalid true started with tr" + c);
            }
            continue;

          case this.S.TRUE3:
            if (c === Char.e) {
              await this.emit(ParserEvent.Value, true);
              this.state = this.stack.pop() || this.S.VALUE;
            } else {
              await this.processError("Invalid true started with tru" + c);
            }
            continue;

          case this.S.FALSE:
            if (c === Char.a) {
              this.state = this.S.FALSE2;
            } else {
              await this.processError("Invalid false started with f" + c);
            }
            continue;

          case this.S.FALSE2:
            if (c === Char.l) {
              this.state = this.S.FALSE3;
            } else {
              await this.processError("Invalid false started with fa" + c);
            }
            continue;

          case this.S.FALSE3:
            if (c === Char.s) {
              this.state = this.S.FALSE4;
            } else {
              await this.processError("Invalid false started with fal" + c);
            }
            continue;

          case this.S.FALSE4:
            if (c === Char.e) {
              await this.emit(ParserEvent.Value, false);
              this.state = this.stack.pop() || this.S.VALUE;
            } else {
              await this.processError("Invalid false started with fals" + c);
            }
            continue;

          case this.S.NULL:
            if (c === Char.u) {
              this.state = this.S.NULL2;
            } else {
              await this.processError("Invalid null started with n" + c);
            }
            continue;

          case this.S.NULL2:
            if (c === Char.l) {
              this.state = this.S.NULL3;
            } else {
              await this.processError("Invalid null started with nu" + c);
            }
            continue;

          case this.S.NULL3:
            if (c === Char.l) {
              await this.emit(ParserEvent.Value, null);
              this.state = this.stack.pop() || this.S.VALUE;
            } else {
              await this.processError("Invalid null started with nul" + c);
            }
            continue;

          case this.S.NUMBER_DECIMAL_POINT:
            if (c === Char.period) {
              this.numberNode += ".";
              this.state = this.S.NUMBER_DIGIT;
            } else {
              await this.processError("Leading zero not followed by .");
            }
            continue;

          case this.S.NUMBER_DIGIT:
            if (Char._0 <= c && c <= Char._9) {
              this.numberNode += String.fromCharCode(c);
            } else if (c === Char.period) {
              if (this.numberNode.indexOf(".") !== -1) {
                await this.processError("Invalid number has two dots");
              }
              this.numberNode += ".";
            } else if (c === Char.e || c === Char.E) {
              if (this.numberNode.indexOf("e") !== -1 || this.numberNode.indexOf("E") !== -1) {
                await this.processError("Invalid number has two exponential");
              }
              this.numberNode += "e";
            } else if (c === Char.plus || c === Char.minus) {
              if (!(p === Char.e || p === Char.E)) {
                await this.processError("Invalid symbol in number");
              }
              this.numberNode += String.fromCharCode(c);
            } else {
              await this.closeNumber();
              i--; // go back one
              lockIncrements = true; // do not apply increments for a single cycle
              this.state = this.stack.pop() || this.S.VALUE;
            }
            continue;

          default:
            await this.processError("Unknown state: " + this.state);
        }
      }

      if (this.position >= this.bufferCheckPosition) {
        await this.checkBufferLength();
      }

      resolve();
    });
  }

  private prepareState(): any {
    let S: number = 0;

    const state = {
      BEGIN: S++,
      VALUE: S++, // general stuff
      OPEN_OBJECT: S++, // {
      CLOSE_OBJECT: S++, // }
      OPEN_ARRAY: S++, // [
      CLOSE_ARRAY: S++, // ]
      TEXT_ESCAPE: S++, // \ stuff
      STRING: S++, // ""
      BACKSLASH: S++,
      END: S++, // No more stack
      OPEN_KEY: S++, // , "a"
      CLOSE_KEY: S++, // :
      TRUE: S++, // r
      TRUE2: S++, // u
      TRUE3: S++, // e
      FALSE: S++, // a
      FALSE2: S++, // l
      FALSE3: S++, // s
      FALSE4: S++, // e
      NULL: S++, // u
      NULL2: S++, // l
      NULL3: S++, // l
      NUMBER_DECIMAL_POINT: S++, // .
      NUMBER_DIGIT: S++, // [0-9]
    };

    for (let s_ in state) {
      state[state[s_]] = s_;
    }

    return state;
  }
}
