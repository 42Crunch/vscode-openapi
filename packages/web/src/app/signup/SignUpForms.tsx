import styled from "styled-components";
import { useFormContext, useWatch } from "react-hook-form";
import {
  requestAnondTokenByEmail,
  saveAnondEmail,
  saveAnondToken,
  anondSignUpComplete,
  platformSignUpComplete,
  savePlatformCredentials,
  saveAgreeToTermsAndConditions,
  openLink,
  showTermsAndConditionsError,
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
import { ThemeColorVariables } from "@xliic/common/theme";

const doNothingWrapper = (data: any) => {
  return data;
};

export function AnondSignUpEmailForm({
  data,
  backToPrevForm,
}: {
  data: { email: string };
  backToPrevForm: () => void;
}) {
  const dispatch = useAppDispatch();
  const {
    agreeToTermsAndConditions,
    showTermsAndConditionsError,
    anondTokenRequestResult,
    waitingForAnondToken,
    complete,
  } = useAppSelector((state) => state.signup);
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
      useFormMode={"onBlur"}
    >
      <Container>
        <CenterHeaderContainer>
          <Text>Register</Text>
          <LinkButton
            text="I have an existing account"
            disabled={complete || waitingForAnondToken}
            backToPrevForm={backToPrevForm}
          />
        </CenterHeaderContainer>
        <InputContainer>
          <Input label="Email" name="email" disabled={complete} />
          <Title>Enter a valid email address to receive a once off access token.</Title>

          {anondTokenRequestResult && !anondTokenRequestResult.success && (
            <ErrorBannerContainer>
              <ErrorBanner message="Unexpected error when trying to request a token">
                {anondTokenRequestResult.message}
              </ErrorBanner>
            </ErrorBannerContainer>
          )}
          <AgreeToTermsAndConditionsCheckbox />
          {showTermsAndConditionsError && !agreeToTermsAndConditions && (
            <ErrorBanner message="Please accept Terms and Conditions to continue"></ErrorBanner>
          )}
          <div>
            Register for your free API security testing account to:
            <ul>
              <li>Audit your OpenAPI contracts for quality and conformance</li>
              <li>Scan your APIs for conformance and security vulnerabilities</li>
            </ul>
          </div>
        </InputContainer>
        <ButtonsBar>
          <ButtonSendEmail />
        </ButtonsBar>
      </Container>
    </Form>
  );
}

export function LinkButton({
  text,
  disabled,
  backToPrevForm,
}: {
  text: string;
  disabled: boolean;
  backToPrevForm: () => void;
}) {
  return (
    <LinkRef
      href="#"
      disabled={disabled}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        backToPrevForm();
      }}
    >
      {text}
    </LinkRef>
  );
}

export function ButtonSendEmail() {
  const dispatch = useAppDispatch();
  const { agreeToTermsAndConditions, waitingForAnondToken, complete } = useAppSelector(
    (state) => state.signup
  );
  const email = useWatch({ name: "email" });
  const {
    formState: { isValid },
  } = useFormContext();
  return (
    <NormalProgressButton
      label="Request a token"
      disabled={complete || !isValid}
      waiting={waitingForAnondToken}
      onClick={(e) => {
        if (agreeToTermsAndConditions) {
          dispatch(requestAnondTokenByEmail(email));
        } else {
          dispatch(showTermsAndConditionsError(true));
        }
        e.preventDefault();
        e.stopPropagation();
      }}
    />
  );
}

export function AnondSignUpTokenForm({
  data,
  backToPrevForm,
  backToPlatformSignup,
}: {
  data: { anondToken: string };
  backToPrevForm: () => void;
  backToPlatformSignup: () => void;
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
        <CenterHeaderContainer>
          <Text>Register</Text>
          <LinkButton
            text="I have an existing account"
            disabled={complete}
            backToPrevForm={backToPlatformSignup}
          />
        </CenterHeaderContainer>
        <InputContainer>
          <div>
            <p>
              We just sent you an access token to the email address you provided. Enter the token
              below to activate your API security testing account.
            </p>
            <p>If you did not get the token, check your spam mail.</p>

            <LinkButton
              text="Resubmit email request"
              disabled={complete}
              backToPrevForm={backToPrevForm}
            />
          </div>
          <Textarea label="Token" name="anondToken" disabled={complete} />

          <div>
            Audit and Scan usage allowances apply, upgrade{" "}
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                dispatch(openLink("https://42crunch.com/single-user-pricing/"));
              }}
            >
              options
            </a>{" "}
            available.
          </div>
          <div>
            Developer support{" "}
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                dispatch(openLink("https://developers.42crunch.com/"));
              }}
            >
              community
            </a>
          </div>
        </InputContainer>

        <ButtonsBar>
          <ButtonSaveAnondToken />
        </ButtonsBar>
      </Container>
    </Form>
  );
}

export function ButtonSaveAnondToken() {
  const dispatch = useAppDispatch();
  const { anondCredentials, complete } = useAppSelector((state) => state.signup);
  const anondToken = useWatch({ name: "anondToken" });
  console.log("my token", anondToken);
  const {
    formState: { isValid },
  } = useFormContext();
  return (
    <SimpleButton
      disabled={complete || !isValid}
      onClick={(e) => {
        dispatch(
          anondSignUpComplete({ email: anondCredentials.email, anondToken: anondToken.trim() })
        );
        e.preventDefault();
        e.stopPropagation();
      }}
    >
      Activate account
    </SimpleButton>
  );
}

export function PlatformSignUpForm({
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
        <CenterHeaderContainer>
          <Text>Sign in</Text>
          <LinkButton text="Register" disabled={complete} backToPrevForm={backToPrevForm} />
        </CenterHeaderContainer>
        <InputContainer>
          <Title>
            If you are an existing Teams or Enterprise customer, activate your account here.
          </Title>
          <Input label="Platform URL" name="platformUrl" disabled={complete} />
          <Input label="IDE token" name="platformApiToken" disabled={complete} password />
          {platformConnectionTestResult && (
            <ErrorBannerContainer>
              <ErrorBanner message="Failed to connect">
                {platformConnectionTestResult.error}
              </ErrorBanner>
            </ErrorBannerContainer>
          )}
        </InputContainer>
        <ButtonsBar>
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
      label="Activate account"
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
        label={
          <>
            I agree to the{" "}
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
          </>
        }
        size={"medium"}
      ></Checkbox>
    </AgreeToTermsAndConditionsBar>
  );
}

const CenterHeaderContainer = styled.div`
  // border-bottom-color: var(${ThemeColorVariables.border});
  // border-bottom-width: 1px;
  // border-bottom-style: solid;
  display: flex;
  flex-direction: row;
  flex-wrap: nowrap;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
`;

const Text = styled.p`
  margin: 0;
  font-size: 25px;
  line-height: 40px;
  font-weight: 600;
`;

const Title = styled.div`
  font-weight: normal;
`;

const Container = styled.div`
  display: flex;
  flex-wrap: wrap;
  flex-direction: column;
`;

const InputContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
  max-width: 560px;
  height: 250px;
  padding: 16px;
`;

const LinkRef = styled.a`
  text-decoration: none;
  ${({ disabled }: { disabled?: boolean }) => disabled && "opacity: 0.4;"}
  ${({ disabled }: { disabled?: boolean }) => disabled && "cursor: default;"}
  ${({ disabled }: { disabled?: boolean }) => disabled && "pointer-events: none;"}
`;

const ButtonsBar = styled.div`
  display: flex;
  gap: 16px;
  align-items: stretch;
  justify-content: center;
  flex-direction: column;
  padding: 16px;
  > button {
    height: 45px;
    border-radius: 2px;
  }
`;

const ErrorBannerContainer = styled.div`
  > div {
    max-width: 410px;
    word-wrap: break-word;
    overflow-y: auto;
    max-height: 50px;
  }
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
