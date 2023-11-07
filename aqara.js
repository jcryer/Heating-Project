const md5 = require('md5');

const axios = require('axios').default;

class Aqara {
  constructor(aqaraCreds, logger, ) {
    this.appId = aqaraCreds.appId;
    this.accessToken = aqaraCreds.accessToken;
    this.keyId = aqaraCreds.keyId;
    this.appKey = aqaraCreds.appKey;
    this.gatewayId = aqaraCreds.gatewayId;

    this.logger = logger;

    this.deviceList = null;
  }

  async checkSensors() {
    if (this.deviceList === null) {
      let res = await this.#getDeviceList();
      if (!res.success) {
        await this.logger.aqaraError("Aqara.getDeviceList()", res.error);
        return { success: false };
      }
      this.deviceList = res.devices;
    }

    let res = await this.#getDeviceTemps();
    if (!res.success) {
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

  async #getDeviceList() {
    try {
      const body = {
        intent: "query.device.subInfo",
        data: { did: this.gatewayId }
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