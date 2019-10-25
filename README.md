# Setting up the page to monitor
 1. Set up a python2 or python3 environment
 2. pip install twisted
 3. python server.py
 4. Now you're running magnificent!
 5. Visit http://localhost:12345 in a web browser or a CLI utility like curl
 6. It should throw a verbose error or return "Magnificent!".
 
# Setting up monitoring service
1. Download 'monitoring-app' folder
2. Open up console and navigate to 'monitoring-app' directory:

    $ cd [PATH_TO_DIRECTORY_ON_YOUR_MACHINE]/monitoring-app

3. Make sure you have Node.js installed. In order to check if you have Node.JS installed on your machine, run this command in the console:

    $ node -v

 If Node.js is installed on your machine, it will show you the Node version. If version of Node.JS on your machine is below 10 or If you do not have Node.js installed, download the install file from https://nodejs.org/en/ and install it on your machine.
4. Once you have Node.js (at least version 10) installed, run these commands in your console to start the monitoring service running:
   $ npm install
   $ node index.js
5. If there are any errors in the app, they will printed in the console. Once you see 'Magnificent Monitoring app listening on port 8000!' message is in the console, monitoring service app is running. 
6. Go to http://localhost:8000 to view the monitoring service page.
