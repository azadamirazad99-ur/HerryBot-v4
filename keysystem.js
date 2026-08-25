const fs = require('fs');
const path = require('path');
const axios = require('axios');

const KEYS_FILE = path.join(__dirname, 'user_keys.json');

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const GITHUB_OWNER = "urdushahzaib111-ctrl";
const GITHUB_REPO = "HerryBot-v4";
const GITHUB_PATH = "keys.txt";

function loadKeys() {
    if (!fs.existsSync(KEYS_FILE)) {
        try {
            fs.writeFileSync(KEYS_FILE, JSON.stringify({}, null, 2), 'utf8');
        } catch (err) {
            console.error("Error creating user_keys.json:", err);
        }
    }
    try {
        const data = fs.readFileSync(KEYS_FILE, 'utf8');
        return JSON.parse(data);
    } catch (e) {
        return {};
    }
}

function saveKeys(data) {
    try {
        fs.writeFileSync(KEYS_FILE, JSON.stringify(data, null, 2), 'utf8');
    } catch (err) {
        console.error("Error writing user_keys.json:", err);
    }
}

function generateRandomKey() {
    const randomNum = Math.floor(10000 + Math.random() * 90000);
    return `Herry${randomNum}`;
}

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

        if (currentContent.includes(newKey)) {
            return true;
        }

        const updatedContent = currentContent ? `${currentContent.trim()}\n${newKey}` : newKey;
        const base64Content = Buffer.from(updatedContent).toString('base64');

        await axios.put(url, {
            message: `Auto-add key: ${newKey}`,
            content: base64Content,
            sha: sha
        }, { headers });

        return true;
    } catch (error) {
        console.error("❌ GitHub Key Sync Error:", error.response ? error.response.data : error.message);
        return false;
    }
}

async function getOrCreateUserKey(userId) {
    const db = loadKeys();
    const now = Date.now();
    const THREE_DAYS_MS = 3 * 24 * 60 * 60 * 1000; // 3 Days in milliseconds

    // Check karein kya user ki entry pehle se database me hai ya nahi
    if (db[userId] && db[userId].key && db[userId].createdAt) {
        const userRecord = db[userId];
        const timePassed = now - userRecord.createdAt;

        // Agar 3 din (72 hours) poore nahi hue hain
        if (timePassed < THREE_DAYS_MS) {
            const timeLeftMs = THREE_DAYS_MS - timePassed;
            const timeLeftHours = Math.ceil(timeLeftMs / (1000 * 60 * 60));
            
            // Wahi same purani key return karega (isNew: false)
            return {
                isNew: false,
                key: userRecord.key,
                hoursLeft: timeLeftHours
            };
        }
    }

    // Agar user pehli baar aa raha hai YA uske 3 din khatam ho chuke hain, tabhi nayi key banegi
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

