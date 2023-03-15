function helpCommand(msg) {
  msg.reply.text('Here is a list of comannds:\n\n' +
                    '/start: Start the bot\n\n' + 
                    '/help: List of the bot commands\n\n' +
                    '/list: List of feeds you specified\n\n' +
                    '/subscribe Subscribe to a feed address\n\n' +
                    '/unsubscribe: Unsubscribe to a feed address')
};

module.exports = { helpCommand };