/*const fs = require('fs');
const path = require('path');
const { cmd } = require('../command');

const GAME_DB_PATH = path.join(__dirname, '../lib/game.json');
const COOLDOWNS = {
    daily: 24 * 60 * 60 * 1000, // 24 hours
    work: 8 * 60 * 60 * 1000, // 8 hours
    rob: 12 * 60 * 60 * 1000, // 12 hours
    crime: 6 * 60 * 60 * 1000 // 6 hours
};

// Initialize game database
const initGameDB = () => {
    if (!fs.existsSync(GAME_DB_PATH)) {
        fs.writeFileSync(GAME_DB_PATH, JSON.stringify({ users: {}, achievements: {} }));
    }
    return JSON.parse(fs.readFileSync(GAME_DB_PATH, 'utf-8'));
};

// Save game state
const saveGameDB = (data) => {
    fs.writeFileSync(GAME_DB_PATH, JSON.stringify(data, null, 2));
};

// Get or create user profile
const getUserProfile = (jid, gameData) => {
    if (!gameData.users[jid]) {
        gameData.users[jid] = {
            coins: 100,
            bank: 0,
            level: 1,
            xp: 0,
            inventory: [],
            lastDaily: 0,
            lastWork: 0,
            lastRob: 0,
            lastCrime: 0,
            crimesCommitted: 0,
            successfulRobs: 0,
            failedRobs: 0,
            jobsWorked: 0,
            achievements: []
        };
    }
    return gameData.users[jid];
};

// Add XP and check for level up
const addXP = (user, amount) => {
    user.xp += amount;
    const xpNeeded = user.level * 100;
    if (user.xp >= xpNeeded) {
        user.level++;
        user.xp = 0;
        return true;
    }
    return false;
};

// Check cooldown
const checkCooldown = (user, type) => {
    const now = Date.now();
    const lastAction = user[`last${type.charAt(0).toUpperCase() + type.slice(1)}`];
    const cooldown = COOLDOWNS[type];
    
    if (now - lastAction < cooldown) {
        const remaining = Math.ceil((cooldown - (now - lastAction)) / (1000 * 60 * 60));
        return { onCooldown: true, hours: remaining };
    }
    return { onCooldown: false };
};

// Achievements system
const checkAchievements = (user, gameData, action) => {
    const newAchievements = [];
    const allAchievements = gameData.achievements;
    
    // Define achievement checks
    const achievementChecks = {
        'first_blood': () => user.crimesCommitted + user.successfulRobs >= 1 && !user.achievements.includes('first_blood'),
        'rich_beginner': () => user.coins + user.bank >= 1000 && !user.achievements.includes('rich_beginner'),
        'hard_worker': () => user.jobsWorked >= 5 && !user.achievements.includes('hard_worker'),
        'crime_lord': () => user.crimesCommitted >= 10 && !user.achievements.includes('crime_lord'),
        'bank_robber': () => user.successfulRobs >= 5 && !user.achievements.includes('bank_robber')
    };
    
    // Check all possible achievements
    for (const [id, check] of Object.entries(achievementChecks)) {
        if (check()) {
            user.achievements.push(id);
            newAchievements.push(id);
            // Add reward
            user.coins += allAchievements[id]?.reward || 100;
        }
    }
    
    return newAchievements;
};

// Game commands
cmd({
    pattern: 'startgame',
    alias: ['registergame'],
    desc: 'Register for the game system',
    category: 'game',
    react: '🎮',
    filename: __filename
}, async (conn, mek, m, { from, sender, reply }) => {
    initGameDB();
    const gameData = initGameDB();
    const user = getUserProfile(sender, gameData);
    saveGameDB(gameData);
    
    reply(`🎮 *Welcome to SubZero Game!*\n\nYou've been registered with:\n💰 *100 coins* starter money\n🏦 *Level 1* account\n\nType *.gamehelp* to see available commands!`);
});

cmd({
    pattern: 'daily',
    alias: ['claim'],
    desc: 'Claim your daily coins',
    category: 'game',
    react: '💰',
    filename: __filename
}, async (conn, mek, m, { from, sender, reply }) => {
    const gameData = initGameDB();
    const user = getUserProfile(sender, gameData);
    
    const cooldown = checkCooldown(user, 'daily');
    if (cooldown.onCooldown) {
        return reply(`⏳ You can claim your next daily reward in *${cooldown.hours} hours*!`);
    }
    
    const amount = 200 + (user.level * 50);
    user.coins += amount;
    user.lastDaily = Date.now();
    
    const leveledUp = addXP(user, 25);
    const newAchievements = checkAchievements(user, gameData, 'daily');
    
    saveGameDB(gameData);
    
    let response = `💰 *Daily Reward Claimed!*\n\nYou received: *${amount} coins*`;
    if (leveledUp) response += `\n\n🎉 *Level Up!* You're now level *${user.level}*`;
    if (newAchievements.length) {
        response += `\n\n🏆 *Achievement Unlocked!* ${newAchievements.map(a => `\n- ${a}`).join('')}`;
    }
    
    reply(response);
});

cmd({
    pattern: 'work',
    alias: ['job'],
    desc: 'Work to earn coins',
    category: 'game',
    react: '💼',
    filename: __filename
}, async (conn, mek, m, { from, sender, reply }) => {
    const gameData = initGameDB();
    const user = getUserProfile(sender, gameData);
    
    const cooldown = checkCooldown(user, 'work');
    if (cooldown.onCooldown) {
        return reply(`⏳ You can work again in *${cooldown.hours} hours*!`);
    }
    
    const jobs = [
        { name: "as a SubZero developer", min: 100, max: 300 },
        { name: "as a waiter", min: 50, max: 150 },
        { name: "as a hacker", min: 200, max: 500 },
        { name: "as a delivery driver", min: 75, max: 200 }
    ];
    const job = jobs[Math.floor(Math.random() * jobs.length)];
    const amount = Math.floor(Math.random() * (job.max - job.min + 1)) + job.min;
    
    user.coins += amount;
    user.lastWork = Date.now();
    user.jobsWorked++;
    
    const leveledUp = addXP(user, 15);
    const newAchievements = checkAchievements(user, gameData, 'work');
    
    saveGameDB(gameData);
    
    let response = `💼 *You worked ${job.name}*\n\nEarned: *${amount} coins*`;
    if (leveledUp) response += `\n\n🎉 *Level Up!* You're now level *${user.level}*`;
    if (newAchievements.length) {
        response += `\n\n🏆 *Achievement Unlocked!* ${newAchievements.map(a => `\n- ${a}`).join('')}`;
    }
    
    reply(response);
});

cmd({
    pattern: 'rob',
    alias: ['steal'],
    desc: 'Rob another player',
    category: 'game',
    react: '🦹',
    filename: __filename
}, async (conn, mek, m, { from, sender, reply, participants }) => {
    const gameData = initGameDB();
    const robber = getUserProfile(sender, gameData);
    
    const cooldown = checkCooldown(robber, 'rob');
    if (cooldown.onCooldown) {
        return reply(`⏳ You can attempt another robbery in *${cooldown.hours} hours*!`);
    }
    
    // Get target (mentioned or replied)
    let targetJid = m.mentionedJid?.[0] || (m.quoted?.sender ?? null);
    if (!targetJid) return reply('❌ Please mention or reply to the user you want to rob!');
    if (targetJid === sender) return reply("❌ You can't rob yourself!");
    
    const target = getUserProfile(targetJid, gameData);
    if (target.coins < 50) return reply("❌ This user doesn't have enough coins to rob (minimum 50 required)");
    
    // Robbery logic
    const successChance = Math.min(0.7, 0.3 + (robber.level * 0.02));
    const isSuccess = Math.random() < successChance;
    
    if (isSuccess) {
        const maxRobAmount = Math.min(target.coins, Math.floor(target.coins * 0.5));
        const robbedAmount = Math.floor(Math.random() * maxRobAmount) + 1;
        
        robber.coins += robbedAmount;
        target.coins -= robbedAmount;
        robber.successfulRobs++;
        
        const leveledUp = addXP(robber, 30);
        const newAchievements = checkAchievements(robber, gameData, 'rob');
        
        robber.lastRob = Date.now();
        saveGameDB(gameData);
        
        let response = `🦹 *Successful Robbery!*\n\nYou stole *${robbedAmount} coins* from @${targetJid.split('@')[0]}`;
        if (leveledUp) response += `\n\n🎉 *Level Up!* You're now level *${robber.level}*`;
        if (newAchievements.length) {
            response += `\n\n🏆 *Achievement Unlocked!* ${newAchievements.map(a => `\n- ${a}`).join('')}`;
        }
        
        await conn.sendMessage(from, { 
            text: response,
            mentions: [targetJid]
        }, { quoted: mek });
    } else {
        const fine = Math.floor(Math.random() * 100) + 50;
        robber.coins = Math.max(0, robber.coins - fine);
        robber.failedRobs++;
        robber.lastRob = Date.now();
        
        saveGameDB(gameData);
        
        reply(`🚨 *Robbery Failed!*\n\nYou were caught and fined *${fine} coins*!\nBetter luck next time!`);
    }
});

cmd({
    pattern: 'crime',
    alias: ['commitcrime'],
    desc: 'Commit a crime for quick cash (risky!)',
    category: 'game',
    react: '👮',
    filename: __filename
}, async (conn, mek, m, { from, sender, reply }) => {
    const gameData = initGameDB();
    const user = getUserProfile(sender, gameData);
    
    const cooldown = checkCooldown(user, 'crime');
    if (cooldown.onCooldown) {
        return reply(`⏳ You can commit another crime in *${cooldown.hours} hours*!`);
    }
    
    const crimes = [
        { name: "hacked a bank", successRate: 0.3, rewardMin: 300, rewardMax: 1000, failPenalty: 200 },
        { name: "stole a car", successRate: 0.5, rewardMin: 150, rewardMax: 400, failPenalty: 100 },
        { name: "sold illegal items", successRate: 0.7, rewardMin: 80, rewardMax: 250, failPenalty: 50 }
    ];
    const crime = crimes[Math.floor(Math.random() * crimes.length)];
    
    const isSuccess = Math.random() < crime.successRate;
    user.lastCrime = Date.now();
    
    if (isSuccess) {
        const reward = Math.floor(Math.random() * (crime.rewardMax - crime.rewardMin + 1)) + crime.rewardMin;
        user.coins += reward;
        user.crimesCommitted++;
        
        const leveledUp = addXP(user, 20);
        const newAchievements = checkAchievements(user, gameData, 'crime');
        
        saveGameDB(gameData);
        
        let response = `🦹 *Crime Successful!*\n\nYou ${crime.name} and earned *${reward} coins*`;
        if (leveledUp) response += `\n\n🎉 *Level Up!* You're now level *${user.level}*`;
        if (newAchievements.length) {
            response += `\n\n🏆 *Achievement Unlocked!* ${newAchievements.map(a => `\n- ${a}`).join('')}`;
        }
        
        reply(response);
    } else {
        const penalty = crime.failPenalty;
        user.coins = Math.max(0, user.coins - penalty);
        
        saveGameDB(gameData);
        
        reply(`🚨 *Crime Failed!*\n\nYou got caught trying to ${crime.name} and were fined *${penalty} coins*!`);
    }
});

cmd({
    pattern: 'profile',
    alias: ['stats', 'me'],
    desc: 'Check your game profile',
    category: 'game',
    react: '📊',
    filename: __filename
}, async (conn, mek, m, { from, sender, reply }) => {
    const gameData = initGameDB();
    const user = getUserProfile(sender, gameData);
    
    const nextLevelXP = user.level * 100;
    const progress = Math.floor((user.xp / nextLevelXP) * 100);
    
    const profile = `
📊 *Game Profile* - Level ${user.level}

💰 *Wallet:* ${user.coins} coins
🏦 *Bank:* ${user.bank} coins
📈 *XP:* ${user.xp}/${nextLevelXP} (${progress}%)

🏆 *Achievements:* ${user.achievements.length} unlocked
🦹 *Crimes Committed:* ${user.crimesCommitted}
💼 *Jobs Worked:* ${user.jobsWorked}
🦹 *Successful Robberies:* ${user.successfulRobs}

Use *.gamehelp* to see all commands!
    `;
    
    reply(profile);
});

cmd({
    pattern: 'gamehelp',
    alias: ['helpgame'],
    desc: 'Show game commands',
    category: 'game',
    react: '❓',
    filename: __filename
}, async (conn, mek, m, { from, sender, reply }) => {
    const helpMessage = `
🎮 *SubZero Game Commands*

💰 *Economy:*
- .daily - Claim daily coins
- .work - Work to earn money
- .rob @user - Rob another player
- .crime - Commit a crime (risky!)
- .deposit <amount> - Deposit coins to bank
- .withdraw <amount> - Withdraw coins from bank

📊 *Info:*
- .profile - View your stats
- .leaderboard - Top players
- .achievements - View achievements

🎲 *Fun:*
- .slots <bet> - Play slots
- .coinflip <bet> - Heads or tails
- .blackjack <bet> - Play blackjack

Type the command to use it!
    `;
    
    reply(helpMessage);
});

// Initialize game database on startup
initGameDB();
*/
