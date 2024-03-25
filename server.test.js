const request = require('supertest');
const app = require('./server.js'); 
describe('App', () => {
  let server;

  beforeAll(async () => {
    await new Promise(resolve => {
      server = app.listen(8080, () => {
        resolve();
      });
    });
  });

  afterAll(async () => {
    await new Promise(resolve => {
      server.close(() => {
        resolve();
      });
    });
  });

  describe('POST /auth', () => {
    it('responds with JWT token', async () => {
      const response = await request(app).post('/auth');
      expect(response.status).toBe(200);
      expect(response.body).toBeDefined();
    });

    it('responds with an expired JWT token when expired query parameter is true', async () => {
      const response = await request(app).post('/auth?expired=true');
      expect(response.status).toBe(200);
      expect(response.body).toBeDefined();
    });
  });

  describe('GET /.well-known/jwks.json', () => {
    it('responds with JWKS JSON', async () => {
      const response = await request(app).get('/.well-known/jwks.json');
      console.log(response.body);

      expect(response.status).toBe(200);
       expect(response.body).toHaveProperty('keys');
    });
  });
});
