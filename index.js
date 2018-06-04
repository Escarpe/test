var express = require('express');
var fs = require('fs');
var app = express();
var bodyParser = require('body-parser');
var ejs = require('ejs');
var readline = require('readline');
var google = require('googleapis');
var googleAuth = require('google-auth-library');
var sheets = google.sheets('v4');
var json = require('express-json');

var data = fs.readFileSync('./credentials.json');

var SCOPES = ['https://www.googleapis.com/auth/spreadsheets']; 
var TOKEN_DIR = (process.env.HOME || process.env.HOMEPATH ||
    process.env.USERPROFILE) + '/.credentials/';
var TOKEN_PATH = TOKEN_DIR + 'appsactivity-nodejs-quickstart.json';


app.use(bodyParser.urlencoded({ extended: true }));

app.use(express.static(__dirname + '/views'));
app.set("view engine", "ejs");


app.get("/", function(request, response){
     fs.readFile(TOKEN_PATH, function(err) {
    
    if (err) {
      console.log("YEEEEEEEEEEEEEEES");
      getNewToken(data);
      
    } 
  });
    response.render("index");
});

app.post('/result', function(req, res) {
    

 	 response = {
            first_name : req.body.first_name,
            last_name : req.body.last_name,
            telephone : req.body.telephoneNumber,
            email : req.body.email,
            };
        
    
    
    var values = [[response.first_name, response.last_name, response.telephone, response.email]];

	appendValues(data,values);


    res.redirect('/');
});




app.listen(3000, function () {
  console.log('Застосунок прослуховує 3000-ий порт!');
});


app.get('/view', function(req, res) {
    

	getValues(data,res);
	



});



function appendValues(data,values) {
 
    var auth = authorize(data);

    var body = {
      values: values
    };
    sheets.spreadsheets.values.append({
      auth: auth,
       spreadsheetId: '1O-BEh28VkNgoWhpjQls2clC8lmpP1yTBpcO68A0VGmY',
       range: 'A2:D1000',
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
function getValues(data,res) {

	var auth = authorize(data);
  var request = {
    auth: auth,
    spreadsheetId: '1O-BEh28VkNgoWhpjQls2clC8lmpP1yTBpcO68A0VGmY',
    range: 'A2:D1000',
  };
	sheets.spreadsheets.values.get(request, function(err, response) {
    if (err) {
      console.error(err);
      return;
    }
   	res.render("view",{
    values : response.values,
    n : 0,
    i : 1
  });
 	
  });
;}
	
 
  


function authorize(credentials) {
	credentials = JSON.parse(data);

  const {client_secret, client_id, redirect_uris} = credentials.installed;
    const oauth2Client = new google.auth.OAuth2(
        client_id, client_secret, redirect_uris[0]);


    var token = fs.readFileSync(TOKEN_PATH);
    oauth2Client.credentials = JSON.parse(token);
    var authClient = oauth2Client;

    return authClient;
}

function getNewToken(credentials) {
  credentials = JSON.parse(data);
  const {client_secret, client_id, redirect_uris} = credentials.installed;
    const oauth2Client = new google.auth.OAuth2(
        client_id, client_secret, redirect_uris[0]);

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


