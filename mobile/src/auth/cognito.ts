import {
  CognitoUserPool,
  CognitoUser,
  CognitoUserAttribute,
  AuthenticationDetails,
  CognitoUserSession,
  CognitoRefreshToken,
  ISignUpResult,
} from 'amazon-cognito-identity-js';

const userPoolId = process.env.EXPO_PUBLIC_COGNITO_USER_POOL_ID;
const clientId = process.env.EXPO_PUBLIC_COGNITO_CLIENT_ID;

if (!userPoolId || !clientId) {
  throw new Error(
    'Cognito env vars missing. Set EXPO_PUBLIC_COGNITO_USER_POOL_ID and EXPO_PUBLIC_COGNITO_CLIENT_ID in mobile/.env',
  );
}

const userPool = new CognitoUserPool({
  UserPoolId: userPoolId,
  ClientId: clientId,
});

export type Tokens = {
  accessToken: string;
  idToken: string;
  refreshToken: string;
};

const getTokensFromSession = (session: CognitoUserSession): Tokens => ({
  accessToken: session.getAccessToken().getJwtToken(),
  idToken: session.getIdToken().getJwtToken(),
  refreshToken: session.getRefreshToken().getToken(),
});

export const signUp = (email: string, password: string): Promise<ISignUpResult> =>
  new Promise((resolve, reject) => {
    const attributes = [new CognitoUserAttribute({ Name: 'email', Value: email })];
    userPool.signUp(email, password, attributes, [], (err, result) => {
      if (err || !result) return reject(err);
      resolve(result);
    });
  });

export const confirmSignUp = (email: string, code: string): Promise<void> =>
  new Promise((resolve, reject) => {
    const user = new CognitoUser({ Username: email, Pool: userPool });
    user.confirmRegistration(code, true, (err) => {
      if (err) return reject(err);
      resolve();
    });
  });

export const resendConfirmationCode = (email: string): Promise<void> =>
  new Promise((resolve, reject) => {
    const user = new CognitoUser({ Username: email, Pool: userPool });
    user.resendConfirmationCode((err) => {
      if (err) return reject(err);
      resolve();
    });
  });

export const signIn = (email: string, password: string): Promise<Tokens> =>
  new Promise((resolve, reject) => {
    const user = new CognitoUser({ Username: email, Pool: userPool });
    const authDetails = new AuthenticationDetails({ Username: email, Password: password });
    user.authenticateUser(authDetails, {
      onSuccess: (session) => resolve(getTokensFromSession(session)),
      onFailure: (err) => reject(err),
    });
  });

export const refreshSession = (email: string, refreshToken: string): Promise<Tokens> =>
  new Promise((resolve, reject) => {
    const user = new CognitoUser({ Username: email, Pool: userPool });
    user.refreshSession(new CognitoRefreshToken({ RefreshToken: refreshToken }), (err, session) => {
      if (err || !session) return reject(err);
      resolve(getTokensFromSession(session));
    });
  });

export const signOut = (email: string): void => {
  const user = new CognitoUser({ Username: email, Pool: userPool });
  user.signOut();
};
