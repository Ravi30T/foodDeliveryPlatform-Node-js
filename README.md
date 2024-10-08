
# Food Delivery Platform (Backend Application)

## Description: 

The Online Food Order application is a backend service that allows users to register, login, manage their profiles, and place orders from various restaurants.
It provides an API for restaurant admins to manage their details, menus, and orders.

## Prequisites:

1. Create an account on [MongoDB](https://www.mongodb.com/).
2. Install MongoDB on your system.
3. Create a new cluster and set your username and password.

### Setup Instructions
1. Click on **Connect** in your MongoDB dashboard.
2. Click on **Shell** and copy the command specified.
3. Open your Visual Studio Code terminal.
4. Paste the copied command in the terminal and hit **Enter**.
5. Enter your password and hit **Enter**.
6. Create a new database named `onlineFoodOrder`:
   ```bash
   use onlineFoodOrder


### Create collections (tables) in the onlineFoodOrder database:  

```bash

    db.createCollection('users')
    db.createCollection('restaurants')
    db.createCollection('orders')
```

## Testing the APIs
To test all the HTTP request methods (GET, POST, PUT, DELETE), you can use the Postman extension in VS Code.

### Steps to Test APIs:

#### 1. Install the Postman extension and log in.
#### 2. Click on New Request.
#### 3. Select the type of request you need (GET, POST, etc.).
#### 4. Provide the necessary details, including:
    Bearer Token
    Headers
    Body
    URL
#### 5. Click on Send to call the API and receive a response.


## API Reference:

Follow all the APIs, including details like Bearer Token, Headers, Body, and URL, as provided in the
app.http file.
