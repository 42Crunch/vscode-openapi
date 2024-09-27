import styled from "styled-components";

import { ThemeColorVariables } from "@xliic/common/theme";

import { Banner, ErrorBanner } from "../../components/Banner";
import { useGetSubscriptionQuery } from "../../features/http-client/freemiumd-api";
import ProgressBar from "./ProgressBar";
import Button from "../../new-components/Button";
import { useAppDispatch } from "./store";
import { openLink } from "../../features/config/slice";

export default function Subscription({ token }: { token: string }) {
  const { data, error, isLoading } = useGetSubscriptionQuery(token);
  const dispatch = useAppDispatch();

  if (isLoading || data === undefined) {
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
      <Section>
        <Title>Subscription type: {data?.subscriptionKind}</Title>
        <Subtitle>Upgrade or manage your subscription plan</Subtitle>
        <Counters>
          {data.subscriptionKind === "free" && (
            <Button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                dispatch(
                  openLink(
                    `https://42crunch.com/developer-pricing/?email=${encodeURIComponent(
                      data.userEmail
                    )}`
                  )
                );
              }}
            >
              Upgrade
            </Button>
          )}
          {data.subscriptionKind !== "free" && (
            <Button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                dispatch(
                  openLink(
                    `http://billing.stripe.com/p/login/test_cN28zp7RgbGp3qobII?prefilled_email=${encodeURIComponent(
                      data.userEmail
                    )}`
                  )
                );
              }}
            >
              Manage
            </Button>
          )}
        </Counters>
      </Section>

      <Section>
        <Title>Subscription date</Title>
        <Subtitle>Date when your monthly allowance started</Subtitle>
        <Counters>{data.periodStart}</Counters>
      </Section>

      <Section>
        <Title>Audit</Title>
        <Subtitle>Monthly operation audits left</Subtitle>
        <Counters>
          {data.monthlyAudit - data.currentAuditUsage} / {data.monthlyAudit}
        </Counters>
        <ProgressBar reversed label="" progress={1 - data.currentAuditUsage / data.monthlyAudit} />
      </Section>

      <Section>
        <Title>Scan</Title>
        <Subtitle>Monthly operation scans left</Subtitle>
        <Counters>
          {data.monthlyScan - data.currentScanUsage} / {data.monthlyScan}
        </Counters>
        <ProgressBar reversed label="" progress={1 - data.currentScanUsage / data.monthlyScan} />
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
  > div {
    font-size: 80%;
  }
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
