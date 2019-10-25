const protocol = window.location;
const statusCodesDataDiv = document.querySelector('.status-codes-table-wrapper');
const statusPercentagePlaceholder = document.querySelector('#status-percentage-summary');
const ctx = document.getElementById('status-code-chart').getContext('2d'); // chart placeholder
const pageUpdateFrequency = 15000;

// The call returns an object containing count for each status code
function requestStatusDataAll(callback) {
  const urlAllData = `${protocol}api/updateStatusData`;
  // return data from server
  const xhttp = new XMLHttpRequest();
  xhttp.open("GET", urlAllData, true);
  xhttp.onreadystatechange = function () {
	  if (xhttp.readyState == 4 && xhttp.status == '200') {
      callback(xhttp.responseText);
    } else {
      callback('error');
    }
	};
  xhttp.send();
}

// Return status codes object and print values to the table
function updateStatusData() {
  requestStatusDataAll(function(response) {
    if (response == 'error') {
      statusCodesDataDiv.innerHTML = '<p class="error-message">Status Codes Unavailable. Try refreshing the page.</p>';
    } else {
      let data = JSON.parse(response);
      statusCodesDataDiv.innerHTML = buildStatusDataTable(data);
    }
  });
}


// Build table with status codes
function buildStatusDataTable(responseData) {
  // create an array of object keys and use the length of the array to determine number of columns in the table
  let totalNumberOfRecords = Object.keys(responseData);
  let statsTableHTML = `<table><tr>`;
  for (let i = 0; i < totalNumberOfRecords.length; i++) {
    // build table header for each status code
    statsTableHTML += `<th>`;
    if (totalNumberOfRecords[i].indexOf('noResponse') != -1) {
      statsTableHTML += `No Response`;
    } else {
      statsTableHTML += `Status Code: ${totalNumberOfRecords[i]}`;
    }
    statsTableHTML += `</th>`;
  }
  statsTableHTML += `</tr><tr>`;

  for (let i = 0; i < totalNumberOfRecords.length; i++) {
    // loop through array of object keys again and use the key value in the array to access the key value in the object
    statsTableHTML += `<td>${responseData[totalNumberOfRecords[i]]}</td>`;
  }
  statsTableHTML += `</tr></table>`;
  return statsTableHTML;
}


// The call returns requests results in the last 5 minutes
function requestStatusDataRecent(callback) {
  const urlRecentData = `${protocol}api/getRecentStatusData`;
  // return data from server
  const xhr = new XMLHttpRequest();
  xhr.open("GET", urlRecentData, true);
  xhr.onreadystatechange = function () {
    if (xhr.readyState == 4 && xhr.status == "200") {
      callback(xhr.responseText);
    } else {
      callback('error');
    }
  };
  xhr.send();
}

// build chart from data
function buildStatusChart() {
  requestStatusDataRecent(function(res) {
    if (res == 'error') {
      statusPercentagePlaceholder.innerHTML = '<p class="error-message">Status Codes Data Unavailable. Status codes chart cannot be built or updated. Try refreshing the page.</p>';
    } else {
      let statusData = {
        '200': 0,
        '500': 0,
        'noResponse': 0,
      };

      // Get object keys to create an array of status codes
      let statusCodes = Object.keys(statusData);
      // Build labels for chart
      let chartLabels = returnChartLabels(statusCodes);
      
      // get request data for the last 5 minutes, loop through the object and count the number of each status code
      let statsData = JSON.parse(res);
      statsData.response.forEach((element, index, array) => {
        statusData[element.statusCode]++;
      });

      // Return an array containing values of statusData object 
      // Values will be used to pring the array
      let chartData = Object.values(statusData);
      // Get sum of all requests to Maginificent in the last 5 minutes
      let totalNumberRequests = returnSumOfArray(chartData);

      // get the percentage value for each status code based on total number of requests
      returnPercentageDataRecent(statusData, totalNumberRequests);
      displayChartCanvas(chartLabels, chartData);
    }
  });
}

// Set the parameters for the chart
function displayChartCanvas(labels, data) {
  // chart parameters (Charts.JS)
  let statsChart = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: labels,
      datasets: [
        {
          label: 'Status Codes Total',
          backgroundColor: ['#3e95cd', '#3cba9f', '#8e5ea2',],
          data: data,
        }
      ]
    },
    options: {
      legend: { display: true },
      title: {
        display: true,
        text: 'Status Codes Responses Within The Last 5 Minutes'
      },
    }
  });
}

// Print HTML containing the percentage value of each status code
function returnPercentageDataRecent(statsCountObject, totalRequestsCount) {
  let statusHTML = `<ul>`;
  for (let [key, value] of Object.entries(statsCountObject)) {
    statusHTML += `<li>`;
    if (key.indexOf('noResponse') != -1) {
      statusHTML += `No Reponse`;
    } else {
      statusHTML += `Status Code ${key}`;
    }
    statusHTML += `: ${getNumberPercentage(totalRequestsCount, parseInt(value))}%</li>`;
  }
  statusHTML += `</ul>`;
  statusPercentagePlaceholder.innerHTML = statusHTML;
}

// Build an array of labels for status chart
function returnChartLabels(arrayValues) {
  let labelsArray = [];
  let arrayValue;
  for (let i = 0; i < arrayValues.length; i++) {
    if (arrayValues[i].indexOf('noResponse') != -1) {
      arrayValue = 'No Response';
    } else {
      arrayValue = 'Status Code ' + arrayValues[i];
    }
    labelsArray.push(arrayValue);
  }
  return labelsArray;
}


// Get the sum of values in array
function returnSumOfArray(arrayNumbers) {
  let arraySum = 0;
  for (let i = 0; i < arrayNumbers.length; i++) {
    arraySum += parseInt(arrayNumbers[i]);
  }
  return arraySum;
}

// Calculate the percentage of the total amount
function getNumberPercentage(total, num) {
  return parseInt(((num*100)/total));
}

// call data from the server every 15 seconds
setInterval(function() {
  buildStatusChart();
  updateStatusData();               
}, pageUpdateFrequency);   

updateStatusData();
buildStatusChart();