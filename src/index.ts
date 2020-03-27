import express, { Request, Response, NextFunction } from 'express';
import bodyParser from 'body-parser';
import helmet from 'helmet';
import {
  login,
  provisionCredentials,
  signRequest,
  sendGraphQLRequest,
} from './auth';
import {
  LoginResponse,
  LoginRequest,
  GenericResponse,
  GraphQLRequest,
} from './types';
import { UserError, asyncHandler, log } from './utils';

const app = express();
app.use(helmet());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.post<{}, LoginResponse, LoginRequest>(
  '/login',
  asyncHandler(async (req, res) => {
    const { username, password } = req.body;
    if (username === undefined || password === undefined) {
      throw new UserError('Credentials missing!');
    }

    const token = await login(username, password);
    res.status(302).json({
      message: 'Found',
      token,
    });
  })
);

const GRAPHQL_ENDPOINT = {
  url:
    'https://dgtkl2ep7natjmkbefhxflglie.appsync-api.us-east-1.amazonaws.com/graphql',
  service: 'appsync',
  region: 'us-east-1',
};

app.post<{}, {}, GraphQLRequest>(
  '/graphql',
  asyncHandler(async (req, res) => {
    if (req.headers.authorization === undefined) {
      throw new UserError('Bearer token missing!');
    }

    const [, token] = req.headers.authorization.split(' ');
    const credentials = await provisionCredentials(token);
    const awsRequest = signRequest(req, GRAPHQL_ENDPOINT, credentials);
    const response = await sendGraphQLRequest(awsRequest);
    res.status(200).json(JSON.parse(response));
  })
);

app.all<{}, GenericResponse, {}>('*', (_, res) => {
  res.status(404).json({ message: 'Not Found' });
});

// next argument needed to maintain function signature
// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  const isUserError = err instanceof UserError;
  if (isUserError) {
    log(
      `${err.message} when requesting ${req.method} ${req.url}. Stacktrace:\n${err.stack}`
    );
  }

  const status = isUserError ? 400 : 500;
  res.status(status).json({ message: err.message });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  log(`AP Classroom API up and running at ${PORT}!`);
});
