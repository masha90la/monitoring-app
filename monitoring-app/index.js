const express = require('express');
const app = express();
const http = require('http');
const server = http.Server(app);
const fs = require('fs');

const port = 8000; // sets the port which the service will run on
const urlToMonitor = 'http://localhost:12345'; // website to monitor
const serviceTitle = 'Magnificent Status Monitoring'; // default title for the monitoring service
const updateFileFrequency = 5000;
/* 	file path to JSON file that stores data with status codes and timestamps 
		that were received since monitoring service has been running */
const jsonFilePath = 'public/response-data.json'; 


// Object to store status codes count for each status code
let statusCodesData = {
	'200': 0,
	'500': 0,
	'noResponse': 0,
};

// set the view engine to ejs
app.set('view engine', 'ejs');
app.use(express.static('public')); // allow access static files in 'public folder' (CSS, Javascript, etc.)

// Render index page (contains monitoring service html)
app.get('/', function(req, res) {
	  try {
	  	// index page template
	    res.render('index', {
	    	title: serviceTitle
	    });
    } catch (err) {
    	// error template
      res.render('error', {
	    	message: err
	    });
    }

});

// API endpoint to return overall status codes returned when accessing Magnificent
app.get('/api/updateStatusData', (req, res) => {
	// save calculations for each status code in object
	let statsData = statusCodesData;

	// api call returns the object
  if (statsData) {
    res.status(200).send(statsData);
  } else {
    res.status(400).send(null);
  }
});

// API endpoint to build JSON data displaying status codes requests in the last 5 minutes
app.get('/api/getRecentStatusData', (req, res) => {
	// read through json file that contains overall status codes results
	let siteResponseDataAll = fs.readFileSync(jsonFilePath);
  siteResponseDataAll = JSON.parse(siteResponseDataAll);

  // build a new object to store results in the last 5 minutes
 	let recentDataObject = {
		response: []
	};

	// get timestamp for time 5 minutes ago
	let timestampFiveMinutesAgo = Number(new Date(Date.now() - (5 * 60 * 1000)));

	// loop through overall results and save values that were stored in the last 5 minutes to the new object
	for (let [key, value] of Object.entries(siteResponseDataAll.response)) {
		if (value.timestamp > timestampFiveMinutesAgo) {
		  recentDataObject.response.push(value);
		}
	}
	// once the new object is built, convert it to JSON object
	let jsonDataRecent = JSON.stringify(recentDataObject);

  res.status(200).send(jsonDataRecent);
});


// Save captured data to an existing JSON file that stores information with all requests
// Information captured in the file: status code and timestamp
function saveStatusDataToFile() {
  try {
  	// get the existing data containing requests results
    let siteResponseData = fs.readFileSync(jsonFilePath);
    siteResponseData = JSON.parse(siteResponseData);
		returnSiteStatusData(
			function(statusData) {
				// get the new received data and add it to the file
				sortStatusCodes(statusData.statusCode);
				siteResponseData.response.push(statusData);
				fs.writeFileSync(jsonFilePath, JSON.stringify(siteResponseData));
			}
		);  
  } catch (error) {
  		saveJSONFile(); // if there is an error because the file doesn't exist, try creating a new one
      console.log(`Saving status data to file error: ${error}`);
  }
}

// The function runs on service start
function saveJSONFile() {
	// if json file with response data doesn't exist, create a new file
	if (!fs.existsSync(jsonFilePath)) {
		var dataObject = {
		   response: []
		};

		returnSiteStatusData(
			function(statusData) {
		    dataObject.response.push(statusData);
		    var json = JSON.stringify(dataObject);
		    fs.writeFile(jsonFilePath, json, 'utf8', function (err) {
			    if (err) {
			      console.log(`Error returning saved request data ${err}`);
			    }
				}
			); 
	  }); 
	} else {
		// if the file already exists, capture the request data received on the service start
		let savedResponseCodes = fs.readFileSync(jsonFilePath);
		savedResponseCodes = JSON.parse(savedResponseCodes);
		for (let [key, value] of Object.entries(savedResponseCodes.response)) {
			// make sure data is calculated to update the status code count in 'statusCodesData' object
		  sortStatusCodes(value.statusCode);
		}
	}
}


function sortStatusCodes(statusCodeResponse) {
	// make sure that statusCodeResponse is a string
	var statusCodeResponse = String(statusCodeResponse);
	// statusCodeResponse should be equal to one of the keys in 'statusCodesData' object
	// if it is, increase the count for the status code (equal to statusCodeResponse) by 1
	if (!isNaN(statusCodesData[statusCodeResponse])) {
		statusCodesData[statusCodeResponse]++;
	} 
}

// Return status code and timestamp when Magnificent is called
function returnSiteStatusData(callback) {
	http.get(urlToMonitor, function (response) {
		var statusDataObj = {
			timestamp: Number(new Date()),
		  statusCode: response.statusCode,
		}
		callback(statusDataObj);	
	}).on('error', function(err) {
		// if the call returns error, save status code as 'noResponse'
		var statusDataObj = {
			timestamp: Number(new Date()),
		  statusCode: 'noResponse',
		}
		callback(statusDataObj);	
	  console.log(`Returning current request data to magnificent ${err}`);
	});
}

function init() {
	saveJSONFile(); 
	// save new status codes data to json file every 5 seconds   
	setInterval(function() {
	  saveStatusDataToFile();  
	}, updateFileFrequency);  
}

init();

app.listen(port, function () {
  console.log(`Magnificent Monitoring app listening on port ${port}!`)
})
