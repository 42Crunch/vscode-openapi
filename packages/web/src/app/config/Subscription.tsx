import styled from "styled-components";

import { ThemeColorVariables } from "@xliic/common/theme";

import { Banner, ErrorBanner } from "../../components/Banner";
import { useGetSubscriptionQuery } from "../../features/http-client/freemiumd-api";
import ProgressBar from "./ProgressBar";

export default function Subscription({ token }: { token: string }) {
  const { data, error, isLoading } = useGetSubscriptionQuery(token);

  if (isLoading) {
    return (
      <Container>
        <Banner message="Loading subscription status..." />
      </Container>
    );
  }

  if (error) {
    return (
      <Container>
        <ErrorBanner message="Failed to load subscription status">
          {error.code} {error.message}
        </ErrorBanner>
      </Container>
    );
  }

  return (
    <Container>
      <Title>Subscription</Title>

      <Section>
        <Title>Type</Title>
        <Subtitle>Subscription type</Subtitle>
        <Counters>{data?.subscriptionKind}</Counters>
      </Section>

      <Section>
        <Title>Billing period</Title>
        <Subtitle>Billing period starts</Subtitle>
        <Counters>{data?.periodStart}</Counters>
      </Section>

      <Section>
        <Title>Audit</Title>
        <Subtitle>Current audit usage</Subtitle>
        <Counters>
          {data?.currentAuditUsage} / {data?.monthlyAudit}
        </Counters>
        <ProgressBar progress={data!.currentAuditUsage / data!.monthlyAudit} />
      </Section>

      <Section>
        <Title>Scan</Title>
        <Subtitle>Current scan usage</Subtitle>
        <Counters>
          {data?.currentScanUsage} / {data?.monthlyScan}
        </Counters>
        <ProgressBar progress={data!.currentScanUsage / data!.monthlyScan} />
      </Section>
    </Container>
  );
}

const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-width: 560px;
`;

const Title = styled.div`
  font-weight: 700;
`;

const Subtitle = styled.div`
  font-weight: 400;
  font-size: 90%;
`;

const Counters = styled.div`
  font-weight: 600;
  font-size: 110%;
`;

const Section = styled.div`
  display: grid;
  grid-template-columns: 7fr 3fr;
  gap: 4px;
  padding-top: 8px;
  border-top: 1px solid var(${ThemeColorVariables.border});
  > ${Title} {
    grid-column: 1;
    grid-row: 1;
  }
  > ${Subtitle} {
    grid-column: 1;
    grid-row: 2;
  }
  > ${Counters} {
    grid-column: 2;
    grid-row: span 2;
    align-self: center;
    justify-self: end;
  }
  > :nth-child(4) {
    grid-column: span 2;
    grid-row: 3;
  }
`;
