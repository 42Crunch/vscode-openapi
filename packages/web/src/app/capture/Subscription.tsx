import styled from "styled-components";

import { ThemeColorVariables } from "@xliic/common/theme";
import { getEndpoints } from "@xliic/common/endpoints";

import { Banner, ErrorBanner } from "../../components/Banner";
import { useGetSubscriptionQuery } from "../../features/http-client/freemiumd-api";
import ProgressBar from "./ProgressBar";
import Button from "../../new-components/Button";
import { useAppDispatch, useAppSelector } from "./store";
import { openLink } from "./slice";

export default function Subscription({
  token,
  useDevEndpoints,
}: {
  token: string;
  useDevEndpoints: boolean;
}) {
  const { data, error, isLoading } = useGetSubscriptionQuery(token.trim(), {
    refetchOnFocus: true,
    pollingInterval: 1000 * 60 * 10, // refresh every 10 minutes
  });

  const dispatch = useAppDispatch();

  const authType = useAppSelector((state) => state.config.data.platformAuthType);

  const { upgradeUrl } = getEndpoints(useDevEndpoints);

  if (error) {
    return (
      <Container>
        <ErrorBanner message="Failed to load subscription status">
          {error.code} {error.message}
        </ErrorBanner>
      </Container>
    );
  }

  if (isLoading || data === undefined) {
    return (
      <Container>
        <Banner message="Loading..." />
      </Container>
    );
  }

  return (
    <Container>
      {authType === "anond-token" && (
        <>
          <Section>
            <Title>API Contract Generator</Title>
            <Subtitle>Monthly operations left</Subtitle>
            <Counters>
              {data.monthlyCapture - data.currentCaptureUsage} / {data.monthlyCapture}
            </Counters>
            <ProgressBar label="" progress={1 - data.currentCaptureUsage / data.monthlyCapture} />
          </Section>
          <Section>
            <Title>Subscription type: {data?.subscriptionKind}</Title>
            <Subtitle>Upgrade or manage your subscription plan</Subtitle>
            <Counters>
              {data.subscriptionKind === "free" && (
                <Button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    dispatch(openLink(`${upgradeUrl}?email=${encodeURIComponent(data.userEmail)}`));
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
                        `${upgradeUrl}?prefilled_email=${encodeURIComponent(data.userEmail)}`
                      )
                    );
                  }}
                >
                  Manage
                </Button>
              )}
            </Counters>
          </Section>
        </>
      )}
      {authType === "api-token" && (
        <>
          <Section>
            <Title>Tenant Allowance</Title>
            <Subtitle>Monthly operations left</Subtitle>
            <Counters>
              {data.monthlyCapture - data.currentCaptureUsage} / {data.monthlyCapture}
            </Counters>
            <ProgressBar label="" progress={1 - data.currentCaptureUsage / data.monthlyCapture} />
          </Section>
          <Section>
            <Title>Subscription type: {data?.subscriptionKind}</Title>
            <div></div>
            To upgrade or change your subscription plan please contact your administrator
          </Section>
        </>
      )}
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
