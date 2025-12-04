export const ARGUMENT_PATTERN = new RegExp("\\(.*:.*\\)$");
const LIST_TYPE_PATTERN = new RegExp(":\\s*\\[.*]!?$");
const SIMPLE_TYPE_PATTERN = new RegExp(":\\s*[^()\\[\\]]+$");

export class GraphQlLocator {
  public getPosition(target: any, lastSegment: string): any | null {
    if (target.kind === "StringValue") {
      return target.loc;
    }
    if (target.kind === "ObjectTypeDefinition" || target.kind === "DirectiveDefinition") {
      return target.name.loc;
    }
    if (target.kind === "FieldDefinition") {
      if (lastSegment.match(SIMPLE_TYPE_PATTERN) || lastSegment.match(LIST_TYPE_PATTERN)) {
        // id: ID
        // Mutation.usersAddEmailForAuthenticated()[0]: _
        // Notifications(): [Notification]
        // Query.starship().Starship.coordinates: [[Float!]!]
        return getTypeName(target.type).loc;
      }
      if (lastSegment.match(ARGUMENT_PATTERN)) {
        // Notifications(limit: Int)
        // Query.migration(exclude[0]: String)
        let name = getInputValueName(lastSegment);
        for (const def of target.arguments) {
          if (name === def.name?.value || name.startsWith(def.name.value + ".")) {
            return getTypeName(def.type).loc;
          }
        }
        return target.type.loc;
      } else {
        return target.loc;
      }
    }
    return null;
  }
}

function getInputValueName(segment: string): string {
  const name = segment.substring(segment.indexOf("(") + 1, segment.lastIndexOf(":")).trim();
  const i = name.indexOf("[");
  return i > 0 ? name.substring(0, i) : name;
}

function getTypeName(type: any) {
  if (type.kind === "NonNullType" || type.kind === "ListType") {
    return getTypeName(type.type);
  } else {
    return type;
  }
}
