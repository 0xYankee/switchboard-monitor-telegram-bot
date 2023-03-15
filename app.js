const TeleBot = require('telebot');
require('dotenv').config();

const tgToken = process.env.TELEGRAM_BOT_TOKEN;

const bot = new TeleBot(tgToken);

const map = new Map();

const { fetchLeaseBalance } = require('./fetch');
const { startCommand } = require('./commands/start');
const { helpCommand } = require('./commands/help');
const { subCommand } = require('./commands/subscribe');
const { unsubCommand } = require('./commands/unsubscribe');
const { listCommand } = require('./commands/list');

async function main() {
  while (true) {
    const balance = await fetchLeaseBalance();

    if (balance === 0.98) {
      console.log(`Lease balance: ${balance}`);
      break;
    }

    await new Promise(resolve => setTimeout(resolve, 30000));
  }
}

main()
  .then()
  .catch(error => {
    console.error(error);
});

bot.on('/start', startCommand);
bot.on('/help', helpCommand);
bot.on('/subscribe', subCommand);
bot.on('/unsubscribe', unsubCommand);
bot.on('/list', listCommand);

bot.start();