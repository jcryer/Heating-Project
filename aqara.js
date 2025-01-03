const md5 = require('md5');

const axios = require('axios').default;

class Aqara {
  constructor(aqaraCreds, logger, fileHandler) {
    this.appId = aqaraCreds.appId;
    this.accessToken = aqaraCreds.accessToken;
    this.refreshToken = aqaraCreds.refreshToken;
    this.keyId = aqaraCreds.keyId;
    this.appKey = aqaraCreds.appKey;
    this.gatewayIds = aqaraCreds.gatewayIds;

    this.logger = logger;
    this.fileHandler = fileHandler;

    this.deviceList = null;
  }

  async checkSensors() {
    if (this.deviceList === null) {
      let resp = []
      for (const id of this.gatewayIds) {
        let res = await this.#getDeviceList(id);
        if (!res.success) {
          if (res.error.code === 108) {
            await this.#updateAccessToken();
            await this.logger.info("Aqara access key refreshed");
            await new Promise(r => setTimeout(r, 30000));
            return await this.checkSensors();
          }
          await this.logger.aqaraError("Aqara.getDeviceList()", res.error);
          return { success: false };
        }
        resp = resp.concat(res.devices);
      }
      
      this.deviceList = resp;
    }

    let res = await this.#getDeviceTemps();
    if (!res.success) {
      if (res.error.code === 108) {
        await this.#updateAccessToken();
        await this.logger.info("Aqara access key refreshed");
        await new Promise(r => setTimeout(r, 30000));
        return await this.checkSensors();
      }
      await this.logger.aqaraError("Aqara.getDeviceTemps()", res.error);
      return { success: false };
    }
    return res;
  }

  #buildHeaders() {
    const time = Math.round(new Date().getTime());
    let sign = `Accesstoken=${this.accessToken}&Appid=${this.appId}&Keyid=${this.keyId}&Nonce=${time}&Time=${time}${this.appKey}`
    sign = md5(sign.toLowerCase());
    return { headers: { Appid: this.appId, Accesstoken: this.accessToken, Keyid: this.keyId, Time: time, Nonce: time, Sign: sign } };
  }

  async #updateAccessToken() {
    const res = await this.#postRefreshAccessToken();
    if (res.success) {
      this.accessToken = res.accessToken;
      this.refreshToken = res.refreshToken;
      this.fileHandler.updateAqaraCredentials(this.accessToken, this.refreshToken);
      return;
    }
    await this.logger.nestError("Aqara.updateAccessToken()", res.error);
  }

  async #postRefreshAccessToken() {
    try {
      const body = {
        intent: "config.auth.refreshToken",
        data: { refreshToken: this.refreshToken }
      };
      const response = await axios.post('https://open-ger.aqara.com/v3.0/open/api', body, this.#buildHeaders());
      if (response.data.code === 0) {
        return { success: true, accessToken: response.data.result.accessToken, refreshToken: response.data.result.refreshToken };
      }
      return { success: false, error: response.data };
    }
    catch (error) {
      return { success: false, error: error };
    }
  }

  async #getDeviceTemps() {
    try {
      const body = {
        intent: "query.resource.value",
        data: { resources: this.deviceList.map(d => ({subjectId: d.id, resourceIds: ["0.1.85", "1.8.85"]})) }
      };
      const response = await axios.post('https://open-ger.aqara.com/v3.0/open/api', body, this.#buildHeaders());
      if (response.data.code === 0) {
        const results = response.data.result.map(r => 
          ({ 
            id: r.subjectId, 
            ...(r.resourceId === "0.1.85" ? { current: parseFloat(r.value) / 100 } : { desired: parseFloat(r.value) / 100 })
          })
        ).reduce((acc, obj) => {
          acc[obj.id] = {...acc[obj.id], ...obj};
          return acc;
        }, {});
        return { success: true, devices: Object.values(results) };
      }
      return { success: false, error: response.data };
    } catch (error) {
      return { success: false, error: error };
    }
  }

  async #getDeviceList(id) {
    try {
      const body = {
        intent: "query.device.subInfo",
        data: { did: id }
      };
      const response = await axios.post('https://open-ger.aqara.com/v3.0/open/api', body, this.#buildHeaders());
      if (response.data.code === 0) {
        return { success: true, devices: response.data.result.filter(d => d.state === 1).map(d => ({ id: d.did, name: d.deviceName })) };
      }
      return { success: false, error: response.data };
    } catch (error) {
      return { success: false, error: error };
    }
  }
}

module.exports = Aqara;