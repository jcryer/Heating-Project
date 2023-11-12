const fs = require('fs');

class FileHandler {
  constructor() {
    this.credentials = this.#getCredentials();
  }

  updateAqaraCredentials(accessToken, refreshToken) {
    this.credentials.aqara.accessToken = accessToken;
    this.credentials.aqara.refreshToken = refreshToken;
    fs.writeFileSync('credentials.json', JSON.stringify(this.credentials, null, 2));
  }

  updateNestCredentials(accessToken) {
    this.credentials.nest.accessToken = accessToken;
    fs.writeFileSync('credentials.json', JSON.stringify(this.credentials, null, 2));
  }

  #getCredentials() {
    return JSON.parse(fs.readFileSync('credentials.json'));
  }
}

module.exports = FileHandler;