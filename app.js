const TeleBot = require("telebot");
require("dotenv").config();

const tgToken = process.env.TELEGRAM_BOT_TOKEN;

const bot = new TeleBot(tgToken);

const map = new Map();

const { clusterApiUrl, Connection } = require("@solana/web3.js");
const { AggregatorAccount, SwitchboardProgram } = require("@switchboard-xyz/solana.js");

async function updateAndAlert() {
  const connection = new Connection(clusterApiUrl("mainnet-beta"));
  const program = await SwitchboardProgram.load("mainnet-beta", connection);

  setInterval(async () => {
    if (map.size >= 1) {
      for (const [addr, [username, id, alertBalance, leaseBalance]] of map.entries()) {
          const aggregatorAccount = new AggregatorAccount(program, addr);
          const newBalance = await aggregatorAccount.fetchBalance();
          console.log(map);
          map.set(addr, [username, id, alertBalance, newBalance]);
          console.log(map);

        if (newBalance <= alertBalance) {
            const message = `⚠️ Alert:\n\nThe lease for your subscription\n${addr}\n\nhas reached ${newBalance}!\n\nYour subscription has ended for ${addr}, please re-subscribe to get alerts for your feed.`;
            bot.sendMessage(id, message)
            .catch((error) => {
                console.log("supdateAlert error:" + JSON.stringify(error))
            })
            map.delete(addr);
            console.log(map);
        };
      };
    };
  } , 30000);
};

async function checkAddress(addr) {
  const connection = new Connection(clusterApiUrl("mainnet-beta"));
  const program = await SwitchboardProgram.load("mainnet-beta", connection);
  const aggregatorAccount = new AggregatorAccount(program, addr);
  try {
    const validAddress = await aggregatorAccount.fetchAccounts();
    if (validAddress) {
      return true;
    }
  } catch (err) {
    if (err) {
      return false;
    } else {
      throw err;
    }
  }
};

function startCommand(msg) {
  msg.reply.text(
    "Welcome to Switchboard Monitor Bot! \n\nPlease check the menu or do /help for a list of commands to help you start subscribing to monitor your lease escrows."
  );
};

function helpCommand(msg) {
  msg.reply.text(
    "Here is a list of comannds:\n\n" +
      "/start: Start the bot\n\n" +
      "/help: List of the bot commands\n\n" +
      "/subscribe Subscribe to a feed address\n\n" +
      "/unsubscribe: Unsubscribe to a feed address" +
      "/list: List of feeds you subscribed to\n\n"
  );
};

async function subCommand(msg) {
  const [addr, alertBalance] = msg.text.split(" ").slice(1);
  const id = msg.chat.id;
  const username = msg.chat.username;

  if (!addr || addr.length !== 44) {
    msg.reply.text("Invalid address received, please try again");
    return;
  };

  for (const [mapAddr, [mapUsername, mapId, alertBalance, leaseBalance]] of map.entries()) {
    if (addr === mapAddr && username === mapUsername && id === mapId) {
      msg.reply.text("You've already subscribed to this feed address. Do /list to check your list of subscriptions");
      return;
    }
  }

  const isValid = await checkAddress(addr);
  if (!isValid) {
    msg.reply.text("Invalid address received, please try again");
    return;
  };

  if (isValid) {
    const connection = new Connection(clusterApiUrl("mainnet-beta"));
    const program = await SwitchboardProgram.load("mainnet-beta", connection);
    const aggregatorAccount = new AggregatorAccount(program, addr);
    const currentBalance = await aggregatorAccount.fetchBalance();
    if (currentBalance <= alertBalance) {
      msg.reply.text("The value you've specified is lower than the current lease balance, please try again")
    } else {
      map.set(`${addr}`, [`${username}`, `${id}`, `${alertBalance}`, `${currentBalance}`]);
      msg.reply.text(`Subscription set for \n\n🟢 ${addr}`);
      console.log(map);
      return;
    };
  };
};

function unsubCommand(msg) {
  const username = msg.chat.username;
  const addr = msg.text.split(" ")[1];
  const key = `${addr}`;
  const values = map.get(key);

  if (values === undefined) {
    msg.reply.text(`Address not found in your subscriptions, please try again`);
    return;
  }

  const valueUsername = values[0];
  console.log(`${valueUsername}`);

  if (map.has(key) && valueUsername === username) {
    msg.reply.text(`Subscription removed for \n\n🔴 ${addr}`);
    map.delete(key);
    console.log(map);
  } else {
    msg.reply.text(`Address not found in your subscriptions, please try again`);
  }
};

function listCommand(msg) {
  const username = msg.chat.username;
  let addresses = "";
  map.forEach((value, key) => {
    if (value.includes(username)) {
      addresses += `🟢 ${key}\n`;
    }
  });
  if (addresses) {
    msg.reply.text(`Here are your current subscriptions:\n\n${addresses}`);
  } else {
    msg.reply.text(`No subscriptions found for ${username}`);
  }
};

bot.on("/start", startCommand);
bot.on("/help", helpCommand);
bot.on("/subscribe", subCommand);
bot.on("/unsubscribe", unsubCommand);
bot.on("/list", listCommand);

updateAndAlert()
  .then(console.log("[app.js] loaded and running updateAndAlert"));

bot.start();
