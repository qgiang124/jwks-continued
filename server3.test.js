const request = require('supertest');
const express = require('express');
const app = express();
jest.mock('./server.js', () => jest.fn());
const getUserByUsername = require('./server.js');

describe('POST /auth', () => {
  test('should return 200 and a token if user exists', async () => {
    getUserByUsername.mockResolvedValue({ id: 1, username: 'testUser' });

    const response = await request(app)
      .post('/auth')
      .send({ username: 'testUser' });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('token');
  });

  test('should return 404 if user does not exist', async () => {
    getUserByUsername.mockResolvedValue(null);

    const response = await request(app)
      .post('/auth')
      .send({ username: 'nonExistingUser' });

    expect(response.status).toBe(404);
    expect(response.body).toEqual({ error: 'User not found' });
  });

});
describe('POST /register', () => {
    test('should return 201 and a password if user registration is successful', async () => {
      const response = await request(app)
        .post('/register')
        .send({ username: 'abc', email: 'abc@gmail.com' });
  
      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('password');
    });
  
    test('should return 500 if user registration fails', async () => {
      const response = await request(app)
        .post('/register')
        .send({ username: 'abczyz', email: 'abczyz@yahoo.com' });
  
      expect(response.status).toBe(500);
    });
  });
  