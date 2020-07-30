module.exports = function() {
  if (!DEV_MODE) require('dotenv').config();

  // Loading Google Sheets API. =================================================
  const fs = require('fs');
  const readline = require('readline');
  const {google} = require('googleapis');

  // If modifying these scopes, delete token.json.
  const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];
  // const TOKEN_PATH = 'token.json';
  const TOKEN_PATH = './token.json';

  /**
  * Create an OAuth2 client with the given credentials, and then execute the
  * given callback function.
  * @param {Object} credentials The authorization client credentials.
  * @param {function} callback The callback to call with the authorized client.
  */
  function authorize(credentials) {
    return new Promise((resolve, reject) => {
      const {client_secret, client_id, redirect_uris} = credentials.installed;
      const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);

      // Check if we have previously stored a token.
      fs.readFile(TOKEN_PATH, (err, token) => {
        if (err) getNewToken(oAuth2Client)
            .then((auth) => resolve(auth))
            .catch((err) => {});
        var tokenObj = JSON.parse(token);
        if (!DEV_MODE) {
          tokenObj.access_token = process.env.ACCESS_TOKEN;
          tokenObj.refresh_token = process.env.REFRESH_TOKEN;
        }
        oAuth2Client.setCredentials(tokenObj);
        resolve(oAuth2Client);
      });
    });
  }

  /**
  * Get and store new token after prompting for user authorization, and then
  * execute the given callback with the authorized OAuth2 client.
  * @param {google.auth.OAuth2} oAuth2Client The OAuth2 client to get token for.
  * @param {getEventsCallback} callback The callback for the authorized client.
  */
  function getNewToken(oAuth2Client, callback, param1) {
    return new Promise((resolve, reject) => {
      const authUrl = oAuth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: SCOPES,
      });
      console.log('Authorize this app by visiting this url:', authUrl);
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
      });
      rl.question('Enter the code from that page here: ', (code) => {
        rl.close();
        oAuth2Client.getToken(code, (err, token) => {
          if (err) reject(console.error('Error while trying to retrieve access token', err));
          oAuth2Client.setCredentials(token);
          // Store relevant token info to env for later function executions
          if (!DEV_MODE) {
            process.env.ACCESS_TOKEN = token.access_token;
            token.access_token = "";
            token.refresh_token = "";
          }
          fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
            if (err) reject(console.error(err));
            console.log('Token stored to', TOKEN_PATH);
          });
          resolve(oAuth2Client);
        });
      });
    });
  }

  return new Promise((resolve, reject) => {
    fs.readFile('credentials.json', (err, content) => {
      if (err) reject(console.log('Error loading client secret file:', err));
      // Authorize a client with credentials, then call the Google Sheets API.
      var contentObj = JSON.parse(content);
      if (!DEV_MODE) contentObj.installed.client_secret = process.env.CLIENT_SECRET;
      authorize(contentObj)
        .then((oAuth2Client) => {
          resolve({google: google, auth: oAuth2Client});
        })
        .catch((err) => {});
    });
  });
}
