# AP Classroom API

Unofficial wrapper for AP Classroom's GraphQL API at https://dgtkl2ep7natjmkbefhxflglie.appsync-api.us-east-1.amazonaws.com/graphql. Provisions temporary credentials then performs AWSv4 signing using IAM-based auth.

### Usage

First, send a POST request to the `/login` endpoint with a `username` and `password` as JSON body:

```js
fetch('…/login', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    username: '<AP Username>',
    password: '<AP Password>',
  }),
})
  .then((res) => res.json())
  .then(({ token }) => {
    console.log(token); // your CollegeBoard token
  });
```

You'll get a token in response if your credentials are valid. This token can be used as Bearer authentication to make a request to the GraphQL API:

```js
fetch('…/graphql', {
  method: 'POST',
  headers: {
    Authorization: 'Bearer <Token>',
  },
  body: JSON.stringify({
    query: `{
      getUserDetails {
        userDetails {
          personId
        }
      }
    }`
  }),
})
  .then((res) => res.json())
  .then((json) => {
    console.log(json);
  });
```
