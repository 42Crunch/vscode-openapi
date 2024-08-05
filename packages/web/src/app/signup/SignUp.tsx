import styled from "styled-components";
import { resetAnondTokenRequestResult, setCurrentFormId } from "./slice";
import { useAppDispatch, useAppSelector } from "./store";
import { CrunchLogoMain } from "../../icons";
import { AnondSignUpEmailForm, AnondSignUpTokenForm, PlatformSignUpForm } from "./SignUpForms";
import { ThemeColorVariables } from "@xliic/common/theme";

export function RightContainer() {
  return (
    <ColoredContainer>
      <CenterTextContainer>
        <CrunchMainLogoContainer>
          <CrunchLogoMain />
        </CrunchMainLogoContainer>
        <Title>API Audit & Scan</Title>
        <Text>
          Ensure your API conforms to the API Contract and has no volnurabilities. Check for BOLA,
          BFLA and other OWASP API risks.
        </Text>
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
  background-color: var(${ThemeColorVariables.background});
`;

const ColoredContainer = styled(Container)`
  background-color: var(${ThemeColorVariables.computedOne});
`;

const CenterContainer = styled.div`
  margin-right: auto;
  margin-left: auto;
  margin-top: auto;
  margin-bottom: auto;
  width: 460px;
  height: 430px;
  border-radius: 7px;
  border-color: var(${ThemeColorVariables.border});
  border-width: 2px;
  border-style: solid;
`;

const CenterTextContainer = styled.div`
  margin: auto;
  width: 70%;
`;

const CrunchMainLogoContainer = styled.div`
  margin-bottom: 30px;
`;

const Title = styled.p`
  padding-bottom: 50px;
  margin: 0;
  font-size: 48px;
  line-height: 60px;
  font-weight: 700;
`;

const Text = styled.p`
  margin: 0;
  font-size: 30px;
  line-height: 40px;
  font-weight: 600;
`;
