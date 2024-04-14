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
#### Note: Don't run the test while server is still active because the port 8080 will be occupied.

## Endpoints
1. POST /auth
- Description: Authenticates a user and generates an authentication token.
- Request Body:
username: The username of the user to authenticate.
- Response:
  
      200 OK: If authentication is successful.
      Body: JSON object containing the authentication token.


      404 Not Found: If the user does not exist.
      Body: JSON object with an error message.


      500 Internal Server Error: If an unexpected error occurs during authentication.
      Body: JSON object with an error message.

2. POST /register
- Description: Registers a new user.
- Request Body:

      username: The username of the new user.
      email: The email address of the new user.
- Response:
  
      201 Created: If registration is successful.
      Body: JSON object containing the generated password for the user.
      500 Internal Server Error: If registration fails.
      Body: JSON object with an error message.

Dependencies
Express.js: Web framework for Node.js
jsonwebtoken: Library for generating and verifying JWT tokens
node-jose: Library for JSON Object Signing and Encryption (JOSE) operations
sqlite3: SQLite database driver

## Result for test client (https://github.com/jh125486/CSCE3550/releases)

![Screenshot 2024-04-13 at 9 56 08 PM](https://github.com/qgiang124/jwks-continued/assets/99046066/7eda28f6-44fb-41f1-a204-7d6744ef07cc)


## Test suit result
![Screenshot 2024-04-13 at 9 55 34 PM](https://github.com/qgiang124/jwks-continued/assets/99046066/03e4107a-aa54-4e95-8488-24bcc7b93b8b)
