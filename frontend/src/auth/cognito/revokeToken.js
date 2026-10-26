import { config } from "../../config.js";
import { cognitoRequest } from "./cognitoRequest.js";

// Invalidates the refresh token and every access token issued from it.
export function revokeToken(refreshToken) {
  return cognitoRequest("RevokeToken", {
    ClientId: config.userPoolClientId,
    Token: refreshToken,
  });
}
