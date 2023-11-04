const axios = require('axios').default;

class Nest {
  constructor(nestCreds, logger) {
    this.clientId = nestCreds.clientId;
    this.clientSecret = nestCreds.clientSecret;
    this.projectId = nestCreds.projectId;
    this.deviceId = nestCreds.deviceId;
    this.accessToken = nestCreds.accessToken;
    this.refreshToken = nestCreds.refreshToken;

    this.logger = logger;
  }
  
  async setHeating(mode) {
    let tries = 0;
    let res = null;
    do {
      res = await this.#postSetHeating(mode);
      if (res.success) return res;
      if (res.error.response.data.error.code === 401) {
        await this.#updateAccessToken();
      }
      await new Promise(r => setTimeout(r, 5000));
      tries++;
    } while (tries < 5);

    await this.logger.nestError("Nest.setHeating()", res.error);
  }
  
  #buildHeaders() {
    return { headers: { Authorization: `Bearer ${this.accessToken}` } };
  }

  async #updateAccessToken() {
    const res = await this.#postRefreshAccessToken();
    if (res.success) {
      this.accessToken = res.accessToken;
      return;
    }
    await this.logger.nestError("Nest.updateAccessToken()", res.error);
  }

  async #postRefreshAccessToken() {
    try {
      const response = await axios.post(`https://www.googleapis.com/oauth2/v4/token?client_id=${this.clientId}&client_secret=${this.clientSecret}&refresh_token=${this.refreshToken}&grant_type=refresh_token`);
      return { success: true, accessToken: response.data.access_token};
    } catch (error) {
      return { success: false, error: error };
    }
  }

  async #postSetHeating(mode) {
    try {
      const command = {
        "command": "sdm.devices.commands.ThermostatTemperatureSetpoint.SetHeat",
        "params": {
            "heatCelsius": mode ? 25 : 10
        }
      };
      await axios.post(
        `https://smartdevicemanagement.googleapis.com/v1/enterprises/${this.projectId}/devices/${this.deviceId}:executeCommand`,
        command,
        this.#buildHeaders()
      );
      return { success: true };
    } catch (error) {
      return { success: false, error: error };
    }
  }
}

module.exports = Nest;