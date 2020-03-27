import express, { Request, Response, NextFunction } from 'express';
import bodyParser from 'body-parser';
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
import { UserError, asyncHandler } from './utils';

const app = express();
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
  const status = err instanceof UserError ? 400 : 500;
  res.status(status).json({ message: err.message });
});

app.listen(5000);
