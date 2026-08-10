import {
  CognitoUserPool,
  CognitoUser,
  CognitoUserAttribute,
  AuthenticationDetails,
  CognitoUserSession,
  CognitoRefreshToken,
  ICognitoStorage,
  ISignUpResult,
} from 'amazon-cognito-identity-js';

const userPoolId = process.env.EXPO_PUBLIC_COGNITO_USER_POOL_ID;
const clientId = process.env.EXPO_PUBLIC_COGNITO_CLIENT_ID;

if (!userPoolId || !clientId) {
  throw new Error(
    'Cognito env vars missing. Set EXPO_PUBLIC_COGNITO_USER_POOL_ID and EXPO_PUBLIC_COGNITO_CLIENT_ID in mobile/.env',
  );
}
const createMemoryStorage = (): ICognitoStorage => {
  let data: Record<string, string> = {};
  return {
    setItem: (key, value) => {
      data[key] = value;
    },
    getItem: (key) => data[key] ?? null,
    removeItem: (key) => {
      delete data[key];
    },
    clear: () => {
      data = {};
    },
  };
};

const storage = createMemoryStorage();

const userPool = new CognitoUserPool({
  UserPoolId: userPoolId,
  ClientId: clientId,
  Storage: storage,
});

const cognitoUser = (email: string) =>
  new CognitoUser({ Username: email, Pool: userPool, Storage: storage });

export type Tokens = {
  accessToken: string;
  idToken: string;
  refreshToken: string;
};

export type Session = {
  userId: string;
  email: string;
  tokens: Tokens;
};

// The `sub` claim is the user's Cognito id — the same value the backend reads out
// of the JWT and stores as user_id.
const toSession = (session: CognitoUserSession): Session => {
  const payload = session.getIdToken().payload;
  return {
    userId: String(payload.sub),
    email: String(payload.email ?? ''),
    tokens: {
      accessToken: session.getAccessToken().getJwtToken(),
      idToken: session.getIdToken().getJwtToken(),
      refreshToken: session.getRefreshToken().getToken(),
    },
  };
};

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
    const user = cognitoUser(email);
    user.confirmRegistration(code, true, (err) => {
      if (err) return reject(err);
      resolve();
    });
  });

export const resendConfirmationCode = (email: string): Promise<void> =>
  new Promise((resolve, reject) => {
    const user = cognitoUser(email);
    user.resendConfirmationCode((err) => {
      if (err) return reject(err);
      resolve();
    });
  });

export const signIn = (email: string, password: string): Promise<Session> =>
  new Promise((resolve, reject) => {
    const user = cognitoUser(email);
    // SRP proves knowledge of the password without sending it, but the 2048-bit
    // maths runs in JS on Hermes and takes seconds. Sending the password inside the
    // TLS request instead makes sign-in immediate; requires ALLOW_USER_PASSWORD_AUTH
    // on the app client.
    user.setAuthenticationFlowType('USER_PASSWORD_AUTH');
    const authDetails = new AuthenticationDetails({ Username: email, Password: password });
    // Every challenge callback has to be handled: an unhandled one leaves the promise
    // pending forever, which looks like a dead button rather than a failure.
    user.authenticateUser(authDetails, {
      onSuccess: (session) => resolve(toSession(session)),
      onFailure: (err) => reject(err),
      newPasswordRequired: () => reject(new Error('Konto wymaga ustawienia nowego hasła')),
      mfaRequired: () => reject(new Error('Konto wymaga kodu MFA')),
      totpRequired: () => reject(new Error('Konto wymaga kodu weryfikacyjnego')),
      customChallenge: () => reject(new Error('Logowanie wymaga dodatkowego kroku')),
    });
  });

export const refreshSession = (email: string, refreshToken: string): Promise<Session> =>
  new Promise((resolve, reject) => {
    const user = cognitoUser(email);
    user.refreshSession(new CognitoRefreshToken({ RefreshToken: refreshToken }), (err, session) => {
      if (err || !session) return reject(err);
      resolve(toSession(session));
    });
  });

export const signOut = (email: string): void => {
  cognitoUser(email).signOut();
};
