var fs = require('fs');
var readline = require('readline');
var google = require('googleapis');
var googleAuth = require('google-auth-library');
var sheets = google.sheets('v4');

var SCOPES = ['https://www.googleapis.com/auth/spreadsheets']; 
var TOKEN_DIR = (process.env.HOME || process.env.HOMEPATH ||
    process.env.USERPROFILE) + '/.credentials/';
var TOKEN_PATH = TOKEN_DIR + 'appsactivity-nodejs-quickstart.json';


fs.readFile('./credentials.json', function processClientSecrets(err, content) {
  if (err) {
    console.log('Error loading client secret file: ' + err);
    return;
  }


  authorize(JSON.parse(content), listActivity);
});



function authorize(credentials, callback) {
  const {client_secret, client_id, redirect_uris} = credentials.installed;
  const oauth2Client = new google.auth.OAuth2(
      client_id, client_secret, redirect_uris[0]);

  // Check if we have previously stored a token.
  fs.readFile(TOKEN_PATH, function(err, token) {
    
    if (err) {
      getNewToken(oauth2Client, callback);
    } else {
      oauth2Client.credentials = JSON.parse(token);
      callback(oauth2Client);
      updateValue(oauth2Client);
    }
  });
}

function getNewToken(oauth2Client, callback) {
  var authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES
  });
  console.log('Authorize this app by visiting this url: ', authUrl);
  var rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  rl.question('Enter the code from that page here: ', function(code) {
    rl.close();
    oauth2Client.getToken(code, function(err, token) {
      if (err) {
        console.log('Error while trying to retrieve access token', err);
        return;
      }
      oauth2Client.credentials = token;
      storeToken(token);
      callback(oauth2Client);
    });
  });
}

function storeToken(token) {
  try {
    fs.mkdirSync(TOKEN_DIR);
  } catch (err) {
    if (err.code != 'EEXIST') {
      throw err;
    }
  }
  fs.writeFile(TOKEN_PATH, JSON.stringify(token), () => {console.log("callback success")});
  console.log('Token stored to ' + TOKEN_PATH);
}

function listActivity(auth) {
  var service = google.appsactivity('v1');
  service.activities.list({
    auth: auth,
    source: 'drive.google.com',
    'drive.ancestorId': 'root',
    pageSize: 10
  }, function(err, response) {
    if (err) {
      console.log('The API returned an error: ' + err);
      return;
    }
    var activities = response.activities;
    if (activities.length == 0) {
      console.log('No activity.');
    } else {
      console.log('Recent activity:');
      for (var i = 0; i < activities.length; i++) {
        var activity = activities[i];
        var event = activity.combinedEvent;
        var user = event.user;
        var target = event.target;
        if (user == null || target == null) {
          continue;
        } else {
          var time = new Date(Number(event.eventTimeMillis));
          console.log('%s: %s, %s, %s (%s)', time, user.name,
                event.primaryEventType, target.name, target.mimeType);
        }
      }
    }
  });
}

function updateValue(auth) {
  var values= [ ["Void", "Canvas", "Website"], ["Paul", "Shan", "Human"] ];
  var body = {
    values: values
  };
  sheets.spreadsheets.values.update({
    auth: auth,
     spreadsheetId: '1O-BEh28VkNgoWhpjQls2clC8lmpP1yTBpcO68A0VGmY',
     range: 'C4:E10',
     valueInputOption: 'USER_ENTERED',
     resource: body
  }, function(err, result) {
    if(err) {
      // Handle error
      console.log(err);
    } else {
      console.log('%d cells updated.', result.updatedCells);
    }
  });
}


