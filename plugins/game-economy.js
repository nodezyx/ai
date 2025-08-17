const fs = require("fs");
const path = require("path");
const { cmd } = require('../command');
const config = require('../config');
const prefix = config.PREFIX;

// Database paths with proper directory structure
const economyDBPath = path.join(__dirname, '../lib/economy-database.json');
const cooldownsDBPath = path.join(__dirname, '../lib/economy-cooldowns.json');
const shopDBPath = path.join(__dirname, '../lib/economy-shop.json');

// Ensure lib directory exists
if (!fs.existsSync(path.dirname(economyDBPath))) {
    fs.mkdirSync(path.dirname(economyDBPath), { recursive: true });
}

// Robust database loading with error handling
function loadDB(path) {
    try {
        if (!fs.existsSync(path)) {
            // Create empty file if it doesn't exist
            fs.writeFileSync(path, '{}');
            return {};
        }
        
        const data = fs.readFileSync(path, "utf-8");
        if (!data.trim()) return {}; // Handle empty files
        
        return JSON.parse(data);
    } catch (error) {
        console.error(`Error loading database from ${path}:`, error);
        return {}; // Return empty object if parsing fails
    }
}

function saveDB(path, db) {
    try {
        fs.writeFileSync(path, JSON.stringify(db, null, 2));
    } catch (error) {
        console.error(`Error saving database to ${path}:`, error);
    }
}

// Initialize databases with proper error handling
let economyDB, cooldownsDB, shopDB;

try {
    economyDB = loadDB(economyDBPath);
    cooldownsDB = loadDB(cooldownsDBPath);
    shopDB = loadDB(shopDBPath);
} catch (error) {
    console.error("Failed to initialize databases:", error);
    // Initialize empty databases if loading fails
    economyDB = {};
    cooldownsDB = {};
    shopDB = { items: {} };
}

// Default shop items if empty
if (!shopDB.items || Object.keys(shopDB.items).length === 0) {
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

// Helper function to create new user with default values
function createUser(userId) {
    return {
        wallet: 100,
        bank: 0,
        bankLimit: 1000,
        job: "unemployed",
        dailyStreak: 0,
        workCount: 0,
        inventory: {},
        lastDaily: null,
        lastWork: null,
        lastRob: null
    };
}

// Economy commands
cmd({
    pattern: "balance",
    alias: ["bal"],
    desc: "Check your economy balance",
    category: "economy",
    filename: __filename
}, async (conn, mek, m, { from, sender, reply }) => {
    try {
        const userId = sender;
        const userData = economyDB[userId] || createUser(userId);
        
        await reply(`💰 *Balance*\n\n👛 Wallet: $${userData.wallet}\n🏦 Bank: $${userData.bank}/${userData.bankLimit}\n\n💳 Net worth: $${userData.wallet + userData.bank}`);
    } catch (error) {
        console.error("Error in balance command:", error);
        reply("⚠️ An error occurred while checking your balance.");
    }
});

cmd({
    pattern: "daily",
    desc: "Claim your daily reward",
    category: "economy",
    filename: __filename
}, async (conn, mek, m, { from, sender, reply, pushname }) => {
    try {
        const userId = sender;
        const now = Date.now();
        
        // Initialize user if doesn't exist
        if (!economyDB[userId]) economyDB[userId] = createUser(userId);
        
        const user = economyDB[userId];
        
        // Check if user has claimed today
        if (user.lastDaily && isSameDay(new Date(user.lastDaily), new Date(now))) {
            const nextDaily = new Date(user.lastDaily);
            nextDaily.setDate(nextDaily.getDate() + 1);
            return reply(`⌛ You've already claimed your daily reward today!\nNext claim available at: ${nextDaily.toLocaleString()}`);
        }
        
        // Calculate daily reward (base + streak bonus)
        const streak = user.dailyStreak || 0;
        const baseReward = 100;
        const streakBonus = Math.min(streak * 10, 100); // Max 100 bonus
        const totalReward = baseReward + streakBonus;
        
        // Update user data
        user.wallet += totalReward;
        user.dailyStreak = (isSameDay(new Date(user.lastDaily || 0), new Date(now - 86400000))) ? streak + 1 : 1;
        user.lastDaily = now;
        
        saveDB(economyDBPath, economyDB);
        
        await reply(`🎉 *Daily Reward Claimed!*\n\n💰 Received: $${totalReward}\n📈 Streak: ${user.dailyStreak} days\n💵 Base: $${baseReward}\n✨ Bonus: $${streakBonus}\n\n👛 New balance: $${user.wallet}`);
    } catch (error) {
        console.error("Error in daily command:", error);
        reply("⚠️ An error occurred while claiming your daily reward.");
    }
});

// Helper function to check if two dates are the same day
function isSameDay(date1, date2) {
    return date1.getFullYear() === date2.getFullYear() &&
           date1.getMonth() === date2.getMonth() &&
           date1.getDate() === date2.getDate();
}

cmd({
    pattern: "work",
    desc: "Work to earn money (2h cooldown)",
    category: "economy",
    filename: __filename
}, async (conn, mek, m, { from, sender, reply, pushname }) => {
    try {
        const userId = sender;
        const now = Date.now();
        
        // Initialize user if doesn't exist
        if (!economyDB[userId]) economyDB[userId] = createUser(userId);
        
        const user = economyDB[userId];
        
        // Check cooldown
        if (user.lastWork && now - user.lastWork < 2 * 60 * 60 * 1000) {
            const nextWork = new Date(user.lastWork + 2 * 60 * 60 * 1000);
            return reply(`⌛ You need to rest! You can work again at: ${nextWork.toLocaleTimeString()}`);
        }
        
        // Get user's job and calculate earnings
        const userJob = user.job || "unemployed";
        const jobs = {
            unemployed: { min: 10, max: 30, name: "Odd Jobs" },
            clerk: { min: 30, max: 60, name: "Office Clerk", requirement: 5 },
            programmer: { min: 80, max: 150, name: "Programmer", requirement: 15 },
            doctor: { min: 120, max: 250, name: "Doctor", requirement: 30 },
            ceo: { min: 300, max: 600, name: "CEO", requirement: 50 }
        };
        
        const earnings = Math.floor(Math.random() * (jobs[userJob].max - jobs[userJob].min + 1)) + jobs[userJob].min;
        
        // Update user data
        user.wallet += earnings;
        user.workCount = (user.workCount || 0) + 1;
        user.lastWork = now;
        
        // Check for job promotion
        for (const [job, details] of Object.entries(jobs)) {
            if (details.requirement && user.workCount >= details.requirement && 
                (!user.job || jobs[user.job].max < details.max)) {
                user.job = job;
                earnings += Math.floor(earnings * 0.2); // 20% bonus for new job
                break;
            }
        }
        
        saveDB(economyDBPath, economyDB);
        
        await reply(`💼 *Work Complete!*\n\n🏢 Job: ${jobs[userJob].name}\n💰 Earned: $${earnings}\n\n👛 New balance: $${user.wallet}`);
    } catch (error) {
        console.error("Error in work command:", error);
        reply("⚠️ An error occurred while working.");
    }
});

// [Rest of your commands (deposit, withdraw, shop, buy, inventory, give, rob) would follow the same pattern...]

// Auto-save databases periodically
setInterval(() => {
    saveDB(economyDBPath, economyDB);
    saveDB(cooldownsDBPath, cooldownsDB);
    saveDB(shopDBPath, shopDB);
}, 5 * 60 * 1000); // Save every 5 minutes

// Initialize databases on startup
saveDB(economyDBPath, economyDB);
saveDB(cooldownsDBPath, cooldownsDB);
saveDB(shopDBPath, shopDB);

console.log('Economy plugin initialized successfully');
