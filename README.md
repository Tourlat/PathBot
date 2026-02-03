# PathBot

A discord bot design to register and manage time paths for users using Google Maps API and Discord.js.

----
## Installation

1. Clone the repository:
   ```bash
   git clone
    ```
2. Navigate to the project directory:
    ```bash

    cd pathBot
    ```
3. Install the dependencies:
    ```bash
    npm install
    ```
4. Create a config.json file in the root directory with the following structure:
    ```json
    {
        "token": "YOUR_BOT_TOKEN",
        "clientId": "YOUR_CLIENT_ID",
        "guildId": "YOUR_GUILD_ID",
        "mapsApiKey": "YOUR_MAPS_API_KEY"   
    }
    ```
5. Start the bot:
    ```bash
    docker compose up -d --build
    ```

    This will launch a mongoDB instance along with the bot and run the deployment script to register the commands.

6. Run locally without docker:
    ```bash
    npm start
    ```
    Make sure to deploy the commands first by running:
    ```bash
    node src/deploy-commands.js
    ```
    And you will need to run a mongoDB instance either locally or using a cloud service like MongoDB Atlas.
---

## Configuration

Follow the Discord developer documentation for more details on creating and managing bots and to see how to invite the bot to your server: [documentation](https://discord.com/developers/docs/intro).

Follow the Google Maps API documentation for more details on obtaining and using the Maps API key: [documentation](https://developers.google.com/maps/documentation).

Follow the Node.js  client for google maps services documentation for more details: [github](https://github.com/googlemaps/google-maps-services-js) .

---

## Usage

Once the bot is running, you can interact with it on your Discord server using the commands defined in the bot's code.

## Commands

- `/saveroute` - Save a new route with an alias, origin, and destination.
- `/deleteroute` - Delete a saved route by its alias.
- `/showroutes` - Display all saved routes for the user.
- `/times` - Get estimated travel times for all saved routes. Or for a specific route if an alias is provided.
- `/route` - Get route information between two locations

---
