import { config } from "../../config.js";
import { cognitoRequest } from "./cognitoRequest.js";

export function forgotPassword(email) {
  return cognitoRequest("ForgotPassword", {
    ClientId: config.userPoolClientId,
    Username: email,
  });
}
