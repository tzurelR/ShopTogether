import { config } from "../../config.js";
import { cognitoRequest } from "./cognitoRequest.js";

export function confirmSignUp(email, code) {
  return cognitoRequest("ConfirmSignUp", {
    ClientId: config.userPoolClientId,
    Username: email,
    ConfirmationCode: code,
  });
}
