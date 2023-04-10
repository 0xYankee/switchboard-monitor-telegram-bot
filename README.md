# switchboard-monitor-telegram-bot
This Telegram Bot is a for monitoring and alerting of Switchboard data feeds.
To use this bot, please contact 0xYankee#2626 on Discord!

### How it works
- Enter "/subscribe *GvDMxPzN1sCj7L26YDK2HnMRXEQmQ2aemov8YBtPS7vR* *69*"
- Within the app.js,
  - The app will verify whether the pubkey input exsists and check if the alertBalance is NOT > the current leaseBalance
  - The app will store the the user details and pubkey into a global **map** where it updates the leaseBalance at a fixed interval
  - The app will send an alert to the user when the leaseBalance is <= alertBalance and removes that item from the map
