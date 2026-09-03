const axios = require('axios');

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const GITHUB_OWNER = "urdushahzaib111-ctrl";
const GITHUB_REPO = "HerryBot-v4";
const GITHUB_PATH = "keys.txt";

async function getGitHubKeys() {
    if (!GITHUB_TOKEN) return { sha: null, content: "" };
    try {
        const url = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${GITHUB_PATH}`;
        const headers = {
            'Authorization': `token ${GITHUB_TOKEN}`,
            'Accept': 'application/vnd.github.v3+json'
        };
        const res = await axios.get(url, { headers });
        const content = Buffer.from(res.data.content, 'base64').toString('utf8');
        return { sha: res.data.sha, content };
    } catch (e) {
        console.error("GitHub Fetch Error:", e.message);
        return { sha: null, content: "" };
    }
}

async function getOrCreateUserKey(userId) {
    const { sha, content } = await getGitHubKeys();
    const now = Date.now();
    const THREE_DAYS = 3 * 24 * 60 * 60 * 1000;

    // Parse existing lines into key objects
    let lines = content.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    
    let activeKey = null;
    let activeKeyObj = null;
    let validLines = [];

    // Filter out expired keys & check if user already has an active key
    for (let line of lines) {
        const parts = line.split('|');
        if (parts.length >= 3) {
            const keyName = parts[0];
            const expiresAt = parseInt(parts[1]);
            const keyUserId = parts[2];
            const deviceId = parts[3] || "UNLOCKED";

            // If key is NOT expired, keep it
            if (expiresAt > now) {
                validLines.push(line);
                if (keyUserId === userId) {
                    activeKey = keyName;
                    activeKeyObj = { key: keyName, expiresAt, deviceId };
                }
            }
        } else {
            // Keep system admin keys or manual keys without pipes
            validLines.push(line);
        }
    }

    // 1. IF ACTIVE KEY EXISTS AND STILL VALID
    if (activeKeyObj) {
        const hoursLeft = Math.ceil((activeKeyObj.expiresAt - now) / (1000 * 60 * 60));
        return {
            isNew: false,
            key: activeKeyObj.key,
            hoursLeft: hoursLeft
        };
    }

    // 2. GENERATE NEW 3-DAY KEY FOR USER
    const randomNum = Math.floor(10000 + Math.random() * 90000);
    const newKeyName = `Herry${randomNum}`;
    const newExpiry = now + THREE_DAYS;
    
    // Format: KEY|EXPIRY|USER_ID|DEVICE_ID
    const newKeyLine = `${newKeyName}|${newExpiry}|${userId}|UNLOCKED`;
    validLines.push(newKeyLine);

    // Save back to GitHub
    if (sha) {
        try {
            const url = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${GITHUB_PATH}`;
            const headers = {
                'Authorization': `token ${GITHUB_TOKEN}`,
                'Accept': 'application/vnd.github.v3+json'
            };
            const updatedContent = validLines.join('\n') + '\n';
            const base64Content = Buffer.from(updatedContent).toString('base64');

            await axios.put(url, {
                message: `Generate 3-Day Key for ${userId}`,
                content: base64Content,
                sha: sha
            }, { headers });
        } catch (e) {
            console.error("GitHub Sync Error:", e.message);
        }
    }

    return {
        isNew: true,
        key: newKeyName,
        hoursLeft: 72
    };
}

module.exports = { getOrCreateUserKey };
