import { config } from "../../config.js";
import { cognitoRequest } from "./cognitoRequest.js";

export function confirmForgotPassword(email, code, newPassword) {
  return cognitoRequest("ConfirmForgotPassword", {
    ClientId: config.userPoolClientId,
    Username: email,
    ConfirmationCode: code,
    Password: newPassword,
  });
}
