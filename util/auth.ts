import https from 'https';
import url from 'url';
import qs from 'querystring';
import cookie from 'cookie';
import sign from './sign';
import {
  GraphQLCredentials,
  AWSCredentialsData,
  AWSService,
  AWSRequest,
} from './types';

const LOGIN_URL = 'https://account.collegeboard.org/login/authenticateUser';
const LOGIN_COOKIE_NAME = 'cb_login';

const AUTHORIZATION_TYPE = 'CBLogin';
const COGNITO_URL =
  'https://sucred.catapult-prod.collegeboard.org/rel/temp-user-aws-creds?cbEnv=pine&appId=366&cbAWSDomains=apfym,catapult';

const AUTHENTICATION_TOKEN_HEADER = 'x-cb-catapult-authentication-token';
const AUTHORIZATION_TOKEN_HEADER = 'x-cb-catapult-authorization-token';

export function login(username: string, password: string): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    const data = qs.stringify({
      username,
      password,
    });
    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': data.length,
      },
    };

    const req = https.request(LOGIN_URL, options, (res) => {
      const cookies = res.headers['set-cookie'];
      const loginCookie = cookies?.find((c) => c.includes(LOGIN_COOKIE_NAME));
      if (loginCookie === undefined) {
        return reject(
          new Error('Authentication failed! Incorrect credentials'),
        );
      }

      const { cb_login: loginToken } = cookie.parse(loginCookie);
      resolve(loginToken);
    });

    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

export function provisionCredentials(
  token: string,
): Promise<GraphQLCredentials> {
  return new Promise<GraphQLCredentials>((resolve, reject) => {
    const url = `${COGNITO_URL}&cacheNonce=${Date.now()}`;
    const options = {
      method: 'GET',
      headers: {
        Authorization: `${AUTHORIZATION_TYPE} ${token}`,
      },
    };

    const req = https.request(url, options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        const { cbJwtToken: jwtToken, apfym }: AWSCredentialsData = JSON.parse(
          data,
        );
        const {
          Credentials: {
            AccessKeyId: accessKeyId,
            SecretAccessKey: secretAccessKey,
            SessionToken: sessionToken,
          },
        } = apfym;

        resolve({
          jwtToken,
          accessKeyId,
          secretAccessKey,
          sessionToken,
          sessionId: token,
        });
      });
    });

    req.on('error', reject);
    req.end();
  });
}

export function signRequest(
  body: string,
  endpoint: AWSService,
  credentials: GraphQLCredentials,
): AWSRequest {
  const { host, path } = url.parse(endpoint.url);
  const normalized = {
    method: 'POST',
    headers: {
      accept: '*/*',
      'content-type': 'application/json; charset=UTF-8',
    },
    service: endpoint.service,
    region: endpoint.region,
    url: endpoint.url,
    host: host!, // eslint-disable-line @typescript-eslint/no-non-null-assertion
    path: path!, // eslint-disable-line @typescript-eslint/no-non-null-assertion
    body,
  };

  const signedReq = sign(normalized, credentials, endpoint);
  signedReq.headers[AUTHENTICATION_TOKEN_HEADER] = credentials.sessionId;
  signedReq.headers[AUTHORIZATION_TOKEN_HEADER] = credentials.jwtToken;
  return signedReq;
}

export function sendGraphQLRequest(options: AWSRequest): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    const graphQLReq = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        resolve(data);
      });
    });

    graphQLReq.on('error', reject);
    graphQLReq.write(options.body);
    graphQLReq.end();
  });
}
