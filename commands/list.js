const { map } = require('../app')

function listCommand(msg) {
  const username = msg.chat.username;
  let addresses = '';
  map.forEach((value, key) => {
    if (key.includes(username)) {
      addresses += `🟢 ${value}\n`;
    }
  });
  if (addresses) {
    msg.reply.text(`Here are your current subscriptions:\n\n${addresses}`);
  } else {
    msg.reply.text(`No subscriptions found for ${username}`)
  }
};

module.exports = { listCommand };