const fs = require('fs');
const path = require('path');
const axios = require('axios');

const KEYS_FILE = path.join(__dirname, 'user_keys.json');

// GitHub Credentials (Railway Variables se automatic fetch hongi)
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const GITHUB_OWNER = "urdushahzaib111-ctrl";
const GITHUB_REPO = "HerryBot-v4";
const GITHUB_PATH = "keys.txt";

function loadKeys() {
    if (!fs.existsSync(KEYS_FILE)) {
        fs.writeFileSync(KEYS_FILE, JSON.stringify({}), 'utf8');
    }
    try {
        return JSON.parse(fs.readFileSync(KEYS_FILE, 'utf8'));
    } catch (e) {
        return {};
    }
}

function saveKeys(data) {
    fs.writeFileSync(KEYS_FILE, JSON.stringify(data, null, 2), 'utf8');
}

// Random Key Format: Herry + Random Numbers (e.g., Herry11296, Herry556, Herry826)
function generateRandomKey() {
    const randomNum = Math.floor(100 + Math.random() * 90000); // 3 to 5 digits random number
    return `Herry${randomNum}`;
}

// GitHub keys.txt update logic
async function appendKeyToGitHub(newKey) {
    if (!GITHUB_TOKEN) {
        console.error("❌ GITHUB_TOKEN process.env me missing hai!");
        return false;
    }

    try {
        const url = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${GITHUB_PATH}`;
        const headers = {
            'Authorization': `token ${GITHUB_TOKEN}`,
            'Accept': 'application/vnd.github.v3+json'
        };

        const getRes = await axios.get(url, { headers });
        const sha = getRes.data.sha;
        const currentContent = Buffer.from(getRes.data.content, 'base64').toString('utf8');

        const updatedContent = currentContent ? `${currentContent.trim()}\n${newKey}` : newKey;
        const base64Content = Buffer.from(updatedContent).toString('base64');

        await axios.put(url, {
            message: `Auto-add key: ${newKey}`,
            content: base64Content,
            sha: sha
        }, { headers });

        console.log(`✅ Key ${newKey} GitHub keys.txt me add ho gayi!`);
        return true;
    } catch (error) {
        console.error("❌ GitHub Key Sync Error:", error.response ? error.response.data : error.message);
        return false;
    }
}

async function getOrCreateUserKey(userId) {
    const db = loadKeys();
    const now = Date.now();
    const THREE_DAYS_MS = 3 * 24 * 60 * 60 * 1000;

    if (db[userId]) {
        const userRecord = db[userId];
        const timePassed = now - userRecord.createdAt;

        if (timePassed < THREE_DAYS_MS) {
            const timeLeftHours = Math.ceil((THREE_DAYS_MS - timePassed) / (1000 * 60 * 60));
            return {
                isNew: false,
                key: userRecord.key,
                hoursLeft: timeLeftHours
            };
        }
    }

    const newKey = generateRandomKey();
    db[userId] = {
        key: newKey,
        createdAt: now
    };

    saveKeys(db);
    await appendKeyToGitHub(newKey);

    return {
        isNew: true,
        key: newKey,
        hoursLeft: 72
    };
}

module.exports = { getOrCreateUserKey };

