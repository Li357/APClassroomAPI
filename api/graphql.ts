import { NowRequest, NowResponse } from '@now/node';
import {
  provisionCredentials,
  signRequest,
  sendGraphQLRequest,
} from '../util/auth';

const GRAPHQL_ENDPOINT = {
  url:
    'https://dgtkl2ep7natjmkbefhxflglie.appsync-api.us-east-1.amazonaws.com/graphql',
  service: 'appsync',
  region: 'us-east-1',
};

export default async function graphqlHandler(
  req: NowRequest,
  res: NowResponse,
): Promise<void> {
  const auth = req.headers.authorization?.split(' ');
  if (!auth || auth.length < 2) {
    res.status(400).json({ message: 'Token missing!' });
    return;
  }

  try {
    const [, token] = auth;
    const credentials = await provisionCredentials(token);
    const body = JSON.stringify(req.body);
    const awsRequest = signRequest(body, GRAPHQL_ENDPOINT, credentials);
    const data = await sendGraphQLRequest(awsRequest);
    res.status(200).json(JSON.parse(data));
  } catch {
    res.status(401).json({ message: 'Invalid token!' });
  }
}
