const fs = require('fs');
const path = require('path');

const KEYS_FILE = path.join(__dirname, 'user_keys.json');

function loadKeys() {
    if (!fs.existsSync(KEYS_FILE)) {
        fs.writeFileSync(KEYS_FILE, JSON.stringify({}), 'utf8');
    }
    try {
        const data = fs.readFileSync(KEYS_FILE, 'utf8');
        return JSON.parse(data);
    } catch (e) {
        return {};
    }
}

function saveKeys(data) {
    fs.writeFileSync(KEYS_FILE, JSON.stringify(data, null, 2), 'utf8');
}

function generateRandomKey() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = 'HERRY-';
    for (let i = 0; i < 8; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

function getOrCreateUserKey(userId) {
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

    return {
        isNew: true,
        key: newKey,
        hoursLeft: 72
    };
}

module.exports = { getOrCreateUserKey };

