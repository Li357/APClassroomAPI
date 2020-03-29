import url from 'url';
import { login, provisionCredentials, signRequest } from '../util/auth';
import { AWSService, GraphQLCredentials } from '../util/types';

describe('login', () => {
  it('throws error if credentials are invalid', async () => {
    await expect(login('', '')).rejects.toThrow('Invalid');
  });

  it('returns token if credentials are valid', async () => {
    const { TEST_USERNAME, TEST_PASSWORD } = process.env;
    expect(TEST_USERNAME).toBeTruthy();
    expect(TEST_PASSWORD).toBeTruthy();

    const token = await login(TEST_USERNAME!, TEST_PASSWORD!); // eslint-disable-line @typescript-eslint/no-non-null-assertion
    // tokens are of format XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX
    expect(token).toHaveLength(36);
  });
});

describe('provisioning aws credentials', () => {
  it('throws error if token is invalid', async () => {
    await expect(provisionCredentials('')).rejects.toThrow('Invalid');
  });

  it('returns credentials if token is valid', async () => {
    const { TEST_USERNAME, TEST_PASSWORD } = process.env;
    const token = await login(TEST_USERNAME!, TEST_PASSWORD!); // eslint-disable-line @typescript-eslint/no-non-null-assertion
    const credentials = await provisionCredentials(token);
    expect(credentials).toEqual(
      expect.objectContaining({
        accessKeyId: expect.any(String),
        secretAccessKey: expect.any(String),
        sessionToken: expect.any(String),
        jwtToken: expect.any(String),
        sessionId: expect.any(String),
      }),
    );
  });
});

describe('aws4 request signing', () => {
  it('adds correct authentication to request', () => {
    const body = JSON.stringify({ query: '' });
    const credentials: GraphQLCredentials = {
      jwtToken:
        'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE1ODUyODEwNzYsImNiIjp7ImVudiI6InBpbmUiLCJ1biI6IkFORFJFV0xJMzU3IiwibnMiOiJzdCIsImx0dCI6IkNCTG9naW4iLCJlbSI6ImFuZHJld2xpMzU3QGdtYWlsLmNvbSIsInBpZCI6IjEwOTk2MDUzMCIsImFpZCI6IjYyMjIwMTY5IiwiZHAiOnsiZmlyc3ROYW1lIjoiQW5kcmV3IiwibWlkZGxlSW5pdGlhbCI6bnVsbCwiZ3JhZHVhdGlvbkRhdGUiOjE2MTk4NDE2MDAwMDAsImdlbmRlciI6Ik1BTEUiLCJhZGRyZXNzIjp7InN0cmVldDEiOiIxMDYyOCBDYXN0ZWxhciBTdCIsInN0cmVldDIiOm51bGwsInN0cmVldDMiOm51bGwsImNpdHkiOiJPbWFoYSIsInN0YXRlQ29kZSI6Ik5FIiwiemlwNCI6IjE4NDIiLCJ6aXA1IjoiNjgxMjQiLCJyZWdpb25Db2RlIjpudWxsLCJwcm92aW5jZSI6bnVsbCwiY291bnRyeUNvZGUiOiJVUyIsImludGVybmF0aW9uYWxQb3N0YWxDb2RlIjpudWxsLCJhZGRyZXNzVHlwZSI6IkRPTUVTVElDIn0sInN0dWRlbnRTZWFyY2hTZXJ2aWNlT3B0SW4iOiJOIiwic3R1ZGVudFNlYXJjaFNlcnZpY2VPcHREYXRlIjoxNTczMTgzNjEzMDAwfSwic2lsb0luZm8iOnsic2lsb0FwcElkIjozNjYsInNpbG9JZHMiOlt7InNpbG9JZCI6IjNaWDMxMDE5Iiwic2lsb0lkU3RhdHVzIjoiWSJ9XX19LCJpYXQiOjE1ODUyODAxNzYsImlzcyI6ImNhdGFwdWx0LmNvbGxlZ2Vib2FyZC5vcmciLCJzdWIiOiJ1cy1lYXN0LTE6MDIzYzNmZmItNGFhZi00YTgwLWFkYmYtYzhiOTQxYWIzYjg2In0.tZqqQfzdPRQvbVabiZHRXgi8AGLNAbDqWHiBKsAYQQTSN1bDYzk0q1LKAXV8tV5OiW5XOxOcffcoBBA4-jx4cBL45-cNfeYBUmIJLDOhHtsOiOAiqoROGHBYDOet7aWx8uimHj38ULfRAQfsyT0-2TDjjbijooTbsIKsIAd0LIuzPcRpdwkOrHVJ_sjn3fbOjSFYi9-tVO5c4hr3nXjYFN6h0gAeyfLzYO62vHd8fYsScMjBjyQrrq2N8ry8AOlbvYC8Fw7oFWHy05V_oY9ri1Jsxr2Lsl7QRAzvVDD9-W7NF90Gnr10aaYf3S50yu2SvFIzZ3MeEcqQEH0ziZgvRQ',
      sessionId: '0C06AF7C-CEB5-3652-7613-6FDC1904EF1C',
      accessKeyId: 'ASIAYEB3RCQDFHLAOAT7',
      secretAccessKey: 'sfQ2eRLhnE0pQtK0thvier6aWOfrhLlJXKqf5KRK',
      sessionToken:
        'FwoGZXIvYXdzELX//////////wEaDGB8TfQ7kN/vnoXFwyKFAzI7Wmi1gBChjFkkayjxhOxnaoY++XWKeCpy0y9SW7Cu12TYM5IniGNqOdApHP1ktOgvt/jeDJNIWLplgbO70U0xGl72u7+MqwFRtstvf+0xRhYx7QozS7P48V/b23+BWIINIs2qXUph6cc3TSU6z3XcIkfOUDneOHKKEhwU37ROsAC5r6BcARGlA6P2sauGBB0UhILCK2+/UYI/It01/9BWfCBA6lI+K0EYkFciEIbaaoBqXLrUUiiicwOWz6b7h/m/UpVij+4Bv1G9HAUuqYk9NgnGWPqzw801dFMZWnL7eL/GMM5czL/npl6OXyw2vvZXIDrQUmqp1iylkQNLaCBGNJ2GzzEFUUQrMgeAlMXe9PW5WFxW5oSSXMzsVUktnL8dZ7I8jQvZSbBb1Jc4dhRWJNBvY0homwN2BFgDBeptSttVK3kRMosD6B36rV8+mUwtw+l8gTc1o0xCA+uBmTGCi76sc1c5/SS8+ehcq9qKvKCUgM3+xw4vjWG7xbqSezGecPWUKLDp9fMFMpMBtd1DmbIyEBLsQO0dWhzx0gj4OiahbVU+MIXqbT53ZkL8RDCHcen+Kb8R3IjDqwc0JZSX2BMr7Y6ZeMecv+1R5vWNBNDDRdQkNN+tHhJU1h0HkCDhZYFAB1TgUUEP2g4W3Ugg802NUf8kzylgEx0YREZfGWRgNK3Kvwc0rYvpl6Q0lDF1SY7HI/hGtP8c6Bom/TGi',
    };
    const endpoint: AWSService = {
      url:
        'https://dgtkl2ep7natjmkbefhxflglie.appsync-api.us-east-1.amazonaws.com',
      region: 'us-east-1',
      service: 'appsync',
    };
    const mockDate = new Date('2020-03-26T06:19:54Z');
    const dateString = mockDate.toISOString().replace(/[:-]|\.\d{3}/g, '');
    const spy = (jest.spyOn(global, 'Date') as unknown) as jest.SpyInstance<
      Date,
      []
    >;
    spy.mockImplementation(() => mockDate);

    const { host } = url.parse(endpoint.url);
    const req = signRequest(body, endpoint, credentials);

    expect(req.headers).toEqual({
      host,
      accept: '*/*',
      'content-type': 'application/json; charset=UTF-8',
      Authorization:
        'AWS4-HMAC-SHA256 Credential=ASIAYEB3RCQDFHLAOAT7/20200326/us-east-1/appsync/aws4_request, SignedHeaders=accept;content-type;host;x-amz-date;x-amz-security-token, Signature=3d5220df3c541a9a25e834c8f060e41323065e021e5e189afb1f68e935cae41f',
      'x-amz-date': dateString,
      'X-Amz-Security-Token': credentials.sessionToken,
      'x-cb-catapult-authentication-token': credentials.sessionId,
      'x-cb-catapult-authorization-token': credentials.jwtToken,
    });

    spy.mockRestore();
  });
});
