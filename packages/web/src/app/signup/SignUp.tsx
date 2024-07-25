import styled from "styled-components";
import { resetAnondTokenRequestResult, setCurrentFormId } from "./slice";
import { useAppDispatch, useAppSelector } from "./store";
import Button from "../../new-components/Button";
import { CrunchLogo, CrunchLogoMain } from "../../icons";
import { AnondSignUpEmailForm, AnondSignUpTokenForm, PlatformSignUpForm } from "./SignUpForms";
import { ThemeColorVariables } from "@xliic/common/theme";

export function RightContainer() {
  return (
    <ColoredContainer>
      <CenterTextContainer>
        <CrunchMainLogoContainer>
          <CrunchLogoMain />
        </CrunchMainLogoContainer>
        <Title>Enjoying the API Security Audit?</Title>
        <Text>
          Check out API Conformance Scan once logged in to check for API contract vulnerabilities at
          run time.
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
        <FormContainer>
          {currentFormId === "BasicSignUpForm" && (
            <ButtonsContainer>
              <MainButton
                style={{ marginTop: "20px" }}
                onClick={(e) => {
                  dispatch(setCurrentFormId("PlatformSignUpForm"));
                  e.preventDefault();
                  e.stopPropagation();
                }}
              >
                Login
              </MainButton>
              <MainButton
                style={{ marginBottom: "20px" }}
                onClick={(e) => {
                  dispatch(setCurrentFormId("AnondSignUpEmailForm"));
                  e.preventDefault();
                  e.stopPropagation();
                }}
              >
                Signup
              </MainButton>
            </ButtonsContainer>
          )}
          {currentFormId === "PlatformSignUpForm" && (
            <PlatformSignUpForm
              data={platformCredentials}
              backToPrevForm={() => dispatch(setCurrentFormId("BasicSignUpForm"))}
            />
          )}
          {currentFormId === "AnondSignUpEmailForm" && (
            <AnondSignUpEmailForm
              data={{ email: anondCredentials.email }}
              backToPrevForm={() => dispatch(setCurrentFormId("BasicSignUpForm"))}
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
        </FormContainer>
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
  margin-top: 50%;
  margin-bottom: auto;
  width: 400px;
`;

const CenterTextContainer = styled.div`
  margin: auto;
  width: 70%;
`;

const CrunchLogoContainer = styled.div`
  display: flex;
  justify-content: center;
  margin-bottom: 10px;
`;

const CrunchMainLogoContainer = styled.div`
  margin-bottom: 30px;
`;

const FormContainer = styled.div`
  border-radius: 3px;
  border-color: var(${ThemeColorVariables.border});
  border-width: 2px;
  border-style: solid;
`;

const ButtonsContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  align-items: center;
`;

const MainButton = styled(Button)`
  width: 350px;
  margin-right: 20px;
  margin-left: 20px;
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
