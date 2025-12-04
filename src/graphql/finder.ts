export class GraphQlFinder {
  private readonly reg: any;

  constructor(reg: any) {
    this.reg = reg;
  }

  /*
   * Location Format
   * Pattern 1: Input Arguments
   *   {OperationType}.{fieldName}({argumentName}: {Type})
   *   Query.search(name: String)
   *   Query.search(in3[0]: String)
   * Pattern 2: Output Fields
   *   {OperationType}.{fieldName}().{nestedPath}: {Type}
   *   Query.search().User.name: String
   * Pattern 3: Nested with Lists
   *   Query.search().User.languages[0].Language.name: String!
   * Pattern 4: Directive Validation
   *   {directiveName}
   */
  public findTarget(parent: any | null, segment: string): any | null {
    if (parent === null) {
      for (const def of this.reg.definitions) {
        if (def.kind === "ObjectTypeDefinition" && def.name?.value === segment) {
          return def;
        }
      }
      for (const def of this.reg.definitions) {
        if (def.kind === "DirectiveDefinition" && def.name?.value === segment) {
          return def;
        }
      }
    } else if (parent.kind === "ObjectTypeDefinition") {
      for (const field of parent.fields) {
        if (field.name.value === segment) {
          return field;
        }
      }
    } else if (parent.kind === "FieldDefinition") {
      for (const def of this.reg.definitions) {
        if (def.kind === "ObjectTypeDefinition" && def.name?.value === segment) {
          return def;
        }
      }
      for (const directive of parent.directives) {
        for (const argument of directive.arguments) {
          if (argument.value && argument.value.kind === "ListValue") {
            for (const value of argument.value.values) {
              if (value.kind === "StringValue" && segment === value.value) {
                return value;
              }
            }
          } else if (argument.value && argument.value.kind === "StringValue") {
            if (segment === argument.value.value) {
              return argument.value;
            }
          }
        }
      }
    }
    return null;
  }
}
