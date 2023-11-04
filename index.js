const axios = require('axios').default;
const fs = require('fs');
const Nest = require('./nest.js')
const Logger = require('./logger.js');
const Aqara = require('./aqara.js');

async function doCheck(aqara, nest) {
  const res = await aqara.checkSensors();
  if (res.success) {
    if (res.devices.some(d => d.current < d.desired)) {
      console.log("Heating on");
      nest.setHeating(true);
    }
    else {
      console.log("Heating off");
      nest.setHeating(false);
    }
  }
}
async function main() {
  const creds = JSON.parse(fs.readFileSync('credentials.json'));
  const logger = new Logger(creds.discord);
  const nest = new Nest(creds.nest, logger);
  const aqara = new Aqara(creds.aqara, logger);

  console.log("Loaded");
  await doCheck(aqara, nest);
  setInterval(async function() { await doCheck(aqara, nest); }, 1000 * 60 * 5);
}

main();

// setHeating(creds, false).then((r) => r ? console.log("Success!") : console.log("Fail."));

// checkAccessToken(creds.accessToken).then((r) => r ? console.log("Valid") : console.log("Invalid"));
// getNewAccessToken(creds.clientId, creds.clientSecret, creds.refreshToken).then((t) => {
//   console.log(t)
// });


/*
https://smartdevicemanagement.googleapis.com/v1/enterprises/79dbd138-d5ae-4e1e-bb64-195662ca3867/devices/AVPHwEvHX6Hxd3zh_4y6d-EWR1c1Xta4lH9Zo8umD2xPnA2AJB_ffTpD5XGQbGNImLBrc4C3YbjkXO4eNjIjtuAH-PAvit0:executeCommand
*/