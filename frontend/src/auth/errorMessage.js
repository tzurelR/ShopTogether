// Cognito error codes -> what the person should know and do.
const MESSAGES = {
  NotAuthorizedException: "Incorrect email or password.",
  UserNotFoundException: "Incorrect email or password.",
  UsernameExistsException: "An account with this email already exists. Log in instead.",
  InvalidPasswordException:
    "Use at least 8 characters, with an upper-case letter, a lower-case letter and a number.",
  CodeMismatchException: "That code isn't right. Check the email and try again.",
  ExpiredCodeException: "That code has expired. Request a new one.",
  CodeDeliveryFailureException: "We couldn't send the email. Try again in a few minutes.",
  LimitExceededException: "Too many attempts. Wait a few minutes and try again.",
  TooManyRequestsException: "Too many attempts. Wait a few minutes and try again.",
  TooManyFailedAttemptsException: "Too many attempts. Wait a few minutes and try again.",
  InvalidParameterException: "Check the details and try again.",
  NetworkError: "Can't reach the server. Check your connection and try again.",
};

export function errorMessage(err) {
  return MESSAGES[err?.code] || "Something went wrong. Try again.";
}
