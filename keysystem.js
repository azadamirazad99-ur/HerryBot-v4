
const fs = require('fs');
const path = require('path');
const axios = require('axios');

const KEYS_FILE = path.join(__dirname, 'user_keys.json');

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const GITHUB_OWNER = "urdushahzaib111-ctrl";
const GITHUB_REPO = "HerryBot-v4";
const GITHUB_PATH = "keys.txt";

function loadKeys() {
    if (!fs.existsSync(KEYS_FILE)) return {};
    try {
        return JSON.parse(fs.readFileSync(KEYS_FILE, 'utf8'));
    } catch (e) {
        return {};
    }
}

function saveKeys(data) {
    try {
        fs.writeFileSync(KEYS_FILE, JSON.stringify(data, null, 2), 'utf8');
    } catch (err) {}
}

async function appendKeyToGitHub(newKey) {
    if (!GITHUB_TOKEN) return false;

    try {
        const url = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${GITHUB_PATH}`;
        const headers = {
            'Authorization': `token ${GITHUB_TOKEN}`,
            'Accept': 'application/vnd.github.v3+json'
        };

        const getRes = await axios.get(url, { headers });
        const sha = getRes.data.sha;
        const currentContent = Buffer.from(getRes.data.content, 'base64').toString('utf8');

        // Clean content & check if already exists
        const lines = currentContent.split('\n').map(l => l.trim()).filter(l => l.length > 0);
        
        if (lines.some(l => l.toLowerCase() === newKey.toLowerCase())) {
            return true;
        }

        lines.push(newKey.trim());
        const updatedContent = lines.join('\n') + '\n';
        const base64Content = Buffer.from(updatedContent).toString('base64');

        await axios.put(url, {
            message: `Auto Add Key: ${newKey}`,
            content: base64Content,
            sha: sha
        }, { headers });

        return true;
    } catch (error) {
        console.error("GitHub Sync Error:", error.message);
        return false;
    }
}

async function getOrCreateUserKey(userId) {
    const db = loadKeys();
    const now = Date.now();
    const THREE_DAYS_MS = 3 * 24 * 60 * 60 * 1000;

    if (db[userId] && db[userId].key && db[userId].createdAt) {
        const timePassed = now - db[userId].createdAt;
        if (timePassed < THREE_DAYS_MS) {
            const timeLeftHours = Math.ceil((THREE_DAYS_MS - timePassed) / (1000 * 60 * 60));
            return {
                isNew: false,
                key: db[userId].key,
                hoursLeft: timeLeftHours
            };
        }
    }

    const newKey = `Herry${Math.floor(10000 + Math.random() * 90000)}`;
    db[userId] = { key: newKey, createdAt: now };

    saveKeys(db);
    await appendKeyToGitHub(newKey);

    return { isNew: true, key: newKey, hoursLeft: 72 };
}

module.exports = { getOrCreateUserKey };
