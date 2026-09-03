const axios = require('axios');

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const GITHUB_OWNER = "urdushahzaib111-ctrl";
const GITHUB_REPO = "HerryBot-v4";
const GITHUB_PATH = "keys.txt";

async function getGitHubKeys() {
    if (!GITHUB_TOKEN) {
        console.error("❌ ERROR: GITHUB_TOKEN is missing in environment variables!");
        return { sha: null, content: "" };
    }
    try {
        const url = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${GITHUB_PATH}`;
        const headers = {
            'Authorization': `Bearer ${GITHUB_TOKEN}`,
            'Accept': 'application/vnd.github.v3+json',
            'User-Agent': 'HerryBot-v4'
        };
        const res = await axios.get(url, { headers });
        const content = Buffer.from(res.data.content, 'base64').toString('utf8');
        return { sha: res.data.sha, content };
    } catch (e) {
        console.error("❌ GitHub Fetch Error:", e.response ? e.response.data : e.message);
        return { sha: null, content: "" };
    }
}

async function getOrCreateUserKey(userId) {
    const { sha, content } = await getGitHubKeys();
    
    if (!GITHUB_TOKEN || !sha) {
        return { error: "GITHUB_TOKEN_MISSING" };
    }

    const now = Date.now();
    const THREE_DAYS = 3 * 24 * 60 * 60 * 1000;

    let lines = content.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    let activeKeyObj = null;
    let validLines = [];

    for (let line of lines) {
        const parts = line.split('|');
        if (parts.length >= 3) {
            const keyName = parts[0];
            const expiresAt = parseInt(parts[1]);
            const keyUserId = parts[2];
            const deviceId = parts[3] || "UNLOCKED";

            if (expiresAt > now) {
                validLines.push(line);
                if (keyUserId === userId) {
                    activeKeyObj = { key: keyName, expiresAt, deviceId };
                }
            }
        } else {
            validLines.push(line);
        }
    }

    // Return existing valid key
    if (activeKeyObj) {
        const hoursLeft = Math.ceil((activeKeyObj.expiresAt - now) / (1000 * 60 * 60));
        return {
            isNew: false,
            key: activeKeyObj.key,
            hoursLeft: hoursLeft
        };
    }

    // Generate new key
    const randomNum = Math.floor(10000 + Math.random() * 90000);
    const newKeyName = `Herry${randomNum}`;
    const newExpiry = now + THREE_DAYS;
    const newKeyLine = `${newKeyName}|${newExpiry}|${userId}|UNLOCKED`;
    
    validLines.push(newKeyLine);

    try {
        const url = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${GITHUB_PATH}`;
        const headers = {
            'Authorization': `Bearer ${GITHUB_TOKEN}`,
            'Accept': 'application/vnd.github.v3+json',
            'User-Agent': 'HerryBot-v4'
        };
        const updatedContent = validLines.join('\n') + '\n';
        const base64Content = Buffer.from(updatedContent).toString('base64');

        await axios.put(url, {
            message: `Generate 3-Day Key for ${userId}`,
            content: base64Content,
            sha: sha
        }, { headers });

        return {
            isNew: true,
            key: newKeyName,
            hoursLeft: 72
        };
    } catch (e) {
        console.error("❌ GitHub Save Error:", e.response ? e.response.data : e.message);
        return { error: "GITHUB_WRITE_FAILED" };
    }
}

module.exports = { getOrCreateUserKey };
