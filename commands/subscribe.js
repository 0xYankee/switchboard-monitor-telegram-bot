const { map } = require('../app')

function subCommand(msg) {
  const [addr, alertBalance] = msg.text.split(' ').slice(1);
  const username = msg.chat.username;

  if (!addr || addr.length !== 44) {
    msg.reply.text('Invalid address received, please try again');
    return;
  };

  map.set(addr, [username, alertBalance, 999]);
  msg.reply.text(`Subscription set for \n\n🟢 ${addr}`);
  console.log(map);
  return;
};

module.exports = { subCommand };