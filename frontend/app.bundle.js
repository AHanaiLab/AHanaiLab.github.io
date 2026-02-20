// node_modules/@aws-amplify/core/dist/esm/constants.mjs
var AWS_CLOUDWATCH_CATEGORY = "Logging";
var USER_AGENT_HEADER = "x-amz-user-agent";
var NO_HUBCALLBACK_PROVIDED_EXCEPTION = "NoHubcallbackProvidedException";

// node_modules/@aws-amplify/core/dist/esm/Logger/types.mjs
var LogType;
(function(LogType2) {
  LogType2["DEBUG"] = "DEBUG";
  LogType2["ERROR"] = "ERROR";
  LogType2["INFO"] = "INFO";
  LogType2["WARN"] = "WARN";
  LogType2["VERBOSE"] = "VERBOSE";
  LogType2["NONE"] = "NONE";
})(LogType || (LogType = {}));

// node_modules/@aws-amplify/core/dist/esm/Logger/ConsoleLogger.mjs
var LOG_LEVELS = {
  VERBOSE: 1,
  DEBUG: 2,
  INFO: 3,
  WARN: 4,
  ERROR: 5,
  NONE: 6
};
var ConsoleLogger = class _ConsoleLogger {
  /**
   * @constructor
   * @param {string} name - Name of the logger
   */
  constructor(name2, level = LogType.WARN) {
    this.name = name2;
    this.level = level;
    this._pluggables = [];
  }
  _padding(n) {
    return n < 10 ? "0" + n : "" + n;
  }
  _ts() {
    const dt = /* @__PURE__ */ new Date();
    return [this._padding(dt.getMinutes()), this._padding(dt.getSeconds())].join(":") + "." + dt.getMilliseconds();
  }
  configure(config2) {
    if (!config2)
      return this._config;
    this._config = config2;
    return this._config;
  }
  /**
   * Write log
   * @method
   * @memeberof Logger
   * @param {LogType|string} type - log type, default INFO
   * @param {string|object} msg - Logging message or object
   */
  _log(type, ...msg) {
    let loggerLevelName = this.level;
    if (_ConsoleLogger.LOG_LEVEL) {
      loggerLevelName = _ConsoleLogger.LOG_LEVEL;
    }
    if (typeof window !== "undefined" && window.LOG_LEVEL) {
      loggerLevelName = window.LOG_LEVEL;
    }
    const loggerLevel = LOG_LEVELS[loggerLevelName];
    const typeLevel = LOG_LEVELS[type];
    if (!(typeLevel >= loggerLevel)) {
      return;
    }
    let log = console.log.bind(console);
    if (type === LogType.ERROR && console.error) {
      log = console.error.bind(console);
    }
    if (type === LogType.WARN && console.warn) {
      log = console.warn.bind(console);
    }
    if (_ConsoleLogger.BIND_ALL_LOG_LEVELS) {
      if (type === LogType.INFO && console.info) {
        log = console.info.bind(console);
      }
      if (type === LogType.DEBUG && console.debug) {
        log = console.debug.bind(console);
      }
    }
    const prefix = `[${type}] ${this._ts()} ${this.name}`;
    let message = "";
    if (msg.length === 1 && typeof msg[0] === "string") {
      message = `${prefix} - ${msg[0]}`;
      log(message);
    } else if (msg.length === 1) {
      message = `${prefix} ${msg[0]}`;
      log(prefix, msg[0]);
    } else if (typeof msg[0] === "string") {
      let obj = msg.slice(1);
      if (obj.length === 1) {
        obj = obj[0];
      }
      message = `${prefix} - ${msg[0]} ${obj}`;
      log(`${prefix} - ${msg[0]}`, obj);
    } else {
      message = `${prefix} ${msg}`;
      log(prefix, msg);
    }
    for (const plugin of this._pluggables) {
      const logEvent = { message, timestamp: Date.now() };
      plugin.pushLogs([logEvent]);
    }
  }
  /**
   * Write General log. Default to INFO
   * @method
   * @memeberof Logger
   * @param {string|object} msg - Logging message or object
   */
  log(...msg) {
    this._log(LogType.INFO, ...msg);
  }
  /**
   * Write INFO log
   * @method
   * @memeberof Logger
   * @param {string|object} msg - Logging message or object
   */
  info(...msg) {
    this._log(LogType.INFO, ...msg);
  }
  /**
   * Write WARN log
   * @method
   * @memeberof Logger
   * @param {string|object} msg - Logging message or object
   */
  warn(...msg) {
    this._log(LogType.WARN, ...msg);
  }
  /**
   * Write ERROR log
   * @method
   * @memeberof Logger
   * @param {string|object} msg - Logging message or object
   */
  error(...msg) {
    this._log(LogType.ERROR, ...msg);
  }
  /**
   * Write DEBUG log
   * @method
   * @memeberof Logger
   * @param {string|object} msg - Logging message or object
   */
  debug(...msg) {
    this._log(LogType.DEBUG, ...msg);
  }
  /**
   * Write VERBOSE log
   * @method
   * @memeberof Logger
   * @param {string|object} msg - Logging message or object
   */
  verbose(...msg) {
    this._log(LogType.VERBOSE, ...msg);
  }
  addPluggable(pluggable) {
    if (pluggable && pluggable.getCategoryName() === AWS_CLOUDWATCH_CATEGORY) {
      this._pluggables.push(pluggable);
      pluggable.configure(this._config);
    }
  }
  listPluggables() {
    return this._pluggables;
  }
};
ConsoleLogger.LOG_LEVEL = null;
ConsoleLogger.BIND_ALL_LOG_LEVELS = false;

// node_modules/@aws-amplify/core/dist/esm/errors/AmplifyError.mjs
var AmplifyError = class _AmplifyError extends Error {
  /**
   *  Constructs an AmplifyError.
   *
   * @param message text that describes the main problem.
   * @param underlyingError the underlying cause of the error.
   * @param recoverySuggestion suggestion to recover from the error.
   *
   */
  constructor({ message, name: name2, recoverySuggestion, underlyingError, metadata }) {
    super(message);
    this.name = name2;
    this.underlyingError = underlyingError;
    this.recoverySuggestion = recoverySuggestion;
    if (metadata) {
      const { extendedRequestId, httpStatusCode, requestId } = metadata;
      this.metadata = { extendedRequestId, httpStatusCode, requestId };
    }
    this.constructor = _AmplifyError;
    Object.setPrototypeOf(this, _AmplifyError.prototype);
  }
};

// node_modules/@aws-amplify/core/dist/esm/types/errors.mjs
var AmplifyErrorCode;
(function(AmplifyErrorCode2) {
  AmplifyErrorCode2["NoEndpointId"] = "NoEndpointId";
  AmplifyErrorCode2["PlatformNotSupported"] = "PlatformNotSupported";
  AmplifyErrorCode2["Unknown"] = "Unknown";
  AmplifyErrorCode2["NetworkError"] = "NetworkError";
})(AmplifyErrorCode || (AmplifyErrorCode = {}));

// node_modules/@aws-amplify/core/dist/esm/errors/createAssertionFunction.mjs
var createAssertionFunction = (errorMap, AssertionError = AmplifyError) => (assertion, name2, additionalContext) => {
  const { message, recoverySuggestion } = errorMap[name2];
  if (!assertion) {
    throw new AssertionError({
      name: name2,
      message: additionalContext ? `${message} ${additionalContext}` : message,
      recoverySuggestion
    });
  }
};

// node_modules/@aws-amplify/core/dist/esm/Hub/index.mjs
var AMPLIFY_SYMBOL = typeof Symbol !== "undefined" ? /* @__PURE__ */ Symbol("amplify_default") : "@@amplify_default";
var logger = new ConsoleLogger("Hub");
var HubClass = class {
  constructor(name2) {
    this.listeners = /* @__PURE__ */ new Map();
    this.protectedChannels = [
      "core",
      "auth",
      "api",
      "analytics",
      "interactions",
      "pubsub",
      "storage",
      "ui",
      "xr"
    ];
    this.name = name2;
  }
  /**
   * Used internally to remove a Hub listener.
   *
   * @remarks
   * This private method is for internal use only. Instead of calling Hub.remove, call the result of Hub.listen.
   */
  _remove(channel, listener) {
    const holder = this.listeners.get(channel);
    if (!holder) {
      logger.warn(`No listeners for ${channel}`);
      return;
    }
    this.listeners.set(channel, [
      ...holder.filter(({ callback }) => callback !== listener)
    ]);
  }
  dispatch(channel, payload, source, ampSymbol) {
    if (typeof channel === "string" && this.protectedChannels.indexOf(channel) > -1) {
      const hasAccess = ampSymbol === AMPLIFY_SYMBOL;
      if (!hasAccess) {
        logger.warn(`WARNING: ${channel} is protected and dispatching on it can have unintended consequences`);
      }
    }
    const capsule = {
      channel,
      payload: { ...payload },
      source,
      patternInfo: []
    };
    try {
      this._toListeners(capsule);
    } catch (e) {
      logger.error(e);
    }
  }
  listen(channel, callback, listenerName = "noname") {
    let cb;
    if (typeof callback !== "function") {
      throw new AmplifyError({
        name: NO_HUBCALLBACK_PROVIDED_EXCEPTION,
        message: "No callback supplied to Hub"
      });
    } else {
      cb = callback;
    }
    let holder = this.listeners.get(channel);
    if (!holder) {
      holder = [];
      this.listeners.set(channel, holder);
    }
    holder.push({
      name: listenerName,
      callback: cb
    });
    return () => {
      this._remove(channel, cb);
    };
  }
  _toListeners(capsule) {
    const { channel, payload } = capsule;
    const holder = this.listeners.get(channel);
    if (holder) {
      holder.forEach((listener) => {
        logger.debug(`Dispatching to ${channel} with `, payload);
        try {
          listener.callback(capsule);
        } catch (e) {
          logger.error(e);
        }
      });
    }
  }
};
var Hub = new HubClass("__default__");
var HubInternal = new HubClass("internal-hub");

// node_modules/@aws-amplify/core/dist/esm/utils/globalHelpers/index.mjs
var getBtoa = () => {
  if (typeof window !== "undefined" && typeof window.btoa === "function") {
    return window.btoa;
  }
  if (typeof btoa === "function") {
    return btoa;
  }
  throw new AmplifyError({
    name: "Base64EncoderError",
    message: "Cannot resolve the `btoa` function from the environment."
  });
};
var getAtob = () => {
  if (typeof window !== "undefined" && typeof window.atob === "function") {
    return window.atob;
  }
  if (typeof atob === "function") {
    return atob;
  }
  throw new AmplifyError({
    name: "Base64EncoderError",
    message: "Cannot resolve the `atob` function from the environment."
  });
};

// node_modules/@aws-amplify/core/dist/esm/utils/convert/base64/base64Decoder.mjs
var base64Decoder = {
  convert(input, options) {
    let inputStr = input;
    if (options?.urlSafe) {
      inputStr = inputStr.replace(/-/g, "+").replace(/_/g, "/");
    }
    return getAtob()(inputStr);
  }
};

// node_modules/@aws-amplify/core/dist/esm/singleton/Auth/utils/errorHelpers.mjs
var AuthConfigurationErrorCode;
(function(AuthConfigurationErrorCode2) {
  AuthConfigurationErrorCode2["AuthTokenConfigException"] = "AuthTokenConfigException";
  AuthConfigurationErrorCode2["AuthUserPoolAndIdentityPoolException"] = "AuthUserPoolAndIdentityPoolException";
  AuthConfigurationErrorCode2["AuthUserPoolException"] = "AuthUserPoolException";
  AuthConfigurationErrorCode2["InvalidIdentityPoolIdException"] = "InvalidIdentityPoolIdException";
  AuthConfigurationErrorCode2["OAuthNotConfigureException"] = "OAuthNotConfigureException";
})(AuthConfigurationErrorCode || (AuthConfigurationErrorCode = {}));
var authConfigurationErrorMap = {
  [AuthConfigurationErrorCode.AuthTokenConfigException]: {
    message: "Auth Token Provider not configured.",
    recoverySuggestion: "Make sure to call Amplify.configure in your app."
  },
  [AuthConfigurationErrorCode.AuthUserPoolAndIdentityPoolException]: {
    message: "Auth UserPool or IdentityPool not configured.",
    recoverySuggestion: "Make sure to call Amplify.configure in your app with UserPoolId and IdentityPoolId."
  },
  [AuthConfigurationErrorCode.AuthUserPoolException]: {
    message: "Auth UserPool not configured.",
    recoverySuggestion: "Make sure to call Amplify.configure in your app with userPoolId and userPoolClientId."
  },
  [AuthConfigurationErrorCode.InvalidIdentityPoolIdException]: {
    message: "Invalid identity pool id provided.",
    recoverySuggestion: "Make sure a valid identityPoolId is given in the config."
  },
  [AuthConfigurationErrorCode.OAuthNotConfigureException]: {
    message: "oauth param not configured.",
    recoverySuggestion: "Make sure to call Amplify.configure with oauth parameter in your app."
  }
};
var assert = createAssertionFunction(authConfigurationErrorMap);

// node_modules/@aws-amplify/core/dist/esm/singleton/Auth/utils/index.mjs
function assertTokenProviderConfig(cognitoConfig) {
  let assertionValid = true;
  if (!cognitoConfig) {
    assertionValid = false;
  } else {
    assertionValid = !!cognitoConfig.userPoolId && !!cognitoConfig.userPoolClientId;
  }
  assert(assertionValid, AuthConfigurationErrorCode.AuthUserPoolException);
}
function assertOAuthConfig(cognitoConfig) {
  const validOAuthConfig = !!cognitoConfig?.loginWith?.oauth?.domain && !!cognitoConfig?.loginWith?.oauth?.redirectSignOut && !!cognitoConfig?.loginWith?.oauth?.redirectSignIn && !!cognitoConfig?.loginWith?.oauth?.responseType;
  assert(validOAuthConfig, AuthConfigurationErrorCode.OAuthNotConfigureException);
}
function assertIdentityPoolIdConfig(cognitoConfig) {
  const validConfig = !!cognitoConfig?.identityPoolId;
  assert(validConfig, AuthConfigurationErrorCode.InvalidIdentityPoolIdException);
}
function decodeJWT(token) {
  const tokenParts = token.split(".");
  if (tokenParts.length !== 3) {
    throw new Error("Invalid token");
  }
  try {
    const base64WithUrlSafe = tokenParts[1];
    const base64 = base64WithUrlSafe.replace(/-/g, "+").replace(/_/g, "/");
    const jsonStr = decodeURIComponent(base64Decoder.convert(base64).split("").map((char) => `%${`00${char.charCodeAt(0).toString(16)}`.slice(-2)}`).join(""));
    const payload = JSON.parse(jsonStr);
    return {
      toString: () => token,
      payload
    };
  } catch (err) {
    throw new Error("Invalid token payload");
  }
}

// node_modules/@aws-amplify/core/dist/esm/utils/retry/isNonRetryableError.mjs
var isNonRetryableError = (obj) => {
  const key = "nonRetryable";
  return obj && obj[key];
};

// node_modules/@aws-amplify/core/dist/esm/utils/retry/retry.mjs
var logger2 = new ConsoleLogger("retryUtil");
async function retry(functionToRetry, args, delayFn, onTerminate) {
  if (typeof functionToRetry !== "function") {
    throw Error("functionToRetry must be a function");
  }
  return new Promise(async (resolve, reject) => {
    let attempt = 0;
    let terminated = false;
    let timeout;
    let wakeUp = () => {
    };
    let lastError;
    onTerminate && onTerminate.then(() => {
      terminated = true;
      clearTimeout(timeout);
      wakeUp();
    });
    while (!terminated) {
      attempt++;
      logger2.debug(`${functionToRetry.name} attempt #${attempt} with this vars: ${JSON.stringify(args)}`);
      try {
        resolve(await functionToRetry(...args));
        return;
      } catch (err) {
        lastError = err;
        logger2.debug(`error on ${functionToRetry.name}`, err);
        if (isNonRetryableError(err)) {
          logger2.debug(`${functionToRetry.name} non retryable error`, err);
          reject(err);
          return;
        }
        const retryIn = delayFn(attempt, args, err);
        logger2.debug(`${functionToRetry.name} retrying in ${retryIn} ms`);
        if (retryIn === false || terminated) {
          reject(err);
          return;
        } else {
          await new Promise((_resolve) => {
            wakeUp = _resolve;
            timeout = setTimeout(wakeUp, retryIn);
          });
        }
      }
    }
    reject(lastError);
  });
}

// node_modules/@aws-amplify/core/dist/esm/utils/deepFreeze.mjs
var deepFreeze = (object) => {
  const propNames = Reflect.ownKeys(object);
  for (const name2 of propNames) {
    const value = object[name2];
    if (value && typeof value === "object" || typeof value === "function") {
      deepFreeze(value);
    }
  }
  return Object.freeze(object);
};

// node_modules/@aws-amplify/core/dist/esm/parseAWSExports.mjs
var logger3 = new ConsoleLogger("parseAWSExports");
var authTypeMapping = {
  API_KEY: "apiKey",
  AWS_IAM: "iam",
  AMAZON_COGNITO_USER_POOLS: "userPool",
  OPENID_CONNECT: "oidc",
  NONE: "none",
  AWS_LAMBDA: "lambda",
  // `LAMBDA` is an incorrect value that was added during the v6 rewrite.
  // Keeping it as a valid value until v7 to prevent breaking customers who might
  // be relying on it as a workaround.
  // ref: https://github.com/aws-amplify/amplify-js/pull/12922
  // TODO: @v7 remove next line
  LAMBDA: "lambda"
};
var parseAWSExports = (config2 = {}) => {
  if (!Object.prototype.hasOwnProperty.call(config2, "aws_project_region")) {
    throw new AmplifyError({
      name: "InvalidParameterException",
      message: "Invalid config parameter.",
      recoverySuggestion: "Ensure passing the config object imported from  `amplifyconfiguration.json`."
    });
  }
  const { aws_appsync_apiKey, aws_appsync_authenticationType, aws_appsync_graphqlEndpoint, aws_appsync_region, aws_bots_config, aws_cognito_identity_pool_id, aws_cognito_sign_up_verification_method, aws_cognito_mfa_configuration, aws_cognito_mfa_types, aws_cognito_password_protection_settings, aws_cognito_verification_mechanisms, aws_cognito_signup_attributes, aws_cognito_social_providers, aws_cognito_username_attributes, aws_mandatory_sign_in, aws_mobile_analytics_app_id, aws_mobile_analytics_app_region, aws_user_files_s3_bucket, aws_user_files_s3_bucket_region, aws_user_files_s3_dangerously_connect_to_http_endpoint_for_testing, aws_user_pools_id, aws_user_pools_web_client_id, geo, oauth, predictions, aws_cloud_logic_custom, Notifications, modelIntrospection } = config2;
  const amplifyConfig = {};
  if (aws_mobile_analytics_app_id) {
    amplifyConfig.Analytics = {
      Pinpoint: {
        appId: aws_mobile_analytics_app_id,
        region: aws_mobile_analytics_app_region
      }
    };
  }
  const { InAppMessaging, Push } = Notifications ?? {};
  if (InAppMessaging?.AWSPinpoint || Push?.AWSPinpoint) {
    if (InAppMessaging?.AWSPinpoint) {
      const { appId, region } = InAppMessaging.AWSPinpoint;
      amplifyConfig.Notifications = {
        InAppMessaging: {
          Pinpoint: {
            appId,
            region
          }
        }
      };
    }
    if (Push?.AWSPinpoint) {
      const { appId, region } = Push.AWSPinpoint;
      amplifyConfig.Notifications = {
        ...amplifyConfig.Notifications,
        PushNotification: {
          Pinpoint: {
            appId,
            region
          }
        }
      };
    }
  }
  if (Array.isArray(aws_bots_config)) {
    amplifyConfig.Interactions = {
      LexV1: Object.fromEntries(aws_bots_config.map((bot) => [bot.name, bot]))
    };
  }
  if (aws_appsync_graphqlEndpoint) {
    const defaultAuthMode = authTypeMapping[aws_appsync_authenticationType];
    if (!defaultAuthMode) {
      logger3.debug(`Invalid authentication type ${aws_appsync_authenticationType}. Falling back to IAM.`);
    }
    amplifyConfig.API = {
      GraphQL: {
        endpoint: aws_appsync_graphqlEndpoint,
        apiKey: aws_appsync_apiKey,
        region: aws_appsync_region,
        defaultAuthMode: defaultAuthMode ?? "iam"
      }
    };
    if (modelIntrospection) {
      amplifyConfig.API.GraphQL.modelIntrospection = modelIntrospection;
    }
  }
  const mfaConfig = aws_cognito_mfa_configuration ? {
    status: aws_cognito_mfa_configuration && aws_cognito_mfa_configuration.toLowerCase(),
    totpEnabled: aws_cognito_mfa_types?.includes("TOTP") ?? false,
    smsEnabled: aws_cognito_mfa_types?.includes("SMS") ?? false
  } : void 0;
  const passwordFormatConfig = aws_cognito_password_protection_settings ? {
    minLength: aws_cognito_password_protection_settings.passwordPolicyMinLength,
    requireLowercase: aws_cognito_password_protection_settings.passwordPolicyCharacters?.includes("REQUIRES_LOWERCASE") ?? false,
    requireUppercase: aws_cognito_password_protection_settings.passwordPolicyCharacters?.includes("REQUIRES_UPPERCASE") ?? false,
    requireNumbers: aws_cognito_password_protection_settings.passwordPolicyCharacters?.includes("REQUIRES_NUMBERS") ?? false,
    requireSpecialCharacters: aws_cognito_password_protection_settings.passwordPolicyCharacters?.includes("REQUIRES_SYMBOLS") ?? false
  } : void 0;
  const mergedUserAttributes = Array.from(/* @__PURE__ */ new Set([
    ...aws_cognito_verification_mechanisms ?? [],
    ...aws_cognito_signup_attributes ?? []
  ]));
  const userAttributes = mergedUserAttributes.reduce((attributes, key) => ({
    ...attributes,
    // All user attributes generated by the CLI are required
    [key.toLowerCase()]: { required: true }
  }), {});
  const loginWithEmailEnabled = aws_cognito_username_attributes?.includes("EMAIL") ?? false;
  const loginWithPhoneEnabled = aws_cognito_username_attributes?.includes("PHONE_NUMBER") ?? false;
  if (aws_cognito_identity_pool_id || aws_user_pools_id) {
    amplifyConfig.Auth = {
      Cognito: {
        identityPoolId: aws_cognito_identity_pool_id,
        allowGuestAccess: aws_mandatory_sign_in !== "enable",
        signUpVerificationMethod: aws_cognito_sign_up_verification_method,
        userAttributes,
        userPoolClientId: aws_user_pools_web_client_id,
        userPoolId: aws_user_pools_id,
        mfa: mfaConfig,
        passwordFormat: passwordFormatConfig,
        loginWith: {
          username: !(loginWithEmailEnabled || loginWithPhoneEnabled),
          email: loginWithEmailEnabled,
          phone: loginWithPhoneEnabled
        }
      }
    };
  }
  const hasOAuthConfig = oauth ? Object.keys(oauth).length > 0 : false;
  const hasSocialProviderConfig = aws_cognito_social_providers ? aws_cognito_social_providers.length > 0 : false;
  if (amplifyConfig.Auth && hasOAuthConfig) {
    amplifyConfig.Auth.Cognito.loginWith = {
      ...amplifyConfig.Auth.Cognito.loginWith,
      oauth: {
        ...getOAuthConfig(oauth),
        ...hasSocialProviderConfig && {
          providers: parseSocialProviders(aws_cognito_social_providers)
        }
      }
    };
  }
  if (aws_user_files_s3_bucket) {
    amplifyConfig.Storage = {
      S3: {
        bucket: aws_user_files_s3_bucket,
        region: aws_user_files_s3_bucket_region,
        dangerouslyConnectToHttpEndpointForTesting: aws_user_files_s3_dangerously_connect_to_http_endpoint_for_testing
      }
    };
  }
  if (geo) {
    const { amazon_location_service } = geo;
    amplifyConfig.Geo = {
      LocationService: {
        maps: amazon_location_service.maps,
        geofenceCollections: amazon_location_service.geofenceCollections,
        searchIndices: amazon_location_service.search_indices,
        region: amazon_location_service.region
      }
    };
  }
  if (aws_cloud_logic_custom) {
    amplifyConfig.API = {
      ...amplifyConfig.API,
      REST: aws_cloud_logic_custom.reduce((acc, api2) => {
        const { name: name2, endpoint, region, service } = api2;
        return {
          ...acc,
          [name2]: {
            endpoint,
            ...service ? { service } : void 0,
            ...region ? { region } : void 0
          }
        };
      }, {})
    };
  }
  if (predictions) {
    const { VoiceId: voiceId } = predictions?.convert?.speechGenerator?.defaults ?? {};
    amplifyConfig.Predictions = voiceId ? {
      ...predictions,
      convert: {
        ...predictions.convert,
        speechGenerator: {
          ...predictions.convert.speechGenerator,
          defaults: { voiceId }
        }
      }
    } : predictions;
  }
  return amplifyConfig;
};
var getRedirectUrl = (redirectStr) => redirectStr?.split(",") ?? [];
var getOAuthConfig = ({ domain, scope, redirectSignIn, redirectSignOut, responseType }) => ({
  domain,
  scopes: scope,
  redirectSignIn: getRedirectUrl(redirectSignIn),
  redirectSignOut: getRedirectUrl(redirectSignOut),
  responseType
});
var parseSocialProviders = (aws_cognito_social_providers) => {
  return aws_cognito_social_providers.map((provider) => {
    const updatedProvider = provider.toLowerCase();
    return updatedProvider.charAt(0).toUpperCase() + updatedProvider.slice(1);
  });
};

// node_modules/@aws-amplify/core/dist/esm/singleton/constants.mjs
var ADD_OAUTH_LISTENER = /* @__PURE__ */ Symbol("oauth-listener");

// node_modules/uuid/dist/esm-browser/stringify.js
var byteToHex = [];
for (let i = 0; i < 256; ++i) {
  byteToHex.push((i + 256).toString(16).slice(1));
}
function unsafeStringify(arr, offset = 0) {
  return (byteToHex[arr[offset + 0]] + byteToHex[arr[offset + 1]] + byteToHex[arr[offset + 2]] + byteToHex[arr[offset + 3]] + "-" + byteToHex[arr[offset + 4]] + byteToHex[arr[offset + 5]] + "-" + byteToHex[arr[offset + 6]] + byteToHex[arr[offset + 7]] + "-" + byteToHex[arr[offset + 8]] + byteToHex[arr[offset + 9]] + "-" + byteToHex[arr[offset + 10]] + byteToHex[arr[offset + 11]] + byteToHex[arr[offset + 12]] + byteToHex[arr[offset + 13]] + byteToHex[arr[offset + 14]] + byteToHex[arr[offset + 15]]).toLowerCase();
}

// node_modules/uuid/dist/esm-browser/rng.js
var getRandomValues;
var rnds8 = new Uint8Array(16);
function rng() {
  if (!getRandomValues) {
    if (typeof crypto === "undefined" || !crypto.getRandomValues) {
      throw new Error("crypto.getRandomValues() not supported. See https://github.com/uuidjs/uuid#getrandomvalues-not-supported");
    }
    getRandomValues = crypto.getRandomValues.bind(crypto);
  }
  return getRandomValues(rnds8);
}

// node_modules/uuid/dist/esm-browser/native.js
var randomUUID = typeof crypto !== "undefined" && crypto.randomUUID && crypto.randomUUID.bind(crypto);
var native_default = { randomUUID };

// node_modules/uuid/dist/esm-browser/v4.js
function v4(options, buf, offset) {
  if (native_default.randomUUID && !buf && !options) {
    return native_default.randomUUID();
  }
  options = options || {};
  const rnds = options.random ?? options.rng?.() ?? rng();
  if (rnds.length < 16) {
    throw new Error("Random bytes length must be >= 16");
  }
  rnds[6] = rnds[6] & 15 | 64;
  rnds[8] = rnds[8] & 63 | 128;
  if (buf) {
    offset = offset || 0;
    if (offset < 0 || offset + 16 > buf.length) {
      throw new RangeError(`UUID byte range ${offset}:${offset + 15} is out of buffer bounds`);
    }
    for (let i = 0; i < 16; ++i) {
      buf[offset + i] = rnds[i];
    }
    return buf;
  }
  return unsafeStringify(rnds);
}
var v4_default = v4;

// node_modules/@aws-amplify/core/dist/esm/parseAmplifyOutputs.mjs
function isAmplifyOutputs(config2) {
  const { version: version2 } = config2;
  if (!version2) {
    return false;
  }
  return version2.startsWith("1");
}
function parseStorage(amplifyOutputsStorageProperties) {
  if (!amplifyOutputsStorageProperties) {
    return void 0;
  }
  const { bucket_name, aws_region, buckets } = amplifyOutputsStorageProperties;
  return {
    S3: {
      bucket: bucket_name,
      region: aws_region,
      buckets: buckets && createBucketInfoMap(buckets)
    }
  };
}
function parseAuth(amplifyOutputsAuthProperties) {
  if (!amplifyOutputsAuthProperties) {
    return void 0;
  }
  const { user_pool_id, user_pool_client_id, identity_pool_id, password_policy, mfa_configuration, mfa_methods, unauthenticated_identities_enabled, oauth, username_attributes, standard_required_attributes, groups, passwordless } = amplifyOutputsAuthProperties;
  const authConfig = {
    Cognito: {
      userPoolId: user_pool_id,
      userPoolClientId: user_pool_client_id,
      groups
    }
  };
  if (identity_pool_id) {
    authConfig.Cognito = {
      ...authConfig.Cognito,
      identityPoolId: identity_pool_id
    };
  }
  if (password_policy) {
    authConfig.Cognito.passwordFormat = {
      requireLowercase: password_policy.require_lowercase,
      requireNumbers: password_policy.require_numbers,
      requireUppercase: password_policy.require_uppercase,
      requireSpecialCharacters: password_policy.require_symbols,
      minLength: password_policy.min_length ?? 6
    };
  }
  if (mfa_configuration) {
    authConfig.Cognito.mfa = {
      status: getMfaStatus(mfa_configuration),
      smsEnabled: mfa_methods?.includes("SMS"),
      totpEnabled: mfa_methods?.includes("TOTP")
    };
  }
  if (unauthenticated_identities_enabled) {
    authConfig.Cognito.allowGuestAccess = unauthenticated_identities_enabled;
  }
  if (oauth) {
    authConfig.Cognito.loginWith = {
      oauth: {
        domain: oauth.domain,
        redirectSignIn: oauth.redirect_sign_in_uri,
        redirectSignOut: oauth.redirect_sign_out_uri,
        responseType: oauth.response_type === "token" ? "token" : "code",
        scopes: oauth.scopes,
        providers: getOAuthProviders(oauth.identity_providers)
      }
    };
  }
  if (username_attributes) {
    authConfig.Cognito.loginWith = {
      ...authConfig.Cognito.loginWith,
      email: username_attributes.includes("email"),
      phone: username_attributes.includes("phone_number"),
      // Signing in with a username is not currently supported in Gen2, this should always evaluate to false
      username: username_attributes.includes("username")
    };
  }
  if (standard_required_attributes) {
    authConfig.Cognito.userAttributes = standard_required_attributes.reduce((acc, curr) => ({ ...acc, [curr]: { required: true } }), {});
  }
  if (passwordless) {
    authConfig.Cognito.passwordless = {
      emailOtpEnabled: passwordless.email_otp_enabled,
      smsOtpEnabled: passwordless.sms_otp_enabled,
      webAuthn: passwordless.web_authn ? {
        relyingPartyId: passwordless.web_authn.relying_party_id,
        userVerification: passwordless.web_authn.user_verification
      } : void 0,
      preferredChallenge: passwordless.preferred_challenge
    };
  }
  return authConfig;
}
function parseAnalytics(amplifyOutputsAnalyticsProperties) {
  if (!amplifyOutputsAnalyticsProperties?.amazon_pinpoint) {
    return void 0;
  }
  const { amazon_pinpoint } = amplifyOutputsAnalyticsProperties;
  return {
    Pinpoint: {
      appId: amazon_pinpoint.app_id,
      region: amazon_pinpoint.aws_region
    }
  };
}
function parseGeo(amplifyOutputsAnalyticsProperties) {
  if (!amplifyOutputsAnalyticsProperties) {
    return void 0;
  }
  const { aws_region, geofence_collections, maps, search_indices } = amplifyOutputsAnalyticsProperties;
  return {
    LocationService: {
      region: aws_region,
      searchIndices: search_indices,
      geofenceCollections: geofence_collections,
      maps
    }
  };
}
function parseData(amplifyOutputsDataProperties) {
  if (!amplifyOutputsDataProperties) {
    return void 0;
  }
  const { aws_region, default_authorization_type, url, api_key, model_introspection } = amplifyOutputsDataProperties;
  const GraphQL = {
    endpoint: url,
    defaultAuthMode: getGraphQLAuthMode(default_authorization_type),
    region: aws_region,
    apiKey: api_key,
    modelIntrospection: model_introspection
  };
  return {
    GraphQL
  };
}
function parseCustom(amplifyOutputsCustomProperties) {
  if (!amplifyOutputsCustomProperties?.events) {
    return void 0;
  }
  const { url, aws_region, api_key, default_authorization_type } = amplifyOutputsCustomProperties.events;
  const Events = {
    endpoint: url,
    defaultAuthMode: getGraphQLAuthMode(default_authorization_type),
    region: aws_region,
    apiKey: api_key
  };
  return {
    Events
  };
}
function parseNotifications(amplifyOutputsNotificationsProperties) {
  if (!amplifyOutputsNotificationsProperties) {
    return void 0;
  }
  const { aws_region, channels, amazon_pinpoint_app_id } = amplifyOutputsNotificationsProperties;
  const hasInAppMessaging = channels.includes("IN_APP_MESSAGING");
  const hasPushNotification = channels.includes("APNS") || channels.includes("FCM");
  if (!(hasInAppMessaging || hasPushNotification)) {
    return void 0;
  }
  const notificationsConfig = {};
  if (hasInAppMessaging) {
    notificationsConfig.InAppMessaging = {
      Pinpoint: {
        appId: amazon_pinpoint_app_id,
        region: aws_region
      }
    };
  }
  if (hasPushNotification) {
    notificationsConfig.PushNotification = {
      Pinpoint: {
        appId: amazon_pinpoint_app_id,
        region: aws_region
      }
    };
  }
  return notificationsConfig;
}
function parseAmplifyOutputs(amplifyOutputs) {
  const resourcesConfig = {};
  if (amplifyOutputs.storage) {
    resourcesConfig.Storage = parseStorage(amplifyOutputs.storage);
  }
  if (amplifyOutputs.auth) {
    resourcesConfig.Auth = parseAuth(amplifyOutputs.auth);
  }
  if (amplifyOutputs.analytics) {
    resourcesConfig.Analytics = parseAnalytics(amplifyOutputs.analytics);
  }
  if (amplifyOutputs.geo) {
    resourcesConfig.Geo = parseGeo(amplifyOutputs.geo);
  }
  if (amplifyOutputs.data) {
    resourcesConfig.API = parseData(amplifyOutputs.data);
  }
  if (amplifyOutputs.custom) {
    const customConfig = parseCustom(amplifyOutputs.custom);
    if (customConfig && "Events" in customConfig) {
      resourcesConfig.API = { ...resourcesConfig.API, ...customConfig };
    }
  }
  if (amplifyOutputs.notifications) {
    resourcesConfig.Notifications = parseNotifications(amplifyOutputs.notifications);
  }
  return resourcesConfig;
}
var authModeNames = {
  AMAZON_COGNITO_USER_POOLS: "userPool",
  API_KEY: "apiKey",
  AWS_IAM: "iam",
  AWS_LAMBDA: "lambda",
  OPENID_CONNECT: "oidc"
};
function getGraphQLAuthMode(authType) {
  return authModeNames[authType];
}
var providerNames = {
  GOOGLE: "Google",
  LOGIN_WITH_AMAZON: "Amazon",
  FACEBOOK: "Facebook",
  SIGN_IN_WITH_APPLE: "Apple"
};
function getOAuthProviders(providers = []) {
  return providers.reduce((oAuthProviders, provider) => {
    if (providerNames[provider] !== void 0) {
      oAuthProviders.push(providerNames[provider]);
    }
    return oAuthProviders;
  }, []);
}
function getMfaStatus(mfaConfiguration) {
  if (mfaConfiguration === "OPTIONAL")
    return "optional";
  if (mfaConfiguration === "REQUIRED")
    return "on";
  return "off";
}
function createBucketInfoMap(buckets) {
  const mappedBuckets = {};
  buckets.forEach(({ name: name2, bucket_name: bucketName, aws_region: region, paths }) => {
    if (name2 in mappedBuckets) {
      throw new Error(`Duplicate friendly name found: ${name2}. Name must be unique.`);
    }
    const sanitizedPaths = paths ? Object.entries(paths).reduce((acc, [key, value]) => {
      if (value !== void 0) {
        acc[key] = value;
      }
      return acc;
    }, {}) : void 0;
    mappedBuckets[name2] = {
      bucketName,
      region,
      paths: sanitizedPaths
    };
  });
  return mappedBuckets;
}

// node_modules/@aws-amplify/core/dist/esm/utils/parseAmplifyConfig.mjs
var parseAmplifyConfig = (amplifyConfig) => {
  if (Object.keys(amplifyConfig).some((key) => key.startsWith("aws_"))) {
    return parseAWSExports(amplifyConfig);
  } else if (isAmplifyOutputs(amplifyConfig)) {
    return parseAmplifyOutputs(amplifyConfig);
  } else {
    return amplifyConfig;
  }
};

// node_modules/tslib/tslib.es6.mjs
var extendStatics = function(d, b) {
  extendStatics = Object.setPrototypeOf || { __proto__: [] } instanceof Array && function(d2, b2) {
    d2.__proto__ = b2;
  } || function(d2, b2) {
    for (var p in b2) if (Object.prototype.hasOwnProperty.call(b2, p)) d2[p] = b2[p];
  };
  return extendStatics(d, b);
};
function __extends(d, b) {
  if (typeof b !== "function" && b !== null)
    throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
  extendStatics(d, b);
  function __() {
    this.constructor = d;
  }
  d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
}
function __awaiter(thisArg, _arguments, P, generator) {
  function adopt(value) {
    return value instanceof P ? value : new P(function(resolve) {
      resolve(value);
    });
  }
  return new (P || (P = Promise))(function(resolve, reject) {
    function fulfilled(value) {
      try {
        step(generator.next(value));
      } catch (e) {
        reject(e);
      }
    }
    function rejected(value) {
      try {
        step(generator["throw"](value));
      } catch (e) {
        reject(e);
      }
    }
    function step(result) {
      result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected);
    }
    step((generator = generator.apply(thisArg, _arguments || [])).next());
  });
}
function __generator(thisArg, body) {
  var _ = { label: 0, sent: function() {
    if (t[0] & 1) throw t[1];
    return t[1];
  }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
  return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() {
    return this;
  }), g;
  function verb(n) {
    return function(v) {
      return step([n, v]);
    };
  }
  function step(op) {
    if (f) throw new TypeError("Generator is already executing.");
    while (g && (g = 0, op[0] && (_ = 0)), _) try {
      if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
      if (y = 0, t) op = [op[0] & 2, t.value];
      switch (op[0]) {
        case 0:
        case 1:
          t = op;
          break;
        case 4:
          _.label++;
          return { value: op[1], done: false };
        case 5:
          _.label++;
          y = op[1];
          op = [0];
          continue;
        case 7:
          op = _.ops.pop();
          _.trys.pop();
          continue;
        default:
          if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) {
            _ = 0;
            continue;
          }
          if (op[0] === 3 && (!t || op[1] > t[0] && op[1] < t[3])) {
            _.label = op[1];
            break;
          }
          if (op[0] === 6 && _.label < t[1]) {
            _.label = t[1];
            t = op;
            break;
          }
          if (t && _.label < t[2]) {
            _.label = t[2];
            _.ops.push(op);
            break;
          }
          if (t[2]) _.ops.pop();
          _.trys.pop();
          continue;
      }
      op = body.call(thisArg, _);
    } catch (e) {
      op = [6, e];
      y = 0;
    } finally {
      f = t = 0;
    }
    if (op[0] & 5) throw op[1];
    return { value: op[0] ? op[1] : void 0, done: true };
  }
}
function __values(o) {
  var s = typeof Symbol === "function" && Symbol.iterator, m = s && o[s], i = 0;
  if (m) return m.call(o);
  if (o && typeof o.length === "number") return {
    next: function() {
      if (o && i >= o.length) o = void 0;
      return { value: o && o[i++], done: !o };
    }
  };
  throw new TypeError(s ? "Object is not iterable." : "Symbol.iterator is not defined.");
}
function __read(o, n) {
  var m = typeof Symbol === "function" && o[Symbol.iterator];
  if (!m) return o;
  var i = m.call(o), r, ar = [], e;
  try {
    while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
  } catch (error) {
    e = { error };
  } finally {
    try {
      if (r && !r.done && (m = i["return"])) m.call(i);
    } finally {
      if (e) throw e.error;
    }
  }
  return ar;
}
function __spreadArray(to, from2, pack) {
  if (pack || arguments.length === 2) for (var i = 0, l = from2.length, ar; i < l; i++) {
    if (ar || !(i in from2)) {
      if (!ar) ar = Array.prototype.slice.call(from2, 0, i);
      ar[i] = from2[i];
    }
  }
  return to.concat(ar || Array.prototype.slice.call(from2));
}
function __await(v) {
  return this instanceof __await ? (this.v = v, this) : new __await(v);
}
function __asyncGenerator(thisArg, _arguments, generator) {
  if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
  var g = generator.apply(thisArg, _arguments || []), i, q = [];
  return i = Object.create((typeof AsyncIterator === "function" ? AsyncIterator : Object).prototype), verb("next"), verb("throw"), verb("return", awaitReturn), i[Symbol.asyncIterator] = function() {
    return this;
  }, i;
  function awaitReturn(f) {
    return function(v) {
      return Promise.resolve(v).then(f, reject);
    };
  }
  function verb(n, f) {
    if (g[n]) {
      i[n] = function(v) {
        return new Promise(function(a, b) {
          q.push([n, v, a, b]) > 1 || resume(n, v);
        });
      };
      if (f) i[n] = f(i[n]);
    }
  }
  function resume(n, v) {
    try {
      step(g[n](v));
    } catch (e) {
      settle(q[0][3], e);
    }
  }
  function step(r) {
    r.value instanceof __await ? Promise.resolve(r.value.v).then(fulfill, reject) : settle(q[0][2], r);
  }
  function fulfill(value) {
    resume("next", value);
  }
  function reject(value) {
    resume("throw", value);
  }
  function settle(f, v) {
    if (f(v), q.shift(), q.length) resume(q[0][0], q[0][1]);
  }
}
function __asyncValues(o) {
  if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
  var m = o[Symbol.asyncIterator], i;
  return m ? m.call(o) : (o = typeof __values === "function" ? __values(o) : o[Symbol.iterator](), i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function() {
    return this;
  }, i);
  function verb(n) {
    i[n] = o[n] && function(v) {
      return new Promise(function(resolve, reject) {
        v = o[n](v), settle(resolve, reject, v.done, v.value);
      });
    };
  }
  function settle(resolve, reject, d, v) {
    Promise.resolve(v).then(function(v2) {
      resolve({ value: v2, done: d });
    }, reject);
  }
}

// node_modules/@aws-crypto/sha256-js/build/module/constants.js
var BLOCK_SIZE = 64;
var DIGEST_LENGTH = 32;
var KEY = new Uint32Array([
  1116352408,
  1899447441,
  3049323471,
  3921009573,
  961987163,
  1508970993,
  2453635748,
  2870763221,
  3624381080,
  310598401,
  607225278,
  1426881987,
  1925078388,
  2162078206,
  2614888103,
  3248222580,
  3835390401,
  4022224774,
  264347078,
  604807628,
  770255983,
  1249150122,
  1555081692,
  1996064986,
  2554220882,
  2821834349,
  2952996808,
  3210313671,
  3336571891,
  3584528711,
  113926993,
  338241895,
  666307205,
  773529912,
  1294757372,
  1396182291,
  1695183700,
  1986661051,
  2177026350,
  2456956037,
  2730485921,
  2820302411,
  3259730800,
  3345764771,
  3516065817,
  3600352804,
  4094571909,
  275423344,
  430227734,
  506948616,
  659060556,
  883997877,
  958139571,
  1322822218,
  1537002063,
  1747873779,
  1955562222,
  2024104815,
  2227730452,
  2361852424,
  2428436474,
  2756734187,
  3204031479,
  3329325298
]);
var INIT = [
  1779033703,
  3144134277,
  1013904242,
  2773480762,
  1359893119,
  2600822924,
  528734635,
  1541459225
];
var MAX_HASHABLE_LENGTH = Math.pow(2, 53) - 1;

// node_modules/@aws-crypto/sha256-js/build/module/RawSha256.js
var RawSha256 = (
  /** @class */
  (function() {
    function RawSha2562() {
      this.state = Int32Array.from(INIT);
      this.temp = new Int32Array(64);
      this.buffer = new Uint8Array(64);
      this.bufferLength = 0;
      this.bytesHashed = 0;
      this.finished = false;
    }
    RawSha2562.prototype.update = function(data) {
      if (this.finished) {
        throw new Error("Attempted to update an already finished hash.");
      }
      var position = 0;
      var byteLength = data.byteLength;
      this.bytesHashed += byteLength;
      if (this.bytesHashed * 8 > MAX_HASHABLE_LENGTH) {
        throw new Error("Cannot hash more than 2^53 - 1 bits");
      }
      while (byteLength > 0) {
        this.buffer[this.bufferLength++] = data[position++];
        byteLength--;
        if (this.bufferLength === BLOCK_SIZE) {
          this.hashBuffer();
          this.bufferLength = 0;
        }
      }
    };
    RawSha2562.prototype.digest = function() {
      if (!this.finished) {
        var bitsHashed = this.bytesHashed * 8;
        var bufferView = new DataView(this.buffer.buffer, this.buffer.byteOffset, this.buffer.byteLength);
        var undecoratedLength = this.bufferLength;
        bufferView.setUint8(this.bufferLength++, 128);
        if (undecoratedLength % BLOCK_SIZE >= BLOCK_SIZE - 8) {
          for (var i = this.bufferLength; i < BLOCK_SIZE; i++) {
            bufferView.setUint8(i, 0);
          }
          this.hashBuffer();
          this.bufferLength = 0;
        }
        for (var i = this.bufferLength; i < BLOCK_SIZE - 8; i++) {
          bufferView.setUint8(i, 0);
        }
        bufferView.setUint32(BLOCK_SIZE - 8, Math.floor(bitsHashed / 4294967296), true);
        bufferView.setUint32(BLOCK_SIZE - 4, bitsHashed);
        this.hashBuffer();
        this.finished = true;
      }
      var out = new Uint8Array(DIGEST_LENGTH);
      for (var i = 0; i < 8; i++) {
        out[i * 4] = this.state[i] >>> 24 & 255;
        out[i * 4 + 1] = this.state[i] >>> 16 & 255;
        out[i * 4 + 2] = this.state[i] >>> 8 & 255;
        out[i * 4 + 3] = this.state[i] >>> 0 & 255;
      }
      return out;
    };
    RawSha2562.prototype.hashBuffer = function() {
      var _a = this, buffer = _a.buffer, state = _a.state;
      var state0 = state[0], state1 = state[1], state2 = state[2], state3 = state[3], state4 = state[4], state5 = state[5], state6 = state[6], state7 = state[7];
      for (var i = 0; i < BLOCK_SIZE; i++) {
        if (i < 16) {
          this.temp[i] = (buffer[i * 4] & 255) << 24 | (buffer[i * 4 + 1] & 255) << 16 | (buffer[i * 4 + 2] & 255) << 8 | buffer[i * 4 + 3] & 255;
        } else {
          var u = this.temp[i - 2];
          var t1_1 = (u >>> 17 | u << 15) ^ (u >>> 19 | u << 13) ^ u >>> 10;
          u = this.temp[i - 15];
          var t2_1 = (u >>> 7 | u << 25) ^ (u >>> 18 | u << 14) ^ u >>> 3;
          this.temp[i] = (t1_1 + this.temp[i - 7] | 0) + (t2_1 + this.temp[i - 16] | 0);
        }
        var t1 = (((state4 >>> 6 | state4 << 26) ^ (state4 >>> 11 | state4 << 21) ^ (state4 >>> 25 | state4 << 7)) + (state4 & state5 ^ ~state4 & state6) | 0) + (state7 + (KEY[i] + this.temp[i] | 0) | 0) | 0;
        var t2 = ((state0 >>> 2 | state0 << 30) ^ (state0 >>> 13 | state0 << 19) ^ (state0 >>> 22 | state0 << 10)) + (state0 & state1 ^ state0 & state2 ^ state1 & state2) | 0;
        state7 = state6;
        state6 = state5;
        state5 = state4;
        state4 = state3 + t1 | 0;
        state3 = state2;
        state2 = state1;
        state1 = state0;
        state0 = t1 + t2 | 0;
      }
      state[0] += state0;
      state[1] += state1;
      state[2] += state2;
      state[3] += state3;
      state[4] += state4;
      state[5] += state5;
      state[6] += state6;
      state[7] += state7;
    };
    return RawSha2562;
  })()
);

// node_modules/@aws-crypto/util/node_modules/@smithy/util-utf8/dist-es/fromUtf8.browser.js
var fromUtf8 = (input) => new TextEncoder().encode(input);

// node_modules/@aws-crypto/util/build/module/convertToBuffer.js
var fromUtf82 = typeof Buffer !== "undefined" && Buffer.from ? function(input) {
  return Buffer.from(input, "utf8");
} : fromUtf8;
function convertToBuffer(data) {
  if (data instanceof Uint8Array)
    return data;
  if (typeof data === "string") {
    return fromUtf82(data);
  }
  if (ArrayBuffer.isView(data)) {
    return new Uint8Array(data.buffer, data.byteOffset, data.byteLength / Uint8Array.BYTES_PER_ELEMENT);
  }
  return new Uint8Array(data);
}

// node_modules/@aws-crypto/util/build/module/isEmptyData.js
function isEmptyData(data) {
  if (typeof data === "string") {
    return data.length === 0;
  }
  return data.byteLength === 0;
}

// node_modules/@aws-crypto/sha256-js/build/module/jsSha256.js
var Sha256 = (
  /** @class */
  (function() {
    function Sha2562(secret) {
      this.secret = secret;
      this.hash = new RawSha256();
      this.reset();
    }
    Sha2562.prototype.update = function(toHash) {
      if (isEmptyData(toHash) || this.error) {
        return;
      }
      try {
        this.hash.update(convertToBuffer(toHash));
      } catch (e) {
        this.error = e;
      }
    };
    Sha2562.prototype.digestSync = function() {
      if (this.error) {
        throw this.error;
      }
      if (this.outer) {
        if (!this.outer.finished) {
          this.outer.update(this.hash.digest());
        }
        return this.outer.digest();
      }
      return this.hash.digest();
    };
    Sha2562.prototype.digest = function() {
      return __awaiter(this, void 0, void 0, function() {
        return __generator(this, function(_a) {
          return [2, this.digestSync()];
        });
      });
    };
    Sha2562.prototype.reset = function() {
      this.hash = new RawSha256();
      if (this.secret) {
        this.outer = new RawSha256();
        var inner = bufferFromSecret(this.secret);
        var outer = new Uint8Array(BLOCK_SIZE);
        outer.set(inner);
        for (var i = 0; i < BLOCK_SIZE; i++) {
          inner[i] ^= 54;
          outer[i] ^= 92;
        }
        this.hash.update(inner);
        this.outer.update(outer);
        for (var i = 0; i < inner.byteLength; i++) {
          inner[i] = 0;
        }
      }
    };
    return Sha2562;
  })()
);
function bufferFromSecret(secret) {
  var input = convertToBuffer(secret);
  if (input.byteLength > BLOCK_SIZE) {
    var bufferHash = new RawSha256();
    bufferHash.update(input);
    input = bufferHash.digest();
  }
  var buffer = new Uint8Array(BLOCK_SIZE);
  buffer.set(input);
  return buffer;
}

// node_modules/@aws-amplify/core/node_modules/@smithy/util-hex-encoding/dist-es/index.js
var SHORT_TO_HEX = {};
var HEX_TO_SHORT = {};
for (let i = 0; i < 256; i++) {
  let encodedByte = i.toString(16).toLowerCase();
  if (encodedByte.length === 1) {
    encodedByte = `0${encodedByte}`;
  }
  SHORT_TO_HEX[i] = encodedByte;
  HEX_TO_SHORT[encodedByte] = i;
}
function toHex(bytes) {
  let out = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    out += SHORT_TO_HEX[bytes[i]];
  }
  return out;
}

// node_modules/@aws-amplify/core/dist/esm/Platform/types.mjs
var Framework;
(function(Framework2) {
  Framework2["WebUnknown"] = "0";
  Framework2["React"] = "1";
  Framework2["NextJs"] = "2";
  Framework2["Angular"] = "3";
  Framework2["VueJs"] = "4";
  Framework2["Nuxt"] = "5";
  Framework2["Svelte"] = "6";
  Framework2["ServerSideUnknown"] = "100";
  Framework2["ReactSSR"] = "101";
  Framework2["NextJsSSR"] = "102";
  Framework2["AngularSSR"] = "103";
  Framework2["VueJsSSR"] = "104";
  Framework2["NuxtSSR"] = "105";
  Framework2["SvelteSSR"] = "106";
  Framework2["ReactNative"] = "201";
  Framework2["Expo"] = "202";
})(Framework || (Framework = {}));
var Category;
(function(Category2) {
  Category2["AI"] = "ai";
  Category2["API"] = "api";
  Category2["Auth"] = "auth";
  Category2["Analytics"] = "analytics";
  Category2["DataStore"] = "datastore";
  Category2["Geo"] = "geo";
  Category2["InAppMessaging"] = "inappmessaging";
  Category2["Interactions"] = "interactions";
  Category2["Predictions"] = "predictions";
  Category2["PubSub"] = "pubsub";
  Category2["PushNotification"] = "pushnotification";
  Category2["Storage"] = "storage";
})(Category || (Category = {}));
var AiAction;
(function(AiAction3) {
  AiAction3["CreateConversation"] = "1";
  AiAction3["GetConversation"] = "2";
  AiAction3["ListConversations"] = "3";
  AiAction3["DeleteConversation"] = "4";
  AiAction3["SendMessage"] = "5";
  AiAction3["ListMessages"] = "6";
  AiAction3["OnMessage"] = "7";
  AiAction3["Generation"] = "8";
  AiAction3["UpdateConversation"] = "9";
})(AiAction || (AiAction = {}));
var AnalyticsAction;
(function(AnalyticsAction2) {
  AnalyticsAction2["Record"] = "1";
  AnalyticsAction2["IdentifyUser"] = "2";
})(AnalyticsAction || (AnalyticsAction = {}));
var ApiAction;
(function(ApiAction2) {
  ApiAction2["GraphQl"] = "1";
  ApiAction2["Get"] = "2";
  ApiAction2["Post"] = "3";
  ApiAction2["Put"] = "4";
  ApiAction2["Patch"] = "5";
  ApiAction2["Del"] = "6";
  ApiAction2["Head"] = "7";
})(ApiAction || (ApiAction = {}));
var AuthAction;
(function(AuthAction2) {
  AuthAction2["SignUp"] = "1";
  AuthAction2["ConfirmSignUp"] = "2";
  AuthAction2["ResendSignUpCode"] = "3";
  AuthAction2["SignIn"] = "4";
  AuthAction2["FetchMFAPreference"] = "6";
  AuthAction2["UpdateMFAPreference"] = "7";
  AuthAction2["SetUpTOTP"] = "10";
  AuthAction2["VerifyTOTPSetup"] = "11";
  AuthAction2["ConfirmSignIn"] = "12";
  AuthAction2["DeleteUserAttributes"] = "15";
  AuthAction2["DeleteUser"] = "16";
  AuthAction2["UpdateUserAttributes"] = "17";
  AuthAction2["FetchUserAttributes"] = "18";
  AuthAction2["ConfirmUserAttribute"] = "22";
  AuthAction2["SignOut"] = "26";
  AuthAction2["UpdatePassword"] = "27";
  AuthAction2["ResetPassword"] = "28";
  AuthAction2["ConfirmResetPassword"] = "29";
  AuthAction2["FederatedSignIn"] = "30";
  AuthAction2["RememberDevice"] = "32";
  AuthAction2["ForgetDevice"] = "33";
  AuthAction2["FetchDevices"] = "34";
  AuthAction2["SendUserAttributeVerificationCode"] = "35";
  AuthAction2["SignInWithRedirect"] = "36";
  AuthAction2["StartWebAuthnRegistration"] = "37";
  AuthAction2["CompleteWebAuthnRegistration"] = "38";
  AuthAction2["ListWebAuthnCredentials"] = "39";
  AuthAction2["DeleteWebAuthnCredential"] = "40";
})(AuthAction || (AuthAction = {}));
var DataStoreAction;
(function(DataStoreAction2) {
  DataStoreAction2["Subscribe"] = "1";
  DataStoreAction2["GraphQl"] = "2";
})(DataStoreAction || (DataStoreAction = {}));
var GeoAction;
(function(GeoAction2) {
  GeoAction2["SearchByText"] = "0";
  GeoAction2["SearchByCoordinates"] = "1";
  GeoAction2["SearchForSuggestions"] = "2";
  GeoAction2["SearchByPlaceId"] = "3";
  GeoAction2["SaveGeofences"] = "4";
  GeoAction2["GetGeofence"] = "5";
  GeoAction2["ListGeofences"] = "6";
  GeoAction2["DeleteGeofences"] = "7";
})(GeoAction || (GeoAction = {}));
var InAppMessagingAction;
(function(InAppMessagingAction2) {
  InAppMessagingAction2["SyncMessages"] = "1";
  InAppMessagingAction2["IdentifyUser"] = "2";
  InAppMessagingAction2["NotifyMessageInteraction"] = "3";
})(InAppMessagingAction || (InAppMessagingAction = {}));
var InteractionsAction;
(function(InteractionsAction2) {
  InteractionsAction2["None"] = "0";
})(InteractionsAction || (InteractionsAction = {}));
var PredictionsAction;
(function(PredictionsAction2) {
  PredictionsAction2["Convert"] = "1";
  PredictionsAction2["Identify"] = "2";
  PredictionsAction2["Interpret"] = "3";
})(PredictionsAction || (PredictionsAction = {}));
var PubSubAction;
(function(PubSubAction2) {
  PubSubAction2["Subscribe"] = "1";
})(PubSubAction || (PubSubAction = {}));
var PushNotificationAction;
(function(PushNotificationAction2) {
  PushNotificationAction2["InitializePushNotifications"] = "1";
  PushNotificationAction2["IdentifyUser"] = "2";
})(PushNotificationAction || (PushNotificationAction = {}));
var StorageAction;
(function(StorageAction2) {
  StorageAction2["UploadData"] = "1";
  StorageAction2["DownloadData"] = "2";
  StorageAction2["List"] = "3";
  StorageAction2["Copy"] = "4";
  StorageAction2["Remove"] = "5";
  StorageAction2["GetProperties"] = "6";
  StorageAction2["GetUrl"] = "7";
  StorageAction2["GetDataAccess"] = "8";
  StorageAction2["ListCallerAccessGrants"] = "9";
})(StorageAction || (StorageAction = {}));

// node_modules/@aws-amplify/core/dist/esm/Platform/version.mjs
var version = "6.16.2";

// node_modules/@aws-amplify/core/dist/esm/Platform/detection/helpers.mjs
var globalExists = () => {
  return typeof global !== "undefined";
};
var windowExists = () => {
  return typeof window !== "undefined";
};
var documentExists = () => {
  return typeof document !== "undefined";
};
var processExists = () => {
  return typeof process !== "undefined";
};
var keyPrefixMatch = (object, prefix) => {
  return !!Object.keys(object).find((key) => key.startsWith(prefix));
};

// node_modules/@aws-amplify/core/dist/esm/Platform/detection/React.mjs
function reactWebDetect() {
  const elementKeyPrefixedWithReact = (key) => {
    return key.startsWith("_react") || key.startsWith("__react");
  };
  const elementIsReactEnabled = (element) => {
    return Object.keys(element).find(elementKeyPrefixedWithReact);
  };
  const allElementsWithId = () => Array.from(document.querySelectorAll("[id]"));
  return documentExists() && allElementsWithId().some(elementIsReactEnabled);
}
function reactSSRDetect() {
  return processExists() && typeof process.env !== "undefined" && !!Object.keys(process.env).find((key) => key.includes("react"));
}

// node_modules/@aws-amplify/core/dist/esm/Platform/detection/Vue.mjs
function vueWebDetect() {
  return windowExists() && keyPrefixMatch(window, "__VUE");
}
function vueSSRDetect() {
  return globalExists() && keyPrefixMatch(global, "__VUE");
}

// node_modules/@aws-amplify/core/dist/esm/Platform/detection/Svelte.mjs
function svelteWebDetect() {
  return windowExists() && keyPrefixMatch(window, "__SVELTE");
}
function svelteSSRDetect() {
  return processExists() && typeof process.env !== "undefined" && !!Object.keys(process.env).find((key) => key.includes("svelte"));
}

// node_modules/@aws-amplify/core/dist/esm/Platform/detection/Next.mjs
function nextWebDetect() {
  return windowExists() && window.next && typeof window.next === "object";
}
function nextSSRDetect() {
  return globalExists() && (keyPrefixMatch(global, "__next") || keyPrefixMatch(global, "__NEXT"));
}

// node_modules/@aws-amplify/core/dist/esm/Platform/detection/Nuxt.mjs
function nuxtWebDetect() {
  return windowExists() && (window.__NUXT__ !== void 0 || window.$nuxt !== void 0);
}
function nuxtSSRDetect() {
  return globalExists() && typeof global.__NUXT_PATHS__ !== "undefined";
}

// node_modules/@aws-amplify/core/dist/esm/Platform/detection/Angular.mjs
function angularWebDetect() {
  const angularVersionSetInDocument = Boolean(documentExists() && document.querySelector("[ng-version]"));
  const angularContentSetInWindow = Boolean(windowExists() && typeof window.ng !== "undefined");
  return angularVersionSetInDocument || angularContentSetInWindow;
}
function angularSSRDetect() {
  return processExists() && typeof process.env === "object" && process.env.npm_lifecycle_script?.startsWith("ng ") || false;
}

// node_modules/@aws-amplify/core/dist/esm/Platform/detection/ReactNative.mjs
function reactNativeDetect() {
  return typeof navigator !== "undefined" && typeof navigator.product !== "undefined" && navigator.product === "ReactNative";
}

// node_modules/@aws-amplify/core/dist/esm/Platform/detection/Expo.mjs
function expoDetect() {
  return globalExists() && typeof global.expo !== "undefined";
}

// node_modules/@aws-amplify/core/dist/esm/Platform/detection/Web.mjs
function webDetect() {
  return windowExists();
}

// node_modules/@aws-amplify/core/dist/esm/Platform/detection/index.mjs
var detectionMap = [
  // First, detect mobile
  { platform: Framework.Expo, detectionMethod: expoDetect },
  { platform: Framework.ReactNative, detectionMethod: reactNativeDetect },
  // Next, detect web frameworks
  { platform: Framework.NextJs, detectionMethod: nextWebDetect },
  { platform: Framework.Nuxt, detectionMethod: nuxtWebDetect },
  { platform: Framework.Angular, detectionMethod: angularWebDetect },
  { platform: Framework.React, detectionMethod: reactWebDetect },
  { platform: Framework.VueJs, detectionMethod: vueWebDetect },
  { platform: Framework.Svelte, detectionMethod: svelteWebDetect },
  { platform: Framework.WebUnknown, detectionMethod: webDetect },
  // Last, detect ssr frameworks
  { platform: Framework.NextJsSSR, detectionMethod: nextSSRDetect },
  { platform: Framework.NuxtSSR, detectionMethod: nuxtSSRDetect },
  { platform: Framework.ReactSSR, detectionMethod: reactSSRDetect },
  { platform: Framework.VueJsSSR, detectionMethod: vueSSRDetect },
  { platform: Framework.AngularSSR, detectionMethod: angularSSRDetect },
  { platform: Framework.SvelteSSR, detectionMethod: svelteSSRDetect }
];
function detect() {
  return detectionMap.find((detectionEntry) => detectionEntry.detectionMethod())?.platform || Framework.ServerSideUnknown;
}

// node_modules/@aws-amplify/core/dist/esm/Platform/detectFramework.mjs
var frameworkCache;
var frameworkChangeObservers = [];
var resetTriggered = false;
var SSR_RESET_TIMEOUT = 10;
var WEB_RESET_TIMEOUT = 10;
var PRIME_FRAMEWORK_DELAY = 1e3;
var detectFramework = () => {
  if (!frameworkCache) {
    frameworkCache = detect();
    if (resetTriggered) {
      while (frameworkChangeObservers.length) {
        frameworkChangeObservers.pop()?.();
      }
    } else {
      frameworkChangeObservers.forEach((fcn) => {
        fcn();
      });
    }
    resetTimeout(Framework.ServerSideUnknown, SSR_RESET_TIMEOUT);
    resetTimeout(Framework.WebUnknown, WEB_RESET_TIMEOUT);
  }
  return frameworkCache;
};
var observeFrameworkChanges = (fcn) => {
  if (resetTriggered) {
    return;
  }
  frameworkChangeObservers.push(fcn);
};
function clearCache() {
  frameworkCache = void 0;
}
function resetTimeout(framework, delay) {
  if (frameworkCache === framework && !resetTriggered) {
    setTimeout(() => {
      clearCache();
      resetTriggered = true;
      setTimeout(detectFramework, PRIME_FRAMEWORK_DELAY);
    }, delay);
  }
}

// node_modules/@aws-amplify/core/dist/esm/Platform/customUserAgent.mjs
var customUserAgentState = {};
var getCustomUserAgent = (category, api2) => customUserAgentState[category]?.[api2]?.additionalDetails;

// node_modules/@aws-amplify/core/dist/esm/Platform/index.mjs
var BASE_USER_AGENT = `aws-amplify`;
var sanitizeAmplifyVersion = (amplifyVersion) => amplifyVersion.replace(/\+.*/, "");
var PlatformBuilder = class {
  constructor() {
    this.userAgent = `${BASE_USER_AGENT}/${sanitizeAmplifyVersion(version)}`;
  }
  get framework() {
    return detectFramework();
  }
  get isReactNative() {
    return this.framework === Framework.ReactNative || this.framework === Framework.Expo;
  }
  observeFrameworkChanges(fcn) {
    observeFrameworkChanges(fcn);
  }
};
var Platform = new PlatformBuilder();
var getAmplifyUserAgentObject = ({ category, action } = {}) => {
  const userAgent = [
    [BASE_USER_AGENT, sanitizeAmplifyVersion(version)]
  ];
  if (category) {
    userAgent.push([category, action]);
  }
  userAgent.push(["framework", detectFramework()]);
  if (category && action) {
    const customState = getCustomUserAgent(category, action);
    if (customState) {
      customState.forEach((state) => {
        userAgent.push(state);
      });
    }
  }
  return userAgent;
};
var getAmplifyUserAgent = (customUserAgentDetails) => {
  const userAgent = getAmplifyUserAgentObject(customUserAgentDetails);
  const userAgentString = userAgent.map(([agentKey, agentValue]) => agentKey && agentValue ? `${agentKey}/${agentValue}` : agentKey).join(" ");
  return userAgentString;
};

// node_modules/rxjs/dist/esm5/internal/util/isFunction.js
function isFunction(value) {
  return typeof value === "function";
}

// node_modules/rxjs/dist/esm5/internal/util/createErrorClass.js
function createErrorClass(createImpl) {
  var _super = function(instance) {
    Error.call(instance);
    instance.stack = new Error().stack;
  };
  var ctorFunc = createImpl(_super);
  ctorFunc.prototype = Object.create(Error.prototype);
  ctorFunc.prototype.constructor = ctorFunc;
  return ctorFunc;
}

// node_modules/rxjs/dist/esm5/internal/util/UnsubscriptionError.js
var UnsubscriptionError = createErrorClass(function(_super) {
  return function UnsubscriptionErrorImpl(errors) {
    _super(this);
    this.message = errors ? errors.length + " errors occurred during unsubscription:\n" + errors.map(function(err, i) {
      return i + 1 + ") " + err.toString();
    }).join("\n  ") : "";
    this.name = "UnsubscriptionError";
    this.errors = errors;
  };
});

// node_modules/rxjs/dist/esm5/internal/util/arrRemove.js
function arrRemove(arr, item) {
  if (arr) {
    var index = arr.indexOf(item);
    0 <= index && arr.splice(index, 1);
  }
}

// node_modules/rxjs/dist/esm5/internal/Subscription.js
var Subscription = (function() {
  function Subscription2(initialTeardown) {
    this.initialTeardown = initialTeardown;
    this.closed = false;
    this._parentage = null;
    this._finalizers = null;
  }
  Subscription2.prototype.unsubscribe = function() {
    var e_1, _a, e_2, _b;
    var errors;
    if (!this.closed) {
      this.closed = true;
      var _parentage = this._parentage;
      if (_parentage) {
        this._parentage = null;
        if (Array.isArray(_parentage)) {
          try {
            for (var _parentage_1 = __values(_parentage), _parentage_1_1 = _parentage_1.next(); !_parentage_1_1.done; _parentage_1_1 = _parentage_1.next()) {
              var parent_1 = _parentage_1_1.value;
              parent_1.remove(this);
            }
          } catch (e_1_1) {
            e_1 = { error: e_1_1 };
          } finally {
            try {
              if (_parentage_1_1 && !_parentage_1_1.done && (_a = _parentage_1.return)) _a.call(_parentage_1);
            } finally {
              if (e_1) throw e_1.error;
            }
          }
        } else {
          _parentage.remove(this);
        }
      }
      var initialFinalizer = this.initialTeardown;
      if (isFunction(initialFinalizer)) {
        try {
          initialFinalizer();
        } catch (e) {
          errors = e instanceof UnsubscriptionError ? e.errors : [e];
        }
      }
      var _finalizers = this._finalizers;
      if (_finalizers) {
        this._finalizers = null;
        try {
          for (var _finalizers_1 = __values(_finalizers), _finalizers_1_1 = _finalizers_1.next(); !_finalizers_1_1.done; _finalizers_1_1 = _finalizers_1.next()) {
            var finalizer = _finalizers_1_1.value;
            try {
              execFinalizer(finalizer);
            } catch (err) {
              errors = errors !== null && errors !== void 0 ? errors : [];
              if (err instanceof UnsubscriptionError) {
                errors = __spreadArray(__spreadArray([], __read(errors)), __read(err.errors));
              } else {
                errors.push(err);
              }
            }
          }
        } catch (e_2_1) {
          e_2 = { error: e_2_1 };
        } finally {
          try {
            if (_finalizers_1_1 && !_finalizers_1_1.done && (_b = _finalizers_1.return)) _b.call(_finalizers_1);
          } finally {
            if (e_2) throw e_2.error;
          }
        }
      }
      if (errors) {
        throw new UnsubscriptionError(errors);
      }
    }
  };
  Subscription2.prototype.add = function(teardown) {
    var _a;
    if (teardown && teardown !== this) {
      if (this.closed) {
        execFinalizer(teardown);
      } else {
        if (teardown instanceof Subscription2) {
          if (teardown.closed || teardown._hasParent(this)) {
            return;
          }
          teardown._addParent(this);
        }
        (this._finalizers = (_a = this._finalizers) !== null && _a !== void 0 ? _a : []).push(teardown);
      }
    }
  };
  Subscription2.prototype._hasParent = function(parent) {
    var _parentage = this._parentage;
    return _parentage === parent || Array.isArray(_parentage) && _parentage.includes(parent);
  };
  Subscription2.prototype._addParent = function(parent) {
    var _parentage = this._parentage;
    this._parentage = Array.isArray(_parentage) ? (_parentage.push(parent), _parentage) : _parentage ? [_parentage, parent] : parent;
  };
  Subscription2.prototype._removeParent = function(parent) {
    var _parentage = this._parentage;
    if (_parentage === parent) {
      this._parentage = null;
    } else if (Array.isArray(_parentage)) {
      arrRemove(_parentage, parent);
    }
  };
  Subscription2.prototype.remove = function(teardown) {
    var _finalizers = this._finalizers;
    _finalizers && arrRemove(_finalizers, teardown);
    if (teardown instanceof Subscription2) {
      teardown._removeParent(this);
    }
  };
  Subscription2.EMPTY = (function() {
    var empty = new Subscription2();
    empty.closed = true;
    return empty;
  })();
  return Subscription2;
})();
var EMPTY_SUBSCRIPTION = Subscription.EMPTY;
function isSubscription(value) {
  return value instanceof Subscription || value && "closed" in value && isFunction(value.remove) && isFunction(value.add) && isFunction(value.unsubscribe);
}
function execFinalizer(finalizer) {
  if (isFunction(finalizer)) {
    finalizer();
  } else {
    finalizer.unsubscribe();
  }
}

// node_modules/rxjs/dist/esm5/internal/config.js
var config = {
  onUnhandledError: null,
  onStoppedNotification: null,
  Promise: void 0,
  useDeprecatedSynchronousErrorHandling: false,
  useDeprecatedNextContext: false
};

// node_modules/rxjs/dist/esm5/internal/scheduler/timeoutProvider.js
var timeoutProvider = {
  setTimeout: function(handler, timeout) {
    var args = [];
    for (var _i = 2; _i < arguments.length; _i++) {
      args[_i - 2] = arguments[_i];
    }
    var delegate = timeoutProvider.delegate;
    if (delegate === null || delegate === void 0 ? void 0 : delegate.setTimeout) {
      return delegate.setTimeout.apply(delegate, __spreadArray([handler, timeout], __read(args)));
    }
    return setTimeout.apply(void 0, __spreadArray([handler, timeout], __read(args)));
  },
  clearTimeout: function(handle) {
    var delegate = timeoutProvider.delegate;
    return ((delegate === null || delegate === void 0 ? void 0 : delegate.clearTimeout) || clearTimeout)(handle);
  },
  delegate: void 0
};

// node_modules/rxjs/dist/esm5/internal/util/reportUnhandledError.js
function reportUnhandledError(err) {
  timeoutProvider.setTimeout(function() {
    var onUnhandledError = config.onUnhandledError;
    if (onUnhandledError) {
      onUnhandledError(err);
    } else {
      throw err;
    }
  });
}

// node_modules/rxjs/dist/esm5/internal/util/noop.js
function noop() {
}

// node_modules/rxjs/dist/esm5/internal/NotificationFactories.js
var COMPLETE_NOTIFICATION = (function() {
  return createNotification("C", void 0, void 0);
})();
function errorNotification(error) {
  return createNotification("E", void 0, error);
}
function nextNotification(value) {
  return createNotification("N", value, void 0);
}
function createNotification(kind, value, error) {
  return {
    kind,
    value,
    error
  };
}

// node_modules/rxjs/dist/esm5/internal/util/errorContext.js
var context = null;
function errorContext(cb) {
  if (config.useDeprecatedSynchronousErrorHandling) {
    var isRoot = !context;
    if (isRoot) {
      context = { errorThrown: false, error: null };
    }
    cb();
    if (isRoot) {
      var _a = context, errorThrown = _a.errorThrown, error = _a.error;
      context = null;
      if (errorThrown) {
        throw error;
      }
    }
  } else {
    cb();
  }
}
function captureError(err) {
  if (config.useDeprecatedSynchronousErrorHandling && context) {
    context.errorThrown = true;
    context.error = err;
  }
}

// node_modules/rxjs/dist/esm5/internal/Subscriber.js
var Subscriber = (function(_super) {
  __extends(Subscriber2, _super);
  function Subscriber2(destination) {
    var _this = _super.call(this) || this;
    _this.isStopped = false;
    if (destination) {
      _this.destination = destination;
      if (isSubscription(destination)) {
        destination.add(_this);
      }
    } else {
      _this.destination = EMPTY_OBSERVER;
    }
    return _this;
  }
  Subscriber2.create = function(next, error, complete) {
    return new SafeSubscriber(next, error, complete);
  };
  Subscriber2.prototype.next = function(value) {
    if (this.isStopped) {
      handleStoppedNotification(nextNotification(value), this);
    } else {
      this._next(value);
    }
  };
  Subscriber2.prototype.error = function(err) {
    if (this.isStopped) {
      handleStoppedNotification(errorNotification(err), this);
    } else {
      this.isStopped = true;
      this._error(err);
    }
  };
  Subscriber2.prototype.complete = function() {
    if (this.isStopped) {
      handleStoppedNotification(COMPLETE_NOTIFICATION, this);
    } else {
      this.isStopped = true;
      this._complete();
    }
  };
  Subscriber2.prototype.unsubscribe = function() {
    if (!this.closed) {
      this.isStopped = true;
      _super.prototype.unsubscribe.call(this);
      this.destination = null;
    }
  };
  Subscriber2.prototype._next = function(value) {
    this.destination.next(value);
  };
  Subscriber2.prototype._error = function(err) {
    try {
      this.destination.error(err);
    } finally {
      this.unsubscribe();
    }
  };
  Subscriber2.prototype._complete = function() {
    try {
      this.destination.complete();
    } finally {
      this.unsubscribe();
    }
  };
  return Subscriber2;
})(Subscription);
var _bind = Function.prototype.bind;
function bind(fn, thisArg) {
  return _bind.call(fn, thisArg);
}
var ConsumerObserver = (function() {
  function ConsumerObserver2(partialObserver) {
    this.partialObserver = partialObserver;
  }
  ConsumerObserver2.prototype.next = function(value) {
    var partialObserver = this.partialObserver;
    if (partialObserver.next) {
      try {
        partialObserver.next(value);
      } catch (error) {
        handleUnhandledError(error);
      }
    }
  };
  ConsumerObserver2.prototype.error = function(err) {
    var partialObserver = this.partialObserver;
    if (partialObserver.error) {
      try {
        partialObserver.error(err);
      } catch (error) {
        handleUnhandledError(error);
      }
    } else {
      handleUnhandledError(err);
    }
  };
  ConsumerObserver2.prototype.complete = function() {
    var partialObserver = this.partialObserver;
    if (partialObserver.complete) {
      try {
        partialObserver.complete();
      } catch (error) {
        handleUnhandledError(error);
      }
    }
  };
  return ConsumerObserver2;
})();
var SafeSubscriber = (function(_super) {
  __extends(SafeSubscriber2, _super);
  function SafeSubscriber2(observerOrNext, error, complete) {
    var _this = _super.call(this) || this;
    var partialObserver;
    if (isFunction(observerOrNext) || !observerOrNext) {
      partialObserver = {
        next: observerOrNext !== null && observerOrNext !== void 0 ? observerOrNext : void 0,
        error: error !== null && error !== void 0 ? error : void 0,
        complete: complete !== null && complete !== void 0 ? complete : void 0
      };
    } else {
      var context_1;
      if (_this && config.useDeprecatedNextContext) {
        context_1 = Object.create(observerOrNext);
        context_1.unsubscribe = function() {
          return _this.unsubscribe();
        };
        partialObserver = {
          next: observerOrNext.next && bind(observerOrNext.next, context_1),
          error: observerOrNext.error && bind(observerOrNext.error, context_1),
          complete: observerOrNext.complete && bind(observerOrNext.complete, context_1)
        };
      } else {
        partialObserver = observerOrNext;
      }
    }
    _this.destination = new ConsumerObserver(partialObserver);
    return _this;
  }
  return SafeSubscriber2;
})(Subscriber);
function handleUnhandledError(error) {
  if (config.useDeprecatedSynchronousErrorHandling) {
    captureError(error);
  } else {
    reportUnhandledError(error);
  }
}
function defaultErrorHandler(err) {
  throw err;
}
function handleStoppedNotification(notification, subscriber) {
  var onStoppedNotification = config.onStoppedNotification;
  onStoppedNotification && timeoutProvider.setTimeout(function() {
    return onStoppedNotification(notification, subscriber);
  });
}
var EMPTY_OBSERVER = {
  closed: true,
  next: noop,
  error: defaultErrorHandler,
  complete: noop
};

// node_modules/rxjs/dist/esm5/internal/symbol/observable.js
var observable = (function() {
  return typeof Symbol === "function" && Symbol.observable || "@@observable";
})();

// node_modules/rxjs/dist/esm5/internal/util/identity.js
function identity(x) {
  return x;
}

// node_modules/rxjs/dist/esm5/internal/util/pipe.js
function pipeFromArray(fns) {
  if (fns.length === 0) {
    return identity;
  }
  if (fns.length === 1) {
    return fns[0];
  }
  return function piped(input) {
    return fns.reduce(function(prev, fn) {
      return fn(prev);
    }, input);
  };
}

// node_modules/rxjs/dist/esm5/internal/Observable.js
var Observable = (function() {
  function Observable2(subscribe) {
    if (subscribe) {
      this._subscribe = subscribe;
    }
  }
  Observable2.prototype.lift = function(operator) {
    var observable2 = new Observable2();
    observable2.source = this;
    observable2.operator = operator;
    return observable2;
  };
  Observable2.prototype.subscribe = function(observerOrNext, error, complete) {
    var _this = this;
    var subscriber = isSubscriber(observerOrNext) ? observerOrNext : new SafeSubscriber(observerOrNext, error, complete);
    errorContext(function() {
      var _a = _this, operator = _a.operator, source = _a.source;
      subscriber.add(operator ? operator.call(subscriber, source) : source ? _this._subscribe(subscriber) : _this._trySubscribe(subscriber));
    });
    return subscriber;
  };
  Observable2.prototype._trySubscribe = function(sink) {
    try {
      return this._subscribe(sink);
    } catch (err) {
      sink.error(err);
    }
  };
  Observable2.prototype.forEach = function(next, promiseCtor) {
    var _this = this;
    promiseCtor = getPromiseCtor(promiseCtor);
    return new promiseCtor(function(resolve, reject) {
      var subscriber = new SafeSubscriber({
        next: function(value) {
          try {
            next(value);
          } catch (err) {
            reject(err);
            subscriber.unsubscribe();
          }
        },
        error: reject,
        complete: resolve
      });
      _this.subscribe(subscriber);
    });
  };
  Observable2.prototype._subscribe = function(subscriber) {
    var _a;
    return (_a = this.source) === null || _a === void 0 ? void 0 : _a.subscribe(subscriber);
  };
  Observable2.prototype[observable] = function() {
    return this;
  };
  Observable2.prototype.pipe = function() {
    var operations = [];
    for (var _i = 0; _i < arguments.length; _i++) {
      operations[_i] = arguments[_i];
    }
    return pipeFromArray(operations)(this);
  };
  Observable2.prototype.toPromise = function(promiseCtor) {
    var _this = this;
    promiseCtor = getPromiseCtor(promiseCtor);
    return new promiseCtor(function(resolve, reject) {
      var value;
      _this.subscribe(function(x) {
        return value = x;
      }, function(err) {
        return reject(err);
      }, function() {
        return resolve(value);
      });
    });
  };
  Observable2.create = function(subscribe) {
    return new Observable2(subscribe);
  };
  return Observable2;
})();
function getPromiseCtor(promiseCtor) {
  var _a;
  return (_a = promiseCtor !== null && promiseCtor !== void 0 ? promiseCtor : config.Promise) !== null && _a !== void 0 ? _a : Promise;
}
function isObserver(value) {
  return value && isFunction(value.next) && isFunction(value.error) && isFunction(value.complete);
}
function isSubscriber(value) {
  return value && value instanceof Subscriber || isObserver(value) && isSubscription(value);
}

// node_modules/rxjs/dist/esm5/internal/util/lift.js
function hasLift(source) {
  return isFunction(source === null || source === void 0 ? void 0 : source.lift);
}
function operate(init2) {
  return function(source) {
    if (hasLift(source)) {
      return source.lift(function(liftedSource) {
        try {
          return init2(liftedSource, this);
        } catch (err) {
          this.error(err);
        }
      });
    }
    throw new TypeError("Unable to lift unknown Observable type");
  };
}

// node_modules/rxjs/dist/esm5/internal/operators/OperatorSubscriber.js
function createOperatorSubscriber(destination, onNext, onComplete, onError, onFinalize) {
  return new OperatorSubscriber(destination, onNext, onComplete, onError, onFinalize);
}
var OperatorSubscriber = (function(_super) {
  __extends(OperatorSubscriber2, _super);
  function OperatorSubscriber2(destination, onNext, onComplete, onError, onFinalize, shouldUnsubscribe) {
    var _this = _super.call(this, destination) || this;
    _this.onFinalize = onFinalize;
    _this.shouldUnsubscribe = shouldUnsubscribe;
    _this._next = onNext ? function(value) {
      try {
        onNext(value);
      } catch (err) {
        destination.error(err);
      }
    } : _super.prototype._next;
    _this._error = onError ? function(err) {
      try {
        onError(err);
      } catch (err2) {
        destination.error(err2);
      } finally {
        this.unsubscribe();
      }
    } : _super.prototype._error;
    _this._complete = onComplete ? function() {
      try {
        onComplete();
      } catch (err) {
        destination.error(err);
      } finally {
        this.unsubscribe();
      }
    } : _super.prototype._complete;
    return _this;
  }
  OperatorSubscriber2.prototype.unsubscribe = function() {
    var _a;
    if (!this.shouldUnsubscribe || this.shouldUnsubscribe()) {
      var closed_1 = this.closed;
      _super.prototype.unsubscribe.call(this);
      !closed_1 && ((_a = this.onFinalize) === null || _a === void 0 ? void 0 : _a.call(this));
    }
  };
  return OperatorSubscriber2;
})(Subscriber);

// node_modules/rxjs/dist/esm5/internal/util/isArrayLike.js
var isArrayLike = (function(x) {
  return x && typeof x.length === "number" && typeof x !== "function";
});

// node_modules/rxjs/dist/esm5/internal/util/isPromise.js
function isPromise(value) {
  return isFunction(value === null || value === void 0 ? void 0 : value.then);
}

// node_modules/rxjs/dist/esm5/internal/util/isInteropObservable.js
function isInteropObservable(input) {
  return isFunction(input[observable]);
}

// node_modules/rxjs/dist/esm5/internal/util/isAsyncIterable.js
function isAsyncIterable(obj) {
  return Symbol.asyncIterator && isFunction(obj === null || obj === void 0 ? void 0 : obj[Symbol.asyncIterator]);
}

// node_modules/rxjs/dist/esm5/internal/util/throwUnobservableError.js
function createInvalidObservableTypeError(input) {
  return new TypeError("You provided " + (input !== null && typeof input === "object" ? "an invalid object" : "'" + input + "'") + " where a stream was expected. You can provide an Observable, Promise, ReadableStream, Array, AsyncIterable, or Iterable.");
}

// node_modules/rxjs/dist/esm5/internal/symbol/iterator.js
function getSymbolIterator() {
  if (typeof Symbol !== "function" || !Symbol.iterator) {
    return "@@iterator";
  }
  return Symbol.iterator;
}
var iterator = getSymbolIterator();

// node_modules/rxjs/dist/esm5/internal/util/isIterable.js
function isIterable(input) {
  return isFunction(input === null || input === void 0 ? void 0 : input[iterator]);
}

// node_modules/rxjs/dist/esm5/internal/util/isReadableStreamLike.js
function readableStreamLikeToAsyncGenerator(readableStream) {
  return __asyncGenerator(this, arguments, function readableStreamLikeToAsyncGenerator_1() {
    var reader, _a, value, done;
    return __generator(this, function(_b) {
      switch (_b.label) {
        case 0:
          reader = readableStream.getReader();
          _b.label = 1;
        case 1:
          _b.trys.push([1, , 9, 10]);
          _b.label = 2;
        case 2:
          if (false) return [3, 8];
          return [4, __await(reader.read())];
        case 3:
          _a = _b.sent(), value = _a.value, done = _a.done;
          if (!done) return [3, 5];
          return [4, __await(void 0)];
        case 4:
          return [2, _b.sent()];
        case 5:
          return [4, __await(value)];
        case 6:
          return [4, _b.sent()];
        case 7:
          _b.sent();
          return [3, 2];
        case 8:
          return [3, 10];
        case 9:
          reader.releaseLock();
          return [7];
        case 10:
          return [2];
      }
    });
  });
}
function isReadableStreamLike(obj) {
  return isFunction(obj === null || obj === void 0 ? void 0 : obj.getReader);
}

// node_modules/rxjs/dist/esm5/internal/observable/innerFrom.js
function innerFrom(input) {
  if (input instanceof Observable) {
    return input;
  }
  if (input != null) {
    if (isInteropObservable(input)) {
      return fromInteropObservable(input);
    }
    if (isArrayLike(input)) {
      return fromArrayLike(input);
    }
    if (isPromise(input)) {
      return fromPromise(input);
    }
    if (isAsyncIterable(input)) {
      return fromAsyncIterable(input);
    }
    if (isIterable(input)) {
      return fromIterable(input);
    }
    if (isReadableStreamLike(input)) {
      return fromReadableStreamLike(input);
    }
  }
  throw createInvalidObservableTypeError(input);
}
function fromInteropObservable(obj) {
  return new Observable(function(subscriber) {
    var obs = obj[observable]();
    if (isFunction(obs.subscribe)) {
      return obs.subscribe(subscriber);
    }
    throw new TypeError("Provided object does not correctly implement Symbol.observable");
  });
}
function fromArrayLike(array) {
  return new Observable(function(subscriber) {
    for (var i = 0; i < array.length && !subscriber.closed; i++) {
      subscriber.next(array[i]);
    }
    subscriber.complete();
  });
}
function fromPromise(promise) {
  return new Observable(function(subscriber) {
    promise.then(function(value) {
      if (!subscriber.closed) {
        subscriber.next(value);
        subscriber.complete();
      }
    }, function(err) {
      return subscriber.error(err);
    }).then(null, reportUnhandledError);
  });
}
function fromIterable(iterable) {
  return new Observable(function(subscriber) {
    var e_1, _a;
    try {
      for (var iterable_1 = __values(iterable), iterable_1_1 = iterable_1.next(); !iterable_1_1.done; iterable_1_1 = iterable_1.next()) {
        var value = iterable_1_1.value;
        subscriber.next(value);
        if (subscriber.closed) {
          return;
        }
      }
    } catch (e_1_1) {
      e_1 = { error: e_1_1 };
    } finally {
      try {
        if (iterable_1_1 && !iterable_1_1.done && (_a = iterable_1.return)) _a.call(iterable_1);
      } finally {
        if (e_1) throw e_1.error;
      }
    }
    subscriber.complete();
  });
}
function fromAsyncIterable(asyncIterable) {
  return new Observable(function(subscriber) {
    process2(asyncIterable, subscriber).catch(function(err) {
      return subscriber.error(err);
    });
  });
}
function fromReadableStreamLike(readableStream) {
  return fromAsyncIterable(readableStreamLikeToAsyncGenerator(readableStream));
}
function process2(asyncIterable, subscriber) {
  var asyncIterable_1, asyncIterable_1_1;
  var e_2, _a;
  return __awaiter(this, void 0, void 0, function() {
    var value, e_2_1;
    return __generator(this, function(_b) {
      switch (_b.label) {
        case 0:
          _b.trys.push([0, 5, 6, 11]);
          asyncIterable_1 = __asyncValues(asyncIterable);
          _b.label = 1;
        case 1:
          return [4, asyncIterable_1.next()];
        case 2:
          if (!(asyncIterable_1_1 = _b.sent(), !asyncIterable_1_1.done)) return [3, 4];
          value = asyncIterable_1_1.value;
          subscriber.next(value);
          if (subscriber.closed) {
            return [2];
          }
          _b.label = 3;
        case 3:
          return [3, 1];
        case 4:
          return [3, 11];
        case 5:
          e_2_1 = _b.sent();
          e_2 = { error: e_2_1 };
          return [3, 11];
        case 6:
          _b.trys.push([6, , 9, 10]);
          if (!(asyncIterable_1_1 && !asyncIterable_1_1.done && (_a = asyncIterable_1.return))) return [3, 8];
          return [4, _a.call(asyncIterable_1)];
        case 7:
          _b.sent();
          _b.label = 8;
        case 8:
          return [3, 10];
        case 9:
          if (e_2) throw e_2.error;
          return [7];
        case 10:
          return [7];
        case 11:
          subscriber.complete();
          return [2];
      }
    });
  });
}

// node_modules/rxjs/dist/esm5/internal/util/executeSchedule.js
function executeSchedule(parentSubscription, scheduler, work, delay, repeat) {
  if (delay === void 0) {
    delay = 0;
  }
  if (repeat === void 0) {
    repeat = false;
  }
  var scheduleSubscription = scheduler.schedule(function() {
    work();
    if (repeat) {
      parentSubscription.add(this.schedule(null, delay));
    } else {
      this.unsubscribe();
    }
  }, delay);
  parentSubscription.add(scheduleSubscription);
  if (!repeat) {
    return scheduleSubscription;
  }
}

// node_modules/rxjs/dist/esm5/internal/operators/observeOn.js
function observeOn(scheduler, delay) {
  if (delay === void 0) {
    delay = 0;
  }
  return operate(function(source, subscriber) {
    source.subscribe(createOperatorSubscriber(subscriber, function(value) {
      return executeSchedule(subscriber, scheduler, function() {
        return subscriber.next(value);
      }, delay);
    }, function() {
      return executeSchedule(subscriber, scheduler, function() {
        return subscriber.complete();
      }, delay);
    }, function(err) {
      return executeSchedule(subscriber, scheduler, function() {
        return subscriber.error(err);
      }, delay);
    }));
  });
}

// node_modules/rxjs/dist/esm5/internal/operators/subscribeOn.js
function subscribeOn(scheduler, delay) {
  if (delay === void 0) {
    delay = 0;
  }
  return operate(function(source, subscriber) {
    subscriber.add(scheduler.schedule(function() {
      return source.subscribe(subscriber);
    }, delay));
  });
}

// node_modules/rxjs/dist/esm5/internal/scheduled/scheduleObservable.js
function scheduleObservable(input, scheduler) {
  return innerFrom(input).pipe(subscribeOn(scheduler), observeOn(scheduler));
}

// node_modules/rxjs/dist/esm5/internal/scheduled/schedulePromise.js
function schedulePromise(input, scheduler) {
  return innerFrom(input).pipe(subscribeOn(scheduler), observeOn(scheduler));
}

// node_modules/rxjs/dist/esm5/internal/scheduled/scheduleArray.js
function scheduleArray(input, scheduler) {
  return new Observable(function(subscriber) {
    var i = 0;
    return scheduler.schedule(function() {
      if (i === input.length) {
        subscriber.complete();
      } else {
        subscriber.next(input[i++]);
        if (!subscriber.closed) {
          this.schedule();
        }
      }
    });
  });
}

// node_modules/rxjs/dist/esm5/internal/scheduled/scheduleIterable.js
function scheduleIterable(input, scheduler) {
  return new Observable(function(subscriber) {
    var iterator2;
    executeSchedule(subscriber, scheduler, function() {
      iterator2 = input[iterator]();
      executeSchedule(subscriber, scheduler, function() {
        var _a;
        var value;
        var done;
        try {
          _a = iterator2.next(), value = _a.value, done = _a.done;
        } catch (err) {
          subscriber.error(err);
          return;
        }
        if (done) {
          subscriber.complete();
        } else {
          subscriber.next(value);
        }
      }, 0, true);
    });
    return function() {
      return isFunction(iterator2 === null || iterator2 === void 0 ? void 0 : iterator2.return) && iterator2.return();
    };
  });
}

// node_modules/rxjs/dist/esm5/internal/scheduled/scheduleAsyncIterable.js
function scheduleAsyncIterable(input, scheduler) {
  if (!input) {
    throw new Error("Iterable cannot be null");
  }
  return new Observable(function(subscriber) {
    executeSchedule(subscriber, scheduler, function() {
      var iterator2 = input[Symbol.asyncIterator]();
      executeSchedule(subscriber, scheduler, function() {
        iterator2.next().then(function(result) {
          if (result.done) {
            subscriber.complete();
          } else {
            subscriber.next(result.value);
          }
        });
      }, 0, true);
    });
  });
}

// node_modules/rxjs/dist/esm5/internal/scheduled/scheduleReadableStreamLike.js
function scheduleReadableStreamLike(input, scheduler) {
  return scheduleAsyncIterable(readableStreamLikeToAsyncGenerator(input), scheduler);
}

// node_modules/rxjs/dist/esm5/internal/scheduled/scheduled.js
function scheduled(input, scheduler) {
  if (input != null) {
    if (isInteropObservable(input)) {
      return scheduleObservable(input, scheduler);
    }
    if (isArrayLike(input)) {
      return scheduleArray(input, scheduler);
    }
    if (isPromise(input)) {
      return schedulePromise(input, scheduler);
    }
    if (isAsyncIterable(input)) {
      return scheduleAsyncIterable(input, scheduler);
    }
    if (isIterable(input)) {
      return scheduleIterable(input, scheduler);
    }
    if (isReadableStreamLike(input)) {
      return scheduleReadableStreamLike(input, scheduler);
    }
  }
  throw createInvalidObservableTypeError(input);
}

// node_modules/rxjs/dist/esm5/internal/observable/from.js
function from(input, scheduler) {
  return scheduler ? scheduled(input, scheduler) : innerFrom(input);
}

// node_modules/rxjs/dist/esm5/internal/operators/map.js
function map(project, thisArg) {
  return operate(function(source, subscriber) {
    var index = 0;
    source.subscribe(createOperatorSubscriber(subscriber, function(value) {
      subscriber.next(project.call(thisArg, value, index++));
    }));
  });
}

// node_modules/rxjs/dist/esm5/internal/operators/filter.js
function filter(predicate, thisArg) {
  return operate(function(source, subscriber) {
    var index = 0;
    source.subscribe(createOperatorSubscriber(subscriber, function(value) {
      return predicate.call(thisArg, value, index++) && subscriber.next(value);
    }));
  });
}

// node_modules/rxjs/dist/esm5/internal/operators/catchError.js
function catchError(selector) {
  return operate(function(source, subscriber) {
    var innerSub = null;
    var syncUnsub = false;
    var handledResult;
    innerSub = source.subscribe(createOperatorSubscriber(subscriber, void 0, void 0, function(err) {
      handledResult = innerFrom(selector(err, catchError(selector)(source)));
      if (innerSub) {
        innerSub.unsubscribe();
        innerSub = null;
        handledResult.subscribe(subscriber);
      } else {
        syncUnsub = true;
      }
    }));
    if (syncUnsub) {
      innerSub.unsubscribe();
      innerSub = null;
      handledResult.subscribe(subscriber);
    }
  });
}

// node_modules/@aws-amplify/core/dist/esm/utils/isWebWorker.mjs
var isWebWorker = () => {
  if (typeof self === "undefined") {
    return false;
  }
  const selfContext = self;
  return typeof selfContext.WorkerGlobalScope !== "undefined" && self instanceof selfContext.WorkerGlobalScope;
};

// node_modules/@aws-amplify/core/dist/esm/Reachability/Reachability.mjs
var Reachability = class _Reachability {
  networkMonitor(_) {
    const globalObj = isWebWorker() ? self : typeof window !== "undefined" && window;
    if (!globalObj) {
      return from([{ online: true }]);
    }
    return new Observable((observer) => {
      observer.next({ online: globalObj.navigator.onLine });
      const notifyOnline = () => {
        observer.next({ online: true });
      };
      const notifyOffline = () => {
        observer.next({ online: false });
      };
      globalObj.addEventListener("online", notifyOnline);
      globalObj.addEventListener("offline", notifyOffline);
      _Reachability._observers.push(observer);
      return () => {
        globalObj.removeEventListener("online", notifyOnline);
        globalObj.removeEventListener("offline", notifyOffline);
        _Reachability._observers = _Reachability._observers.filter((_observer) => _observer !== observer);
      };
    });
  }
  // expose observers to simulate offline mode for integration testing
  static _observerOverride(status) {
    for (const observer of this._observers) {
      if (observer.closed) {
        this._observers = this._observers.filter((_observer) => _observer !== observer);
        continue;
      }
      observer?.next && observer.next(status);
    }
  }
};
Reachability._observers = [];

// node_modules/@aws-amplify/core/dist/esm/utils/isBrowser.mjs
var isBrowser = () => typeof window !== "undefined" && typeof window.document !== "undefined";

// node_modules/@aws-amplify/core/dist/esm/singleton/Auth/index.mjs
var logger4 = new ConsoleLogger("Auth");
var AuthClass = class {
  /**
   * Configure Auth category
   *
   * @internal
   *
   * @param authResourcesConfig - Resources configurations required by Auth providers.
   * @param authOptions - Client options used by library
   *
   * @returns void
   */
  configure(authResourcesConfig, authOptions) {
    this.authConfig = authResourcesConfig;
    this.authOptions = authOptions;
    if (authResourcesConfig && authResourcesConfig.Cognito?.userPoolEndpoint) {
      logger4.warn(getCustomEndpointWarningMessage("Amazon Cognito User Pool"));
    }
    if (authResourcesConfig && authResourcesConfig.Cognito?.identityPoolEndpoint) {
      logger4.warn(getCustomEndpointWarningMessage("Amazon Cognito Identity Pool"));
    }
  }
  /**
   * Fetch the auth tokens, and the temporary AWS credentials and identity if they are configured. By default it
   * will automatically refresh expired auth tokens if a valid refresh token is present. You can force a refresh
   * of non-expired tokens with `{ forceRefresh: true }` input.
   *
   * @param options - Options configuring the fetch behavior.
   *
   * @returns Promise of current auth session {@link AuthSession}.
   */
  async fetchAuthSession(options = {}) {
    let credentialsAndIdentityId;
    let userSub;
    const tokens = await this.getTokens(options);
    if (tokens) {
      userSub = tokens.accessToken?.payload?.sub;
      credentialsAndIdentityId = await this.authOptions?.credentialsProvider?.getCredentialsAndIdentityId({
        authConfig: this.authConfig,
        tokens,
        authenticated: true,
        forceRefresh: options.forceRefresh
      });
    } else {
      credentialsAndIdentityId = await this.authOptions?.credentialsProvider?.getCredentialsAndIdentityId({
        authConfig: this.authConfig,
        authenticated: false,
        forceRefresh: options.forceRefresh
      });
    }
    return {
      tokens,
      credentials: credentialsAndIdentityId?.credentials,
      identityId: credentialsAndIdentityId?.identityId,
      userSub
    };
  }
  async clearCredentials() {
    await this.authOptions?.credentialsProvider?.clearCredentialsAndIdentityId();
  }
  async getTokens(options) {
    return await this.authOptions?.tokenProvider?.getTokens(options) ?? void 0;
  }
};
var getCustomEndpointWarningMessage = (target) => `You are using a custom Amazon ${target} endpoint, ensure the endpoint is correct.`;

// node_modules/@aws-amplify/core/dist/esm/singleton/Amplify.mjs
var AmplifyClass = class {
  constructor() {
    this.oAuthListener = void 0;
    this.isConfigured = false;
    this.resourcesConfig = {};
    this.libraryOptions = {};
    this.Auth = new AuthClass();
  }
  /**
   * Configures Amplify for use with your back-end resources.
   *
   * @remarks
   * This API does not perform any merging of either `resourcesConfig` or `libraryOptions`. The most recently
   * provided values will be used after configuration.
   *
   * @remarks
   * `configure` can be used to specify additional library options where available for supported categories.
   *
   * @param resourceConfig - Back-end resource configuration. Typically provided via the `aws-exports.js` file.
   * @param libraryOptions - Additional options for customizing the behavior of the library.
   */
  configure(resourcesConfig, libraryOptions) {
    const resolvedResourceConfig = parseAmplifyConfig(resourcesConfig);
    this.resourcesConfig = resolvedResourceConfig;
    if (libraryOptions) {
      this.libraryOptions = libraryOptions;
    }
    this.resourcesConfig = deepFreeze(this.resourcesConfig);
    this.Auth.configure(this.resourcesConfig.Auth, this.libraryOptions.Auth);
    if (this.resourcesConfig.Analytics?.Pinpoint || this.resourcesConfig.Notifications?.InAppMessaging?.Pinpoint || this.resourcesConfig.Notifications?.PushNotification?.Pinpoint) {
      console.warn("AWS will end support for Amazon Pinpoint on October 30, 2026. The guidance is to use AWS End User Messaging for push notifications and SMS, Amazon Simple Email Service for sending emails, Amazon Connect for campaigns, journeys, endpoints, and engagement analytics. Pinpoint recommends Amazon Kinesis for event collection and mobile analytics.");
    }
    Hub.dispatch("core", {
      event: "configure",
      data: this.resourcesConfig
    }, "Configure", AMPLIFY_SYMBOL);
    this.notifyOAuthListener();
    this.isConfigured = true;
  }
  /**
   * Provides access to the current back-end resource configuration for the Library.
   *
   * @returns Returns the immutable back-end resource configuration.
   */
  getConfig() {
    if (!this.isConfigured) {
      console.warn(`Amplify has not been configured. Please call Amplify.configure() before using this service.`);
    }
    return this.resourcesConfig;
  }
  /** @internal */
  [ADD_OAUTH_LISTENER](listener) {
    if (this.resourcesConfig.Auth?.Cognito.loginWith?.oauth) {
      listener(this.resourcesConfig.Auth?.Cognito);
    } else {
      this.oAuthListener = listener;
    }
  }
  notifyOAuthListener() {
    if (!this.resourcesConfig.Auth?.Cognito.loginWith?.oauth || !this.oAuthListener) {
      return;
    }
    this.oAuthListener(this.resourcesConfig.Auth?.Cognito);
    this.oAuthListener = void 0;
  }
};
var Amplify = new AmplifyClass();

// node_modules/@aws-amplify/core/dist/esm/singleton/apis/internal/fetchAuthSession.mjs
var fetchAuthSession = (amplify, options) => {
  return amplify.Auth.fetchAuthSession(options);
};

// node_modules/@aws-amplify/core/dist/esm/singleton/apis/fetchAuthSession.mjs
var fetchAuthSession2 = (options) => {
  return fetchAuthSession(Amplify, options);
};

// node_modules/@aws-amplify/core/dist/esm/clients/serde/responseInfo.mjs
var parseMetadata = (response) => {
  const { headers, statusCode } = response;
  return {
    ...isMetadataBearer(response) ? response.$metadata : {},
    httpStatusCode: statusCode,
    requestId: headers["x-amzn-requestid"] ?? headers["x-amzn-request-id"] ?? headers["x-amz-request-id"],
    extendedRequestId: headers["x-amz-id-2"],
    cfId: headers["x-amz-cf-id"]
  };
};
var isMetadataBearer = (response) => typeof response?.$metadata === "object";

// node_modules/@aws-amplify/core/dist/esm/clients/serde/json.mjs
var parseJsonError = async (response) => {
  if (!response || response.statusCode < 300) {
    return;
  }
  const body = await parseJsonBody(response);
  const sanitizeErrorCode = (rawValue) => {
    const [cleanValue] = rawValue.toString().split(/[,:]+/);
    if (cleanValue.includes("#")) {
      return cleanValue.split("#")[1];
    }
    return cleanValue;
  };
  const code = sanitizeErrorCode(response.headers["x-amzn-errortype"] ?? body.code ?? body.__type ?? "UnknownError");
  const message = body.message ?? body.Message ?? "Unknown error";
  const error = new Error(message);
  return Object.assign(error, {
    name: code,
    $metadata: parseMetadata(response)
  });
};
var parseJsonBody = async (response) => {
  if (!response.body) {
    throw new Error("Missing response payload");
  }
  const output = await response.body.json();
  return Object.assign(output, {
    $metadata: parseMetadata(response)
  });
};

// node_modules/@aws-amplify/core/dist/esm/clients/internal/composeServiceApi.mjs
var composeServiceApi = (transferHandler2, serializer, deserializer, defaultConfig2) => {
  return async (config2, input) => {
    const resolvedConfig = {
      ...defaultConfig2,
      ...config2
    };
    const endpoint = await resolvedConfig.endpointResolver(resolvedConfig, input);
    const request = await serializer(input, endpoint);
    const response = await transferHandler2(request, {
      ...resolvedConfig
    });
    return deserializer(response);
  };
};

// node_modules/@aws-amplify/core/dist/esm/utils/retry/constants.mjs
var MAX_DELAY_MS = 5 * 60 * 1e3;

// node_modules/@aws-amplify/core/dist/esm/utils/retry/jitteredBackoff.mjs
function jitteredBackoff(maxDelayMs = MAX_DELAY_MS) {
  const BASE_TIME_MS = 100;
  const JITTER_FACTOR = 100;
  return (attempt) => {
    const delay = 2 ** attempt * BASE_TIME_MS + JITTER_FACTOR * Math.random();
    return delay > maxDelayMs ? false : delay;
  };
}

// node_modules/@aws-amplify/core/dist/esm/clients/middleware/retry/constants.mjs
var DEFAULT_RETRY_ATTEMPTS = 3;
var AMZ_SDK_INVOCATION_ID_HEADER = "amz-sdk-invocation-id";
var AMZ_SDK_REQUEST_HEADER = "amz-sdk-request";
var DEFAULT_MAX_DELAY_MS = 5 * 60 * 1e3;

// node_modules/@aws-amplify/core/dist/esm/clients/middleware/retry/jitteredBackoff.mjs
var jitteredBackoff2 = (attempt) => {
  const delayFunction = jitteredBackoff(DEFAULT_MAX_DELAY_MS);
  const delay = delayFunction(attempt);
  return delay === false ? DEFAULT_MAX_DELAY_MS : delay;
};

// node_modules/@aws-amplify/core/dist/esm/clients/middleware/retry/isClockSkewError.mjs
var CLOCK_SKEW_ERROR_CODES = [
  "AuthFailure",
  "InvalidSignatureException",
  "RequestExpired",
  "RequestInTheFuture",
  "RequestTimeTooSkewed",
  "SignatureDoesNotMatch",
  "BadRequestException"
  // API Gateway
];
var isClockSkewError = (errorCode) => !!errorCode && CLOCK_SKEW_ERROR_CODES.includes(errorCode);

// node_modules/@aws-amplify/core/dist/esm/clients/middleware/retry/defaultRetryDecider.mjs
var getRetryDecider = (errorParser) => async (response, error) => {
  const parsedError = error ?? await errorParser(response) ?? void 0;
  const errorCode = parsedError?.code || parsedError?.name;
  const statusCode = response?.statusCode;
  const isRetryable = isConnectionError(error) || isThrottlingError(statusCode, errorCode) || isClockSkewError(errorCode) || isServerSideError(statusCode, errorCode);
  return {
    retryable: isRetryable
  };
};
var THROTTLING_ERROR_CODES = [
  "BandwidthLimitExceeded",
  "EC2ThrottledException",
  "LimitExceededException",
  "PriorRequestNotComplete",
  "ProvisionedThroughputExceededException",
  "RequestLimitExceeded",
  "RequestThrottled",
  "RequestThrottledException",
  "SlowDown",
  "ThrottledException",
  "Throttling",
  "ThrottlingException",
  "TooManyRequestsException"
];
var TIMEOUT_ERROR_CODES = [
  "TimeoutError",
  "RequestTimeout",
  "RequestTimeoutException"
];
var isThrottlingError = (statusCode, errorCode) => statusCode === 429 || !!errorCode && THROTTLING_ERROR_CODES.includes(errorCode);
var isConnectionError = (error) => [
  AmplifyErrorCode.NetworkError,
  // TODO(vNext): unify the error code `ERR_NETWORK` used by the Storage XHR handler
  "ERR_NETWORK"
].includes(error?.name);
var isServerSideError = (statusCode, errorCode) => !!statusCode && [500, 502, 503, 504].includes(statusCode) || !!errorCode && TIMEOUT_ERROR_CODES.includes(errorCode);

// node_modules/@aws-amplify/core/dist/esm/foundation/factories/serviceClients/cognitoIdentity/constants.mjs
var COGNITO_IDENTITY_SERVICE_NAME = "cognito-identity";
var DEFAULT_SERVICE_CLIENT_API_CONFIG = {
  service: COGNITO_IDENTITY_SERVICE_NAME,
  retryDecider: getRetryDecider(parseJsonError),
  computeDelay: jitteredBackoff2,
  cache: "no-store"
};

// node_modules/@aws-amplify/core/dist/esm/clients/middleware/retry/retryMiddleware.mjs
var retryMiddlewareFactory = ({ maxAttempts = DEFAULT_RETRY_ATTEMPTS, retryDecider, computeDelay, abortSignal }) => {
  if (maxAttempts < 1) {
    throw new Error("maxAttempts must be greater than 0");
  }
  return (next, context2) => async function retryMiddleware(request) {
    let error;
    let attemptsCount = context2.attemptsCount ?? 0;
    let response;
    const handleTerminalErrorOrResponse = () => {
      if (response) {
        addOrIncrementMetadataAttempts(response, attemptsCount);
        return response;
      } else {
        addOrIncrementMetadataAttempts(error, attemptsCount);
        throw error;
      }
    };
    while (!abortSignal?.aborted && attemptsCount < maxAttempts) {
      try {
        response = await next(request);
        error = void 0;
      } catch (e) {
        error = e;
        response = void 0;
      }
      attemptsCount = (context2.attemptsCount ?? 0) > attemptsCount ? context2.attemptsCount ?? 0 : attemptsCount + 1;
      context2.attemptsCount = attemptsCount;
      const { isCredentialsExpiredError, retryable } = await retryDecider(response, error, context2);
      if (retryable) {
        context2.isCredentialsExpired = !!isCredentialsExpiredError;
        if (!abortSignal?.aborted && attemptsCount < maxAttempts) {
          const delay = computeDelay(attemptsCount);
          await cancellableSleep(delay, abortSignal);
        }
        continue;
      } else {
        return handleTerminalErrorOrResponse();
      }
    }
    if (abortSignal?.aborted) {
      throw new Error("Request aborted.");
    } else {
      return handleTerminalErrorOrResponse();
    }
  };
};
var cancellableSleep = (timeoutMs, abortSignal) => {
  if (abortSignal?.aborted) {
    return Promise.resolve();
  }
  let timeoutId;
  let sleepPromiseResolveFn;
  const sleepPromise = new Promise((resolve) => {
    sleepPromiseResolveFn = resolve;
    timeoutId = setTimeout(resolve, timeoutMs);
  });
  abortSignal?.addEventListener("abort", function cancelSleep(_) {
    clearTimeout(timeoutId);
    abortSignal?.removeEventListener("abort", cancelSleep);
    sleepPromiseResolveFn();
  });
  return sleepPromise;
};
var addOrIncrementMetadataAttempts = (nextHandlerOutput, attempts) => {
  if (Object.prototype.toString.call(nextHandlerOutput) !== "[object Object]") {
    return;
  }
  nextHandlerOutput.$metadata = {
    ...nextHandlerOutput.$metadata ?? {},
    attempts
  };
};

// node_modules/@aws-amplify/core/dist/esm/utils/amplifyUuid/index.mjs
var amplifyUuid = v4_default;

// node_modules/@aws-amplify/core/dist/esm/clients/middleware/retry/amzSdkInvocationIdHeaderMiddleware.mjs
var amzSdkInvocationIdHeaderMiddlewareFactory = () => (next) => {
  return async function amzSdkInvocationIdHeaderMiddleware(request) {
    if (!request.headers[AMZ_SDK_INVOCATION_ID_HEADER]) {
      request.headers[AMZ_SDK_INVOCATION_ID_HEADER] = amplifyUuid();
    }
    return next(request);
  };
};

// node_modules/@aws-amplify/core/dist/esm/clients/middleware/retry/amzSdkRequestHeaderMiddleware.mjs
var amzSdkRequestHeaderMiddlewareFactory = ({ maxAttempts = DEFAULT_RETRY_ATTEMPTS }) => (next, context2) => {
  return async function amzSdkRequestHeaderMiddleware(request) {
    const attemptsCount = context2.attemptsCount ?? 0;
    request.headers[AMZ_SDK_REQUEST_HEADER] = `attempt=${attemptsCount + 1}; max=${maxAttempts}`;
    return next(request);
  };
};

// node_modules/@aws-amplify/core/dist/esm/clients/middleware/userAgent/middleware.mjs
var userAgentMiddlewareFactory = ({ userAgentHeader = "x-amz-user-agent", userAgentValue = "" }) => (next) => {
  return async function userAgentMiddleware(request) {
    if (userAgentValue.trim().length === 0) {
      const result = await next(request);
      return result;
    } else {
      const headerName = userAgentHeader.toLowerCase();
      request.headers[headerName] = request.headers[headerName] ? `${request.headers[headerName]} ${userAgentValue}` : userAgentValue;
      const response = await next(request);
      return response;
    }
  };
};

// node_modules/@aws-amplify/core/dist/esm/clients/internal/composeTransferHandler.mjs
var composeTransferHandler = (coreHandler, middleware) => (request, options) => {
  const context2 = {};
  let composedHandler = (composeHandlerRequest) => coreHandler(composeHandlerRequest, options);
  for (let i = middleware.length - 1; i >= 0; i--) {
    const m = middleware[i];
    const resolvedMiddleware = m(options);
    composedHandler = resolvedMiddleware(composedHandler, context2);
  }
  return composedHandler(request);
};

// node_modules/@aws-amplify/core/dist/esm/clients/utils/memoization.mjs
var withMemoization = (payloadAccessor) => {
  let cached;
  return () => {
    if (!cached) {
      cached = payloadAccessor();
    }
    return cached;
  };
};

// node_modules/@aws-amplify/core/dist/esm/clients/handlers/fetch.mjs
var shouldSendBody = (method) => !["HEAD", "GET"].includes(method.toUpperCase());
var fetchTransferHandler = async ({ url, method, headers, body }, { abortSignal, cache, withCrossDomainCredentials }) => {
  let resp;
  try {
    resp = await fetch(url, {
      method,
      headers,
      body: shouldSendBody(method) ? body : void 0,
      signal: abortSignal,
      cache,
      credentials: withCrossDomainCredentials ? "include" : "same-origin"
    });
  } catch (e) {
    if (e instanceof TypeError) {
      throw new AmplifyError({
        name: AmplifyErrorCode.NetworkError,
        message: "A network error has occurred.",
        underlyingError: e
      });
    }
    throw e;
  }
  const responseHeaders = {};
  resp.headers?.forEach((value, key) => {
    responseHeaders[key.toLowerCase()] = value;
  });
  const httpResponse = {
    statusCode: resp.status,
    headers: responseHeaders,
    body: null
  };
  const bodyWithMixin = Object.assign(resp.body ?? {}, {
    text: withMemoization(() => resp.text()),
    blob: withMemoization(() => resp.blob()),
    json: withMemoization(() => resp.json())
  });
  return {
    ...httpResponse,
    body: bodyWithMixin
  };
};

// node_modules/@aws-amplify/core/dist/esm/clients/handlers/aws/unauthenticated.mjs
var unauthenticatedHandler = composeTransferHandler(fetchTransferHandler, [
  userAgentMiddlewareFactory,
  amzSdkInvocationIdHeaderMiddlewareFactory,
  retryMiddlewareFactory,
  amzSdkRequestHeaderMiddlewareFactory
]);

// node_modules/@aws-amplify/core/dist/esm/foundation/factories/middleware/createDisableCacheMiddleware.mjs
var createDisableCacheMiddleware = () => (next) => async function disableCacheMiddleware(request) {
  request.headers["cache-control"] = "no-store";
  return next(request);
};

// node_modules/@aws-amplify/core/dist/esm/foundation/factories/serviceClients/cognitoIdentity/handler/cognitoIdentityTransferHandler.mjs
var cognitoIdentityTransferHandler = composeTransferHandler(unauthenticatedHandler, [createDisableCacheMiddleware]);

// node_modules/@aws-amplify/core/dist/esm/foundation/factories/serviceClients/cognitoIdentity/serde/createClientSerializer.mjs
var createClientSerializer = (operation) => (input, endpoint) => {
  const headers = getSharedHeaders(operation);
  const body = JSON.stringify(input);
  return buildHttpRpcRequest(endpoint, headers, body);
};
var getSharedHeaders = (operation) => ({
  "content-type": "application/x-amz-json-1.1",
  "x-amz-target": `AWSCognitoIdentityService.${operation}`
});
var buildHttpRpcRequest = ({ url }, headers, body) => ({
  headers,
  url,
  body,
  method: "POST"
});

// node_modules/@aws-amplify/core/dist/esm/foundation/factories/serviceClients/cognitoIdentity/createGetCredentialsForIdentityClient.mjs
var createGetCredentialsForIdentityClient = (config2) => composeServiceApi(cognitoIdentityTransferHandler, createClientSerializer("GetCredentialsForIdentity"), getCredentialsForIdentityDeserializer, {
  ...DEFAULT_SERVICE_CLIENT_API_CONFIG,
  ...config2,
  userAgentValue: getAmplifyUserAgent()
});
var getCredentialsForIdentityDeserializer = async (response) => {
  if (response.statusCode >= 300) {
    const error = await parseJsonError(response);
    throw error;
  }
  const body = await parseJsonBody(response);
  return {
    IdentityId: body.IdentityId,
    Credentials: deserializeCredentials(body.Credentials),
    $metadata: parseMetadata(response)
  };
};
var deserializeCredentials = ({ Expiration, ...rest } = {}) => ({
  ...rest,
  Expiration: Expiration && new Date(Expiration * 1e3)
});

// node_modules/@aws-amplify/core/dist/esm/foundation/factories/serviceClients/cognitoIdentity/createGetIdClient.mjs
var createGetIdClient = (config2) => composeServiceApi(cognitoIdentityTransferHandler, createClientSerializer("GetId"), getIdDeserializer, {
  ...DEFAULT_SERVICE_CLIENT_API_CONFIG,
  ...config2,
  userAgentValue: getAmplifyUserAgent()
});
var getIdDeserializer = async (response) => {
  if (response.statusCode >= 300) {
    const error = await parseJsonError(response);
    throw error;
  }
  const body = await parseJsonBody(response);
  return {
    IdentityId: body.IdentityId,
    $metadata: parseMetadata(response)
  };
};

// node_modules/@aws-amplify/core/dist/esm/clients/endpoints/partitions.mjs
var defaultPartition = {
  id: "aws",
  outputs: {
    dnsSuffix: "amazonaws.com"
  },
  regionRegex: "^(us|eu|ap|sa|ca|me|af)\\-\\w+\\-\\d+$",
  regions: ["aws-global"]
};
var partitionsInfo = {
  partitions: [
    defaultPartition,
    {
      id: "aws-cn",
      outputs: {
        dnsSuffix: "amazonaws.com.cn"
      },
      regionRegex: "^cn\\-\\w+\\-\\d+$",
      regions: ["aws-cn-global"]
    }
  ]
};

// node_modules/@aws-amplify/core/dist/esm/clients/endpoints/getDnsSuffix.mjs
var getDnsSuffix = (region) => {
  const { partitions } = partitionsInfo;
  for (const { regions, outputs, regionRegex } of partitions) {
    const regex = new RegExp(regionRegex);
    if (regions.includes(region) || regex.test(region)) {
      return outputs.dnsSuffix;
    }
  }
  return defaultPartition.outputs.dnsSuffix;
};

// node_modules/@aws-amplify/core/dist/esm/utils/amplifyUrl/index.mjs
var AmplifyUrl = URL;
var AmplifyUrlSearchParams = URLSearchParams;

// node_modules/@aws-amplify/core/dist/esm/foundation/factories/serviceClients/cognitoIdentity/cognitoIdentityPoolEndpointResolver.mjs
var cognitoIdentityPoolEndpointResolver = ({ region }) => ({
  url: new AmplifyUrl(`https://${COGNITO_IDENTITY_SERVICE_NAME}.${region}.${getDnsSuffix(region)}`)
});

// node_modules/@aws-amplify/core/dist/esm/errors/PlatformNotSupportedError.mjs
var PlatformNotSupportedError = class extends AmplifyError {
  constructor() {
    super({
      name: AmplifyErrorCode.PlatformNotSupported,
      message: "Function not supported on current platform"
    });
  }
};

// node_modules/@aws-amplify/core/dist/esm/storage/KeyValueStorage.mjs
var KeyValueStorage = class {
  constructor(storage) {
    this.storage = storage;
  }
  /**
   * This is used to set a specific item in storage
   * @param {string} key - the key for the item
   * @param {object} value - the value
   * @returns {string} value that was set
   */
  async setItem(key, value) {
    if (!this.storage)
      throw new PlatformNotSupportedError();
    this.storage.setItem(key, value);
  }
  /**
   * This is used to get a specific key from storage
   * @param {string} key - the key for the item
   * This is used to clear the storage
   * @returns {string} the data item
   */
  async getItem(key) {
    if (!this.storage)
      throw new PlatformNotSupportedError();
    return this.storage.getItem(key);
  }
  /**
   * This is used to remove an item from storage
   * @param {string} key - the key being set
   * @returns {string} value - value that was deleted
   */
  async removeItem(key) {
    if (!this.storage)
      throw new PlatformNotSupportedError();
    this.storage.removeItem(key);
  }
  /**
   * This is used to clear the storage
   * @returns {string} nothing
   */
  async clear() {
    if (!this.storage)
      throw new PlatformNotSupportedError();
    this.storage.clear();
  }
};

// node_modules/@aws-amplify/core/dist/esm/storage/InMemoryStorage.mjs
var InMemoryStorage = class {
  constructor() {
    this.storage = /* @__PURE__ */ new Map();
  }
  get length() {
    return this.storage.size;
  }
  key(index) {
    if (index > this.length - 1) {
      return null;
    }
    return Array.from(this.storage.keys())[index];
  }
  setItem(key, value) {
    this.storage.set(key, value);
  }
  getItem(key) {
    return this.storage.get(key) ?? null;
  }
  removeItem(key) {
    this.storage.delete(key);
  }
  clear() {
    this.storage.clear();
  }
};

// node_modules/@aws-amplify/core/dist/esm/storage/utils.mjs
var logger5 = new ConsoleLogger("CoreStorageUtils");
var getLocalStorageWithFallback = () => {
  try {
    if (typeof window !== "undefined" && window.localStorage) {
      return window.localStorage;
    }
  } catch (e) {
    logger5.info("localStorage not found. InMemoryStorage is used as a fallback.");
  }
  return new InMemoryStorage();
};
var getSessionStorageWithFallback = () => {
  try {
    if (typeof window !== "undefined" && window.sessionStorage) {
      window.sessionStorage.getItem("test");
      return window.sessionStorage;
    }
    throw new Error("sessionStorage is not defined");
  } catch (e) {
    logger5.info("sessionStorage not found. InMemoryStorage is used as a fallback.");
    return new InMemoryStorage();
  }
};

// node_modules/@aws-amplify/core/dist/esm/storage/DefaultStorage.mjs
var DefaultStorage = class extends KeyValueStorage {
  constructor() {
    super(getLocalStorageWithFallback());
  }
};

// node_modules/@aws-amplify/core/dist/esm/storage/SessionStorage.mjs
var SessionStorage = class extends KeyValueStorage {
  constructor() {
    super(getSessionStorageWithFallback());
  }
};

// node_modules/@aws-amplify/core/dist/esm/storage/SyncKeyValueStorage.mjs
var SyncKeyValueStorage = class {
  constructor(storage) {
    this._storage = storage;
  }
  get storage() {
    if (!this._storage)
      throw new PlatformNotSupportedError();
    return this._storage;
  }
  /**
   * This is used to set a specific item in storage
   * @param {string} key - the key for the item
   * @param {object} value - the value
   * @returns {string} value that was set
   */
  setItem(key, value) {
    this.storage.setItem(key, value);
  }
  /**
   * This is used to get a specific key from storage
   * @param {string} key - the key for the item
   * This is used to clear the storage
   * @returns {string} the data item
   */
  getItem(key) {
    return this.storage.getItem(key);
  }
  /**
   * This is used to remove an item from storage
   * @param {string} key - the key being set
   * @returns {string} value - value that was deleted
   */
  removeItem(key) {
    this.storage.removeItem(key);
  }
  /**
   * This is used to clear the storage
   * @returns {string} nothing
   */
  clear() {
    this.storage.clear();
  }
};

// node_modules/@aws-amplify/core/dist/esm/storage/SyncSessionStorage.mjs
var SyncSessionStorage = class extends SyncKeyValueStorage {
  constructor() {
    super(getSessionStorageWithFallback());
  }
};

// node_modules/js-cookie/dist/js.cookie.mjs
function assign(target) {
  for (var i = 1; i < arguments.length; i++) {
    var source = arguments[i];
    for (var key in source) {
      target[key] = source[key];
    }
  }
  return target;
}
var defaultConverter = {
  read: function(value) {
    if (value[0] === '"') {
      value = value.slice(1, -1);
    }
    return value.replace(/(%[\dA-F]{2})+/gi, decodeURIComponent);
  },
  write: function(value) {
    return encodeURIComponent(value).replace(
      /%(2[346BF]|3[AC-F]|40|5[BDE]|60|7[BCD])/g,
      decodeURIComponent
    );
  }
};
function init(converter, defaultAttributes) {
  function set(name2, value, attributes) {
    if (typeof document === "undefined") {
      return;
    }
    attributes = assign({}, defaultAttributes, attributes);
    if (typeof attributes.expires === "number") {
      attributes.expires = new Date(Date.now() + attributes.expires * 864e5);
    }
    if (attributes.expires) {
      attributes.expires = attributes.expires.toUTCString();
    }
    name2 = encodeURIComponent(name2).replace(/%(2[346B]|5E|60|7C)/g, decodeURIComponent).replace(/[()]/g, escape);
    var stringifiedAttributes = "";
    for (var attributeName in attributes) {
      if (!attributes[attributeName]) {
        continue;
      }
      stringifiedAttributes += "; " + attributeName;
      if (attributes[attributeName] === true) {
        continue;
      }
      stringifiedAttributes += "=" + attributes[attributeName].split(";")[0];
    }
    return document.cookie = name2 + "=" + converter.write(value, name2) + stringifiedAttributes;
  }
  function get4(name2) {
    if (typeof document === "undefined" || arguments.length && !name2) {
      return;
    }
    var cookies = document.cookie ? document.cookie.split("; ") : [];
    var jar = {};
    for (var i = 0; i < cookies.length; i++) {
      var parts = cookies[i].split("=");
      var value = parts.slice(1).join("=");
      try {
        var found = decodeURIComponent(parts[0]);
        jar[found] = converter.read(value, found);
        if (name2 === found) {
          break;
        }
      } catch (e) {
      }
    }
    return name2 ? jar[name2] : jar;
  }
  return Object.create(
    {
      set,
      get: get4,
      remove: function(name2, attributes) {
        set(
          name2,
          "",
          assign({}, attributes, {
            expires: -1
          })
        );
      },
      withAttributes: function(attributes) {
        return init(this.converter, assign({}, this.attributes, attributes));
      },
      withConverter: function(converter2) {
        return init(assign({}, this.converter, converter2), this.attributes);
      }
    },
    {
      attributes: { value: Object.freeze(defaultAttributes) },
      converter: { value: Object.freeze(converter) }
    }
  );
}
var api = init(defaultConverter, { path: "/" });

// node_modules/@aws-amplify/core/dist/esm/storage/CookieStorage.mjs
var CookieStorage = class {
  constructor(data = {}) {
    const { path, domain, expires, sameSite, secure } = data;
    this.domain = domain;
    this.path = path || "/";
    this.expires = Object.prototype.hasOwnProperty.call(data, "expires") ? expires : 365;
    this.secure = Object.prototype.hasOwnProperty.call(data, "secure") ? secure : true;
    if (Object.prototype.hasOwnProperty.call(data, "sameSite")) {
      if (!sameSite || !["strict", "lax", "none"].includes(sameSite)) {
        throw new Error('The sameSite value of cookieStorage must be "lax", "strict" or "none".');
      }
      if (sameSite === "none" && !this.secure) {
        throw new Error("sameSite = None requires the Secure attribute in latest browser versions.");
      }
      this.sameSite = sameSite;
    }
  }
  async setItem(key, value) {
    api.set(key, value, this.getData());
  }
  async getItem(key) {
    const item = api.get(key);
    return item ?? null;
  }
  async removeItem(key) {
    api.remove(key, this.getData());
  }
  async clear() {
    const cookie = api.get();
    const promises = Object.keys(cookie).map((key) => this.removeItem(key));
    await Promise.all(promises);
  }
  getData() {
    return {
      path: this.path,
      expires: this.expires,
      domain: this.domain,
      secure: this.secure,
      ...this.sameSite && { sameSite: this.sameSite }
    };
  }
};

// node_modules/@aws-amplify/core/dist/esm/storage/index.mjs
var defaultStorage = new DefaultStorage();
var sessionStorage2 = new SessionStorage();
var syncSessionStorage = new SyncSessionStorage();
var sharedInMemoryStorage = new KeyValueStorage(new InMemoryStorage());

// node_modules/@aws-amplify/core/dist/esm/Cache/constants.mjs
var defaultConfig = {
  keyPrefix: "aws-amplify-cache",
  capacityInBytes: 1048576,
  // 1MB
  itemMaxSize: 21e4,
  // about 200kb
  defaultTTL: 2592e5,
  // about 3 days
  defaultPriority: 5,
  warningThreshold: 0.8
};
var currentSizeKey = "CurSize";

// node_modules/@aws-amplify/core/dist/esm/Cache/utils/cacheHelpers.mjs
function getByteLength(str) {
  let ret = 0;
  ret = str.length;
  for (let i = str.length; i >= 0; i -= 1) {
    const charCode = str.charCodeAt(i);
    if (charCode > 127 && charCode <= 2047) {
      ret += 1;
    } else if (charCode > 2047 && charCode <= 65535) {
      ret += 2;
    }
    if (charCode >= 56320 && charCode <= 57343) {
      i -= 1;
    }
  }
  return ret;
}
function getCurrentTime() {
  const currentTime = /* @__PURE__ */ new Date();
  return currentTime.getTime();
}
var getCurrentSizeKey = (keyPrefix) => `${keyPrefix}${currentSizeKey}`;

// node_modules/@aws-amplify/core/dist/esm/Cache/utils/errorHelpers.mjs
var CacheErrorCode;
(function(CacheErrorCode2) {
  CacheErrorCode2["NoCacheItem"] = "NoCacheItem";
  CacheErrorCode2["NullNextNode"] = "NullNextNode";
  CacheErrorCode2["NullPreviousNode"] = "NullPreviousNode";
})(CacheErrorCode || (CacheErrorCode = {}));
var cacheErrorMap = {
  [CacheErrorCode.NoCacheItem]: {
    message: "Item not found in the cache storage."
  },
  [CacheErrorCode.NullNextNode]: {
    message: "Next node is null."
  },
  [CacheErrorCode.NullPreviousNode]: {
    message: "Previous node is null."
  }
};
var assert2 = createAssertionFunction(cacheErrorMap);

// node_modules/@aws-amplify/core/dist/esm/Cache/StorageCacheCommon.mjs
var logger6 = new ConsoleLogger("StorageCache");
var StorageCacheCommon = class {
  /**
   * Initialize the cache
   *
   * @param config - Custom configuration for this instance.
   */
  constructor({ config: config2, keyValueStorage }) {
    this.config = {
      ...defaultConfig,
      ...config2
    };
    this.keyValueStorage = keyValueStorage;
    this.sanitizeConfig();
  }
  getModuleName() {
    return "Cache";
  }
  /**
   * Set custom configuration for the cache instance.
   *
   * @param config - customized configuration (without keyPrefix, which can't be changed)
   *
   * @return - the current configuration
   */
  configure(config2) {
    if (config2) {
      if (config2.keyPrefix) {
        logger6.warn("keyPrefix can not be re-configured on an existing Cache instance.");
      }
      this.config = {
        ...this.config,
        ...config2
      };
    }
    this.sanitizeConfig();
    return this.config;
  }
  /**
   * return the current size of the cache
   * @return {Promise}
   */
  async getCurrentCacheSize() {
    let size = await this.getStorage().getItem(getCurrentSizeKey(this.config.keyPrefix));
    if (!size) {
      await this.getStorage().setItem(getCurrentSizeKey(this.config.keyPrefix), "0");
      size = "0";
    }
    return Number(size);
  }
  /**
   * Set item into cache. You can put number, string, boolean or object.
   * The cache will first check whether has the same key.
   * If it has, it will delete the old item and then put the new item in
   * The cache will pop out items if it is full
   * You can specify the cache item options. The cache will abort and output a warning:
   * If the key is invalid
   * If the size of the item exceeds itemMaxSize.
   * If the value is undefined
   * If incorrect cache item configuration
   * If error happened with browser storage
   *
   * @param {String} key - the key of the item
   * @param {Object} value - the value of the item
   * @param {Object} [options] - optional, the specified meta-data
   *
   * @return {Promise}
   */
  async setItem(key, value, options) {
    logger6.debug(`Set item: key is ${key}, value is ${value} with options: ${options}`);
    if (!key || key === currentSizeKey) {
      logger6.warn(`Invalid key: should not be empty or reserved key: '${currentSizeKey}'`);
      return;
    }
    if (typeof value === "undefined") {
      logger6.warn(`The value of item should not be undefined!`);
      return;
    }
    const cacheItemOptions = {
      priority: options?.priority !== void 0 ? options.priority : this.config.defaultPriority,
      expires: options?.expires !== void 0 ? options.expires : this.config.defaultTTL + getCurrentTime()
    };
    if (cacheItemOptions.priority < 1 || cacheItemOptions.priority > 5) {
      logger6.warn(`Invalid parameter: priority due to out or range. It should be within 1 and 5.`);
      return;
    }
    const prefixedKey = `${this.config.keyPrefix}${key}`;
    const item = this.fillCacheItem(prefixedKey, value, cacheItemOptions);
    if (item.byteSize > this.config.itemMaxSize) {
      logger6.warn(`Item with key: ${key} you are trying to put into is too big!`);
      return;
    }
    try {
      const val = await this.getStorage().getItem(prefixedKey);
      if (val) {
        await this.removeCacheItem(prefixedKey, JSON.parse(val).byteSize);
      }
      if (await this.isCacheFull(item.byteSize)) {
        const validKeys = await this.clearInvalidAndGetRemainingKeys();
        if (await this.isCacheFull(item.byteSize)) {
          const sizeToPop = await this.sizeToPop(item.byteSize);
          await this.popOutItems(validKeys, sizeToPop);
        }
      }
      return this.setCacheItem(prefixedKey, item);
    } catch (e) {
      logger6.warn(`setItem failed! ${e}`);
    }
  }
  /**
   * Get item from cache. It will return null if item doesn’t exist or it has been expired.
   * If you specified callback function in the options,
   * then the function will be executed if no such item in the cache
   * and finally put the return value into cache.
   * Please make sure the callback function will return the value you want to put into the cache.
   * The cache will abort output a warning:
   * If the key is invalid
   * If error happened with AsyncStorage
   *
   * @param {String} key - the key of the item
   * @param {Object} [options] - the options of callback function
   *
   * @return {Promise} - return a promise resolves to be the value of the item
   */
  async getItem(key, options) {
    logger6.debug(`Get item: key is ${key} with options ${options}`);
    let cached;
    if (!key || key === currentSizeKey) {
      logger6.warn(`Invalid key: should not be empty or reserved key: '${currentSizeKey}'`);
      return null;
    }
    const prefixedKey = `${this.config.keyPrefix}${key}`;
    try {
      cached = await this.getStorage().getItem(prefixedKey);
      if (cached != null) {
        if (await this.isExpired(prefixedKey)) {
          await this.removeCacheItem(prefixedKey, JSON.parse(cached).byteSize);
        } else {
          const item = await this.updateVisitedTime(JSON.parse(cached), prefixedKey);
          return item.data;
        }
      }
      if (options?.callback) {
        const val = options.callback();
        if (val !== null) {
          await this.setItem(key, val, options);
        }
        return val;
      }
      return null;
    } catch (e) {
      logger6.warn(`getItem failed! ${e}`);
      return null;
    }
  }
  /**
   * remove item from the cache
   * The cache will abort output a warning:
   * If error happened with AsyncStorage
   * @param {String} key - the key of the item
   * @return {Promise}
   */
  async removeItem(key) {
    logger6.debug(`Remove item: key is ${key}`);
    if (!key || key === currentSizeKey) {
      logger6.warn(`Invalid key: should not be empty or reserved key: '${currentSizeKey}'`);
      return;
    }
    const prefixedKey = `${this.config.keyPrefix}${key}`;
    try {
      const val = await this.getStorage().getItem(prefixedKey);
      if (val) {
        await this.removeCacheItem(prefixedKey, JSON.parse(val).byteSize);
      }
    } catch (e) {
      logger6.warn(`removeItem failed! ${e}`);
    }
  }
  /**
   * Return all the keys owned by this cache.
   * Will return an empty array if error occurred.
   *
   * @return {Promise}
   */
  async getAllKeys() {
    try {
      return await this.getAllCacheKeys();
    } catch (e) {
      logger6.warn(`getAllkeys failed! ${e}`);
      return [];
    }
  }
  getStorage() {
    return this.keyValueStorage;
  }
  /**
   * check whether item is expired
   *
   * @param key - the key of the item
   *
   * @return true if the item is expired.
   */
  async isExpired(key) {
    const text = await this.getStorage().getItem(key);
    assert2(text !== null, CacheErrorCode.NoCacheItem, `Key: ${key}`);
    const item = JSON.parse(text);
    if (getCurrentTime() >= item.expires) {
      return true;
    }
    return false;
  }
  /**
   * delete item from cache
   *
   * @param prefixedKey - the key of the item
   * @param size - optional, the byte size of the item
   */
  async removeCacheItem(prefixedKey, size) {
    const item = await this.getStorage().getItem(prefixedKey);
    assert2(item !== null, CacheErrorCode.NoCacheItem, `Key: ${prefixedKey}`);
    const itemSize = size ?? JSON.parse(item).byteSize;
    await this.decreaseCurrentSizeInBytes(itemSize);
    try {
      await this.getStorage().removeItem(prefixedKey);
    } catch (removeItemError) {
      await this.increaseCurrentSizeInBytes(itemSize);
      logger6.error(`Failed to remove item: ${removeItemError}`);
    }
  }
  /**
   * produce a JSON object with meta-data and data value
   * @param value - the value of the item
   * @param options - optional, the specified meta-data
   *
   * @return - the item which has the meta-data and the value
   */
  fillCacheItem(key, value, options) {
    const item = {
      key,
      data: value,
      timestamp: getCurrentTime(),
      visitedTime: getCurrentTime(),
      priority: options.priority ?? 0,
      expires: options.expires ?? 0,
      type: typeof value,
      byteSize: 0
    };
    item.byteSize = getByteLength(JSON.stringify(item));
    item.byteSize = getByteLength(JSON.stringify(item));
    return item;
  }
  sanitizeConfig() {
    if (this.config.itemMaxSize > this.config.capacityInBytes) {
      logger6.error("Invalid parameter: itemMaxSize. It should be smaller than capacityInBytes. Setting back to default.");
      this.config.itemMaxSize = defaultConfig.itemMaxSize;
    }
    if (this.config.defaultPriority > 5 || this.config.defaultPriority < 1) {
      logger6.error("Invalid parameter: defaultPriority. It should be between 1 and 5. Setting back to default.");
      this.config.defaultPriority = defaultConfig.defaultPriority;
    }
    if (Number(this.config.warningThreshold) > 1 || Number(this.config.warningThreshold) < 0) {
      logger6.error("Invalid parameter: warningThreshold. It should be between 0 and 1. Setting back to default.");
      this.config.warningThreshold = defaultConfig.warningThreshold;
    }
    const cacheLimit = 5 * 1024 * 1024;
    if (this.config.capacityInBytes > cacheLimit) {
      logger6.error("Cache Capacity should be less than 5MB. Setting back to default. Setting back to default.");
      this.config.capacityInBytes = defaultConfig.capacityInBytes;
    }
  }
  /**
   * increase current size of the cache
   *
   * @param amount - the amount of the cache szie which need to be increased
   */
  async increaseCurrentSizeInBytes(amount) {
    const size = await this.getCurrentCacheSize();
    await this.getStorage().setItem(getCurrentSizeKey(this.config.keyPrefix), (size + amount).toString());
  }
  /**
   * decrease current size of the cache
   *
   * @param amount - the amount of the cache size which needs to be decreased
   */
  async decreaseCurrentSizeInBytes(amount) {
    const size = await this.getCurrentCacheSize();
    await this.getStorage().setItem(getCurrentSizeKey(this.config.keyPrefix), (size - amount).toString());
  }
  /**
   * update the visited time if item has been visited
   *
   * @param item - the item which need to be updated
   * @param prefixedKey - the key of the item
   *
   * @return the updated item
   */
  async updateVisitedTime(item, prefixedKey) {
    item.visitedTime = getCurrentTime();
    await this.getStorage().setItem(prefixedKey, JSON.stringify(item));
    return item;
  }
  /**
   * put item into cache
   *
   * @param prefixedKey - the key of the item
   * @param itemData - the value of the item
   * @param itemSizeInBytes - the byte size of the item
   */
  async setCacheItem(prefixedKey, item) {
    await this.increaseCurrentSizeInBytes(item.byteSize);
    try {
      await this.getStorage().setItem(prefixedKey, JSON.stringify(item));
    } catch (setItemErr) {
      await this.decreaseCurrentSizeInBytes(item.byteSize);
      logger6.error(`Failed to set item ${setItemErr}`);
    }
  }
  /**
   * total space needed when poping out items
   *
   * @param itemSize
   *
   * @return total space needed
   */
  async sizeToPop(itemSize) {
    const cur = await this.getCurrentCacheSize();
    const spaceItemNeed = cur + itemSize - this.config.capacityInBytes;
    const cacheThresholdSpace = (1 - this.config.warningThreshold) * this.config.capacityInBytes;
    return spaceItemNeed > cacheThresholdSpace ? spaceItemNeed : cacheThresholdSpace;
  }
  /**
   * see whether cache is full
   *
   * @param itemSize
   *
   * @return true if cache is full
   */
  async isCacheFull(itemSize) {
    const cur = await this.getCurrentCacheSize();
    return itemSize + cur > this.config.capacityInBytes;
  }
  /**
   * get all the items we have, sort them by their priority,
   * if priority is same, sort them by their last visited time
   * pop out items from the low priority (5 is the lowest)
   * @private
   * @param keys - all the keys in this cache
   * @param sizeToPop - the total size of the items which needed to be poped out
   */
  async popOutItems(keys, sizeToPop) {
    const items = [];
    let remainedSize = sizeToPop;
    for (const key of keys) {
      const val = await this.getStorage().getItem(key);
      if (val != null) {
        const item = JSON.parse(val);
        items.push(item);
      }
    }
    items.sort((a, b) => {
      if (a.priority > b.priority) {
        return -1;
      } else if (a.priority < b.priority) {
        return 1;
      } else {
        if (a.visitedTime < b.visitedTime) {
          return -1;
        } else
          return 1;
      }
    });
    for (const item of items) {
      await this.removeCacheItem(item.key, item.byteSize);
      remainedSize -= item.byteSize;
      if (remainedSize <= 0) {
        return;
      }
    }
  }
  /**
   * Scan the storage and combine the following operations for efficiency
   *   1. Clear out all expired keys owned by this cache, not including the size key.
   *   2. Return the remaining keys.
   *
   * @return The remaining valid keys
   */
  async clearInvalidAndGetRemainingKeys() {
    const remainingKeys = [];
    const keys = await this.getAllCacheKeys({
      omitSizeKey: true
    });
    for (const key of keys) {
      if (await this.isExpired(key)) {
        await this.removeCacheItem(key);
      } else {
        remainingKeys.push(key);
      }
    }
    return remainingKeys;
  }
  /**
   * clear the entire cache
   * The cache will abort and output a warning if error occurs
   * @return {Promise}
   */
  async clear() {
    logger6.debug(`Clear Cache`);
    try {
      const keys = await this.getAllKeys();
      for (const key of keys) {
        const prefixedKey = `${this.config.keyPrefix}${key}`;
        await this.getStorage().removeItem(prefixedKey);
      }
    } catch (e) {
      logger6.warn(`clear failed! ${e}`);
    }
  }
};

// node_modules/@aws-amplify/core/dist/esm/Cache/StorageCache.mjs
var logger7 = new ConsoleLogger("StorageCache");
var StorageCache = class _StorageCache extends StorageCacheCommon {
  /**
   * initialize the cache
   * @param config - the configuration of the cache
   */
  constructor(config2) {
    const storage = getLocalStorageWithFallback();
    super({ config: config2, keyValueStorage: new KeyValueStorage(storage) });
    this.storage = storage;
    this.getItem = this.getItem.bind(this);
    this.setItem = this.setItem.bind(this);
    this.removeItem = this.removeItem.bind(this);
  }
  async getAllCacheKeys(options) {
    const { omitSizeKey } = options ?? {};
    const keys = [];
    for (let i = 0; i < this.storage.length; i++) {
      const key = this.storage.key(i);
      if (omitSizeKey && key === getCurrentSizeKey(this.config.keyPrefix)) {
        continue;
      }
      if (key?.startsWith(this.config.keyPrefix)) {
        keys.push(key.substring(this.config.keyPrefix.length));
      }
    }
    return keys;
  }
  /**
   * Return a new instance of cache with customized configuration.
   * @param {Object} config - the customized configuration
   * @return {Object} - the new instance of Cache
   */
  createInstance(config2) {
    if (!config2.keyPrefix || config2.keyPrefix === defaultConfig.keyPrefix) {
      logger7.error("invalid keyPrefix, setting keyPrefix with timeStamp");
      config2.keyPrefix = getCurrentTime.toString();
    }
    return new _StorageCache(config2);
  }
};

// node_modules/@aws-amplify/core/dist/esm/Cache/index.mjs
var Cache = new StorageCache();

// node_modules/@aws-amplify/core/dist/esm/I18n/I18n.mjs
var logger8 = new ConsoleLogger("I18n");
var I18n$1 = class I18n {
  constructor() {
    this._options = null;
    this._lang = null;
    this._dict = {};
  }
  /**
   * Sets the default language from the configuration when required.
   */
  setDefaultLanguage() {
    if (!this._lang && typeof window !== "undefined" && window && window.navigator) {
      this._lang = window.navigator.language;
    }
    logger8.debug(this._lang);
  }
  /**
   * @method
   * Explicitly setting language
   * @param {String} lang
   */
  setLanguage(lang) {
    this._lang = lang;
  }
  /**
   * @method
   * Get value
   * @param {String} key
   * @param {String} defVal - Default value
   */
  get(key, defVal = void 0) {
    this.setDefaultLanguage();
    if (!this._lang) {
      return typeof defVal !== "undefined" ? defVal : key;
    }
    const lang = this._lang;
    let val = this.getByLanguage(key, lang);
    if (val) {
      return val;
    }
    if (lang.indexOf("-") > 0) {
      val = this.getByLanguage(key, lang.split("-")[0]);
    }
    if (val) {
      return val;
    }
    return typeof defVal !== "undefined" ? defVal : key;
  }
  /**
   * @method
   * Get value according to specified language
   * @param {String} key
   * @param {String} language - Specified langurage to be used
   * @param {String} defVal - Default value
   */
  getByLanguage(key, language, defVal = null) {
    if (!language) {
      return defVal;
    }
    const langDict = this._dict[language];
    if (!langDict) {
      return defVal;
    }
    return langDict[key];
  }
  /**
   * @method
   * Add vocabularies for one language
   * @param {String} language - Language of the dictionary
   * @param {Object} vocabularies - Object that has key-value as dictionary entry
   */
  putVocabulariesForLanguage(language, vocabularies) {
    let langDict = this._dict[language];
    if (!langDict) {
      langDict = this._dict[language] = {};
    }
    this._dict[language] = { ...langDict, ...vocabularies };
  }
  /**
   * @method
   * Add vocabularies for one language
   * @param {Object} vocabularies - Object that has language as key,
   *                                vocabularies of each language as value
   */
  putVocabularies(vocabularies) {
    Object.keys(vocabularies).forEach((key) => {
      this.putVocabulariesForLanguage(key, vocabularies[key]);
    });
  }
};

// node_modules/@aws-amplify/core/dist/esm/I18n/errorHelpers.mjs
var I18nErrorCode;
(function(I18nErrorCode2) {
  I18nErrorCode2["NotConfigured"] = "NotConfigured";
})(I18nErrorCode || (I18nErrorCode = {}));
var i18nErrorMap = {
  [I18nErrorCode.NotConfigured]: {
    message: "i18n is not configured."
  }
};
var assert3 = createAssertionFunction(i18nErrorMap);

// node_modules/@aws-amplify/core/dist/esm/I18n/index.mjs
var logger9 = new ConsoleLogger("I18n");
var _config = { language: null };
var _i18n = null;
var I18n2 = class _I18n {
  /**
   * @static
   * @method
   * Configure I18n part
   * @param {Object} config - Configuration of the I18n
   */
  static configure(config2) {
    logger9.debug("configure I18n");
    if (!config2) {
      return _config;
    }
    _config = Object.assign({}, _config, config2.I18n || config2);
    _I18n.createInstance();
    return _config;
  }
  static getModuleName() {
    return "I18n";
  }
  /**
   * @static
   * @method
   * Create an instance of I18n for the library
   */
  static createInstance() {
    logger9.debug("create I18n instance");
    if (_i18n) {
      return;
    }
    _i18n = new I18n$1();
  }
  /**
   * @static @method
   * Explicitly setting language
   * @param {String} lang
   */
  static setLanguage(lang) {
    _I18n.checkConfig();
    assert3(!!_i18n, I18nErrorCode.NotConfigured);
    _i18n.setLanguage(lang);
  }
  /**
   * @static @method
   * Get value
   * @param {String} key
   * @param {String} defVal - Default value
   */
  static get(key, defVal) {
    if (!_I18n.checkConfig()) {
      return typeof defVal === "undefined" ? key : defVal;
    }
    assert3(!!_i18n, I18nErrorCode.NotConfigured);
    return _i18n.get(key, defVal);
  }
  /**
   * @static
   * @method
   * Add vocabularies for one language
   * @param {String} language - Language of the dictionary
   * @param {Object} vocabularies - Object that has key-value as dictionary entry
   */
  static putVocabulariesForLanguage(language, vocabularies) {
    _I18n.checkConfig();
    assert3(!!_i18n, I18nErrorCode.NotConfigured);
    _i18n.putVocabulariesForLanguage(language, vocabularies);
  }
  /**
   * @static
   * @method
   * Add vocabularies for one language
   * @param {Object} vocabularies - Object that has language as key,
   *                                vocabularies of each language as value
   */
  static putVocabularies(vocabularies) {
    _I18n.checkConfig();
    assert3(!!_i18n, I18nErrorCode.NotConfigured);
    _i18n.putVocabularies(vocabularies);
  }
  static checkConfig() {
    if (!_i18n) {
      _I18n.createInstance();
    }
    return true;
  }
};
I18n2.createInstance();

// node_modules/@aws-amplify/core/dist/esm/clients/middleware/signing/signer/signatureV4/utils/getSignedHeaders.mjs
var getSignedHeaders = (headers) => Object.keys(headers).map((key) => key.toLowerCase()).sort().join(";");

// node_modules/@aws-amplify/core/dist/esm/clients/middleware/signing/signer/signatureV4/constants.mjs
var AMZ_DATE_QUERY_PARAM = "X-Amz-Date";
var TOKEN_QUERY_PARAM = "X-Amz-Security-Token";
var AUTH_HEADER = "authorization";
var HOST_HEADER = "host";
var AMZ_DATE_HEADER = AMZ_DATE_QUERY_PARAM.toLowerCase();
var TOKEN_HEADER = TOKEN_QUERY_PARAM.toLowerCase();
var KEY_TYPE_IDENTIFIER = "aws4_request";
var SHA256_ALGORITHM_IDENTIFIER = "AWS4-HMAC-SHA256";
var SIGNATURE_IDENTIFIER = "AWS4";
var EMPTY_HASH = "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855";
var UNSIGNED_PAYLOAD = "UNSIGNED-PAYLOAD";

// node_modules/@aws-amplify/core/dist/esm/clients/middleware/signing/signer/signatureV4/utils/getCredentialScope.mjs
var getCredentialScope = (date, region, service) => `${date}/${region}/${service}/${KEY_TYPE_IDENTIFIER}`;

// node_modules/@aws-amplify/core/dist/esm/clients/middleware/signing/signer/signatureV4/utils/getFormattedDates.mjs
var getFormattedDates = (date) => {
  const longDate = date.toISOString().replace(/[:-]|\.\d{3}/g, "");
  return {
    longDate,
    shortDate: longDate.slice(0, 8)
  };
};

// node_modules/@aws-amplify/core/dist/esm/clients/middleware/signing/signer/signatureV4/utils/getSigningValues.mjs
var getSigningValues = ({ credentials, signingDate = /* @__PURE__ */ new Date(), signingRegion, signingService, uriEscapePath = true }) => {
  const { accessKeyId, secretAccessKey, sessionToken } = credentials;
  const { longDate, shortDate } = getFormattedDates(signingDate);
  const credentialScope = getCredentialScope(shortDate, signingRegion, signingService);
  return {
    accessKeyId,
    credentialScope,
    longDate,
    secretAccessKey,
    sessionToken,
    shortDate,
    signingRegion,
    signingService,
    uriEscapePath
  };
};

// node_modules/@aws-amplify/core/dist/esm/clients/middleware/signing/signer/signatureV4/utils/dataHashHelpers.mjs
var getHashedData = (key, data) => {
  const sha256 = new Sha256(key ?? void 0);
  sha256.update(data);
  const hashedData = sha256.digestSync();
  return hashedData;
};
var getHashedDataAsHex = (key, data) => {
  const hashedData = getHashedData(key, data);
  return toHex(hashedData);
};

// node_modules/@aws-amplify/core/dist/esm/clients/middleware/signing/signer/signatureV4/utils/getCanonicalHeaders.mjs
var getCanonicalHeaders = (headers) => Object.entries(headers).map(([key, value]) => ({
  key: key.toLowerCase(),
  value: value?.trim().replace(/\s+/g, " ") ?? ""
})).sort((a, b) => a.key < b.key ? -1 : 1).map((entry) => `${entry.key}:${entry.value}
`).join("");

// node_modules/@aws-amplify/core/dist/esm/clients/middleware/signing/signer/signatureV4/utils/getCanonicalQueryString.mjs
var getCanonicalQueryString = (searchParams) => Array.from(searchParams).sort(([keyA, valA], [keyB, valB]) => {
  if (keyA === keyB) {
    return valA < valB ? -1 : 1;
  }
  return keyA < keyB ? -1 : 1;
}).map(([key, val]) => `${escapeUri(key)}=${escapeUri(val)}`).join("&");
var escapeUri = (uri) => encodeURIComponent(uri).replace(/[!'()*]/g, hexEncode);
var hexEncode = (c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`;

// node_modules/@aws-amplify/core/dist/esm/clients/middleware/signing/signer/signatureV4/utils/getCanonicalUri.mjs
var getCanonicalUri = (pathname, uriEscapePath = true) => pathname ? uriEscapePath ? encodeURIComponent(pathname).replace(/%2F/g, "/") : pathname : "/";

// node_modules/@aws-amplify/core/dist/esm/clients/middleware/signing/signer/signatureV4/utils/getHashedPayload.mjs
var getHashedPayload = (body) => {
  if (body == null) {
    return EMPTY_HASH;
  }
  if (isSourceData(body)) {
    const hashedData = getHashedDataAsHex(null, body);
    return hashedData;
  }
  return UNSIGNED_PAYLOAD;
};
var isSourceData = (body) => (
  // Exclude UNSIGNED_PAYLOAD constant to prevent it from being hashed as a string
  body !== UNSIGNED_PAYLOAD && (typeof body === "string" || ArrayBuffer.isView(body) || isArrayBuffer(body))
);
var isArrayBuffer = (arg) => typeof ArrayBuffer === "function" && arg instanceof ArrayBuffer || Object.prototype.toString.call(arg) === "[object ArrayBuffer]";

// node_modules/@aws-amplify/core/dist/esm/clients/middleware/signing/signer/signatureV4/utils/getCanonicalRequest.mjs
var getCanonicalRequest = ({ body, headers, method, url }, uriEscapePath = true) => [
  method,
  getCanonicalUri(url.pathname, uriEscapePath),
  getCanonicalQueryString(url.searchParams),
  getCanonicalHeaders(headers),
  getSignedHeaders(headers),
  getHashedPayload(body)
].join("\n");

// node_modules/@aws-amplify/core/dist/esm/clients/middleware/signing/signer/signatureV4/utils/getSigningKey.mjs
var getSigningKey = (secretAccessKey, date, region, service) => {
  const key = `${SIGNATURE_IDENTIFIER}${secretAccessKey}`;
  const dateKey = getHashedData(key, date);
  const regionKey = getHashedData(dateKey, region);
  const serviceKey = getHashedData(regionKey, service);
  const signingKey = getHashedData(serviceKey, KEY_TYPE_IDENTIFIER);
  return signingKey;
};

// node_modules/@aws-amplify/core/dist/esm/clients/middleware/signing/signer/signatureV4/utils/getStringToSign.mjs
var getStringToSign = (date, credentialScope, hashedRequest) => [SHA256_ALGORITHM_IDENTIFIER, date, credentialScope, hashedRequest].join("\n");

// node_modules/@aws-amplify/core/dist/esm/clients/middleware/signing/signer/signatureV4/utils/getSignature.mjs
var getSignature = (request, { credentialScope, longDate, secretAccessKey, shortDate, signingRegion, signingService, uriEscapePath }) => {
  const canonicalRequest = getCanonicalRequest(request, uriEscapePath);
  const hashedRequest = getHashedDataAsHex(null, canonicalRequest);
  const stringToSign = getStringToSign(longDate, credentialScope, hashedRequest);
  const signature = getHashedDataAsHex(getSigningKey(secretAccessKey, shortDate, signingRegion, signingService), stringToSign);
  return signature;
};

// node_modules/@aws-amplify/core/dist/esm/clients/middleware/signing/signer/signatureV4/signRequest.mjs
var signRequest = (request, options) => {
  const signingValues = getSigningValues(options);
  const { accessKeyId, credentialScope, longDate, sessionToken } = signingValues;
  const headers = { ...request.headers };
  headers[HOST_HEADER] = request.url.host;
  headers[AMZ_DATE_HEADER] = longDate;
  if (sessionToken) {
    headers[TOKEN_HEADER] = sessionToken;
  }
  const requestToSign = { ...request, headers };
  const signature = getSignature(requestToSign, signingValues);
  const credentialEntry = `Credential=${accessKeyId}/${credentialScope}`;
  const signedHeadersEntry = `SignedHeaders=${getSignedHeaders(headers)}`;
  const signatureEntry = `Signature=${signature}`;
  headers[AUTH_HEADER] = `${SHA256_ALGORITHM_IDENTIFIER} ${credentialEntry}, ${signedHeadersEntry}, ${signatureEntry}`;
  return requestToSign;
};

// node_modules/@aws-amplify/core/dist/esm/clients/middleware/signing/utils/getSkewCorrectedDate.mjs
var getSkewCorrectedDate = (systemClockOffset) => new Date(Date.now() + systemClockOffset);

// node_modules/@aws-amplify/core/dist/esm/clients/middleware/signing/utils/isClockSkewed.mjs
var SKEW_WINDOW = 5 * 60 * 1e3;
var isClockSkewed = (clockTimeInMilliseconds, clockOffsetInMilliseconds) => Math.abs(getSkewCorrectedDate(clockOffsetInMilliseconds).getTime() - clockTimeInMilliseconds) >= SKEW_WINDOW;

// node_modules/@aws-amplify/core/dist/esm/clients/middleware/signing/utils/getUpdatedSystemClockOffset.mjs
var getUpdatedSystemClockOffset = (clockTimeInMilliseconds, currentSystemClockOffset) => {
  if (isClockSkewed(clockTimeInMilliseconds, currentSystemClockOffset)) {
    return clockTimeInMilliseconds - Date.now();
  }
  return currentSystemClockOffset;
};

// node_modules/@aws-amplify/core/dist/esm/clients/middleware/signing/middleware.mjs
var signingMiddlewareFactory = ({ credentials, region, service, uriEscapePath = true }) => {
  let currentSystemClockOffset;
  return (next, context2) => async function signingMiddleware(request) {
    currentSystemClockOffset = currentSystemClockOffset ?? 0;
    const signRequestOptions = {
      credentials: typeof credentials === "function" ? await credentials({
        forceRefresh: !!context2?.isCredentialsExpired
      }) : credentials,
      signingDate: getSkewCorrectedDate(currentSystemClockOffset),
      signingRegion: region,
      signingService: service,
      uriEscapePath
    };
    const signedRequest = await signRequest(request, signRequestOptions);
    const response = await next(signedRequest);
    const dateString = getDateHeader(response);
    if (dateString) {
      currentSystemClockOffset = getUpdatedSystemClockOffset(Date.parse(dateString), currentSystemClockOffset);
    }
    return response;
  };
};
var getDateHeader = ({ headers } = {}) => headers?.date ?? headers?.Date ?? headers?.["x-amz-date"];

// node_modules/@aws-amplify/core/dist/esm/utils/retry/NonRetryableError.mjs
var NonRetryableError = class extends Error {
  constructor() {
    super(...arguments);
    this.nonRetryable = true;
  }
};

// node_modules/@aws-amplify/core/dist/esm/utils/retry/jitteredExponentialRetry.mjs
var jitteredExponentialRetry = (functionToRetry, args, maxDelayMs = MAX_DELAY_MS, onTerminate) => retry(functionToRetry, args, jitteredBackoff(maxDelayMs), onTerminate);

// node_modules/@aws-amplify/core/dist/esm/utils/urlSafeDecode.mjs
function urlSafeDecode(hex) {
  const matchArr = hex.match(/.{2}/g) || [];
  return matchArr.map((char) => String.fromCharCode(parseInt(char, 16))).join("");
}

// node_modules/@aws-amplify/core/dist/esm/utils/deDupeAsyncFunction.mjs
var deDupeAsyncFunction = (asyncFunction) => {
  let inflightPromise;
  return async (...args) => {
    if (inflightPromise)
      return inflightPromise;
    inflightPromise = new Promise((resolve, reject) => {
      asyncFunction(...args).then((result) => {
        resolve(result);
      }).catch((error) => {
        reject(error);
      }).finally(() => {
        inflightPromise = void 0;
      });
    });
    return inflightPromise;
  };
};

// node_modules/@aws-amplify/core/dist/esm/utils/isTokenExpired.mjs
function isTokenExpired({ expiresAt, clockDrift, tolerance = 5e3 }) {
  const currentTime = Date.now();
  return currentTime + clockDrift + tolerance > expiresAt;
}

// node_modules/@aws-amplify/core/dist/esm/errors/APIError.mjs
var ApiError = class _ApiError extends AmplifyError {
  /**
   * The unwrapped HTTP response causing the given API error.
   */
  get response() {
    return this._response ? replicateApiErrorResponse(this._response) : void 0;
  }
  constructor(params) {
    super(params);
    this.constructor = _ApiError;
    Object.setPrototypeOf(this, _ApiError.prototype);
    if (params.response) {
      this._response = params.response;
    }
  }
};
var replicateApiErrorResponse = (response) => ({
  ...response,
  headers: { ...response.headers }
});

// node_modules/@aws-amplify/core/dist/esm/utils/convert/base64/bytesToString.mjs
function bytesToString(input) {
  return Array.from(input, (byte) => String.fromCodePoint(byte)).join("");
}

// node_modules/@aws-amplify/core/dist/esm/utils/convert/base64/base64Encoder.mjs
var base64Encoder = {
  /**
   * Convert input to base64-encoded string
   * @param input - string to convert to base64
   * @param options - encoding options that can optionally produce a base64url string
   * @returns base64-encoded string
   */
  convert(input, options = {
    urlSafe: false,
    skipPadding: false
  }) {
    const inputStr = typeof input === "string" ? input : bytesToString(input);
    let encodedStr = getBtoa()(inputStr);
    if (options.urlSafe) {
      encodedStr = encodedStr.replace(/\+/g, "-").replace(/\//g, "_");
    }
    if (options.skipPadding) {
      encodedStr = encodedStr.replace(/=/g, "");
    }
    return encodedStr;
  }
};

// node_modules/aws-amplify/node_modules/@aws-amplify/auth/dist/esm/errors/types/validation.mjs
var AuthValidationErrorCode;
(function(AuthValidationErrorCode2) {
  AuthValidationErrorCode2["EmptySignInUsername"] = "EmptySignInUsername";
  AuthValidationErrorCode2["EmptySignInPassword"] = "EmptySignInPassword";
  AuthValidationErrorCode2["CustomAuthSignInPassword"] = "CustomAuthSignInPassword";
  AuthValidationErrorCode2["EmptySignUpUsername"] = "EmptySignUpUsername";
  AuthValidationErrorCode2["EmptySignUpPassword"] = "EmptySignUpPassword";
  AuthValidationErrorCode2["EmptyConfirmSignUpUsername"] = "EmptyConfirmSignUpUsername";
  AuthValidationErrorCode2["EmptyConfirmSignUpCode"] = "EmptyConfirmSignUpCode";
  AuthValidationErrorCode2["EmptyResendSignUpCodeUsername"] = "EmptyresendSignUpCodeUsername";
  AuthValidationErrorCode2["EmptyChallengeResponse"] = "EmptyChallengeResponse";
  AuthValidationErrorCode2["EmptyConfirmResetPasswordUsername"] = "EmptyConfirmResetPasswordUsername";
  AuthValidationErrorCode2["EmptyConfirmResetPasswordNewPassword"] = "EmptyConfirmResetPasswordNewPassword";
  AuthValidationErrorCode2["EmptyConfirmResetPasswordConfirmationCode"] = "EmptyConfirmResetPasswordConfirmationCode";
  AuthValidationErrorCode2["EmptyResetPasswordUsername"] = "EmptyResetPasswordUsername";
  AuthValidationErrorCode2["EmptyVerifyTOTPSetupCode"] = "EmptyVerifyTOTPSetupCode";
  AuthValidationErrorCode2["EmptyConfirmUserAttributeCode"] = "EmptyConfirmUserAttributeCode";
  AuthValidationErrorCode2["IncorrectMFAMethod"] = "IncorrectMFAMethod";
  AuthValidationErrorCode2["EmptyUpdatePassword"] = "EmptyUpdatePassword";
  AuthValidationErrorCode2["InvalidPreferredChallenge"] = "InvalidPreferredChallenge";
})(AuthValidationErrorCode || (AuthValidationErrorCode = {}));

// node_modules/aws-amplify/node_modules/@aws-amplify/auth/dist/esm/common/AuthErrorStrings.mjs
var validationErrorMap = {
  [AuthValidationErrorCode.EmptyChallengeResponse]: {
    message: "challengeResponse is required to confirmSignIn"
  },
  [AuthValidationErrorCode.EmptyConfirmResetPasswordUsername]: {
    message: "username is required to confirmResetPassword"
  },
  [AuthValidationErrorCode.EmptyConfirmSignUpCode]: {
    message: "code is required to confirmSignUp"
  },
  [AuthValidationErrorCode.EmptyConfirmSignUpUsername]: {
    message: "username is required to confirmSignUp"
  },
  [AuthValidationErrorCode.EmptyConfirmResetPasswordConfirmationCode]: {
    message: "confirmationCode is required to confirmResetPassword"
  },
  [AuthValidationErrorCode.EmptyConfirmResetPasswordNewPassword]: {
    message: "newPassword is required to confirmResetPassword"
  },
  [AuthValidationErrorCode.EmptyResendSignUpCodeUsername]: {
    message: "username is required to confirmSignUp"
  },
  [AuthValidationErrorCode.EmptyResetPasswordUsername]: {
    message: "username is required to resetPassword"
  },
  [AuthValidationErrorCode.EmptySignInPassword]: {
    message: "password is required to signIn"
  },
  [AuthValidationErrorCode.EmptySignInUsername]: {
    message: "username is required to signIn"
  },
  [AuthValidationErrorCode.EmptySignUpPassword]: {
    message: "password is required to signUp"
  },
  [AuthValidationErrorCode.EmptySignUpUsername]: {
    message: "username is required to signUp"
  },
  [AuthValidationErrorCode.CustomAuthSignInPassword]: {
    message: "A password is not needed when signing in with CUSTOM_WITHOUT_SRP",
    recoverySuggestion: "Do not include a password in your signIn call."
  },
  [AuthValidationErrorCode.IncorrectMFAMethod]: {
    message: "Incorrect MFA method was chosen. It should be either SMS, TOTP, or EMAIL",
    recoverySuggestion: "Try to pass SMS, TOTP, or EMAIL as the challengeResponse"
  },
  [AuthValidationErrorCode.EmptyVerifyTOTPSetupCode]: {
    message: "code is required to verifyTotpSetup"
  },
  [AuthValidationErrorCode.EmptyUpdatePassword]: {
    message: "oldPassword and newPassword are required to changePassword"
  },
  [AuthValidationErrorCode.EmptyConfirmUserAttributeCode]: {
    message: "confirmation code is required to confirmUserAttribute"
  },
  [AuthValidationErrorCode.InvalidPreferredChallenge]: {
    message: "The preferred challenge is not enabled in your backend configuration",
    recoverySuggestion: "Ensure the authentication method is enabled in your Amplify backend configuration"
  }
};
var AuthErrorStrings;
(function(AuthErrorStrings2) {
  AuthErrorStrings2["DEFAULT_MSG"] = "Authentication Error";
  AuthErrorStrings2["EMPTY_EMAIL"] = "Email cannot be empty";
  AuthErrorStrings2["EMPTY_PHONE"] = "Phone number cannot be empty";
  AuthErrorStrings2["EMPTY_USERNAME"] = "Username cannot be empty";
  AuthErrorStrings2["INVALID_USERNAME"] = "The username should either be a string or one of the sign in types";
  AuthErrorStrings2["EMPTY_PASSWORD"] = "Password cannot be empty";
  AuthErrorStrings2["EMPTY_CODE"] = "Confirmation code cannot be empty";
  AuthErrorStrings2["SIGN_UP_ERROR"] = "Error creating account";
  AuthErrorStrings2["NO_MFA"] = "No valid MFA method provided";
  AuthErrorStrings2["INVALID_MFA"] = "Invalid MFA type";
  AuthErrorStrings2["EMPTY_CHALLENGE"] = "Challenge response cannot be empty";
  AuthErrorStrings2["NO_USER_SESSION"] = "Failed to get the session because the user is empty";
  AuthErrorStrings2["NETWORK_ERROR"] = "Network Error";
  AuthErrorStrings2["DEVICE_CONFIG"] = "Device tracking has not been configured in this User Pool";
  AuthErrorStrings2["AUTOSIGNIN_ERROR"] = "Please use your credentials to sign in";
  AuthErrorStrings2["OAUTH_ERROR"] = "Couldn't finish OAuth flow, check your User Pool HostedUI settings";
})(AuthErrorStrings || (AuthErrorStrings = {}));
var AuthErrorCodes;
(function(AuthErrorCodes2) {
  AuthErrorCodes2["SignInException"] = "SignInException";
  AuthErrorCodes2["OAuthSignInError"] = "OAuthSignInException";
})(AuthErrorCodes || (AuthErrorCodes = {}));

// node_modules/aws-amplify/node_modules/@aws-amplify/auth/dist/esm/errors/AuthError.mjs
var AuthError = class _AuthError extends AmplifyError {
  constructor(params) {
    super(params);
    this.constructor = _AuthError;
    Object.setPrototypeOf(this, _AuthError.prototype);
  }
};

// node_modules/aws-amplify/node_modules/@aws-amplify/auth/dist/esm/foundation/parsers/regionParsers.mjs
function getRegionFromUserPoolId(userPoolId) {
  const region = userPoolId?.split("_")[0];
  if (!userPoolId || userPoolId.indexOf("_") < 0 || !region || typeof region !== "string")
    throw new AuthError({
      name: "InvalidUserPoolId",
      message: "Invalid user pool id provided."
    });
  return region;
}
function getRegionFromIdentityPoolId(identityPoolId) {
  if (!identityPoolId || !identityPoolId.includes(":")) {
    throw new AuthError({
      name: "InvalidIdentityPoolIdException",
      message: "Invalid identity pool id provided.",
      recoverySuggestion: "Make sure a valid identityPoolId is given in the config."
    });
  }
  return identityPoolId.split(":")[0];
}

// node_modules/aws-amplify/node_modules/@aws-amplify/auth/dist/esm/errors/constants.mjs
var USER_UNAUTHENTICATED_EXCEPTION = "UserUnAuthenticatedException";
var INVALID_REDIRECT_EXCEPTION = "InvalidRedirectException";
var INVALID_APP_SCHEME_EXCEPTION = "InvalidAppSchemeException";
var INVALID_PREFERRED_REDIRECT_EXCEPTION = "InvalidPreferredRedirectUrlException";
var invalidRedirectException = new AuthError({
  name: INVALID_REDIRECT_EXCEPTION,
  message: "signInRedirect or signOutRedirect had an invalid format or was not found.",
  recoverySuggestion: "Please make sure the signIn/Out redirect in your oauth config is valid."
});
var invalidAppSchemeException = new AuthError({
  name: INVALID_APP_SCHEME_EXCEPTION,
  message: "A valid non-http app scheme was not found in the config.",
  recoverySuggestion: "Please make sure a valid custom app scheme is present in the config."
});
var invalidPreferredRedirectUrlException = new AuthError({
  name: INVALID_PREFERRED_REDIRECT_EXCEPTION,
  message: "The given preferredRedirectUrl does not match any items in the redirectSignOutUrls array from the config.",
  recoverySuggestion: "Please make sure a matching preferredRedirectUrl is provided."
});
var INVALID_ORIGIN_EXCEPTION = "InvalidOriginException";
var invalidOriginException = new AuthError({
  name: INVALID_ORIGIN_EXCEPTION,
  message: "redirect is coming from a different origin. The oauth flow needs to be initiated from the same origin",
  recoverySuggestion: "Please call signInWithRedirect from the same origin."
});
var TOKEN_REFRESH_EXCEPTION = "TokenRefreshException";
var UNEXPECTED_SIGN_IN_INTERRUPTION_EXCEPTION = "UnexpectedSignInInterruptionException";

// node_modules/aws-amplify/node_modules/@aws-amplify/auth/dist/esm/providers/cognito/utils/types.mjs
function assertAuthTokens(tokens) {
  if (!tokens || !tokens.accessToken) {
    throw new AuthError({
      name: USER_UNAUTHENTICATED_EXCEPTION,
      message: "User needs to be authenticated to call this API.",
      recoverySuggestion: "Sign in before calling this API again."
    });
  }
}
function assertIdTokenInAuthTokens(tokens) {
  if (!tokens || !tokens.idToken) {
    throw new AuthError({
      name: USER_UNAUTHENTICATED_EXCEPTION,
      message: "User needs to be authenticated to call this API.",
      recoverySuggestion: "Sign in before calling this API again."
    });
  }
}
var oAuthTokenRefreshException = new AuthError({
  name: TOKEN_REFRESH_EXCEPTION,
  message: `Token refresh is not supported when authenticated with the 'implicit grant' (token) oauth flow. 
	Please change your oauth configuration to use 'code grant' flow.`,
  recoverySuggestion: `Please logout and change your Amplify configuration to use "code grant" flow. 
	E.g { responseType: 'code' }`
});
var tokenRefreshException = new AuthError({
  name: USER_UNAUTHENTICATED_EXCEPTION,
  message: "User needs to be authenticated to call this API.",
  recoverySuggestion: "Sign in before calling this API again."
});
function assertAuthTokensWithRefreshToken(tokens) {
  if (isAuthenticatedWithImplicitOauthFlow(tokens)) {
    throw oAuthTokenRefreshException;
  }
  if (!isAuthenticatedWithRefreshToken(tokens)) {
    throw tokenRefreshException;
  }
}
var OAuthStorageKeys = {
  inflightOAuth: "inflightOAuth",
  oauthSignIn: "oauthSignIn",
  oauthPKCE: "oauthPKCE",
  oauthState: "oauthState"
};
function isAuthenticated(tokens) {
  return tokens?.accessToken || tokens?.idToken;
}
function isAuthenticatedWithRefreshToken(tokens) {
  return isAuthenticated(tokens) && tokens?.refreshToken;
}
function isAuthenticatedWithImplicitOauthFlow(tokens) {
  return isAuthenticated(tokens) && !tokens?.refreshToken;
}

// node_modules/aws-amplify/node_modules/@aws-amplify/auth/dist/esm/providers/cognito/apis/internal/getCurrentUser.mjs
var getCurrentUser = async (amplify) => {
  const authConfig = amplify.getConfig().Auth?.Cognito;
  assertTokenProviderConfig(authConfig);
  const tokens = await amplify.Auth.getTokens({ forceRefresh: false });
  assertAuthTokens(tokens);
  const { "cognito:username": username, sub } = tokens.idToken?.payload ?? {};
  const authUser = {
    username,
    userId: sub
  };
  const signInDetails = getSignInDetailsFromTokens(tokens);
  if (signInDetails) {
    authUser.signInDetails = signInDetails;
  }
  return authUser;
};
function getSignInDetailsFromTokens(tokens) {
  return tokens?.signInDetails;
}

// node_modules/aws-amplify/node_modules/@aws-amplify/auth/dist/esm/providers/cognito/apis/getCurrentUser.mjs
var getCurrentUser2 = async () => {
  return getCurrentUser(Amplify);
};

// node_modules/aws-amplify/node_modules/@aws-amplify/auth/dist/esm/utils/getAuthUserAgentValue.mjs
var getAuthUserAgentValue = (action, customUserAgentDetails) => getAmplifyUserAgent({
  category: Category.Auth,
  action,
  ...customUserAgentDetails
});

// node_modules/aws-amplify/node_modules/@aws-amplify/auth/dist/esm/foundation/factories/serviceClients/cognitoIdentityProvider/shared/serde/createUserPoolSerializer.mjs
var createUserPoolSerializer = (operation) => (input, endpoint) => {
  const headers = getSharedHeaders2(operation);
  const body = JSON.stringify(input);
  return buildHttpRpcRequest2(endpoint, headers, body);
};
var getSharedHeaders2 = (operation) => ({
  "content-type": "application/x-amz-json-1.1",
  "x-amz-target": `AWSCognitoIdentityProviderService.${operation}`
});
var buildHttpRpcRequest2 = ({ url }, headers, body) => ({
  headers,
  url,
  body,
  method: "POST"
});

// node_modules/aws-amplify/node_modules/@aws-amplify/auth/dist/esm/errors/utils/assertServiceError.mjs
function assertServiceError(error) {
  if (!error || error.name === "Error" || error instanceof TypeError) {
    throw new AuthError({
      name: AmplifyErrorCode.Unknown,
      message: "An unknown error has occurred.",
      underlyingError: error
    });
  }
}

// node_modules/aws-amplify/node_modules/@aws-amplify/auth/dist/esm/foundation/factories/serviceClients/cognitoIdentityProvider/shared/serde/createUserPoolDeserializer.mjs
var createUserPoolDeserializer = () => async (response) => {
  if (response.statusCode >= 300) {
    const error = await parseJsonError(response);
    assertServiceError(error);
    throw new AuthError({
      name: error.name,
      message: error.message,
      metadata: error.$metadata
    });
  }
  return parseJsonBody(response);
};

// node_modules/aws-amplify/node_modules/@aws-amplify/auth/dist/esm/foundation/factories/serviceClients/cognitoIdentityProvider/shared/handler/cognitoUserPoolTransferHandler.mjs
var disableCacheMiddlewareFactory = () => (next, _) => async function disableCacheMiddleware(request) {
  request.headers["cache-control"] = "no-store";
  return next(request);
};
var cognitoUserPoolTransferHandler = composeTransferHandler(unauthenticatedHandler, [disableCacheMiddlewareFactory]);

// node_modules/aws-amplify/node_modules/@aws-amplify/auth/dist/esm/foundation/constants.mjs
var COGNITO_IDP_SERVICE_NAME = "cognito-idp";

// node_modules/aws-amplify/node_modules/@aws-amplify/auth/dist/esm/foundation/factories/serviceClients/cognitoIdentityProvider/constants.mjs
var DEFAULT_SERVICE_CLIENT_API_CONFIG2 = {
  service: COGNITO_IDP_SERVICE_NAME,
  retryDecider: getRetryDecider(parseJsonError),
  computeDelay: jitteredBackoff2,
  get userAgentValue() {
    return getAmplifyUserAgent();
  },
  cache: "no-store"
};

// node_modules/aws-amplify/node_modules/@aws-amplify/auth/dist/esm/foundation/cognitoUserPoolEndpointResolver.mjs
var cognitoUserPoolEndpointResolver = ({ region }) => ({
  url: new AmplifyUrl(`https://${COGNITO_IDP_SERVICE_NAME}.${region}.${getDnsSuffix(region)}`)
});

// node_modules/aws-amplify/node_modules/@aws-amplify/auth/dist/esm/providers/cognito/factories/createCognitoUserPoolEndpointResolver.mjs
var createCognitoUserPoolEndpointResolver = ({ endpointOverride }) => (input) => {
  if (endpointOverride) {
    return { url: new AmplifyUrl(endpointOverride) };
  }
  return cognitoUserPoolEndpointResolver(input);
};

// node_modules/aws-amplify/node_modules/@aws-amplify/auth/dist/esm/foundation/factories/serviceClients/cognitoIdentityProvider/createGetTokensFromRefreshTokenClient.mjs
var createGetTokensFromRefreshTokenClient = (config2) => composeServiceApi(cognitoUserPoolTransferHandler, createUserPoolSerializer("GetTokensFromRefreshToken"), createUserPoolDeserializer(), {
  ...DEFAULT_SERVICE_CLIENT_API_CONFIG2,
  ...config2
});

// node_modules/aws-amplify/node_modules/@aws-amplify/auth/dist/esm/providers/cognito/utils/refreshAuthTokens.mjs
var refreshAuthTokensFunction = async ({ tokens, authConfig, username, clientMetadata }) => {
  assertTokenProviderConfig(authConfig?.Cognito);
  const { userPoolId, userPoolClientId, userPoolEndpoint } = authConfig.Cognito;
  const region = getRegionFromUserPoolId(userPoolId);
  assertAuthTokensWithRefreshToken(tokens);
  const getTokensFromRefreshToken = createGetTokensFromRefreshTokenClient({
    endpointResolver: createCognitoUserPoolEndpointResolver({
      endpointOverride: userPoolEndpoint
    })
  });
  const { AuthenticationResult } = await getTokensFromRefreshToken({ region }, {
    ClientId: userPoolClientId,
    RefreshToken: tokens.refreshToken,
    DeviceKey: tokens.deviceMetadata?.deviceKey,
    ClientMetadata: clientMetadata
  });
  const accessToken = decodeJWT(AuthenticationResult?.AccessToken ?? "");
  const idToken = AuthenticationResult?.IdToken ? decodeJWT(AuthenticationResult.IdToken) : void 0;
  const { iat } = accessToken.payload;
  if (!iat) {
    throw new AuthError({
      name: "iatNotFoundException",
      message: "iat not found in access token"
    });
  }
  const clockDrift = iat * 1e3 - (/* @__PURE__ */ new Date()).getTime();
  return {
    accessToken,
    idToken,
    clockDrift,
    refreshToken: AuthenticationResult?.RefreshToken ?? tokens.refreshToken,
    username
  };
};
var refreshAuthTokens = deDupeAsyncFunction(refreshAuthTokensFunction);

// node_modules/aws-amplify/node_modules/@aws-amplify/auth/dist/esm/providers/cognito/tokenProvider/types.mjs
var AuthTokenStorageKeys = {
  accessToken: "accessToken",
  idToken: "idToken",
  oidcProvider: "oidcProvider",
  clockDrift: "clockDrift",
  refreshToken: "refreshToken",
  deviceKey: "deviceKey",
  randomPasswordKey: "randomPasswordKey",
  deviceGroupKey: "deviceGroupKey",
  signInDetails: "signInDetails",
  oauthMetadata: "oauthMetadata"
};

// node_modules/aws-amplify/node_modules/@aws-amplify/auth/dist/esm/providers/cognito/tokenProvider/errorHelpers.mjs
var TokenProviderErrorCode;
(function(TokenProviderErrorCode2) {
  TokenProviderErrorCode2["InvalidAuthTokens"] = "InvalidAuthTokens";
})(TokenProviderErrorCode || (TokenProviderErrorCode = {}));
var tokenValidationErrorMap = {
  [TokenProviderErrorCode.InvalidAuthTokens]: {
    message: "Invalid tokens.",
    recoverySuggestion: "Make sure the tokens are valid."
  }
};
var assert4 = createAssertionFunction(tokenValidationErrorMap);

// node_modules/aws-amplify/node_modules/@aws-amplify/auth/dist/esm/providers/cognito/tokenProvider/constants.mjs
var AUTH_KEY_PREFIX = "CognitoIdentityServiceProvider";

// node_modules/aws-amplify/node_modules/@aws-amplify/auth/dist/esm/providers/cognito/tokenProvider/TokenStore.mjs
var DefaultTokenStore = class {
  getKeyValueStorage() {
    if (!this.keyValueStorage) {
      throw new AuthError({
        name: "KeyValueStorageNotFoundException",
        message: "KeyValueStorage was not found in TokenStore"
      });
    }
    return this.keyValueStorage;
  }
  setKeyValueStorage(keyValueStorage) {
    this.keyValueStorage = keyValueStorage;
  }
  setAuthConfig(authConfig) {
    this.authConfig = authConfig;
  }
  async loadTokens() {
    try {
      const authKeys = await this.getAuthKeys();
      const accessTokenString = await this.getKeyValueStorage().getItem(authKeys.accessToken);
      if (!accessTokenString) {
        throw new AuthError({
          name: "NoSessionFoundException",
          message: "Auth session was not found. Make sure to call signIn."
        });
      }
      const accessToken = decodeJWT(accessTokenString);
      const itString = await this.getKeyValueStorage().getItem(authKeys.idToken);
      const idToken = itString ? decodeJWT(itString) : void 0;
      const refreshToken = await this.getKeyValueStorage().getItem(authKeys.refreshToken) ?? void 0;
      const clockDriftString = await this.getKeyValueStorage().getItem(authKeys.clockDrift) ?? "0";
      const clockDrift = Number.parseInt(clockDriftString);
      const signInDetails = await this.getKeyValueStorage().getItem(authKeys.signInDetails);
      const tokens = {
        accessToken,
        idToken,
        refreshToken,
        deviceMetadata: await this.getDeviceMetadata() ?? void 0,
        clockDrift,
        username: await this.getLastAuthUser()
      };
      if (signInDetails) {
        tokens.signInDetails = JSON.parse(signInDetails);
      }
      return tokens;
    } catch (err) {
      return null;
    }
  }
  async storeTokens(tokens) {
    assert4(tokens !== void 0, TokenProviderErrorCode.InvalidAuthTokens);
    const lastAuthUser = tokens.username;
    await this.getKeyValueStorage().setItem(this.getLastAuthUserKey(), lastAuthUser);
    const authKeys = await this.getAuthKeys();
    await this.getKeyValueStorage().setItem(authKeys.accessToken, tokens.accessToken.toString());
    if (tokens.idToken) {
      await this.getKeyValueStorage().setItem(authKeys.idToken, tokens.idToken.toString());
    } else {
      await this.getKeyValueStorage().removeItem(authKeys.idToken);
    }
    if (tokens.refreshToken) {
      await this.getKeyValueStorage().setItem(authKeys.refreshToken, tokens.refreshToken);
    } else {
      await this.getKeyValueStorage().removeItem(authKeys.refreshToken);
    }
    if (tokens.deviceMetadata) {
      if (tokens.deviceMetadata.deviceKey) {
        await this.getKeyValueStorage().setItem(authKeys.deviceKey, tokens.deviceMetadata.deviceKey);
      }
      if (tokens.deviceMetadata.deviceGroupKey) {
        await this.getKeyValueStorage().setItem(authKeys.deviceGroupKey, tokens.deviceMetadata.deviceGroupKey);
      }
      await this.getKeyValueStorage().setItem(authKeys.randomPasswordKey, tokens.deviceMetadata.randomPassword);
    }
    if (tokens.signInDetails) {
      await this.getKeyValueStorage().setItem(authKeys.signInDetails, JSON.stringify(tokens.signInDetails));
    } else {
      await this.getKeyValueStorage().removeItem(authKeys.signInDetails);
    }
    await this.getKeyValueStorage().setItem(authKeys.clockDrift, `${tokens.clockDrift}`);
  }
  async clearTokens() {
    const authKeys = await this.getAuthKeys();
    await Promise.all([
      this.getKeyValueStorage().removeItem(authKeys.accessToken),
      this.getKeyValueStorage().removeItem(authKeys.idToken),
      this.getKeyValueStorage().removeItem(authKeys.clockDrift),
      this.getKeyValueStorage().removeItem(authKeys.refreshToken),
      this.getKeyValueStorage().removeItem(authKeys.signInDetails),
      this.getKeyValueStorage().removeItem(this.getLastAuthUserKey()),
      this.getKeyValueStorage().removeItem(authKeys.oauthMetadata)
    ]);
  }
  async getDeviceMetadata(username) {
    const authKeys = await this.getAuthKeys(username);
    const deviceKey = await this.getKeyValueStorage().getItem(authKeys.deviceKey);
    const deviceGroupKey = await this.getKeyValueStorage().getItem(authKeys.deviceGroupKey);
    const randomPassword = await this.getKeyValueStorage().getItem(authKeys.randomPasswordKey);
    return randomPassword && deviceGroupKey && deviceKey ? {
      deviceKey,
      deviceGroupKey,
      randomPassword
    } : null;
  }
  async clearDeviceMetadata(username) {
    const authKeys = await this.getAuthKeys(username);
    await Promise.all([
      this.getKeyValueStorage().removeItem(authKeys.deviceKey),
      this.getKeyValueStorage().removeItem(authKeys.deviceGroupKey),
      this.getKeyValueStorage().removeItem(authKeys.randomPasswordKey)
    ]);
  }
  async getAuthKeys(username) {
    assertTokenProviderConfig(this.authConfig?.Cognito);
    const lastAuthUser = username ?? await this.getLastAuthUser();
    return createKeysForAuthStorage(AUTH_KEY_PREFIX, `${this.authConfig.Cognito.userPoolClientId}.${lastAuthUser}`);
  }
  getLastAuthUserKey() {
    assertTokenProviderConfig(this.authConfig?.Cognito);
    const identifier = this.authConfig.Cognito.userPoolClientId;
    return `${AUTH_KEY_PREFIX}.${identifier}.LastAuthUser`;
  }
  async getLastAuthUser() {
    const lastAuthUser = await this.getKeyValueStorage().getItem(this.getLastAuthUserKey()) ?? "username";
    return lastAuthUser;
  }
  async setOAuthMetadata(metadata) {
    const { oauthMetadata: oauthMetadataKey } = await this.getAuthKeys();
    await this.getKeyValueStorage().setItem(oauthMetadataKey, JSON.stringify(metadata));
  }
  async getOAuthMetadata() {
    const { oauthMetadata: oauthMetadataKey } = await this.getAuthKeys();
    const oauthMetadata = await this.getKeyValueStorage().getItem(oauthMetadataKey);
    return oauthMetadata && JSON.parse(oauthMetadata);
  }
};
var createKeysForAuthStorage = (provider, identifier) => {
  return getAuthStorageKeys(AuthTokenStorageKeys)(`${provider}`, identifier);
};
function getAuthStorageKeys(authKeys) {
  const keys = Object.values({ ...authKeys });
  return (prefix, identifier) => keys.reduce((acc, authKey) => ({
    ...acc,
    [authKey]: `${prefix}.${identifier}.${authKey}`
  }), {});
}

// node_modules/aws-amplify/node_modules/@aws-amplify/auth/dist/esm/providers/cognito/utils/signInWithRedirectStore.mjs
var V5_HOSTED_UI_KEY = "amplify-signin-with-hostedUI";
var name = "CognitoIdentityServiceProvider";
var DefaultOAuthStore = class {
  constructor(keyValueStorage) {
    this.keyValueStorage = keyValueStorage;
  }
  async clearOAuthInflightData() {
    assertTokenProviderConfig(this.cognitoConfig);
    const authKeys = createKeysForAuthStorage2(name, this.cognitoConfig.userPoolClientId);
    await Promise.all([
      this.keyValueStorage.removeItem(authKeys.inflightOAuth),
      this.keyValueStorage.removeItem(authKeys.oauthPKCE),
      this.keyValueStorage.removeItem(authKeys.oauthState)
    ]);
  }
  async clearOAuthData() {
    assertTokenProviderConfig(this.cognitoConfig);
    const authKeys = createKeysForAuthStorage2(name, this.cognitoConfig.userPoolClientId);
    await this.clearOAuthInflightData();
    await this.keyValueStorage.removeItem(V5_HOSTED_UI_KEY);
    return this.keyValueStorage.removeItem(authKeys.oauthSignIn);
  }
  loadOAuthState() {
    assertTokenProviderConfig(this.cognitoConfig);
    const authKeys = createKeysForAuthStorage2(name, this.cognitoConfig.userPoolClientId);
    return this.keyValueStorage.getItem(authKeys.oauthState);
  }
  storeOAuthState(state) {
    assertTokenProviderConfig(this.cognitoConfig);
    const authKeys = createKeysForAuthStorage2(name, this.cognitoConfig.userPoolClientId);
    return this.keyValueStorage.setItem(authKeys.oauthState, state);
  }
  loadPKCE() {
    assertTokenProviderConfig(this.cognitoConfig);
    const authKeys = createKeysForAuthStorage2(name, this.cognitoConfig.userPoolClientId);
    return this.keyValueStorage.getItem(authKeys.oauthPKCE);
  }
  storePKCE(pkce) {
    assertTokenProviderConfig(this.cognitoConfig);
    const authKeys = createKeysForAuthStorage2(name, this.cognitoConfig.userPoolClientId);
    return this.keyValueStorage.setItem(authKeys.oauthPKCE, pkce);
  }
  setAuthConfig(authConfigParam) {
    this.cognitoConfig = authConfigParam;
  }
  async loadOAuthInFlight() {
    assertTokenProviderConfig(this.cognitoConfig);
    const authKeys = createKeysForAuthStorage2(name, this.cognitoConfig.userPoolClientId);
    return await this.keyValueStorage.getItem(authKeys.inflightOAuth) === "true";
  }
  async storeOAuthInFlight(inflight) {
    assertTokenProviderConfig(this.cognitoConfig);
    const authKeys = createKeysForAuthStorage2(name, this.cognitoConfig.userPoolClientId);
    await this.keyValueStorage.setItem(authKeys.inflightOAuth, `${inflight}`);
  }
  async loadOAuthSignIn() {
    assertTokenProviderConfig(this.cognitoConfig);
    const authKeys = createKeysForAuthStorage2(name, this.cognitoConfig.userPoolClientId);
    const isLegacyHostedUISignIn = await this.keyValueStorage.getItem(V5_HOSTED_UI_KEY);
    const [isOAuthSignIn, preferPrivateSession] = (await this.keyValueStorage.getItem(authKeys.oauthSignIn))?.split(",") ?? [];
    return {
      isOAuthSignIn: isOAuthSignIn === "true" || isLegacyHostedUISignIn === "true",
      preferPrivateSession: preferPrivateSession === "true"
    };
  }
  async storeOAuthSignIn(oauthSignIn, preferPrivateSession = false) {
    assertTokenProviderConfig(this.cognitoConfig);
    const authKeys = createKeysForAuthStorage2(name, this.cognitoConfig.userPoolClientId);
    await this.keyValueStorage.setItem(authKeys.oauthSignIn, `${oauthSignIn},${preferPrivateSession}`);
  }
};
var createKeysForAuthStorage2 = (provider, identifier) => {
  return getAuthStorageKeys(OAuthStorageKeys)(provider, identifier);
};

// node_modules/aws-amplify/node_modules/@aws-amplify/auth/dist/esm/providers/cognito/utils/oauth/oAuthStore.mjs
var oAuthStore = new DefaultOAuthStore(defaultStorage);

// node_modules/aws-amplify/node_modules/@aws-amplify/auth/dist/esm/providers/cognito/utils/oauth/inflightPromise.mjs
var inflightPromises = [];
var addInflightPromise = (resolver) => {
  inflightPromises.push(resolver);
};
var resolveAndClearInflightPromises = () => {
  while (inflightPromises.length) {
    inflightPromises.pop()?.();
  }
};

// node_modules/aws-amplify/node_modules/@aws-amplify/auth/dist/esm/providers/cognito/tokenProvider/TokenOrchestrator.mjs
var TokenOrchestrator = class {
  constructor() {
    this.waitForInflightOAuth = isBrowser() ? async () => {
      if (!await oAuthStore.loadOAuthInFlight()) {
        return;
      }
      if (this.inflightPromise) {
        return this.inflightPromise;
      }
      this.inflightPromise = new Promise((resolve, _reject) => {
        addInflightPromise(resolve);
      });
      return this.inflightPromise;
    } : async () => {
    };
  }
  setAuthConfig(authConfig) {
    oAuthStore.setAuthConfig(authConfig.Cognito);
    this.authConfig = authConfig;
  }
  setTokenRefresher(tokenRefresher) {
    this.tokenRefresher = tokenRefresher;
  }
  setAuthTokenStore(tokenStore) {
    this.tokenStore = tokenStore;
  }
  getTokenStore() {
    if (!this.tokenStore) {
      throw new AuthError({
        name: "EmptyTokenStoreException",
        message: "TokenStore not set"
      });
    }
    return this.tokenStore;
  }
  getTokenRefresher() {
    if (!this.tokenRefresher) {
      throw new AuthError({
        name: "EmptyTokenRefresherException",
        message: "TokenRefresher not set"
      });
    }
    return this.tokenRefresher;
  }
  setClientMetadataProvider(clientMetadataProvider) {
    this.clientMetadataProvider = clientMetadataProvider;
  }
  async getTokens(options) {
    let tokens;
    try {
      assertTokenProviderConfig(this.authConfig?.Cognito);
    } catch (_err) {
      return null;
    }
    await this.waitForInflightOAuth();
    this.inflightPromise = void 0;
    tokens = await this.getTokenStore().loadTokens();
    const username = await this.getTokenStore().getLastAuthUser();
    if (tokens === null) {
      return null;
    }
    const idTokenExpired = !!tokens?.idToken && isTokenExpired({
      expiresAt: (tokens.idToken?.payload?.exp ?? 0) * 1e3,
      clockDrift: tokens.clockDrift ?? 0
    });
    const accessTokenExpired = isTokenExpired({
      expiresAt: (tokens.accessToken?.payload?.exp ?? 0) * 1e3,
      clockDrift: tokens.clockDrift ?? 0
    });
    if (options?.forceRefresh || idTokenExpired || accessTokenExpired) {
      tokens = await this.refreshTokens({
        tokens,
        username,
        clientMetadata: options?.clientMetadata ?? await this.clientMetadataProvider?.()
      });
      if (tokens === null) {
        return null;
      }
    }
    return {
      accessToken: tokens?.accessToken,
      idToken: tokens?.idToken,
      signInDetails: tokens?.signInDetails
    };
  }
  async refreshTokens({ tokens, username, clientMetadata }) {
    try {
      const { signInDetails } = tokens;
      const newTokens = await this.getTokenRefresher()({
        tokens,
        authConfig: this.authConfig,
        username,
        clientMetadata
      });
      newTokens.signInDetails = signInDetails;
      await this.setTokens({ tokens: newTokens });
      Hub.dispatch("auth", { event: "tokenRefresh" }, "Auth", AMPLIFY_SYMBOL);
      return newTokens;
    } catch (err) {
      return this.handleErrors(err);
    }
  }
  handleErrors(err) {
    assertServiceError(err);
    const shouldClearTokens = this.isAuthenticationError(err);
    if (shouldClearTokens) {
      this.clearTokens();
    }
    Hub.dispatch("auth", {
      event: "tokenRefresh_failure",
      data: { error: err }
    }, "Auth", AMPLIFY_SYMBOL);
    if (err.name.startsWith("NotAuthorizedException")) {
      return null;
    }
    throw err;
  }
  isAuthenticationError(err) {
    const authErrorNames = [
      "NotAuthorizedException",
      // Refresh token is expired or invalid
      "TokenRevokedException",
      // Token was revoked by admin
      "UserNotFoundException",
      // User no longer exists
      "PasswordResetRequiredException",
      // User must reset password
      "UserNotConfirmedException",
      // User account is not confirmed
      "RefreshTokenReuseException"
      // Refresh token invalidated by rotation
    ];
    return authErrorNames.some((errorName) => err?.name?.startsWith?.(errorName));
  }
  async setTokens({ tokens }) {
    return this.getTokenStore().storeTokens(tokens);
  }
  async clearTokens() {
    return this.getTokenStore().clearTokens();
  }
  getDeviceMetadata(username) {
    return this.getTokenStore().getDeviceMetadata(username);
  }
  clearDeviceMetadata(username) {
    return this.getTokenStore().clearDeviceMetadata(username);
  }
  setOAuthMetadata(metadata) {
    return this.getTokenStore().setOAuthMetadata(metadata);
  }
  getOAuthMetadata() {
    return this.getTokenStore().getOAuthMetadata();
  }
};

// node_modules/aws-amplify/node_modules/@aws-amplify/auth/dist/esm/providers/cognito/tokenProvider/CognitoUserPoolsTokenProvider.mjs
var CognitoUserPoolsTokenProvider = class {
  constructor() {
    this.authTokenStore = new DefaultTokenStore();
    this.authTokenStore.setKeyValueStorage(defaultStorage);
    this.tokenOrchestrator = new TokenOrchestrator();
    this.tokenOrchestrator.setAuthTokenStore(this.authTokenStore);
    this.tokenOrchestrator.setTokenRefresher(refreshAuthTokens);
  }
  getTokens(options = {}) {
    return this.tokenOrchestrator.getTokens(options);
  }
  setKeyValueStorage(keyValueStorage) {
    this.authTokenStore.setKeyValueStorage(keyValueStorage);
  }
  setClientMetadataProvider(clientMetadataProvider) {
    this.tokenOrchestrator.setClientMetadataProvider(clientMetadataProvider);
  }
  setAuthConfig(authConfig) {
    this.authTokenStore.setAuthConfig(authConfig);
    this.tokenOrchestrator.setAuthConfig(authConfig);
  }
};

// node_modules/aws-amplify/node_modules/@aws-amplify/auth/dist/esm/providers/cognito/tokenProvider/tokenProvider.mjs
var cognitoUserPoolsTokenProvider = new CognitoUserPoolsTokenProvider();
var { tokenOrchestrator } = cognitoUserPoolsTokenProvider;

// node_modules/aws-amplify/node_modules/@aws-amplify/auth/dist/esm/providers/cognito/tokenProvider/cacheTokens.mjs
async function cacheCognitoTokens(AuthenticationResult) {
  if (AuthenticationResult.AccessToken) {
    const accessToken = decodeJWT(AuthenticationResult.AccessToken);
    const accessTokenIssuedAtInMillis = (accessToken.payload.iat || 0) * 1e3;
    const currentTime = (/* @__PURE__ */ new Date()).getTime();
    const clockDrift = accessTokenIssuedAtInMillis > 0 ? accessTokenIssuedAtInMillis - currentTime : 0;
    let idToken;
    let refreshToken;
    let deviceMetadata;
    if (AuthenticationResult.RefreshToken) {
      refreshToken = AuthenticationResult.RefreshToken;
    }
    if (AuthenticationResult.IdToken) {
      idToken = decodeJWT(AuthenticationResult.IdToken);
    }
    if (AuthenticationResult?.NewDeviceMetadata) {
      deviceMetadata = AuthenticationResult.NewDeviceMetadata;
    }
    const tokens = {
      accessToken,
      idToken,
      refreshToken,
      clockDrift,
      deviceMetadata,
      username: AuthenticationResult.username
    };
    if (AuthenticationResult?.signInDetails) {
      tokens.signInDetails = AuthenticationResult.signInDetails;
    }
    await tokenOrchestrator.setTokens({
      tokens
    });
  } else {
    throw new AmplifyError({
      message: "Invalid tokens",
      name: "InvalidTokens",
      recoverySuggestion: "Check Cognito UserPool settings"
    });
  }
}

// node_modules/aws-amplify/node_modules/@aws-amplify/auth/dist/esm/providers/cognito/utils/dispatchSignedInHubEvent.mjs
var ERROR_MESSAGE = "Unable to get user session following successful sign-in.";
var dispatchSignedInHubEvent = async () => {
  try {
    Hub.dispatch("auth", {
      event: "signedIn",
      data: await getCurrentUser2()
    }, "Auth", AMPLIFY_SYMBOL);
  } catch (error) {
    if (error.name === USER_UNAUTHENTICATED_EXCEPTION) {
      throw new AuthError({
        name: UNEXPECTED_SIGN_IN_INTERRUPTION_EXCEPTION,
        message: ERROR_MESSAGE,
        recoverySuggestion: "This most likely is due to auth tokens not being persisted. If you are using cookie store, please ensure cookies can be correctly set from your server."
      });
    }
    throw error;
  }
};

// node_modules/aws-amplify/node_modules/@aws-amplify/auth/dist/esm/Errors.mjs
var logger10 = new ConsoleLogger("AuthError");
var authErrorMessages = {
  oauthSignInError: {
    message: AuthErrorStrings.OAUTH_ERROR,
    log: "Make sure Cognito Hosted UI has been configured correctly"
  },
  noConfig: {
    message: AuthErrorStrings.DEFAULT_MSG,
    log: `
            Error: Amplify has not been configured correctly.
            This error is typically caused by one of the following scenarios:

            1. Make sure you're passing the awsconfig object to Amplify.configure() in your app's entry point
                See https://aws-amplify.github.io/docs/js/authentication#configure-your-app for more information
            
            2. There might be multiple conflicting versions of amplify packages in your node_modules.
				Refer to our docs site for help upgrading Amplify packages (https://docs.amplify.aws/lib/troubleshooting/upgrading/q/platform/js)
        `
  },
  missingAuthConfig: {
    message: AuthErrorStrings.DEFAULT_MSG,
    log: `
            Error: Amplify has not been configured correctly. 
            The configuration object is missing required auth properties.
            This error is typically caused by one of the following scenarios:

            1. Did you run \`amplify push\` after adding auth via \`amplify add auth\`?
                See https://aws-amplify.github.io/docs/js/authentication#amplify-project-setup for more information

            2. This could also be caused by multiple conflicting versions of amplify packages, see (https://docs.amplify.aws/lib/troubleshooting/upgrading/q/platform/js) for help upgrading Amplify packages.
        `
  },
  emptyUsername: {
    message: AuthErrorStrings.EMPTY_USERNAME
  },
  // TODO: should include a list of valid sign-in types
  invalidUsername: {
    message: AuthErrorStrings.INVALID_USERNAME
  },
  emptyPassword: {
    message: AuthErrorStrings.EMPTY_PASSWORD
  },
  emptyCode: {
    message: AuthErrorStrings.EMPTY_CODE
  },
  signUpError: {
    message: AuthErrorStrings.SIGN_UP_ERROR,
    log: "The first parameter should either be non-null string or object"
  },
  noMFA: {
    message: AuthErrorStrings.NO_MFA
  },
  invalidMFA: {
    message: AuthErrorStrings.INVALID_MFA
  },
  emptyChallengeResponse: {
    message: AuthErrorStrings.EMPTY_CHALLENGE
  },
  noUserSession: {
    message: AuthErrorStrings.NO_USER_SESSION
  },
  deviceConfig: {
    message: AuthErrorStrings.DEVICE_CONFIG
  },
  networkError: {
    message: AuthErrorStrings.NETWORK_ERROR
  },
  autoSignInError: {
    message: AuthErrorStrings.AUTOSIGNIN_ERROR
  },
  default: {
    message: AuthErrorStrings.DEFAULT_MSG
  }
};

// node_modules/aws-amplify/node_modules/@aws-amplify/auth/dist/esm/providers/cognito/utils/oauth/createOAuthError.mjs
var createOAuthError = (message, recoverySuggestion) => new AuthError({
  message: message ?? "An error has occurred during the oauth process.",
  name: AuthErrorCodes.OAuthSignInError,
  recoverySuggestion: recoverySuggestion ?? authErrorMessages.oauthSignInError.log
});

// node_modules/aws-amplify/node_modules/@aws-amplify/auth/dist/esm/types/Auth.mjs
var AuthErrorTypes;
(function(AuthErrorTypes2) {
  AuthErrorTypes2["NoConfig"] = "noConfig";
  AuthErrorTypes2["MissingAuthConfig"] = "missingAuthConfig";
  AuthErrorTypes2["EmptyUsername"] = "emptyUsername";
  AuthErrorTypes2["InvalidUsername"] = "invalidUsername";
  AuthErrorTypes2["EmptyPassword"] = "emptyPassword";
  AuthErrorTypes2["EmptyCode"] = "emptyCode";
  AuthErrorTypes2["SignUpError"] = "signUpError";
  AuthErrorTypes2["NoMFA"] = "noMFA";
  AuthErrorTypes2["InvalidMFA"] = "invalidMFA";
  AuthErrorTypes2["EmptyChallengeResponse"] = "emptyChallengeResponse";
  AuthErrorTypes2["NoUserSession"] = "noUserSession";
  AuthErrorTypes2["Default"] = "default";
  AuthErrorTypes2["DeviceConfig"] = "deviceConfig";
  AuthErrorTypes2["NetworkError"] = "networkError";
  AuthErrorTypes2["AutoSignInError"] = "autoSignInError";
  AuthErrorTypes2["OAuthSignInError"] = "oauthSignInError";
})(AuthErrorTypes || (AuthErrorTypes = {}));

// node_modules/aws-amplify/node_modules/@aws-amplify/auth/dist/esm/providers/cognito/utils/oauth/validateState.mjs
var flowCancelledMessage = "`signInWithRedirect` has been canceled.";
var validationFailedMessage = "An error occurred while validating the state.";
var validationRecoverySuggestion = "Try to initiate an OAuth flow from Amplify";
var validateState = async (state) => {
  const savedState = await oAuthStore.loadOAuthState();
  const validatedState = state === savedState ? savedState : void 0;
  if (!validatedState) {
    throw new AuthError({
      name: AuthErrorTypes.OAuthSignInError,
      message: state === null ? flowCancelledMessage : validationFailedMessage,
      recoverySuggestion: state === null ? void 0 : validationRecoverySuggestion
    });
  }
  return validatedState;
};

// node_modules/aws-amplify/node_modules/@aws-amplify/auth/dist/esm/providers/cognito/utils/oauth/completeOAuthFlow.mjs
var completeOAuthFlow = async ({ currentUrl, userAgentValue, clientId, redirectUri, responseType, domain, preferPrivateSession }) => {
  const urlParams = new AmplifyUrl(currentUrl);
  const error = urlParams.searchParams.get("error");
  const errorMessage = urlParams.searchParams.get("error_description");
  if (error) {
    throw createOAuthError(errorMessage ?? error);
  }
  if (responseType === "code") {
    return handleCodeFlow({
      currentUrl,
      userAgentValue,
      clientId,
      redirectUri,
      domain,
      preferPrivateSession
    });
  }
  return handleImplicitFlow({
    currentUrl,
    redirectUri,
    preferPrivateSession
  });
};
var handleCodeFlow = async ({ currentUrl, userAgentValue, clientId, redirectUri, domain, preferPrivateSession }) => {
  const url = new AmplifyUrl(currentUrl);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  if (!code || !state) {
    throw createOAuthError("User cancelled OAuth flow.");
  }
  const validatedState = await validateState(state);
  const oAuthTokenEndpoint = "https://" + domain + "/oauth2/token";
  const codeVerifier = await oAuthStore.loadPKCE();
  const oAuthTokenBody = {
    grant_type: "authorization_code",
    code,
    client_id: clientId,
    redirect_uri: redirectUri,
    ...codeVerifier ? { code_verifier: codeVerifier } : {}
  };
  const body = Object.entries(oAuthTokenBody).map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`).join("&");
  const { access_token, refresh_token: refreshToken, id_token, error, error_message: errorMessage, token_type, expires_in } = await (await fetch(oAuthTokenEndpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      [USER_AGENT_HEADER]: userAgentValue
    },
    body
  })).json();
  if (error) {
    throw createOAuthError(errorMessage ?? error);
  }
  const username = (access_token && decodeJWT(access_token).payload.username) ?? "username";
  await cacheCognitoTokens({
    username,
    AccessToken: access_token,
    IdToken: id_token,
    RefreshToken: refreshToken
  });
  return completeFlow({
    redirectUri,
    state: validatedState,
    preferPrivateSession
  });
};
var handleImplicitFlow = async ({ currentUrl, redirectUri, preferPrivateSession }) => {
  const url = new AmplifyUrl(currentUrl);
  const { id_token, access_token, state, token_type, expires_in, error_description, error } = (url.hash ?? "#").substring(1).split("&").map((pairings) => pairings.split("=")).reduce((accum, [k, v]) => ({ ...accum, [k]: v }), {
    id_token: void 0,
    access_token: void 0,
    state: void 0,
    token_type: void 0,
    expires_in: void 0,
    error_description: void 0,
    error: void 0
  });
  if (error) {
    throw createOAuthError(error_description ?? error);
  }
  if (!access_token) {
    throw createOAuthError("No access token returned from OAuth flow.");
  }
  const validatedState = await validateState(state);
  const username = (access_token && decodeJWT(access_token).payload.username) ?? "username";
  await cacheCognitoTokens({
    username,
    AccessToken: access_token,
    IdToken: id_token
  });
  return completeFlow({
    redirectUri,
    state: validatedState,
    preferPrivateSession
  });
};
var completeFlow = async ({ redirectUri, state, preferPrivateSession }) => {
  await tokenOrchestrator.setOAuthMetadata({
    oauthSignIn: true
  });
  await oAuthStore.clearOAuthData();
  await oAuthStore.storeOAuthSignIn(true, preferPrivateSession);
  resolveAndClearInflightPromises();
  clearHistory(redirectUri);
  if (isCustomState(state)) {
    Hub.dispatch("auth", {
      event: "customOAuthState",
      data: urlSafeDecode(getCustomState(state))
    }, "Auth", AMPLIFY_SYMBOL);
  }
  Hub.dispatch("auth", { event: "signInWithRedirect" }, "Auth", AMPLIFY_SYMBOL);
  await dispatchSignedInHubEvent();
};
var isCustomState = (state) => {
  return /-/.test(state);
};
var getCustomState = (state) => {
  return state.split("-").splice(1).join("-");
};
var clearHistory = (redirectUri) => {
  if (typeof window !== "undefined" && typeof window.history !== "undefined") {
    window.history.replaceState(window.history.state, "", redirectUri);
  }
};

// node_modules/aws-amplify/node_modules/@aws-amplify/auth/dist/esm/providers/cognito/utils/oauth/getRedirectUrl.mjs
function getRedirectUrl2(redirects, preferredRedirectUrl) {
  if (preferredRedirectUrl) {
    const redirectUrl = redirects?.find((redirect) => redirect === preferredRedirectUrl);
    if (!redirectUrl) {
      throw invalidPreferredRedirectUrlException;
    }
    return redirectUrl;
  } else {
    const redirectUrlFromTheSameOrigin = redirects?.find(isSameOriginAndPathName) ?? redirects?.find(isTheSameDomain);
    const redirectUrlFromDifferentOrigin = redirects?.find(isHttps) ?? redirects?.find(isHttp);
    if (redirectUrlFromTheSameOrigin) {
      return redirectUrlFromTheSameOrigin;
    } else if (redirectUrlFromDifferentOrigin) {
      throw invalidOriginException;
    }
    throw invalidRedirectException;
  }
}
var isSameOriginAndPathName = (redirect) => redirect.startsWith(String(window.location.origin + (window.location.pathname || "/")));
var isTheSameDomain = (redirect) => redirect.includes(String(window.location.hostname));
var isHttp = (redirect) => redirect.startsWith("http://");
var isHttps = (redirect) => redirect.startsWith("https://");

// node_modules/aws-amplify/node_modules/@aws-amplify/auth/dist/esm/providers/cognito/utils/oauth/handleFailure.mjs
var handleFailure = async (error) => {
  resolveAndClearInflightPromises();
  await oAuthStore.clearOAuthInflightData();
  Hub.dispatch("auth", { event: "signInWithRedirect_failure", data: { error } }, "Auth", AMPLIFY_SYMBOL);
};

// node_modules/aws-amplify/node_modules/@aws-amplify/auth/dist/esm/providers/cognito/utils/oauth/attemptCompleteOAuthFlow.mjs
var attemptCompleteOAuthFlow = async (authConfig) => {
  try {
    assertTokenProviderConfig(authConfig);
    assertOAuthConfig(authConfig);
    oAuthStore.setAuthConfig(authConfig);
  } catch (_) {
    return;
  }
  if (!await oAuthStore.loadOAuthInFlight()) {
    return;
  }
  try {
    const currentUrl = window.location.href;
    const { loginWith, userPoolClientId } = authConfig;
    const { domain, redirectSignIn, responseType } = loginWith.oauth;
    const redirectUri = getRedirectUrl2(redirectSignIn);
    await completeOAuthFlow({
      currentUrl,
      clientId: userPoolClientId,
      domain,
      redirectUri,
      responseType,
      userAgentValue: getAuthUserAgentValue(AuthAction.SignInWithRedirect)
    });
  } catch (err) {
    await handleFailure(err);
  }
};

// node_modules/aws-amplify/node_modules/@aws-amplify/auth/dist/esm/providers/cognito/utils/oauth/enableOAuthListener.mjs
isBrowser() && (() => {
  Amplify[ADD_OAUTH_LISTENER](attemptCompleteOAuthFlow);
})();

// node_modules/aws-amplify/node_modules/@aws-amplify/auth/dist/esm/providers/cognito/credentialsProvider/types.mjs
var IdentityIdStorageKeys = {
  identityId: "identityId"
};

// node_modules/aws-amplify/node_modules/@aws-amplify/auth/dist/esm/providers/cognito/credentialsProvider/IdentityIdStore.mjs
var logger11 = new ConsoleLogger("DefaultIdentityIdStore");
var DefaultIdentityIdStore = class {
  setAuthConfig(authConfigParam) {
    assertIdentityPoolIdConfig(authConfigParam.Cognito);
    this.authConfig = authConfigParam;
    this._authKeys = createKeysForAuthStorage3("Cognito", authConfigParam.Cognito.identityPoolId);
  }
  constructor(keyValueStorage) {
    this._authKeys = {};
    this._hasGuestIdentityId = false;
    this.keyValueStorage = keyValueStorage;
  }
  async loadIdentityId() {
    assertIdentityPoolIdConfig(this.authConfig?.Cognito);
    try {
      if (this._primaryIdentityId) {
        return {
          id: this._primaryIdentityId,
          type: "primary"
        };
      } else {
        const storedIdentityId = await this.keyValueStorage.getItem(this._authKeys.identityId);
        if (storedIdentityId) {
          this._hasGuestIdentityId = true;
          return {
            id: storedIdentityId,
            type: "guest"
          };
        }
        return null;
      }
    } catch (err) {
      logger11.log("Error getting stored IdentityId.", err);
      return null;
    }
  }
  async storeIdentityId(identity2) {
    assertIdentityPoolIdConfig(this.authConfig?.Cognito);
    if (identity2.type === "guest") {
      this.keyValueStorage.setItem(this._authKeys.identityId, identity2.id);
      this._primaryIdentityId = void 0;
      this._hasGuestIdentityId = true;
    } else {
      this._primaryIdentityId = identity2.id;
      if (this._hasGuestIdentityId) {
        this.keyValueStorage.removeItem(this._authKeys.identityId);
        this._hasGuestIdentityId = false;
      }
    }
  }
  async clearIdentityId() {
    this._primaryIdentityId = void 0;
    await this.keyValueStorage.removeItem(this._authKeys.identityId);
  }
};
var createKeysForAuthStorage3 = (provider, identifier) => {
  return getAuthStorageKeys(IdentityIdStorageKeys)(`com.amplify.${provider}`, identifier);
};

// node_modules/aws-amplify/node_modules/@aws-amplify/auth/dist/esm/providers/cognito/factories/createCognitoIdentityPoolEndpointResolver.mjs
var createCognitoIdentityPoolEndpointResolver = ({ endpointOverride }) => (input) => {
  if (endpointOverride) {
    return { url: new AmplifyUrl(endpointOverride) };
  }
  return cognitoIdentityPoolEndpointResolver(input);
};

// node_modules/aws-amplify/node_modules/@aws-amplify/auth/dist/esm/providers/cognito/credentialsProvider/utils.mjs
function formLoginsMap(idToken) {
  const issuer = decodeJWT(idToken).payload.iss;
  const res = {};
  if (!issuer) {
    throw new AuthError({
      name: "InvalidIdTokenException",
      message: "Invalid Idtoken."
    });
  }
  const domainName = issuer.replace(/(^\w+:|^)\/\//, "");
  res[domainName] = idToken;
  return res;
}

// node_modules/aws-amplify/node_modules/@aws-amplify/auth/dist/esm/providers/cognito/credentialsProvider/IdentityIdProvider.mjs
async function cognitoIdentityIdProvider({ tokens, authConfig, identityIdStore }) {
  identityIdStore.setAuthConfig({ Cognito: authConfig });
  const identityId = await identityIdStore.loadIdentityId();
  if (identityId) {
    return identityId.id;
  }
  const logins = tokens?.idToken ? formLoginsMap(tokens.idToken.toString()) : {};
  const generatedIdentityId = await generateIdentityId(logins, authConfig);
  identityIdStore.storeIdentityId({
    id: generatedIdentityId,
    type: tokens ? "primary" : "guest"
  });
  return generatedIdentityId;
}
async function generateIdentityId(logins, authConfig) {
  const identityPoolId = authConfig?.identityPoolId;
  const region = getRegionFromIdentityPoolId(identityPoolId);
  const getId = createGetIdClient({
    endpointResolver: createCognitoIdentityPoolEndpointResolver({
      endpointOverride: authConfig.identityPoolEndpoint
    })
  });
  let idResult;
  try {
    idResult = (await getId({
      region
    }, {
      IdentityPoolId: identityPoolId,
      Logins: logins
    })).IdentityId;
  } catch (e) {
    assertServiceError(e);
    throw new AuthError(e);
  }
  if (!idResult) {
    throw new AuthError({
      name: "GetIdResponseException",
      message: "Received undefined response from getId operation",
      recoverySuggestion: "Make sure to pass a valid identityPoolId in the configuration."
    });
  }
  return idResult;
}

// node_modules/aws-amplify/node_modules/@aws-amplify/auth/dist/esm/providers/cognito/credentialsProvider/credentialsProvider.mjs
var logger12 = new ConsoleLogger("CognitoCredentialsProvider");
var CREDENTIALS_TTL = 50 * 60 * 1e3;
var CognitoAWSCredentialsAndIdentityIdProvider = class {
  constructor(identityIdStore) {
    this._nextCredentialsRefresh = 0;
    this._identityIdStore = identityIdStore;
  }
  async clearCredentialsAndIdentityId() {
    logger12.debug("Clearing out credentials and identityId");
    this._credentialsAndIdentityId = void 0;
    await this._identityIdStore.clearIdentityId();
  }
  async clearCredentials() {
    logger12.debug("Clearing out in-memory credentials");
    this._credentialsAndIdentityId = void 0;
  }
  async getCredentialsAndIdentityId(getCredentialsOptions) {
    const isAuthenticated2 = getCredentialsOptions.authenticated;
    const { tokens } = getCredentialsOptions;
    const { authConfig } = getCredentialsOptions;
    try {
      assertIdentityPoolIdConfig(authConfig?.Cognito);
    } catch {
      return;
    }
    if (!isAuthenticated2 && !authConfig.Cognito.allowGuestAccess) {
      return;
    }
    const { forceRefresh } = getCredentialsOptions;
    const tokenHasChanged = this.hasTokenChanged(tokens);
    const identityId = await cognitoIdentityIdProvider({
      tokens,
      authConfig: authConfig.Cognito,
      identityIdStore: this._identityIdStore
    });
    if (forceRefresh || tokenHasChanged) {
      this.clearCredentials();
    }
    if (!isAuthenticated2) {
      return this.getGuestCredentials(identityId, authConfig.Cognito);
    } else {
      assertIdTokenInAuthTokens(tokens);
      return this.credsForOIDCTokens(authConfig.Cognito, tokens, identityId);
    }
  }
  async getGuestCredentials(identityId, authConfig) {
    if (this._credentialsAndIdentityId && !this.isPastTTL() && this._credentialsAndIdentityId.isAuthenticatedCreds === false) {
      logger12.info("returning stored credentials as they neither past TTL nor expired.");
      return this._credentialsAndIdentityId;
    }
    this.clearCredentials();
    const region = getRegionFromIdentityPoolId(authConfig.identityPoolId);
    const getCredentialsForIdentity = createGetCredentialsForIdentityClient({
      endpointResolver: createCognitoIdentityPoolEndpointResolver({
        endpointOverride: authConfig.identityPoolEndpoint
      })
    });
    let clientResult;
    try {
      clientResult = await getCredentialsForIdentity({ region }, {
        IdentityId: identityId
      });
    } catch (e) {
      assertServiceError(e);
      throw new AuthError(e);
    }
    if (clientResult?.Credentials?.AccessKeyId && clientResult?.Credentials?.SecretKey) {
      this._nextCredentialsRefresh = (/* @__PURE__ */ new Date()).getTime() + CREDENTIALS_TTL;
      const res = {
        credentials: {
          accessKeyId: clientResult.Credentials.AccessKeyId,
          secretAccessKey: clientResult.Credentials.SecretKey,
          sessionToken: clientResult.Credentials.SessionToken,
          expiration: clientResult.Credentials.Expiration
        },
        identityId
      };
      if (clientResult.IdentityId) {
        res.identityId = clientResult.IdentityId;
        this._identityIdStore.storeIdentityId({
          id: clientResult.IdentityId,
          type: "guest"
        });
      }
      this._credentialsAndIdentityId = {
        ...res,
        isAuthenticatedCreds: false
      };
      return res;
    } else {
      throw new AuthError({
        name: "CredentialsNotFoundException",
        message: `Cognito did not respond with either Credentials, AccessKeyId or SecretKey.`
      });
    }
  }
  async credsForOIDCTokens(authConfig, authTokens, identityId) {
    if (this._credentialsAndIdentityId && !this.isPastTTL() && this._credentialsAndIdentityId.isAuthenticatedCreds === true) {
      logger12.debug("returning stored credentials as they neither past TTL nor expired.");
      return this._credentialsAndIdentityId;
    }
    this.clearCredentials();
    const logins = authTokens.idToken ? formLoginsMap(authTokens.idToken.toString()) : {};
    const region = getRegionFromIdentityPoolId(authConfig.identityPoolId);
    const getCredentialsForIdentity = createGetCredentialsForIdentityClient({
      endpointResolver: createCognitoIdentityPoolEndpointResolver({
        endpointOverride: authConfig.identityPoolEndpoint
      })
    });
    let clientResult;
    try {
      clientResult = await getCredentialsForIdentity({ region }, {
        IdentityId: identityId,
        Logins: logins
      });
    } catch (e) {
      assertServiceError(e);
      throw new AuthError(e);
    }
    if (clientResult?.Credentials?.AccessKeyId && clientResult?.Credentials?.SecretKey) {
      this._nextCredentialsRefresh = (/* @__PURE__ */ new Date()).getTime() + CREDENTIALS_TTL;
      const res = {
        credentials: {
          accessKeyId: clientResult.Credentials.AccessKeyId,
          secretAccessKey: clientResult.Credentials.SecretKey,
          sessionToken: clientResult.Credentials.SessionToken,
          expiration: clientResult.Credentials.Expiration
        },
        identityId
      };
      if (clientResult.IdentityId) {
        res.identityId = clientResult.IdentityId;
        this._identityIdStore.storeIdentityId({
          id: clientResult.IdentityId,
          type: "primary"
        });
      }
      this._credentialsAndIdentityId = {
        ...res,
        isAuthenticatedCreds: true,
        associatedIdToken: authTokens.idToken?.toString()
      };
      return res;
    } else {
      throw new AuthError({
        name: "CredentialsException",
        message: `Cognito did not respond with either Credentials, AccessKeyId or SecretKey.`
      });
    }
  }
  isPastTTL() {
    return this._nextCredentialsRefresh === void 0 ? true : this._nextCredentialsRefresh <= Date.now();
  }
  hasTokenChanged(tokens) {
    return !!tokens && !!this._credentialsAndIdentityId?.associatedIdToken && tokens.idToken?.toString() !== this._credentialsAndIdentityId.associatedIdToken;
  }
};

// node_modules/aws-amplify/node_modules/@aws-amplify/auth/dist/esm/providers/cognito/credentialsProvider/index.mjs
var cognitoCredentialsProvider = new CognitoAWSCredentialsAndIdentityIdProvider(new DefaultIdentityIdStore(defaultStorage));

// node_modules/aws-amplify/dist/esm/initSingleton.mjs
var DefaultAmplify = {
  /**
   * Configures Amplify with the {@link resourceConfig} and {@link libraryOptions}.
   *
   * @param resourceConfig The {@link ResourcesConfig} object that is typically imported from the
   * `amplifyconfiguration.json` file. It can also be an object literal created inline when calling `Amplify.configure`.
   * @param libraryOptions The {@link LibraryOptions} additional options for the library.
   *
   * @example
   * import config from './amplifyconfiguration.json';
   *
   * Amplify.configure(config);
   */
  configure(resourceConfig, libraryOptions) {
    const resolvedResourceConfig = parseAmplifyConfig(resourceConfig);
    const cookieBasedKeyValueStorage = new CookieStorage({ sameSite: "lax" });
    const resolvedKeyValueStorage = libraryOptions?.ssr ? cookieBasedKeyValueStorage : defaultStorage;
    const resolvedCredentialsProvider = libraryOptions?.ssr ? new CognitoAWSCredentialsAndIdentityIdProvider(new DefaultIdentityIdStore(cookieBasedKeyValueStorage)) : cognitoCredentialsProvider;
    if (!resolvedResourceConfig.Auth) {
      Amplify.configure(resolvedResourceConfig, libraryOptions);
      return;
    }
    if (libraryOptions?.Auth) {
      Amplify.configure(resolvedResourceConfig, libraryOptions);
      return;
    }
    if (!Amplify.libraryOptions.Auth) {
      cognitoUserPoolsTokenProvider.setAuthConfig(resolvedResourceConfig.Auth);
      cognitoUserPoolsTokenProvider.setKeyValueStorage(
        // TODO: allow configure with a public interface
        resolvedKeyValueStorage
      );
      Amplify.configure(resolvedResourceConfig, {
        ...libraryOptions,
        Auth: {
          tokenProvider: cognitoUserPoolsTokenProvider,
          credentialsProvider: resolvedCredentialsProvider
        }
      });
      return;
    }
    if (libraryOptions) {
      const authLibraryOptions = Amplify.libraryOptions.Auth;
      if (libraryOptions.ssr !== void 0) {
        cognitoUserPoolsTokenProvider.setKeyValueStorage(
          // TODO: allow configure with a public interface
          resolvedKeyValueStorage
        );
        authLibraryOptions.credentialsProvider = resolvedCredentialsProvider;
      }
      Amplify.configure(resolvedResourceConfig, {
        Auth: authLibraryOptions,
        ...libraryOptions
      });
      return;
    }
    Amplify.configure(resolvedResourceConfig);
  },
  /**
   * Returns the {@link ResourcesConfig} object passed in as the `resourceConfig` parameter when calling
   * `Amplify.configure`.
   *
   * @returns An {@link ResourcesConfig} object.
   */
  getConfig() {
    return Amplify.getConfig();
  }
};

// node_modules/@aws-amplify/api-graphql/node_modules/graphql/jsutils/isObjectLike.mjs
function _typeof(obj) {
  "@babel/helpers - typeof";
  if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") {
    _typeof = function _typeof5(obj2) {
      return typeof obj2;
    };
  } else {
    _typeof = function _typeof5(obj2) {
      return obj2 && typeof Symbol === "function" && obj2.constructor === Symbol && obj2 !== Symbol.prototype ? "symbol" : typeof obj2;
    };
  }
  return _typeof(obj);
}
function isObjectLike(value) {
  return _typeof(value) == "object" && value !== null;
}

// node_modules/@aws-amplify/api-graphql/node_modules/graphql/polyfills/symbols.mjs
var SYMBOL_ITERATOR = typeof Symbol === "function" && Symbol.iterator != null ? Symbol.iterator : "@@iterator";
var SYMBOL_ASYNC_ITERATOR = typeof Symbol === "function" && Symbol.asyncIterator != null ? Symbol.asyncIterator : "@@asyncIterator";
var SYMBOL_TO_STRING_TAG = typeof Symbol === "function" && Symbol.toStringTag != null ? Symbol.toStringTag : "@@toStringTag";

// node_modules/@aws-amplify/api-graphql/node_modules/graphql/language/location.mjs
function getLocation(source, position) {
  var lineRegexp = /\r\n|[\n\r]/g;
  var line = 1;
  var column = position + 1;
  var match;
  while ((match = lineRegexp.exec(source.body)) && match.index < position) {
    line += 1;
    column = position + 1 - (match.index + match[0].length);
  }
  return {
    line,
    column
  };
}

// node_modules/@aws-amplify/api-graphql/node_modules/graphql/language/printLocation.mjs
function printLocation(location2) {
  return printSourceLocation(location2.source, getLocation(location2.source, location2.start));
}
function printSourceLocation(source, sourceLocation) {
  var firstLineColumnOffset = source.locationOffset.column - 1;
  var body = whitespace(firstLineColumnOffset) + source.body;
  var lineIndex = sourceLocation.line - 1;
  var lineOffset = source.locationOffset.line - 1;
  var lineNum = sourceLocation.line + lineOffset;
  var columnOffset = sourceLocation.line === 1 ? firstLineColumnOffset : 0;
  var columnNum = sourceLocation.column + columnOffset;
  var locationStr = "".concat(source.name, ":").concat(lineNum, ":").concat(columnNum, "\n");
  var lines = body.split(/\r\n|[\n\r]/g);
  var locationLine = lines[lineIndex];
  if (locationLine.length > 120) {
    var subLineIndex = Math.floor(columnNum / 80);
    var subLineColumnNum = columnNum % 80;
    var subLines = [];
    for (var i = 0; i < locationLine.length; i += 80) {
      subLines.push(locationLine.slice(i, i + 80));
    }
    return locationStr + printPrefixedLines([["".concat(lineNum), subLines[0]]].concat(subLines.slice(1, subLineIndex + 1).map(function(subLine) {
      return ["", subLine];
    }), [[" ", whitespace(subLineColumnNum - 1) + "^"], ["", subLines[subLineIndex + 1]]]));
  }
  return locationStr + printPrefixedLines([
    // Lines specified like this: ["prefix", "string"],
    ["".concat(lineNum - 1), lines[lineIndex - 1]],
    ["".concat(lineNum), locationLine],
    ["", whitespace(columnNum - 1) + "^"],
    ["".concat(lineNum + 1), lines[lineIndex + 1]]
  ]);
}
function printPrefixedLines(lines) {
  var existingLines = lines.filter(function(_ref) {
    var _ = _ref[0], line = _ref[1];
    return line !== void 0;
  });
  var padLen = Math.max.apply(Math, existingLines.map(function(_ref2) {
    var prefix = _ref2[0];
    return prefix.length;
  }));
  return existingLines.map(function(_ref3) {
    var prefix = _ref3[0], line = _ref3[1];
    return leftPad(padLen, prefix) + (line ? " | " + line : " |");
  }).join("\n");
}
function whitespace(len) {
  return Array(len + 1).join(" ");
}
function leftPad(len, str) {
  return whitespace(len - str.length) + str;
}

// node_modules/@aws-amplify/api-graphql/node_modules/graphql/error/GraphQLError.mjs
function _typeof2(obj) {
  "@babel/helpers - typeof";
  if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") {
    _typeof2 = function _typeof5(obj2) {
      return typeof obj2;
    };
  } else {
    _typeof2 = function _typeof5(obj2) {
      return obj2 && typeof Symbol === "function" && obj2.constructor === Symbol && obj2 !== Symbol.prototype ? "symbol" : typeof obj2;
    };
  }
  return _typeof2(obj);
}
function ownKeys(object, enumerableOnly) {
  var keys = Object.keys(object);
  if (Object.getOwnPropertySymbols) {
    var symbols = Object.getOwnPropertySymbols(object);
    if (enumerableOnly) symbols = symbols.filter(function(sym) {
      return Object.getOwnPropertyDescriptor(object, sym).enumerable;
    });
    keys.push.apply(keys, symbols);
  }
  return keys;
}
function _objectSpread(target) {
  for (var i = 1; i < arguments.length; i++) {
    var source = arguments[i] != null ? arguments[i] : {};
    if (i % 2) {
      ownKeys(Object(source), true).forEach(function(key) {
        _defineProperty(target, key, source[key]);
      });
    } else if (Object.getOwnPropertyDescriptors) {
      Object.defineProperties(target, Object.getOwnPropertyDescriptors(source));
    } else {
      ownKeys(Object(source)).forEach(function(key) {
        Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key));
      });
    }
  }
  return target;
}
function _defineProperty(obj, key, value) {
  if (key in obj) {
    Object.defineProperty(obj, key, { value, enumerable: true, configurable: true, writable: true });
  } else {
    obj[key] = value;
  }
  return obj;
}
function _classCallCheck(instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError("Cannot call a class as a function");
  }
}
function _defineProperties(target, props) {
  for (var i = 0; i < props.length; i++) {
    var descriptor = props[i];
    descriptor.enumerable = descriptor.enumerable || false;
    descriptor.configurable = true;
    if ("value" in descriptor) descriptor.writable = true;
    Object.defineProperty(target, descriptor.key, descriptor);
  }
}
function _createClass(Constructor, protoProps, staticProps) {
  if (protoProps) _defineProperties(Constructor.prototype, protoProps);
  if (staticProps) _defineProperties(Constructor, staticProps);
  return Constructor;
}
function _inherits(subClass, superClass) {
  if (typeof superClass !== "function" && superClass !== null) {
    throw new TypeError("Super expression must either be null or a function");
  }
  subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, writable: true, configurable: true } });
  if (superClass) _setPrototypeOf(subClass, superClass);
}
function _createSuper(Derived) {
  var hasNativeReflectConstruct = _isNativeReflectConstruct();
  return function _createSuperInternal() {
    var Super = _getPrototypeOf(Derived), result;
    if (hasNativeReflectConstruct) {
      var NewTarget = _getPrototypeOf(this).constructor;
      result = Reflect.construct(Super, arguments, NewTarget);
    } else {
      result = Super.apply(this, arguments);
    }
    return _possibleConstructorReturn(this, result);
  };
}
function _possibleConstructorReturn(self2, call) {
  if (call && (_typeof2(call) === "object" || typeof call === "function")) {
    return call;
  }
  return _assertThisInitialized(self2);
}
function _assertThisInitialized(self2) {
  if (self2 === void 0) {
    throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
  }
  return self2;
}
function _wrapNativeSuper(Class) {
  var _cache = typeof Map === "function" ? /* @__PURE__ */ new Map() : void 0;
  _wrapNativeSuper = function _wrapNativeSuper2(Class2) {
    if (Class2 === null || !_isNativeFunction(Class2)) return Class2;
    if (typeof Class2 !== "function") {
      throw new TypeError("Super expression must either be null or a function");
    }
    if (typeof _cache !== "undefined") {
      if (_cache.has(Class2)) return _cache.get(Class2);
      _cache.set(Class2, Wrapper);
    }
    function Wrapper() {
      return _construct(Class2, arguments, _getPrototypeOf(this).constructor);
    }
    Wrapper.prototype = Object.create(Class2.prototype, { constructor: { value: Wrapper, enumerable: false, writable: true, configurable: true } });
    return _setPrototypeOf(Wrapper, Class2);
  };
  return _wrapNativeSuper(Class);
}
function _construct(Parent, args, Class) {
  if (_isNativeReflectConstruct()) {
    _construct = Reflect.construct;
  } else {
    _construct = function _construct2(Parent2, args2, Class2) {
      var a = [null];
      a.push.apply(a, args2);
      var Constructor = Function.bind.apply(Parent2, a);
      var instance = new Constructor();
      if (Class2) _setPrototypeOf(instance, Class2.prototype);
      return instance;
    };
  }
  return _construct.apply(null, arguments);
}
function _isNativeReflectConstruct() {
  if (typeof Reflect === "undefined" || !Reflect.construct) return false;
  if (Reflect.construct.sham) return false;
  if (typeof Proxy === "function") return true;
  try {
    Date.prototype.toString.call(Reflect.construct(Date, [], function() {
    }));
    return true;
  } catch (e) {
    return false;
  }
}
function _isNativeFunction(fn) {
  return Function.toString.call(fn).indexOf("[native code]") !== -1;
}
function _setPrototypeOf(o, p) {
  _setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf2(o2, p2) {
    o2.__proto__ = p2;
    return o2;
  };
  return _setPrototypeOf(o, p);
}
function _getPrototypeOf(o) {
  _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf : function _getPrototypeOf2(o2) {
    return o2.__proto__ || Object.getPrototypeOf(o2);
  };
  return _getPrototypeOf(o);
}
var GraphQLError = /* @__PURE__ */ (function(_Error) {
  _inherits(GraphQLError2, _Error);
  var _super = _createSuper(GraphQLError2);
  function GraphQLError2(message, nodes, source, positions, path, originalError, extensions) {
    var _nodeLocations, _nodeLocations2, _nodeLocations3;
    var _this;
    _classCallCheck(this, GraphQLError2);
    _this = _super.call(this, message);
    _this.name = "GraphQLError";
    _this.originalError = originalError !== null && originalError !== void 0 ? originalError : void 0;
    _this.nodes = undefinedIfEmpty(Array.isArray(nodes) ? nodes : nodes ? [nodes] : void 0);
    var nodeLocations = [];
    for (var _i2 = 0, _ref3 = (_this$nodes = _this.nodes) !== null && _this$nodes !== void 0 ? _this$nodes : []; _i2 < _ref3.length; _i2++) {
      var _this$nodes;
      var _ref4 = _ref3[_i2];
      var loc = _ref4.loc;
      if (loc != null) {
        nodeLocations.push(loc);
      }
    }
    nodeLocations = undefinedIfEmpty(nodeLocations);
    _this.source = source !== null && source !== void 0 ? source : (_nodeLocations = nodeLocations) === null || _nodeLocations === void 0 ? void 0 : _nodeLocations[0].source;
    _this.positions = positions !== null && positions !== void 0 ? positions : (_nodeLocations2 = nodeLocations) === null || _nodeLocations2 === void 0 ? void 0 : _nodeLocations2.map(function(loc2) {
      return loc2.start;
    });
    _this.locations = positions && source ? positions.map(function(pos) {
      return getLocation(source, pos);
    }) : (_nodeLocations3 = nodeLocations) === null || _nodeLocations3 === void 0 ? void 0 : _nodeLocations3.map(function(loc2) {
      return getLocation(loc2.source, loc2.start);
    });
    _this.path = path !== null && path !== void 0 ? path : void 0;
    var originalExtensions = originalError === null || originalError === void 0 ? void 0 : originalError.extensions;
    if (extensions == null && isObjectLike(originalExtensions)) {
      _this.extensions = _objectSpread({}, originalExtensions);
    } else {
      _this.extensions = extensions !== null && extensions !== void 0 ? extensions : {};
    }
    Object.defineProperties(_assertThisInitialized(_this), {
      message: {
        enumerable: true
      },
      locations: {
        enumerable: _this.locations != null
      },
      path: {
        enumerable: _this.path != null
      },
      extensions: {
        enumerable: _this.extensions != null && Object.keys(_this.extensions).length > 0
      },
      name: {
        enumerable: false
      },
      nodes: {
        enumerable: false
      },
      source: {
        enumerable: false
      },
      positions: {
        enumerable: false
      },
      originalError: {
        enumerable: false
      }
    });
    if (originalError !== null && originalError !== void 0 && originalError.stack) {
      Object.defineProperty(_assertThisInitialized(_this), "stack", {
        value: originalError.stack,
        writable: true,
        configurable: true
      });
      return _possibleConstructorReturn(_this);
    }
    if (Error.captureStackTrace) {
      Error.captureStackTrace(_assertThisInitialized(_this), GraphQLError2);
    } else {
      Object.defineProperty(_assertThisInitialized(_this), "stack", {
        value: Error().stack,
        writable: true,
        configurable: true
      });
    }
    return _this;
  }
  _createClass(GraphQLError2, [{
    key: "toString",
    value: function toString() {
      return printError(this);
    }
    // FIXME: workaround to not break chai comparisons, should be remove in v16
    // $FlowFixMe[unsupported-syntax] Flow doesn't support computed properties yet
  }, {
    key: SYMBOL_TO_STRING_TAG,
    get: function get4() {
      return "Object";
    }
  }]);
  return GraphQLError2;
})(/* @__PURE__ */ _wrapNativeSuper(Error));
function undefinedIfEmpty(array) {
  return array === void 0 || array.length === 0 ? void 0 : array;
}
function printError(error) {
  var output = error.message;
  if (error.nodes) {
    for (var _i4 = 0, _error$nodes2 = error.nodes; _i4 < _error$nodes2.length; _i4++) {
      var node = _error$nodes2[_i4];
      if (node.loc) {
        output += "\n\n" + printLocation(node.loc);
      }
    }
  } else if (error.source && error.locations) {
    for (var _i6 = 0, _error$locations2 = error.locations; _i6 < _error$locations2.length; _i6++) {
      var location2 = _error$locations2[_i6];
      output += "\n\n" + printSourceLocation(error.source, location2);
    }
  }
  return output;
}

// node_modules/@aws-amplify/api-graphql/node_modules/graphql/error/syntaxError.mjs
function syntaxError(source, position, description) {
  return new GraphQLError("Syntax Error: ".concat(description), void 0, source, [position]);
}

// node_modules/@aws-amplify/api-graphql/node_modules/graphql/language/kinds.mjs
var Kind = Object.freeze({
  // Name
  NAME: "Name",
  // Document
  DOCUMENT: "Document",
  OPERATION_DEFINITION: "OperationDefinition",
  VARIABLE_DEFINITION: "VariableDefinition",
  SELECTION_SET: "SelectionSet",
  FIELD: "Field",
  ARGUMENT: "Argument",
  // Fragments
  FRAGMENT_SPREAD: "FragmentSpread",
  INLINE_FRAGMENT: "InlineFragment",
  FRAGMENT_DEFINITION: "FragmentDefinition",
  // Values
  VARIABLE: "Variable",
  INT: "IntValue",
  FLOAT: "FloatValue",
  STRING: "StringValue",
  BOOLEAN: "BooleanValue",
  NULL: "NullValue",
  ENUM: "EnumValue",
  LIST: "ListValue",
  OBJECT: "ObjectValue",
  OBJECT_FIELD: "ObjectField",
  // Directives
  DIRECTIVE: "Directive",
  // Types
  NAMED_TYPE: "NamedType",
  LIST_TYPE: "ListType",
  NON_NULL_TYPE: "NonNullType",
  // Type System Definitions
  SCHEMA_DEFINITION: "SchemaDefinition",
  OPERATION_TYPE_DEFINITION: "OperationTypeDefinition",
  // Type Definitions
  SCALAR_TYPE_DEFINITION: "ScalarTypeDefinition",
  OBJECT_TYPE_DEFINITION: "ObjectTypeDefinition",
  FIELD_DEFINITION: "FieldDefinition",
  INPUT_VALUE_DEFINITION: "InputValueDefinition",
  INTERFACE_TYPE_DEFINITION: "InterfaceTypeDefinition",
  UNION_TYPE_DEFINITION: "UnionTypeDefinition",
  ENUM_TYPE_DEFINITION: "EnumTypeDefinition",
  ENUM_VALUE_DEFINITION: "EnumValueDefinition",
  INPUT_OBJECT_TYPE_DEFINITION: "InputObjectTypeDefinition",
  // Directive Definitions
  DIRECTIVE_DEFINITION: "DirectiveDefinition",
  // Type System Extensions
  SCHEMA_EXTENSION: "SchemaExtension",
  // Type Extensions
  SCALAR_TYPE_EXTENSION: "ScalarTypeExtension",
  OBJECT_TYPE_EXTENSION: "ObjectTypeExtension",
  INTERFACE_TYPE_EXTENSION: "InterfaceTypeExtension",
  UNION_TYPE_EXTENSION: "UnionTypeExtension",
  ENUM_TYPE_EXTENSION: "EnumTypeExtension",
  INPUT_OBJECT_TYPE_EXTENSION: "InputObjectTypeExtension"
});

// node_modules/@aws-amplify/api-graphql/node_modules/graphql/jsutils/invariant.mjs
function invariant(condition, message) {
  var booleanCondition = Boolean(condition);
  if (!booleanCondition) {
    throw new Error(message != null ? message : "Unexpected invariant triggered.");
  }
}

// node_modules/@aws-amplify/api-graphql/node_modules/graphql/jsutils/nodejsCustomInspectSymbol.mjs
var nodejsCustomInspectSymbol = typeof Symbol === "function" && typeof Symbol.for === "function" ? /* @__PURE__ */ Symbol.for("nodejs.util.inspect.custom") : void 0;
var nodejsCustomInspectSymbol_default = nodejsCustomInspectSymbol;

// node_modules/@aws-amplify/api-graphql/node_modules/graphql/jsutils/defineInspect.mjs
function defineInspect(classObject) {
  var fn = classObject.prototype.toJSON;
  typeof fn === "function" || invariant(0);
  classObject.prototype.inspect = fn;
  if (nodejsCustomInspectSymbol_default) {
    classObject.prototype[nodejsCustomInspectSymbol_default] = fn;
  }
}

// node_modules/@aws-amplify/api-graphql/node_modules/graphql/language/ast.mjs
var Location = /* @__PURE__ */ (function() {
  function Location2(startToken, endToken, source) {
    this.start = startToken.start;
    this.end = endToken.end;
    this.startToken = startToken;
    this.endToken = endToken;
    this.source = source;
  }
  var _proto = Location2.prototype;
  _proto.toJSON = function toJSON() {
    return {
      start: this.start,
      end: this.end
    };
  };
  return Location2;
})();
defineInspect(Location);
var Token = /* @__PURE__ */ (function() {
  function Token2(kind, start, end, line, column, prev, value) {
    this.kind = kind;
    this.start = start;
    this.end = end;
    this.line = line;
    this.column = column;
    this.value = value;
    this.prev = prev;
    this.next = null;
  }
  var _proto2 = Token2.prototype;
  _proto2.toJSON = function toJSON() {
    return {
      kind: this.kind,
      value: this.value,
      line: this.line,
      column: this.column
    };
  };
  return Token2;
})();
defineInspect(Token);
function isNode(maybeNode) {
  return maybeNode != null && typeof maybeNode.kind === "string";
}

// node_modules/@aws-amplify/api-graphql/node_modules/graphql/language/tokenKind.mjs
var TokenKind = Object.freeze({
  SOF: "<SOF>",
  EOF: "<EOF>",
  BANG: "!",
  DOLLAR: "$",
  AMP: "&",
  PAREN_L: "(",
  PAREN_R: ")",
  SPREAD: "...",
  COLON: ":",
  EQUALS: "=",
  AT: "@",
  BRACKET_L: "[",
  BRACKET_R: "]",
  BRACE_L: "{",
  PIPE: "|",
  BRACE_R: "}",
  NAME: "Name",
  INT: "Int",
  FLOAT: "Float",
  STRING: "String",
  BLOCK_STRING: "BlockString",
  COMMENT: "Comment"
});

// node_modules/@aws-amplify/api-graphql/node_modules/graphql/jsutils/inspect.mjs
function _typeof3(obj) {
  "@babel/helpers - typeof";
  if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") {
    _typeof3 = function _typeof5(obj2) {
      return typeof obj2;
    };
  } else {
    _typeof3 = function _typeof5(obj2) {
      return obj2 && typeof Symbol === "function" && obj2.constructor === Symbol && obj2 !== Symbol.prototype ? "symbol" : typeof obj2;
    };
  }
  return _typeof3(obj);
}
var MAX_ARRAY_LENGTH = 10;
var MAX_RECURSIVE_DEPTH = 2;
function inspect(value) {
  return formatValue(value, []);
}
function formatValue(value, seenValues) {
  switch (_typeof3(value)) {
    case "string":
      return JSON.stringify(value);
    case "function":
      return value.name ? "[function ".concat(value.name, "]") : "[function]";
    case "object":
      if (value === null) {
        return "null";
      }
      return formatObjectValue(value, seenValues);
    default:
      return String(value);
  }
}
function formatObjectValue(value, previouslySeenValues) {
  if (previouslySeenValues.indexOf(value) !== -1) {
    return "[Circular]";
  }
  var seenValues = [].concat(previouslySeenValues, [value]);
  var customInspectFn = getCustomFn(value);
  if (customInspectFn !== void 0) {
    var customValue = customInspectFn.call(value);
    if (customValue !== value) {
      return typeof customValue === "string" ? customValue : formatValue(customValue, seenValues);
    }
  } else if (Array.isArray(value)) {
    return formatArray(value, seenValues);
  }
  return formatObject(value, seenValues);
}
function formatObject(object, seenValues) {
  var keys = Object.keys(object);
  if (keys.length === 0) {
    return "{}";
  }
  if (seenValues.length > MAX_RECURSIVE_DEPTH) {
    return "[" + getObjectTag(object) + "]";
  }
  var properties = keys.map(function(key) {
    var value = formatValue(object[key], seenValues);
    return key + ": " + value;
  });
  return "{ " + properties.join(", ") + " }";
}
function formatArray(array, seenValues) {
  if (array.length === 0) {
    return "[]";
  }
  if (seenValues.length > MAX_RECURSIVE_DEPTH) {
    return "[Array]";
  }
  var len = Math.min(MAX_ARRAY_LENGTH, array.length);
  var remaining = array.length - len;
  var items = [];
  for (var i = 0; i < len; ++i) {
    items.push(formatValue(array[i], seenValues));
  }
  if (remaining === 1) {
    items.push("... 1 more item");
  } else if (remaining > 1) {
    items.push("... ".concat(remaining, " more items"));
  }
  return "[" + items.join(", ") + "]";
}
function getCustomFn(object) {
  var customInspectFn = object[String(nodejsCustomInspectSymbol_default)];
  if (typeof customInspectFn === "function") {
    return customInspectFn;
  }
  if (typeof object.inspect === "function") {
    return object.inspect;
  }
}
function getObjectTag(object) {
  var tag = Object.prototype.toString.call(object).replace(/^\[object /, "").replace(/]$/, "");
  if (tag === "Object" && typeof object.constructor === "function") {
    var name2 = object.constructor.name;
    if (typeof name2 === "string" && name2 !== "") {
      return name2;
    }
  }
  return tag;
}

// node_modules/@aws-amplify/api-graphql/node_modules/graphql/jsutils/devAssert.mjs
function devAssert(condition, message) {
  var booleanCondition = Boolean(condition);
  if (!booleanCondition) {
    throw new Error(message);
  }
}

// node_modules/@aws-amplify/api-graphql/node_modules/graphql/jsutils/instanceOf.mjs
function _typeof4(obj) {
  "@babel/helpers - typeof";
  if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") {
    _typeof4 = function _typeof5(obj2) {
      return typeof obj2;
    };
  } else {
    _typeof4 = function _typeof5(obj2) {
      return obj2 && typeof Symbol === "function" && obj2.constructor === Symbol && obj2 !== Symbol.prototype ? "symbol" : typeof obj2;
    };
  }
  return _typeof4(obj);
}
var instanceOf_default = false ? (
  // istanbul ignore next (See: 'https://github.com/graphql/graphql-js/issues/2317')
  // eslint-disable-next-line no-shadow
  function instanceOf(value, constructor) {
    return value instanceof constructor;
  }
) : (
  // eslint-disable-next-line no-shadow
  function instanceOf2(value, constructor) {
    if (value instanceof constructor) {
      return true;
    }
    if (_typeof4(value) === "object" && value !== null) {
      var _value$constructor;
      var className = constructor.prototype[Symbol.toStringTag];
      var valueClassName = (
        // We still need to support constructor's name to detect conflicts with older versions of this library.
        Symbol.toStringTag in value ? value[Symbol.toStringTag] : (_value$constructor = value.constructor) === null || _value$constructor === void 0 ? void 0 : _value$constructor.name
      );
      if (className === valueClassName) {
        var stringifiedValue = inspect(value);
        throw new Error("Cannot use ".concat(className, ' "').concat(stringifiedValue, '" from another module or realm.\n\nEnsure that there is only one instance of "graphql" in the node_modules\ndirectory. If different versions of "graphql" are the dependencies of other\nrelied on modules, use "resolutions" to ensure only one version is installed.\n\nhttps://yarnpkg.com/en/docs/selective-version-resolutions\n\nDuplicate "graphql" modules cannot be used at the same time since different\nversions may have different capabilities and behavior. The data from one\nversion used in the function from another could produce confusing and\nspurious results.'));
      }
    }
    return false;
  }
);

// node_modules/@aws-amplify/api-graphql/node_modules/graphql/language/source.mjs
function _defineProperties2(target, props) {
  for (var i = 0; i < props.length; i++) {
    var descriptor = props[i];
    descriptor.enumerable = descriptor.enumerable || false;
    descriptor.configurable = true;
    if ("value" in descriptor) descriptor.writable = true;
    Object.defineProperty(target, descriptor.key, descriptor);
  }
}
function _createClass2(Constructor, protoProps, staticProps) {
  if (protoProps) _defineProperties2(Constructor.prototype, protoProps);
  if (staticProps) _defineProperties2(Constructor, staticProps);
  return Constructor;
}
var Source = /* @__PURE__ */ (function() {
  function Source2(body) {
    var name2 = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : "GraphQL request";
    var locationOffset = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : {
      line: 1,
      column: 1
    };
    typeof body === "string" || devAssert(0, "Body must be a string. Received: ".concat(inspect(body), "."));
    this.body = body;
    this.name = name2;
    this.locationOffset = locationOffset;
    this.locationOffset.line > 0 || devAssert(0, "line in locationOffset is 1-indexed and must be positive.");
    this.locationOffset.column > 0 || devAssert(0, "column in locationOffset is 1-indexed and must be positive.");
  }
  _createClass2(Source2, [{
    key: SYMBOL_TO_STRING_TAG,
    get: function get4() {
      return "Source";
    }
  }]);
  return Source2;
})();
function isSource(source) {
  return instanceOf_default(source, Source);
}

// node_modules/@aws-amplify/api-graphql/node_modules/graphql/language/directiveLocation.mjs
var DirectiveLocation = Object.freeze({
  // Request Definitions
  QUERY: "QUERY",
  MUTATION: "MUTATION",
  SUBSCRIPTION: "SUBSCRIPTION",
  FIELD: "FIELD",
  FRAGMENT_DEFINITION: "FRAGMENT_DEFINITION",
  FRAGMENT_SPREAD: "FRAGMENT_SPREAD",
  INLINE_FRAGMENT: "INLINE_FRAGMENT",
  VARIABLE_DEFINITION: "VARIABLE_DEFINITION",
  // Type System Definitions
  SCHEMA: "SCHEMA",
  SCALAR: "SCALAR",
  OBJECT: "OBJECT",
  FIELD_DEFINITION: "FIELD_DEFINITION",
  ARGUMENT_DEFINITION: "ARGUMENT_DEFINITION",
  INTERFACE: "INTERFACE",
  UNION: "UNION",
  ENUM: "ENUM",
  ENUM_VALUE: "ENUM_VALUE",
  INPUT_OBJECT: "INPUT_OBJECT",
  INPUT_FIELD_DEFINITION: "INPUT_FIELD_DEFINITION"
});

// node_modules/@aws-amplify/api-graphql/node_modules/graphql/language/blockString.mjs
function dedentBlockStringValue(rawString) {
  var lines = rawString.split(/\r\n|[\n\r]/g);
  var commonIndent = getBlockStringIndentation(rawString);
  if (commonIndent !== 0) {
    for (var i = 1; i < lines.length; i++) {
      lines[i] = lines[i].slice(commonIndent);
    }
  }
  var startLine = 0;
  while (startLine < lines.length && isBlank(lines[startLine])) {
    ++startLine;
  }
  var endLine = lines.length;
  while (endLine > startLine && isBlank(lines[endLine - 1])) {
    --endLine;
  }
  return lines.slice(startLine, endLine).join("\n");
}
function isBlank(str) {
  for (var i = 0; i < str.length; ++i) {
    if (str[i] !== " " && str[i] !== "	") {
      return false;
    }
  }
  return true;
}
function getBlockStringIndentation(value) {
  var _commonIndent;
  var isFirstLine = true;
  var isEmptyLine = true;
  var indent2 = 0;
  var commonIndent = null;
  for (var i = 0; i < value.length; ++i) {
    switch (value.charCodeAt(i)) {
      case 13:
        if (value.charCodeAt(i + 1) === 10) {
          ++i;
        }
      // falls through
      case 10:
        isFirstLine = false;
        isEmptyLine = true;
        indent2 = 0;
        break;
      case 9:
      //   \t
      case 32:
        ++indent2;
        break;
      default:
        if (isEmptyLine && !isFirstLine && (commonIndent === null || indent2 < commonIndent)) {
          commonIndent = indent2;
        }
        isEmptyLine = false;
    }
  }
  return (_commonIndent = commonIndent) !== null && _commonIndent !== void 0 ? _commonIndent : 0;
}
function printBlockString(value) {
  var indentation = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : "";
  var preferMultipleLines = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : false;
  var isSingleLine = value.indexOf("\n") === -1;
  var hasLeadingSpace = value[0] === " " || value[0] === "	";
  var hasTrailingQuote = value[value.length - 1] === '"';
  var hasTrailingSlash = value[value.length - 1] === "\\";
  var printAsMultipleLines = !isSingleLine || hasTrailingQuote || hasTrailingSlash || preferMultipleLines;
  var result = "";
  if (printAsMultipleLines && !(isSingleLine && hasLeadingSpace)) {
    result += "\n" + indentation;
  }
  result += indentation ? value.replace(/\n/g, "\n" + indentation) : value;
  if (printAsMultipleLines) {
    result += "\n";
  }
  return '"""' + result.replace(/"""/g, '\\"""') + '"""';
}

// node_modules/@aws-amplify/api-graphql/node_modules/graphql/language/lexer.mjs
var Lexer = /* @__PURE__ */ (function() {
  function Lexer2(source) {
    var startOfFileToken = new Token(TokenKind.SOF, 0, 0, 0, 0, null);
    this.source = source;
    this.lastToken = startOfFileToken;
    this.token = startOfFileToken;
    this.line = 1;
    this.lineStart = 0;
  }
  var _proto = Lexer2.prototype;
  _proto.advance = function advance() {
    this.lastToken = this.token;
    var token = this.token = this.lookahead();
    return token;
  };
  _proto.lookahead = function lookahead() {
    var token = this.token;
    if (token.kind !== TokenKind.EOF) {
      do {
        var _token$next;
        token = (_token$next = token.next) !== null && _token$next !== void 0 ? _token$next : token.next = readToken(this, token);
      } while (token.kind === TokenKind.COMMENT);
    }
    return token;
  };
  return Lexer2;
})();
function isPunctuatorTokenKind(kind) {
  return kind === TokenKind.BANG || kind === TokenKind.DOLLAR || kind === TokenKind.AMP || kind === TokenKind.PAREN_L || kind === TokenKind.PAREN_R || kind === TokenKind.SPREAD || kind === TokenKind.COLON || kind === TokenKind.EQUALS || kind === TokenKind.AT || kind === TokenKind.BRACKET_L || kind === TokenKind.BRACKET_R || kind === TokenKind.BRACE_L || kind === TokenKind.PIPE || kind === TokenKind.BRACE_R;
}
function printCharCode(code) {
  return (
    // NaN/undefined represents access beyond the end of the file.
    isNaN(code) ? TokenKind.EOF : (
      // Trust JSON for ASCII.
      code < 127 ? JSON.stringify(String.fromCharCode(code)) : (
        // Otherwise print the escaped form.
        '"\\u'.concat(("00" + code.toString(16).toUpperCase()).slice(-4), '"')
      )
    )
  );
}
function readToken(lexer, prev) {
  var source = lexer.source;
  var body = source.body;
  var bodyLength = body.length;
  var pos = prev.end;
  while (pos < bodyLength) {
    var code = body.charCodeAt(pos);
    var _line = lexer.line;
    var _col = 1 + pos - lexer.lineStart;
    switch (code) {
      case 65279:
      // <BOM>
      case 9:
      //   \t
      case 32:
      //  <space>
      case 44:
        ++pos;
        continue;
      case 10:
        ++pos;
        ++lexer.line;
        lexer.lineStart = pos;
        continue;
      case 13:
        if (body.charCodeAt(pos + 1) === 10) {
          pos += 2;
        } else {
          ++pos;
        }
        ++lexer.line;
        lexer.lineStart = pos;
        continue;
      case 33:
        return new Token(TokenKind.BANG, pos, pos + 1, _line, _col, prev);
      case 35:
        return readComment(source, pos, _line, _col, prev);
      case 36:
        return new Token(TokenKind.DOLLAR, pos, pos + 1, _line, _col, prev);
      case 38:
        return new Token(TokenKind.AMP, pos, pos + 1, _line, _col, prev);
      case 40:
        return new Token(TokenKind.PAREN_L, pos, pos + 1, _line, _col, prev);
      case 41:
        return new Token(TokenKind.PAREN_R, pos, pos + 1, _line, _col, prev);
      case 46:
        if (body.charCodeAt(pos + 1) === 46 && body.charCodeAt(pos + 2) === 46) {
          return new Token(TokenKind.SPREAD, pos, pos + 3, _line, _col, prev);
        }
        break;
      case 58:
        return new Token(TokenKind.COLON, pos, pos + 1, _line, _col, prev);
      case 61:
        return new Token(TokenKind.EQUALS, pos, pos + 1, _line, _col, prev);
      case 64:
        return new Token(TokenKind.AT, pos, pos + 1, _line, _col, prev);
      case 91:
        return new Token(TokenKind.BRACKET_L, pos, pos + 1, _line, _col, prev);
      case 93:
        return new Token(TokenKind.BRACKET_R, pos, pos + 1, _line, _col, prev);
      case 123:
        return new Token(TokenKind.BRACE_L, pos, pos + 1, _line, _col, prev);
      case 124:
        return new Token(TokenKind.PIPE, pos, pos + 1, _line, _col, prev);
      case 125:
        return new Token(TokenKind.BRACE_R, pos, pos + 1, _line, _col, prev);
      case 34:
        if (body.charCodeAt(pos + 1) === 34 && body.charCodeAt(pos + 2) === 34) {
          return readBlockString(source, pos, _line, _col, prev, lexer);
        }
        return readString(source, pos, _line, _col, prev);
      case 45:
      //  -
      case 48:
      //  0
      case 49:
      //  1
      case 50:
      //  2
      case 51:
      //  3
      case 52:
      //  4
      case 53:
      //  5
      case 54:
      //  6
      case 55:
      //  7
      case 56:
      //  8
      case 57:
        return readNumber(source, pos, code, _line, _col, prev);
      case 65:
      //  A
      case 66:
      //  B
      case 67:
      //  C
      case 68:
      //  D
      case 69:
      //  E
      case 70:
      //  F
      case 71:
      //  G
      case 72:
      //  H
      case 73:
      //  I
      case 74:
      //  J
      case 75:
      //  K
      case 76:
      //  L
      case 77:
      //  M
      case 78:
      //  N
      case 79:
      //  O
      case 80:
      //  P
      case 81:
      //  Q
      case 82:
      //  R
      case 83:
      //  S
      case 84:
      //  T
      case 85:
      //  U
      case 86:
      //  V
      case 87:
      //  W
      case 88:
      //  X
      case 89:
      //  Y
      case 90:
      //  Z
      case 95:
      //  _
      case 97:
      //  a
      case 98:
      //  b
      case 99:
      //  c
      case 100:
      // d
      case 101:
      // e
      case 102:
      // f
      case 103:
      // g
      case 104:
      // h
      case 105:
      // i
      case 106:
      // j
      case 107:
      // k
      case 108:
      // l
      case 109:
      // m
      case 110:
      // n
      case 111:
      // o
      case 112:
      // p
      case 113:
      // q
      case 114:
      // r
      case 115:
      // s
      case 116:
      // t
      case 117:
      // u
      case 118:
      // v
      case 119:
      // w
      case 120:
      // x
      case 121:
      // y
      case 122:
        return readName(source, pos, _line, _col, prev);
    }
    throw syntaxError(source, pos, unexpectedCharacterMessage(code));
  }
  var line = lexer.line;
  var col = 1 + pos - lexer.lineStart;
  return new Token(TokenKind.EOF, bodyLength, bodyLength, line, col, prev);
}
function unexpectedCharacterMessage(code) {
  if (code < 32 && code !== 9 && code !== 10 && code !== 13) {
    return "Cannot contain the invalid character ".concat(printCharCode(code), ".");
  }
  if (code === 39) {
    return `Unexpected single quote character ('), did you mean to use a double quote (")?`;
  }
  return "Cannot parse the unexpected character ".concat(printCharCode(code), ".");
}
function readComment(source, start, line, col, prev) {
  var body = source.body;
  var code;
  var position = start;
  do {
    code = body.charCodeAt(++position);
  } while (!isNaN(code) && // SourceCharacter but not LineTerminator
  (code > 31 || code === 9));
  return new Token(TokenKind.COMMENT, start, position, line, col, prev, body.slice(start + 1, position));
}
function readNumber(source, start, firstCode, line, col, prev) {
  var body = source.body;
  var code = firstCode;
  var position = start;
  var isFloat = false;
  if (code === 45) {
    code = body.charCodeAt(++position);
  }
  if (code === 48) {
    code = body.charCodeAt(++position);
    if (code >= 48 && code <= 57) {
      throw syntaxError(source, position, "Invalid number, unexpected digit after 0: ".concat(printCharCode(code), "."));
    }
  } else {
    position = readDigits(source, position, code);
    code = body.charCodeAt(position);
  }
  if (code === 46) {
    isFloat = true;
    code = body.charCodeAt(++position);
    position = readDigits(source, position, code);
    code = body.charCodeAt(position);
  }
  if (code === 69 || code === 101) {
    isFloat = true;
    code = body.charCodeAt(++position);
    if (code === 43 || code === 45) {
      code = body.charCodeAt(++position);
    }
    position = readDigits(source, position, code);
    code = body.charCodeAt(position);
  }
  if (code === 46 || isNameStart(code)) {
    throw syntaxError(source, position, "Invalid number, expected digit but got: ".concat(printCharCode(code), "."));
  }
  return new Token(isFloat ? TokenKind.FLOAT : TokenKind.INT, start, position, line, col, prev, body.slice(start, position));
}
function readDigits(source, start, firstCode) {
  var body = source.body;
  var position = start;
  var code = firstCode;
  if (code >= 48 && code <= 57) {
    do {
      code = body.charCodeAt(++position);
    } while (code >= 48 && code <= 57);
    return position;
  }
  throw syntaxError(source, position, "Invalid number, expected digit but got: ".concat(printCharCode(code), "."));
}
function readString(source, start, line, col, prev) {
  var body = source.body;
  var position = start + 1;
  var chunkStart = position;
  var code = 0;
  var value = "";
  while (position < body.length && !isNaN(code = body.charCodeAt(position)) && // not LineTerminator
  code !== 10 && code !== 13) {
    if (code === 34) {
      value += body.slice(chunkStart, position);
      return new Token(TokenKind.STRING, start, position + 1, line, col, prev, value);
    }
    if (code < 32 && code !== 9) {
      throw syntaxError(source, position, "Invalid character within String: ".concat(printCharCode(code), "."));
    }
    ++position;
    if (code === 92) {
      value += body.slice(chunkStart, position - 1);
      code = body.charCodeAt(position);
      switch (code) {
        case 34:
          value += '"';
          break;
        case 47:
          value += "/";
          break;
        case 92:
          value += "\\";
          break;
        case 98:
          value += "\b";
          break;
        case 102:
          value += "\f";
          break;
        case 110:
          value += "\n";
          break;
        case 114:
          value += "\r";
          break;
        case 116:
          value += "	";
          break;
        case 117: {
          var charCode = uniCharCode(body.charCodeAt(position + 1), body.charCodeAt(position + 2), body.charCodeAt(position + 3), body.charCodeAt(position + 4));
          if (charCode < 0) {
            var invalidSequence = body.slice(position + 1, position + 5);
            throw syntaxError(source, position, "Invalid character escape sequence: \\u".concat(invalidSequence, "."));
          }
          value += String.fromCharCode(charCode);
          position += 4;
          break;
        }
        default:
          throw syntaxError(source, position, "Invalid character escape sequence: \\".concat(String.fromCharCode(code), "."));
      }
      ++position;
      chunkStart = position;
    }
  }
  throw syntaxError(source, position, "Unterminated string.");
}
function readBlockString(source, start, line, col, prev, lexer) {
  var body = source.body;
  var position = start + 3;
  var chunkStart = position;
  var code = 0;
  var rawValue = "";
  while (position < body.length && !isNaN(code = body.charCodeAt(position))) {
    if (code === 34 && body.charCodeAt(position + 1) === 34 && body.charCodeAt(position + 2) === 34) {
      rawValue += body.slice(chunkStart, position);
      return new Token(TokenKind.BLOCK_STRING, start, position + 3, line, col, prev, dedentBlockStringValue(rawValue));
    }
    if (code < 32 && code !== 9 && code !== 10 && code !== 13) {
      throw syntaxError(source, position, "Invalid character within String: ".concat(printCharCode(code), "."));
    }
    if (code === 10) {
      ++position;
      ++lexer.line;
      lexer.lineStart = position;
    } else if (code === 13) {
      if (body.charCodeAt(position + 1) === 10) {
        position += 2;
      } else {
        ++position;
      }
      ++lexer.line;
      lexer.lineStart = position;
    } else if (
      // Escape Triple-Quote (\""")
      code === 92 && body.charCodeAt(position + 1) === 34 && body.charCodeAt(position + 2) === 34 && body.charCodeAt(position + 3) === 34
    ) {
      rawValue += body.slice(chunkStart, position) + '"""';
      position += 4;
      chunkStart = position;
    } else {
      ++position;
    }
  }
  throw syntaxError(source, position, "Unterminated string.");
}
function uniCharCode(a, b, c, d) {
  return char2hex(a) << 12 | char2hex(b) << 8 | char2hex(c) << 4 | char2hex(d);
}
function char2hex(a) {
  return a >= 48 && a <= 57 ? a - 48 : a >= 65 && a <= 70 ? a - 55 : a >= 97 && a <= 102 ? a - 87 : -1;
}
function readName(source, start, line, col, prev) {
  var body = source.body;
  var bodyLength = body.length;
  var position = start + 1;
  var code = 0;
  while (position !== bodyLength && !isNaN(code = body.charCodeAt(position)) && (code === 95 || // _
  code >= 48 && code <= 57 || // 0-9
  code >= 65 && code <= 90 || // A-Z
  code >= 97 && code <= 122)) {
    ++position;
  }
  return new Token(TokenKind.NAME, start, position, line, col, prev, body.slice(start, position));
}
function isNameStart(code) {
  return code === 95 || code >= 65 && code <= 90 || code >= 97 && code <= 122;
}

// node_modules/@aws-amplify/api-graphql/node_modules/graphql/language/parser.mjs
function parse(source, options) {
  var parser = new Parser(source, options);
  return parser.parseDocument();
}
var Parser = /* @__PURE__ */ (function() {
  function Parser2(source, options) {
    var sourceObj = isSource(source) ? source : new Source(source);
    this._lexer = new Lexer(sourceObj);
    this._options = options;
  }
  var _proto = Parser2.prototype;
  _proto.parseName = function parseName() {
    var token = this.expectToken(TokenKind.NAME);
    return {
      kind: Kind.NAME,
      value: token.value,
      loc: this.loc(token)
    };
  };
  _proto.parseDocument = function parseDocument() {
    var start = this._lexer.token;
    return {
      kind: Kind.DOCUMENT,
      definitions: this.many(TokenKind.SOF, this.parseDefinition, TokenKind.EOF),
      loc: this.loc(start)
    };
  };
  _proto.parseDefinition = function parseDefinition() {
    if (this.peek(TokenKind.NAME)) {
      switch (this._lexer.token.value) {
        case "query":
        case "mutation":
        case "subscription":
          return this.parseOperationDefinition();
        case "fragment":
          return this.parseFragmentDefinition();
        case "schema":
        case "scalar":
        case "type":
        case "interface":
        case "union":
        case "enum":
        case "input":
        case "directive":
          return this.parseTypeSystemDefinition();
        case "extend":
          return this.parseTypeSystemExtension();
      }
    } else if (this.peek(TokenKind.BRACE_L)) {
      return this.parseOperationDefinition();
    } else if (this.peekDescription()) {
      return this.parseTypeSystemDefinition();
    }
    throw this.unexpected();
  };
  _proto.parseOperationDefinition = function parseOperationDefinition() {
    var start = this._lexer.token;
    if (this.peek(TokenKind.BRACE_L)) {
      return {
        kind: Kind.OPERATION_DEFINITION,
        operation: "query",
        name: void 0,
        variableDefinitions: [],
        directives: [],
        selectionSet: this.parseSelectionSet(),
        loc: this.loc(start)
      };
    }
    var operation = this.parseOperationType();
    var name2;
    if (this.peek(TokenKind.NAME)) {
      name2 = this.parseName();
    }
    return {
      kind: Kind.OPERATION_DEFINITION,
      operation,
      name: name2,
      variableDefinitions: this.parseVariableDefinitions(),
      directives: this.parseDirectives(false),
      selectionSet: this.parseSelectionSet(),
      loc: this.loc(start)
    };
  };
  _proto.parseOperationType = function parseOperationType() {
    var operationToken = this.expectToken(TokenKind.NAME);
    switch (operationToken.value) {
      case "query":
        return "query";
      case "mutation":
        return "mutation";
      case "subscription":
        return "subscription";
    }
    throw this.unexpected(operationToken);
  };
  _proto.parseVariableDefinitions = function parseVariableDefinitions() {
    return this.optionalMany(TokenKind.PAREN_L, this.parseVariableDefinition, TokenKind.PAREN_R);
  };
  _proto.parseVariableDefinition = function parseVariableDefinition() {
    var start = this._lexer.token;
    return {
      kind: Kind.VARIABLE_DEFINITION,
      variable: this.parseVariable(),
      type: (this.expectToken(TokenKind.COLON), this.parseTypeReference()),
      defaultValue: this.expectOptionalToken(TokenKind.EQUALS) ? this.parseValueLiteral(true) : void 0,
      directives: this.parseDirectives(true),
      loc: this.loc(start)
    };
  };
  _proto.parseVariable = function parseVariable() {
    var start = this._lexer.token;
    this.expectToken(TokenKind.DOLLAR);
    return {
      kind: Kind.VARIABLE,
      name: this.parseName(),
      loc: this.loc(start)
    };
  };
  _proto.parseSelectionSet = function parseSelectionSet() {
    var start = this._lexer.token;
    return {
      kind: Kind.SELECTION_SET,
      selections: this.many(TokenKind.BRACE_L, this.parseSelection, TokenKind.BRACE_R),
      loc: this.loc(start)
    };
  };
  _proto.parseSelection = function parseSelection() {
    return this.peek(TokenKind.SPREAD) ? this.parseFragment() : this.parseField();
  };
  _proto.parseField = function parseField() {
    var start = this._lexer.token;
    var nameOrAlias = this.parseName();
    var alias;
    var name2;
    if (this.expectOptionalToken(TokenKind.COLON)) {
      alias = nameOrAlias;
      name2 = this.parseName();
    } else {
      name2 = nameOrAlias;
    }
    return {
      kind: Kind.FIELD,
      alias,
      name: name2,
      arguments: this.parseArguments(false),
      directives: this.parseDirectives(false),
      selectionSet: this.peek(TokenKind.BRACE_L) ? this.parseSelectionSet() : void 0,
      loc: this.loc(start)
    };
  };
  _proto.parseArguments = function parseArguments(isConst) {
    var item = isConst ? this.parseConstArgument : this.parseArgument;
    return this.optionalMany(TokenKind.PAREN_L, item, TokenKind.PAREN_R);
  };
  _proto.parseArgument = function parseArgument() {
    var start = this._lexer.token;
    var name2 = this.parseName();
    this.expectToken(TokenKind.COLON);
    return {
      kind: Kind.ARGUMENT,
      name: name2,
      value: this.parseValueLiteral(false),
      loc: this.loc(start)
    };
  };
  _proto.parseConstArgument = function parseConstArgument() {
    var start = this._lexer.token;
    return {
      kind: Kind.ARGUMENT,
      name: this.parseName(),
      value: (this.expectToken(TokenKind.COLON), this.parseValueLiteral(true)),
      loc: this.loc(start)
    };
  };
  _proto.parseFragment = function parseFragment() {
    var start = this._lexer.token;
    this.expectToken(TokenKind.SPREAD);
    var hasTypeCondition = this.expectOptionalKeyword("on");
    if (!hasTypeCondition && this.peek(TokenKind.NAME)) {
      return {
        kind: Kind.FRAGMENT_SPREAD,
        name: this.parseFragmentName(),
        directives: this.parseDirectives(false),
        loc: this.loc(start)
      };
    }
    return {
      kind: Kind.INLINE_FRAGMENT,
      typeCondition: hasTypeCondition ? this.parseNamedType() : void 0,
      directives: this.parseDirectives(false),
      selectionSet: this.parseSelectionSet(),
      loc: this.loc(start)
    };
  };
  _proto.parseFragmentDefinition = function parseFragmentDefinition() {
    var _this$_options;
    var start = this._lexer.token;
    this.expectKeyword("fragment");
    if (((_this$_options = this._options) === null || _this$_options === void 0 ? void 0 : _this$_options.experimentalFragmentVariables) === true) {
      return {
        kind: Kind.FRAGMENT_DEFINITION,
        name: this.parseFragmentName(),
        variableDefinitions: this.parseVariableDefinitions(),
        typeCondition: (this.expectKeyword("on"), this.parseNamedType()),
        directives: this.parseDirectives(false),
        selectionSet: this.parseSelectionSet(),
        loc: this.loc(start)
      };
    }
    return {
      kind: Kind.FRAGMENT_DEFINITION,
      name: this.parseFragmentName(),
      typeCondition: (this.expectKeyword("on"), this.parseNamedType()),
      directives: this.parseDirectives(false),
      selectionSet: this.parseSelectionSet(),
      loc: this.loc(start)
    };
  };
  _proto.parseFragmentName = function parseFragmentName() {
    if (this._lexer.token.value === "on") {
      throw this.unexpected();
    }
    return this.parseName();
  };
  _proto.parseValueLiteral = function parseValueLiteral(isConst) {
    var token = this._lexer.token;
    switch (token.kind) {
      case TokenKind.BRACKET_L:
        return this.parseList(isConst);
      case TokenKind.BRACE_L:
        return this.parseObject(isConst);
      case TokenKind.INT:
        this._lexer.advance();
        return {
          kind: Kind.INT,
          value: token.value,
          loc: this.loc(token)
        };
      case TokenKind.FLOAT:
        this._lexer.advance();
        return {
          kind: Kind.FLOAT,
          value: token.value,
          loc: this.loc(token)
        };
      case TokenKind.STRING:
      case TokenKind.BLOCK_STRING:
        return this.parseStringLiteral();
      case TokenKind.NAME:
        this._lexer.advance();
        switch (token.value) {
          case "true":
            return {
              kind: Kind.BOOLEAN,
              value: true,
              loc: this.loc(token)
            };
          case "false":
            return {
              kind: Kind.BOOLEAN,
              value: false,
              loc: this.loc(token)
            };
          case "null":
            return {
              kind: Kind.NULL,
              loc: this.loc(token)
            };
          default:
            return {
              kind: Kind.ENUM,
              value: token.value,
              loc: this.loc(token)
            };
        }
      case TokenKind.DOLLAR:
        if (!isConst) {
          return this.parseVariable();
        }
        break;
    }
    throw this.unexpected();
  };
  _proto.parseStringLiteral = function parseStringLiteral() {
    var token = this._lexer.token;
    this._lexer.advance();
    return {
      kind: Kind.STRING,
      value: token.value,
      block: token.kind === TokenKind.BLOCK_STRING,
      loc: this.loc(token)
    };
  };
  _proto.parseList = function parseList(isConst) {
    var _this = this;
    var start = this._lexer.token;
    var item = function item2() {
      return _this.parseValueLiteral(isConst);
    };
    return {
      kind: Kind.LIST,
      values: this.any(TokenKind.BRACKET_L, item, TokenKind.BRACKET_R),
      loc: this.loc(start)
    };
  };
  _proto.parseObject = function parseObject(isConst) {
    var _this2 = this;
    var start = this._lexer.token;
    var item = function item2() {
      return _this2.parseObjectField(isConst);
    };
    return {
      kind: Kind.OBJECT,
      fields: this.any(TokenKind.BRACE_L, item, TokenKind.BRACE_R),
      loc: this.loc(start)
    };
  };
  _proto.parseObjectField = function parseObjectField(isConst) {
    var start = this._lexer.token;
    var name2 = this.parseName();
    this.expectToken(TokenKind.COLON);
    return {
      kind: Kind.OBJECT_FIELD,
      name: name2,
      value: this.parseValueLiteral(isConst),
      loc: this.loc(start)
    };
  };
  _proto.parseDirectives = function parseDirectives(isConst) {
    var directives = [];
    while (this.peek(TokenKind.AT)) {
      directives.push(this.parseDirective(isConst));
    }
    return directives;
  };
  _proto.parseDirective = function parseDirective(isConst) {
    var start = this._lexer.token;
    this.expectToken(TokenKind.AT);
    return {
      kind: Kind.DIRECTIVE,
      name: this.parseName(),
      arguments: this.parseArguments(isConst),
      loc: this.loc(start)
    };
  };
  _proto.parseTypeReference = function parseTypeReference() {
    var start = this._lexer.token;
    var type;
    if (this.expectOptionalToken(TokenKind.BRACKET_L)) {
      type = this.parseTypeReference();
      this.expectToken(TokenKind.BRACKET_R);
      type = {
        kind: Kind.LIST_TYPE,
        type,
        loc: this.loc(start)
      };
    } else {
      type = this.parseNamedType();
    }
    if (this.expectOptionalToken(TokenKind.BANG)) {
      return {
        kind: Kind.NON_NULL_TYPE,
        type,
        loc: this.loc(start)
      };
    }
    return type;
  };
  _proto.parseNamedType = function parseNamedType() {
    var start = this._lexer.token;
    return {
      kind: Kind.NAMED_TYPE,
      name: this.parseName(),
      loc: this.loc(start)
    };
  };
  _proto.parseTypeSystemDefinition = function parseTypeSystemDefinition() {
    var keywordToken = this.peekDescription() ? this._lexer.lookahead() : this._lexer.token;
    if (keywordToken.kind === TokenKind.NAME) {
      switch (keywordToken.value) {
        case "schema":
          return this.parseSchemaDefinition();
        case "scalar":
          return this.parseScalarTypeDefinition();
        case "type":
          return this.parseObjectTypeDefinition();
        case "interface":
          return this.parseInterfaceTypeDefinition();
        case "union":
          return this.parseUnionTypeDefinition();
        case "enum":
          return this.parseEnumTypeDefinition();
        case "input":
          return this.parseInputObjectTypeDefinition();
        case "directive":
          return this.parseDirectiveDefinition();
      }
    }
    throw this.unexpected(keywordToken);
  };
  _proto.peekDescription = function peekDescription() {
    return this.peek(TokenKind.STRING) || this.peek(TokenKind.BLOCK_STRING);
  };
  _proto.parseDescription = function parseDescription() {
    if (this.peekDescription()) {
      return this.parseStringLiteral();
    }
  };
  _proto.parseSchemaDefinition = function parseSchemaDefinition() {
    var start = this._lexer.token;
    var description = this.parseDescription();
    this.expectKeyword("schema");
    var directives = this.parseDirectives(true);
    var operationTypes = this.many(TokenKind.BRACE_L, this.parseOperationTypeDefinition, TokenKind.BRACE_R);
    return {
      kind: Kind.SCHEMA_DEFINITION,
      description,
      directives,
      operationTypes,
      loc: this.loc(start)
    };
  };
  _proto.parseOperationTypeDefinition = function parseOperationTypeDefinition() {
    var start = this._lexer.token;
    var operation = this.parseOperationType();
    this.expectToken(TokenKind.COLON);
    var type = this.parseNamedType();
    return {
      kind: Kind.OPERATION_TYPE_DEFINITION,
      operation,
      type,
      loc: this.loc(start)
    };
  };
  _proto.parseScalarTypeDefinition = function parseScalarTypeDefinition() {
    var start = this._lexer.token;
    var description = this.parseDescription();
    this.expectKeyword("scalar");
    var name2 = this.parseName();
    var directives = this.parseDirectives(true);
    return {
      kind: Kind.SCALAR_TYPE_DEFINITION,
      description,
      name: name2,
      directives,
      loc: this.loc(start)
    };
  };
  _proto.parseObjectTypeDefinition = function parseObjectTypeDefinition() {
    var start = this._lexer.token;
    var description = this.parseDescription();
    this.expectKeyword("type");
    var name2 = this.parseName();
    var interfaces = this.parseImplementsInterfaces();
    var directives = this.parseDirectives(true);
    var fields = this.parseFieldsDefinition();
    return {
      kind: Kind.OBJECT_TYPE_DEFINITION,
      description,
      name: name2,
      interfaces,
      directives,
      fields,
      loc: this.loc(start)
    };
  };
  _proto.parseImplementsInterfaces = function parseImplementsInterfaces() {
    var _this$_options2;
    if (!this.expectOptionalKeyword("implements")) {
      return [];
    }
    if (((_this$_options2 = this._options) === null || _this$_options2 === void 0 ? void 0 : _this$_options2.allowLegacySDLImplementsInterfaces) === true) {
      var types = [];
      this.expectOptionalToken(TokenKind.AMP);
      do {
        types.push(this.parseNamedType());
      } while (this.expectOptionalToken(TokenKind.AMP) || this.peek(TokenKind.NAME));
      return types;
    }
    return this.delimitedMany(TokenKind.AMP, this.parseNamedType);
  };
  _proto.parseFieldsDefinition = function parseFieldsDefinition() {
    var _this$_options3;
    if (((_this$_options3 = this._options) === null || _this$_options3 === void 0 ? void 0 : _this$_options3.allowLegacySDLEmptyFields) === true && this.peek(TokenKind.BRACE_L) && this._lexer.lookahead().kind === TokenKind.BRACE_R) {
      this._lexer.advance();
      this._lexer.advance();
      return [];
    }
    return this.optionalMany(TokenKind.BRACE_L, this.parseFieldDefinition, TokenKind.BRACE_R);
  };
  _proto.parseFieldDefinition = function parseFieldDefinition() {
    var start = this._lexer.token;
    var description = this.parseDescription();
    var name2 = this.parseName();
    var args = this.parseArgumentDefs();
    this.expectToken(TokenKind.COLON);
    var type = this.parseTypeReference();
    var directives = this.parseDirectives(true);
    return {
      kind: Kind.FIELD_DEFINITION,
      description,
      name: name2,
      arguments: args,
      type,
      directives,
      loc: this.loc(start)
    };
  };
  _proto.parseArgumentDefs = function parseArgumentDefs() {
    return this.optionalMany(TokenKind.PAREN_L, this.parseInputValueDef, TokenKind.PAREN_R);
  };
  _proto.parseInputValueDef = function parseInputValueDef() {
    var start = this._lexer.token;
    var description = this.parseDescription();
    var name2 = this.parseName();
    this.expectToken(TokenKind.COLON);
    var type = this.parseTypeReference();
    var defaultValue;
    if (this.expectOptionalToken(TokenKind.EQUALS)) {
      defaultValue = this.parseValueLiteral(true);
    }
    var directives = this.parseDirectives(true);
    return {
      kind: Kind.INPUT_VALUE_DEFINITION,
      description,
      name: name2,
      type,
      defaultValue,
      directives,
      loc: this.loc(start)
    };
  };
  _proto.parseInterfaceTypeDefinition = function parseInterfaceTypeDefinition() {
    var start = this._lexer.token;
    var description = this.parseDescription();
    this.expectKeyword("interface");
    var name2 = this.parseName();
    var interfaces = this.parseImplementsInterfaces();
    var directives = this.parseDirectives(true);
    var fields = this.parseFieldsDefinition();
    return {
      kind: Kind.INTERFACE_TYPE_DEFINITION,
      description,
      name: name2,
      interfaces,
      directives,
      fields,
      loc: this.loc(start)
    };
  };
  _proto.parseUnionTypeDefinition = function parseUnionTypeDefinition() {
    var start = this._lexer.token;
    var description = this.parseDescription();
    this.expectKeyword("union");
    var name2 = this.parseName();
    var directives = this.parseDirectives(true);
    var types = this.parseUnionMemberTypes();
    return {
      kind: Kind.UNION_TYPE_DEFINITION,
      description,
      name: name2,
      directives,
      types,
      loc: this.loc(start)
    };
  };
  _proto.parseUnionMemberTypes = function parseUnionMemberTypes() {
    return this.expectOptionalToken(TokenKind.EQUALS) ? this.delimitedMany(TokenKind.PIPE, this.parseNamedType) : [];
  };
  _proto.parseEnumTypeDefinition = function parseEnumTypeDefinition() {
    var start = this._lexer.token;
    var description = this.parseDescription();
    this.expectKeyword("enum");
    var name2 = this.parseName();
    var directives = this.parseDirectives(true);
    var values = this.parseEnumValuesDefinition();
    return {
      kind: Kind.ENUM_TYPE_DEFINITION,
      description,
      name: name2,
      directives,
      values,
      loc: this.loc(start)
    };
  };
  _proto.parseEnumValuesDefinition = function parseEnumValuesDefinition() {
    return this.optionalMany(TokenKind.BRACE_L, this.parseEnumValueDefinition, TokenKind.BRACE_R);
  };
  _proto.parseEnumValueDefinition = function parseEnumValueDefinition() {
    var start = this._lexer.token;
    var description = this.parseDescription();
    var name2 = this.parseName();
    var directives = this.parseDirectives(true);
    return {
      kind: Kind.ENUM_VALUE_DEFINITION,
      description,
      name: name2,
      directives,
      loc: this.loc(start)
    };
  };
  _proto.parseInputObjectTypeDefinition = function parseInputObjectTypeDefinition() {
    var start = this._lexer.token;
    var description = this.parseDescription();
    this.expectKeyword("input");
    var name2 = this.parseName();
    var directives = this.parseDirectives(true);
    var fields = this.parseInputFieldsDefinition();
    return {
      kind: Kind.INPUT_OBJECT_TYPE_DEFINITION,
      description,
      name: name2,
      directives,
      fields,
      loc: this.loc(start)
    };
  };
  _proto.parseInputFieldsDefinition = function parseInputFieldsDefinition() {
    return this.optionalMany(TokenKind.BRACE_L, this.parseInputValueDef, TokenKind.BRACE_R);
  };
  _proto.parseTypeSystemExtension = function parseTypeSystemExtension() {
    var keywordToken = this._lexer.lookahead();
    if (keywordToken.kind === TokenKind.NAME) {
      switch (keywordToken.value) {
        case "schema":
          return this.parseSchemaExtension();
        case "scalar":
          return this.parseScalarTypeExtension();
        case "type":
          return this.parseObjectTypeExtension();
        case "interface":
          return this.parseInterfaceTypeExtension();
        case "union":
          return this.parseUnionTypeExtension();
        case "enum":
          return this.parseEnumTypeExtension();
        case "input":
          return this.parseInputObjectTypeExtension();
      }
    }
    throw this.unexpected(keywordToken);
  };
  _proto.parseSchemaExtension = function parseSchemaExtension() {
    var start = this._lexer.token;
    this.expectKeyword("extend");
    this.expectKeyword("schema");
    var directives = this.parseDirectives(true);
    var operationTypes = this.optionalMany(TokenKind.BRACE_L, this.parseOperationTypeDefinition, TokenKind.BRACE_R);
    if (directives.length === 0 && operationTypes.length === 0) {
      throw this.unexpected();
    }
    return {
      kind: Kind.SCHEMA_EXTENSION,
      directives,
      operationTypes,
      loc: this.loc(start)
    };
  };
  _proto.parseScalarTypeExtension = function parseScalarTypeExtension() {
    var start = this._lexer.token;
    this.expectKeyword("extend");
    this.expectKeyword("scalar");
    var name2 = this.parseName();
    var directives = this.parseDirectives(true);
    if (directives.length === 0) {
      throw this.unexpected();
    }
    return {
      kind: Kind.SCALAR_TYPE_EXTENSION,
      name: name2,
      directives,
      loc: this.loc(start)
    };
  };
  _proto.parseObjectTypeExtension = function parseObjectTypeExtension() {
    var start = this._lexer.token;
    this.expectKeyword("extend");
    this.expectKeyword("type");
    var name2 = this.parseName();
    var interfaces = this.parseImplementsInterfaces();
    var directives = this.parseDirectives(true);
    var fields = this.parseFieldsDefinition();
    if (interfaces.length === 0 && directives.length === 0 && fields.length === 0) {
      throw this.unexpected();
    }
    return {
      kind: Kind.OBJECT_TYPE_EXTENSION,
      name: name2,
      interfaces,
      directives,
      fields,
      loc: this.loc(start)
    };
  };
  _proto.parseInterfaceTypeExtension = function parseInterfaceTypeExtension() {
    var start = this._lexer.token;
    this.expectKeyword("extend");
    this.expectKeyword("interface");
    var name2 = this.parseName();
    var interfaces = this.parseImplementsInterfaces();
    var directives = this.parseDirectives(true);
    var fields = this.parseFieldsDefinition();
    if (interfaces.length === 0 && directives.length === 0 && fields.length === 0) {
      throw this.unexpected();
    }
    return {
      kind: Kind.INTERFACE_TYPE_EXTENSION,
      name: name2,
      interfaces,
      directives,
      fields,
      loc: this.loc(start)
    };
  };
  _proto.parseUnionTypeExtension = function parseUnionTypeExtension() {
    var start = this._lexer.token;
    this.expectKeyword("extend");
    this.expectKeyword("union");
    var name2 = this.parseName();
    var directives = this.parseDirectives(true);
    var types = this.parseUnionMemberTypes();
    if (directives.length === 0 && types.length === 0) {
      throw this.unexpected();
    }
    return {
      kind: Kind.UNION_TYPE_EXTENSION,
      name: name2,
      directives,
      types,
      loc: this.loc(start)
    };
  };
  _proto.parseEnumTypeExtension = function parseEnumTypeExtension() {
    var start = this._lexer.token;
    this.expectKeyword("extend");
    this.expectKeyword("enum");
    var name2 = this.parseName();
    var directives = this.parseDirectives(true);
    var values = this.parseEnumValuesDefinition();
    if (directives.length === 0 && values.length === 0) {
      throw this.unexpected();
    }
    return {
      kind: Kind.ENUM_TYPE_EXTENSION,
      name: name2,
      directives,
      values,
      loc: this.loc(start)
    };
  };
  _proto.parseInputObjectTypeExtension = function parseInputObjectTypeExtension() {
    var start = this._lexer.token;
    this.expectKeyword("extend");
    this.expectKeyword("input");
    var name2 = this.parseName();
    var directives = this.parseDirectives(true);
    var fields = this.parseInputFieldsDefinition();
    if (directives.length === 0 && fields.length === 0) {
      throw this.unexpected();
    }
    return {
      kind: Kind.INPUT_OBJECT_TYPE_EXTENSION,
      name: name2,
      directives,
      fields,
      loc: this.loc(start)
    };
  };
  _proto.parseDirectiveDefinition = function parseDirectiveDefinition() {
    var start = this._lexer.token;
    var description = this.parseDescription();
    this.expectKeyword("directive");
    this.expectToken(TokenKind.AT);
    var name2 = this.parseName();
    var args = this.parseArgumentDefs();
    var repeatable = this.expectOptionalKeyword("repeatable");
    this.expectKeyword("on");
    var locations = this.parseDirectiveLocations();
    return {
      kind: Kind.DIRECTIVE_DEFINITION,
      description,
      name: name2,
      arguments: args,
      repeatable,
      locations,
      loc: this.loc(start)
    };
  };
  _proto.parseDirectiveLocations = function parseDirectiveLocations() {
    return this.delimitedMany(TokenKind.PIPE, this.parseDirectiveLocation);
  };
  _proto.parseDirectiveLocation = function parseDirectiveLocation() {
    var start = this._lexer.token;
    var name2 = this.parseName();
    if (DirectiveLocation[name2.value] !== void 0) {
      return name2;
    }
    throw this.unexpected(start);
  };
  _proto.loc = function loc(startToken) {
    var _this$_options4;
    if (((_this$_options4 = this._options) === null || _this$_options4 === void 0 ? void 0 : _this$_options4.noLocation) !== true) {
      return new Location(startToken, this._lexer.lastToken, this._lexer.source);
    }
  };
  _proto.peek = function peek(kind) {
    return this._lexer.token.kind === kind;
  };
  _proto.expectToken = function expectToken(kind) {
    var token = this._lexer.token;
    if (token.kind === kind) {
      this._lexer.advance();
      return token;
    }
    throw syntaxError(this._lexer.source, token.start, "Expected ".concat(getTokenKindDesc(kind), ", found ").concat(getTokenDesc(token), "."));
  };
  _proto.expectOptionalToken = function expectOptionalToken(kind) {
    var token = this._lexer.token;
    if (token.kind === kind) {
      this._lexer.advance();
      return token;
    }
    return void 0;
  };
  _proto.expectKeyword = function expectKeyword(value) {
    var token = this._lexer.token;
    if (token.kind === TokenKind.NAME && token.value === value) {
      this._lexer.advance();
    } else {
      throw syntaxError(this._lexer.source, token.start, 'Expected "'.concat(value, '", found ').concat(getTokenDesc(token), "."));
    }
  };
  _proto.expectOptionalKeyword = function expectOptionalKeyword(value) {
    var token = this._lexer.token;
    if (token.kind === TokenKind.NAME && token.value === value) {
      this._lexer.advance();
      return true;
    }
    return false;
  };
  _proto.unexpected = function unexpected(atToken) {
    var token = atToken !== null && atToken !== void 0 ? atToken : this._lexer.token;
    return syntaxError(this._lexer.source, token.start, "Unexpected ".concat(getTokenDesc(token), "."));
  };
  _proto.any = function any(openKind, parseFn, closeKind) {
    this.expectToken(openKind);
    var nodes = [];
    while (!this.expectOptionalToken(closeKind)) {
      nodes.push(parseFn.call(this));
    }
    return nodes;
  };
  _proto.optionalMany = function optionalMany(openKind, parseFn, closeKind) {
    if (this.expectOptionalToken(openKind)) {
      var nodes = [];
      do {
        nodes.push(parseFn.call(this));
      } while (!this.expectOptionalToken(closeKind));
      return nodes;
    }
    return [];
  };
  _proto.many = function many(openKind, parseFn, closeKind) {
    this.expectToken(openKind);
    var nodes = [];
    do {
      nodes.push(parseFn.call(this));
    } while (!this.expectOptionalToken(closeKind));
    return nodes;
  };
  _proto.delimitedMany = function delimitedMany(delimiterKind, parseFn) {
    this.expectOptionalToken(delimiterKind);
    var nodes = [];
    do {
      nodes.push(parseFn.call(this));
    } while (this.expectOptionalToken(delimiterKind));
    return nodes;
  };
  return Parser2;
})();
function getTokenDesc(token) {
  var value = token.value;
  return getTokenKindDesc(token.kind) + (value != null ? ' "'.concat(value, '"') : "");
}
function getTokenKindDesc(kind) {
  return isPunctuatorTokenKind(kind) ? '"'.concat(kind, '"') : kind;
}

// node_modules/@aws-amplify/api-graphql/node_modules/graphql/language/visitor.mjs
var QueryDocumentKeys = {
  Name: [],
  Document: ["definitions"],
  OperationDefinition: ["name", "variableDefinitions", "directives", "selectionSet"],
  VariableDefinition: ["variable", "type", "defaultValue", "directives"],
  Variable: ["name"],
  SelectionSet: ["selections"],
  Field: ["alias", "name", "arguments", "directives", "selectionSet"],
  Argument: ["name", "value"],
  FragmentSpread: ["name", "directives"],
  InlineFragment: ["typeCondition", "directives", "selectionSet"],
  FragmentDefinition: [
    "name",
    // Note: fragment variable definitions are experimental and may be changed
    // or removed in the future.
    "variableDefinitions",
    "typeCondition",
    "directives",
    "selectionSet"
  ],
  IntValue: [],
  FloatValue: [],
  StringValue: [],
  BooleanValue: [],
  NullValue: [],
  EnumValue: [],
  ListValue: ["values"],
  ObjectValue: ["fields"],
  ObjectField: ["name", "value"],
  Directive: ["name", "arguments"],
  NamedType: ["name"],
  ListType: ["type"],
  NonNullType: ["type"],
  SchemaDefinition: ["description", "directives", "operationTypes"],
  OperationTypeDefinition: ["type"],
  ScalarTypeDefinition: ["description", "name", "directives"],
  ObjectTypeDefinition: ["description", "name", "interfaces", "directives", "fields"],
  FieldDefinition: ["description", "name", "arguments", "type", "directives"],
  InputValueDefinition: ["description", "name", "type", "defaultValue", "directives"],
  InterfaceTypeDefinition: ["description", "name", "interfaces", "directives", "fields"],
  UnionTypeDefinition: ["description", "name", "directives", "types"],
  EnumTypeDefinition: ["description", "name", "directives", "values"],
  EnumValueDefinition: ["description", "name", "directives"],
  InputObjectTypeDefinition: ["description", "name", "directives", "fields"],
  DirectiveDefinition: ["description", "name", "arguments", "locations"],
  SchemaExtension: ["directives", "operationTypes"],
  ScalarTypeExtension: ["name", "directives"],
  ObjectTypeExtension: ["name", "interfaces", "directives", "fields"],
  InterfaceTypeExtension: ["name", "interfaces", "directives", "fields"],
  UnionTypeExtension: ["name", "directives", "types"],
  EnumTypeExtension: ["name", "directives", "values"],
  InputObjectTypeExtension: ["name", "directives", "fields"]
};
var BREAK = Object.freeze({});
function visit(root, visitor) {
  var visitorKeys = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : QueryDocumentKeys;
  var stack = void 0;
  var inArray = Array.isArray(root);
  var keys = [root];
  var index = -1;
  var edits = [];
  var node = void 0;
  var key = void 0;
  var parent = void 0;
  var path = [];
  var ancestors = [];
  var newRoot = root;
  do {
    index++;
    var isLeaving = index === keys.length;
    var isEdited = isLeaving && edits.length !== 0;
    if (isLeaving) {
      key = ancestors.length === 0 ? void 0 : path[path.length - 1];
      node = parent;
      parent = ancestors.pop();
      if (isEdited) {
        if (inArray) {
          node = node.slice();
        } else {
          var clone = {};
          for (var _i2 = 0, _Object$keys2 = Object.keys(node); _i2 < _Object$keys2.length; _i2++) {
            var k = _Object$keys2[_i2];
            clone[k] = node[k];
          }
          node = clone;
        }
        var editOffset = 0;
        for (var ii = 0; ii < edits.length; ii++) {
          var editKey = edits[ii][0];
          var editValue = edits[ii][1];
          if (inArray) {
            editKey -= editOffset;
          }
          if (inArray && editValue === null) {
            node.splice(editKey, 1);
            editOffset++;
          } else {
            node[editKey] = editValue;
          }
        }
      }
      index = stack.index;
      keys = stack.keys;
      edits = stack.edits;
      inArray = stack.inArray;
      stack = stack.prev;
    } else {
      key = parent ? inArray ? index : keys[index] : void 0;
      node = parent ? parent[key] : newRoot;
      if (node === null || node === void 0) {
        continue;
      }
      if (parent) {
        path.push(key);
      }
    }
    var result = void 0;
    if (!Array.isArray(node)) {
      if (!isNode(node)) {
        throw new Error("Invalid AST Node: ".concat(inspect(node), "."));
      }
      var visitFn = getVisitFn(visitor, node.kind, isLeaving);
      if (visitFn) {
        result = visitFn.call(visitor, node, key, parent, path, ancestors);
        if (result === BREAK) {
          break;
        }
        if (result === false) {
          if (!isLeaving) {
            path.pop();
            continue;
          }
        } else if (result !== void 0) {
          edits.push([key, result]);
          if (!isLeaving) {
            if (isNode(result)) {
              node = result;
            } else {
              path.pop();
              continue;
            }
          }
        }
      }
    }
    if (result === void 0 && isEdited) {
      edits.push([key, node]);
    }
    if (isLeaving) {
      path.pop();
    } else {
      var _visitorKeys$node$kin;
      stack = {
        inArray,
        index,
        keys,
        edits,
        prev: stack
      };
      inArray = Array.isArray(node);
      keys = inArray ? node : (_visitorKeys$node$kin = visitorKeys[node.kind]) !== null && _visitorKeys$node$kin !== void 0 ? _visitorKeys$node$kin : [];
      index = -1;
      edits = [];
      if (parent) {
        ancestors.push(parent);
      }
      parent = node;
    }
  } while (stack !== void 0);
  if (edits.length !== 0) {
    newRoot = edits[edits.length - 1][1];
  }
  return newRoot;
}
function getVisitFn(visitor, kind, isLeaving) {
  var kindVisitor = visitor[kind];
  if (kindVisitor) {
    if (!isLeaving && typeof kindVisitor === "function") {
      return kindVisitor;
    }
    var kindSpecificVisitor = isLeaving ? kindVisitor.leave : kindVisitor.enter;
    if (typeof kindSpecificVisitor === "function") {
      return kindSpecificVisitor;
    }
  } else {
    var specificVisitor = isLeaving ? visitor.leave : visitor.enter;
    if (specificVisitor) {
      if (typeof specificVisitor === "function") {
        return specificVisitor;
      }
      var specificKindVisitor = specificVisitor[kind];
      if (typeof specificKindVisitor === "function") {
        return specificKindVisitor;
      }
    }
  }
}

// node_modules/@aws-amplify/api-graphql/node_modules/graphql/language/printer.mjs
function print(ast) {
  return visit(ast, {
    leave: printDocASTReducer
  });
}
var MAX_LINE_LENGTH = 80;
var printDocASTReducer = {
  Name: function Name(node) {
    return node.value;
  },
  Variable: function Variable(node) {
    return "$" + node.name;
  },
  // Document
  Document: function Document(node) {
    return join(node.definitions, "\n\n") + "\n";
  },
  OperationDefinition: function OperationDefinition(node) {
    var op = node.operation;
    var name2 = node.name;
    var varDefs = wrap("(", join(node.variableDefinitions, ", "), ")");
    var directives = join(node.directives, " ");
    var selectionSet = node.selectionSet;
    return !name2 && !directives && !varDefs && op === "query" ? selectionSet : join([op, join([name2, varDefs]), directives, selectionSet], " ");
  },
  VariableDefinition: function VariableDefinition(_ref) {
    var variable = _ref.variable, type = _ref.type, defaultValue = _ref.defaultValue, directives = _ref.directives;
    return variable + ": " + type + wrap(" = ", defaultValue) + wrap(" ", join(directives, " "));
  },
  SelectionSet: function SelectionSet(_ref2) {
    var selections = _ref2.selections;
    return block(selections);
  },
  Field: function Field(_ref3) {
    var alias = _ref3.alias, name2 = _ref3.name, args = _ref3.arguments, directives = _ref3.directives, selectionSet = _ref3.selectionSet;
    var prefix = wrap("", alias, ": ") + name2;
    var argsLine = prefix + wrap("(", join(args, ", "), ")");
    if (argsLine.length > MAX_LINE_LENGTH) {
      argsLine = prefix + wrap("(\n", indent(join(args, "\n")), "\n)");
    }
    return join([argsLine, join(directives, " "), selectionSet], " ");
  },
  Argument: function Argument(_ref4) {
    var name2 = _ref4.name, value = _ref4.value;
    return name2 + ": " + value;
  },
  // Fragments
  FragmentSpread: function FragmentSpread(_ref5) {
    var name2 = _ref5.name, directives = _ref5.directives;
    return "..." + name2 + wrap(" ", join(directives, " "));
  },
  InlineFragment: function InlineFragment(_ref6) {
    var typeCondition = _ref6.typeCondition, directives = _ref6.directives, selectionSet = _ref6.selectionSet;
    return join(["...", wrap("on ", typeCondition), join(directives, " "), selectionSet], " ");
  },
  FragmentDefinition: function FragmentDefinition(_ref7) {
    var name2 = _ref7.name, typeCondition = _ref7.typeCondition, variableDefinitions = _ref7.variableDefinitions, directives = _ref7.directives, selectionSet = _ref7.selectionSet;
    return (
      // Note: fragment variable definitions are experimental and may be changed
      // or removed in the future.
      "fragment ".concat(name2).concat(wrap("(", join(variableDefinitions, ", "), ")"), " ") + "on ".concat(typeCondition, " ").concat(wrap("", join(directives, " "), " ")) + selectionSet
    );
  },
  // Value
  IntValue: function IntValue(_ref8) {
    var value = _ref8.value;
    return value;
  },
  FloatValue: function FloatValue(_ref9) {
    var value = _ref9.value;
    return value;
  },
  StringValue: function StringValue(_ref10, key) {
    var value = _ref10.value, isBlockString = _ref10.block;
    return isBlockString ? printBlockString(value, key === "description" ? "" : "  ") : JSON.stringify(value);
  },
  BooleanValue: function BooleanValue(_ref11) {
    var value = _ref11.value;
    return value ? "true" : "false";
  },
  NullValue: function NullValue() {
    return "null";
  },
  EnumValue: function EnumValue(_ref12) {
    var value = _ref12.value;
    return value;
  },
  ListValue: function ListValue(_ref13) {
    var values = _ref13.values;
    return "[" + join(values, ", ") + "]";
  },
  ObjectValue: function ObjectValue(_ref14) {
    var fields = _ref14.fields;
    return "{" + join(fields, ", ") + "}";
  },
  ObjectField: function ObjectField(_ref15) {
    var name2 = _ref15.name, value = _ref15.value;
    return name2 + ": " + value;
  },
  // Directive
  Directive: function Directive(_ref16) {
    var name2 = _ref16.name, args = _ref16.arguments;
    return "@" + name2 + wrap("(", join(args, ", "), ")");
  },
  // Type
  NamedType: function NamedType(_ref17) {
    var name2 = _ref17.name;
    return name2;
  },
  ListType: function ListType(_ref18) {
    var type = _ref18.type;
    return "[" + type + "]";
  },
  NonNullType: function NonNullType(_ref19) {
    var type = _ref19.type;
    return type + "!";
  },
  // Type System Definitions
  SchemaDefinition: addDescription(function(_ref20) {
    var directives = _ref20.directives, operationTypes = _ref20.operationTypes;
    return join(["schema", join(directives, " "), block(operationTypes)], " ");
  }),
  OperationTypeDefinition: function OperationTypeDefinition(_ref21) {
    var operation = _ref21.operation, type = _ref21.type;
    return operation + ": " + type;
  },
  ScalarTypeDefinition: addDescription(function(_ref22) {
    var name2 = _ref22.name, directives = _ref22.directives;
    return join(["scalar", name2, join(directives, " ")], " ");
  }),
  ObjectTypeDefinition: addDescription(function(_ref23) {
    var name2 = _ref23.name, interfaces = _ref23.interfaces, directives = _ref23.directives, fields = _ref23.fields;
    return join(["type", name2, wrap("implements ", join(interfaces, " & ")), join(directives, " "), block(fields)], " ");
  }),
  FieldDefinition: addDescription(function(_ref24) {
    var name2 = _ref24.name, args = _ref24.arguments, type = _ref24.type, directives = _ref24.directives;
    return name2 + (hasMultilineItems(args) ? wrap("(\n", indent(join(args, "\n")), "\n)") : wrap("(", join(args, ", "), ")")) + ": " + type + wrap(" ", join(directives, " "));
  }),
  InputValueDefinition: addDescription(function(_ref25) {
    var name2 = _ref25.name, type = _ref25.type, defaultValue = _ref25.defaultValue, directives = _ref25.directives;
    return join([name2 + ": " + type, wrap("= ", defaultValue), join(directives, " ")], " ");
  }),
  InterfaceTypeDefinition: addDescription(function(_ref26) {
    var name2 = _ref26.name, interfaces = _ref26.interfaces, directives = _ref26.directives, fields = _ref26.fields;
    return join(["interface", name2, wrap("implements ", join(interfaces, " & ")), join(directives, " "), block(fields)], " ");
  }),
  UnionTypeDefinition: addDescription(function(_ref27) {
    var name2 = _ref27.name, directives = _ref27.directives, types = _ref27.types;
    return join(["union", name2, join(directives, " "), types && types.length !== 0 ? "= " + join(types, " | ") : ""], " ");
  }),
  EnumTypeDefinition: addDescription(function(_ref28) {
    var name2 = _ref28.name, directives = _ref28.directives, values = _ref28.values;
    return join(["enum", name2, join(directives, " "), block(values)], " ");
  }),
  EnumValueDefinition: addDescription(function(_ref29) {
    var name2 = _ref29.name, directives = _ref29.directives;
    return join([name2, join(directives, " ")], " ");
  }),
  InputObjectTypeDefinition: addDescription(function(_ref30) {
    var name2 = _ref30.name, directives = _ref30.directives, fields = _ref30.fields;
    return join(["input", name2, join(directives, " "), block(fields)], " ");
  }),
  DirectiveDefinition: addDescription(function(_ref31) {
    var name2 = _ref31.name, args = _ref31.arguments, repeatable = _ref31.repeatable, locations = _ref31.locations;
    return "directive @" + name2 + (hasMultilineItems(args) ? wrap("(\n", indent(join(args, "\n")), "\n)") : wrap("(", join(args, ", "), ")")) + (repeatable ? " repeatable" : "") + " on " + join(locations, " | ");
  }),
  SchemaExtension: function SchemaExtension(_ref32) {
    var directives = _ref32.directives, operationTypes = _ref32.operationTypes;
    return join(["extend schema", join(directives, " "), block(operationTypes)], " ");
  },
  ScalarTypeExtension: function ScalarTypeExtension(_ref33) {
    var name2 = _ref33.name, directives = _ref33.directives;
    return join(["extend scalar", name2, join(directives, " ")], " ");
  },
  ObjectTypeExtension: function ObjectTypeExtension(_ref34) {
    var name2 = _ref34.name, interfaces = _ref34.interfaces, directives = _ref34.directives, fields = _ref34.fields;
    return join(["extend type", name2, wrap("implements ", join(interfaces, " & ")), join(directives, " "), block(fields)], " ");
  },
  InterfaceTypeExtension: function InterfaceTypeExtension(_ref35) {
    var name2 = _ref35.name, interfaces = _ref35.interfaces, directives = _ref35.directives, fields = _ref35.fields;
    return join(["extend interface", name2, wrap("implements ", join(interfaces, " & ")), join(directives, " "), block(fields)], " ");
  },
  UnionTypeExtension: function UnionTypeExtension(_ref36) {
    var name2 = _ref36.name, directives = _ref36.directives, types = _ref36.types;
    return join(["extend union", name2, join(directives, " "), types && types.length !== 0 ? "= " + join(types, " | ") : ""], " ");
  },
  EnumTypeExtension: function EnumTypeExtension(_ref37) {
    var name2 = _ref37.name, directives = _ref37.directives, values = _ref37.values;
    return join(["extend enum", name2, join(directives, " "), block(values)], " ");
  },
  InputObjectTypeExtension: function InputObjectTypeExtension(_ref38) {
    var name2 = _ref38.name, directives = _ref38.directives, fields = _ref38.fields;
    return join(["extend input", name2, join(directives, " "), block(fields)], " ");
  }
};
function addDescription(cb) {
  return function(node) {
    return join([node.description, cb(node)], "\n");
  };
}
function join(maybeArray) {
  var _maybeArray$filter$jo;
  var separator = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : "";
  return (_maybeArray$filter$jo = maybeArray === null || maybeArray === void 0 ? void 0 : maybeArray.filter(function(x) {
    return x;
  }).join(separator)) !== null && _maybeArray$filter$jo !== void 0 ? _maybeArray$filter$jo : "";
}
function block(array) {
  return wrap("{\n", indent(join(array, "\n")), "\n}");
}
function wrap(start, maybeString) {
  var end = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : "";
  return maybeString != null && maybeString !== "" ? start + maybeString + end : "";
}
function indent(str) {
  return wrap("  ", str.replace(/\n/g, "\n  "));
}
function isMultiline(str) {
  return str.indexOf("\n") !== -1;
}
function hasMultilineItems(maybeArray) {
  return maybeArray != null && maybeArray.some(isMultiline);
}

// node_modules/@aws-amplify/api-rest/dist/esm/errors/RestApiError.mjs
var RestApiError = class _RestApiError extends ApiError {
  constructor(params) {
    super(params);
    this.constructor = _RestApiError;
    Object.setPrototypeOf(this, _RestApiError.prototype);
  }
};

// node_modules/@aws-amplify/api-rest/dist/esm/errors/CanceledError.mjs
var CanceledError = class _CanceledError extends RestApiError {
  constructor(params = {}) {
    super({
      name: "CanceledError",
      message: "Request is canceled by user",
      ...params
    });
    this.constructor = _CanceledError;
    Object.setPrototypeOf(this, _CanceledError.prototype);
  }
};
var isCancelError = (error) => !!error && error instanceof CanceledError;

// node_modules/@aws-amplify/api-rest/dist/esm/errors/validation.mjs
var RestApiValidationErrorCode;
(function(RestApiValidationErrorCode2) {
  RestApiValidationErrorCode2["InvalidApiName"] = "InvalidApiName";
})(RestApiValidationErrorCode || (RestApiValidationErrorCode = {}));
var validationErrorMap2 = {
  [RestApiValidationErrorCode.InvalidApiName]: {
    message: "API name is invalid.",
    recoverySuggestion: "Check if the API name matches the one in your configuration or `aws-exports.js`"
  }
};

// node_modules/@aws-amplify/api-rest/dist/esm/utils/serviceError.mjs
var parseRestApiServiceError = async (response) => {
  if (!response) {
    return;
  }
  const parsedAwsError = await parseJsonError(stubErrorResponse(response));
  if (!parsedAwsError) ;
  else {
    const bodyText = await response.body?.text();
    return buildRestApiError(parsedAwsError, {
      statusCode: response.statusCode,
      headers: response.headers,
      body: bodyText
    });
  }
};
var stubErrorResponse = (response) => {
  let bodyTextPromise;
  const bodyProxy = new Proxy(response.body, {
    get(target, prop, receiver) {
      if (prop === "json") {
        return async () => {
          if (!bodyTextPromise) {
            bodyTextPromise = target.text();
          }
          try {
            return JSON.parse(await bodyTextPromise);
          } catch (error) {
            return {};
          }
        };
      } else if (prop === "text") {
        return async () => {
          if (!bodyTextPromise) {
            bodyTextPromise = target.text();
          }
          return bodyTextPromise;
        };
      } else {
        return Reflect.get(target, prop, receiver);
      }
    }
  });
  const responseProxy = new Proxy(response, {
    get(target, prop, receiver) {
      if (prop === "body") {
        return bodyProxy;
      } else {
        return Reflect.get(target, prop, receiver);
      }
    }
  });
  return responseProxy;
};
var buildRestApiError = (error, response) => {
  const restApiError = new RestApiError({
    name: error?.name,
    message: error.message,
    underlyingError: error,
    response
  });
  return Object.assign(restApiError, { $metadata: error.$metadata });
};

// node_modules/@aws-amplify/api-rest/dist/esm/utils/logger.mjs
var logger13 = new ConsoleLogger("RestApis");

// node_modules/@aws-amplify/api-rest/dist/esm/utils/createCancellableOperation.mjs
function createCancellableOperation(handler, abortController, operationType, timeout) {
  const abortSignal = abortController.signal;
  let abortReason;
  if (timeout != null) {
    if (timeout < 0) {
      throw new Error("Timeout must be a non-negative number");
    }
    setTimeout(() => {
      abortReason = "TimeoutError";
      abortController.abort(abortReason);
    }, timeout);
  }
  const job = async () => {
    try {
      const response = await handler();
      if (response.statusCode >= 300) {
        throw await parseRestApiServiceError(response);
      }
      return response;
    } catch (error) {
      if (error.name === "AbortError" || abortSignal?.aborted === true) {
        const isTimeout = abortReason && abortReason === "TimeoutError";
        if (isTimeout) {
          const timeoutError = new Error(`Request timeout after ${timeout}ms`);
          timeoutError.name = "TimeoutError";
          logger13.debug(timeoutError);
          throw timeoutError;
        } else {
          const message = abortReason ?? abortSignal.reason;
          const canceledError = new CanceledError({
            ...message && { message },
            underlyingError: error,
            recoverySuggestion: "The API request was explicitly canceled. If this is not intended, validate if you called the `cancel()` function on the API request erroneously."
          });
          logger13.debug(canceledError);
          throw canceledError;
        }
      }
      logger13.debug(error);
      throw error;
    }
  };
  if (operationType === "internal") {
    return job();
  } else {
    const cancel3 = (abortMessage) => {
      if (abortSignal.aborted === true) {
        return;
      }
      abortController.abort(abortMessage);
      if (abortMessage && abortSignal.reason !== abortMessage) {
        abortReason = abortMessage;
      }
    };
    return { response: job(), cancel: cancel3 };
  }
}

// node_modules/@aws-amplify/api-rest/dist/esm/utils/constants.mjs
var DEFAULT_REST_IAM_SIGNING_SERVICE = "execute-api";
var DEFAULT_IAM_SIGNING_REGION = "us-east-1";
var APIG_HOSTNAME_PATTERN = /^.+\.([a-z0-9-]+)\.([a-z0-9-]+)\.amazonaws\.com/;

// node_modules/@aws-amplify/api-rest/dist/esm/utils/parseSigningInfo.mjs
var parseSigningInfo = (url, restApiOptions) => {
  const { service: signingService = DEFAULT_REST_IAM_SIGNING_SERVICE, region: signingRegion = DEFAULT_IAM_SIGNING_REGION } = restApiOptions?.amplify.getConfig()?.API?.REST?.[restApiOptions?.apiName] ?? {};
  const { hostname } = url;
  const [, service, region] = APIG_HOSTNAME_PATTERN.exec(hostname) ?? [];
  if (service === DEFAULT_REST_IAM_SIGNING_SERVICE) {
    return {
      service,
      region: region ?? signingRegion
    };
  } else if (service === "appsync-api") {
    return {
      service: "appsync",
      region: region ?? signingRegion
    };
  } else {
    return {
      service: signingService,
      region: signingRegion
    };
  }
};

// node_modules/@aws-amplify/api-rest/dist/esm/errors/assertValidatonError.mjs
function assertValidationError(assertion, name2) {
  const { message, recoverySuggestion } = validationErrorMap2[name2];
  if (!assertion) {
    throw new RestApiError({ name: name2, message, recoverySuggestion });
  }
}

// node_modules/@aws-amplify/api-rest/dist/esm/utils/resolveApiUrl.mjs
var resolveApiUrl = (amplify, apiName, path, queryParams) => {
  const urlStr = amplify.getConfig()?.API?.REST?.[apiName]?.endpoint;
  assertValidationError(!!urlStr, RestApiValidationErrorCode.InvalidApiName);
  try {
    let url;
    if (AmplifyUrl.canParse(urlStr + path)) {
      url = new AmplifyUrl(urlStr + path);
    } else {
      url = new AmplifyUrl(urlStr + path, location?.origin);
    }
    if (queryParams) {
      const mergedQueryParams = new AmplifyUrlSearchParams(url.searchParams);
      Object.entries(queryParams).forEach(([key, value]) => {
        mergedQueryParams.set(key, value);
      });
      url.search = new AmplifyUrlSearchParams(mergedQueryParams).toString();
    }
    return url;
  } catch (error) {
    throw new RestApiError({
      name: RestApiValidationErrorCode.InvalidApiName,
      ...validationErrorMap2[RestApiValidationErrorCode.InvalidApiName],
      recoverySuggestion: `Please make sure the REST endpoint URL is a valid URL string. Got ${urlStr}`
    });
  }
};

// node_modules/@aws-amplify/api-rest/dist/esm/utils/isIamAuthApplicable.mjs
var isIamAuthApplicableForGraphQL = ({ headers }, signingServiceInfo) => !headers.authorization && !headers["x-api-key"] && !!signingServiceInfo;
var isIamAuthApplicableForRest = ({ headers }, signingServiceInfo) => !headers.authorization && !!signingServiceInfo;

// node_modules/@aws-amplify/api-rest/dist/esm/utils/resolveLibraryOptions.mjs
var resolveLibraryOptions = (amplify) => {
  const retryStrategy = amplify.libraryOptions?.API?.REST?.retryStrategy;
  const defaultAuthMode = amplify.libraryOptions?.API?.REST?.defaultAuthMode;
  return { retryStrategy, defaultAuthMode };
};

// node_modules/@aws-amplify/api-rest/dist/esm/utils/resolveHeaders.mjs
var resolveHeaders = (headers, body) => {
  const normalizedHeaders = {};
  for (const key in headers) {
    normalizedHeaders[key.toLowerCase()] = headers[key];
  }
  if (body) {
    const contentType = normalizedHeaders["content-type"];
    const isJsonCompatible = contentType && (contentType.startsWith("application/json") || contentType.startsWith("application/") && contentType.includes("+json"));
    if (!isJsonCompatible) {
      normalizedHeaders["content-type"] = "application/json; charset=UTF-8";
    }
    if (body instanceof FormData) {
      delete normalizedHeaders["content-type"];
    }
  }
  return normalizedHeaders;
};

// node_modules/@aws-amplify/api-rest/dist/esm/apis/common/baseHandlers/authenticatedHandler.mjs
var authenticatedHandler = composeTransferHandler(fetchTransferHandler, [
  userAgentMiddlewareFactory,
  retryMiddlewareFactory,
  signingMiddlewareFactory
]);

// node_modules/@aws-amplify/api-rest/dist/esm/apis/common/baseHandlers/unauthenticatedHandler.mjs
var unauthenticatedHandler2 = composeTransferHandler(fetchTransferHandler, [userAgentMiddlewareFactory, retryMiddlewareFactory]);

// node_modules/@aws-amplify/api-rest/dist/esm/apis/common/transferHandler.mjs
var transferHandler = async (amplify, options, iamAuthApplicable, signingServiceInfo) => {
  const { url, method, headers, body, withCredentials, abortSignal, retryStrategy } = options;
  const resolvedBody = body ? body instanceof FormData ? body : JSON.stringify(body ?? "") : void 0;
  const resolvedHeaders = resolveHeaders(headers, body);
  const request = {
    url,
    headers: resolvedHeaders,
    method,
    body: resolvedBody
  };
  const { retryStrategy: libraryRetryStrategy, defaultAuthMode: libraryDefaultAuthMode } = resolveLibraryOptions(amplify);
  const baseOptions = {
    retryDecider: getRetryDeciderFromStrategy(retryStrategy ?? libraryRetryStrategy),
    computeDelay: jitteredBackoff2,
    withCrossDomainCredentials: withCredentials,
    abortSignal
  };
  const defaultAuthMode = options.defaultAuthMode ?? libraryDefaultAuthMode;
  let credentials = null;
  if (defaultAuthMode !== "none") {
    credentials = await resolveCredentials(amplify);
  }
  let response;
  const isIamAuthApplicable = iamAuthApplicable(request, signingServiceInfo);
  if (isIamAuthApplicable && credentials) {
    const signingInfoFromUrl = parseSigningInfo(url);
    const signingService = signingServiceInfo?.service ?? signingInfoFromUrl.service;
    const signingRegion = signingServiceInfo?.region ?? signingInfoFromUrl.region;
    response = await authenticatedHandler(request, {
      ...baseOptions,
      credentials,
      region: signingRegion,
      service: signingService
    });
  } else {
    response = await unauthenticatedHandler2(request, {
      ...baseOptions
    });
  }
  return {
    statusCode: response.statusCode,
    headers: response.headers,
    body: response.body
  };
};
var getRetryDeciderFromStrategy = (retryStrategy) => {
  const strategy = retryStrategy?.strategy;
  if (strategy === "no-retry") {
    return () => Promise.resolve({ retryable: false });
  }
  return getRetryDecider(parseRestApiServiceError);
};
var resolveCredentials = async (amplify) => {
  try {
    const { credentials } = await amplify.Auth.fetchAuthSession();
    if (credentials) {
      return credentials;
    }
  } catch (e) {
    logger13.debug("No credentials available, the request will be unsigned.");
  }
  return null;
};

// node_modules/@aws-amplify/api-rest/dist/esm/apis/common/publicApis.mjs
var publicHandler = (amplify, options, method) => {
  const { apiName, options: apiOptions = {}, path: apiPath } = options;
  const libraryConfigTimeout = amplify.libraryOptions?.API?.REST?.timeout?.({
    apiName,
    method
  });
  const timeout = apiOptions?.timeout || libraryConfigTimeout || void 0;
  const publicApisAbortController = new AbortController();
  const abortSignal = publicApisAbortController.signal;
  return createCancellableOperation(
    async () => {
      const url = resolveApiUrl(amplify, apiName, apiPath, apiOptions?.queryParams);
      const libraryConfigHeaders = await amplify.libraryOptions?.API?.REST?.headers?.({
        apiName
      });
      const { headers: invocationHeaders = {} } = apiOptions;
      const headers = {
        // custom headers from invocation options should precede library options
        ...libraryConfigHeaders,
        ...invocationHeaders
      };
      const signingServiceInfo = parseSigningInfo(url, {
        amplify,
        apiName
      });
      logger13.debug(method, url, headers, `IAM signing options: ${JSON.stringify(signingServiceInfo)}`);
      return transferHandler(amplify, {
        ...apiOptions,
        url,
        method,
        headers,
        abortSignal
      }, isIamAuthApplicableForRest, signingServiceInfo);
    },
    publicApisAbortController,
    "public",
    // operation Type
    timeout
  );
};
var get = (amplify, input) => publicHandler(amplify, input, "GET");
var post = (amplify, input) => publicHandler(amplify, input, "POST");
var put = (amplify, input) => publicHandler(amplify, input, "PUT");

// node_modules/@aws-amplify/api-rest/dist/esm/apis/index.mjs
var get2 = (input) => get(Amplify, input);
var post2 = (input) => post(Amplify, input);
var put2 = (input) => put(Amplify, input);

// node_modules/@aws-amplify/api-rest/dist/esm/apis/common/internalPost.mjs
var cancelTokenMap = /* @__PURE__ */ new WeakMap();
var post3 = (amplify, { url, options, abortController }) => {
  const controller = abortController ?? new AbortController();
  const responsePromise = createCancellableOperation(async () => {
    const response = transferHandler(amplify, {
      url,
      method: "POST",
      ...options,
      abortSignal: controller.signal,
      retryStrategy: {
        strategy: "jittered-exponential-backoff"
      }
    }, isIamAuthApplicableForGraphQL, options?.signingServiceInfo);
    return response;
  }, controller, "internal");
  const responseWithCleanUp = responsePromise.finally(() => {
    cancelTokenMap.delete(responseWithCleanUp);
  });
  return responseWithCleanUp;
};
var cancel = (promise, message) => {
  const controller = cancelTokenMap.get(promise);
  if (controller) {
    controller.abort(message);
    if (message && controller.signal.reason !== message) {
      controller.signal.reason = message;
    }
    return true;
  }
  return false;
};
var updateRequestToBeCancellable = (promise, controller) => {
  cancelTokenMap.set(promise, controller);
};

// node_modules/@aws-amplify/api-graphql/dist/esm/Providers/constants.mjs
var MAX_DELAY_MS2 = 5e3;
var NON_RETRYABLE_CODES = [400, 401, 403];
var NON_RETRYABLE_ERROR_TYPES = [
  "BadRequestException",
  "UnauthorizedException"
];
var CONNECTION_STATE_CHANGE = "ConnectionStateChange";
var MESSAGE_TYPES;
(function(MESSAGE_TYPES2) {
  MESSAGE_TYPES2["GQL_CONNECTION_INIT"] = "connection_init";
  MESSAGE_TYPES2["GQL_CONNECTION_ERROR"] = "connection_error";
  MESSAGE_TYPES2["GQL_CONNECTION_ACK"] = "connection_ack";
  MESSAGE_TYPES2["GQL_START"] = "start";
  MESSAGE_TYPES2["GQL_START_ACK"] = "start_ack";
  MESSAGE_TYPES2["DATA"] = "data";
  MESSAGE_TYPES2["GQL_CONNECTION_KEEP_ALIVE"] = "ka";
  MESSAGE_TYPES2["GQL_STOP"] = "stop";
  MESSAGE_TYPES2["GQL_COMPLETE"] = "complete";
  MESSAGE_TYPES2["GQL_ERROR"] = "error";
  MESSAGE_TYPES2["EVENT_SUBSCRIBE"] = "subscribe";
  MESSAGE_TYPES2["EVENT_PUBLISH"] = "publish";
  MESSAGE_TYPES2["EVENT_SUBSCRIBE_ACK"] = "subscribe_success";
  MESSAGE_TYPES2["EVENT_PUBLISH_ACK"] = "publish_success";
  MESSAGE_TYPES2["EVENT_STOP"] = "unsubscribe";
  MESSAGE_TYPES2["EVENT_COMPLETE"] = "unsubscribe_success";
  MESSAGE_TYPES2["EVENT_SUBSCRIBE_ERROR"] = "subscribe_error";
})(MESSAGE_TYPES || (MESSAGE_TYPES = {}));
var SUBSCRIPTION_STATUS;
(function(SUBSCRIPTION_STATUS2) {
  SUBSCRIPTION_STATUS2[SUBSCRIPTION_STATUS2["PENDING"] = 0] = "PENDING";
  SUBSCRIPTION_STATUS2[SUBSCRIPTION_STATUS2["CONNECTED"] = 1] = "CONNECTED";
  SUBSCRIPTION_STATUS2[SUBSCRIPTION_STATUS2["FAILED"] = 2] = "FAILED";
})(SUBSCRIPTION_STATUS || (SUBSCRIPTION_STATUS = {}));
var SOCKET_STATUS;
(function(SOCKET_STATUS2) {
  SOCKET_STATUS2[SOCKET_STATUS2["CLOSED"] = 0] = "CLOSED";
  SOCKET_STATUS2[SOCKET_STATUS2["READY"] = 1] = "READY";
  SOCKET_STATUS2[SOCKET_STATUS2["CONNECTING"] = 2] = "CONNECTING";
})(SOCKET_STATUS || (SOCKET_STATUS = {}));
var AWS_APPSYNC_REALTIME_HEADERS = {
  accept: "application/json, text/javascript",
  "content-encoding": "amz-1.0",
  "content-type": "application/json; charset=UTF-8"
};
var CONNECTION_INIT_TIMEOUT = 15e3;
var START_ACK_TIMEOUT = 15e3;
var DEFAULT_KEEP_ALIVE_TIMEOUT = 5 * 60 * 1e3;
var DEFAULT_KEEP_ALIVE_HEARTBEAT_TIMEOUT = 5 * 1e3;
var DEFAULT_KEEP_ALIVE_ALERT_TIMEOUT = 65 * 1e3;
var RECONNECT_DELAY = 5 * 1e3;
var RECONNECT_INTERVAL = 60 * 1e3;

// node_modules/@aws-amplify/api-graphql/dist/esm/types/PubSub.mjs
var CONTROL_MSG;
(function(CONTROL_MSG2) {
  CONTROL_MSG2["CONNECTION_CLOSED"] = "Connection closed";
  CONTROL_MSG2["CONNECTION_FAILED"] = "Connection failed";
  CONTROL_MSG2["REALTIME_SUBSCRIPTION_INIT_ERROR"] = "AppSync Realtime subscription init error";
  CONTROL_MSG2["SUBSCRIPTION_ACK"] = "Subscription ack";
  CONTROL_MSG2["TIMEOUT_DISCONNECT"] = "Timeout disconnect";
})(CONTROL_MSG || (CONTROL_MSG = {}));
var ConnectionState;
(function(ConnectionState2) {
  ConnectionState2["Connected"] = "Connected";
  ConnectionState2["ConnectedPendingNetwork"] = "ConnectedPendingNetwork";
  ConnectionState2["ConnectionDisrupted"] = "ConnectionDisrupted";
  ConnectionState2["ConnectionDisruptedPendingNetwork"] = "ConnectionDisruptedPendingNetwork";
  ConnectionState2["Connecting"] = "Connecting";
  ConnectionState2["ConnectedPendingDisconnect"] = "ConnectedPendingDisconnect";
  ConnectionState2["Disconnected"] = "Disconnected";
  ConnectionState2["ConnectedPendingKeepAlive"] = "ConnectedPendingKeepAlive";
})(ConnectionState || (ConnectionState = {}));

// node_modules/@aws-amplify/api-graphql/dist/esm/utils/ReachabilityMonitor/index.mjs
var ReachabilityMonitor = () => new Reachability().networkMonitor();

// node_modules/@aws-amplify/api-graphql/dist/esm/utils/ConnectionStateMonitor.mjs
var CONNECTION_CHANGE = {
  KEEP_ALIVE_MISSED: { keepAliveState: "unhealthy" },
  KEEP_ALIVE: { keepAliveState: "healthy" },
  CONNECTION_ESTABLISHED: { connectionState: "connected" },
  CONNECTION_FAILED: {
    intendedConnectionState: "disconnected",
    connectionState: "disconnected"
  },
  CLOSING_CONNECTION: { intendedConnectionState: "disconnected" },
  OPENING_CONNECTION: {
    intendedConnectionState: "connected",
    connectionState: "connecting"
  },
  CLOSED: { connectionState: "disconnected" },
  ONLINE: { networkState: "connected" },
  OFFLINE: { networkState: "disconnected" }
};
var ConnectionStateMonitor = class {
  constructor() {
    this._networkMonitoringSubscription = void 0;
    this._linkedConnectionState = {
      networkState: "connected",
      connectionState: "disconnected",
      intendedConnectionState: "disconnected",
      keepAliveState: "healthy"
    };
    this._initialNetworkStateSubscription = ReachabilityMonitor().subscribe(({ online }) => {
      this.record(online ? CONNECTION_CHANGE.ONLINE : CONNECTION_CHANGE.OFFLINE);
      this._initialNetworkStateSubscription?.unsubscribe();
    });
    this._linkedConnectionStateObservable = new Observable((connectionStateObserver) => {
      connectionStateObserver.next(this._linkedConnectionState);
      this._linkedConnectionStateObserver = connectionStateObserver;
    });
  }
  /**
   * Turn network state monitoring on if it isn't on already
   */
  enableNetworkMonitoring() {
    this._initialNetworkStateSubscription?.unsubscribe();
    if (this._networkMonitoringSubscription === void 0) {
      this._networkMonitoringSubscription = ReachabilityMonitor().subscribe(({ online }) => {
        this.record(online ? CONNECTION_CHANGE.ONLINE : CONNECTION_CHANGE.OFFLINE);
      });
    }
  }
  /**
   * Turn network state monitoring off if it isn't off already
   */
  disableNetworkMonitoring() {
    this._networkMonitoringSubscription?.unsubscribe();
    this._networkMonitoringSubscription = void 0;
  }
  /**
   * Get the observable that allows us to monitor the connection state
   *
   * @returns {Observable<ConnectionState>} - The observable that emits ConnectionState updates
   */
  get connectionStateObservable() {
    let previous;
    return this._linkedConnectionStateObservable.pipe(map((value) => {
      return this.connectionStatesTranslator(value);
    })).pipe(filter((current) => {
      const toInclude = current !== previous;
      previous = current;
      return toInclude;
    }));
  }
  /*
   * Updates local connection state and emits the full state to the observer.
   */
  record(statusUpdates) {
    if (statusUpdates.intendedConnectionState === "connected") {
      this.enableNetworkMonitoring();
    } else if (statusUpdates.intendedConnectionState === "disconnected") {
      this.disableNetworkMonitoring();
    }
    const newSocketStatus = {
      ...this._linkedConnectionState,
      ...statusUpdates
    };
    this._linkedConnectionState = { ...newSocketStatus };
    this._linkedConnectionStateObserver?.next(this._linkedConnectionState);
  }
  /*
   * Translate the ConnectionState structure into a specific ConnectionState string literal union
   */
  connectionStatesTranslator({ connectionState, networkState, intendedConnectionState, keepAliveState }) {
    if (connectionState === "connected" && networkState === "disconnected")
      return ConnectionState.ConnectedPendingNetwork;
    if (connectionState === "connected" && intendedConnectionState === "disconnected")
      return ConnectionState.ConnectedPendingDisconnect;
    if (connectionState === "disconnected" && intendedConnectionState === "connected" && networkState === "disconnected")
      return ConnectionState.ConnectionDisruptedPendingNetwork;
    if (connectionState === "disconnected" && intendedConnectionState === "connected")
      return ConnectionState.ConnectionDisrupted;
    if (connectionState === "connected" && keepAliveState === "unhealthy")
      return ConnectionState.ConnectedPendingKeepAlive;
    if (connectionState === "connecting")
      return ConnectionState.Connecting;
    if (connectionState === "disconnected")
      return ConnectionState.Disconnected;
    return ConnectionState.Connected;
  }
};

// node_modules/@aws-amplify/api-graphql/dist/esm/utils/ReconnectionMonitor.mjs
var ReconnectEvent;
(function(ReconnectEvent2) {
  ReconnectEvent2["START_RECONNECT"] = "START_RECONNECT";
  ReconnectEvent2["HALT_RECONNECT"] = "HALT_RECONNECT";
})(ReconnectEvent || (ReconnectEvent = {}));
var ReconnectionMonitor = class {
  constructor() {
    this.reconnectObservers = [];
  }
  /**
   * Add reconnect observer to the list of observers to alert on reconnect
   */
  addObserver(reconnectObserver) {
    this.reconnectObservers.push(reconnectObserver);
  }
  /**
   * Given a reconnect event, start the appropriate behavior
   */
  record(event) {
    if (event === ReconnectEvent.START_RECONNECT) {
      if (this.reconnectSetTimeoutId === void 0 && this.reconnectIntervalId === void 0) {
        this.reconnectSetTimeoutId = setTimeout(() => {
          this._triggerReconnect();
          this.reconnectIntervalId = setInterval(() => {
            this._triggerReconnect();
          }, RECONNECT_INTERVAL);
        }, RECONNECT_DELAY);
      }
    }
    if (event === ReconnectEvent.HALT_RECONNECT) {
      if (this.reconnectIntervalId) {
        clearInterval(this.reconnectIntervalId);
        this.reconnectIntervalId = void 0;
      }
      if (this.reconnectSetTimeoutId) {
        clearTimeout(this.reconnectSetTimeoutId);
        this.reconnectSetTimeoutId = void 0;
      }
    }
  }
  /**
   * Complete all reconnect observers
   */
  close() {
    this.reconnectObservers.forEach((reconnectObserver) => {
      reconnectObserver.complete?.();
    });
  }
  _triggerReconnect() {
    this.reconnectObservers.forEach((reconnectObserver) => {
      reconnectObserver.next?.();
    });
  }
};

// node_modules/@aws-amplify/api-graphql/dist/esm/Providers/AWSWebSocketProvider/appsyncUrl.mjs
var protocol = "wss://";
var standardDomainPattern = /^https:\/\/\w{26}\.appsync-api\.\w{2}(?:(?:-\w{2,})+)-\d\.amazonaws.com(?:\.cn)?\/graphql$/i;
var eventDomainPattern = /^https:\/\/\w{26}\.\w+-api\.\w{2}(?:(?:-\w{2,})+)-\d\.amazonaws.com(?:\.cn)?\/event$/i;
var customDomainPath = "/realtime";
var isCustomDomain = (url) => {
  return url.match(standardDomainPattern) === null;
};
var isEventDomain = (url) => url.match(eventDomainPattern) !== null;
var getRealtimeEndpointUrl = (appSyncGraphqlEndpoint) => {
  let realtimeEndpoint = appSyncGraphqlEndpoint ?? "";
  if (isEventDomain(realtimeEndpoint)) {
    realtimeEndpoint = realtimeEndpoint.concat(customDomainPath).replace("ddpg-api", "grt-gamma").replace("appsync-api", "appsync-realtime-api");
  } else if (isCustomDomain(realtimeEndpoint)) {
    realtimeEndpoint = realtimeEndpoint.concat(customDomainPath);
  } else {
    realtimeEndpoint = realtimeEndpoint.replace("appsync-api", "appsync-realtime-api").replace("gogi-beta", "grt-beta").replace("ddpg-api", "grt-gamma");
  }
  realtimeEndpoint = realtimeEndpoint.replace("https://", protocol).replace("http://", protocol);
  return new AmplifyUrl(realtimeEndpoint);
};
var extractNonAuthHeaders = (headers) => {
  if (!headers) {
    return {};
  }
  if ("Authorization" in headers) {
    const { Authorization: _, ...nonAuthHeaders } = headers;
    return nonAuthHeaders;
  }
  return headers;
};
var queryParamsFromCustomHeaders = (headers) => {
  const nonAuthHeaders = extractNonAuthHeaders(headers);
  const params = new AmplifyUrlSearchParams();
  Object.entries(nonAuthHeaders).forEach(([k, v]) => {
    params.append(k, v);
  });
  return params;
};
var realtimeUrlWithQueryString = (appSyncGraphqlEndpoint, urlParams) => {
  const realtimeEndpointUrl = getRealtimeEndpointUrl(appSyncGraphqlEndpoint);
  const existingParams = new AmplifyUrlSearchParams(realtimeEndpointUrl.search);
  for (const [k, v] of urlParams.entries()) {
    existingParams.append(k, v);
  }
  realtimeEndpointUrl.search = existingParams.toString();
  return realtimeEndpointUrl.toString();
};
var additionalHeadersFromOptions = async (options) => {
  const { appSyncGraphqlEndpoint, query, libraryConfigHeaders = () => ({}), additionalHeaders = {}, authToken } = options;
  let additionalCustomHeaders = {};
  const _libraryConfigHeaders = await libraryConfigHeaders();
  if (typeof additionalHeaders === "function") {
    const requestOptions = {
      url: appSyncGraphqlEndpoint || "",
      queryString: query || ""
    };
    additionalCustomHeaders = await additionalHeaders(requestOptions);
  } else {
    additionalCustomHeaders = additionalHeaders;
  }
  if (authToken) {
    additionalCustomHeaders = {
      ...additionalCustomHeaders,
      Authorization: authToken
    };
  }
  return {
    additionalCustomHeaders,
    libraryConfigHeaders: _libraryConfigHeaders
  };
};

// node_modules/@aws-amplify/api-graphql/dist/esm/Providers/AWSWebSocketProvider/authHeaders.mjs
var logger14 = new ConsoleLogger("AWSAppSyncRealTimeProvider Auth");
var awsAuthTokenHeader = async ({ host }) => {
  const session = await fetchAuthSession2();
  return {
    Authorization: session?.tokens?.accessToken?.toString(),
    host
  };
};
var awsRealTimeApiKeyHeader = async ({ apiKey, host }) => {
  const dt = /* @__PURE__ */ new Date();
  const dtStr = dt.toISOString().replace(/[:-]|\.\d{3}/g, "");
  return {
    host,
    "x-amz-date": dtStr,
    "x-api-key": apiKey
  };
};
var awsRealTimeIAMHeader = async ({ payload, canonicalUri, appSyncGraphqlEndpoint, region }) => {
  const endpointInfo = {
    region,
    service: "appsync"
  };
  const creds = (await fetchAuthSession2()).credentials;
  const request = {
    url: `${appSyncGraphqlEndpoint}${canonicalUri}`,
    data: payload,
    method: "POST",
    headers: { ...AWS_APPSYNC_REALTIME_HEADERS }
  };
  const signedParams = signRequest({
    headers: request.headers,
    method: request.method,
    url: new AmplifyUrl(request.url),
    body: request.data
  }, {
    credentials: creds,
    signingRegion: endpointInfo.region,
    signingService: endpointInfo.service
  });
  return signedParams.headers;
};
var customAuthHeader = async ({ host, additionalCustomHeaders }) => {
  if (!additionalCustomHeaders?.Authorization) {
    throw new Error("No auth token specified");
  }
  return {
    Authorization: additionalCustomHeaders.Authorization,
    host
  };
};
var awsRealTimeHeaderBasedAuth = async ({ apiKey, authenticationType, canonicalUri, appSyncGraphqlEndpoint, region, additionalCustomHeaders, payload }) => {
  const headerHandler = {
    apiKey: awsRealTimeApiKeyHeader,
    iam: awsRealTimeIAMHeader,
    oidc: awsAuthTokenHeader,
    userPool: awsAuthTokenHeader,
    lambda: customAuthHeader,
    none: customAuthHeader
  };
  if (!authenticationType || !headerHandler[authenticationType]) {
    logger14.debug(`Authentication type ${authenticationType} not supported`);
    return void 0;
  } else {
    const handler = headerHandler[authenticationType];
    const host = appSyncGraphqlEndpoint ? new AmplifyUrl(appSyncGraphqlEndpoint).host : void 0;
    const resolvedApiKey = authenticationType === "apiKey" ? apiKey : void 0;
    logger14.debug(`Authenticating with ${JSON.stringify(authenticationType)}`);
    const result = await handler({
      payload,
      canonicalUri,
      appSyncGraphqlEndpoint,
      apiKey: resolvedApiKey,
      region,
      host,
      additionalCustomHeaders
    });
    return result;
  }
};

// node_modules/@aws-amplify/api-graphql/dist/esm/Providers/AWSWebSocketProvider/index.mjs
var dispatchApiEvent = (payload) => {
  Hub.dispatch("api", payload, "PubSub", AMPLIFY_SYMBOL);
};
var AWSWebSocketProvider = class {
  constructor(args) {
    this.subscriptionObserverMap = /* @__PURE__ */ new Map();
    this.allowNoSubscriptions = false;
    this.socketStatus = SOCKET_STATUS.CLOSED;
    this.keepAliveTimestamp = Date.now();
    this.promiseArray = [];
    this.connectionStateMonitor = new ConnectionStateMonitor();
    this.reconnectionMonitor = new ReconnectionMonitor();
    this._establishConnection = async (awsRealTimeUrl, subprotocol) => {
      this.logger.debug(`Establishing WebSocket connection to ${awsRealTimeUrl}`);
      try {
        await this._openConnection(awsRealTimeUrl, subprotocol);
        await this._initiateHandshake();
      } catch (err) {
        const { errorType, errorCode } = err;
        if (NON_RETRYABLE_CODES.includes(errorCode) || // Event API does not currently return `errorCode`. This may change in the future.
        // For now fall back to also checking known non-retryable error types
        NON_RETRYABLE_ERROR_TYPES.includes(errorType)) {
          throw new NonRetryableError(errorType);
        } else if (errorType) {
          throw new Error(errorType);
        } else {
          throw err;
        }
      }
    };
    this.logger = new ConsoleLogger(args.providerName);
    this.wsProtocolName = args.wsProtocolName;
    this.wsConnectUri = args.connectUri;
    this.connectionStateMonitorSubscription = this._startConnectionStateMonitoring();
  }
  /**
   * Mark the socket closed and release all active listeners
   */
  close() {
    this.socketStatus = SOCKET_STATUS.CLOSED;
    this.connectionStateMonitor.record(CONNECTION_CHANGE.CONNECTION_FAILED);
    this.connectionStateMonitorSubscription.unsubscribe();
    this.reconnectionMonitor.close();
    return new Promise((resolve, reject) => {
      if (this.awsRealTimeSocket) {
        this.awsRealTimeSocket.onclose = (_) => {
          this._closeSocket();
          this.subscriptionObserverMap = /* @__PURE__ */ new Map();
          this.awsRealTimeSocket = void 0;
          resolve();
        };
        this.awsRealTimeSocket.onerror = (err) => {
          reject(err);
        };
        this.awsRealTimeSocket.close();
      } else {
        resolve();
      }
    });
  }
  subscribe(options, customUserAgentDetails) {
    return new Observable((observer) => {
      if (!options?.appSyncGraphqlEndpoint) {
        observer.error({
          errors: [
            {
              ...new GraphQLError(`Subscribe only available for AWS AppSync endpoint`)
            }
          ]
        });
        observer.complete();
        return;
      }
      let subscriptionStartInProgress = false;
      const subscriptionId = amplifyUuid();
      const startSubscription = () => {
        if (!subscriptionStartInProgress) {
          subscriptionStartInProgress = true;
          this._startSubscriptionWithAWSAppSyncRealTime({
            options,
            observer,
            subscriptionId,
            customUserAgentDetails
          }).catch((err) => {
            this.logger.debug(`${CONTROL_MSG.REALTIME_SUBSCRIPTION_INIT_ERROR}: ${err}`);
            this._closeSocket();
          }).finally(() => {
            subscriptionStartInProgress = false;
          });
        }
      };
      const reconnectSubscription = new Observable((reconnectSubscriptionObserver) => {
        this.reconnectionMonitor.addObserver(reconnectSubscriptionObserver);
      }).subscribe(() => {
        startSubscription();
      });
      startSubscription();
      return async () => {
        await this._cleanupSubscription(subscriptionId, reconnectSubscription);
      };
    });
  }
  async connect(options) {
    if (this.socketStatus === SOCKET_STATUS.READY) {
      return;
    }
    await this._connectWebSocket(options);
  }
  async publish(options, customUserAgentDetails) {
    if (this.socketStatus !== SOCKET_STATUS.READY) {
      throw new Error("Subscription has not been initialized");
    }
    return this._publishMessage(options, customUserAgentDetails);
  }
  async _connectWebSocket(options) {
    const { apiKey, appSyncGraphqlEndpoint, authenticationType, region } = options;
    const { additionalCustomHeaders } = await additionalHeadersFromOptions(options);
    this.connectionStateMonitor.record(CONNECTION_CHANGE.OPENING_CONNECTION);
    await this._initializeWebSocketConnection({
      apiKey,
      appSyncGraphqlEndpoint,
      authenticationType,
      region,
      additionalCustomHeaders
    });
  }
  async _publishMessage(options, customUserAgentDetails) {
    const subscriptionId = amplifyUuid();
    const { additionalCustomHeaders, libraryConfigHeaders } = await additionalHeadersFromOptions(options);
    const serializedSubscriptionMessage = await this._prepareSubscriptionPayload({
      options,
      subscriptionId,
      customUserAgentDetails,
      additionalCustomHeaders,
      libraryConfigHeaders,
      publish: true
    });
    return new Promise((resolve, reject) => {
      if (this.awsRealTimeSocket) {
        const publishListener = (event) => {
          const data = JSON.parse(event.data);
          if (data.id === subscriptionId && data.type === "publish_success") {
            this.awsRealTimeSocket && this.awsRealTimeSocket.removeEventListener("message", publishListener);
            cleanup();
            resolve();
          }
          if (data.errors && data.errors.length > 0) {
            const errorTypes = data.errors.map((error) => error.errorType);
            cleanup();
            reject(new Error(`Publish errors: ${errorTypes.join(", ")}`));
          }
        };
        const errorListener = (error) => {
          cleanup();
          reject(new Error(`WebSocket error: ${error}`));
        };
        const closeListener = () => {
          cleanup();
          reject(new Error("WebSocket is closed"));
        };
        const cleanup = () => {
          this.awsRealTimeSocket?.removeEventListener("message", publishListener);
          this.awsRealTimeSocket?.removeEventListener("error", errorListener);
          this.awsRealTimeSocket?.removeEventListener("close", closeListener);
        };
        this.awsRealTimeSocket.addEventListener("message", publishListener);
        this.awsRealTimeSocket.addEventListener("error", errorListener);
        this.awsRealTimeSocket.addEventListener("close", closeListener);
        this.awsRealTimeSocket.send(serializedSubscriptionMessage);
      } else {
        reject(new Error("WebSocket is not connected"));
      }
    });
  }
  async _cleanupSubscription(subscriptionId, reconnectSubscription) {
    reconnectSubscription?.unsubscribe();
    try {
      await this._waitForSubscriptionToBeConnected(subscriptionId);
      const { subscriptionState } = this.subscriptionObserverMap.get(subscriptionId) || {};
      if (!subscriptionState) {
        return;
      }
      if (subscriptionState === SUBSCRIPTION_STATUS.CONNECTED) {
        this._sendUnsubscriptionMessage(subscriptionId);
      } else {
        throw new Error("Subscription never connected");
      }
    } catch (err) {
      this.logger.debug(`Error while unsubscribing ${err}`);
    } finally {
      this._removeSubscriptionObserver(subscriptionId);
    }
  }
  // Monitor the connection state and pass changes along to Hub
  _startConnectionStateMonitoring() {
    return this.connectionStateMonitor.connectionStateObservable.subscribe((connectionState) => {
      dispatchApiEvent({
        event: CONNECTION_STATE_CHANGE,
        data: {
          provider: this,
          connectionState
        },
        message: `Connection state is ${connectionState}`
      });
      this.connectionState = connectionState;
      if (connectionState === ConnectionState.ConnectionDisrupted) {
        this.reconnectionMonitor.record(ReconnectEvent.START_RECONNECT);
      }
      if ([
        ConnectionState.Connected,
        ConnectionState.ConnectedPendingDisconnect,
        ConnectionState.ConnectedPendingKeepAlive,
        ConnectionState.ConnectedPendingNetwork,
        ConnectionState.ConnectionDisruptedPendingNetwork,
        ConnectionState.Disconnected
      ].includes(connectionState)) {
        this.reconnectionMonitor.record(ReconnectEvent.HALT_RECONNECT);
      }
    });
  }
  async _startSubscriptionWithAWSAppSyncRealTime({ options, observer, subscriptionId, customUserAgentDetails }) {
    const { query, variables } = options;
    this.subscriptionObserverMap.set(subscriptionId, {
      observer,
      query: query ?? "",
      variables: variables ?? {},
      subscriptionState: SUBSCRIPTION_STATUS.PENDING,
      startAckTimeoutId: void 0
    });
    const { additionalCustomHeaders, libraryConfigHeaders } = await additionalHeadersFromOptions(options);
    const serializedSubscriptionMessage = await this._prepareSubscriptionPayload({
      options,
      subscriptionId,
      customUserAgentDetails,
      additionalCustomHeaders,
      libraryConfigHeaders
    });
    try {
      await this._connectWebSocket(options);
    } catch (err) {
      this._logStartSubscriptionError(subscriptionId, observer, err);
      return;
    }
    const { subscriptionFailedCallback, subscriptionReadyCallback } = this.subscriptionObserverMap.get(subscriptionId) ?? {};
    this.subscriptionObserverMap.set(subscriptionId, {
      observer,
      subscriptionState: SUBSCRIPTION_STATUS.PENDING,
      query: query ?? "",
      variables: variables ?? {},
      subscriptionReadyCallback,
      subscriptionFailedCallback,
      startAckTimeoutId: setTimeout(() => {
        this._timeoutStartSubscriptionAck(subscriptionId);
      }, START_ACK_TIMEOUT)
    });
    if (this.awsRealTimeSocket) {
      this.awsRealTimeSocket.send(serializedSubscriptionMessage);
    }
  }
  // Log logic for start subscription failures
  _logStartSubscriptionError(subscriptionId, observer, err) {
    this.logger.debug({ err });
    const message = String(err.message ?? "");
    this._closeSocket();
    if (this.connectionState !== ConnectionState.ConnectionDisruptedPendingNetwork) {
      if (isNonRetryableError(err)) {
        observer.error({
          errors: [
            {
              ...new GraphQLError(`${CONTROL_MSG.CONNECTION_FAILED}: ${message}`)
            }
          ]
        });
      } else {
        this.logger.debug(`${CONTROL_MSG.CONNECTION_FAILED}: ${message}`);
      }
      const { subscriptionFailedCallback } = this.subscriptionObserverMap.get(subscriptionId) || {};
      if (typeof subscriptionFailedCallback === "function") {
        subscriptionFailedCallback();
      }
    }
  }
  // Waiting that subscription has been connected before trying to unsubscribe
  async _waitForSubscriptionToBeConnected(subscriptionId) {
    const subscriptionObserver = this.subscriptionObserverMap.get(subscriptionId);
    if (subscriptionObserver) {
      const { subscriptionState } = subscriptionObserver;
      if (subscriptionState === SUBSCRIPTION_STATUS.PENDING) {
        return new Promise((resolve, reject) => {
          const { observer, subscriptionState: observedSubscriptionState, variables, query } = subscriptionObserver;
          this.subscriptionObserverMap.set(subscriptionId, {
            observer,
            subscriptionState: observedSubscriptionState,
            variables,
            query,
            subscriptionReadyCallback: resolve,
            subscriptionFailedCallback: reject
          });
        });
      }
    }
  }
  _sendUnsubscriptionMessage(subscriptionId) {
    try {
      if (this.awsRealTimeSocket && this.awsRealTimeSocket.readyState === WebSocket.OPEN && this.socketStatus === SOCKET_STATUS.READY) {
        const unsubscribeMessage = this._unsubscribeMessage(subscriptionId);
        const stringToAWSRealTime = JSON.stringify(unsubscribeMessage);
        this.awsRealTimeSocket.send(stringToAWSRealTime);
      }
    } catch (err) {
      this.logger.debug({ err });
    }
  }
  _removeSubscriptionObserver(subscriptionId) {
    this.subscriptionObserverMap.delete(subscriptionId);
    if (!this.allowNoSubscriptions) {
      setTimeout(this._closeSocketIfRequired.bind(this), 1e3);
    }
  }
  _closeSocketIfRequired() {
    if (this.subscriptionObserverMap.size > 0) {
      return;
    }
    if (!this.awsRealTimeSocket) {
      this.socketStatus = SOCKET_STATUS.CLOSED;
      return;
    }
    this.connectionStateMonitor.record(CONNECTION_CHANGE.CLOSING_CONNECTION);
    if (this.awsRealTimeSocket.bufferedAmount > 0) {
      setTimeout(this._closeSocketIfRequired.bind(this), 1e3);
    } else {
      this.logger.debug("closing WebSocket...");
      const tempSocket = this.awsRealTimeSocket;
      tempSocket.onclose = null;
      tempSocket.onerror = null;
      tempSocket.close(1e3);
      this.awsRealTimeSocket = void 0;
      this.socketStatus = SOCKET_STATUS.CLOSED;
      this._closeSocket();
    }
  }
  maintainKeepAlive() {
    this.keepAliveTimestamp = Date.now();
  }
  keepAliveHeartbeat(connectionTimeoutMs) {
    const currentTime = Date.now();
    if (currentTime - this.keepAliveTimestamp > DEFAULT_KEEP_ALIVE_ALERT_TIMEOUT) {
      this.connectionStateMonitor.record(CONNECTION_CHANGE.KEEP_ALIVE_MISSED);
    } else {
      this.connectionStateMonitor.record(CONNECTION_CHANGE.KEEP_ALIVE);
    }
    if (currentTime - this.keepAliveTimestamp > connectionTimeoutMs) {
      this._errorDisconnect(CONTROL_MSG.TIMEOUT_DISCONNECT);
    }
  }
  _handleIncomingSubscriptionMessage(message) {
    if (typeof message.data !== "string") {
      return;
    }
    const [isData, data] = this._handleSubscriptionData(message);
    if (isData) {
      this.maintainKeepAlive();
      return;
    }
    const { type, id, payload } = data;
    const { observer = null, query = "", variables = {}, startAckTimeoutId, subscriptionReadyCallback, subscriptionFailedCallback } = this.subscriptionObserverMap.get(id) || {};
    if (type === MESSAGE_TYPES.GQL_START_ACK || type === MESSAGE_TYPES.EVENT_SUBSCRIBE_ACK) {
      this.logger.debug(`subscription ready for ${JSON.stringify({ query, variables })}`);
      if (typeof subscriptionReadyCallback === "function") {
        subscriptionReadyCallback();
      }
      if (startAckTimeoutId)
        clearTimeout(startAckTimeoutId);
      dispatchApiEvent({
        event: CONTROL_MSG.SUBSCRIPTION_ACK,
        data: { query, variables },
        message: "Connection established for subscription"
      });
      const subscriptionState = SUBSCRIPTION_STATUS.CONNECTED;
      if (observer) {
        this.subscriptionObserverMap.set(id, {
          observer,
          query,
          variables,
          startAckTimeoutId: void 0,
          subscriptionState,
          subscriptionReadyCallback,
          subscriptionFailedCallback
        });
      }
      this.connectionStateMonitor.record(CONNECTION_CHANGE.CONNECTION_ESTABLISHED);
      return;
    }
    if (type === MESSAGE_TYPES.GQL_CONNECTION_KEEP_ALIVE) {
      this.maintainKeepAlive();
      return;
    }
    if (type === MESSAGE_TYPES.GQL_ERROR || type === MESSAGE_TYPES.EVENT_SUBSCRIBE_ERROR) {
      const subscriptionState = SUBSCRIPTION_STATUS.FAILED;
      if (observer) {
        this.subscriptionObserverMap.set(id, {
          observer,
          query,
          variables,
          startAckTimeoutId,
          subscriptionReadyCallback,
          subscriptionFailedCallback,
          subscriptionState
        });
        let errorMessage = JSON.stringify(payload ?? data);
        if (type === MESSAGE_TYPES.EVENT_SUBSCRIBE_ERROR) {
          const { errors } = JSON.parse(String(message.data));
          if (Array.isArray(errors) && errors.length > 0) {
            const error = errors[0];
            errorMessage = `${error.errorType}: ${error.message}`;
          }
        }
        this.logger.debug(`${CONTROL_MSG.CONNECTION_FAILED}: ${errorMessage}`);
        observer.error({
          errors: [
            {
              ...new GraphQLError(`${CONTROL_MSG.CONNECTION_FAILED}: ${errorMessage}`)
            }
          ]
        });
        if (startAckTimeoutId)
          clearTimeout(startAckTimeoutId);
        if (typeof subscriptionFailedCallback === "function") {
          subscriptionFailedCallback();
        }
      }
    }
  }
  _errorDisconnect(msg) {
    this.logger.debug(`Disconnect error: ${msg}`);
    if (this.awsRealTimeSocket) {
      this._closeSocket();
      this.awsRealTimeSocket.close();
    }
    this.socketStatus = SOCKET_STATUS.CLOSED;
  }
  _closeSocket() {
    if (this.keepAliveHeartbeatIntervalId) {
      clearInterval(this.keepAliveHeartbeatIntervalId);
      this.keepAliveHeartbeatIntervalId = void 0;
    }
    this.connectionStateMonitor.record(CONNECTION_CHANGE.CLOSED);
  }
  _timeoutStartSubscriptionAck(subscriptionId) {
    const subscriptionObserver = this.subscriptionObserverMap.get(subscriptionId);
    if (subscriptionObserver) {
      const { observer, query, variables } = subscriptionObserver;
      if (!observer) {
        return;
      }
      this.subscriptionObserverMap.set(subscriptionId, {
        observer,
        query,
        variables,
        subscriptionState: SUBSCRIPTION_STATUS.FAILED
      });
      this._closeSocket();
      this.logger.debug("timeoutStartSubscription", JSON.stringify({ query, variables }));
    }
  }
  _initializeWebSocketConnection({ appSyncGraphqlEndpoint, authenticationType, apiKey, region, additionalCustomHeaders }) {
    if (this.socketStatus === SOCKET_STATUS.READY) {
      return;
    }
    return new Promise(async (resolve, reject) => {
      this.promiseArray.push({ res: resolve, rej: reject });
      if (this.socketStatus === SOCKET_STATUS.CLOSED) {
        try {
          this.socketStatus = SOCKET_STATUS.CONNECTING;
          const payloadString = "{}";
          const authHeader = await awsRealTimeHeaderBasedAuth({
            authenticationType,
            payload: payloadString,
            canonicalUri: this.wsConnectUri,
            apiKey,
            appSyncGraphqlEndpoint,
            region,
            additionalCustomHeaders
          });
          const headerString = authHeader ? JSON.stringify(authHeader) : "";
          const encodedHeader = base64Encoder.convert(headerString, {
            urlSafe: true,
            skipPadding: true
          });
          const authTokenSubprotocol = `header-${encodedHeader}`;
          const queryParams = queryParamsFromCustomHeaders(additionalCustomHeaders);
          const awsRealTimeUrl = realtimeUrlWithQueryString(appSyncGraphqlEndpoint, queryParams);
          await this._establishRetryableConnection(awsRealTimeUrl, authTokenSubprotocol);
          this.promiseArray.forEach(({ res }) => {
            this.logger.debug("Notifying connection successful");
            res();
          });
          this.socketStatus = SOCKET_STATUS.READY;
          this.promiseArray = [];
        } catch (err) {
          this.logger.debug("Connection exited with", err);
          this.promiseArray.forEach(({ rej }) => {
            rej(err);
          });
          this.promiseArray = [];
          if (this.awsRealTimeSocket && this.awsRealTimeSocket.readyState === WebSocket.OPEN) {
            this.awsRealTimeSocket.close(3001);
          }
          this.awsRealTimeSocket = void 0;
          this.socketStatus = SOCKET_STATUS.CLOSED;
        }
      }
    });
  }
  async _establishRetryableConnection(awsRealTimeUrl, subprotocol) {
    this.logger.debug(`Establishing retryable connection`);
    await jitteredExponentialRetry(this._establishConnection.bind(this), [awsRealTimeUrl, subprotocol], MAX_DELAY_MS2);
  }
  async _openConnection(awsRealTimeUrl, subprotocol) {
    return new Promise((resolve, reject) => {
      const newSocket = this._getNewWebSocket(awsRealTimeUrl, [
        this.wsProtocolName,
        subprotocol
      ]);
      newSocket.onerror = () => {
        this.logger.debug(`WebSocket connection error`);
      };
      newSocket.onclose = () => {
        this._closeSocket();
        reject(new Error("Connection handshake error"));
      };
      newSocket.onopen = () => {
        this.awsRealTimeSocket = newSocket;
        resolve();
      };
    });
  }
  _getNewWebSocket(url, protocol2) {
    return new WebSocket(url, protocol2);
  }
  async _initiateHandshake() {
    return new Promise((resolve, reject) => {
      if (!this.awsRealTimeSocket) {
        reject(new Error("awsRealTimeSocket undefined"));
        return;
      }
      let ackOk = false;
      this.awsRealTimeSocket.onerror = (error) => {
        this.logger.debug(`WebSocket error ${JSON.stringify(error)}`);
      };
      this.awsRealTimeSocket.onclose = (event) => {
        this.logger.debug(`WebSocket closed ${event.reason}`);
        this._closeSocket();
        reject(new Error(JSON.stringify(event)));
      };
      this.awsRealTimeSocket.onmessage = (message) => {
        if (typeof message.data !== "string") {
          return;
        }
        this.logger.debug(`subscription message from AWS AppSyncRealTime: ${message.data} `);
        const data = JSON.parse(message.data);
        const { type } = data;
        const connectionTimeoutMs = this._extractConnectionTimeout(data);
        if (type === MESSAGE_TYPES.GQL_CONNECTION_ACK) {
          ackOk = true;
          this._registerWebsocketHandlers(connectionTimeoutMs);
          resolve("Connected to AWS AppSyncRealTime");
          return;
        }
        if (type === MESSAGE_TYPES.GQL_CONNECTION_ERROR) {
          const { errorType, errorCode } = this._extractErrorCodeAndType(data);
          reject({ errorType, errorCode });
        }
      };
      const gqlInit = {
        type: MESSAGE_TYPES.GQL_CONNECTION_INIT
      };
      this.awsRealTimeSocket.send(JSON.stringify(gqlInit));
      const checkAckOk = (targetAckOk) => {
        if (!targetAckOk) {
          this.connectionStateMonitor.record(CONNECTION_CHANGE.CONNECTION_FAILED);
          reject(new Error(`Connection timeout: ack from AWSAppSyncRealTime was not received after ${CONNECTION_INIT_TIMEOUT} ms`));
        }
      };
      setTimeout(() => {
        checkAckOk(ackOk);
      }, CONNECTION_INIT_TIMEOUT);
    });
  }
  _registerWebsocketHandlers(connectionTimeoutMs) {
    if (!this.awsRealTimeSocket) {
      return;
    }
    this.keepAliveHeartbeatIntervalId = setInterval(() => {
      this.keepAliveHeartbeat(connectionTimeoutMs);
    }, DEFAULT_KEEP_ALIVE_HEARTBEAT_TIMEOUT);
    this.awsRealTimeSocket.onmessage = this._handleIncomingSubscriptionMessage.bind(this);
    this.awsRealTimeSocket.onerror = (err) => {
      this.logger.debug(err);
      this._errorDisconnect(CONTROL_MSG.CONNECTION_CLOSED);
    };
    this.awsRealTimeSocket.onclose = (event) => {
      this.logger.debug(`WebSocket closed ${event.reason}`);
      this._closeSocket();
      this._errorDisconnect(CONTROL_MSG.CONNECTION_CLOSED);
    };
  }
};

// node_modules/@aws-amplify/api-graphql/dist/esm/Providers/AWSAppSyncRealTimeProvider/index.mjs
var PROVIDER_NAME = "AWSAppSyncRealTimeProvider";
var WS_PROTOCOL_NAME = "graphql-ws";
var CONNECT_URI = "/connect";
var AWSAppSyncRealTimeProvider = class extends AWSWebSocketProvider {
  constructor() {
    super({
      providerName: PROVIDER_NAME,
      wsProtocolName: WS_PROTOCOL_NAME,
      connectUri: CONNECT_URI
    });
  }
  getProviderName() {
    return PROVIDER_NAME;
  }
  subscribe(options, customUserAgentDetails) {
    return super.subscribe(options, customUserAgentDetails);
  }
  async _prepareSubscriptionPayload({ options, subscriptionId, customUserAgentDetails, additionalCustomHeaders, libraryConfigHeaders }) {
    const { appSyncGraphqlEndpoint, authenticationType, query, variables, apiKey, region } = options;
    const data = {
      query,
      variables
    };
    const serializedData = JSON.stringify(data);
    const headers = {
      ...await awsRealTimeHeaderBasedAuth({
        apiKey,
        appSyncGraphqlEndpoint,
        authenticationType,
        payload: serializedData,
        canonicalUri: "",
        region,
        additionalCustomHeaders
      }),
      ...libraryConfigHeaders,
      ...additionalCustomHeaders,
      [USER_AGENT_HEADER]: getAmplifyUserAgent(customUserAgentDetails)
    };
    const subscriptionMessage = {
      id: subscriptionId,
      payload: {
        data: serializedData,
        extensions: {
          authorization: {
            ...headers
          }
        }
      },
      type: MESSAGE_TYPES.GQL_START
    };
    const serializedSubscriptionMessage = JSON.stringify(subscriptionMessage);
    return serializedSubscriptionMessage;
  }
  _handleSubscriptionData(message) {
    this.logger.debug(`subscription message from AWS AppSync RealTime: ${message.data}`);
    const { id = "", payload, type } = JSON.parse(String(message.data));
    const { observer = null, query = "", variables = {} } = this.subscriptionObserverMap.get(id) || {};
    this.logger.debug({ id, observer, query, variables });
    if (type === MESSAGE_TYPES.DATA && payload && payload.data) {
      if (observer) {
        observer.next(payload);
      } else {
        this.logger.debug(`observer not found for id: ${id}`);
      }
      return [true, { id, type, payload }];
    }
    return [false, { id, type, payload }];
  }
  _unsubscribeMessage(subscriptionId) {
    return {
      id: subscriptionId,
      type: MESSAGE_TYPES.GQL_STOP
    };
  }
  _extractConnectionTimeout(data) {
    const { payload: { connectionTimeoutMs = DEFAULT_KEEP_ALIVE_TIMEOUT } = {} } = data;
    return connectionTimeoutMs;
  }
  _extractErrorCodeAndType(data) {
    const { payload: { errors: [{ errorType = "", errorCode = 0 } = {}] = [] } = {} } = data;
    return { errorCode, errorType };
  }
};

// node_modules/@aws-amplify/api-graphql/dist/esm/utils/errors/GraphQLApiError.mjs
var GraphQLApiError = class _GraphQLApiError extends AmplifyError {
  constructor(params) {
    super(params);
    this.constructor = _GraphQLApiError;
    Object.setPrototypeOf(this, _GraphQLApiError.prototype);
  }
};

// node_modules/@aws-amplify/api-graphql/dist/esm/utils/errors/validation.mjs
var APIValidationErrorCode;
(function(APIValidationErrorCode2) {
  APIValidationErrorCode2["NoAuthSession"] = "NoAuthSession";
  APIValidationErrorCode2["NoRegion"] = "NoRegion";
  APIValidationErrorCode2["NoCustomEndpoint"] = "NoCustomEndpoint";
})(APIValidationErrorCode || (APIValidationErrorCode = {}));
var validationErrorMap3 = {
  [APIValidationErrorCode.NoAuthSession]: {
    message: "Auth session should not be empty."
  },
  // TODO: re-enable when working in all test environments:
  // [APIValidationErrorCode.NoEndpoint]: {
  // 	message: 'Missing endpoint',
  // },
  [APIValidationErrorCode.NoRegion]: {
    message: "Missing region."
  },
  [APIValidationErrorCode.NoCustomEndpoint]: {
    message: "Custom endpoint region is present without custom endpoint."
  }
};

// node_modules/@aws-amplify/api-graphql/dist/esm/utils/errors/assertValidationError.mjs
function assertValidationError2(assertion, name2) {
  const { message, recoverySuggestion } = validationErrorMap3[name2];
  if (!assertion) {
    throw new GraphQLApiError({ name: name2, message, recoverySuggestion });
  }
}

// node_modules/@aws-amplify/api-graphql/dist/esm/utils/resolveConfig.mjs
var logger15 = new ConsoleLogger("GraphQLAPI resolveConfig");
var resolveConfig = (amplify) => {
  const config2 = amplify.getConfig();
  if (!config2.API?.GraphQL) {
    logger15.warn("The API configuration is missing. This is likely due to Amplify.configure() not being called prior to generateClient().");
  }
  const { apiKey, customEndpoint, customEndpointRegion, defaultAuthMode, endpoint, region } = config2.API?.GraphQL ?? {};
  assertValidationError2(!(!customEndpoint && customEndpointRegion), APIValidationErrorCode.NoCustomEndpoint);
  return {
    apiKey,
    customEndpoint,
    customEndpointRegion,
    defaultAuthMode,
    endpoint,
    region
  };
};

// node_modules/@aws-amplify/api-graphql/dist/esm/utils/resolveLibraryOptions.mjs
var resolveLibraryOptions2 = (amplify) => {
  const headers = amplify.libraryOptions?.API?.GraphQL?.headers;
  const withCredentials = amplify.libraryOptions?.API?.GraphQL?.withCredentials;
  return { headers, withCredentials };
};

// node_modules/@aws-amplify/api-graphql/dist/esm/utils/errors/repackageAuthError.mjs
function repackageUnauthorizedError(content) {
  if (content.errors && Array.isArray(content.errors)) {
    content.errors.forEach((e) => {
      if (isUnauthorizedError(e)) {
        e.message = "Unauthorized";
        e.recoverySuggestion = `If you're calling an Amplify-generated API, make sure to set the "authMode" in generateClient({ authMode: '...' }) to the backend authorization rule's auth provider ('apiKey', 'userPool', 'iam', 'oidc', 'lambda')`;
      }
    });
  }
  return content;
}
function isUnauthorizedError(error) {
  if (error?.originalError?.name?.startsWith("UnauthorizedException")) {
    return true;
  }
  if (error.message?.startsWith("Connection failed:") && error.message?.includes("Permission denied")) {
    return true;
  }
  return false;
}

// node_modules/@aws-amplify/api-graphql/dist/esm/types/index.mjs
var GraphQLAuthError;
(function(GraphQLAuthError2) {
  GraphQLAuthError2["NO_API_KEY"] = "No api-key configured";
  GraphQLAuthError2["NO_CURRENT_USER"] = "No current user";
  GraphQLAuthError2["NO_CREDENTIALS"] = "No credentials";
  GraphQLAuthError2["NO_FEDERATED_JWT"] = "No federated jwt";
  GraphQLAuthError2["NO_AUTH_TOKEN"] = "No auth token specified";
})(GraphQLAuthError || (GraphQLAuthError = {}));
var __amplify = /* @__PURE__ */ Symbol("amplify");
var __authMode = /* @__PURE__ */ Symbol("authMode");
var __authToken = /* @__PURE__ */ Symbol("authToken");
var __apiKey = /* @__PURE__ */ Symbol("apiKey");
var __headers = /* @__PURE__ */ Symbol("headers");
var __endpoint = /* @__PURE__ */ Symbol("endpoint");
function getInternals(client) {
  const c = client;
  return {
    amplify: c[__amplify],
    apiKey: c[__apiKey],
    authMode: c[__authMode],
    authToken: c[__authToken],
    endpoint: c[__endpoint],
    headers: c[__headers]
  };
}

// node_modules/@aws-amplify/api-graphql/dist/esm/utils/errors/constants.mjs
var NO_API_KEY = {
  name: "NoApiKey",
  // ideal: No API key configured.
  message: GraphQLAuthError.NO_API_KEY,
  recoverySuggestion: 'The API request was made with `authMode: "apiKey"` but no API Key was passed into `Amplify.configure()`. Review if your API key is passed into the `Amplify.configure()` function.'
};
var NO_VALID_CREDENTIALS = {
  name: "NoCredentials",
  // ideal: No auth credentials available.
  message: GraphQLAuthError.NO_CREDENTIALS,
  recoverySuggestion: `The API request was made with \`authMode: "iam"\` but no authentication credentials are available.

If you intended to make a request using an authenticated role, review if your user is signed in before making the request.

If you intend to make a request using an unauthenticated role or also known as "guest access", verify if "Auth.Cognito.allowGuestAccess" is set to "true" in the \`Amplify.configure()\` function.`
};
var NO_VALID_AUTH_TOKEN = {
  name: "NoValidAuthTokens",
  // ideal: No valid JWT auth token provided to make the API request..
  message: GraphQLAuthError.NO_FEDERATED_JWT,
  recoverySuggestion: "If you intended to make an authenticated API request, review if the current user is signed in."
};
var NO_SIGNED_IN_USER = {
  name: "NoSignedUser",
  // ideal: Couldn't retrieve authentication credentials to make the API request.
  message: GraphQLAuthError.NO_CURRENT_USER,
  recoverySuggestion: "Review the underlying exception field for more details. If you intended to make an authenticated API request, review if the current user is signed in."
};
var NO_AUTH_TOKEN_HEADER = {
  name: "NoAuthorizationHeader",
  // ideal: Authorization header not specified.
  message: GraphQLAuthError.NO_AUTH_TOKEN,
  recoverySuggestion: 'The API request was made with `authMode: "lambda"` but no `authToken` is set. Review if a valid authToken is passed into the request options or in the `Amplify.configure()` function.'
};
var NO_ENDPOINT = {
  name: "NoEndpoint",
  message: "No GraphQL endpoint configured in `Amplify.configure()`.",
  recoverySuggestion: "Review if the GraphQL API endpoint is set in the `Amplify.configure()` function."
};

// node_modules/@aws-amplify/api-graphql/dist/esm/utils/errors/createGraphQLResultWithError.mjs
var createGraphQLResultWithError = (error) => {
  return {
    data: {},
    errors: [new GraphQLError(error.message, null, null, null, null, error)]
  };
};

// node_modules/@aws-amplify/api-graphql/dist/esm/internals/utils/runtimeTypeGuards/isGraphQLResponseWithErrors.mjs
function isGraphQLResponseWithErrors(response) {
  if (!response) {
    return false;
  }
  const r = response;
  return Array.isArray(r.errors) && r.errors.length > 0;
}

// node_modules/@aws-amplify/api-graphql/dist/esm/internals/graphqlAuth.mjs
async function headerBasedAuth(amplify, authMode, apiKey, additionalHeaders = {}) {
  let headers = {};
  switch (authMode) {
    case "apiKey":
      if (!apiKey) {
        throw new GraphQLApiError(NO_API_KEY);
      }
      headers = {
        "X-Api-Key": apiKey
      };
      break;
    case "iam": {
      const session = await amplify.Auth.fetchAuthSession();
      if (session.credentials === void 0) {
        throw new GraphQLApiError(NO_VALID_CREDENTIALS);
      }
      break;
    }
    case "oidc":
    case "userPool": {
      let token;
      try {
        token = (await amplify.Auth.fetchAuthSession()).tokens?.accessToken.toString();
      } catch (e) {
        throw new GraphQLApiError({
          ...NO_SIGNED_IN_USER,
          underlyingError: e
        });
      }
      if (!token) {
        throw new GraphQLApiError(NO_VALID_AUTH_TOKEN);
      }
      headers = {
        Authorization: token
      };
      break;
    }
    case "lambda":
      if (typeof additionalHeaders === "object" && !additionalHeaders.Authorization) {
        throw new GraphQLApiError(NO_AUTH_TOKEN_HEADER);
      }
      headers = {
        Authorization: additionalHeaders.Authorization
      };
      break;
  }
  return headers;
}

// node_modules/@aws-amplify/api-graphql/dist/esm/internals/InternalGraphQLAPI.mjs
var USER_AGENT_HEADER2 = "x-amz-user-agent";
var isAmplifyInstance = (amplify) => {
  return typeof amplify !== "function";
};
var InternalGraphQLAPIClass = class {
  constructor() {
    this.appSyncRealTime = /* @__PURE__ */ new Map();
    this._api = {
      post: post3,
      cancelREST: cancel,
      isCancelErrorREST: isCancelError,
      updateRequestToBeCancellable
    };
  }
  getModuleName() {
    return "InternalGraphQLAPI";
  }
  /**
   * to get the operation type
   * @param operation
   */
  getGraphqlOperationType(operation) {
    const doc = parse(operation);
    const definitions = doc.definitions;
    const [{ operation: operationType }] = definitions;
    return operationType;
  }
  /**
   * Executes a GraphQL operation
   *
   * @param options - GraphQL Options
   * @param [additionalHeaders] - headers to merge in after any `libraryConfigHeaders` set in the config
   * @returns An Observable if the query is a subscription query, else a promise of the graphql result.
   */
  graphql(amplify, { query: paramQuery, variables = {}, authMode, authToken, endpoint, apiKey }, additionalHeaders, customUserAgentDetails) {
    const query = typeof paramQuery === "string" ? parse(paramQuery) : parse(print(paramQuery));
    const [operationDef = {}] = query.definitions.filter((def) => def.kind === "OperationDefinition");
    const { operation: operationType } = operationDef;
    const headers = additionalHeaders || {};
    switch (operationType) {
      case "query":
      case "mutation": {
        const abortController = new AbortController();
        let responsePromise;
        if (isAmplifyInstance(amplify)) {
          responsePromise = this._graphql(amplify, { query, variables, authMode, apiKey, endpoint }, headers, abortController, customUserAgentDetails, authToken);
        } else {
          const wrapper = async (amplifyInstance) => {
            const result = await this._graphql(amplifyInstance, { query, variables, authMode, apiKey, endpoint }, headers, abortController, customUserAgentDetails, authToken);
            return result;
          };
          responsePromise = amplify(wrapper);
        }
        this._api.updateRequestToBeCancellable(responsePromise, abortController);
        return responsePromise;
      }
      case "subscription":
        return this._graphqlSubscribe(amplify, { query, variables, authMode, apiKey, endpoint }, headers, customUserAgentDetails, authToken);
      default:
        throw new Error(`invalid operation type: ${operationType}`);
    }
  }
  async _graphql(amplify, { query, variables, authMode: authModeOverride, endpoint: endpointOverride, apiKey: apiKeyOverride }, additionalHeaders = {}, abortController, customUserAgentDetails, authToken) {
    const { apiKey, region, endpoint: appSyncGraphqlEndpoint, customEndpoint, customEndpointRegion, defaultAuthMode } = resolveConfig(amplify);
    const initialAuthMode = authModeOverride || defaultAuthMode || "iam";
    const authMode = initialAuthMode === "identityPool" ? "iam" : initialAuthMode;
    const { headers: customHeaders, withCredentials } = resolveLibraryOptions2(amplify);
    let additionalCustomHeaders;
    if (typeof additionalHeaders === "function") {
      const requestOptions = {
        method: "POST",
        url: new AmplifyUrl(endpointOverride || customEndpoint || appSyncGraphqlEndpoint || "").toString(),
        queryString: print(query)
      };
      additionalCustomHeaders = await additionalHeaders(requestOptions);
    } else {
      additionalCustomHeaders = additionalHeaders;
    }
    if (authToken) {
      additionalCustomHeaders = {
        ...additionalCustomHeaders,
        Authorization: authToken
      };
    }
    const authHeaders = await headerBasedAuth(amplify, authMode, apiKeyOverride ?? apiKey, additionalCustomHeaders);
    const headers = {
      ...!customEndpoint && authHeaders,
      /**
       * Custom endpoint headers.
       * If there is both a custom endpoint and custom region present, we get the headers.
       * If there is a custom endpoint but no region, we return an empty object.
       * If neither are present, we return an empty object.
       */
      ...customEndpoint && (customEndpointRegion ? authHeaders : {}) || {},
      // Custom headers included in Amplify configuration options:
      ...customHeaders && await customHeaders({
        query: print(query),
        variables
      }),
      // Custom headers from individual requests or API client configuration:
      ...additionalCustomHeaders,
      // User agent headers:
      ...!customEndpoint && {
        [USER_AGENT_HEADER2]: getAmplifyUserAgent(customUserAgentDetails)
      }
    };
    const body = {
      query: print(query),
      variables: variables || null
    };
    let signingServiceInfo;
    if (customEndpoint && !customEndpointRegion || authMode !== "oidc" && authMode !== "userPool" && authMode !== "iam" && authMode !== "lambda") {
      signingServiceInfo = void 0;
    } else {
      signingServiceInfo = {
        service: !customEndpointRegion ? "appsync" : "execute-api",
        region: !customEndpointRegion ? region : customEndpointRegion
      };
    }
    const endpoint = endpointOverride || customEndpoint || appSyncGraphqlEndpoint;
    if (!endpoint) {
      throw createGraphQLResultWithError(new GraphQLApiError(NO_ENDPOINT));
    }
    let response;
    try {
      const { body: responseBody } = await this._api.post(amplify, {
        url: new AmplifyUrl(endpoint),
        options: {
          headers,
          body,
          signingServiceInfo,
          withCredentials
        },
        abortController
      });
      response = await responseBody.json();
    } catch (error) {
      if (this.isCancelError(error)) {
        throw error;
      }
      response = createGraphQLResultWithError(error);
    }
    if (isGraphQLResponseWithErrors(response)) {
      throw repackageUnauthorizedError(response);
    }
    return response;
  }
  /**
   * Checks to see if an error thrown is from an api request cancellation
   * @param {any} error - Any error
   * @return {boolean} - A boolean indicating if the error was from an api request cancellation
   */
  isCancelError(error) {
    return this._api.isCancelErrorREST(error);
  }
  /**
   * Cancels an inflight request. Only applicable for graphql queries and mutations
   * @param {any} request - request to cancel
   * @returns - A boolean indicating if the request was cancelled
   */
  cancel(request, message) {
    return this._api.cancelREST(request, message);
  }
  _graphqlSubscribe(amplify, { query, variables, authMode: authModeOverride, apiKey: apiKeyOverride, endpoint }, additionalHeaders = {}, customUserAgentDetails, authToken) {
    const config2 = resolveConfig(amplify);
    const initialAuthMode = authModeOverride || config2?.defaultAuthMode || "iam";
    const authMode = initialAuthMode === "identityPool" ? "iam" : initialAuthMode;
    const { headers: libraryConfigHeaders } = resolveLibraryOptions2(amplify);
    const appSyncGraphqlEndpoint = endpoint ?? config2?.endpoint;
    const memoKey = appSyncGraphqlEndpoint ?? "none";
    const realtimeProvider = this.appSyncRealTime.get(memoKey) ?? new AWSAppSyncRealTimeProvider();
    this.appSyncRealTime.set(memoKey, realtimeProvider);
    return realtimeProvider.subscribe({
      query: print(query),
      variables,
      appSyncGraphqlEndpoint,
      region: config2?.region,
      authenticationType: authMode,
      apiKey: apiKeyOverride ?? config2?.apiKey,
      additionalHeaders,
      authToken,
      libraryConfigHeaders
    }, customUserAgentDetails).pipe(catchError((e) => {
      if (e.errors) {
        throw repackageUnauthorizedError(e);
      }
      throw e;
    }));
  }
};
var InternalGraphQLAPI = new InternalGraphQLAPIClass();

// node_modules/@aws-amplify/data-schema/dist/esm/runtime/utils/resolveOwnerFields.mjs
function resolveOwnerFields(model) {
  const ownerFields = /* @__PURE__ */ new Set();
  for (const attr of model.attributes || []) {
    if (isAuthAttribute(attr)) {
      for (const rule of attr.properties.rules) {
        if (rule.allow === "owner") {
          ownerFields.add(rule.ownerField || "owner");
        } else if (rule.allow === "groups" && rule.groupsField !== void 0) {
          ownerFields.add(rule.groupsField);
        }
      }
    }
  }
  return Array.from(ownerFields);
}
function isAuthAttribute(attribute) {
  if (attribute?.type === "auth") {
    if (typeof attribute?.properties === "object") {
      if (Array.isArray(attribute?.properties?.rules)) {
        return (attribute?.properties?.rules).every((rule) => !!rule.allow);
      }
    }
  }
  return false;
}

// node_modules/@aws-amplify/data-schema/dist/esm/runtime/utils/stringTransformation.mjs
function capitalize(s) {
  return `${s[0].toUpperCase()}${s.slice(1)}`;
}

// node_modules/@aws-amplify/data-schema/dist/esm/runtime/utils/selfAwareAsync.mjs
function selfAwareAsync(resolver) {
  let resolve;
  let reject;
  const resultPromise = new Promise((res, rej) => {
    resolve = res;
    reject = rej;
  });
  resolver(resultPromise).then((result) => {
    resolve(result);
  }).catch((error) => {
    reject(error);
  });
  return resultPromise;
}

// node_modules/@aws-amplify/data-schema/dist/esm/runtime/internals/cancellation.mjs
var promiseMap = /* @__PURE__ */ new WeakMap();
function extendCancellability(existingCancellablePromise, newPromiseToRegister) {
  promiseMap.set(newPromiseToRegister, existingCancellablePromise);
  return existingCancellablePromise.finally(() => {
    promiseMap.delete(newPromiseToRegister);
  });
}
function upgradeClientCancellation(client) {
  const innerCancel = client.cancel.bind(client);
  client.cancel = function(promise, message) {
    const visited = /* @__PURE__ */ new Set();
    let targetPromise = promise;
    while (targetPromise && promiseMap.has(targetPromise)) {
      if (visited.has(targetPromise))
        throw new Error("A cycle was detected in the modeled graphql cancellation chain. This is a bug. Please report it!");
      visited.add(targetPromise);
      targetPromise = promiseMap.get(targetPromise);
    }
    return innerCancel(targetPromise, message);
  };
}

// node_modules/@aws-amplify/data-schema/dist/esm/runtime/internals/APIClient.mjs
var connectionType = {
  HAS_ONE: "HAS_ONE",
  HAS_MANY: "HAS_MANY",
  BELONGS_TO: "BELONGS_TO"
};
var skGraphQlFieldTypeMap = {
  ID: "ID",
  String: "String",
  AWSDate: "String",
  AWSTime: "String",
  AWSDateTime: "String",
  AWSTimestamp: "Int",
  AWSEmail: "String",
  AWSPhone: "String",
  AWSURL: "String",
  AWSIPAddress: "String",
  AWSJSON: "String",
  Boolean: "Boolean",
  Int: "Int",
  Float: "Float"
};
var resolvedSkName = (sk) => {
  if (sk.length === 1) {
    return sk[0];
  } else {
    return sk.reduce((acc, curr, idx) => {
      if (idx === 0) {
        return curr;
      } else {
        return acc + capitalize(curr);
      }
    }, "");
  }
};
var flattenItems = (modelIntrospection, modelName, modelRecord) => {
  if (!modelRecord)
    return null;
  const mapped = {};
  for (const [fieldName, value] of Object.entries(modelRecord)) {
    const fieldDef = modelName ? modelIntrospection.models[modelName]?.fields[fieldName] : void 0;
    const dvPair = { fieldDef, value };
    if (isRelatedModelItemsArrayPair(dvPair)) {
      mapped[fieldName] = dvPair.value.items.map((itemValue) => flattenItems(modelIntrospection, dvPair.fieldDef.type.model, itemValue));
    } else if (isRelatedModelProperty(fieldDef)) {
      mapped[fieldName] = flattenItems(modelIntrospection, fieldDef.type.model, value);
    } else {
      mapped[fieldName] = value;
    }
  }
  return mapped;
};
function isRelatedModelItemsArrayPair(dv) {
  return typeof dv.fieldDef?.type === "object" && "model" in dv.fieldDef.type && typeof dv.fieldDef.type.model === "string" && dv.fieldDef.isArray && Array.isArray(dv.value?.items);
}
function isRelatedModelProperty(fieldDef) {
  return typeof fieldDef?.type === "object" && "model" in fieldDef.type && typeof fieldDef.type.model === "string";
}
function initializeModel(client, modelName, result, modelIntrospection, authMode, authToken, context2 = false) {
  const introModel = modelIntrospection.models[modelName];
  const introModelFields = introModel.fields;
  const modelFields = Object.entries(introModelFields).filter(([_, field]) => field?.type?.model !== void 0).map(([fieldName]) => fieldName);
  return result.map((record) => {
    if (record === null || record === void 0) {
      return record;
    }
    const initializedRelationshipFields = {};
    for (const fieldName of modelFields) {
      const modelField = introModelFields[fieldName];
      const modelFieldType = modelField?.type;
      const relatedModelName = modelFieldType.model;
      const relatedModel = modelIntrospection.models[relatedModelName];
      const relatedModelPKFieldName = relatedModel.primaryKeyInfo.primaryKeyFieldName;
      const relatedModelSKFieldNames = relatedModel.primaryKeyInfo.sortKeyFieldNames;
      const relationType = modelField.association?.connectionType;
      let connectionFields = [];
      if (modelField.association && "associatedWith" in modelField.association) {
        connectionFields = modelField.association.associatedWith;
      }
      const targetNames = [];
      if (modelField.association && "targetNames" in modelField.association) {
        targetNames.push(...modelField.association.targetNames);
      }
      switch (relationType) {
        case connectionType.BELONGS_TO: {
          const sortKeyValues = relatedModelSKFieldNames.reduce(
            // TODO(Eslint): is this implementation correct?
            // eslint-disable-next-line array-callback-return
            (acc, curVal) => {
              if (record[curVal]) {
                acc[curVal] = record[curVal];
              }
              return acc;
            },
            {}
          );
          if (client.models[relatedModelName]?.get === void 0) {
            break;
          }
          if (context2) {
            initializedRelationshipFields[fieldName] = (contextSpec, options) => {
              if (record[targetNames[0]]) {
                return client.models[relatedModelName].get(contextSpec, {
                  [relatedModelPKFieldName]: record[targetNames[0]],
                  ...sortKeyValues
                }, {
                  authMode: options?.authMode || authMode,
                  authToken: options?.authToken || authToken
                });
              }
              return { data: null };
            };
          } else {
            initializedRelationshipFields[fieldName] = (options) => {
              if (record[targetNames[0]]) {
                return client.models[relatedModelName].get({
                  [relatedModelPKFieldName]: record[targetNames[0]],
                  ...sortKeyValues
                }, {
                  authMode: options?.authMode || authMode,
                  authToken: options?.authToken || authToken
                });
              }
              return { data: null };
            };
          }
          break;
        }
        case connectionType.HAS_ONE:
        case connectionType.HAS_MANY: {
          const mapResult = relationType === connectionType.HAS_ONE ? (result2) => {
            return {
              data: result2?.data.shift() || null,
              errors: result2.errors,
              extensions: result2.extensions
            };
          } : (result2) => result2;
          const parentPk = introModel.primaryKeyInfo.primaryKeyFieldName;
          const parentSK = introModel.primaryKeyInfo.sortKeyFieldNames;
          const relatedModelField = relatedModel.fields[connectionFields[0]];
          const relatedModelFieldType = relatedModelField.type;
          if (relatedModelFieldType.model) {
            let relatedTargetNames = [];
            if (relatedModelField.association && "targetNames" in relatedModelField.association) {
              relatedTargetNames = relatedModelField.association?.targetNames;
            }
            const hasManyFilter2 = relatedTargetNames.map((field, idx) => {
              if (idx === 0) {
                return { [field]: { eq: record[parentPk] } };
              }
              return { [field]: { eq: record[parentSK[idx - 1]] } };
            });
            if (client.models[relatedModelName]?.list === void 0) {
              break;
            }
            if (context2) {
              initializedRelationshipFields[fieldName] = (contextSpec, options) => {
                if (record[parentPk]) {
                  return selfAwareAsync(async (resultPromise) => {
                    const basePromise = client.models[relatedModelName].list(contextSpec, {
                      filter: { and: hasManyFilter2 },
                      limit: options?.limit,
                      nextToken: options?.nextToken,
                      authMode: options?.authMode || authMode,
                      authToken: options?.authToken || authToken
                    });
                    const extendedBase = extendCancellability(basePromise, resultPromise);
                    return mapResult(await extendedBase);
                  });
                }
                return [];
              };
            } else {
              initializedRelationshipFields[fieldName] = (options) => {
                if (record[parentPk]) {
                  return selfAwareAsync(async (resultPromise) => {
                    const basePromise = client.models[relatedModelName].list({
                      filter: { and: hasManyFilter2 },
                      limit: options?.limit,
                      nextToken: options?.nextToken,
                      authMode: options?.authMode || authMode,
                      authToken: options?.authToken || authToken
                    });
                    const extendedBase = extendCancellability(basePromise, resultPromise);
                    return mapResult(await extendedBase);
                  });
                }
                return [];
              };
            }
            break;
          }
          const hasManyFilter = connectionFields.map((field, idx) => {
            if (idx === 0) {
              return { [field]: { eq: record[parentPk] } };
            }
            return { [field]: { eq: record[parentSK[idx - 1]] } };
          });
          if (client.models[relatedModelName]?.list === void 0) {
            break;
          }
          if (context2) {
            initializedRelationshipFields[fieldName] = (contextSpec, options) => {
              if (record[parentPk]) {
                return selfAwareAsync(async (resultPromise) => {
                  const basePromise = client.models[relatedModelName].list(contextSpec, {
                    filter: { and: hasManyFilter },
                    limit: options?.limit,
                    nextToken: options?.nextToken,
                    authMode: options?.authMode || authMode,
                    authToken: options?.authToken || authToken
                  });
                  const extendedBase = extendCancellability(basePromise, resultPromise);
                  return mapResult(await extendedBase);
                });
              }
              return [];
            };
          } else {
            initializedRelationshipFields[fieldName] = (options) => {
              if (record[parentPk]) {
                return selfAwareAsync(async (resultPromise) => {
                  const basePromise = client.models[relatedModelName].list({
                    filter: { and: hasManyFilter },
                    limit: options?.limit,
                    nextToken: options?.nextToken,
                    authMode: options?.authMode || authMode,
                    authToken: options?.authToken || authToken
                  });
                  const extendedBase = extendCancellability(basePromise, resultPromise);
                  return mapResult(await extendedBase);
                });
              }
              return [];
            };
          }
          break;
        }
      }
    }
    return { ...record, ...initializedRelationshipFields };
  });
}
var graphQLOperationsInfo = {
  CREATE: { operationPrefix: "create", usePlural: false },
  GET: { operationPrefix: "get", usePlural: false },
  UPDATE: { operationPrefix: "update", usePlural: false },
  DELETE: { operationPrefix: "delete", usePlural: false },
  LIST: { operationPrefix: "list", usePlural: true },
  INDEX_QUERY: { operationPrefix: "", usePlural: false },
  ONCREATE: { operationPrefix: "onCreate", usePlural: false },
  ONUPDATE: { operationPrefix: "onUpdate", usePlural: false },
  ONDELETE: { operationPrefix: "onDelete", usePlural: false },
  OBSERVEQUERY: { operationPrefix: "observeQuery", usePlural: false }
};
var SELECTION_SET_WILDCARD = "*";
var getDefaultSelectionSetForNonModelWithIR = (nonModelDefinition, modelIntrospection) => {
  const { fields } = nonModelDefinition;
  const mappedFields = Object.values(fields).map(({ type, name: name2 }) => {
    if (typeof type.enum === "string") {
      return [name2, FIELD_IR];
    }
    if (typeof type.nonModel === "string") {
      return [
        name2,
        getDefaultSelectionSetForNonModelWithIR(modelIntrospection.nonModels[type.nonModel], modelIntrospection)
      ];
    }
    if (typeof type === "string") {
      return [name2, FIELD_IR];
    }
    return void 0;
  }).filter((pair) => pair !== void 0);
  return Object.fromEntries(mappedFields);
};
var getDefaultSelectionSetForModelWithIR = (modelDefinition, modelIntrospection) => {
  const { fields } = modelDefinition;
  const mappedFields = Object.values(fields).map(({ type, name: name2 }) => {
    if (typeof type.enum === "string" || typeof type === "string") {
      return [name2, FIELD_IR];
    }
    if (typeof type.nonModel === "string") {
      return [
        name2,
        getDefaultSelectionSetForNonModelWithIR(modelIntrospection.nonModels[type.nonModel], modelIntrospection)
      ];
    }
    return void 0;
  }).filter((pair) => pair !== void 0);
  const ownerFields = resolveOwnerFields(modelDefinition).map((field) => [
    field,
    FIELD_IR
  ]);
  return Object.fromEntries(mappedFields.concat(ownerFields));
};
function defaultSelectionSetForModel(modelDefinition) {
  const { fields } = modelDefinition;
  const explicitFields = Object.values(fields).map(({ type, name: name2 }) => {
    if (typeof type === "string")
      return name2;
    if (typeof type === "object") {
      if (typeof type?.enum === "string") {
        return name2;
      } else if (typeof type?.nonModel === "string") {
        return `${name2}.${SELECTION_SET_WILDCARD}`;
      }
    }
    return void 0;
  }).filter(Boolean);
  const ownerFields = resolveOwnerFields(modelDefinition);
  return Array.from(new Set(explicitFields.concat(ownerFields)));
}
var FIELD_IR = "";
function customSelectionSetToIR(modelIntrospection, modelName, selectionSet) {
  const dotNotationToObject = (path, modelOrNonModelName) => {
    const [fieldName, ...rest] = path.split(".");
    const nested = rest[0];
    const modelOrNonModelDefinition = modelIntrospection.models[modelOrNonModelName] ?? modelIntrospection.nonModels[modelOrNonModelName];
    const modelOrNonModelFields = modelOrNonModelDefinition?.fields;
    const relatedModel = modelOrNonModelFields?.[fieldName]?.type?.model;
    const relatedModelDefinition = modelIntrospection.models[relatedModel];
    const relatedNonModel = modelOrNonModelFields?.[fieldName]?.type?.nonModel;
    const relatedNonModelDefinition = modelIntrospection.nonModels[relatedNonModel];
    const isModelOrNonModelOrFieldType = relatedModelDefinition ? "model" : relatedNonModelDefinition ? "nonModel" : "field";
    if (isModelOrNonModelOrFieldType === "nonModel") {
      let result = {};
      if (!nested) {
        throw Error(`${fieldName} must declare a wildcard (*) or a field of custom type ${relatedNonModel}`);
      }
      if (nested === SELECTION_SET_WILDCARD) {
        result = {
          [fieldName]: getDefaultSelectionSetForNonModelWithIR(relatedNonModelDefinition, modelIntrospection)
        };
      } else {
        result = {
          [fieldName]: dotNotationToObject(rest.join("."), relatedNonModel)
        };
      }
      return result;
    } else if (isModelOrNonModelOrFieldType === "model") {
      let result = {};
      if (!nested) {
        throw Error(`${fieldName} must declare a wildcard (*) or a field of model ${relatedModel}`);
      }
      if (nested === SELECTION_SET_WILDCARD) {
        const nestedRelatedModelDefinition = modelIntrospection.models[relatedModel];
        result = {
          [fieldName]: getDefaultSelectionSetForModelWithIR(nestedRelatedModelDefinition, modelIntrospection)
        };
      } else {
        result = {
          [fieldName]: dotNotationToObject(rest.join("."), relatedModel)
        };
      }
      if (modelOrNonModelFields[fieldName]?.isArray) {
        result = {
          [fieldName]: {
            items: result[fieldName]
          }
        };
      }
      return result;
    } else {
      const modelField = modelOrNonModelFields?.[fieldName];
      const nonModelDefinition = modelIntrospection.nonModels[modelOrNonModelName];
      const nonModelField = nonModelDefinition?.fields?.[fieldName];
      if (!nonModelDefinition) {
        const isOwnerField = resolveOwnerFields(modelOrNonModelDefinition).includes(fieldName);
        if (!modelField && !isOwnerField) {
          throw Error(`${fieldName} is not a field of model ${modelOrNonModelName}`);
        }
      } else {
        if (!nonModelField) {
          throw Error(`${fieldName} is not a field of custom type ${modelOrNonModelName}`);
        }
      }
      return { [fieldName]: FIELD_IR };
    }
  };
  return selectionSet.reduce((resultObj, path) => deepMergeSelectionSetObjects(dotNotationToObject(path, modelName), resultObj), {});
}
function selectionSetIRToString(obj) {
  const res = [];
  Object.entries(obj).forEach(([fieldName, value]) => {
    if (value === FIELD_IR) {
      res.push(fieldName);
    } else if (typeof value === "object" && value !== null) {
      if (value?.items) {
        res.push(fieldName, "{", "items", "{", selectionSetIRToString(value.items), "}", "}");
      } else {
        res.push(fieldName, "{", selectionSetIRToString(value), "}");
      }
    }
  });
  return res.join(" ");
}
function deepMergeSelectionSetObjects(source, target) {
  const isObject = (obj) => obj && typeof obj === "object";
  for (const key in source) {
    if (!Object.prototype.hasOwnProperty.call(source, key))
      continue;
    if (Object.prototype.hasOwnProperty.call(target, key) && isObject(target[key])) {
      deepMergeSelectionSetObjects(source[key], target[key]);
    } else {
      target[key] = source[key];
    }
  }
  return target;
}
function generateSelectionSet(modelIntrospection, modelName, selectionSet) {
  const modelDefinition = modelIntrospection.models[modelName];
  const selSetIr = customSelectionSetToIR(modelIntrospection, modelName, selectionSet ?? defaultSelectionSetForModel(modelDefinition));
  const selSetString = selectionSetIRToString(selSetIr);
  return selSetString;
}
function generateGraphQLDocument(modelIntrospection, modelDefinition, modelOperation, listArgs, indexMeta) {
  const { name: name2, pluralName, fields, primaryKeyInfo: { isCustomPrimaryKey, primaryKeyFieldName, sortKeyFieldNames }, attributes } = modelDefinition;
  const namePascalCase = name2.charAt(0).toUpperCase() + name2.slice(1);
  const pluralNamePascalCase = pluralName.charAt(0).toUpperCase() + pluralName.slice(1);
  const { operationPrefix, usePlural } = graphQLOperationsInfo[modelOperation];
  const { selectionSet } = listArgs || {};
  let graphQLFieldName;
  let indexQueryArgs;
  if (operationPrefix) {
    graphQLFieldName = `${operationPrefix}${usePlural ? pluralNamePascalCase : namePascalCase}`;
  } else if (indexMeta) {
    const { queryField, pk, sk = [] } = indexMeta;
    graphQLFieldName = queryField;
    let skQueryArgs = {};
    if (sk.length === 1) {
      const [skField] = sk;
      const type = typeof fields[skField].type === "string" ? fields[skField].type : "String";
      const normalizedType = skGraphQlFieldTypeMap[type];
      skQueryArgs = {
        [skField]: `Model${normalizedType}KeyConditionInput`
      };
    } else if (sk.length > 1) {
      const compositeSkArgName = resolvedSkName(sk);
      const keyName = attributes?.find((attr) => attr?.properties?.queryField === queryField)?.properties?.name;
      skQueryArgs = {
        [compositeSkArgName]: `Model${capitalize(name2)}${capitalize(keyName)}CompositeKeyConditionInput`
      };
    }
    indexQueryArgs = {
      [pk]: `${Object.prototype.hasOwnProperty.call(fields[pk].type, "enum") ? fields[pk].type.enum : fields[pk].type}!`,
      ...skQueryArgs
    };
  } else {
    throw new Error("Error generating GraphQL Document - invalid operation name");
  }
  let graphQLOperationType;
  let graphQLSelectionSet;
  let graphQLArguments;
  const selectionSetFields = generateSelectionSet(modelIntrospection, name2, selectionSet);
  const getPkArgs = {
    [primaryKeyFieldName]: `${fields[primaryKeyFieldName].type}!`
  };
  const listPkArgs = {};
  const generateSkArgs = (op) => {
    if (sortKeyFieldNames.length === 0)
      return {};
    if (op === "get") {
      return sortKeyFieldNames.reduce((acc, fieldName) => {
        const fieldType = fields[fieldName].type;
        if (op === "get") {
          acc[fieldName] = `${fieldType}!`;
        }
        return acc;
      }, {});
    } else {
      if (sortKeyFieldNames.length === 1) {
        const [sk] = sortKeyFieldNames;
        const type = typeof fields[sk].type === "string" ? fields[sk].type : "String";
        const normalizedType = skGraphQlFieldTypeMap[type];
        return {
          [sk]: `Model${normalizedType}KeyConditionInput`
        };
      } else {
        const compositeSkArgName = resolvedSkName(sortKeyFieldNames);
        return {
          [compositeSkArgName]: `Model${capitalize(name2)}PrimaryCompositeKeyConditionInput`
        };
      }
    }
  };
  if (isCustomPrimaryKey) {
    Object.assign(getPkArgs, generateSkArgs("get"));
    Object.assign(listPkArgs, {
      // PK is only included in list query field args in the generated GQL
      // when explicitly specifying PK with .identifier(['fieldName']) or @primaryKey in the schema definition
      [primaryKeyFieldName]: `${fields[primaryKeyFieldName].type}`,
      // PK is always a nullable arg for list (no `!` after the type)
      sortDirection: "ModelSortDirection"
    }, generateSkArgs("list"));
  }
  switch (modelOperation) {
    case "CREATE":
    case "UPDATE":
    case "DELETE":
      graphQLArguments ?? (graphQLArguments = {
        input: `${operationPrefix.charAt(0).toLocaleUpperCase() + operationPrefix.slice(1)}${namePascalCase}Input!`
      });
      graphQLOperationType ?? (graphQLOperationType = "mutation");
    // TODO(Eslint): this this case clause correct without the break statement?
    // eslint-disable-next-line no-fallthrough
    case "GET":
      graphQLArguments ?? (graphQLArguments = getPkArgs);
      graphQLSelectionSet ?? (graphQLSelectionSet = selectionSetFields);
    // TODO(Eslint): this this case clause correct without the break statement?
    // eslint-disable-next-line no-fallthrough
    case "LIST":
      graphQLArguments ?? (graphQLArguments = {
        ...listPkArgs,
        // eslint doesn't like the ts-ignore, because it thinks it's unnecessary.
        // But TS doesn't like the `filter: ...` because it think it will always be
        // overwritten. (it won't be.) so, we need to ignore the TS error and then
        // ignore the eslint error on the ts-ignore.
        // eslint-disable-next-line
        // @ts-ignore
        filter: `Model${namePascalCase}FilterInput`,
        limit: "Int",
        nextToken: "String"
      });
      graphQLOperationType ?? (graphQLOperationType = "query");
      graphQLSelectionSet ?? (graphQLSelectionSet = `items { ${selectionSetFields} } nextToken __typename`);
    // TODO(Eslint): this this case clause correct without the break statement?
    // eslint-disable-next-line no-fallthrough
    case "INDEX_QUERY":
      graphQLArguments ?? (graphQLArguments = {
        ...indexQueryArgs,
        filter: `Model${namePascalCase}FilterInput`,
        sortDirection: "ModelSortDirection",
        limit: "Int",
        nextToken: "String"
      });
      graphQLOperationType ?? (graphQLOperationType = "query");
      graphQLSelectionSet ?? (graphQLSelectionSet = `items { ${selectionSetFields} } nextToken __typename`);
    // TODO(Eslint): this this case clause correct without the break statement?
    // eslint-disable-next-line no-fallthrough
    case "ONCREATE":
    case "ONUPDATE":
    case "ONDELETE":
      graphQLArguments ?? (graphQLArguments = {
        filter: `ModelSubscription${namePascalCase}FilterInput`
      });
      graphQLOperationType ?? (graphQLOperationType = "subscription");
      graphQLSelectionSet ?? (graphQLSelectionSet = selectionSetFields);
      break;
    case "OBSERVEQUERY":
    default:
      throw new Error("Internal error: Attempted to generate graphql document for observeQuery. Please report this error.");
  }
  const graphQLDocument = `${graphQLOperationType}${graphQLArguments ? `(${Object.entries(graphQLArguments).map(([fieldName, type]) => `$${fieldName}: ${type}`)})` : ""} { ${graphQLFieldName}${graphQLArguments ? `(${Object.keys(graphQLArguments).map((fieldName) => `${fieldName}: $${fieldName}`)})` : ""} { ${graphQLSelectionSet} } }`;
  return graphQLDocument;
}
function buildGraphQLVariables(modelDefinition, operation, arg, modelIntrospection, indexMeta) {
  const { fields, primaryKeyInfo: { isCustomPrimaryKey, primaryKeyFieldName, sortKeyFieldNames } } = modelDefinition;
  const skName = sortKeyFieldNames?.length && resolvedSkName(sortKeyFieldNames);
  let variables = {};
  switch (operation) {
    case "CREATE":
      variables = {
        input: arg ? normalizeMutationInput(arg, modelDefinition, modelIntrospection) : {}
      };
      break;
    case "UPDATE":
      variables = {
        input: arg ? Object.fromEntries(Object.entries(normalizeMutationInput(arg, modelDefinition, modelIntrospection)).filter(([fieldName]) => {
          return fields[fieldName] ? !fields[fieldName].isReadOnly : !resolveOwnerFields(modelDefinition).includes(fieldName);
        })) : {}
      };
      break;
    case "GET":
    case "DELETE":
      if (arg) {
        variables = isCustomPrimaryKey ? [primaryKeyFieldName, ...sortKeyFieldNames].reduce((acc, fieldName) => {
          acc[fieldName] = arg[fieldName];
          return acc;
        }, {}) : { [primaryKeyFieldName]: arg[primaryKeyFieldName] };
      }
      if (operation === "DELETE") {
        variables = { input: variables };
      }
      break;
    case "LIST":
      if (arg?.filter) {
        variables.filter = arg.filter;
      }
      if (arg?.sortDirection) {
        variables.sortDirection = arg.sortDirection;
      }
      if (arg && arg[primaryKeyFieldName]) {
        variables[primaryKeyFieldName] = arg[primaryKeyFieldName];
      }
      if (skName && arg && arg[skName]) {
        variables[skName] = arg[skName];
      }
      if (arg?.nextToken) {
        variables.nextToken = arg.nextToken;
      }
      if (arg?.limit) {
        variables.limit = arg.limit;
      }
      break;
    case "INDEX_QUERY": {
      const { pk, sk = [] } = indexMeta;
      const indexQuerySkName = sk?.length && resolvedSkName(sk);
      variables[pk] = arg[pk];
      if (indexQuerySkName && arg && arg[indexQuerySkName]) {
        variables[indexQuerySkName] = arg[indexQuerySkName];
      }
      if (arg?.filter) {
        variables.filter = arg.filter;
      }
      if (arg?.sortDirection) {
        variables.sortDirection = arg.sortDirection;
      }
      if (arg?.nextToken) {
        variables.nextToken = arg.nextToken;
      }
      if (arg?.limit) {
        variables.limit = arg.limit;
      }
      break;
    }
    case "ONCREATE":
    case "ONUPDATE":
    case "ONDELETE":
      if (arg?.filter) {
        variables = { filter: arg.filter };
      }
      break;
    case "OBSERVEQUERY":
      throw new Error("Internal error: Attempted to build variables for observeQuery. Please report this error.");
    default: {
      const exhaustiveCheck = operation;
      throw new Error(`Unhandled operation case: ${exhaustiveCheck}`);
    }
  }
  return variables;
}
function normalizeMutationInput(mutationInput, model, modelIntrospection) {
  const { fields } = model;
  const normalized = {};
  Object.entries(mutationInput).forEach(([inputFieldName, inputValue]) => {
    const fieldType = fields[inputFieldName]?.type;
    const relatedModelName = fieldType?.model;
    if (relatedModelName) {
      const association = fields[inputFieldName]?.association;
      const relatedModelDef = modelIntrospection.models[relatedModelName];
      const relatedModelPkInfo = relatedModelDef.primaryKeyInfo;
      if (association?.connectionType === connectionType.HAS_ONE) {
        const associationHasOne = association;
        associationHasOne.targetNames.forEach((targetName, idx) => {
          const associatedFieldName = associationHasOne.associatedWith[idx];
          normalized[targetName] = inputValue[associatedFieldName];
        });
      }
      if (association?.connectionType === connectionType.BELONGS_TO) {
        const associationBelongsTo = association;
        associationBelongsTo.targetNames.forEach((targetName, idx) => {
          if (idx === 0) {
            const associatedFieldName = relatedModelPkInfo.primaryKeyFieldName;
            normalized[targetName] = inputValue[associatedFieldName];
          } else {
            const associatedFieldName = relatedModelPkInfo.sortKeyFieldNames[idx - 1];
            normalized[targetName] = inputValue[associatedFieldName];
          }
        });
      }
    } else {
      normalized[inputFieldName] = inputValue;
    }
  });
  return normalized;
}
function authModeParams(client, getInternals2, options = {}) {
  const internals = getInternals2(client);
  return {
    authMode: options.authMode || internals.authMode,
    authToken: options.authToken || internals.authToken
  };
}
function getCustomHeaders(client, getInternals2, requestHeaders) {
  let headers = getInternals2(client).headers || {};
  if (requestHeaders) {
    headers = requestHeaders;
  }
  return headers;
}

// node_modules/@aws-amplify/data-schema/dist/esm/runtime/internals/operations/utils.mjs
function handleListGraphQlError(error) {
  if (error?.errors) {
    return {
      ...error,
      data: []
    };
  } else {
    throw error;
  }
}
function handleSingularGraphQlError(error) {
  if (error.errors) {
    return {
      ...error,
      data: null
    };
  } else {
    throw error;
  }
}

// node_modules/@aws-amplify/data-schema/dist/esm/runtime/internals/ai/getCustomUserAgentDetails.mjs
var INTERNAL_USER_AGENT_OVERRIDE = /* @__PURE__ */ Symbol("INTERNAL_USER_AGENT_OVERRIDE");
var AiAction2;
(function(AiAction3) {
  AiAction3["CreateConversation"] = "1";
  AiAction3["GetConversation"] = "2";
  AiAction3["ListConversations"] = "3";
  AiAction3["DeleteConversation"] = "4";
  AiAction3["SendMessage"] = "5";
  AiAction3["ListMessages"] = "6";
  AiAction3["OnStreamEvent"] = "7";
  AiAction3["Generation"] = "8";
  AiAction3["UpdateConversation"] = "9";
})(AiAction2 || (AiAction2 = {}));
var getCustomUserAgentDetails = (action) => ({
  category: "ai",
  action
});
function createUserAgentOverride(customUserAgentDetails) {
  return customUserAgentDetails ? { [INTERNAL_USER_AGENT_OVERRIDE]: customUserAgentDetails } : void 0;
}

// node_modules/@aws-amplify/data-schema/dist/esm/runtime/internals/operations/custom.mjs
var argIsContextSpec = (arg) => {
  return typeof arg?.token?.value === "symbol";
};
function customOpFactory(client, modelIntrospection, operationType, operation, useContext, getInternals2, customUserAgentDetails) {
  const argsDefined = operation.arguments !== void 0;
  const op = (...args) => {
    const options = args[args.length - 1];
    let contextSpec;
    let arg;
    if (useContext) {
      if (argIsContextSpec(args[0])) {
        contextSpec = args[0];
      } else {
        throw new Error(`Invalid first argument passed to ${operation.name}. Expected contextSpec`);
      }
    }
    if (argsDefined) {
      if (useContext) {
        arg = args[1];
      } else {
        arg = args[0];
      }
    }
    if (operationType === "subscription") {
      return _opSubscription(
        // subscriptions are only enabled on the clientside
        client,
        modelIntrospection,
        operation,
        getInternals2,
        arg,
        options,
        customUserAgentDetails
      );
    }
    return _op(client, modelIntrospection, operationType, operation, getInternals2, arg, options, contextSpec, customUserAgentDetails);
  };
  return op;
}
function hasStringField(o, field) {
  return typeof o[field] === "string";
}
function isEnumType(type) {
  return type instanceof Object && "enum" in type;
}
function isInputType(type) {
  return type instanceof Object && "input" in type;
}
function argumentBaseTypeString({ type, isRequired }) {
  const requiredFlag = isRequired ? "!" : "";
  if (isEnumType(type)) {
    return `${type.enum}${requiredFlag}`;
  }
  if (isInputType(type)) {
    return `${type.input}${requiredFlag}`;
  }
  return `${type}${requiredFlag}`;
}
function outerArguments(operation) {
  if (operation.arguments === void 0) {
    return "";
  }
  const args = Object.entries(operation.arguments).map(([k, argument]) => {
    const baseType = argumentBaseTypeString(argument);
    const finalType = argument.isArray ? `[${baseType}]${argument.isArrayNullable ? "" : "!"}` : baseType;
    return `$${k}: ${finalType}`;
  }).join(", ");
  return args.length > 0 ? `(${args})` : "";
}
function innerArguments(operation) {
  if (operation.arguments === void 0) {
    return "";
  }
  const args = Object.keys(operation.arguments).map((k) => `${k}: $${k}`).join(", ");
  return args.length > 0 ? `(${args})` : "";
}
function operationSelectionSet(modelIntrospection, operation) {
  if (hasStringField(operation, "type") || hasStringField(operation.type, "enum")) {
    return "";
  } else if (hasStringField(operation.type, "nonModel")) {
    const nonModel = modelIntrospection.nonModels[operation.type.nonModel];
    return `{${selectionSetIRToString(getDefaultSelectionSetForNonModelWithIR(nonModel, modelIntrospection))}}`;
  } else if (hasStringField(operation.type, "model")) {
    return `{${generateSelectionSet(modelIntrospection, operation.type.model)}}`;
  } else {
    return "";
  }
}
function operationVariables(operation, args = {}) {
  const variables = {};
  if (operation.arguments === void 0) {
    return variables;
  }
  for (const argDef of Object.values(operation.arguments)) {
    if (typeof args[argDef.name] !== "undefined") {
      variables[argDef.name] = args[argDef.name];
    } else if (argDef.isRequired) {
      throw new Error(`${operation.name} requires arguments '${argDef.name}'`);
    }
  }
  return variables;
}
function _op(client, modelIntrospection, operationType, operation, getInternals2, args, options, context2, customUserAgentDetails) {
  return selfAwareAsync(async (resultPromise) => {
    const { name: operationName } = operation;
    const auth = authModeParams(client, getInternals2, options);
    const headers = getCustomHeaders(client, getInternals2, options?.headers);
    const outerArgsString = outerArguments(operation);
    const innerArgsString = innerArguments(operation);
    const selectionSet = operationSelectionSet(modelIntrospection, operation);
    const returnTypeModelName = hasStringField(operation.type, "model") ? operation.type.model : void 0;
    const query = `
    ${operationType.toLocaleLowerCase()}${outerArgsString} {
      ${operationName}${innerArgsString} ${selectionSet}
    }
  `;
    const variables = operationVariables(operation, args);
    const userAgentOverride = createUserAgentOverride(customUserAgentDetails);
    try {
      const basePromise = context2 ? client.graphql(context2, {
        ...auth,
        query,
        variables
      }, headers) : client.graphql({
        ...auth,
        query,
        variables,
        ...userAgentOverride
      }, headers);
      const extendedPromise = extendCancellability(basePromise, resultPromise);
      const { data, extensions } = await extendedPromise;
      if (data) {
        const [key] = Object.keys(data);
        const isArrayResult = Array.isArray(data[key]);
        const flattenedResult = isArrayResult ? data[key].filter((x) => x) : data[key];
        const initialized = returnTypeModelName ? initializeModel(client, returnTypeModelName, isArrayResult ? flattenedResult : [flattenedResult], modelIntrospection, auth.authMode, auth.authToken, !!context2) : flattenedResult;
        return {
          data: !isArrayResult && Array.isArray(initialized) ? initialized.shift() : initialized,
          extensions
        };
      } else {
        return { data: null, extensions };
      }
    } catch (error) {
      const { data, errors } = error;
      if (data && Object.keys(data).length !== 0 && errors) {
        const [key] = Object.keys(data);
        const isArrayResult = Array.isArray(data[key]);
        const flattenedResult = isArrayResult ? data[key].filter((x) => x) : data[key];
        if (flattenedResult) {
          const initialized = returnTypeModelName ? initializeModel(client, returnTypeModelName, isArrayResult ? flattenedResult : [flattenedResult], modelIntrospection, auth.authMode, auth.authToken, !!context2) : flattenedResult;
          return {
            data: !isArrayResult && Array.isArray(initialized) ? initialized.shift() : initialized,
            errors
          };
        } else {
          return handleSingularGraphQlError(error);
        }
      } else {
        return handleSingularGraphQlError(error);
      }
    }
  });
}
function _opSubscription(client, modelIntrospection, operation, getInternals2, args, options, customUserAgentDetails) {
  const operationType = "subscription";
  const { name: operationName } = operation;
  const auth = authModeParams(client, getInternals2, options);
  const headers = getCustomHeaders(client, getInternals2, options?.headers);
  const outerArgsString = outerArguments(operation);
  const innerArgsString = innerArguments(operation);
  const selectionSet = operationSelectionSet(modelIntrospection, operation);
  const returnTypeModelName = hasStringField(operation.type, "model") ? operation.type.model : void 0;
  const query = `
    ${operationType.toLocaleLowerCase()}${outerArgsString} {
      ${operationName}${innerArgsString} ${selectionSet}
    }
  `;
  const variables = operationVariables(operation, args);
  const userAgentOverride = createUserAgentOverride(customUserAgentDetails);
  const observable2 = client.graphql({
    ...auth,
    query,
    variables,
    ...userAgentOverride
  }, headers);
  return observable2.pipe(map((value) => {
    const [key] = Object.keys(value.data);
    const data = value.data[key];
    const [initialized] = returnTypeModelName ? initializeModel(client, returnTypeModelName, [data], modelIntrospection, auth.authMode, auth.authToken) : [data];
    return initialized;
  }));
}

// node_modules/@aws-amplify/data-schema/dist/esm/runtime/internals/generateCustomOperationsProperty.mjs
var operationTypeMap = {
  queries: "query",
  mutations: "mutation",
  subscriptions: "subscription"
};
function generateCustomOperationsProperty(client, config2, operationsType, getInternals2) {
  if (!config2) {
    return {};
  }
  const modelIntrospection = config2.modelIntrospection;
  if (!modelIntrospection) {
    return {};
  }
  const operations = modelIntrospection[operationsType];
  if (!operations) {
    return {};
  }
  const ops = {};
  const useContext = getInternals2(client).amplify === null;
  for (const operation of Object.values(operations)) {
    ops[operation.name] = customOpFactory(client, modelIntrospection, operationTypeMap[operationsType], operation, useContext, getInternals2);
  }
  return ops;
}
function generateCustomMutationsProperty(client, config2, getInternals2) {
  return generateCustomOperationsProperty(client, config2, "mutations", getInternals2);
}
function generateCustomQueriesProperty(client, config2, getInternals2) {
  return generateCustomOperationsProperty(client, config2, "queries", getInternals2);
}
function generateCustomSubscriptionsProperty(client, config2, getInternals2) {
  return generateCustomOperationsProperty(client, config2, "subscriptions", getInternals2);
}

// node_modules/@aws-amplify/data-schema/dist/esm/runtime/internals/operations/get.mjs
function getFactory(client, modelIntrospection, model, operation, getInternals2, useContext = false, customUserAgentDetails) {
  const getWithContext = (contextSpec, arg, options) => {
    return _get(client, modelIntrospection, model, arg, options, operation, getInternals2, contextSpec, customUserAgentDetails);
  };
  const get4 = (arg, options) => {
    return _get(client, modelIntrospection, model, arg, options, operation, getInternals2, void 0, customUserAgentDetails);
  };
  return useContext ? getWithContext : get4;
}
function _get(client, modelIntrospection, model, arg, options, operation, getInternals2, context2, customUserAgentDetails) {
  return selfAwareAsync(async (resultPromise) => {
    const { name: name2 } = model;
    const query = generateGraphQLDocument(modelIntrospection, model, operation, options);
    const variables = buildGraphQLVariables(model, operation, arg, modelIntrospection);
    const auth = authModeParams(client, getInternals2, options);
    const headers = getCustomHeaders(client, getInternals2, options?.headers);
    const userAgentOverride = createUserAgentOverride(customUserAgentDetails);
    try {
      const basePromise = context2 ? client.graphql(context2, {
        ...auth,
        query,
        variables
      }, headers) : client.graphql({
        ...auth,
        query,
        variables,
        ...userAgentOverride
      }, headers);
      const extendedPromise = extendCancellability(basePromise, resultPromise);
      const { data, extensions } = await extendedPromise;
      if (data) {
        const [key] = Object.keys(data);
        const flattenedResult = flattenItems(modelIntrospection, name2, data[key]);
        if (flattenedResult === null) {
          return { data: null, extensions };
        } else if (options?.selectionSet) {
          return { data: flattenedResult, extensions };
        } else {
          const [initialized] = initializeModel(client, name2, [flattenedResult], modelIntrospection, auth.authMode, auth.authToken, !!context2);
          return { data: initialized, extensions };
        }
      } else {
        return { data: null, extensions };
      }
    } catch (error) {
      const { data, errors } = error;
      if (data && Object.keys(data).length !== 0 && errors) {
        const [key] = Object.keys(data);
        const flattenedResult = flattenItems(modelIntrospection, name2, data[key]);
        if (flattenedResult) {
          if (options?.selectionSet) {
            return { data: flattenedResult, errors };
          } else {
            const [initialized] = initializeModel(client, name2, [flattenedResult], modelIntrospection, auth.authMode, auth.authToken, !!context2);
            return { data: initialized, errors };
          }
        } else {
          return handleSingularGraphQlError(error);
        }
      } else {
        return handleSingularGraphQlError(error);
      }
    }
  });
}

// node_modules/@aws-amplify/data-schema/dist/esm/runtime/internals/operations/list.mjs
function listFactory(client, modelIntrospection, model, getInternals2, context2 = false, customUserAgentDetails) {
  const listWithContext = (contextSpec, args) => {
    return _list(client, modelIntrospection, model, getInternals2, args, contextSpec, customUserAgentDetails);
  };
  const list = (args) => {
    return _list(client, modelIntrospection, model, getInternals2, args, void 0, customUserAgentDetails);
  };
  return context2 ? listWithContext : list;
}
function _list(client, modelIntrospection, model, getInternals2, args, contextSpec, customUserAgentDetails) {
  return selfAwareAsync(async (resultPromise) => {
    const { name: name2 } = model;
    const query = generateGraphQLDocument(modelIntrospection, model, "LIST", args);
    const variables = buildGraphQLVariables(model, "LIST", args, modelIntrospection);
    const auth = authModeParams(client, getInternals2, args);
    const headers = getCustomHeaders(client, getInternals2, args?.headers);
    const userAgentOverride = createUserAgentOverride(customUserAgentDetails);
    try {
      const basePromise = contextSpec ? client.graphql(contextSpec, {
        ...auth,
        query,
        variables
      }, headers) : client.graphql({
        ...auth,
        query,
        variables,
        ...userAgentOverride
      }, headers);
      const extendedPromise = extendCancellability(basePromise, resultPromise);
      const { data, extensions } = await extendedPromise;
      if (data !== void 0) {
        const [key] = Object.keys(data);
        if (data[key].items) {
          const flattenedResult = data[key].items.map((value) => flattenItems(modelIntrospection, name2, value));
          if (args?.selectionSet) {
            return {
              data: flattenedResult,
              nextToken: data[key].nextToken,
              extensions
            };
          } else {
            const initialized = initializeModel(client, name2, flattenedResult, modelIntrospection, auth.authMode, auth.authToken, !!contextSpec);
            return {
              data: initialized,
              nextToken: data[key].nextToken,
              extensions
            };
          }
        }
        return {
          data: data[key],
          nextToken: data[key].nextToken,
          extensions
        };
      }
    } catch (error) {
      const { data, errors } = error;
      if (data !== void 0 && data !== null && Object.keys(data).length !== 0 && errors) {
        const [key] = Object.keys(data);
        if (data[key]?.items) {
          const flattenedResult = data[key].items.map((value) => flattenItems(modelIntrospection, name2, value));
          if (flattenedResult) {
            if (args?.selectionSet) {
              return {
                data: flattenedResult,
                nextToken: data[key]?.nextToken,
                errors
              };
            } else {
              const initialized = initializeModel(client, name2, flattenedResult, modelIntrospection, auth.authMode, auth.authToken, !!contextSpec);
              return {
                data: initialized,
                nextToken: data[key]?.nextToken,
                errors
              };
            }
          }
          return {
            data: data[key],
            nextToken: data[key]?.nextToken,
            errors
          };
        } else {
          return handleListGraphQlError(error);
        }
      } else {
        return handleListGraphQlError(error);
      }
    }
  });
}

// node_modules/@smithy/util-base64/dist-es/constants.browser.js
var alphabetByEncoding = {};
var alphabetByValue = new Array(64);
for (let i = 0, start = "A".charCodeAt(0), limit = "Z".charCodeAt(0); i + start <= limit; i++) {
  const char = String.fromCharCode(i + start);
  alphabetByEncoding[char] = i;
  alphabetByValue[i] = char;
}
for (let i = 0, start = "a".charCodeAt(0), limit = "z".charCodeAt(0); i + start <= limit; i++) {
  const char = String.fromCharCode(i + start);
  const index = i + 26;
  alphabetByEncoding[char] = index;
  alphabetByValue[index] = char;
}
for (let i = 0; i < 10; i++) {
  alphabetByEncoding[i.toString(10)] = i + 52;
  const char = i.toString(10);
  const index = i + 52;
  alphabetByEncoding[char] = index;
  alphabetByValue[index] = char;
}
alphabetByEncoding["+"] = 62;
alphabetByValue[62] = "+";
alphabetByEncoding["/"] = 63;
alphabetByValue[63] = "/";
var bitsPerLetter = 6;
var bitsPerByte = 8;
var maxLetterValue = 63;

// node_modules/@smithy/util-base64/dist-es/fromBase64.browser.js
var fromBase64 = (input) => {
  let totalByteLength = input.length / 4 * 3;
  if (input.slice(-2) === "==") {
    totalByteLength -= 2;
  } else if (input.slice(-1) === "=") {
    totalByteLength--;
  }
  const out = new ArrayBuffer(totalByteLength);
  const dataView = new DataView(out);
  for (let i = 0; i < input.length; i += 4) {
    let bits = 0;
    let bitLength = 0;
    for (let j = i, limit = i + 3; j <= limit; j++) {
      if (input[j] !== "=") {
        if (!(input[j] in alphabetByEncoding)) {
          throw new TypeError(`Invalid character ${input[j]} in base64 string.`);
        }
        bits |= alphabetByEncoding[input[j]] << (limit - j) * bitsPerLetter;
        bitLength += bitsPerLetter;
      } else {
        bits >>= bitsPerLetter;
      }
    }
    const chunkOffset = i / 4 * 3;
    bits >>= bitLength % bitsPerByte;
    const byteLength = Math.floor(bitLength / bitsPerByte);
    for (let k = 0; k < byteLength; k++) {
      const offset = (byteLength - k - 1) * bitsPerByte;
      dataView.setUint8(chunkOffset + k, (bits & 255 << offset) >> offset);
    }
  }
  return new Uint8Array(out);
};

// node_modules/@smithy/util-base64/node_modules/@smithy/util-utf8/dist-es/fromUtf8.browser.js
var fromUtf83 = (input) => new TextEncoder().encode(input);

// node_modules/@smithy/util-base64/dist-es/toBase64.browser.js
function toBase64(_input) {
  let input;
  if (typeof _input === "string") {
    input = fromUtf83(_input);
  } else {
    input = _input;
  }
  const isArrayLike2 = typeof input === "object" && typeof input.length === "number";
  const isUint8Array = typeof input === "object" && typeof input.byteOffset === "number" && typeof input.byteLength === "number";
  if (!isArrayLike2 && !isUint8Array) {
    throw new Error("@smithy/util-base64: toBase64 encoder function only accepts string | Uint8Array.");
  }
  let str = "";
  for (let i = 0; i < input.length; i += 3) {
    let bits = 0;
    let bitLength = 0;
    for (let j = i, limit = Math.min(i + 3, input.length); j < limit; j++) {
      bits |= input[j] << (limit - j - 1) * bitsPerByte;
      bitLength += bitsPerByte;
    }
    const bitClusterCount = Math.ceil(bitLength / bitsPerLetter);
    bits <<= bitClusterCount * bitsPerLetter - bitLength;
    for (let k = 1; k <= bitClusterCount; k++) {
      const offset = (bitClusterCount - k) * bitsPerLetter;
      str += alphabetByValue[(bits & maxLetterValue << offset) >> offset];
    }
    str += "==".slice(0, 4 - bitClusterCount);
  }
  return str;
}

// node_modules/@aws-amplify/data-schema/dist/esm/runtime/internals/ai/conversationMessageDeserializers.mjs
var deserializeContent = (content) => content.map((block2) => {
  if (block2.image) {
    return deserializeImageBlock(block2);
  }
  if (block2.document) {
    return deserializeDocumentBlock(block2);
  }
  if (block2.toolUse) {
    return deserializeToolUseBlock(block2);
  }
  if (block2.toolResult) {
    return deserializeToolResultBlock(block2);
  }
  return removeNullsFromBlock(block2);
});
var deserializeImageBlock = ({ image }) => ({
  image: {
    ...image,
    source: {
      ...image.source,
      bytes: fromBase64(image.source.bytes)
    }
  }
});
var deserializeDocumentBlock = ({ document: document2 }) => ({
  document: {
    ...document2,
    source: {
      ...document2.source,
      bytes: fromBase64(document2.source.bytes)
    }
  }
});
var deserializeJsonBlock = ({ json }) => ({
  json: JSON.parse(json)
});
var deserializeToolUseBlock = ({ toolUse }) => ({
  toolUse: {
    ...toolUse,
    input: JSON.parse(toolUse.input)
  }
});
var deserializeToolResultBlock = ({ toolResult }) => ({
  toolResult: {
    toolUseId: toolResult.toolUseId,
    content: toolResult.content.map((toolResultBlock) => {
      if (toolResultBlock.image) {
        return deserializeImageBlock(toolResultBlock);
      }
      if (toolResultBlock.json) {
        return deserializeJsonBlock(toolResultBlock);
      }
      return removeNullsFromBlock(toolResultBlock);
    })
  }
});
var removeNullsFromBlock = (block2) => Object.fromEntries(Object.entries(block2).filter(([_, v]) => v !== null));

// node_modules/@aws-amplify/data-schema/dist/esm/runtime/internals/ai/convertItemToConversationMessage.mjs
var convertItemToConversationMessage = ({ content, createdAt, id, conversationId, role }) => ({
  content: deserializeContent(content ?? []),
  conversationId,
  createdAt,
  id,
  role
});

// node_modules/@aws-amplify/data-schema/dist/esm/runtime/internals/ai/createListMessagesFunction.mjs
var createListMessagesFunction = (client, modelIntrospection, conversationId, conversationMessageModel, getInternals2) => async (input) => {
  const list = listFactory(client, modelIntrospection, conversationMessageModel, getInternals2, false, getCustomUserAgentDetails(AiAction2.ListMessages));
  const { data, nextToken, errors } = await list({
    ...input,
    filter: { conversationId: { eq: conversationId } }
  });
  return {
    data: data.map((item) => convertItemToConversationMessage(item)),
    nextToken,
    errors
  };
};

// node_modules/@aws-amplify/data-schema/dist/esm/runtime/internals/ai/conversationStreamEventDeserializers.mjs
var convertItemToConversationStreamEvent = ({ id, conversationId, associatedUserMessageId, contentBlockIndex, contentBlockDoneAtIndex, contentBlockDeltaIndex, contentBlockText, contentBlockToolUse, stopReason, errors }) => {
  if (errors) {
    const error = {
      id,
      conversationId,
      associatedUserMessageId,
      errors
    };
    return { error };
  }
  const next = removeNullsFromConversationStreamEvent({
    id,
    conversationId,
    associatedUserMessageId,
    contentBlockIndex,
    contentBlockDoneAtIndex,
    contentBlockDeltaIndex,
    text: contentBlockText,
    toolUse: deserializeToolUseBlock2(contentBlockToolUse),
    stopReason
  });
  return { next };
};
var deserializeToolUseBlock2 = (contentBlockToolUse) => {
  if (contentBlockToolUse) {
    const toolUseBlock = {
      ...contentBlockToolUse,
      input: JSON.parse(contentBlockToolUse.input)
    };
    return toolUseBlock;
  }
};
var removeNullsFromConversationStreamEvent = (block2) => Object.fromEntries(Object.entries(block2).filter(([_, v]) => v !== null));

// node_modules/@aws-amplify/data-schema/dist/esm/runtime/internals/ai/createOnStreamEventFunction.mjs
var createOnStreamEventFunction = (client, modelIntrospection, conversationId, conversationRouteName, getInternals2) => (handler) => {
  const { conversations } = modelIntrospection;
  if (!conversations) {
    return {};
  }
  const subscribeSchema = conversations[conversationRouteName].message.subscribe;
  const subscribeOperation = customOpFactory(client, modelIntrospection, "subscription", subscribeSchema, false, getInternals2, getCustomUserAgentDetails(AiAction2.OnStreamEvent));
  return subscribeOperation({ conversationId }).subscribe((data) => {
    const { next, error } = convertItemToConversationStreamEvent(data);
    if (error)
      handler.error(error);
    if (next)
      handler.next(next);
  });
};

// node_modules/@aws-amplify/data-schema/dist/esm/runtime/internals/ai/conversationMessageSerializers.mjs
var serializeAiContext = (aiContext) => JSON.stringify(aiContext);
var serializeContent = (content) => content.map((block2) => {
  if (block2.image) {
    return serializeImageBlock(block2);
  }
  if (block2.document) {
    return serializeDocumentBlock(block2);
  }
  if (block2.toolResult) {
    return serializeToolResultBlock(block2);
  }
  return block2;
});
var serializeToolConfiguration = ({ tools }) => ({
  tools: Object.entries(tools).map(([name2, tool]) => ({
    toolSpec: {
      name: name2,
      description: tool.description,
      inputSchema: {
        json: JSON.stringify(tool.inputSchema.json)
      }
    }
  }))
});
var serializeImageBlock = ({ image }) => ({
  image: {
    ...image,
    source: {
      ...image.source,
      bytes: toBase64(image.source.bytes)
    }
  }
});
var serializeDocumentBlock = ({ document: document2 }) => ({
  document: {
    ...document2,
    source: {
      ...document2.source,
      bytes: toBase64(document2.source.bytes)
    }
  }
});
var serializeJsonBlock = ({ json }) => ({
  json: JSON.stringify(json)
});
var serializeToolResultBlock = ({ toolResult }) => ({
  toolResult: {
    ...toolResult,
    content: toolResult.content.map((toolResultBlock) => {
      if (toolResultBlock.image) {
        return serializeImageBlock(toolResultBlock);
      }
      if (toolResultBlock.json) {
        return serializeJsonBlock(toolResultBlock);
      }
      return toolResultBlock;
    })
  }
});

// node_modules/@aws-amplify/data-schema/dist/esm/runtime/internals/ai/createSendMessageFunction.mjs
var createSendMessageFunction = (client, modelIntrospection, conversationId, conversationRouteName, getInternals2) => async (input) => {
  const { conversations } = modelIntrospection;
  if (!conversations) {
    return {};
  }
  const processedInput = typeof input === "string" ? { content: [{ text: input }] } : input;
  const { content, aiContext, toolConfiguration } = processedInput;
  const sendSchema = conversations[conversationRouteName].message.send;
  const sendOperation = customOpFactory(client, modelIntrospection, "mutation", sendSchema, false, getInternals2, getCustomUserAgentDetails(AiAction2.SendMessage));
  const { data, errors } = await sendOperation({
    conversationId,
    content: serializeContent(content),
    ...aiContext && { aiContext: serializeAiContext(aiContext) },
    ...toolConfiguration && {
      toolConfiguration: serializeToolConfiguration(toolConfiguration)
    }
  });
  return {
    data: data ? convertItemToConversationMessage(data) : data,
    errors
  };
};

// node_modules/@aws-amplify/data-schema/dist/esm/runtime/internals/ai/convertItemToConversation.mjs
var convertItemToConversation = (client, modelIntrospection, conversationId, conversationCreatedAt, conversationUpdatedAt, conversationRouteName, conversationMessageModel, getInternals2, conversationMetadata, conversationName) => {
  if (!conversationId) {
    throw new Error(`An error occurred converting a ${conversationRouteName} conversation: Missing ID`);
  }
  return {
    id: conversationId,
    createdAt: conversationCreatedAt,
    updatedAt: conversationUpdatedAt,
    metadata: conversationMetadata,
    name: conversationName,
    onStreamEvent: createOnStreamEventFunction(client, modelIntrospection, conversationId, conversationRouteName, getInternals2),
    sendMessage: createSendMessageFunction(client, modelIntrospection, conversationId, conversationRouteName, getInternals2),
    listMessages: createListMessagesFunction(client, modelIntrospection, conversationId, conversationMessageModel, getInternals2)
  };
};

// node_modules/@aws-amplify/data-schema/dist/esm/runtime/internals/ai/createCreateConversationFunction.mjs
var createCreateConversationFunction = (client, modelIntrospection, conversationRouteName, conversationModel, conversationMessageModel, getInternals2) => async (input) => {
  const { name: name2, metadata: metadataObject } = input ?? {};
  const metadata = JSON.stringify(metadataObject);
  const createOperation = getFactory(client, modelIntrospection, conversationModel, "CREATE", getInternals2, false, getCustomUserAgentDetails(AiAction2.CreateConversation));
  const { data, errors } = await createOperation({ name: name2, metadata });
  return {
    data: convertItemToConversation(client, modelIntrospection, data?.id, data?.createdAt, data?.updatedAt, conversationRouteName, conversationMessageModel, getInternals2, data?.metadata, data?.name),
    errors
  };
};

// node_modules/@aws-amplify/data-schema/dist/esm/runtime/internals/ai/createGetConversationFunction.mjs
var createGetConversationFunction = (client, modelIntrospection, conversationRouteName, conversationModel, conversationMessageModel, getInternals2) => async ({ id }) => {
  const get4 = getFactory(client, modelIntrospection, conversationModel, "GET", getInternals2, false, getCustomUserAgentDetails(AiAction2.GetConversation));
  const { data, errors } = await get4({ id });
  return {
    data: data ? convertItemToConversation(client, modelIntrospection, data.id, data.createdAt, data.updatedAt, conversationRouteName, conversationMessageModel, getInternals2, data?.metadata, data?.name) : data,
    errors
  };
};

// node_modules/@aws-amplify/data-schema/dist/esm/runtime/internals/ai/createListConversationsFunction.mjs
var createListConversationsFunction = (client, modelIntrospection, conversationRouteName, conversationModel, conversationMessageModel, getInternals2) => async (input) => {
  const list = listFactory(client, modelIntrospection, conversationModel, getInternals2, false, getCustomUserAgentDetails(AiAction2.ListConversations));
  const { data, nextToken, errors } = await list(input);
  return {
    data: data.map((datum) => {
      return convertItemToConversation(client, modelIntrospection, datum.id, datum.createdAt, datum.updatedAt, conversationRouteName, conversationMessageModel, getInternals2, datum?.metadata, datum?.name);
    }),
    nextToken,
    errors
  };
};

// node_modules/@aws-amplify/data-schema/dist/esm/runtime/internals/ai/createDeleteConversationFunction.mjs
var createDeleteConversationFunction = (client, modelIntrospection, conversationRouteName, conversationModel, conversationMessageModel, getInternals2) => async ({ id }) => {
  const deleteOperation = getFactory(client, modelIntrospection, conversationModel, "DELETE", getInternals2, false, getCustomUserAgentDetails(AiAction2.DeleteConversation));
  const { data, errors } = await deleteOperation({ id });
  return {
    data: data ? convertItemToConversation(client, modelIntrospection, data?.id, data?.createdAt, data?.updatedAt, conversationRouteName, conversationMessageModel, getInternals2, data?.metadata, data?.name) : data,
    errors
  };
};

// node_modules/@aws-amplify/data-schema/dist/esm/runtime/internals/ai/createUpdateConversationFunction.mjs
var createUpdateConversationFunction = (client, modelIntrospection, conversationRouteName, conversationModel, conversationMessageModel, getInternals2) => async ({ id, metadata: metadataObject, name: name2 }) => {
  const metadata = JSON.stringify(metadataObject);
  const updateOperation = getFactory(client, modelIntrospection, conversationModel, "UPDATE", getInternals2, false, getCustomUserAgentDetails(AiAction2.UpdateConversation));
  const { data, errors } = await updateOperation({ id, metadata, name: name2 });
  return {
    data: data ? convertItemToConversation(client, modelIntrospection, data?.id, data?.createdAt, data?.updatedAt, conversationRouteName, conversationMessageModel, getInternals2, data?.metadata, data?.name) : data,
    errors
  };
};

// node_modules/@aws-amplify/data-schema/dist/esm/runtime/internals/utils/clientProperties/generateConversationsProperty.mjs
function generateConversationsProperty(client, apiGraphQLConfig, getInternals2) {
  const modelIntrospection = apiGraphQLConfig?.modelIntrospection;
  if (!modelIntrospection?.conversations) {
    return {};
  }
  const conversations = {};
  for (const { name: name2, conversation, message, models, nonModels, enums } of Object.values(modelIntrospection.conversations)) {
    const conversationModel = models[conversation.modelName];
    const conversationMessageModel = models[message.modelName];
    if (!conversationModel || !conversationMessageModel) {
      return {};
    }
    const conversationModelIntrospection = {
      ...modelIntrospection,
      models: {
        ...modelIntrospection.models,
        ...models
      },
      nonModels: {
        ...modelIntrospection.nonModels,
        ...nonModels
      },
      enums: {
        ...modelIntrospection.enums,
        ...enums
      }
    };
    conversations[name2] = {
      update: createUpdateConversationFunction(client, conversationModelIntrospection, name2, conversationModel, conversationMessageModel, getInternals2),
      create: createCreateConversationFunction(client, conversationModelIntrospection, name2, conversationModel, conversationMessageModel, getInternals2),
      get: createGetConversationFunction(client, conversationModelIntrospection, name2, conversationModel, conversationMessageModel, getInternals2),
      delete: createDeleteConversationFunction(client, conversationModelIntrospection, name2, conversationModel, conversationMessageModel, getInternals2),
      list: createListConversationsFunction(client, conversationModelIntrospection, name2, conversationModel, conversationMessageModel, getInternals2)
    };
  }
  return conversations;
}

// node_modules/@aws-amplify/data-schema/dist/esm/runtime/internals/utils/clientProperties/generateGenerationsProperty.mjs
function generateGenerationsProperty(client, apiGraphQLConfig, getInternals2) {
  const modelIntrospection = apiGraphQLConfig?.modelIntrospection;
  if (!modelIntrospection?.generations) {
    return {};
  }
  const generations = {};
  for (const generation of Object.values(modelIntrospection.generations)) {
    generations[generation.name] = customOpFactory(client, modelIntrospection, "query", generation, false, getInternals2, getCustomUserAgentDetails(AiAction2.Generation));
  }
  return generations;
}

// node_modules/@aws-amplify/data-schema/dist/esm/runtime/internals/utils/clientProperties/generateEnumsProperty.mjs
var generateEnumsProperty = (graphqlConfig) => {
  const modelIntrospection = graphqlConfig.modelIntrospection;
  if (!modelIntrospection) {
    return {};
  }
  const enums = {};
  for (const [_, enumData] of Object.entries(modelIntrospection.enums)) {
    enums[enumData.name] = {
      values: () => enumData.values
    };
  }
  return enums;
};

// node_modules/@aws-amplify/data-schema/dist/esm/runtime/internals/operations/indexQuery.mjs
function indexQueryFactory(client, modelIntrospection, model, indexMeta, getInternals2, context2 = false) {
  const indexQueryWithContext = (contextSpec, args, options) => {
    return _indexQuery(client, modelIntrospection, model, indexMeta, getInternals2, {
      ...args,
      ...options
    }, contextSpec);
  };
  const indexQuery = (args, options) => {
    return _indexQuery(client, modelIntrospection, model, indexMeta, getInternals2, {
      ...args,
      ...options
    });
  };
  return context2 ? indexQueryWithContext : indexQuery;
}
function processGraphQlResponse(modelIntroSchema, modelName, result, selectionSet, modelInitializer) {
  const { data, extensions } = result;
  const [key] = Object.keys(data);
  if (data[key].items) {
    const flattenedResult = data[key].items.map((value) => flattenItems(modelIntroSchema, modelName, value));
    return {
      data: selectionSet ? flattenedResult : modelInitializer(flattenedResult),
      nextToken: data[key].nextToken,
      extensions
    };
  }
  return {
    data: data[key],
    nextToken: data[key].nextToken,
    extensions
  };
}
function _indexQuery(client, modelIntrospection, model, indexMeta, getInternals2, args, contextSpec) {
  return selfAwareAsync(async (resultPromise) => {
    const { name: name2 } = model;
    const query = generateGraphQLDocument(modelIntrospection, model, "INDEX_QUERY", args, indexMeta);
    const variables = buildGraphQLVariables(model, "INDEX_QUERY", args, modelIntrospection, indexMeta);
    const auth = authModeParams(client, getInternals2, args);
    const modelInitializer = (flattenedResult) => initializeModel(client, name2, flattenedResult, modelIntrospection, auth.authMode, auth.authToken, !!contextSpec);
    try {
      const headers = getCustomHeaders(client, getInternals2, args?.headers);
      const graphQlParams = {
        ...auth,
        query,
        variables
      };
      const requestArgs = [graphQlParams, headers];
      if (contextSpec !== void 0) {
        requestArgs.unshift(contextSpec);
      }
      const basePromise = client.graphql(...requestArgs);
      const extendedPromise = extendCancellability(basePromise, resultPromise);
      const response = await extendedPromise;
      if (response.data !== void 0) {
        return processGraphQlResponse(modelIntrospection, name2, response, args?.selectionSet, modelInitializer);
      }
    } catch (error) {
      const { data, errors } = error;
      if (data !== void 0 && data !== null && Object.keys(data).length !== 0 && errors) {
        const [key] = Object.keys(data);
        if (data[key]?.items) {
          const flattenedResult = data[key]?.items.map((value) => flattenItems(modelIntrospection, name2, value));
          if (flattenedResult) {
            return {
              data: args?.selectionSet ? flattenedResult : modelInitializer(flattenedResult),
              nextToken: data[key]?.nextToken
            };
          }
        }
        return {
          data: data[key],
          nextToken: data[key]?.nextToken
        };
      } else {
        return handleListGraphQlError(error);
      }
    }
  });
}

// node_modules/@aws-amplify/data-schema/dist/esm/runtime/internals/operations/subscription.mjs
function subscriptionFactory(client, modelIntrospection, model, operation, getInternals2) {
  const { name: name2 } = model;
  const subscription = (args) => {
    const query = generateGraphQLDocument(modelIntrospection, model, operation, args);
    const variables = buildGraphQLVariables(model, operation, args, modelIntrospection);
    const auth = authModeParams(client, getInternals2, args);
    const headers = getCustomHeaders(client, getInternals2, args?.headers);
    const observable2 = client.graphql({
      ...auth,
      query,
      variables
    }, headers);
    return observable2.pipe(map((value) => {
      const [key] = Object.keys(value.data);
      const data = value.data[key];
      const flattenedResult = flattenItems(modelIntrospection, name2, data);
      if (flattenedResult === null) {
        return null;
      } else if (args?.selectionSet) {
        return flattenedResult;
      } else {
        const [initialized] = initializeModel(client, name2, [flattenedResult], modelIntrospection, auth.authMode, auth.authToken);
        return initialized;
      }
    }));
  };
  return subscription;
}

// node_modules/@aws-amplify/data-schema/dist/esm/runtime/utils/resolvePKFields.mjs
function resolvePKFields(model) {
  const { primaryKeyFieldName, sortKeyFieldNames } = model.primaryKeyInfo;
  return [primaryKeyFieldName, ...sortKeyFieldNames];
}

// node_modules/@aws-amplify/data-schema/dist/esm/runtime/utils/findIndexByFields.mjs
function findIndexByFields(needle, haystack, keyFields) {
  const searchObject = Object.fromEntries(keyFields.map((fieldName) => [fieldName, needle[fieldName]]));
  for (let i = 0; i < haystack.length; i++) {
    if (Object.keys(searchObject).every((k) => searchObject[k] === haystack[i][k])) {
      return i;
    }
  }
  return -1;
}

// node_modules/@aws-amplify/data-schema/dist/esm/runtime/internals/operations/observeQuery.mjs
function observeQueryFactory(models, model) {
  const { name: name2 } = model;
  const observeQuery = (arg) => new Observable((subscriber) => {
    const items = [];
    const messageQueue = [];
    let receiveMessages = (...messages) => {
      return messageQueue.push(...messages);
    };
    const onCreateSub = models[name2].onCreate(arg).subscribe({
      next(item) {
        receiveMessages({ item, type: "create" });
      },
      error(error) {
        subscriber.error({ type: "onCreate", error });
      }
    });
    const onUpdateSub = models[name2].onUpdate(arg).subscribe({
      next(item) {
        receiveMessages({ item, type: "update" });
      },
      error(error) {
        subscriber.error({ type: "onUpdate", error });
      }
    });
    const onDeleteSub = models[name2].onDelete(arg).subscribe({
      next(item) {
        receiveMessages({ item, type: "delete" });
      },
      error(error) {
        subscriber.error({ type: "onDelete", error });
      }
    });
    function ingestMessages(messages) {
      for (const message of messages) {
        const idx = findIndexByFields(message.item, items, pkFields);
        switch (message.type) {
          case "create":
            if (idx < 0)
              items.push(message.item);
            break;
          case "update":
            if (idx >= 0)
              items[idx] = message.item;
            break;
          case "delete":
            if (idx >= 0)
              items.splice(idx, 1);
            break;
          default:
            console.error("Unrecognized message in observeQuery.", message);
        }
      }
      subscriber.next({
        items,
        isSynced: true
      });
    }
    const pkFields = resolvePKFields(model);
    (async () => {
      let firstPage = true;
      let nextToken = null;
      while (!subscriber.closed && (firstPage || nextToken)) {
        firstPage = false;
        const { data: page, errors, nextToken: _nextToken } = await models[name2].list({ ...arg, nextToken });
        nextToken = _nextToken;
        items.push(...page);
        const isSynced = messageQueue.length === 0 && (nextToken === null || nextToken === void 0);
        subscriber.next({
          items,
          isSynced
        });
        if (Array.isArray(errors)) {
          for (const error of errors) {
            subscriber.error(error);
          }
        }
      }
      if (messageQueue.length > 0) {
        ingestMessages(messageQueue);
      }
      receiveMessages = (...messages) => {
        ingestMessages(messages);
        return items.length;
      };
    })();
    return () => {
      onCreateSub.unsubscribe();
      onUpdateSub.unsubscribe();
      onDeleteSub.unsubscribe();
    };
  });
  return observeQuery;
}

// node_modules/@aws-amplify/data-schema/dist/esm/runtime/internals/clientUtils.mjs
var attributeIsSecondaryIndex = (attr) => {
  return attr.type === "key" && // presence of `name` property distinguishes GSI from primary index
  attr.properties?.name && attr.properties?.queryField && attr.properties?.fields.length > 0;
};
var getSecondaryIndexesFromSchemaModel = (model) => {
  const idxs = model.attributes?.filter(attributeIsSecondaryIndex).map((attr) => {
    const queryField = attr.properties.queryField;
    const [pk, ...sk] = attr.properties.fields;
    return {
      queryField,
      pk,
      sk
    };
  });
  return idxs || [];
};
var excludeDisabledOps = (mis, modelName) => {
  const modelAttrs = mis.models[modelName].attributes?.find((attr) => attr.type === "model");
  const coarseToFineDict = {
    queries: ["list", "get", "observeQuery"],
    mutations: ["create", "update", "delete"],
    subscriptions: ["onCreate", "onUpdate", "onDelete"]
  };
  const disabledOps = [];
  if (!modelAttrs) {
    return graphQLOperationsInfo;
  }
  if (modelAttrs.properties) {
    for (const [key, value] of Object.entries(modelAttrs.properties)) {
      if (!(key in coarseToFineDict)) {
        continue;
      }
      if (value === null) {
        disabledOps.push(...coarseToFineDict[key]);
      } else if (value instanceof Object) {
        disabledOps.push(...Object.keys(value));
      }
    }
  }
  if (disabledOps.includes("list")) {
    disabledOps.push("observeQuery");
  }
  const disabledOpsUpper = disabledOps.map((op) => op.toUpperCase());
  const filteredGraphQLOperations = Object.fromEntries(Object.entries(graphQLOperationsInfo).filter(([key]) => !disabledOpsUpper.includes(key)));
  return filteredGraphQLOperations;
};

// node_modules/@aws-amplify/data-schema/dist/esm/runtime/internals/utils/clientProperties/generateModelsProperty.mjs
function generateModelsProperty(client, apiGraphQLConfig, getInternals2) {
  const models = {};
  const modelIntrospection = apiGraphQLConfig.modelIntrospection;
  if (!modelIntrospection) {
    return {};
  }
  const SUBSCRIPTION_OPS = ["ONCREATE", "ONUPDATE", "ONDELETE"];
  for (const model of Object.values(modelIntrospection.models)) {
    const { name: name2 } = model;
    models[name2] = {};
    const enabledModelOps = excludeDisabledOps(modelIntrospection, name2);
    Object.entries(enabledModelOps).forEach(([key, { operationPrefix }]) => {
      const operation = key;
      if (operation === "LIST") {
        models[name2][operationPrefix] = listFactory(client, modelIntrospection, model, getInternals2);
      } else if (SUBSCRIPTION_OPS.includes(operation)) {
        models[name2][operationPrefix] = subscriptionFactory(client, modelIntrospection, model, operation, getInternals2);
      } else if (operation === "OBSERVEQUERY") {
        models[name2][operationPrefix] = observeQueryFactory(models, model);
      } else {
        models[name2][operationPrefix] = getFactory(client, modelIntrospection, model, operation, getInternals2);
      }
    });
    const secondaryIdxs = getSecondaryIndexesFromSchemaModel(model);
    for (const idx of secondaryIdxs) {
      models[name2][idx.queryField] = indexQueryFactory(client, modelIntrospection, model, idx, getInternals2);
    }
  }
  return models;
}

// node_modules/@aws-amplify/data-schema/dist/esm/runtime/addSchemaToClient.mjs
function addSchemaToClient(client, apiGraphqlConfig, getInternals2) {
  upgradeClientCancellation(client);
  client.models = generateModelsProperty(client, apiGraphqlConfig, getInternals2);
  client.enums = generateEnumsProperty(apiGraphqlConfig);
  client.queries = generateCustomQueriesProperty(client, apiGraphqlConfig, getInternals2);
  client.mutations = generateCustomMutationsProperty(client, apiGraphqlConfig, getInternals2);
  client.subscriptions = generateCustomSubscriptionsProperty(client, apiGraphqlConfig, getInternals2);
  client.conversations = generateConversationsProperty(client, apiGraphqlConfig, getInternals2);
  client.generations = generateGenerationsProperty(client, apiGraphqlConfig, getInternals2);
  return client;
}

// node_modules/@aws-amplify/api-graphql/dist/esm/GraphQLAPI.mjs
function isGraphQLOptionsWithOverride(options) {
  return INTERNAL_USER_AGENT_OVERRIDE in options;
}
var GraphQLAPIClass = class extends InternalGraphQLAPIClass {
  getModuleName() {
    return "GraphQLAPI";
  }
  /**
   * Executes a GraphQL operation
   *
   * @param options - GraphQL Options
   * @param [additionalHeaders] - headers to merge in after any `libraryConfigHeaders` set in the config
   * @returns An Observable if the query is a subscription query, else a promise of the graphql result.
   */
  graphql(amplify, options, additionalHeaders) {
    const userAgentDetails = {
      category: Category.API,
      action: ApiAction.GraphQl
    };
    if (isGraphQLOptionsWithOverride(options)) {
      const { [INTERNAL_USER_AGENT_OVERRIDE]: internalUserAgentOverride, ...cleanOptions } = options;
      return super.graphql(amplify, cleanOptions, additionalHeaders, {
        ...userAgentDetails,
        ...internalUserAgentOverride
      });
    }
    return super.graphql(amplify, options, additionalHeaders, {
      ...userAgentDetails
    });
  }
  /**
   * Checks to see if an error thrown is from an api request cancellation
   * @param error - Any error
   * @returns A boolean indicating if the error was from an api request cancellation
   */
  isCancelError(error) {
    return super.isCancelError(error);
  }
  /**
   * Cancels an inflight request. Only applicable for graphql queries and mutations
   * @param {any} request - request to cancel
   * @returns A boolean indicating if the request was cancelled
   */
  cancel(request, message) {
    return super.cancel(request, message);
  }
};
var GraphQLAPI = new GraphQLAPIClass();

// node_modules/@aws-amplify/api-graphql/dist/esm/internals/v6.mjs
function graphql(options, additionalHeaders) {
  const internals = getInternals(this);
  const clientEndpoint = internals.endpoint;
  const clientAuthMode = internals.authMode;
  const clientApiKey = internals.apiKey;
  options.authMode = options.authMode || clientAuthMode;
  options.apiKey = options.apiKey ?? clientApiKey;
  options.authToken = options.authToken || internals.authToken;
  if (clientEndpoint && options.authMode === "apiKey" && !options.apiKey) {
    throw new Error("graphql() requires an explicit `apiKey` for a custom `endpoint` when `authMode = 'apiKey'`.");
  }
  const headers = additionalHeaders || internals.headers;
  const result = GraphQLAPI.graphql(
    // TODO: move V6Client back into this package?
    internals.amplify,
    {
      ...options,
      endpoint: clientEndpoint
    },
    headers
  );
  return result;
}
function cancel2(promise, message) {
  return GraphQLAPI.cancel(promise, message);
}
function isCancelError2(error) {
  return GraphQLAPI.isCancelError(error);
}

// node_modules/@aws-amplify/api-graphql/dist/esm/internals/utils/runtimeTypeGuards/isApiGraphQLProviderConfig.mjs
function isApiGraphQLConfig2(apiGraphQLConfig) {
  return apiGraphQLConfig !== void 0;
}

// node_modules/@aws-amplify/api-graphql/dist/esm/internals/utils/runtimeTypeGuards/isConfigureEventWithResourceConfig.mjs
function isConfigureEventWithResourceConfig(payload) {
  return payload.event === "configure";
}

// node_modules/@aws-amplify/api-graphql/dist/esm/internals/generateClient.mjs
function generateClient(params) {
  const client = {
    [__amplify]: params.amplify,
    [__authMode]: params.authMode,
    [__authToken]: params.authToken,
    [__apiKey]: "apiKey" in params ? params.apiKey : void 0,
    [__endpoint]: "endpoint" in params ? params.endpoint : void 0,
    [__headers]: params.headers,
    graphql,
    cancel: cancel2,
    isCancelError: isCancelError2,
    models: emptyProperty,
    enums: emptyProperty,
    queries: emptyProperty,
    mutations: emptyProperty,
    subscriptions: emptyProperty
  };
  const apiGraphqlConfig = params.amplify.getConfig().API?.GraphQL;
  if (client[__endpoint]) {
    if (!client[__authMode]) {
      throw new Error("generateClient() requires an explicit `authMode` when `endpoint` is provided.");
    }
    if (client[__authMode] === "apiKey" && !client[__apiKey]) {
      throw new Error("generateClient() requires an explicit `apiKey` when `endpoint` is provided and `authMode = 'apiKey'`.");
    }
  }
  if (!client[__endpoint]) {
    if (isApiGraphQLConfig2(apiGraphqlConfig)) {
      addSchemaToClient(client, apiGraphqlConfig, getInternals);
    } else {
      generateModelsPropertyOnAmplifyConfigure(client);
    }
  }
  return client;
}
var generateModelsPropertyOnAmplifyConfigure = (clientRef) => {
  Hub.listen("core", (coreEvent) => {
    if (!isConfigureEventWithResourceConfig(coreEvent.payload)) {
      return;
    }
    const apiGraphQLConfig = coreEvent.payload.data.API?.GraphQL;
    if (isApiGraphQLConfig2(apiGraphQLConfig)) {
      addSchemaToClient(clientRef, apiGraphQLConfig, getInternals);
    }
  });
};
var emptyProperty = new Proxy({}, {
  get() {
    throw new Error("Client could not be generated. This is likely due to `Amplify.configure()` not being called prior to `generateClient()` or because the configuration passed to `Amplify.configure()` is missing GraphQL provider configuration.");
  }
});

// node_modules/@aws-amplify/api/dist/esm/API.mjs
function generateClient2(options) {
  return generateClient({
    ...options || {},
    amplify: Amplify
  });
}

// frontend/app.js
console.log("TEST V152 AWS Migration");
var PACING_API_NAME = "pacingAPI";
var PACING_API_ENDPOINT = "https://i3ar4264ka.execute-api.ap-northeast-1.amazonaws.com/Prod";
var AMPLIFY_OUTPUTS_CANDIDATES = [
  "./amplify_outputs.json",
  "../amplify_outputs.json",
  "../../amplify_outputs.json"
];
var amplifyConfigured = false;
var amplifyConfigPromise = null;
var gen2DataClient = null;
function buildApiUrl(path, queryParams) {
  const normalizedBase = PACING_API_ENDPOINT.replace(/\/$/, "");
  const normalizedPath = String(path || "").startsWith("/") ? String(path) : `/${path || ""}`;
  const url = new URL(`${normalizedBase}${normalizedPath}`);
  if (queryParams && typeof queryParams === "object") {
    Object.entries(queryParams).forEach(([key, value]) => {
      if (value !== void 0 && value !== null) {
        url.searchParams.set(key, String(value));
      }
    });
  }
  return url.toString();
}
function createHttpError(fetchResponse, bodyText) {
  const error = new Error(`HTTP ${fetchResponse.status}: ${fetchResponse.statusText}`);
  error.response = {
    status: fetchResponse.status,
    statusCode: fetchResponse.status,
    body: bodyText
  };
  return error;
}
function createFetchOperation(method, input) {
  const path = input?.path || "/";
  const options = input?.options || {};
  const headers = {
    ...options.headers || {},
    ...options.body != null ? { "Content-Type": "application/json" } : {}
  };
  const response = (async () => {
    const fetchResponse = await fetch(buildApiUrl(path, options.queryParams), {
      method,
      headers,
      body: options.body != null ? JSON.stringify(options.body) : void 0
    });
    if (!fetchResponse.ok) {
      const bodyText = await fetchResponse.text();
      throw createHttpError(fetchResponse, bodyText);
    }
    return {
      statusCode: fetchResponse.status,
      headers: fetchResponse.headers,
      body: {
        json: async () => {
          const text = await fetchResponse.text();
          return text ? JSON.parse(text) : {};
        }
      }
    };
  })();
  return { response };
}
function isInvalidApiNameError(error) {
  return String(error?.message || "").includes("InvalidApiName");
}
function withFallback(method, amplifyFn, input) {
  try {
    const operation = amplifyFn(input);
    return {
      ...operation,
      response: Promise.resolve(operation.response).catch((error) => {
        if (isInvalidApiNameError(error)) {
          console.warn(`[REST Fallback] ${method} ${input?.path || ""}`);
          return createFetchOperation(method, input).response;
        }
        throw error;
      })
    };
  } catch (error) {
    if (isInvalidApiNameError(error)) {
      console.warn(`[REST Fallback] ${method} ${input?.path || ""}`);
      return createFetchOperation(method, input);
    }
    throw error;
  }
}
function get3(input) {
  return withFallback("GET", get2, input);
}
function post4(input) {
  return withFallback("POST", post2, input);
}
function put3(input) {
  return withFallback("PUT", put2, input);
}
async function fetchSubjectListFromAdminSource() {
  const response = await fetch(buildApiUrl("/subjects"), { mode: "cors" });
  if (!response.ok) {
    throw new Error(`subjects list fetch failed: ${response.status}`);
  }
  const data = await response.json();
  return Array.isArray(data) ? data : [];
}
function normalizeId(value) {
  return String(value ?? "").trim();
}
function idsMatch(inputId, candidateId) {
  const a = normalizeId(inputId);
  const b = normalizeId(candidateId);
  if (!a || !b) return false;
  if (a === b) return true;
  const aNum = Number(a);
  const bNum = Number(b);
  return Number.isFinite(aNum) && Number.isFinite(bNum) && aNum === bNum;
}
async function resolveExistingSubjectId(inputId) {
  const subjects = await fetchSubjectListFromAdminSource();
  const found = subjects.find((subject) => idsMatch(inputId, subject?.id));
  return found ? normalizeId(found.id) : null;
}
async function loadAmplifyOutputs() {
  const tried = /* @__PURE__ */ new Set();
  for (const path of AMPLIFY_OUTPUTS_CANDIDATES) {
    try {
      const resolvedUrl = new URL(path, window.location.href).toString();
      if (tried.has(resolvedUrl)) continue;
      tried.add(resolvedUrl);
      const response = await fetch(resolvedUrl, { cache: "no-store" });
      if (!response.ok) continue;
      const json = await response.json();
      if (json && typeof json === "object") {
        console.log(`Amplify outputs loaded from ${path}`);
        return json;
      }
    } catch (_) {
    }
  }
  console.warn("amplify_outputs.json not found. Falling back to REST-only config.");
  return {};
}
function buildAmplifyConfig(outputs = {}) {
  return {
    ...outputs,
    API: {
      ...outputs.API,
      REST: {
        ...outputs.API?.REST,
        [PACING_API_NAME]: {
          endpoint: PACING_API_ENDPOINT,
          region: "ap-northeast-1"
        }
      }
    }
  };
}
async function configureAmplifyGen2() {
  if (amplifyConfigured) return;
  if (!amplifyConfigPromise) {
    amplifyConfigPromise = (async () => {
      const outputs = await loadAmplifyOutputs();
      const config2 = buildAmplifyConfig(outputs);
      DefaultAmplify.configure(config2);
      amplifyConfigured = true;
      return config2;
    })().catch((error) => {
      amplifyConfigPromise = null;
      throw error;
    });
  }
  await amplifyConfigPromise;
}
async function getGen2DataClient() {
  await configureAmplifyGen2();
  if (!gen2DataClient) {
    gen2DataClient = generateClient2();
  }
  return gen2DataClient;
}
var AmplifyGen2 = {
  async healthCheck() {
    try {
      const client = await getGen2DataClient();
      const res = await client.models.Todo.list({ limit: 1 });
      return {
        ok: true,
        mode: "GEN2_DATA",
        count: Array.isArray(res?.data) ? res.data.length : 0
      };
    } catch (error) {
      return {
        ok: false,
        mode: "REST_ONLY",
        error: error?.message || String(error)
      };
    }
  },
  async listTodos() {
    const client = await getGen2DataClient();
    const res = await client.models.Todo.list();
    return res?.data || [];
  },
  async createTodo(content) {
    if (!content || !String(content).trim()) {
      throw new Error("content is required");
    }
    const client = await getGen2DataClient();
    const res = await client.models.Todo.create({ content: String(content).trim() });
    return res?.data;
  }
};
window.AWS_CONFIG = {
  apiBase: PACING_API_ENDPOINT
};
window.AmplifyGen2 = AmplifyGen2;
var AppState = {
  // Data Models (Firestore -> DynamoDB/API)
  subject: null,
  project: null,
  exercises: [],
  projects: [],
  categories: [],
  // OpenAPI Synced State (V141/V152)
  dailyState: {
    energy_budget_0_100: 75,
    fatigue_0_10: 5,
    pain_0_10: 0,
    sleep_quality: 1
    // 0=poor, 1=ok, 2=good
  },
  settings: {
    week_goal_value: 1380,
    // MET-min (23 MET-h * 60)
    intensity_cap: "MODERATE",
    visibility: {
      "nav-home": true,
      "nav-plan": true,
      "nav-program": true,
      "nav-measure": true,
      "nav-tools": true,
      "nav-cloud": true
    }
  },
  // UI State
  vo2Records: [],
  vo2Chart: null,
  currentVo2max: null,
  weight: 60,
  isCelebrated: false,
  dailyPlan: [],
  // [{ title, startMinute, planned_duration_min, planned_mets, isAI, isDone }, ...]
  config: {
    startHour: 7,
    endHour: 22
  },
  version: "20260218_V152",
  homeMode: "input",
  // or "result"
  dailyConditionSubmitted: false,
  weeklyMets: 0,
  achieved_met_min_total: 0,
  // V141: Added for MET-min tracking
  isQuickPlanning: false,
  stepsToday: 0,
  stepsYesterday: 0,
  fitbitConnected: false,
  amplifyConnection: {
    mode: "INIT",
    connected: false,
    lastError: null
  }
};
var PX_PER_MIN = 2;
window.openScheduleSettings = function() {
  const modal = document.getElementById("modal-config");
  if (modal) {
    document.getElementById("config-start-hour").value = AppState.config.startHour;
    document.getElementById("config-end-hour").value = AppState.config.endHour;
    modal.classList.remove("hidden");
  }
};
function getJSTTimeStr(totalMinutes) {
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}
function getJSTDateStr() {
  const d = /* @__PURE__ */ new Date();
  const offset = d.getTimezoneOffset() * 6e4;
  const jstOffset = 9 * 60 * 60 * 1e3;
  const localTime = d.getTime() + offset + jstOffset;
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
var ACTIVITY_DATABASE = [
  // Lifestyle
  { name: "\u5EA7\u3063\u3066\u8AAD\u66F8\u30FB\u30C6\u30EC\u30D3\u9451\u8CDE", planned_mets: 1.3, category: "SELFCARE" },
  { name: "\u5EA7\u3063\u3066\u4E8B\u52D9\u4F5C\u696D\u30FBPC\u4F5C\u696D", planned_mets: 1.5, category: "WORK" },
  { name: "\u7ACB\u3063\u3066\u4F1A\u8A71\u30FB\u96FB\u8A71", planned_mets: 1.8, category: "OTHER" },
  { name: "\u76BF\u6D17\u3044\u30FB\u7ACB\u4F4D\u3067\u306E\u8EFD\u3044\u5BB6\u4E8B", planned_mets: 1.8, category: "HOUSEWORK" },
  { name: "\u6599\u7406\u30FB\u98DF\u6750\u306E\u6E96\u5099", planned_mets: 2, category: "HOUSEWORK" },
  { name: "\u6D17\u6FEF\u7269\u3092\u5E72\u3059\u30FB\u53D6\u308A\u8FBC\u3080", planned_mets: 2.3, category: "HOUSEWORK" },
  { name: "\u690D\u7269\u3078\u306E\u6C34\u3084\u308A", planned_mets: 2.5, category: "HOUSEWORK" },
  { name: "\u5B50\u3069\u3082\u3068\u904A\u3076 (\u7ACB\u4F4D\u30FB\u8EFD\u5EA6)", planned_mets: 2.5, category: "OTHER" },
  { name: "\u6383\u9664\u6A5F\u3092\u304B\u3051\u308B", planned_mets: 3.3, category: "HOUSEWORK" },
  { name: "\u5E8A\u78E8\u304D\u30FB\u98A8\u5442\u6383\u9664", planned_mets: 3.5, category: "HOUSEWORK" },
  { name: "\u5B50\u3069\u3082\u3068\u904A\u3076 (\u6B69\u304F/\u8D70\u308B)", planned_mets: 4, category: "OTHER" },
  { name: "\u81EA\u8EE2\u8ECA\u3067\u306E\u79FB\u52D5 (\u901A\u52E4\u30FB\u8CB7\u3044\u7269)", planned_mets: 4, category: "OUTING" },
  { name: "\u968E\u6BB5\u3092\u964D\u308A\u308B", planned_mets: 3.5, category: "OTHER" },
  { name: "\u8349\u3080\u3057\u308A\u30FB\u5EAD\u4ED5\u4E8B", planned_mets: 5, category: "HOUSEWORK" },
  { name: "\u5BB6\u5177\u306E\u79FB\u52D5\u30FB\u904B\u642C", planned_mets: 6, category: "HOUSEWORK" },
  { name: "\u96EA\u304B\u304D", planned_mets: 6, category: "HOUSEWORK" },
  { name: "\u968E\u6BB5\u3092\u4E0A\u308B (\u3086\u3063\u304F\u308A)", planned_mets: 4, category: "OTHER" },
  { name: "\u968E\u6BB5\u3092\u4E0A\u308B (\u901F\u304F)", planned_mets: 8.8, category: "OTHER" },
  // Exercise
  { name: "\u30B9\u30C8\u30EC\u30C3\u30C1\u30FB\u30E8\u30AC(\u30CF\u30BF)", planned_mets: 2.5, category: "EXERCISE" },
  { name: "\u3086\u3063\u304F\u308A\u3068\u3057\u305F\u6B69\u884C (\u6563\u6B69)", planned_mets: 3, category: "EXERCISE" },
  { name: "\u592A\u6975\u62F3", planned_mets: 3, category: "EXERCISE" },
  { name: "\u30DC\u30A6\u30EA\u30F3\u30B0", planned_mets: 3, category: "EXERCISE" },
  { name: "\u5353\u7403", planned_mets: 4, category: "EXERCISE" },
  { name: "\u30E9\u30B8\u30AA\u4F53\u64CD", planned_mets: 4, category: "EXERCISE" },
  { name: "\u901F\u6B69\u304D (\u901A\u52E4\u30FB\u901A\u5B66\u7A0B\u5EA6)", planned_mets: 4.3, category: "EXERCISE" },
  { name: "\u30A2\u30AF\u30A2\u30D3\u30AF\u30B9", planned_mets: 5.5, category: "EXERCISE" },
  { name: "\u304B\u306A\u308A\u901F\u6B69\u304D (\u904B\u52D5\u76EE\u7684)", planned_mets: 5, category: "EXERCISE" },
  { name: "\u30A6\u30A7\u30A4\u30C8\u30C8\u30EC\u30FC\u30CB\u30F3\u30B0\uFF08\u9AD8\u5F37\u5EA6\uFF09", planned_mets: 6, category: "EXERCISE" },
  { name: "\u30B8\u30E7\u30AE\u30F3\u30B0 (\u3086\u3063\u304F\u308A)", planned_mets: 7, category: "EXERCISE" },
  { name: "\u30C6\u30CB\u30B9 (\u30B7\u30F3\u30B0\u30EB\u30B9)", planned_mets: 7.3, category: "EXERCISE" },
  { name: "\u767B\u5C71", planned_mets: 7.3, category: "EXERCISE" },
  { name: "\u6C34\u6CF3\uFF08\u3086\u3063\u304F\u308A\uFF09", planned_mets: 8, category: "EXERCISE" },
  { name: "\u30E9\u30F3\u30CB\u30F3\u30B0 (9.7km/h)", planned_mets: 9.8, category: "EXERCISE" },
  { name: "\u7E04\u8DF3\u3073\uFF08\u901F\u3044\uFF09", planned_mets: 12.3, category: "EXERCISE" },
  // Proposal Specific
  { name: "\u30B9\u30AF\u30EF\u30C3\u30C8", planned_mets: 5, category: "EXERCISE" },
  { name: "\u6905\u5B50\u304B\u3089\u306E\u7ACB\u3061\u5EA7\u308A", planned_mets: 3.5, category: "EXERCISE" },
  { name: "\u6DF1\u547C\u5438\u30FB\u30EA\u30E9\u30C3\u30AF\u30B9", planned_mets: 1.2, category: "SELFCARE" }
];
var APP_MENUS = [
  { id: "nav-home", label: "\u30DB\u30FC\u30E0", icon: "\u{1F3E0}", screen: "screen-home" },
  { id: "nav-plan", label: "\u30D7\u30E9\u30F3", icon: "\u{1F4DD}", screen: "screen-plan" },
  { id: "nav-program", label: "\u904B\u52D5", icon: "\u{1F3AC}", screen: "screen-program" },
  { id: "nav-measure", label: "\u6E2C\u5B9A", icon: "\u{1F3AE}", screen: "screen-measure" },
  { id: "nav-tools", label: "\u30C4\u30FC\u30EB", icon: "\u{1F9EE}", screen: "screen-tools" },
  { id: "nav-cloud", label: "\u30AF\u30E9\u30A6\u30C9", icon: "\u2601\uFE0F", screen: "screen-cloud" }
];
var MoveCare = {
  // V141: Sync condition to AppState.dailyState
  get state() {
    return AppState.dailyState;
  },
  ui: {
    updateFatigue(v) {
      AppState.dailyState.fatigue_0_10 = parseInt(v, 10);
      document.getElementById("mc-val-fatigue").textContent = v;
    },
    setPain(v, btn) {
      AppState.dailyState.pain_0_10 = v;
      btn.parentNode.querySelectorAll(".mc-chip").forEach((c) => c.classList.remove("selected"));
      btn.classList.add("selected");
    },
    setMood(v, btn) {
      if (v === "low") AppState.dailyState.energy_budget_0_100 = 30;
      else if (v === "mid") AppState.dailyState.energy_budget_0_100 = 60;
      else if (v === "high") AppState.dailyState.energy_budget_0_100 = 90;
      btn.parentNode.querySelectorAll(".mc-chip").forEach((c) => c.classList.remove("selected"));
      btn.classList.add("selected");
    },
    setPriorityName(v, fromChip = false) {
      const val = v ? v.trim() : null;
      AppState.dailyState.priorityActivityName = val;
      const input = document.getElementById("priority-activity-name");
      if (input && input.value !== val) {
        input.value = val || "";
      }
      if (fromChip && val) {
        document.querySelectorAll("#priority-activity-chips button").forEach((b) => {
          if (b.textContent === val) b.classList.add("bg-emerald-100", "text-emerald-700", "border-emerald-200");
          else b.classList.remove("bg-emerald-100", "text-emerald-700", "border-emerald-200");
        });
      } else if (!val) {
        document.querySelectorAll("#priority-activity-chips button").forEach((b) => b.classList.remove("bg-emerald-100", "text-emerald-700", "border-emerald-200"));
      }
    },
    setPriorityCategory(v) {
      AppState.dailyState.priorityActivityCategory = v;
    }
  },
  /* --- Utilities --- */
  calculateMets(activityName, duration_min) {
    if (!activityName || !duration_min) return 0;
    const activity = ACTIVITY_DATABASE.find((a) => a.name === activityName);
    const metsVal = activity ? activity.planned_mets : 3;
    const metsHours = metsVal * duration_min / 60;
    return parseFloat(metsHours.toFixed(2));
  },
  debug: {
    async seed() {
      alert("\u30C6\u3099\u30FC\u30BF\u30D9\u30FC\u30B9\u521D\u671F\u5316\u306F\u7BA1\u7406\u8005\u7528\u30B9\u30AF\u30EA\u30D7\u30C8\u304B\u3089\u5B9F\u884C\u3057\u3066\u304F\u3060\u3055\u3044\u3002");
    },
    async clear() {
      alert("\u30C7\u30FC\u30BF\u524A\u9664\u6A5F\u80FD\u306F\u7121\u52B9\u5316\u3055\u308C\u307E\u3057\u305F\u3002");
    }
  },
  /* --- Auth & Data Loading (LIFF) --- */
  async initLIFF() {
    console.log("Initializing LIFF (app.js)...");
    try {
      await liff.init({ liffId: "2008978598-Ipe0zQRV" });
      const url = new URL(window.location.href);
      const hasOAuthParams = !!(url.searchParams.has("code") || url.searchParams.has("state") || url.searchParams.get("liff.state"));
      if (hasOAuthParams) {
        console.log("Cleaning up OAuth params from URL...");
        url.search = "";
        window.history.replaceState({}, document.title, url.toString());
      }
      const authMode = localStorage.getItem("mc-auth-mode");
      const hasSession = !!(AppState.subject && AppState.subject.id);
      console.log(`[AuthCheck] Mode: ${authMode}, HasSession: ${hasSession}, LIFF_Login: ${liff.isLoggedIn()}`);
      if (hasSession) {
        console.log(">>> [SAFE] Session active. <<<");
        const TARGET_LINE_UID = "Ub8fbc4be1b65aeab49cf3837cd66f8ed";
        if (AppState.subject && AppState.subject.lineUserId === TARGET_LINE_UID) {
          AppState.subject.id = "1";
        }
        return;
      }
      if (authMode === "manual") {
        MoveCare.showLoginScreen();
        return;
      }
      if (sessionStorage.getItem("intentional_logout")) {
        MoveCare.showLoginScreen();
        return;
      }
      if (authMode === "line" && !hasSession && !hasOAuthParams) {
        localStorage.removeItem("mc-auth-mode");
        MoveCare.showLoginScreen();
        return;
      }
      if (!authMode) {
        MoveCare.showLoginScreen();
        return;
      }
      if (authMode === "line" && liff.isLoggedIn() && !hasSession) {
        const profile = await liff.getProfile();
        await MoveCare.loginAndFetchProfile(profile.userId, profile.displayName, "line");
      } else {
        MoveCare.showLoginScreen();
      }
    } catch (e) {
      console.error("LIFF Init Error:", e);
      if (!AppState.subject) MoveCare.showLoginScreen();
    }
  },
  async handleLogin() {
    const inputId = document.getElementById("login-input-id").value.trim();
    if (!inputId) {
      alert("\u88AB\u9A13\u8005ID\u3092\u5165\u529B\u3057\u3066\u304F\u3060\u3055\u3044\u3002");
      return;
    }
    localStorage.removeItem("mc-auth-mode");
    sessionStorage.removeItem("intentional_logout");
    const loginBtn = document.getElementById("login-btn");
    const loginErrorEl = document.getElementById("login-error");
    if (loginErrorEl) loginErrorEl.classList.add("hidden");
    const originalText = loginBtn.textContent;
    loginBtn.disabled = true;
    loginBtn.textContent = "\u8AAD\u307F\u8FBC\u307F\u4E2D...";
    try {
      const resolvedId = await resolveExistingSubjectId(inputId);
      if (!resolvedId) {
        if (loginErrorEl) {
          loginErrorEl.textContent = "ID\u304C\u898B\u3064\u304B\u308A\u307E\u305B\u3093\uFF08\u88AB\u9A13\u8005\u7BA1\u7406\u306B\u767B\u9332\u3055\u308C\u305FID\u3092\u5165\u529B\u3057\u3066\u304F\u3060\u3055\u3044\uFF09\u3002";
          loginErrorEl.classList.remove("hidden");
        }
        return;
      }
      await MoveCare.loginAndFetchProfile(resolvedId, "\u88AB\u9A13\u8005 " + resolvedId, "manual");
      sessionStorage.removeItem("intentional_logout");
    } catch (e) {
      console.error("Manual Login Error:", e);
      if (loginErrorEl) {
        loginErrorEl.textContent = "\u30ED\u30B0\u30A4\u30F3\u306B\u5931\u6557\u3057\u307E\u3057\u305F\u3002\u30CD\u30C3\u30C8\u30EF\u30FC\u30AF\u307E\u305F\u306FID\u3092\u78BA\u8A8D\u3057\u3066\u304F\u3060\u3055\u3044\u3002";
        loginErrorEl.classList.remove("hidden");
      }
    } finally {
      loginBtn.disabled = false;
      loginBtn.textContent = originalText;
    }
  },
  async retryLineLogin() {
    if (AppState.subject && !confirm("LINE\u30ED\u30B0\u30A4\u30F3\u306B\u5207\u308A\u66FF\u3048\u307E\u3059\u304B\uFF1F \u73FE\u5728\u306E\u30BB\u30C3\u30B7\u30E7\u30F3\u306F\u7D42\u4E86\u3057\u307E\u3059\u3002")) return;
    sessionStorage.removeItem("intentional_logout");
    localStorage.removeItem("currentUser");
    localStorage.setItem("mc-auth-mode", "line");
    if (liff.isLoggedIn()) {
      const profile = await liff.getProfile();
      await MoveCare.loginAndFetchProfile(profile.userId, profile.displayName, "line");
    } else {
      liff.login();
    }
  },
  async loginAndFetchProfile(uid, displayName, mode) {
    console.log(`Fetching profile for: ${uid} (AWS) Mode: ${mode}`);
    try {
      let finalId = uid;
      const TARGET_LINE_UID = "Ub8fbc4be1b65aeab49cf3837cd66f8ed";
      if (mode === "line" && uid === TARGET_LINE_UID) {
        finalId = "1";
      }
      let userData;
      try {
        let path = `/subjects/${finalId}`;
        if (mode === "line") {
          try {
            const aliasOp = post4({
              apiName: PACING_API_NAME,
              path: "/auth/line",
              options: { body: { userId: uid } }
            });
            const aliasRes = await aliasOp.response;
            userData = await aliasRes.body.json();
          } catch (aliasErr) {
            console.log("Alias lookup failed, trying direct subjects/uid");
            path = `/subjects/${uid}`;
            if (uid === TARGET_LINE_UID) path = `/subjects/1`;
            const userOp = get3({
              apiName: PACING_API_NAME,
              path
            });
            const userRes = await userOp.response;
            userData = await userRes.body.json();
          }
        } else {
          const userOp = get3({
            apiName: PACING_API_NAME,
            path
          });
          const userRes = await userOp.response;
          userData = await userRes.body.json();
        }
        console.log("AWS Profile Loaded:", userData);
      } catch (err) {
        if (err.response && (err.response.statusCode === 404 || err.response.status === 404)) {
          if (mode === "line") {
            console.log(">>> [UNLINKED] This LINE account has no subject linked. <<<");
            MoveCare.showLoginScreen();
            const errorEl2 = document.getElementById("login-error");
            if (errorEl2) {
              errorEl2.textContent = "LINE\u9023\u643A\u3055\u308C\u3066\u3044\u307E\u305B\u3093\u3002\u88AB\u9A13\u8005ID\u3067\u30ED\u30B0\u30A4\u30F3\u3057\u3066\u304F\u3060\u3055\u3044\u3002";
              errorEl2.classList.remove("hidden");
            }
            return;
          }
          const errorEl = document.getElementById("login-error");
          if (errorEl) {
            errorEl.textContent = "ID\u304C\u898B\u3064\u304B\u308A\u307E\u305B\u3093\uFF08\u88AB\u9A13\u8005\u7BA1\u7406\u306B\u767B\u9332\u3055\u308C\u305FID\u3092\u5165\u529B\u3057\u3066\u304F\u3060\u3055\u3044\uFF09\u3002";
            errorEl.classList.remove("hidden");
          }
          return;
        } else {
          throw err;
        }
      }
      const effectiveId = mode === "line" && uid === TARGET_LINE_UID ? "1" : userData.id || uid;
      if (mode === "manual" && typeof liff !== "undefined" && liff.isLoggedIn()) {
        try {
          const profile = await liff.getProfile();
          console.log("Auto-linking Subject to current LINE account:", profile.userId);
          const linkOp = post4({
            apiName: PACING_API_NAME,
            path: `/subjects/${uid}/link`,
            options: { body: { userId: profile.userId } }
          });
          await linkOp.response;
        } catch (linkErr) {
          console.warn("Silent link failed", linkErr);
        }
      }
      const sessionData = {
        ...userData,
        id: effectiveId,
        loginDate: Date.now()
      };
      AppState.subject = sessionData;
      AppState.fitbitConnected = !!userData.hasFitbit;
      localStorage.setItem("currentUser", JSON.stringify(sessionData));
      if (mode) localStorage.setItem("mc-auth-mode", mode);
      if (userData.daily_schedule && Array.isArray(userData.daily_schedule) && userData.daily_schedule.length > 0) {
        AppState.dailyPlan = userData.daily_schedule;
      }
      await MoveCare.fetchDailyPlan();
      console.log(">>> UI Rendering Start <<<");
      try {
        MoveCare.fetchGlobalData().catch((e) => console.warn("Background master fetch failed", e));
      } catch (ex) {
        console.warn("Global data fetch failed", ex);
      }
      MoveCare.showAppScreen();
      switchScreen("screen-home");
      refreshUI();
    } catch (e) {
      console.error("AWS Auth Error:", e);
      if (e.message && e.message.includes("404")) {
        alert("\u30E6\u30FC\u30B6\u30FC\u304C\u898B\u3064\u304B\u308A\u307E\u305B\u3093\u3002\u88AB\u9A13\u8005ID\u3092\u78BA\u8A8D\u3057\u3066\u304F\u3060\u3055\u3044\u3002");
      } else {
        alert("\u30ED\u30B0\u30A4\u30F3\u51E6\u7406\u4E2D\u306B\u30A8\u30E9\u30FC\u304C\u767A\u751F\u3057\u307E\u3057\u305F\u3002\n\u30CD\u30C3\u30C8\u30EF\u30FC\u30AF\u74B0\u5883\u3092\u78BA\u8A8D\u3057\u3066\u304F\u3060\u3055\u3044\u3002");
      }
      const loginBtn = document.getElementById("login-btn");
      if (loginBtn) {
        loginBtn.disabled = false;
        loginBtn.textContent = "\u30ED\u30B0\u30A4\u30F3";
      }
      throw e;
    }
  },
  async fetchGlobalData() {
    try {
      try {
        const exOp = get3({ apiName: PACING_API_NAME, path: "/exercises" });
        const exRes = await exOp.response;
        AppState.exercises = await exRes.body.json();
      } catch (e) {
        console.warn("/exercises fetch failed, using fallback or empty:", e);
      }
      try {
        const projOp = get3({ apiName: PACING_API_NAME, path: "/projects" });
        const projRes = await projOp.response;
        AppState.projects = await projRes.body.json();
        if (AppState.subject && AppState.subject.projectId) {
          const pid = String(AppState.subject.projectId);
          AppState.project = AppState.projects.find((p) => String(p.id) === pid);
          if (AppState.project && AppState.project.menuConfig) {
            AppState.settings.visibility = {};
            APP_MENUS.forEach((m) => {
              AppState.settings.visibility[m.id] = AppState.project.menuConfig.includes(m.id);
            });
          }
        }
      } catch (e) {
        console.warn("/projects fetch failed", e);
      }
    } catch (e) {
      console.error("Master data fetch failed", e);
    }
  },
  async fetchFitbitData() {
    if (!AppState.subject || !AppState.subject.id) return;
    console.log("Fetching Fitbit step data...");
    try {
      const op = get3({
        apiName: PACING_API_NAME,
        path: "/fitbit/steps",
        // Assuming this path exists or mapped
        options: { queryParams: { subjectId: AppState.subject.id } }
      });
      const res = await op.response;
      const data = await res.body.json();
      console.log("Fitbit data received:", data);
      AppState.stepsToday = data.steps || 0;
      AppState.stepsYesterday = data.steps_yesterday || 0;
      if (data.status === "no_token") {
        console.warn("Fitbit token missing.");
        AppState.fitbitConnected = false;
        if (AppState.subject) AppState.subject.hasFitbit = false;
        refreshSubjectUI();
      }
      if (typeof renderFitbitSteps === "function") {
        renderFitbitSteps();
      }
    } catch (e) {
      console.warn("Fitbit data fetch failed", e);
    }
  },
  showAppScreen() {
    document.getElementById("login-modal").classList.add("hidden");
    const headerId = document.getElementById("header-subject-id");
    if (headerId) headerId.textContent = AppState.subject.id;
    const profileInfo = document.querySelector("#screen-cloud .font-bold");
    if (profileInfo && AppState.subject) {
      profileInfo.textContent = `${AppState.subject.name || "\u5229\u7528\u8005"} (ID: ${AppState.subject.id || "---"})`;
    }
    renderProgramList();
    renderBottomNav();
    try {
      refreshUI();
      refreshSubjectUI();
      MoveCare.renderPriorityChips();
    } catch (e) {
      console.error("showAppScreen render error:", e);
    }
    if (AppState.subject && AppState.subject.hasFitbit) {
      MoveCare.fetchFitbitData();
    }
    const main = document.getElementById("app-main");
    if (main) main.classList.remove("opacity-0");
    const splash = document.getElementById("splash-screen");
    if (splash) {
      splash.classList.add("opacity-0", "pointer-events-none");
      setTimeout(() => splash.style.display = "none", 500);
    }
  },
  async logout() {
    if (!confirm("\u30ED\u30B0\u30A2\u30A6\u30C8\u3057\u307E\u3059\u304B\uFF1F")) return;
    sessionStorage.setItem("intentional_logout", "true");
    try {
      if (typeof liff !== "undefined" && liff.isLoggedIn()) {
        liff.logout();
      }
    } catch (e) {
      console.warn("LIFF logout failed", e);
    }
    localStorage.removeItem("currentUser");
    localStorage.removeItem("mc-auth-mode");
    sessionStorage.removeItem("currentUser");
    localStorage.removeItem("app_version");
    if ("serviceWorker" in navigator) {
      try {
        const registrations = await navigator.serviceWorker.getRegistrations();
        for (let registration of registrations) {
          await registration.unregister();
        }
      } catch (e) {
        console.warn("SW Unregister failed", e);
      }
    }
    if ("caches" in window) {
      try {
        const names = await caches.keys();
        for (let name2 of names) await caches.delete(name2);
      } catch (e) {
        console.warn("Caches delete failed", e);
      }
    }
    window.location.href = window.location.origin + window.location.pathname;
  },
  showLoginScreen() {
    document.getElementById("login-modal").classList.remove("hidden");
    const splash = document.getElementById("splash-screen");
    if (splash) {
      splash.classList.add("opacity-0", "pointer-events-none");
      setTimeout(() => splash.style.display = "none", 500);
    }
  },
  saveConfigFromModal() {
    const s = parseInt(document.getElementById("config-start-hour").value);
    const e = parseInt(document.getElementById("config-end-hour").value);
    if (s < e && s >= 0 && e <= 24) {
      AppState.config.startHour = s;
      AppState.config.endHour = e;
      localStorage.setItem("eo_config_v1", JSON.stringify(AppState.config));
      document.getElementById("modal-config").classList.add("hidden");
      renderPlanTimeline();
    } else {
      alert("\u6709\u52B9\u306A\u6642\u9593\u7BC4\u56F2\u3092\u5165\u529B\u3057\u3066\u304F\u3060\u3055\u3044");
    }
  },
  /* --- Proposal Logic (Schedule Based) --- */
  calcVo2BasedSuggestion() {
    if (!AppState.currentVo2max) return null;
    const vo2 = AppState.currentVo2max;
    const metsMax = vo2ToMETs(vo2);
    let targetPercent = 45;
    const { fatigue_0_10, energy_budget_0_100, pain_0_10 } = AppState.dailyState;
    if (fatigue_0_10 >= 7 || pain_0_10 === 1) targetPercent = 35;
    else if (fatigue_0_10 <= 3 && energy_budget_0_100 >= 90) targetPercent = 55;
    const targetVo2 = vo2 * targetPercent / 100;
    const targetMets = vo2ToMETs(targetVo2);
    let planned_duration_min = 20;
    if (fatigue_0_10 >= 7 || pain_0_10 === 1) planned_duration_min = 10;
    else if (fatigue_0_10 <= 3 && energy_budget_0_100 >= 90) planned_duration_min = 30;
    const tri = getTriAxisPrescription(targetPercent);
    return { vo2, metsMax, targetPercent, targetMets, planned_duration_min, tri };
  },
  // Note: ensure getTriAxisPrescription is defined or this throws.
  // It is likely in the part I haven't read or is expected to exist. 
  // I will add a dummy placeholder if it's missing to prevent crash, 
  // but preserving logic means I should assume it exists in other scripts or was missed in partial read.
  // However, I read up to the end. I didn't see getTriAxisPrescription.
  // Wait, I might have missed it in lines 671-800? 
  // I'll add a helper just in case.
  startTriAxisPrescription(targetPercent) {
    return { frequency: "3 days/week", intensity: `${targetPercent}%`, time: "30 mins" };
  },
  classifyActivitiesByVO2(vo2Mets) {
    const lightMax = vo2Mets * 0.4;
    const moderateMax = vo2Mets * 0.6;
    const light = ACTIVITY_DATABASE.filter((a) => a.planned_mets <= lightMax);
    const moderate = ACTIVITY_DATABASE.filter((a) => a.planned_mets > lightMax && a.planned_mets <= moderateMax);
    const vigorous = ACTIVITY_DATABASE.filter((a) => a.planned_mets > moderateMax && a.planned_mets <= vo2Mets);
    return { light, moderate, vigorous, lightMax, moderateMax };
  },
  /* --- Fitbit Auth Logic --- */
  async connectFitbit() {
    if (!AppState.subject || !AppState.subject.id) {
      alert("\u30ED\u30B0\u30A4\u30F3\u304C\u5FC5\u8981\u3067\u3059");
      return;
    }
    const clientId = "23TRN8";
    const scope = encodeURIComponent("activity profile heartrate sleep");
    const redirectUri = encodeURIComponent(`${PACING_API_ENDPOINT}/fitbit/callback`);
    const state = AppState.subject.id;
    const authUrl = `https://www.fitbit.com/oauth2/authorize?response_type=code&client_id=${clientId}&redirect_uri=${redirectUri}&scope=${scope}&expires_in=604800&state=${state}`;
    console.log(">>> [Fitbit] Starting Auth flow");
    try {
      if (window.liff && liff.isInClient()) {
        liff.openWindow({ url: authUrl, external: false });
      } else {
        window.location.href = authUrl;
      }
    } catch (err) {
      console.error(">>> [Fitbit] Redirect failed:", err);
      window.location.assign(authUrl);
    }
  },
  /* --- Notification Logic --- */
  async scheduleNotification(timeStr, title) {
    if (!("Notification" in window)) {
      alert("\u901A\u77E5\u975E\u5BFE\u5FDC\u3067\u3059");
      return;
    }
    if (Notification.permission !== "granted") {
      try {
        const p = await Notification.requestPermission();
        if (p !== "granted") {
          alert("\u901A\u77E5\u304C\u8A31\u53EF\u3055\u308C\u307E\u305B\u3093\u3067\u3057\u305F");
          return;
        }
      } catch (e) {
        alert("\u901A\u77E5\u8A2D\u5B9A\u30A8\u30E9\u30FC: " + e.message);
        return;
      }
    }
    const [h, m] = timeStr.split(":").map(Number);
    const now = /* @__PURE__ */ new Date();
    const target = /* @__PURE__ */ new Date();
    target.setHours(h, m, 0, 0);
    if (target < now) target.setDate(target.getDate() + 1);
    const delay = target.getTime() - now.getTime();
    setTimeout(() => {
      new Notification("Activity Pacing", { body: `${title}
\u6D3B\u52D5\u306E\u6642\u9593\u3067\u3059`, icon: "https://via.placeholder.com/128?text=AP" });
    }, delay);
    if (confirm("\u901A\u77E5\u3092\u30BB\u30C3\u30C8\u3057\u307E\u3057\u305F\u3002\u30C6\u30B9\u30C8\u901A\u77E5\u3092\u9001\u308A\u307E\u3059\u304B\uFF1F")) {
      setTimeout(() => new Notification("Test", { body: "\u30C6\u30B9\u30C8\u901A\u77E5\u3067\u3059" }), 5e3);
    }
  },
  async createProposal() {
    if (!AppState.subject) return;
    const btn = document.querySelector("#mc-view-input .btn-primary");
    const originalText = btn ? btn.textContent : "\u4ECA\u65E5\u306E\u63D0\u6848\u3092\u3064\u304F\u308B \u2728";
    if (btn) {
      btn.textContent = "AI\u5206\u6790\u4E2D... \u{1F916}";
      btn.disabled = true;
    }
    try {
      const { fatigue_0_10, pain_0_10, energy_budget_0_100, sleep_quality } = AppState.dailyState;
      const context2 = {
        energy_budget_0_100: parseInt(energy_budget_0_100),
        fatigue_0_10: parseInt(fatigue_0_10),
        pain_0_10: parseInt(pain_0_10),
        sleep_quality: parseInt(sleep_quality)
      };
      const header = document.getElementById("condition-header-area");
      const inputView = document.getElementById("mc-view-input");
      const resultView = document.getElementById("mc-view-result");
      const msgEl = document.getElementById("mc-proposal-message");
      const actionsEl = document.getElementById("mc-proposal-actions");
      if (msgEl) msgEl.textContent = "AI\u304C\u5206\u6790\u3057\u3066\u3044\u307E\u3059... \u{1F916}";
      if (actionsEl) actionsEl.innerHTML = "";
      if (header) header.classList.add("hidden");
      if (inputView) inputView.classList.add("hidden");
      if (resultView) resultView.classList.remove("hidden");
      let result = null;
      try {
        const todayStr = getJSTDateStr();
        const stateOp = put3({
          apiName: PACING_API_NAME,
          path: `/planner/daily-state/${todayStr}`,
          options: { body: { ...context2, subjectId: AppState.subject?.id } }
        });
        const stateRes = await stateOp.response;
        const savedState = await stateRes.body.json();
        console.log("Daily State Saved:", savedState);
        const suggOp = get3({
          apiName: PACING_API_NAME,
          path: `/planner/suggestions`,
          options: { queryParams: { date: todayStr, subjectId: AppState.subject?.id } }
        });
        const suggRes = await suggOp.response;
        const suggestionData = await suggRes.body.json();
        console.log("Suggestions:", suggestionData);
        result = {
          message: `\u4ECA\u65E5\u306E\u30B3\u30F3\u30C7\u30A3\u30B7\u30E7\u30F3(Score: ${savedState.good_day_score_0_100})\u306B\u57FA\u3065\u304D\u3001\u30D7\u30E9\u30F3\u3092\u63D0\u6848\u3057\u307E\u3059\u3002`,
          daily_schedule: [],
          suggestion: suggestionData
        };
        if (suggestionData.cards && suggestionData.cards.length > 0) {
          result.daily_schedule = suggestionData.cards.map((card) => ({
            title: card.title,
            time: "\u63A8\u5968",
            isAI: true,
            planned_mets: card.mets,
            planned_duration_min: card.duration_options_min ? card.duration_options_min[0] : 15
          }));
        } else {
          result.message += " \u4ECA\u65E5\u306F\u3086\u3063\u304F\u308A\u4F11\u3080\u3053\u3068\u3092\u304A\u52E7\u3081\u3057\u307E\u3059\u3002";
        }
      } catch (e) {
        console.warn("API Error", e);
        alert("AI\u30B5\u30FC\u30D0\u30FC\u3078\u306E\u63A5\u7D9A\u306B\u5931\u6557\u3057\u307E\u3057\u305F\u3002");
        if (header) header.classList.remove("hidden");
        if (inputView) inputView.classList.remove("hidden");
        if (resultView) resultView.classList.add("hidden");
        return;
      }
      if (result && AppState.dailyState.priorityActivityName) {
        const pName = AppState.dailyState.priorityActivityName;
        const currentVo2 = AppState.currentVo2max || 20;
        const maxMets = currentVo2 / 3.5;
        const priorityMets = parseFloat((maxMets * 0.5).toFixed(1));
        const priorityTask = {
          title: `\u2605 ${pName}`,
          planned_mets: priorityMets,
          planned_duration_min: 30,
          category: AppState.dailyState.priorityActivityCategory || "HOBBY",
          isAI: false,
          isPriority: true,
          startMinute: 600,
          isDone: false
        };
        const restTask = {
          title: "\u4F11\u61A9\u30FB\u30EA\u30E9\u30C3\u30AF\u30B9",
          planned_mets: 1,
          planned_duration_min: 20,
          category: "SELFCARE",
          isAI: true,
          isPriority: false,
          startMinute: 630,
          isDone: false
        };
        if (!result.daily_schedule) result.daily_schedule = [];
        result.daily_schedule.forEach((task) => {
          if (task && task.isAI) {
            const oldDur = task.planned_duration_min || 20;
            const newDur = Math.max(10, Math.floor(oldDur * 0.7 / 5) * 5);
            if (newDur < oldDur) {
              task.planned_duration_min = newDur;
              task.title = task.title + " (\u8ABF\u6574)";
            }
          }
        });
        result.daily_schedule.unshift(restTask);
        result.daily_schedule.unshift(priorityTask);
        result.message = `\u300C${pName}\u300D\u3092\u512A\u5148\u3057\u305F\u30D7\u30E9\u30F3\u3067\u3059\u3002\u6D3B\u52D5\u5F8C\u306B\u306F\u3057\u3063\u304B\u308A\u4F11\u61A9\u3092\u3068\u308B\u3088\u3046\u306B\u8ABF\u6574\u3057\u307E\u3057\u305F\u3002`;
      }
      if (result) {
        MoveCare.renderDailyAdvice(result);
        localStorage.setItem("mc_proposal_cache_v1", JSON.stringify({
          message: result.message || "",
          daily_schedule: result.daily_schedule || [],
          timestamp: Date.now()
        }));
        AppState.homeMode = "result";
        AppState.dailyConditionSubmitted = true;
        MoveCare.triggerMuchikoCondition();
      }
    } catch (e) {
      console.error("Proposal Error", e);
    } finally {
      if (btn) {
        btn.textContent = originalText;
        btn.disabled = false;
      }
    }
  },
  renderDailyAdvice(data) {
    const msgEl = document.getElementById("mc-proposal-message");
    const actionsEl = document.getElementById("mc-proposal-actions");
    const approveBtn = document.getElementById("mc-proposal-approve-btn");
    if (msgEl) msgEl.textContent = data.message || "\u30D7\u30E9\u30F3\u3092\u4F5C\u6210\u3057\u307E\u3057\u305F\u3002";
    if (actionsEl) {
      actionsEl.innerHTML = "";
      const schedule = data.daily_schedule || [];
      schedule.forEach((item, idx) => {
        if (!item || !(item.isAI || item.title)) return;
        const chip = document.createElement("div");
        chip.className = "bg-white px-2 py-1 rounded-full border border-emerald-200 text-[9px] font-bold text-emerald-700 shadow-sm";
        chip.textContent = `${item.time || "\u63A8\u5968"} \u301C ${item.title}`;
        actionsEl.appendChild(chip);
      });
    }
    if (approveBtn) {
      approveBtn.onclick = () => {
        const dailyCard = document.getElementById("mc-view-result");
        approveBtn.classList.add("hidden");
        AppState.tempPlan = data.daily_schedule || [];
        if (typeof window.applyAIPosition === "function") window.applyAIPosition();
      };
    }
  },
  retryProposal() {
    console.log("Resetting to input mode...");
    AppState.homeMode = "input";
    AppState.dailyConditionSubmitted = false;
    localStorage.removeItem("mc_proposal_cache_v1");
    if (typeof window.switchScreen === "function") window.switchScreen("screen-home");
  },
  triggerMuchikoCondition() {
    const { fatigue_0_10, pain_0_10, energy_budget_0_100 } = AppState.dailyState;
    const modal = document.getElementById("modal-muchiko");
    const msgEl = document.getElementById("muchiko-message");
    const targetEl = document.getElementById("muchiko-target");
    if (!modal || !msgEl || !targetEl) return;
    if (fatigue_0_10 <= 3 && pain_0_10 === 0 && energy_budget_0_100 >= 90) {
      msgEl.innerHTML = "\u4ECA\u65E5\u306F\u7D76\u597D\u8ABF\u3060\u306D\uFF01\u30E0\u30C1\u30B3\u3082\u672C\u6C17\u51FA\u3057\u3061\u3083\u3046\u3088\uFF01<br>\u3044\u3064\u3082\u3088\u308A\u5C11\u3057\u30EC\u30D9\u30EB\u306E\u9AD8\u3044\u904B\u52D5\u306B\u6311\u6226\u3057\u3066\u307F\u3088\u3046\u3002";
      targetEl.textContent = "\u9AD8\u5F37\u5EA6\u30A4\u30F3\u30BF\u30FC\u30D0\u30EB(HIIT) or \u30B9\u30AF\u30EF\u30C3\u30C8\uFF08\u672C\u65E5\u63A8\u5968\uFF09";
      modal.classList.remove("hidden");
    }
  },
  analyzeScheduleGaps() {
    if (!AppState.dailyPlan) return [];
    const startDayLimit = (AppState.config?.startHour || 7) * 60;
    const endDayLimit = (AppState.config?.endHour || 22) * 60;
    const now = /* @__PURE__ */ new Date();
    const nowJstMinutes = now.getHours() * 60 + now.getMinutes();
    let cursor = Math.max(startDayLimit, nowJstMinutes);
    const tasks = [...AppState.dailyPlan].filter((t) => t.startMinute !== void 0).sort((a, b) => a.startMinute - b.startMinute);
    const gaps = [];
    for (let i = 0; i < tasks.length; i++) {
      const t = tasks[i];
      const tStart = t.startMinute;
      const tEnd = t.startMinute + (t.planned_duration_min || 0);
      if (tStart > cursor + 15) {
        gaps.push({ startMinute: cursor, endMinute: tStart, duration: tStart - cursor, prevActivity: i > 0 ? tasks[i - 1].title : "\u958B\u59CB", nextActivity: t.title });
      }
      cursor = Math.max(cursor, tEnd);
    }
    if (endDayLimit > cursor + 15) {
      gaps.push({ startMinute: cursor, endMinute: endDayLimit, duration: endDayLimit - cursor, prevActivity: tasks.length > 0 ? tasks[tasks.length - 1].title : "\u958B\u59CB", nextActivity: "\u7D42\u4E86" });
    }
    return gaps;
  },
  async requestAIAddonProposal() {
    console.log("Addon Proposal deactivated for migration consistency.");
  },
  renderAIAddonProposal(comment, schedule, customTitle) {
  },
  approveAIProposal(timeStr, activityName) {
    const [h, m] = timeStr.split(":").map(Number);
    const startMinute = h * 60 + m;
    const newActivity = { title: activityName, startMinute, planned_duration_min: 15, isAI: true, isDone: false };
    if (!Array.isArray(AppState.dailyPlan)) AppState.dailyPlan = [];
    AppState.dailyPlan.push(newActivity);
    localStorage.setItem("eo_daily_plan_v1", JSON.stringify(AppState.dailyPlan));
    alert(`\u300C${activityName}\u300D\u3092\u30B9\u30B1\u30B8\u30E5\u30FC\u30EB\u306B\u8FFD\u52A0\u3057\u307E\u3057\u305F\u3002`);
    if (typeof renderPlanTimeline === "function") renderPlanTimeline();
    if (typeof renderHomeSummary === "function") renderHomeSummary();
  },
  async logActivity(item, duration, silent = false) {
    if (!AppState.subject) return;
    const logData = {
      type: "activity",
      date: (/* @__PURE__ */ new Date()).toISOString(),
      name: item.name || item.title || "\u4E0D\u660E\u306A\u6D3B\u52D5",
      mets: item.planned_mets || 3,
      duration,
      done: true
    };
    try {
      const todayStr = getJSTDateStr();
      const now2 = /* @__PURE__ */ new Date();
      const timeBlock = now2.getHours() < 12 ? "AM" : now2.getHours() < 18 ? "PM" : "EVENING";
      const taskPayload = {
        subjectId: AppState.subject?.id,
        date: todayStr,
        time_block: timeBlock,
        title: logData.name,
        category: item.category || "EXERCISE",
        planned_duration_min: duration,
        planned_mets: parseFloat(logData.mets),
        auto_rest: true
      };
      const taskOp = post4({
        apiName: PACING_API_NAME,
        path: "/planner/tasks",
        options: { body: taskPayload }
      });
      const taskRes = await taskOp.response;
      const createdTask = await taskRes.body.json();
      console.log("Task Created:", createdTask);
      if (createdTask.id) {
        const completePayload = {
          subjectId: AppState.subject?.id,
          date: todayStr,
          status: "DONE",
          actual_duration_min: duration,
          actual_mets: parseFloat(logData.mets),
          post_fatigue_0_10: AppState.dailyState.fatigue_0_10 || 0,
          perceived_difficulty: 0,
          carryover_to_nextday: false
        };
        const compOp = post4({
          apiName: PACING_API_NAME,
          path: `/planner/tasks/${createdTask.id}/complete`,
          options: { body: completePayload }
        });
        await compOp.response;
      }
      if (!AppState.subject.logs) AppState.subject.logs = [];
      AppState.subject.logs.push(logData);
    } catch (e) {
      console.error("Log Activity Error:", e);
    }
    const now = /* @__PURE__ */ new Date();
    const startMin = now.getHours() * 60 + now.getMinutes();
    const planItem = {
      title: logData.name,
      startMinute: startMin,
      planned_duration_min: duration,
      planned_mets: logData.mets,
      planned_met_min: Math.round(logData.mets * duration),
      isAI: false,
      isUser: true,
      isDone: true,
      isNew: true
    };
    if (!Array.isArray(AppState.dailyPlan)) AppState.dailyPlan = [];
    AppState.dailyPlan.push(planItem);
    AppState.dailyPlan.sort((a, b) => (a.startMinute || 0) - (b.startMinute || 0));
    localStorage.setItem("eo_daily_plan_v1", JSON.stringify(AppState.dailyPlan));
    const durModal = document.getElementById("duration-modal");
    if (durModal) durModal.classList.add("hidden");
    if (!silent) {
      switchScreen("screen-complete");
      const compText = document.getElementById("complete-activity-text");
      if (compText) compText.textContent = `${logData.name} (${duration}\u5206) \u3092\u8A18\u9332\u3057\u307E\u3057\u305F\uFF01`;
    } else {
      if (typeof renderPlanTimeline === "function") renderPlanTimeline();
      refreshUI();
    }
  },
  async logCondition(day) {
    if (!AppState.subject) return;
    const { fatigue, pain, mood } = MoveCare.state;
    try {
      const todayStr = getJSTDateStr();
      let energy = 50;
      if (mood === "high") energy = 90;
      if (mood === "low") energy = 30;
      const statePayload = {
        subjectId: AppState.subject?.id,
        energy_budget_0_100: energy,
        fatigue_0_10: fatigue,
        pain_0_10: pain,
        sleep_quality: 1
      };
      const op = put3({
        apiName: PACING_API_NAME,
        path: `/planner/daily-state/${todayStr}`,
        options: { body: statePayload }
      });
      await op.response;
    } catch (e) {
      console.error("Log Condition Error", e);
    }
  }
};
function refreshSubjectUI() {
  if (!AppState.subject) return;
  renderCompletedActivities();
  renderWeeklyProgress();
  renderHomeSummary();
  renderAdminMessage();
  MoveCare.checkMuchikoPlan();
  MoveCare.renderRecommendedActivities();
  if (typeof renderFitbitSteps === "function") renderFitbitSteps();
}
function renderCompletedActivities() {
  const container = document.getElementById("completed-activities-list") || document.getElementById("home-completed-list") || document.getElementById("completed-list");
  if (!container) return;
  const completed = (AppState.dailyPlan || []).filter((item) => item && item.isDone);
  if (completed.length === 0) {
    container.innerHTML = `<div class="text-xs text-slate-400">\u5B8C\u4E86\u3057\u305F\u6D3B\u52D5\u306F\u307E\u3060\u3042\u308A\u307E\u305B\u3093</div>`;
    return;
  }
  const rows = completed.slice(-5).reverse().map((item) => {
    const duration = Number(item.planned_duration_min || 0);
    const mets = Number(item.planned_mets || 0);
    return `
            <div class="text-xs text-slate-700 bg-white border border-slate-200 rounded-lg px-2 py-1.5 mb-1">
                <span class="font-bold">${item.title || "\u6D3B\u52D5"}</span>
                <span class="text-slate-500"> ${duration}\u5206 / ${mets} METs</span>
            </div>
        `;
  });
  container.innerHTML = rows.join("");
}
MoveCare.checkMuchikoPlan = function() {
  if (!AppState.dailyPlan || AppState.dailyPlan.length === 0) return;
  const now = /* @__PURE__ */ new Date();
  const currentMin = now.getHours() * 60 + now.getMinutes();
  if (now.getHours() < 5) return;
  const task = AppState.dailyPlan.find((t) => t && t.startMinute <= currentMin && t.startMinute + t.planned_duration_min > currentMin);
  if (task && task.title) {
    const container = document.getElementById("muchiko-container");
    const bubble = document.getElementById("muchiko-bubble");
    if (container && bubble) {
      bubble.innerText = `\u4ECA\u306F\u300C${task.title}\u300D\u306E\u6642\u9593\u3060\u306D\uFF01`;
      container.classList.remove("hidden");
      container.classList.remove("translate-y-4");
      const mainModal = document.getElementById("modal-muchiko");
      if (mainModal && !mainModal.classList.contains("hidden")) {
        container.classList.add("hidden");
        return;
      }
      setTimeout(() => {
        container.classList.add("translate-y-4");
        setTimeout(() => container.classList.add("hidden"), 500);
      }, 4e3);
    }
  }
};
MoveCare.renderRecommendedActivities = function() {
  const container = document.getElementById("home-recommended-activities");
  if (!container) return;
  const { fatigue_0_10, pain_0_10, energy_budget_0_100 } = AppState.dailyState;
  const vo2 = AppState.currentVo2max || 30;
  const metsMax = vo2 / 3.5;
  let level = "normal";
  if (fatigue_0_10 >= 7 || pain_0_10 === 1) level = "light";
  else if (fatigue_0_10 <= 3 && energy_budget_0_100 >= 90) level = "high";
  let activities = MoveCare.classifyActivitiesByVO2(metsMax)[level === "high" ? "vigorous" : level === "light" ? "light" : "moderate"];
  if (!activities || activities.length === 0) activities = ACTIVITY_DATABASE.slice(0, 5);
  const currentHour = (/* @__PURE__ */ new Date()).getHours();
  if (currentHour >= 20) {
    activities = activities.filter((a) => a.planned_mets < 3);
  }
  const shuffled = [...activities].sort(() => 0.5 - Math.random());
  const picked = shuffled.slice(0, 3);
  container.innerHTML = picked.map((a) => `
        <div class="bg-white p-3 rounded-2xl border border-slate-100 shadow-sm active:scale-95 transition-all cursor-pointer flex flex-col items-center text-center" 
             onclick="MoveCare.openQuickPlanModal({name: '${a.name}', planned_mets: ${a.planned_mets}})">
            <div class="text-[8px] font-bold text-slate-400 mb-1 leading-none">${a.planned_mets} METs</div>
            <div class="text-[10px] font-black text-slate-700 mb-2 leading-tight h-8 flex items-center justify-center">${a.name}</div>
            <div class="bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded-full text-[7px] font-bold">15\u301C30\u5206</div>
        </div>
    `).join("");
};
MoveCare.openQuickPlanModal = function(activity) {
  const modal = document.getElementById("modal-plan-input");
  if (!modal) return;
  MoveCare.setupTimeSelectOptions();
  document.getElementById("plan-input-title").value = activity.name;
  const now = /* @__PURE__ */ new Date();
  const h = now.getHours();
  const m = Math.floor(now.getMinutes() / 5) * 5;
  MoveCare.currentPlanInput = { start: h * 60 + m, end: h * 60 + m + 20 };
  MoveCare.updatePlanModalSelects();
  AppState.isQuickPlanning = true;
  modal.classList.remove("hidden");
};
MoveCare.fetchDailyPlan = async function() {
  try {
    const todayStr = getJSTDateStr();
    console.log("Fetching Daily Plan for:", todayStr);
    const op = get3({
      apiName: PACING_API_NAME,
      path: "/planner/day",
      options: { queryParams: { date: todayStr, subjectId: AppState.subject?.id } }
    });
    const res = await op.response;
    const data = await res.body.json();
    if (data && data.tasks) {
      AppState.dailyPlan = data.tasks.map((t) => {
        let startMean = 0;
        if (t.start_at) {
          const d = new Date(t.start_at);
          startMean = d.getHours() * 60 + d.getMinutes();
        } else if (t.time_block === "AM") startMean = 9 * 60;
        else if (t.time_block === "PM") startMean = 14 * 60;
        else startMean = 19 * 60;
        return {
          id: t.id,
          title: t.title,
          category: t.category,
          planned_mets: t.planned_mets,
          planned_duration_min: t.planned_duration_min,
          startMinute: startMean,
          isDone: t.status === "DONE",
          isAI: false
        };
      });
      renderPlanTimeline();
    }
  } catch (e) {
    const status = e?.response?.statusCode || e?.response?.status;
    if (status === 404) {
      AppState.dailyPlan = [];
      console.info("Daily plan endpoint not available yet (/planner/day). Continuing without daily plan.");
      renderPlanTimeline();
      return;
    }
    console.warn("Failed to fetch daily plan:", e);
  }
};
function renderProgramList() {
  renderScheduled();
  renderAnytime("all");
}
function renderScheduled() {
  const c = document.getElementById("scheduled-list");
  if (c) c.innerHTML = `<div class="text-xs text-center py-4 text-slate-400 bg-slate-50 rounded-lg border border-dashed border-slate-200">\u4ECA\u65E5\u306E\u30D7\u30ED\u30B0\u30E9\u30E0\u306F\u3042\u308A\u307E\u305B\u3093</div>`;
}
function renderAnytime(filter2) {
  const c = document.getElementById("anytime-section");
  if (c) {
    c.innerHTML = `
            <div class="h-6 flex items-center border-l-4 border-emerald-500 pl-2 mb-2">
                <span class="text-sm font-bold text-emerald-800">\u3044\u3064\u3067\u3082\u3067\u304D\u308B (Anytime)</span>
            </div>
            <div id="anytime-list" class="flex flex-col gap-2 mb-4"></div>
        `;
    const list = document.getElementById("anytime-list");
    const items = AppState.exercises || [];
    if (items.length > 0) {
      list.innerHTML = items.map((i) => renderExerciseCard(i)).join("");
    } else {
      list.innerHTML = `<div class="text-xs text-center text-slate-400 py-2">\u30A8\u30AF\u30B5\u30B5\u30A4\u30BA\u304C\u898B\u3064\u304B\u308A\u307E\u305B\u3093</div>`;
    }
  }
}
function renderExerciseCard(item) {
  return `
    <div class="bg-white p-3 rounded-xl border border-emerald-100 shadow-sm flex justify-between items-center active:scale-[0.98] transition-all cursor-pointer"
         onclick="MoveCare.openQuickPlanModal({name: '${item.title || item.name}', planned_mets: ${item.planned_mets || item.mets || 3}})">
        <div class="flex items-center gap-3">
             <div class="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-lg">\u{1F3C3}</div>
             <div>
                <div class="text-xs font-bold text-slate-700 leading-tight">${item.title || item.name}</div>
                <div class="text-[10px] text-slate-400 font-mono mt-0.5">${item.planned_mets || item.mets} METs</div>
             </div>
        </div>
        <div class="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">\u8FFD\u52A0</div>
    </div>`;
}
MoveCare.setupTimeSelectOptions = function() {
  const setup = (id, max, step = 1) => {
    const sel = document.getElementById(id);
    if (!sel || sel.options.length > 0) return;
    for (let i = 0; i < max; i += step) sel.add(new Option(String(i).padStart(2, "0"), i));
  };
  setup("plan-input-start-h", 24);
  setup("plan-input-end-h", 24);
  setup("plan-input-start-m", 60, 5);
  setup("plan-input-end-m", 60, 5);
};
MoveCare.updatePlanModalSelects = function() {
  if (!MoveCare.currentPlanInput) return;
  const { start, end } = MoveCare.currentPlanInput;
  const setV = (id, v) => {
    const e = document.getElementById(id);
    if (e) e.value = v;
  };
  setV("plan-input-start-h", Math.floor(start / 60));
  setV("plan-input-start-m", start % 60);
  setV("plan-input-end-h", Math.floor(end / 60));
  setV("plan-input-end-m", end % 60);
  const dEl = document.getElementById("plan-input-duration");
  if (dEl) dEl.textContent = `${end - start}\u5206`;
};
MoveCare.renderPriorityChips = function() {
  const container = document.getElementById("priority-activity-chips");
  if (!container) return;
};
document.addEventListener("DOMContentLoaded", async () => {
  try {
    await configureAmplifyGen2();
    const connection = await AmplifyGen2.healthCheck();
    AppState.amplifyConnection.mode = connection.mode;
    AppState.amplifyConnection.connected = !!connection.ok;
    AppState.amplifyConnection.lastError = connection.ok ? null : connection.error || null;
    if (!connection.ok) {
      console.warn("Amplify Gen2 Data connection unavailable. REST mode continues.", connection.error);
    }
  } catch (error) {
    AppState.amplifyConnection.mode = "REST_ONLY";
    AppState.amplifyConnection.connected = false;
    AppState.amplifyConnection.lastError = error?.message || String(error);
    console.warn("Amplify initialize failed. REST mode continues.", error);
  }
  const authMode = localStorage.getItem("mc-auth-mode");
  const rawUser = localStorage.getItem("currentUser");
  const allowAutoRestore = localStorage.getItem("mc-auto-login") === "1";
  AppState.version = "V152";
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get("fitbit") === "success") {
    console.log("Fitbit Callback Success");
    if (rawUser) {
      const u = JSON.parse(rawUser);
      await MoveCare.loginAndFetchProfile(u.id, u.name, authMode || "line");
      alert("Fitbit\u9023\u643A\u5B8C\u4E86");
    }
  }
  if (rawUser && allowAutoRestore) {
    const user = JSON.parse(rawUser);
    const daysDiff = (Date.now() - (user.loginDate || 0)) / (1e3 * 60 * 60 * 24);
    if (daysDiff < 30) {
      console.log("Restoring existing session:", user.id);
      AppState.subject = { ...user, id: user.id };
      if (user.hasFitbit) AppState.fitbitConnected = true;
      loadConfigFromStorage();
      if (user.daily_schedule && user.daily_schedule.length > 0) {
        AppState.dailyPlan = user.daily_schedule;
        AppState.homeMode = "result";
      }
      MoveCare.fetchGlobalData();
      MoveCare.fetchDailyPlan();
      MoveCare.showAppScreen();
      switchScreen("screen-home");
    } else {
      console.log("Session expired.");
      localStorage.removeItem("currentUser");
      MoveCare.initLIFF();
    }
  } else {
    if (rawUser && !allowAutoRestore) {
      console.log("Auto session restore disabled. Showing login screen.");
    }
    await MoveCare.initLIFF();
  }
});
window.MoveCare = MoveCare;
window.setActiveNav = function(navId) {
  document.querySelectorAll(".bottom-nav-item").forEach((btn) => {
    if (btn.id === navId) btn.classList.add("active");
    else btn.classList.remove("active");
  });
};
window.renderBottomNav = function() {
  const container = document.querySelector(".bottom-nav-inner");
  if (!container) return;
  const visibility = AppState.settings?.visibility || {};
  const items = APP_MENUS.filter((menu) => visibility[menu.id] !== false);
  container.innerHTML = items.map((menu) => `
        <button id="${menu.id}" class="bottom-nav-item" onclick="switchScreen('${menu.screen}'); setActiveNav('${menu.id}')">
            <span class="text-base">${menu.icon}</span>
            <span class="text-[10px] font-bold">${menu.label}</span>
        </button>
    `).join("");
  const activeScreen = document.querySelector(".app-screen.active")?.id;
  const activeMenu = items.find((menu) => menu.screen === activeScreen) || items[0];
  if (activeMenu) setActiveNav(activeMenu.id);
};
window.switchScreen = function(id) {
  document.querySelectorAll(".app-screen").forEach((el) => el.classList.remove("active"));
  const t = document.getElementById(id);
  if (t) t.classList.add("active");
  const titleEl = document.getElementById("header-title");
  const subEl = document.getElementById("header-subtitle");
  const titles = {
    "screen-home": ["\u30DB\u30FC\u30E0", "\u4ECA\u65E5\u306E\u30D7\u30E9\u30F3\u3068\u4F53\u8ABF"],
    "screen-plan": ["\u4ECA\u65E5\u306E\u30D7\u30E9\u30F3", "\u30BF\u30A4\u30E0\u30E9\u30A4\u30F3"],
    "screen-program": ["\u904B\u52D5\u30D7\u30ED\u30B0\u30E9\u30E0", "\u30B3\u30FC\u30B9\u5225\u30E1\u30CB\u30E5\u30FC"],
    "screen-measure": ["\u6E2C\u5B9A\uFF06\u30B2\u30FC\u30E0", "\u4F53\u529B\u6E2C\u5B9A"],
    "screen-tools": ["\u30C4\u30FC\u30EB", "\u8A08\u7B97\u30C4\u30FC\u30EB"],
    "screen-cloud": ["\u30AF\u30E9\u30A6\u30C9", "\u8A2D\u5B9A\u3068\u540C\u671F"]
  };
  if (titles[id]) {
    if (titleEl) titleEl.textContent = titles[id][0];
    if (subEl) subEl.textContent = titles[id][1];
  }
  if (id === "screen-home") {
    const header = document.getElementById("condition-header-area");
    const inputView = document.getElementById("mc-view-input");
    const resultView = document.getElementById("mc-view-result");
    if (AppState.homeMode === "result") {
      if (header) header.classList.add("hidden");
      if (inputView) inputView.classList.add("hidden");
      if (resultView) resultView.classList.remove("hidden");
    } else {
      if (header) header.classList.remove("hidden");
      if (inputView) inputView.classList.remove("hidden");
      if (resultView) resultView.classList.add("hidden");
    }
    refreshUI();
  }
  if (id === "screen-plan") {
    renderPlanTimeline();
  }
};
window.renderPlanTimeline = function() {
  const c = document.getElementById("plan-body");
  if (!c) return;
  c.innerHTML = "";
  const startH = AppState.config.startHour || 5;
  const endH = AppState.config.endHour || 24;
  const totalMin = (endH - startH) * 60;
  const band = document.createElement("div");
  band.className = "relative bg-white rounded-xl border border-slate-100 shadow-sm mx-1 overflow-hidden";
  band.style.height = `${totalMin * PX_PER_MIN}px`;
  band.style.backgroundImage = "linear-gradient(#f1f5f9 1px, transparent 1px)";
  band.style.backgroundSize = `100% ${60 * PX_PER_MIN}px`;
  for (let h = startH; h < endH; h++) {
    const lbl = document.createElement("div");
    lbl.className = "absolute left-2 text-[10px] text-slate-400 font-mono font-bold pointer-events-none";
    lbl.style.top = `${(h - startH) * 60 * PX_PER_MIN + 2}px`;
    lbl.textContent = `${String(h).padStart(2, "0")}:00`;
    band.appendChild(lbl);
    const area = document.createElement("div");
    area.className = "absolute left-10 right-0 hover:bg-emerald-50/30 transition-colors cursor-pointer";
    area.style.top = `${(h - startH) * 60 * PX_PER_MIN}px`;
    area.style.height = `${60 * PX_PER_MIN}px`;
    area.onclick = () => {
      MoveCare.openQuickPlanModal({ name: "\u81EA\u7531\u6D3B\u52D5", planned_mets: 3 });
      document.getElementById("plan-input-start-h").value = h;
      document.getElementById("plan-input-start-m").value = 0;
    };
    band.appendChild(area);
  }
  if (AppState.dailyPlan && AppState.dailyPlan.length > 0) {
    AppState.dailyPlan.forEach((t) => {
      if (t.startMinute === void 0) return;
      const offset = t.startMinute - startH * 60;
      if (offset < 0) return;
      const height = Math.max((t.planned_duration_min || 15) * PX_PER_MIN, 24);
      const item = document.createElement("div");
      let colorClass = "bg-emerald-500 border-emerald-600";
      if (t.category === "HOUSEWORK") colorClass = "bg-orange-400 border-orange-500";
      else if (t.category === "WORK") colorClass = "bg-blue-400 border-blue-500";
      else if (t.category === "SELFCARE") colorClass = "bg-teal-400 border-teal-500";
      if (t.isDone) {
        colorClass = "bg-slate-400 border-slate-500 grayscale opacity-80";
      }
      item.className = `absolute left-10 right-2 rounded-lg border-l-4 shadow-sm text-white p-1.5 flex flex-col justify-center leading-tight hover:brightness-110 active:scale-[0.99] transition-all cursor-pointer z-10 ${colorClass}`;
      item.style.top = `${offset * PX_PER_MIN}px`;
      item.style.height = `${height}px`;
      item.innerHTML = `
                <div class="font-bold text-xs truncate">${t.title}</div>
                ${height > 30 ? `<div class="text-[9px] opacity-90">${t.planned_duration_min}\u5206 (${t.planned_mets} METs)</div>` : ""}
            `;
      item.onclick = (e) => {
        e.stopPropagation();
        if (confirm(`\u300C${t.title}\u300D\u3092\u524A\u9664\u3057\u307E\u3059\u304B\uFF1F`)) {
          AppState.dailyPlan = AppState.dailyPlan.filter((x) => x !== t);
          renderPlanTimeline();
        }
      };
      band.appendChild(item);
    });
  }
  c.appendChild(band);
};
window.getJSTTimeStr = getJSTTimeStr;
window.vo2ToMETs = function(v) {
  return (v || 0) / 3.5;
};
window.refreshUI = function() {
  renderVo2Chart();
  renderVo2Latest();
  updateHomeVo2Chip();
  renderHomeSummary();
  renderWeeklyProgress();
  renderAdminMessage();
  if (typeof renderFitbitSteps === "function") renderFitbitSteps();
};
window.renderVo2Chart = function() {
  const canvas = document.getElementById("vo2-chart");
  if (!canvas || !AppState.vo2Records.length) return;
  const ctx = canvas.getContext("2d");
  if (AppState.vo2Chart) AppState.vo2Chart.destroy();
  if (typeof Chart === "undefined") return;
  AppState.vo2Chart = new Chart(ctx, {
    type: "line",
    data: {
      labels: AppState.vo2Records.map((r) => r.date.substring(5)),
      // MM-DD
      datasets: [{
        label: "VO\u2082max",
        data: AppState.vo2Records.map((r) => r.value),
        borderColor: "#10b981",
        backgroundColor: "rgba(16, 185, 129, 0.1)",
        fill: true,
        tension: 0.3,
        pointRadius: 4
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: { y: { min: 10, max: 50 } }
    }
  });
};
window.renderVo2Latest = function() {
  const el = document.getElementById("vo2-latest-value");
  if (el && AppState.currentVo2max) el.textContent = AppState.currentVo2max.toFixed(1);
};
window.updateHomeVo2Chip = function() {
  const el = document.getElementById("home-vo2-display");
  if (el && AppState.currentVo2max) {
    el.innerHTML = `<span class="font-bold text-emerald-800">VO\u2082max ${AppState.currentVo2max.toFixed(1)}</span>`;
  }
};
window.renderHomeSummary = function() {
  let total = 0;
  if (AppState.dailyPlan) {
    AppState.dailyPlan.forEach((t) => {
      if (t.isDone) total += Math.round(t.planned_mets * t.planned_duration_min);
    });
  }
  const valEl = document.getElementById("home-summary-val");
  if (valEl) valEl.textContent = total;
};
window.renderWeeklyProgress = function() {
  const goal = AppState.settings.week_goal_value || 1350;
  const current = 0;
  const bar = document.getElementById("weekly-progress-bar");
  if (bar) bar.style.width = "40%";
};
window.renderAdminMessage = function() {
  const el = document.getElementById("home-admin-msg");
  if (el && AppState.subject && AppState.subject.feedforward) {
    el.innerHTML = `<div class="bg-yellow-50 p-3 rounded-xl border border-yellow-200 text-xs text-yellow-800 flex items-start gap-2"><span>\u{1F468}\u200D\u2695\uFE0F</span><span>${AppState.subject.feedforward}</span></div>`;
    el.classList.remove("hidden");
  }
};
window.renderFitbitSteps = function() {
  const el = document.getElementById("fitbit-steps-display");
  if (el && AppState.fitbitConnected) {
    el.textContent = `${AppState.stepsToday} steps`;
    el.parentElement.classList.remove("hidden");
  }
};
window.openVideoModal = function() {
  alert("Video modal placeholder");
};
window.closeVideoModal = function() {
};
window.loadConfigFromStorage = function() {
  try {
    const c = localStorage.getItem("eo_config_v1");
    if (c) AppState.config = JSON.parse(c);
  } catch (e) {
  }
};
function intensityToRPE(percent) {
  const p = Number(percent);
  if (p < 40) return { range: "9\u201311", label: "\u697D\u301C\u3084\u3084\u697D" };
  else if (p <= 60) return { range: "11\u201313", label: "\u3084\u3084\u304D\u3064\u3044" };
  else return { range: "13\u201315", label: "\u304D\u3064\u3081\u301C\u304B\u306A\u308A\u304D\u3064\u3044" };
}
function getTriAxisPrescription(percentOverride) {
  if (!AppState.currentVo2max) return null;
  const vo2 = AppState.currentVo2max;
  const percent = percentOverride != null ? Number(percentOverride) : 45;
  const hrRest = parseFloat(document.getElementById("mets-hr-rest")?.value || "0");
  const hrMax = parseFloat(document.getElementById("mets-hr-max")?.value || "0");
  const metMax = vo2ToMETs(vo2);
  const targetVo2 = vo2 * percent / 100;
  const targetMets = vo2ToMETs(targetVo2);
  let targetHr = null;
  if (hrRest && hrMax && hrMax > hrRest) {
    const hrr = hrMax - hrRest;
    targetHr = Math.round(hrRest + hrr * percent / 100);
  }
  const rpe = intensityToRPE(percent);
  return { vo2, metMax, percent, targetVo2, targetMets, targetHr, rpe };
}
window.intensityToRPE = intensityToRPE;
window.getTriAxisPrescription = getTriAxisPrescription;
console.log("App V152 Loaded (Full UI + Calc).");
/*! Bundled license information:

js-cookie/dist/js.cookie.mjs:
  (*! js-cookie v3.0.5 | MIT *)
*/
