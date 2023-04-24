import styled from "styled-components";
import { DateTime } from "luxon";

import { ThemeColorVariables } from "@xliic/common/theme";
import {
  DataFormatEnum,
  DataFormatInteger,
  DataFormatString,
  FlattenedDataFormat,
} from "@xliic/common/data-dictionary";

import { AngleDown, AngleUp } from "../../icons";
import collapsible from "./collapsible";

export default function FormatCard({ format }: { format: FlattenedDataFormat }) {
  const [isOpen, toggle] = collapsible();

  return (
    <Container key={`${format.dictionaryId}-${format.name}`}>
      <Title collapsed={!isOpen} onClick={toggle}>
        <div>{isOpen ? <AngleUp /> : <AngleDown />}</div>
        <div>
          <TopDescription>{format.name}</TopDescription>
          <BottomDescription>
            Last updated on{" "}
            {DateTime.fromSeconds(parseInt(format.lastUpdate, 10)).toLocaleString(
              DateTime.DATETIME_MED
            )}
          </BottomDescription>
        </div>
      </Title>
      {isOpen && (
        <Content>
          <Description>{format.description}</Description>
          {renderCommonProperties(format)}
          {renderFormatSpecificProperties(format)}
        </Content>
      )}
    </Container>
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
    <Item>
      <div>{label}</div>
      <div>{value}</div>
    </Item>
  );
}

const Container = styled.div`
  margin: 8px;
  border: 1px solid var(${ThemeColorVariables.border});
`;

const Title = styled.div`
  display: flex;
  cursor: pointer;
  padding: 10px 10px 10px 0px;
  background-color: var(${ThemeColorVariables.computedOne});
  & > div:first-child {
    padding-left: 4px;
    padding-right: 8px;
    > svg {
      fill: var(${ThemeColorVariables.foreground});
    }
  }
  border-left: 5px solid transparent;
  ${({ collapsed }: { collapsed: boolean }) =>
    !collapsed &&
    `border-bottom: 1px solid var(${ThemeColorVariables.border});
    border-left: 5px solid var(${ThemeColorVariables.badgeBackground});`}
`;

const TopDescription = styled.div`
  font-weight: 600;
`;

const BottomDescription = styled.div`
  margin-top: 8px;
  display: flex;
  font-size: 90%;
  align-items: center;
  gap: 16px;
`;

const Content = styled.div`
  background-color: var(${ThemeColorVariables.computedOne});
  padding: 16px;
`;

const Description = styled.div`
  padding-bottom: 16px;
  border-bottom: 1px solid var(${ThemeColorVariables.border});
`;

const Item = styled.div`
  display: flex;
  padding: 8px 0;
  gap: 8px;
  & > div:first-child {
    flex: 1;
    opacity: 0.8;
  }
  & > div:last-child {
    line-break: anywhere;
    flex: 3;
  }
`;
