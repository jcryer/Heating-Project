const axios = require('axios').default;
const fs = require('fs');

class Logger {
  constructor(discordCreds) {
    this.webhook = discordCreds.webhook;
  }

  async nestError(method, error) {
    try {
      await axios.post(this.webhook, { content: `<@126070623855312896>: An error has occurred in \`${method}\` at ${(new Date()).toLocaleString('en-GB')}` });
      await axios.post(this.webhook, { content: `\`\`\`\n${error.message}\n\`\`\`` });
      await axios.post(this.webhook, { content: `\`\`\`\n${JSON.stringify(error.response.data.error, null, 2)}\n\`\`\`` });
    } catch (err) {
      fs.writeFileSync(`logs/${this.getFormattedTime()}.log`, JSON.stringify(error));
    }
  }

  async aqaraError(method, error) {
    try {
      await axios.post(this.webhook, { content: `<@126070623855312896>: An error has occurred in \`${method}\` at ${(new Date()).toLocaleString('en-GB')}` });
      await axios.post(this.webhook, { content: `\`\`\`\n${JSON.stringify(error, null, 2)}\n\`\`\`` });
    } catch (err) {
      fs.writeFileSync(`logs/${this.getFormattedTime()}.log`, JSON.stringify(error));
    }
  }

  getFormattedTime() {
    var today = new Date();
    var y = today.getFullYear();
    var m = today.getMonth() + 1;
    var d = today.getDate();
    var h = today.getHours();
    var mi = today.getMinutes();
    var s = today.getSeconds();
    return y + "-" + this.zp(m) + "-" + this.zp(d) + "-" + this.zp(h) + ":" + this.zp(mi) + ":" + this.zp(s);
  }

  zp (num) {
    return String(num).padStart(2, '0');
  } 
}



module.exports = Logger;