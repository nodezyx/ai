const fs = require("fs");
const { cmd } = require('../command');
const config = require('../config');
const prefix = config.PREFIX;

const economyDBPath = "./lib/economy-database.json";
const cooldownsDBPath = "./lib/economy-cooldowns.json";
const shopDBPath = "./lib/economy-shop.json";

// Load database functions
function loadDB(path) {
  if (!fs.existsSync(path)) return {};
  const data = fs.readFileSync(path, "utf-8");
  return JSON.parse(data || "{}");
}

function saveDB(path, db) {
  fs.writeFileSync(path, JSON.stringify(db, null, 2));
}

// Initialize databases
const economyDB = loadDB(economyDBPath);
const cooldownsDB = loadDB(cooldownsDBPath);
let shopDB = loadDB(shopDBPath);

// Default shop items if empty
if (Object.keys(shopDB).length === 0) {
  shopDB = {
    items: {
      "🍎 Apple": { price: 50, description: "Basic food (+10 health)" },
      "💊 Health Potion": { price: 200, description: "Restores 50 health" },
      "⚔️ Sword": { price: 500, description: "Basic weapon (+10 attack)" },
      "🛡️ Shield": { price: 450, description: "Basic defense (+10 defense)" },
      "💎 Diamond": { price: 1000, description: "Rare item (investment)" }
    },
    lastRestock: Date.now()
  };
  saveDB(shopDBPath, shopDB);
}

// Economy commands
cmd({
  pattern: "balance",
  alias: ["bal"],
  desc: "Check your economy balance",
  category: "economy",
  filename: __filename
}, async (conn, mek, m, { from, sender, reply }) => {
  const userId = sender;
  const userData = economyDB[userId] || createUser(userId);
  
  await reply(`💰 *Balance*\n\n👛 Wallet: $${userData.wallet}\n🏦 Bank: $${userData.bank}/${userData.bankLimit}\n\n💳 Net worth: $${userData.wallet + userData.bank}`);
});

cmd({
  pattern: "daily",
  desc: "Claim your daily reward",
  category: "economy",
  filename: __filename
}, async (conn, mek, m, { from, sender, reply, pushname }) => {
  const userId = sender;
  const now = Date.now();
  const cooldownKey = `daily-${userId}`;
  
  // Check cooldown
  if (cooldownsDB[cooldownKey] && now - cooldownsDB[cooldownKey] < 24 * 60 * 60 * 1000) {
    const nextClaim = new Date(cooldownsDB[cooldownKey] + 24 * 60 * 60 * 1000);
    return reply(`⌛ You've already claimed your daily reward today!\nNext claim available at: ${nextClaim.toLocaleString()}`);
  }
  
  // Initialize user if doesn't exist
  if (!economyDB[userId]) economyDB[userId] = createUser(userId);
  
  // Calculate daily reward (base + streak bonus)
  const streak = economyDB[userId].dailyStreak || 0;
  const baseReward = 100;
  const streakBonus = Math.min(streak * 10, 100); // Max 100 bonus
  const totalReward = baseReward + streakBonus;
  
  // Update user data
  economyDB[userId].wallet += totalReward;
  economyDB[userId].dailyStreak = streak + 1;
  cooldownsDB[cooldownKey] = now;
  
  saveDB(economyDBPath, economyDB);
  saveDB(cooldownsDBPath, cooldownsDB);
  
  await reply(`🎉 *Daily Reward Claimed!*\n\n💰 Received: $${totalReward}\n📈 Streak: ${streak + 1} days\n💵 Base: $${baseReward}\n✨ Bonus: $${streakBonus}\n\n👛 New balance: $${economyDB[userId].wallet}`);
});

cmd({
  pattern: "work",
  desc: "Work to earn money (2h cooldown)",
  category: "economy",
  filename: __filename
}, async (conn, mek, m, { from, sender, reply, pushname }) => {
  const userId = sender;
  const now = Date.now();
  const cooldownKey = `work-${userId}`;
  
  // Check cooldown
  if (cooldownsDB[cooldownKey] && now - cooldownsDB[cooldownKey] < 2 * 60 * 60 * 1000) {
    const nextWork = new Date(cooldownsDB[cooldownKey] + 2 * 60 * 60 * 1000);
    return reply(`⌛ You need to rest! You can work again at: ${nextWork.toLocaleTimeString()}`);
  }
  
  // Initialize user if doesn't exist
  if (!economyDB[userId]) economyDB[userId] = createUser(userId);
  
  // Get user's job and calculate earnings
  const userJob = economyDB[userId].job || "unemployed";
  const jobs = {
    unemployed: { min: 10, max: 30, name: "Odd Jobs" },
    clerk: { min: 30, max: 60, name: "Office Clerk" },
    programmer: { min: 80, max: 150, name: "Programmer" },
    doctor: { min: 120, max: 250, name: "Doctor" },
    ceo: { min: 300, max: 600, name: "CEO" }
  };
  
  const earnings = Math.floor(Math.random() * (jobs[userJob].max - jobs[userJob].min + 1)) + jobs[userJob].min;
  
  // Update user data
  economyDB[userId].wallet += earnings;
  economyDB[userId].workCount = (economyDB[userId].workCount || 0) + 1;
  cooldownsDB[cooldownKey] = now;
  
  saveDB(economyDBPath, economyDB);
  saveDB(cooldownsDBPath, cooldownsDB);
  
  await reply(`💼 *Work Complete!*\n\n🏢 Job: ${jobs[userJob].name}\n💰 Earned: $${earnings}\n\n👛 New balance: $${economyDB[userId].wallet}`);
});

cmd({
  pattern: "deposit",
  alias: ["dep"],
  desc: "Deposit money to your bank",
  category: "economy",
  filename: __filename,
  usage: "<amount | all | half>"
}, async (conn, mek, m, { from, sender, reply, args }) => {
  const userId = sender;
  const amountArg = args[0];
  
  if (!amountArg) return reply("⚠️ Please specify an amount to deposit (e.g., 'deposit 100', 'deposit all', 'deposit half')");
  
  // Initialize user if doesn't exist
  if (!economyDB[userId]) economyDB[userId] = createUser(userId);
  
  const user = economyDB[userId];
  let amount;
  
  if (amountArg.toLowerCase() === "all") {
    amount = user.wallet;
  } else if (amountArg.toLowerCase() === "half") {
    amount = Math.floor(user.wallet / 2);
  } else {
    amount = parseInt(amountArg);
    if (isNaN(amount) return reply("⚠️ Please enter a valid number");
  }
  
  // Validate amount
  if (amount <= 0) return reply("⚠️ Amount must be positive");
  if (amount > user.wallet) return reply(`⚠️ You don't have enough money in your wallet (current: $${user.wallet})`);
  if (user.bank + amount > user.bankLimit) return reply(`⚠️ Deposit would exceed your bank limit (current: $${user.bank}/${user.bankLimit})`);
  
  // Perform deposit
  user.wallet -= amount;
  user.bank += amount;
  
  saveDB(economyDBPath, economyDB);
  
  await reply(`🏦 *Deposit Successful!*\n\n💵 Deposited: $${amount}\n👛 Wallet: $${user.wallet}\n🏦 Bank: $${user.bank}/${user.bankLimit}`);
});

cmd({
  pattern: "withdraw",
  alias: ["with"],
  desc: "Withdraw money from your bank",
  category: "economy",
  filename: __filename,
  usage: "<amount | all | half>"
}, async (conn, mek, m, { from, sender, reply, args }) => {
  const userId = sender;
  const amountArg = args[0];
  
  if (!amountArg) return reply("⚠️ Please specify an amount to withdraw (e.g., 'withdraw 100', 'withdraw all', 'withdraw half')");
  
  // Initialize user if doesn't exist
  if (!economyDB[userId]) economyDB[userId] = createUser(userId);
  
  const user = economyDB[userId];
  let amount;
  
  if (amountArg.toLowerCase() === "all") {
    amount = user.bank;
  } else if (amountArg.toLowerCase() === "half") {
    amount = Math.floor(user.bank / 2);
  } else {
    amount = parseInt(amountArg);
    if (isNaN(amount)) return reply("⚠️ Please enter a valid number");
  }
  
  // Validate amount
  if (amount <= 0) return reply("⚠️ Amount must be positive");
  if (amount > user.bank) return reply(`⚠️ You don't have enough money in your bank (current: $${user.bank})`);
  
  // Perform withdrawal
  user.bank -= amount;
  user.wallet += amount;
  
  saveDB(economyDBPath, economyDB);
  
  await reply(`🏦 *Withdrawal Successful!*\n\n💵 Withdrew: $${amount}\n👛 Wallet: $${user.wallet}\n🏦 Bank: $${user.bank}/${user.bankLimit}`);
});

cmd({
  pattern: "shop",
  desc: "View the shop items",
  category: "economy",
  filename: __filename
}, async (conn, mek, m, { from, reply }) => {
  let shopMessage = "🛒 *Shop Items*\n\n";
  
  for (const [item, details] of Object.entries(shopDB.items)) {
    shopMessage += `${item} - $${details.price}\n${details.description}\n\n`;
  }
  
  shopMessage += `\nUse *${prefix}buy <item>* to purchase an item.`;
  await reply(shopMessage);
});

cmd({
  pattern: "buy",
  desc: "Purchase an item from the shop",
  category: "economy",
  filename: __filename,
  usage: "<item>"
}, async (conn, mek, m, { from, sender, reply, args }) => {
  const userId = sender;
  const itemName = args.join(" ").trim();
  
  if (!itemName) return reply("⚠️ Please specify an item to buy (see shop for items)");
  
  // Initialize user if doesn't exist
  if (!economyDB[userId]) economyDB[userId] = createUser(userId);
  
  // Find item in shop (case insensitive)
  const itemEntry = Object.entries(shopDB.items).find(
    ([name]) => name.toLowerCase() === itemName.toLowerCase()
  );
  
  if (!itemEntry) return reply("⚠️ Item not found in shop. Use 'shop' to see available items.");
  
  const [item, details] = itemEntry;
  
  // Check if user can afford it
  if (economyDB[userId].wallet < details.price) {
    return reply(`⚠️ You don't have enough money to buy ${item} (needed: $${details.price}, have: $${economyDB[userId].wallet})`);
  }
  
  // Process purchase
  economyDB[userId].wallet -= details.price;
  
  // Initialize inventory if doesn't exist
  if (!economyDB[userId].inventory) economyDB[userId].inventory = {};
  
  // Add item to inventory
  economyDB[userId].inventory[item] = (economyDB[userId].inventory[item] || 0) + 1;
  
  saveDB(economyDBPath, economyDB);
  
  await reply(`🛍️ *Purchase Successful!*\n\n✅ Bought: ${item}\n💰 Price: $${details.price}\n\n👛 Remaining balance: $${economyDB[userId].wallet}`);
});

cmd({
  pattern: "inventory",
  alias: ["inv"],
  desc: "View your inventory",
  category: "economy",
  filename: __filename
}, async (conn, mek, m, { from, sender, reply }) => {
  const userId = sender;
  
  // Initialize user if doesn't exist
  if (!economyDB[userId]) economyDB[userId] = createUser(userId);
  
  const user = economyDB[userId];
  
  if (!user.inventory || Object.keys(user.inventory).length === 0) {
    return reply("🎒 Your inventory is empty. Visit the shop to buy some items!");
  }
  
  let inventoryMessage = "🎒 *Inventory*\n\n";
  
  for (const [item, count] of Object.entries(user.inventory)) {
    inventoryMessage += `${item} x${count}\n`;
  }
  
  await reply(inventoryMessage);
});

cmd({
  pattern: "give",
  desc: "Give money or items to another user",
  category: "economy",
  filename: __filename,
  usage: "<@user> <amount | item> [quantity]"
}, async (conn, mek, m, { from, sender, reply, args, mentionedJid }) => {
  if (args.length < 2 || mentionedJid.length === 0) {
    return reply(`⚠️ Usage: ${prefix}give @user <amount | item> [quantity]`);
  }
  
  const recipientId = mentionedJid[0];
  const giveWhat = args[1].toLowerCase();
  const quantity = parseInt(args[2]) || 1;
  
  if (recipientId === sender) return reply("⚠️ You can't give items/money to yourself!");
  
  // Initialize both users if they don't exist
  if (!economyDB[sender]) economyDB[sender] = createUser(sender);
  if (!economyDB[recipientId]) economyDB[recipientId] = createUser(recipientId);
  
  const senderUser = economyDB[sender];
  const recipientUser = economyDB[recipientId];
  
  // Giving money
  if (!isNaN(giveWhat)) {
    const amount = parseInt(giveWhat) * quantity;
    
    if (amount <= 0) return reply("⚠️ Amount must be positive");
    if (senderUser.wallet < amount) return reply(`⚠️ You don't have enough money (needed: $${amount}, have: $${senderUser.wallet})`);
    
    // Transfer money
    senderUser.wallet -= amount;
    recipientUser.wallet += amount;
    
    saveDB(economyDBPath, economyDB);
    
    const senderName = `@${sender.split("@")[0]}`;
    const recipientName = `@${recipientId.split("@")[0]}`;
    
    return reply(
      `💰 *Money Transfer*\n\n${senderName} gave $${amount} to ${recipientName}\n\n${senderName}'s wallet: $${senderUser.wallet}\n${recipientName}'s wallet: $${recipientUser.wallet}`,
      null,
      { mentions: [sender, recipientId] }
    );
  }
  
  // Giving items
  if (!senderUser.inventory || !senderUser.inventory[giveWhat]) {
    return reply(`⚠️ You don't have any ${giveWhat} in your inventory`);
  }
  
  if (senderUser.inventory[giveWhat] < quantity) {
    return reply(`⚠️ You don't have enough ${giveWhat} (needed: ${quantity}, have: ${senderUser.inventory[giveWhat]})`);
  }
  
  // Transfer item
  senderUser.inventory[giveWhat] -= quantity;
  if (senderUser.inventory[giveWhat] === 0) {
    delete senderUser.inventory[giveWhat];
  }
  
  if (!recipientUser.inventory) recipientUser.inventory = {};
  recipientUser.inventory[giveWhat] = (recipientUser.inventory[giveWhat] || 0) + quantity;
  
  saveDB(economyDBPath, economyDB);
  
  const senderName = `@${sender.split("@")[0]}`;
  const recipientName = `@${recipientId.split("@")[0]}`;
  
  return reply(
    `🎁 *Item Transfer*\n\n${senderName} gave ${quantity}x ${giveWhat} to ${recipientName}`,
    null,
    { mentions: [sender, recipientId] }
  );
});

cmd({
  pattern: "rob",
  desc: "Attempt to rob another user (risky!)",
  category: "economy",
  filename: __filename,
  usage: "<@user>"
}, async (conn, mek, m, { from, sender, reply, mentionedJid }) => {
  if (mentionedJid.length === 0) {
    return reply(`⚠️ Please mention a user to rob (e.g., ${prefix}rob @user)`);
  }
  
  const targetId = mentionedJid[0];
  
  if (targetId === sender) return reply("⚠️ You can't rob yourself!");
  
  // Initialize users if they don't exist
  if (!economyDB[sender]) economyDB[sender] = createUser(sender);
  if (!economyDB[targetId]) economyDB[targetId] = createUser(targetId);
  
  const robber = economyDB[sender];
  const target = economyDB[targetId];
  
  // Check cooldown
  const cooldownKey = `rob-${sender}`;
  const now = Date.now();
  
  if (cooldownsDB[cooldownKey] && now - cooldownsDB[cooldownKey] < 6 * 60 * 60 * 1000) {
    const nextRob = new Date(cooldownsDB[cooldownKey] + 6 * 60 * 60 * 1000);
    return reply(`⌛ You can attempt another robbery at: ${nextRob.toLocaleTimeString()}`);
  }
  
  // Check if target has money to rob
  if (target.wallet < 50) {
    return reply("⚠️ This user doesn't have enough money in their wallet to rob (minimum $50 needed)");
  }
  
  // Robbery attempt (60% chance of success)
  const success = Math.random() < 0.6;
  const amountRobbed = Math.floor(Math.random() * (target.wallet * 0.3)) + 10; // 10-30% of target's wallet
  
  if (success) {
    // Successful robbery
    const actualRobbed = Math.min(amountRobbed, target.wallet);
    target.wallet -= actualRobbed;
    robber.wallet += actualRobbed;
    
    cooldownsDB[cooldownKey] = now;
    
    saveDB(economyDBPath, economyDB);
    saveDB(cooldownsDBPath, cooldownsDB);
    
    const robberName = `@${sender.split("@")[0]}`;
    const targetName = `@${targetId.split("@")[0]}`;
    
    return reply(
      `💰 *Robbery Successful!*\n\n${robberName} stole $${actualRobbed} from ${targetName}\n\n${robberName}'s wallet: $${robber.wallet}\n${targetName}'s wallet: $${target.wallet}`,
      null,
      { mentions: [sender, targetId] }
    );
  } else {
    // Failed robbery - robber pays fine
    const fine = Math.floor(Math.random() * 100) + 50;
    const actualFine = Math.min(fine, robber.wallet);
    
    robber.wallet -= actualFine;
    target.wallet += actualFine;
    
    cooldownsDB[cooldownKey] = now;
    
    saveDB(economyDBPath, economyDB);
    saveDB(cooldownsDBPath, cooldownsDB);
    
    const robberName = `@${sender.split("@")[0]}`;
    const targetName = `@${targetId.split("@")[0]}`;
    
    return reply(
      `🚨 *Robbery Failed!*\n\n${robberName} was caught and had to pay $${actualFine} to ${targetName}\n\n${robberName}'s wallet: $${robber.wallet}\n${targetName}'s wallet: $${target.wallet}`,
      null,
      { mentions: [sender, targetId] }
    );
  }
});

// Helper function to create new user
function createUser(userId) {
  return {
    wallet: 100,
    bank: 0,
    bankLimit: 1000,
    job: "unemployed",
    dailyStreak: 0,
    workCount: 0,
    inventory: {}
  };
}

// Auto-save databases periodically
setInterval(() => {
  saveDB(economyDBPath, economyDB);
  saveDB(cooldownsDBPath, cooldownsDB);
}, 60 * 1000); // Save every minute
