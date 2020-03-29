export interface AWSCredentials {
  AccessKeyId: string;
  SecretAccessKey: string;
  SessionToken: string;
}

export interface AWSCredentialsData {
  apfym?: { Credentials: AWSCredentials };
  cbJwtToken?: string;
}

export interface GraphQLCredentials {
  accessKeyId: string;
  secretAccessKey: string;
  sessionToken: string;
  jwtToken: string;
  sessionId: string;
}

export interface AWSService {
  url: string;
  service: string;
  region: string;
}

export interface AWSRequest extends AWSService {
  method: string;
  headers: Record<string, string>;
  host: string;
  path: string;
  body: string;
}
