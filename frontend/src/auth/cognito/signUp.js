import { config } from "../../config.js";
import { cognitoRequest } from "./cognitoRequest.js";

export function signUp(email, password) {
  return cognitoRequest("SignUp", {
    ClientId: config.userPoolClientId,
    Username: email,
    Password: password,
    UserAttributes: [{ Name: "email", Value: email }],
  });
}
