require("dotenv").config();
const TeleBot = require("telebot");
const { clusterApiUrl, Connection, SolanaJSONRPCError } = require("@solana/web3.js");
const { AggregatorAccount, SwitchboardProgram } = require("@switchboard-xyz/solana.js");
const tgToken = process.env.TELEGRAM_BOT_TOKEN;
const bot = new TeleBot(tgToken);
const map = new Map();

async function updateAndAlert() {
  const connection = new Connection(clusterApiUrl("mainnet-beta"));
  const program = await SwitchboardProgram.load("mainnet-beta", connection);

  setInterval(async () => {
    if (map.size >= 1) {
      for (const [addr, [username, id, alertBalance, leaseBalance]] of map.entries()) {
          const aggregatorAccount = new AggregatorAccount(program, addr);
          const newBalance = await aggregatorAccount.fetchBalance();
          map.set(addr, [username, id, alertBalance, newBalance]);
          console.log(map);

        if (newBalance <= alertBalance) {
            const message = `⚠️ Alert: ${addr}\n\nThe lease has reached *${newBalance}*!\n\nYour subscription has ended for ${addr}\nPlease re-subscribe to get alerts for your feed.`;
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
    if (validAddress.lease.data.aggregator) {
      console.log(validAddress.lease.data.aggregator);
      return true;
    }
  } catch (err) {
    if (err instanceof SolanaJSONRPCError && err.code === -32602) {
      console.log('Retry 0');
      while (true) {
        try {
          const validAddress = await aggregatorAccount.fetchAccounts();
          if (validAddress.lease.data.aggregator) {
            console.log(validAddress.lease.data.aggregator);
            return true;
          }
        } catch (err) {
          console.log(err);
        }
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    } else {
      console.log(err);
      return false;
    }
  }
};

function startCommand(msg) {
  msg.reply.text(
    "Welcome to Switchboard Monitor Bot! \n\nPlease check the menu or do /help for a list of commands to help you start subscribing to monitor your lease escrows.\n\nNote: All subscription commands follow this example:\n{Enter command}\n{Enter address}\n{Enter alertBalance}"
  );
};

function helpCommand(msg) {
  msg.reply.text(
    "Here is a list of comannds:\n\n" +
      "/start:               Start the bot\n\n" +
      "/help:                List of the bot commands\n\n" +
      "/subscribe:      Subscribe to a feed address\n\n" +
      "/unsubscribe:  Unsubscribe to a feed address\n\n" +
      "/submass:        Subscribe to multiple feed addresses\n\n" +
      "/unsubmass:    Unsubscribe to multiple feed addresses\n\n" +
      "/list:                   List of feeds you're currently subscribed to"
  );
};

async function subCommand(msg) {
  const lines = msg.text.split("\n").slice(1);
  const alertBalance = Number(lines.pop());
  const id = msg.chat.id;
  const username = msg.chat.username;
  console.log(lines)

  if (lines.length === 0 || isNaN(alertBalance)) {
    msg.reply.text('Please specify in this manner to subscribe to get an alert.\n\nFor example:\n/sub\n{Enter address}\n{Enter next address}\n{Enter alertBalance}');
    return;
  };

  const invalidAddresses = [];
  const subscribedAddresses = [];
  const notFoundAddresses = [];
  const highBalanceAddresses = [];

  for (const addr of lines) {
    msg.reply.text(`Please wait a moment, checking address:\n\n${addr}`)
    if (!addr || addr.length !== 44) {
      invalidAddresses.push(addr);
      continue;
    };

    for (const [mapAddr, [mapUsername, mapId, mapAlertBalance, mapLeaseBalance]] of map.entries()) {
      if (mapUsername === username && mapAddr === addr && mapId === id) {
        subscribedAddresses.push(addr);
        break;
      };
    };

    const isValid = await checkAddress(addr);
    if (!isValid) {
      notFoundAddresses.push(addr);
      continue;
    };  

    const connection = new Connection(clusterApiUrl("mainnet-beta"));
    const program = await SwitchboardProgram.load("mainnet-beta", connection);
    const aggregatorAccount = new AggregatorAccount(program, addr);
    const currentBalance = await aggregatorAccount.fetchBalance();

    if (currentBalance <= alertBalance) {
      highBalanceAddresses.push(addr);
      continue;
    };
  };

  if (invalidAddresses.length > 0) {
    msg.reply.text(`The address is invalid:\n\n${invalidAddresses.join("\n")}`);
  } else if (subscribedAddresses.length > 0) {
    msg.reply.text(`The address was previously subscribed:\n\n${subscribedAddresses.join("\n")}`);
  } else if (notFoundAddresses.length > 0) {
    msg.reply.text(`The address was not found:\n\n${notFoundAddresses.join("\n")}`);
  } else if (highBalanceAddresses.length > 0) {
    msg.reply.text(`The address has an alert balance that is greater than the current lease balance:\n\n${highBalanceAddresses.join("\n")}`);
  } else {
    for (const addr of lines) {
      map.set(`${addr}`, [`${username}`, `${id}`, `${alertBalance}`, 'New subscription']);
    };
    msg.reply.text(`Subscriptions set for:\n\n🟢 ${lines.join("\n🟢 ")}`);
    console.log(map);
  };
};

async function submassCommand(msg) {
  const lines = msg.text.split("\n").slice(1);
  const alertBalance = Number(lines.pop());
  const id = msg.chat.id;
  const username = msg.chat.username;

  if (lines.length === 0 || isNaN(alertBalance)) {
    msg.reply.text('Please specify in this manner to subscribe to get an alert.\n\nFor example:\n/sub\n{Enter address}\n{Enter next address}\n{Enter alertBalance}');
    return;
  };

  const invalidAddresses = [];
  const subscribedAddresses = [];
  const notFoundAddresses = [];
  const highBalanceAddresses = [];

  for (const addr of lines) {
    msg.reply.text(`Please wait a moment, checking address:\n\n${addr}`)
    if (!addr || addr.length !== 44) {
      invalidAddresses.push(addr);
      continue;
    };

    for (const [mapAddr, [mapUsername, mapId, mapAlertBalance, mapLeaseBalance]] of map.entries()) {
      if (mapUsername === username && mapAddr === addr && mapId === id) {
        subscribedAddresses.push(addr);
        break;
      };
    };

    const isValid = await checkAddress(addr);
    if (!isValid) {
      notFoundAddresses.push(addr);
      continue;
    };  

    const connection = new Connection(clusterApiUrl("mainnet-beta"));
    const program = await SwitchboardProgram.load("mainnet-beta", connection);
    const aggregatorAccount = new AggregatorAccount(program, addr);
    const currentBalance = await aggregatorAccount.fetchBalance();

    if (currentBalance <= alertBalance) {
      highBalanceAddresses.push(addr);
      continue;
    };
  };

  if (invalidAddresses.length > 0) {
    msg.reply.text(`The following addresses are invalid:\n\n${invalidAddresses.join("\n")}`);
  } else if (subscribedAddresses.length > 0) {
    msg.reply.text(`The following addresses were previously subscribed:\n\n${subscribedAddresses.join("\n")}`);
  } else if (notFoundAddresses.length > 0) {
    msg.reply.text(`The address was not found:\n\n${notFoundAddresses.join("\n")}`);
  } else if (highBalanceAddresses.length > 0) {
    msg.reply.text(`The following addresses have an alert balance that is lower than the current lease balance:\n\n${highBalanceAddresses.join("\n")}`);
  } else {
    for (const addr of lines) {
      map.set(`${addr}`, [`${username}`, `${id}`, `${alertBalance}`, 'New subscription']);
    };
    msg.reply.text(`Subscriptions set for:\n\n🟢 ${lines.join("\n🟢 ")}`);
    console.log(map);
  };
};

function unsubCommand(msg) {
  const lines = msg.text.split("\n").slice(1);
  const id = msg.chat.id;
  const username = msg.chat.username;

  if (!lines || lines.length === 0) {
    msg.reply.text('Please specify in this manner to unsubscribe.\n\nFor example:\n/unsub\n{Enter address}');
    return;
  }

  const invalidAddresses = [];
  const notFoundAddresses = [];
  const notYoursAddresses = [];

  for (const addr of lines) {
    const values = map.get(addr);
    console.log(values)

    if (addr.length !== 44) {
      invalidAddresses.push(addr);
      continue;
    };

    if (!values) {
      notFoundAddresses.push(addr);
      continue;
    };

    for (const [mapAddr, [mapUsername, mapId, mapAlertBalance, mapLeaseBalance]] of map.entries()) {
      if (mapUsername !== username && mapId !== id) {
        notYoursAddresses.push(addr);
        break;
      };
    };
  };

  if (invalidAddresses.length > 0) {
    msg.reply.text(`The address is invalid:\n\n${invalidAddresses.join("\n")}`);
  } else if (notFoundAddresses.length > 0) {
    console.log('imhere4')
    msg.reply.text(`The address was not found:\n\n${notFoundAddresses.join("\n")}`);
  } else if (notYoursAddresses.length > 0) {
    msg.reply.text(`The address was not found:\n\n${notYoursAddresses.join("\n")}`);
  } else {
    for (const addr of lines) {
      map.delete(addr);
    };
    msg.reply.text(`Subscription removed for\n\n🔴 ${lines.join("\n🔴 ")}`);
    console.log(map);
  };
};

function unsubmassCommand(msg) {
  const lines = msg.text.split("\n").slice(1);
  const id = msg.chat.id;
  const username = msg.chat.username;

  if (!lines || lines.length === 0) {
    msg.reply.text('Please specify in this manner to unsubscribe.\n\nFor example:\n/unsub\n{Enter address}\n{Enter next address}');
    return;
  }

  const invalidAddresses = [];
  const notFoundAddresses = [];
  const notYoursAddresses = [];

  for (const addr of lines) {
    const values = map.get(addr);

    if (addr.length !== 44) {
      invalidAddresses.push(addr);
      continue;
    }

    if (!values) {
      notFoundAddresses.push(addr);
      continue;
    };

    for (const [mapAddr, [mapUsername, mapId, mapAlertBalance, mapLeaseBalance]] of map.entries()) {
      if (mapUsername !== username && mapId !== id) {
        notYoursAddresses.push(addr);
        continue;
      };
    };
  };

  if (invalidAddresses.length > 0) {
    msg.reply.text(`The addresses are invalid:\n\n${invalidAddresses.join("\n")}`);
  } else if (notFoundAddresses.length > 0) {
    msg.reply.text(`The addresses were not found:\n\n${notFoundAddresses.join("\n")}`);
  } else if (notYoursAddresses.length > 0) {
    msg.reply.text(`The addresses were not found:\n\n${notYoursAddresses.join("\n")}`);
  } else {
    for (const addr of lines) {
      map.delete(addr);
    };
    msg.reply.text(`Subscription removed for\n\n🔴 ${lines.join("\n🔴 ")}`);
    console.log(map);
  };
};

function listCommand(msg) {
  const username = msg.chat.username;
  let addresses = "";
  map.forEach((value, key) => {
    if (value.includes(username)) {
      addresses += `🟢 ${key}\n⏰ ${value[2]}\n👉 ${value[3]}\n\n`;
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
bot.on("/submass", submassCommand);
bot.on("/unsubscribe", unsubCommand);
bot.on("/unsubmass", unsubmassCommand);
bot.on("/list", listCommand);

updateAndAlert()
  .then(console.log("[app.js] Running updateAndAlert"));

bot.start();
