const axios = require('axios').default;
const FileHandler = require('./fileHandler.js');
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
  const fileHandler = new FileHandler();
  const creds = fileHandler.credentials;
  const logger = new Logger(creds.discord);
  const nest = new Nest(creds.nest, logger, fileHandler);
  const aqara = new Aqara(creds.aqara, logger, fileHandler);

  logger.info("System started.");
  console.log("Loaded");
  await doCheck(aqara, nest);
  setInterval(async function() { await doCheck(aqara, nest); }, 1000 * 60 * 5);
}

main();