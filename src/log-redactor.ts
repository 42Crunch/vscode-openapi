export type Scope =
  | "CMD_EXEC_ENV"
  | "CMD_EXEC_ARGS"
  | "REQUEST_QUERY"
  | "REQUEST_HEADER"
  | "REQUEST_BODY";

interface Rule {
  field: string | null;
  pattern: RegExp | null;
  mask: string;
  scope: Scope;
}

export class LogRedactor {
  public static readonly REDACTED = "[REDACTED]";
  public static readonly UUID_TOKEN =
    "((ide_)|(api_))?[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}";

  private readonly rules: Rule[] = [];
  private isRedactionEnabled: boolean = true;

  constructor(builder: LogBuilder) {
    this.rules.push(...builder.rules);
  }

  public setRedactionEnabled(status: boolean) {
    this.isRedactionEnabled = status;
  }

  public redactFieldValue(field: string, value: string, scope: Scope): string {
    if (!this.isRedactionEnabled) {
      return value;
    }
    for (const rule of this.rules) {
      if (rule.scope === scope && rule.field !== null && areFieldsEqual(rule.field, field, scope)) {
        if (scope === "CMD_EXEC_ARGS") {
          return value.startsWith("--") ? value : rule.mask;
        } else {
          return rule.mask;
        }
      }
    }
    return value;
  }

  public redact(value: string, scope: Scope): string {
    if (!this.isRedactionEnabled) {
      return value;
    }
    let result = value;
    for (const rule of this.rules) {
      if (rule.scope === scope && rule.pattern !== null) {
        result = result.replace(rule.pattern, rule.mask);
      }
    }
    return result;
  }
}

function areFieldsEqual(field1: string, field2: string, scope: Scope): boolean {
  if (scope === "REQUEST_HEADER") {
    // HTTP header names are case-insensitive according to the HTTP specification
    return field1.toLowerCase() === field2.toLowerCase();
  } else {
    return field1 === field2;
  }
}

export class LogBuilder {
  public readonly rules: Rule[] = [];

  constructor() {}

  public addRule(field: string, mask: string, scope: Scope): LogBuilder {
    this.rules.push({ field, pattern: null, mask, scope });
    return this;
  }

  public addHeaderRules(...fields: string[]): LogBuilder {
    for (const field of fields) {
      this.addRule(field, LogRedactor.REDACTED, "REQUEST_HEADER");
    }
    return this;
  }

  public addQueryRule(field: string): LogBuilder {
    return this.addRule(field, LogRedactor.REDACTED, "REQUEST_QUERY");
  }

  public addCmdExecArgsRule(field: string): LogBuilder {
    return this.addRule(field, LogRedactor.REDACTED, "CMD_EXEC_ARGS");
  }

  public addCmdExecEnvRules(...fields: string[]): LogBuilder {
    for (const field of fields) {
      this.addRule(field, LogRedactor.REDACTED, "CMD_EXEC_ENV");
    }
    return this;
  }

  public addRegExpRule(regExp: string, scope: Scope): LogBuilder {
    this.rules.push({
      field: null,
      pattern: new RegExp(regExp),
      mask: LogRedactor.REDACTED,
      scope,
    });
    return this;
  }

  public addUuidTokenRegExpRule(scope: Scope): LogBuilder {
    return this.addRegExpRule(LogRedactor.UUID_TOKEN, scope);
  }

  public build(): LogRedactor {
    return new LogRedactor(this);
  }
}
