import url from 'url';
import crypto from 'crypto';
import { IncomingHttpHeaders } from 'http';
import { GraphQLCredentials, AWSService, AWSRequest } from './types';

function hmac(key: string | Buffer, src: string): Buffer {
  return crypto.createHmac('sha256', key).update(src, 'utf8').digest();
}

function hmacHex(key: string | Buffer, src: string): string {
  return crypto.createHmac('sha256', key).update(src, 'utf8').digest('hex');
}

function hash(src: string): string {
  return crypto.createHash('sha256').update(src, 'utf8').digest('hex');
}

function getCanonicalHeaders(headers: IncomingHttpHeaders): string {
  const keys = Object.keys(headers);
  if (keys.length === 0) {
    return '';
  }

  const canonical = keys
    .map((key) => {
      const value = headers[key] as string | undefined;
      return {
        key: key.toLowerCase(),
        value: value !== undefined ? value.trim().replace(/\s+/g, ' ') : '',
      };
    })
    .sort((a, b) => (a.key < b.key ? -1 : 1))
    .map(({ key, value }) => `${key}:${value}`)
    .join('\n');
  return `${canonical}\n`;
}

function getSignedHeaders(headers: IncomingHttpHeaders): string {
  return Object.keys(headers)
    .map((key) => key.toLowerCase())
    .sort()
    .join(';');
}

function getCanonicalRequest(req: AWSRequest): string {
  const { path, query } = url.parse(req.url);
  return [
    req.method,
    path,
    query || '',
    getCanonicalHeaders(req.headers),
    getSignedHeaders(req.headers),
    hash(req.body),
  ].join('\n');
}

function getCredentialScope(
  date: string,
  { region, service }: AWSService
): string {
  return [date, region, service, 'aws4_request'].join('/');
}

function getStringToSign(
  algorithm: string,
  canonicalReq: string,
  date: string,
  scope: string
): string {
  return [algorithm, date, scope, hash(canonicalReq)].join('\n');
}

function getSigningKey(
  secretKey: string,
  date: string,
  { region, service }: AWSService
): Buffer {
  const kDate = hmac(`AWS4${secretKey}`, date);
  const kRegion = hmac(kDate, region);
  const kService = hmac(kRegion, service);
  const kSigning = hmac(kService, 'aws4_request');
  return kSigning;
}

function getSignature(signingKey: Buffer, stringToSign: string): string {
  return hmacHex(signingKey, stringToSign);
}

function getAuthorizationHeader(
  algorithm: string,
  accessKey: string,
  scope: string,
  signedHeaders: string,
  signature: string
): string {
  return [
    `${algorithm} Credential=${accessKey}/${scope}`,
    `SignedHeaders=${signedHeaders}`,
    `Signature=${signature}`,
  ].join(', ');
}

export default function sign(
  req: AWSRequest,
  credentials: GraphQLCredentials,
  endpoint: AWSService
): AWSRequest {
  const now = new Date();
  const dateTime = now.toISOString().replace(/[:-]|\.\d{3}/g, '');
  const date = dateTime.substring(0, 8);
  const algorithm = 'AWS4-HMAC-SHA256';

  req.headers['host'] = req.host;
  req.headers['x-amz-date'] = dateTime;
  req.headers['X-Amz-Security-Token'] = credentials.sessionToken;

  const requestString = getCanonicalRequest(req);

  const scope = getCredentialScope(date, endpoint);
  const stringToSign = getStringToSign(
    algorithm,
    requestString,
    dateTime,
    scope
  );

  const signingKey = getSigningKey(credentials.secretAccessKey, date, endpoint);
  const signature = getSignature(signingKey, stringToSign);

  const authorization = getAuthorizationHeader(
    algorithm,
    credentials.accessKeyId,
    scope,
    getSignedHeaders(req.headers),
    signature
  );
  req.headers['Authorization'] = authorization;
  return req;
}
