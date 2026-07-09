// Sentinel id for the synthetic "mTLS" security scheme that is backed by
// playbook.securityProfile rather than an entry in authenticationDetails.
// It intentionally contains a ':' so it can never collide with a real
// credential id, which must match ENV_VAR_NAME_REGEX = /^([\w\-]+)$/.
export const MTLS_CREDENTIAL_ID = "mtls:profile";
