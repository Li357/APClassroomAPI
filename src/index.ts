import express from 'express';
import bodyParser from 'body-parser';
import {
  login,
  provisionCredentials,
  signRequest,
  sendGraphQLRequest,
} from './auth';
import { LoginResponse, LoginRequest, Response, GraphQLRequest } from './types';

const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.post<{}, LoginResponse, LoginRequest>('/login', async (req, res) => {
  const { username, password } = req.body;
  if (username === undefined || password === undefined) {
    throw new Error('Credentials missing!');
  }

  const token = await login(username, password);
  res.status(302).json({
    message: 'Found',
    token,
  });
});

const GRAPHQL_ENDPOINT = {
  url:
    'https://dgtkl2ep7natjmkbefhxflglie.appsync-api.us-east-1.amazonaws.com/graphql',
  service: 'appsync',
  region: 'us-east-1',
};

app.post<{}, {}, GraphQLRequest>('/graphql', async (req, res) => {
  if (req.headers.authorization === undefined) {
    throw new Error('Bearer token missing!');
  }

  const [, token] = req.headers.authorization.split(' ');
  const credentials = await provisionCredentials(token);
  const awsRequest = signRequest(req, GRAPHQL_ENDPOINT, credentials);
  const response = await sendGraphQLRequest(awsRequest);
  res.status(200).json(JSON.parse(response));
});

app.all<{}, Response, {}>('*', (_, res) => {
  res.status(404).json({ message: 'Not Found' });
});

app.listen(5000);
