function unsubCommand(msg) {
  const addr = msg.text.split(' ')[1];
  const username = msg.chat.username;
  const key = `${addr}`


  if (!addr || addr.length !== 44) {
    msg.reply.text('Invalid address received, please try again');
    return;
  };

  if (!map.has(key)) {
    msg.reply.text(username, 'Address not found in your subscriptions, please try again');
    return;
  } else {
    map.delete(key);
    msg.reply.text(username, `Subscription removed for \n\n🔴 ${addr}`);
    console.log(map);
    return;
  }
};

module.exports = { unsubCommand };