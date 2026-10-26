import { config } from "../../config.js";
import { cognitoRequest } from "./cognitoRequest.js";

export function resendCode(email) {
  return cognitoRequest("ResendConfirmationCode", {
    ClientId: config.userPoolClientId,
    Username: email,
  });
}
