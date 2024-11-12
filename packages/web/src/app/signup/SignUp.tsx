import styled from "styled-components";
import { resetAnondTokenRequestResult, setCurrentFormId } from "./slice";
import { useAppDispatch, useAppSelector } from "./store";
import { CrunchLogoMain } from "../../icons";
import { AnondSignUpEmailForm, AnondSignUpTokenForm, PlatformSignUpForm } from "./SignUpForms";
import { ThemeColorVariables } from "@xliic/common/theme";

export function RightContainer() {
  const { currentFormId } = useAppSelector((state) => state.signup);

  return (
    <ColoredContainer>
      <CenterTextContainer>
        <CrunchMainLogoContainer>
          <CrunchLogoMain />
        </CrunchMainLogoContainer>
        {currentFormId === "AnondSignUpEmailForm" && (
          <Title>
            Register to check your API for quality, conformance and security vulnerabilities,
            including BOLA, BFLA & BOPLA
          </Title>
        )}
        {currentFormId === "AnondSignUpTokenForm" && (
          <>
            <Title>#1 API Security testing tools for your IDE, CICD and SaaS environments</Title>
          </>
        )}
        {currentFormId === "PlatformSignUpForm" && (
          <>
            <Title>API Capture</Title>
            <Text>Automatically generate OpenAPI definition files.</Text>
            <Title>API Protect</Title>
            <Text>Immediately protect APIs at runtime.</Text>
          </>
        )}
      </CenterTextContainer>
    </ColoredContainer>
  );
}

export function LeftContainer() {
  const dispatch = useAppDispatch();
  const { platformCredentials, anondCredentials, currentFormId } = useAppSelector(
    (state) => state.signup
  );
  return (
    <Container>
      <CenterContainer>
        {currentFormId === "PlatformSignUpForm" && (
          <PlatformSignUpForm
            data={platformCredentials}
            backToPrevForm={() => dispatch(setCurrentFormId("AnondSignUpEmailForm"))}
          />
        )}
        {currentFormId === "AnondSignUpEmailForm" && (
          <AnondSignUpEmailForm
            data={{ email: anondCredentials.email }}
            backToPrevForm={() => dispatch(setCurrentFormId("PlatformSignUpForm"))}
          />
        )}
        {currentFormId === "AnondSignUpTokenForm" && (
          <AnondSignUpTokenForm
            data={{ anondToken: anondCredentials.anondToken }}
            backToPrevForm={() => {
              dispatch(resetAnondTokenRequestResult());
            }}
            backToPlatformSignup={() => {
              dispatch(resetAnondTokenRequestResult());
              dispatch(setCurrentFormId("PlatformSignUpForm"));
            }}
          />
        )}
      </CenterContainer>
    </Container>
  );
}

const Container = styled.div`
  display: flex;
  align-items: center;
  width: 50%;
  background-color: var(${ThemeColorVariables.computedOne});
`;

const ColoredContainer = styled(Container)`
  background-color: var(${ThemeColorVariables.computedTwo});
`;

const CenterContainer = styled.div`
  margin-right: auto;
  margin-left: auto;
  margin-top: auto;
  margin-bottom: auto;
  width: 460px;
  height: 430px;

  // border-radius: 7px;
  // border-color: var(${ThemeColorVariables.border});
  // border-width: 2px;
  // border-style: solid;
`;

const CenterTextContainer = styled.div`
  margin: auto;
  width: 70%;
  min-height: 430px;
`;

const CrunchMainLogoContainer = styled.div`
  margin-bottom: 30px;
  > svg {
    width: 60px;
    height: 60px;
  }
`;

const Title = styled.p`
  font-size: 42px;
  line-height: 54px;
  font-weight: 700;
  margin-top: 10px;
  margin-bottom: 10px;
`;

const Text = styled.p`
  font-size: 26px;
  line-height: 36px;
  font-weight: 600;
`;
