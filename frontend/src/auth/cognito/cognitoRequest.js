import { config } from "../../config.js";

// Cognito's public JSON API. Calls with the app client ID (no secret) need no AWS credentials.
const ENDPOINT = `https://cognito-idp.${config.region}.amazonaws.com/`;

export class CognitoError extends Error {
  constructor(code, message) {
    super(message);
    this.code = code;
  }
}

export async function cognitoRequest(action, body) {
  let response;
  try {
    response = await fetch(ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-amz-json-1.1",
        "X-Amz-Target": `AWSCognitoIdentityProviderService.${action}`,
      },
      body: JSON.stringify(body),
    });
  } catch {
    throw new CognitoError("NetworkError", "Network request failed");
  }
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    // __type looks like "NotAuthorizedException" or "com.amazonaws...#NotAuthorizedException".
    const code = String(data.__type || "UnknownError").split("#").pop();
    throw new CognitoError(code, data.message || code);
  }
  return data;
}
