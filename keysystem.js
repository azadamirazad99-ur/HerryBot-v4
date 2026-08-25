const axios = require('axios');

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const GITHUB_OWNER = "urdushahzaib111-ctrl";
const GITHUB_REPO = "HerryBot-v4";
const GITHUB_PATH = "keys.txt";

// GitHub se keys text read aur parse karne ka function
async function getGitHubKeys() {
    if (!GITHUB_TOKEN) {
        console.error("❌ GITHUB_TOKEN missing in process.env");
        return { sha: null, content: "" };
    }
    try {
        const url = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${GITHUB_PATH}`;
        const headers = {
            'Authorization': `token ${GITHUB_TOKEN}`,
            'Accept': 'application/vnd.github.v3+json'
        };
        const res = await axios.get(url, { headers });
        const content = Buffer.from(res.data.content, 'base64').toString('utf8');
        return { sha: res.data.sha, content: content };
    } catch (e) {
        console.error("❌ Fetch Error from GitHub:", e.message);
        return { sha: null, content: "" };
    }
}

// User key create ya fetch karne ka main function
async function getOrCreateUserKey(userId) {
    const { sha, content } = await getGitHubKeys();
    
    // Check karein kya user ID ke sath koi key GitHub me pehle se hai
    // Format: Herry12345_USERID
    const lines = content.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    
    for (const line of lines) {
        if (line.includes(`_${userId}`)) {
            const existingKey = line.split('_')[0]; // Sirf key nikalega (e.g. Herry12345)
            return {
                isNew: false,
                key: existingKey,
                hoursLeft: "Active"
            };
        }
    }

    // Agar key nahi mili to nayi key generate karein
    const randomNum = Math.floor(10000 + Math.random() * 90000);
    const newKey = `Herry${randomNum}`;
    const keyEntry = `${newKey}_${userId}`; // Save with User ID

    // GitHub me key sync karein
    if (sha) {
        try {
            const url = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${GITHUB_PATH}`;
            const headers = {
                'Authorization': `token ${GITHUB_TOKEN}`,
                'Accept': 'application/vnd.github.v3+json'
            };

            lines.push(keyEntry);
            const updatedContent = lines.join('\n') + '\n';
            const base64Content = Buffer.from(updatedContent).toString('base64');

            await axios.put(url, {
                message: `Add Key for ${userId}`,
                content: base64Content,
                sha: sha
            }, { headers });
        } catch (e) {
            console.error("❌ GitHub Sync Write Error:", e.message);
        }
    }

    return {
        isNew: true,
        key: newKey,
        hoursLeft: 72
    };
}

module.exports = { getOrCreateUserKey };
