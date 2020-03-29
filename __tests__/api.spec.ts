import request from 'supertest';

const API_URL = 'http://localhost:5000';

describe('POST /login', () => {
  it('returns 400 when credentials are missing', async () => {
    const noBody = await request(API_URL).post('/login');
    expect(noBody.status).toBe(400);
    expect(noBody.body.message).toMatch(/missing/);

    const noUsername = await request(API_URL)
      .post('/login')
      .send({ password: '12345' });
    expect(noUsername.status).toBe(400);
    expect(noUsername.body.message).toMatch(/missing/);

    const noPassword = await request(API_URL)
      .post('/login')
      .send({ username: 'John' });
    expect(noPassword.status).toBe(400);
    expect(noPassword.body.message).toMatch(/missing/);
  });

  it('returns 401 when credentials are invalid', async () => {
    const invalid = await request(API_URL)
      .post('/login')
      .send({ username: 'John', password: '12345' });
    expect(invalid.status).toBe(401);
  });

  it('returns 200 when credentials are valid', async () => {
    const { TEST_USERNAME, TEST_PASSWORD } = process.env;
    expect(TEST_USERNAME).toBeTruthy();
    expect(TEST_PASSWORD).toBeTruthy();

    const valid = await request(API_URL)
      .post('/login')
      .send({ username: TEST_USERNAME, password: TEST_PASSWORD });
    expect(valid.status).toBe(200);
    expect(valid.body.message).toMatch(/Found/);
    expect(valid.body.token).toHaveLength(36);
  });
});

describe('POST /graphql', () => {
  it('returns 400 when authorization or bearer token missing', async () => {
    const noAuth = await request(API_URL).post('/graphql');
    expect(noAuth.status).toBe(400);
    expect(noAuth.body.message).toMatch(/missing/);

    const noToken = await request(API_URL)
      .post('/graphql')
      .set('Authorization', 'Bearer');
    expect(noToken.status).toBe(400);
    expect(noToken.body.message).toMatch(/missing/);
  });

  it('returns 401 when token is invalid', async () => {
    const badToken = await request(API_URL)
      .post('/graphql')
      .set('Authorization', 'Bearer Test');
    expect(badToken.status).toBe(401);
  });

  it('returns 200 when token is valid', async () => {
    const { TEST_USERNAME, TEST_PASSWORD } = process.env;
    const auth = await request(API_URL)
      .post('/login')
      .send({ username: TEST_USERNAME, password: TEST_PASSWORD });
    const { token } = auth.body;

    const goodToken = await request(API_URL)
      .post('/graphql')
      .set('Authorization', `Bearer ${token}`)
      .send({ query: '{}' });
    expect(goodToken.status).toBe(200);
  });
});

describe('not found', () => {
  it('returns 404 for unknown routes and methods', async () => {
    const unsupportedMethod = await request(API_URL).get('/login');
    expect(unsupportedMethod.status).toBe(404);

    const unsupportedRoute = await request(API_URL).get('/test');
    expect(unsupportedRoute.status).toBe(404);
  });
});
