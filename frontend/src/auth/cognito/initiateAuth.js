import { config } from "../../config.js";
import { cognitoRequest } from "./cognitoRequest.js";

// Returns AuthenticationResult: { AccessToken, IdToken, RefreshToken?, ExpiresIn }.
export async function logInWithPassword(email, password) {
  const data = await cognitoRequest("InitiateAuth", {
    ClientId: config.userPoolClientId,
    AuthFlow: "USER_PASSWORD_AUTH",
    AuthParameters: { USERNAME: email, PASSWORD: password },
  });
  return data.AuthenticationResult;
}

// A refresh returns new access and ID tokens; the refresh token itself stays the same.
export async function refreshTokens(refreshToken) {
  const data = await cognitoRequest("InitiateAuth", {
    ClientId: config.userPoolClientId,
    AuthFlow: "REFRESH_TOKEN_AUTH",
    AuthParameters: { REFRESH_TOKEN: refreshToken },
  });
  return data.AuthenticationResult;
}
