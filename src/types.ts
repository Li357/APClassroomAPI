export interface Response {
  message: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse extends Response {
  token: string;
}

export interface GraphQLRequest {
  token: string;
}

export interface AWSCredentials {
  AccessKeyId: string;
  SecretAccessKey: string;
  SessionToken: string;
}

export interface AWSCredentialsData {
  apfym: { Credentials: AWSCredentials };
  cbJwtToken: string;
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
