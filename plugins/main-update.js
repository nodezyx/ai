const { cmd } = require("../command");
const axios = require('axios');
const fs = require('fs');
const path = require("path");
const AdmZip = require("adm-zip");
const config = require('../config');
const sqlite3 = require('sqlite3').verbose();
const { promisify } = require('util');

// Database setup
const dbPath = path.join(__dirname, '../lib/update.db');
const db = new sqlite3.Database(dbPath);

// Promisify db methods
const dbRun = promisify(db.run.bind(db));
const dbGet = promisify(db.get.bind(db));
const dbAll = promisify(db.all.bind(db));

// Initialize database
(async function() {
  try {
    await dbRun(`CREATE TABLE IF NOT EXISTS updates (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      version TEXT UNIQUE,
      update_date DATETIME DEFAULT CURRENT_TIMESTAMP,
      changes TEXT
    )`);
  } catch (e) {
    console.error('Database initialization error:', e);
  }
})();

// Improved version checking
async function getVersionInfo() {
  try {
    // Get local version from package.json or git
    let localVersion = "unknown";
    
    // Try package.json first
    try {
      const pkg = require('../package.json');
      localVersion = pkg.version;
    } catch {}
    
    // Fallback to git
    if (localVersion === "unknown" && fs.existsSync(path.join(__dirname, '../.git'))) {
      try {
        const head = fs.readFileSync(path.join(__dirname, '../.git/HEAD'), 'utf8').trim();
        if (head.startsWith('ref: ')) {
          const ref = head.substring(5);
          if (fs.existsSync(path.join(__dirname, `../.git/${ref}`))) {
            localVersion = fs.readFileSync(path.join(__dirname, `../.git/${ref}`), 'utf8').trim().substring(0, 7);
          }
        } else {
          localVersion = head.substring(0, 7);
        }
      } catch {}
    }
    
    // Fallback to database
    if (localVersion === "unknown") {
      const lastUpdate = await dbGet("SELECT version FROM updates ORDER BY update_date DESC LIMIT 1");
      localVersion = lastUpdate?.version || "unknown";
    }
    
    return localVersion;
  } catch (e) {
    console.error('Version check error:', e);
    return "unknown";
  }
}

cmd({  
  pattern: "update",  
  alias: ["upgrade", "sync"],  
  react: '🚀',  
  desc: "Update the bot to the latest version",  
  category: "system",  
  filename: __filename
}, async (client, message, args, { from, reply, sender, isOwner }) => {  
  if (!isOwner) return reply("❌ Owner only command!");
  
  try {
    const repoUrl = config.REPO || "https://github.com/mrfrankofcc/SUBZERO-MD";
    const repoApiUrl = repoUrl.replace('github.com', 'api.github.com/repos');
    
    // Get current local version
    const localVersion = await getVersionInfo();
    await reply(`🔍 Current version: ${localVersion}`);
    
    // Get latest release info
    await reply("Checking for updates...");
    let latestVersion;
    let changes = "Manual update";
    
    try {
      // Try releases first
      const releaseResponse = await axios.get(`${repoApiUrl}/releases/latest`, { timeout: 10000 });
      latestVersion = releaseResponse.data.tag_name;
      changes = releaseResponse.data.body || "No changelog provided";
      
      // If versions match, return immediately
      if (latestVersion === localVersion) {
        return reply(`✅ Already on latest release version: ${localVersion}`);
      }
    } catch (releaseError) {
      console.log('No releases found, checking main branch');
      
      // Fallback to main branch commit
      const commitResponse = await axios.get(`${repoApiUrl}/commits/main`, { timeout: 10000 });
      latestVersion = commitResponse.data.sha.substring(0, 7);
      changes = commitResponse.data.commit.message || "Main branch update";
      
      // If commit hashes match
      if (latestVersion === localVersion) {
        return reply(`✅ Already on latest commit: ${localVersion}`);
      }
    }
    
    // Confirm update
    await reply(`📥 New version available: ${latestVersion}\n\nChanges:\n${changes}\n\nUpdating...`);
    
    // Download the ZIP
    const { data } = await axios.get(`${repoUrl}/archive/main.zip`, {
      responseType: "arraybuffer",
      timeout: 30000
    });

    // Process ZIP
    const zip = new AdmZip(data);
    const zipEntries = zip.getEntries();
    const protectedFiles = ["config.js", "app.json", "data", "lib/update.db", "package-lock.json"];
    const basePath = `${repoUrl.split('/').pop()}-main/`;
    
    await reply("🔄 Applying updates...");
    
    for (const entry of zipEntries) {
      if (entry.isDirectory) continue;
      
      const relativePath = entry.entryName.replace(basePath, '');
      const destPath = path.join(__dirname, '..', relativePath);
      
      if (protectedFiles.some(f => destPath.includes(f))) continue;
      
      const dir = path.dirname(destPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      
      zip.extractEntryTo(entry, dir, false, true, entry.name);
    }

    // Record update
    try {
      await dbRun(
        "INSERT OR IGNORE INTO updates (version, changes) VALUES (?, ?)",
        [latestVersion, changes]
      );
    } catch (dbError) {
      console.error('Database update error:', dbError);
    }

    await reply(`✅ Update to ${latestVersion} complete!\n\nRestarting...`);
    setTimeout(() => process.exit(0), 2000);

  } catch (error) {
    console.error("Update error:", error);
    reply(`❌ Update failed: ${error.message}\n\nPlease update manually from:\n${config.REPO || "https://github.com/mrfraank/SUBZERO"}`);
  }
});

/*const { cmd } = require("../command");
const axios = require('axios');
const fs = require('fs');
const path = require("path");
const AdmZip = require("adm-zip");
const config = require('../config');
const sqlite3 = require('sqlite3').verbose();
const { promisify } = require('util');

// Database setup
const dbPath = path.join(__dirname, '../lib/update.db');
const db = new sqlite3.Database(dbPath);

// Promisify db methods
const dbRun = promisify(db.run.bind(db));
const dbGet = promisify(db.get.bind(db));
const dbAll = promisify(db.all.bind(db));

// Initialize database
(async function() {
  try {
    await dbRun(`CREATE TABLE IF NOT EXISTS updates (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      version TEXT,
      update_date DATETIME DEFAULT CURRENT_TIMESTAMP,
      changes TEXT
    )`);
  } catch (e) {
    console.error('Database initialization error:', e);
  }
})();

// Function to get current commit hash (local version)
async function getLocalVersion() {
  try {
    // Try to get from git (if available)
    if (fs.existsSync(path.join(__dirname, '../.git/HEAD'))) {
      const head = fs.readFileSync(path.join(__dirname, '../.git/HEAD'), 'utf8').trim();
      if (head.startsWith('ref: ')) {
        const ref = head.substring(5);
        if (fs.existsSync(path.join(__dirname, `../.git/${ref}`))) {
          return fs.readFileSync(path.join(__dirname, `../.git/${ref}`), 'utf8').trim();
        }
      }
      return head;
    }
    // Fallback to database record
    const lastUpdate = await dbGet("SELECT version FROM updates ORDER BY update_date DESC LIMIT 1");
    return lastUpdate?.version || "unknown";
  } catch (e) {
    console.error('Failed to get local version:', e);
    return "unknown";
  }
}

cmd({  
  pattern: "update",  
  alias: ["upgrade", "sync"],  
  react: '🚀',  
  desc: "Update the bot to the latest version",  
  category: "system",  
  filename: __filename
}, async (client, message, args, { from, reply, sender, isOwner }) => {  
  if (!isOwner) return reply("❌ Owner only command!");
  
  try {
    const repoUrl = config.REPO || "https://github.com/mrfraank/SUBZERO";
    const repoApiUrl = repoUrl.replace('github.com', 'api.github.com/repos');
    
    // Get current local version
    const localVersion = await getLocalVersion();
    await reply(`🔍 Current version: ${localVersion}`);
    
    // Get latest release info
    await reply("```Checking for updates...```");
    const latestRelease = await axios.get(`${repoApiUrl}/releases/latest`, {
      timeout: 10000
    }).catch(() => null);
    
    // Get latest commit from main branch if no release found
    let latestVersion = latestRelease?.data?.tag_name;
    if (!latestVersion) {
      const mainBranch = await axios.get(`${repoApiUrl}/commits/main`, {
        timeout: 10000
      }).catch(() => null);
      latestVersion = mainBranch?.data?.sha;
    }
    
    if (!latestVersion) {
      return reply("❌ Could not fetch latest version information");
    }
    
    // Compare versions
    if (localVersion === latestVersion) {
      return reply(`✅ You already have the latest version (${localVersion})`);
    }
    
    await reply(`📥 New version available: ${latestVersion}\nDownloading updates...`);
    
    // Download the ZIP
    const { data } = await axios.get(`${repoUrl}/archive/main.zip`, {
      responseType: "arraybuffer",
      timeout: 30000
    });

    // Process ZIP
    const zip = new AdmZip(data);
    const zipEntries = zip.getEntries();
    const protectedFiles = ["config.js", "app.json", "data", "lib/update.db"];
    const basePath = `${repoUrl.split('/').pop()}-main/`;
    
    await reply("🔄 Applying updates...");
    
    for (const entry of zipEntries) {
      if (entry.isDirectory) continue;
      
      const relativePath = entry.entryName.replace(basePath, '');
      const destPath = path.join(__dirname, '..', relativePath);
      
      if (protectedFiles.some(f => destPath.includes(f))) continue;
      
      const dir = path.dirname(destPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      
      zip.extractEntryTo(entry, dir, false, true, entry.name);
    }

    // Record update
    const changes = latestRelease?.data?.body || "Main branch update";
    await dbRun(
      "INSERT INTO updates (version, changes) VALUES (?, ?)",
      [latestVersion, changes]
    );

    await reply(`✅ Update to ${latestVersion} complete!\n\nChanges:\n${changes}\n\nRestarting...`);
    setTimeout(() => process.exit(0), 2000);

  } catch (error) {
    console.error("Update error:", error);
    reply(`❌ Update failed: ${error.message}\n\nPlease update manually from:\n${config.REPO || "https://github.com/mrfraank/SUBZERO"}`);
  }
});
*/
/*
const { cmd } = require("../command");
const axios = require('axios');
const fs = require('fs');
const path = require("path");
const AdmZip = require("adm-zip");
const { setCommitHash, getCommitHash } = require('../lib/updateDB');

cmd({
    pattern: "update",
    alias: ["upgrade", "sync"],
    react: '🆕',
    desc: "Update the bot to the latest version.",
    category: "misc",
    filename: __filename
}, async (client, message, args, { reply, isOwner }) => {
    if (!isOwner) return reply("This command is only for the bot owner.");

    try {
        await reply("🔍 Checking for SUBZERO-MD updates...");

        // Fetch the latest commit hash from GitHub
        const { data: commitData } = await axios.get("https://api.github.com/repos/mrfrankofcc/SUBZERO-MD/commits/main");
        const latestCommitHash = commitData.sha;

        // Get the stored commit hash from the database
        const currentHash = await getCommitHash();

        if (latestCommitHash === currentHash) {
            return reply("✅ Your SUBZERO-MD bot is already up-to-date!");
        }

        await reply("🚀 Updating SUBZERO-MD Bot...");

        // Download the latest code
        const zipPath = path.join(__dirname, "latest.zip");
        const { data: zipData } = await axios.get("https://github.com/mrfrankofcc/SUBZERO-MD/archive/main.zip", { responseType: "arraybuffer" });
        fs.writeFileSync(zipPath, zipData);

        // Extract ZIP file
        await reply("📦 Extracting the latest code...");
        const extractPath = path.join(__dirname, 'latest');
        const zip = new AdmZip(zipPath);
        zip.extractAllTo(extractPath, true);

        // Copy updated files, preserving config.js and app.json
        await reply("🔄 Replacing files...");
        const sourcePath = path.join(extractPath, "SUBZERO-MD-main");
        const destinationPath = path.join(__dirname, '..');
        copyFolderSync(sourcePath, destinationPath);

        // Save the latest commit hash to the database
        await setCommitHash(latestCommitHash);

        // Cleanup
        fs.unlinkSync(zipPath);
        fs.rmSync(extractPath, { recursive: true, force: true });

        await reply("✅ Update complete! Restarting the bot...");
        process.exit(0);
    } catch (error) {
        console.error("Update error:", error);
        return reply("❌ Update failed. Please try manually.");
    }
});

// Helper function to copy directories while preserving config.js and app.json
function copyFolderSync(source, target) {
    if (!fs.existsSync(target)) {
        fs.mkdirSync(target, { recursive: true });
    }

    const items = fs.readdirSync(source);
    for (const item of items) {
        const srcPath = path.join(source, item);
        const destPath = path.join(target, item);

        // Skip config.js and app.json
        if (item === "config.js" || item === "app.json") {
            console.log(`Skipping ${item} to preserve custom settings.`);
            continue;
        }

        if (fs.lstatSync(srcPath).isDirectory()) {
            copyFolderSync(srcPath, destPath);
        } else {
            fs.copyFileSync(srcPath, destPath);
        }
    }
}
*/



/*
const { cmd } = require("../command");
const axios = require('axios');
const fs = require('fs');
const path = require("path");
const AdmZip = require("adm-zip");
const config = require('../config');

cmd({  
  pattern: "update",  
  alias: ["upgrade", "sync"],  
  react: '🚀',  
  desc: "Update the bot to the latest version",  
  category: "system",  
  filename: __filename
}, async (client, message, args, { from, reply, sender, isOwner }) => {  
  if (!isOwner) return reply("❌ Owner only command!");
  
  try {
    const repoUrl = config.REPO || "https://github.com/mrfraank/SUBZERO";
    const repoName = repoUrl.split('/').pop();
    
    await reply("```📥 Downloading updates directly...```");
    
    // 1. Download the ZIP directly to memory
    const { data } = await axios.get(`${repoUrl}/archive/main.zip`, {
      responseType: "arraybuffer",
      timeout: 30000
    });

    // 2. Process ZIP directly in memory
    const zip = new AdmZip(data);
    const zipEntries = zip.getEntries();
    
    // 3. Find and process files directly from ZIP
    const protectedFiles = ["config.js", "app.json", "data"];
    const basePath = `${repoName}-main/`;
    
    await reply("```🔄 Applying updates...```");
    
    for (const entry of zipEntries) {
      if (entry.isDirectory) continue;
      
      const relativePath = entry.entryName.replace(basePath, '');
      const destPath = path.join(__dirname, '..', relativePath);
      
      // Skip protected files
      if (protectedFiles.some(f => destPath.includes(f))) continue;
      
      // Ensure directory exists
      const dir = path.dirname(destPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      
      // Write file directly from ZIP
      zip.extractEntryTo(entry, dir, false, true, entry.name);
    }

    await reply("```✅ Update complete! Restarting...```");
    setTimeout(() => process.exit(0), 2000);

  } catch (error) {
    console.error("Update error:", error);
    reply(`❌ Update failed: ${error.message}\n\nPlease update manually from:\n${config.REPO || "https://github.com/mrfraank/SUBZERO"}`);
  }
});
*/

