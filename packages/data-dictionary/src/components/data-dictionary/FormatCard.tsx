import Card from "react-bootstrap/Card";
import Badge from "react-bootstrap/Badge";
import styled from "styled-components";
import * as dayjs from "dayjs";

import { ThemeColors } from "@xliic/common/theme";
import CollapsibleCaret from "@xliic/web-ui/CollapsibleCaret";
import {
  DataFormatEnum,
  DataFormatInteger,
  DataFormatString,
  FlattenedDataFormat,
} from "@xliic/common/data-dictionary";

import collapsible from "../../hooks/collapsible";

export default function FormatCard({ format }: { format: FlattenedDataFormat }) {
  const [isOpen, toggle] = collapsible();

  return (
    <StyledCard key={`${format.dictionaryId}-${format.name}`} style={{ margin: "1em" }}>
      <Card.Body>
        <CollapsibleCardTitle onClick={toggle}>
          <FormatName>{format.name}</FormatName>
          {format.pii === "yes" && <Gdpr bg="secondary">GDPR</Gdpr>}
          <CollapsibleCaret isOpen={isOpen} />
        </CollapsibleCardTitle>
        <CardSubtitle>
          Last updated on {dayjs.unix(format.lastUpdate).format("DD MMM YYYY")}
        </CardSubtitle>
        {isOpen && (
          <>
            <Description>{format.description}</Description>
            <Properties>
              {renderCommonProperties(format)}
              {renderFormatSpecificProperties(format)}
            </Properties>
          </>
        )}
      </Card.Body>
    </StyledCard>
  );
}

function renderCommonProperties(format: FlattenedDataFormat) {
  const sensitivity = {
    "1": "Not Sensitive",
    "2": "Low",
    "3": "Medium",
    "4": "High",
    "5": "Critical",
  };

  const sensitivityLabel: any = (sensitivity as any)[format.sensitivity] || "Unknown";

  return (
    <>
      <Property label="Name" value={format.name} />
      <Property label="Type" value={format.type} />
      {format.format && <Property label="Format" value={format.format} />}
      <Property label="Read only" value={`${format.readOnly}`} />
      <Property label="Write only" value={`${format.writeOnly}`} />
      <Property label="Nullable" value={`${format.writeOnly}`} />
      <Property label="GDPR-PII" value={format.pii} />
      <Property label="Object Identifier" value={format.objectIdentifier} />
      <Property label="Sensitivity" value={sensitivityLabel} />
      <Property label="Example" value={`${format.example}`} />
    </>
  );
}

function renderFormatSpecificProperties(format: FlattenedDataFormat) {
  if (format.type === "integer") {
    return <IntegerFormat format={format} />;
  } else if ("enum" in format) {
    return <EnumFormat format={format} />;
  }
  return <StringFormat format={format} />;
}

function StringFormat({ format }: { format: DataFormatString }) {
  return (
    <>
      <Property label="Pattern" value={format.pattern} />
      <Property label="Min length" value={`${format.minLength}`} />
      <Property label="Max length" value={`${format.maxLength}`} />
    </>
  );
}

function EnumFormat({ format }: { format: DataFormatEnum }) {
  return (
    <>
      <Property label="Enum" value={format.enum.join(", ")} />
      <Property label="Default" value={format.default} />
    </>
  );
}

function IntegerFormat({ format }: { format: DataFormatInteger }) {
  return (
    <>
      <Property label="Minimum" value={format.minimum} />
      <Property label="Maximum" value={format.maximum} />
      <Property label="Exclusive minimum" value={`${format.exclusiveMinimum}`} />
      <Property label="Exclusive maximum" value={`${format.exclusiveMaximum}`} />
      <Property label="Multiple Of" value={`${format.multipleOf}`} />
    </>
  );
}

function Property({ label, value }: { label: string; value: any }) {
  return (
    <PropertyItem>
      <PropertyLabel>{label}</PropertyLabel>
      <PropertyValue>{value}</PropertyValue>
    </PropertyItem>
  );
}

const StyledCard = styled(Card)`
  background-color: var(${ThemeColors.background});
  border-color: var(${ThemeColors.border});
`;

const CollapsibleCardTitle = styled(Card.Title)`
  display: flex;
  cursor: pointer;
`;

const CardSubtitle = styled(Card.Subtitle)`
  font-size: 0.75rem;
  padding-bottom: 1rem;
`;

const Gdpr = styled(Badge)`
  margin-right: 0.5rem;
`;

const FormatName = styled.div`
  flex: 1;
`;

const Description = styled.div`
  border-bottom: 1px solid var(${ThemeColors.border});
  padding-bottom: 1rem;
`;

const Properties = styled.ul`
  display: inline-block;
  padding-left: 0;
`;

const PropertyItem = styled.li`
  list-style: none;
  display: flex;
  align-items: center;
  padding: 6px;
`;

const PropertyLabel = styled.div`
  width: 120px;
  font-size: 0.85rem;
  flex-shrink: 0;
  margin-right: 1rem;
`;

const PropertyValue = styled.div`
  font-size: 0.85rem;
  overflow-wrap: break-word;
  max-width: 100%;
  text-overflow: ellipsis;
`;
