# AP Classroom API

Unofficial wrapper for AP Classroom's GraphQL API at https://dgtkl2ep7natjmkbefhxflglie.appsync-api.us-east-1.amazonaws.com/graphql

Internal flow:
- `POST https://account.collegeboard.org/login/authenticateUser`
  - Sets `cb_login` cookie with a session ID
- `GET https://sucred.catapult-prod.collegeboard.org/rel/temp-user-aws-creds?cbEnv=pine&appId=366&cbAWSDomains=apfym,catapult`
  - `cacheNonce` query parameter should be set to `Date.now()` to force refresh of credentials
  - `Authorization` header set to `CBLogin <cb_login>`
  - The response JSON includes:
    - AWS Credentials for IAM auth (`AccessKeyId`, `SecretAccessKey`, `SessionToken`)
    - `cbJwtToken`

Now AWSAppSyncClient can be used to execute queries with all these credentials:

```js
const config = {
  url: 'https://dgtkl2ep7natjmkbefhxflglie.appsync-api.us-east-1.amazonaws.com/graphql',
  region: 'us-east-1',
  auth: {
    type: 'AWS_IAM',
    credentials: new AWS.Credentials({
      accessKeyId: '<AccessKeyId>',
      secretAccessKey: '<SecretAccessKey>',
      sessionToken: '<SessionToken>',
    }),
  },
};

const client = new AWSAppSyncClient(config, {
  link: createAppSyncLink({
    ...config,
    resultsFetcherLink: ApolloLink.from([
      setContext((request, prev) => ({
        headers: {
          ...prev.headers,
          // These two headers are necessary to access personal data from GraphQL
          'x-cb-catapult-authorization-token': '<cbJwtToken>',
          'x-cb-catapult-authentication-token': '<cb_login>',
        },
      })),
      createHttpLink({ uri: config.url }),
    ]),
  }),
});
```
