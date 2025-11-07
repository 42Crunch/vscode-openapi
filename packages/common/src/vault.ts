export type Identity = {
  identity?: string;
};

export type CredentialMetadata = {
  attributes?: {
    expired?: boolean;
    disabled?: boolean;
  };
};

export type SecuritySchemeMetadata = {
  attributes?: {
    caseInsensitive?: boolean;
  };
};

export type DynamicCredential = Identity &
  CredentialMetadata & {
    type: "dynamic";
    workflowId: string;
    parameters?: Record<string, any>;
  };

/** A credential that contains a username and password, used with 'http' + 'basic' security schemes. */
export type BasicCredential = Identity &
  CredentialMetadata & {
    /** The username of the user. */
    username: string;
    /** The password of the user. */
    password: string;
  };

/** A credential that contains an API key, used with 'apiKey' security schemes. */
export type ApiKeyCredential = Identity &
  CredentialMetadata & {
    /** The value of the API Key. */
    key: string;
  };

/** A credential that contains a bearer token, along with the token format, used with "http" / "bearer" security schemes */
export type BearerCredential = Identity &
  CredentialMetadata & {
    /** The value of the bearer token. */
    token: string;
    /** The format of the bearer token. */
    format: string;
  };

/** A credential that contains an access token, used with 'oauth2' and 'openIdConnect' security schemes. */
export type AccessTokenCredential = Identity &
  CredentialMetadata & {
    token: string;
  };

/** A credential that contains a key pair, used for mTLS authentication */
export type KeyPairCredential = Identity &
  CredentialMetadata & {
    /** Specifies the format of the key file. Currently, only 'pkcs12' is supported. */
    format: "pkcs12";
    /** The PKCS12 data, base64 encoded */
    pkcsData: string;
    /** The password for the PKCS12 data */
    pkcsPassword: string;
  };

export type BasicSecurityScheme = SecuritySchemeMetadata & {
  type: "basic";
  credentials: Record<string, BasicCredential | DynamicCredential>;
};

export type BearerSecurityScheme = SecuritySchemeMetadata & {
  type: "bearer";
  credentials: Record<string, BearerCredential | DynamicCredential>;
};

export type ApiKeySecurityScheme = SecuritySchemeMetadata & {
  type: "apiKey";
  credentials: Record<string, ApiKeyCredential | DynamicCredential>;
};

export type OAuth2SecurityScheme = SecuritySchemeMetadata & {
  type: "oauth2";
  credentials: Record<string, AccessTokenCredential | DynamicCredential>;
};

export type OpenIdConnectSecurityScheme = SecuritySchemeMetadata & {
  type: "openIdConnect";
  credentials: Record<string, AccessTokenCredential | DynamicCredential>;
};

export type MutualTLSSecurityScheme = SecuritySchemeMetadata & {
  type: "mutualTLS";
  credentials: Record<string, KeyPairCredential | DynamicCredential>;
};

export type AliasSecurityScheme = {
  type: "alias";
  scheme: string;
};

/** Security scheme object, contains named credentials */
export type SecurityScheme =
  | BasicSecurityScheme
  | BearerSecurityScheme
  | ApiKeySecurityScheme
  | OAuth2SecurityScheme
  | OpenIdConnectSecurityScheme
  | MutualTLSSecurityScheme
  | AliasSecurityScheme;

export type Vault = {
  schemes: Record<string, SecurityScheme>;
};

export type SaveVaultMessage = { command: "saveVault"; payload: Vault };

export type LoadVaultMessage = { command: "loadVault"; payload: Vault };
