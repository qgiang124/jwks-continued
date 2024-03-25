This is a simple Express application that provides JWT authentication. It generates JWT tokens and serves JWKS (JSON Web Key Set) for token verification.

Install dependencies:
`npm install`

To run the application, execute the following command:
`npm start`
The server will start listening on port 8080 by default. You can access the endpoints at http://localhost:8080.


Testing the App
To run the tests, execute the following command:
`npm test`
This command will run the test suite using Jest. The tests ensure that endpoints return the expected responses and that the application functions correctly. 
#### Note: Don't run the test while server is still because the port 8080 will be occupied.

Endpoints
POST /auth: This endpoint generates a JWT token. You can test it using tools like cURL or Postman. Example:

`curl -X POST http://localhost:8080/auth`

GET /.well-known/jwks.json: This endpoint serves the JWKS JSON for token verification. Example:`
curl http://localhost:8080/.well-known/jwks.json`

Dependencies
Express.js: Web framework for Node.js
jsonwebtoken: Library for generating and verifying JWT tokens
node-jose: Library for JSON Object Signing and Encryption (JOSE) operations
sqlite3: SQLite database driver

## Result for test client (https://github.com/jh125486/CSCE3550/releases)

![Screenshot 2024-03-24 at 11 34 30 PM](https://github.com/qgiang124/jwks-continued/assets/99046066/e1cd92fe-c6c9-4766-bc2d-4d37ac099819)

## Test suit result
The 3 test cases ensure that the endpoints in the Express application behave as expected under different scenarios, including generating valid and expired JWT tokens, 
and serving JWKS JSON for token verification. 
![Screenshot 2024-03-24 at 11 33 32 PM](https://github.com/qgiang124/jwks-continued/assets/99046066/d2c48297-1df3-4f0d-b6a2-26203ecb25da)

