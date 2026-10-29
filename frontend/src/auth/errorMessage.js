import { t } from "../i18n/i18n.js";

// Cognito error codes -> what the person should know and do, in their language.
const ALIASES = {
  UserNotFoundException: "NotAuthorizedException",
  TooManyRequestsException: "LimitExceededException",
  TooManyFailedAttemptsException: "LimitExceededException",
};

export function errorMessage(err) {
  if (err?.code === "NetworkError") return t("error.network");
  const code = ALIASES[err?.code] || err?.code;
  const key = `cognito.${code}`;
  const text = t(key);
  return text === key ? t("error.generic") : text;
}
