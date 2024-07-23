import styled from "styled-components";
import { useFormContext, useWatch } from "react-hook-form";
import {
  requestAnondTokenByEmail,
  saveAnondEmail,
  saveAnondToken,
  resetAnondTokenRequestResult,
  anondSignUpComplete,
  platformSignUpComplete,
  savePlatformCredentials,
  saveAgreeToTermsAndConditions,
  openLink,
  setCurrentFormId,
} from "./slice";
import * as z from "zod";
import { NormalProgressButton } from "../../new-components/ProgressButton";
import Form from "../../new-components/Form";
import Input from "../../components/Input";
import { PlatformCredentials } from "@xliic/common/signup";
import { ErrorBanner } from "../../components/Banner";
import Textarea from "../../new-components/fat-fields/Textarea";
import { useAppDispatch, useAppSelector } from "./store";
import Button from "../../new-components/Button";
import { Checkbox } from "../../new-components/Checkbox";
import { useState } from "react";

const doNothingWrapper = (data: any) => {
  return data;
};

export default function BasicSignUpForm() {
  const dispatch = useAppDispatch();
  const { agreeToTermsAndConditions, platformCredentials, anondCredentials, currentFormId } =
    useAppSelector((state) => state.signup);
  const [showTermsAndConditionsError, setAcceptTermsAndConditionsError] = useState(false);
  return (
    <>
      {currentFormId === "BasicSignUpForm" && (
        <Container>
          <Title>
            42Crunch Audit runs 300+ checks for security best practices in your API. Use your
            existing platform credentials or provide an email to receive a freemium token.
          </Title>
          <ButtonsBar>
            <Button
              disabled={false}
              onClick={(e) => {
                if (agreeToTermsAndConditions) {
                  dispatch(setCurrentFormId("PlatformSignUpForm"));
                } else {
                  setAcceptTermsAndConditionsError(true);
                }
                e.preventDefault();
                e.stopPropagation();
              }}
            >
              I have an existing 42Crunch Platform account
            </Button>
            <Button
              disabled={false}
              onClick={(e) => {
                if (agreeToTermsAndConditions) {
                  dispatch(setCurrentFormId("AnondSignUpEmailForm"));
                } else {
                  setAcceptTermsAndConditionsError(true);
                }
                e.preventDefault();
                e.stopPropagation();
              }}
            >
              I'm a new user, please email me the token
            </Button>
          </ButtonsBar>
          {showTermsAndConditionsError && !agreeToTermsAndConditions && (
            <ErrorBannerContainer>
              <ErrorBanner message="Please accept Terms and Conditions to continue"></ErrorBanner>
            </ErrorBannerContainer>
          )}
          <AgreeToTermsAndConditionsCheckbox />
        </Container>
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
    </>
  );
}

function AnondSignUpEmailForm({
  data,
  backToPrevForm,
}: {
  data: { email: string };
  backToPrevForm: () => void;
}) {
  const dispatch = useAppDispatch();
  const { anondTokenRequestResult, waitingForAnondToken, complete } = useAppSelector(
    (state) => state.signup
  );
  const schema = z.object({
    email: z
      .string()
      .min(1, { message: "This field has to be filled." })
      .email("This is not a valid email."),
  });
  return (
    <Form
      data={data}
      saveData={(data) => dispatch(saveAnondEmail(data.email))}
      wrapFormData={doNothingWrapper}
      unwrapFormData={doNothingWrapper}
      schema={schema}
      useFormMode={"onChange"}
    >
      <Container>
        <Title>Enter your email to receive the token</Title>
        <InputContainer>
          <Input label="Email" name="email" disabled={complete} />
          {anondTokenRequestResult && !anondTokenRequestResult.success && (
            <ErrorBanner message="Unexpected error when trying to request token">
              {anondTokenRequestResult.message}
            </ErrorBanner>
          )}
        </InputContainer>
        <ButtonsBar>
          <ButtonBack disabled={complete || waitingForAnondToken} backToPrevForm={backToPrevForm} />
          <ButtonSendEmail />
        </ButtonsBar>
      </Container>
    </Form>
  );
}

function ButtonBack({
  disabled,
  backToPrevForm,
}: {
  disabled: boolean;
  backToPrevForm: () => void;
}) {
  return (
    <SimpleButton
      disabled={disabled}
      onClick={(e) => {
        backToPrevForm();
        e.preventDefault();
        e.stopPropagation();
      }}
    >
      Back
    </SimpleButton>
  );
}

function ButtonSendEmail() {
  const dispatch = useAppDispatch();
  const { waitingForAnondToken, complete } = useAppSelector((state) => state.signup);
  const email = useWatch({ name: "email" });
  const {
    formState: { isValid },
  } = useFormContext();
  return (
    <NormalProgressButton
      label="Request token"
      disabled={complete || !isValid}
      waiting={waitingForAnondToken}
      onClick={(e) => {
        dispatch(requestAnondTokenByEmail(email));
        e.preventDefault();
        e.stopPropagation();
      }}
    />
  );
}

function AnondSignUpTokenForm({
  data,
  backToPrevForm,
}: {
  data: { anondToken: string };
  backToPrevForm: () => void;
}) {
  const dispatch = useAppDispatch();
  const { complete } = useAppSelector((state) => state.signup);
  const schema = z.object({
    anondToken: z.string().min(1, { message: "This field has to be filled." }),
  });
  return (
    <Form
      data={data}
      saveData={(data) => dispatch(saveAnondToken(data.anondToken))}
      wrapFormData={doNothingWrapper}
      unwrapFormData={doNothingWrapper}
      schema={schema}
      useFormMode={"onChange"}
    >
      <Container>
        <Title>
          The token has been sent. If you don't get the mail within a couple minutes, check your
          spam folder and that the address is correct. Paste the token above.
        </Title>
        <InputContainer>
          <Textarea label="Freemium token" name="anondToken" disabled={complete} />
        </InputContainer>
        <ButtonsBar>
          <ButtonBack disabled={complete} backToPrevForm={backToPrevForm} />
          <ButtonSaveAnondToken />
        </ButtonsBar>
      </Container>
    </Form>
  );
}

function ButtonSaveAnondToken() {
  const dispatch = useAppDispatch();
  const { anondCredentials, waitingForAnondToken, complete } = useAppSelector(
    (state) => state.signup
  );
  const anondToken = useWatch({ name: "anondToken" });
  const {
    formState: { isValid },
  } = useFormContext();
  return (
    <SimpleButton
      disabled={complete || !isValid}
      onClick={(e) => {
        dispatch(anondSignUpComplete({ email: anondCredentials.email, anondToken }));
        e.preventDefault();
        e.stopPropagation();
      }}
    >
      Save
    </SimpleButton>
  );
}

function PlatformSignUpForm({
  data,
  backToPrevForm,
}: {
  data: PlatformCredentials;
  backToPrevForm: () => void;
}) {
  const dispatch = useAppDispatch();
  const { platformConnectionTestResult, complete } = useAppSelector((state) => state.signup);
  const schema = z.object({
    platformUrl: z.string().url().startsWith("https://"),
    platformApiToken: z
      .string()
      .regex(
        /^(ide_|api_)?[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
        "Token is invalid"
      ),
  });
  return (
    <Form
      data={data}
      saveData={(data) => dispatch(savePlatformCredentials(data))}
      wrapFormData={doNothingWrapper}
      unwrapFormData={doNothingWrapper}
      schema={schema}
      useFormMode={"onChange"}
    >
      <Container>
        <Title>Please enter 42Crunch Platform credentials</Title>
        <InputContainer>
          <Input label="Platform URL" name="platformUrl" disabled={complete} />
          <Input label="IDE token" name="platformApiToken" disabled={complete} password />
          {platformConnectionTestResult && (
            <ErrorBanner message="Failed to connect">
              {platformConnectionTestResult.error}
            </ErrorBanner>
          )}
        </InputContainer>
        <ButtonsBar>
          <ButtonBack disabled={complete} backToPrevForm={backToPrevForm} />
          <ButtonSavePlatformCredentials />
        </ButtonsBar>
      </Container>
    </Form>
  );
}

function ButtonSavePlatformCredentials() {
  const dispatch = useAppDispatch();
  const { waitingForPlatformConnectionTest, complete } = useAppSelector((state) => state.signup);
  const platformUrl = useWatch({ name: "platformUrl" });
  const platformApiToken = useWatch({ name: "platformApiToken" });
  const {
    formState: { isValid },
  } = useFormContext();
  return (
    <NormalProgressButton
      label="Save"
      disabled={complete || !isValid}
      waiting={waitingForPlatformConnectionTest}
      onClick={(e) => {
        dispatch(platformSignUpComplete({ platformUrl, platformApiToken }));
        e.preventDefault();
        e.stopPropagation();
      }}
    />
  );
}

export function AgreeToTermsAndConditionsCheckbox() {
  const dispatch = useAppDispatch();
  const { agreeToTermsAndConditions } = useAppSelector((state) => state.signup);
  return (
    <AgreeToTermsAndConditionsBar>
      <Checkbox
        value={agreeToTermsAndConditions}
        onChange={(value: boolean) => {
          dispatch(saveAgreeToTermsAndConditions(value));
        }}
        label={"By clicking checkbox you agree to our"}
        size={"medium"}
      ></Checkbox>
      <a
        href="#"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          dispatch(openLink("https://42crunch.com/websales-customer-agreement"));
        }}
      >
        terms & conditions
      </a>
    </AgreeToTermsAndConditionsBar>
  );
}

const Title = styled.div`
  font-weight: 700;
`;

const Container = styled.div`
  display: flex;
  flex-wrap: wrap;
  flex-direction: column;
  padding: 16px;
  gap: 16px;
`;

const InputContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  flex-direction: column;
  gap: 6px;
  max-width: 560px;
`;

const ButtonsBar = styled.div`
  display: flex;
  gap: 16px;
  align-items: center;
`;

const ErrorBannerContainer = styled.div`
  max-width: 600px;
`;

const AgreeToTermsAndConditionsBar = styled.div`
  display: flex;
  gap: 5px;
  align-items: center;
`;

const SimpleButton = styled(Button)`
  &:disabled {
    opacity: 0.4;
  }
`;
