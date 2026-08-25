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
        return { sha: res.data.sha, content: content };
    } catch (e) {
        return { sha: null, content: "" };
    }
}

async function getOrCreateUserKey(userId) {
    const { sha, content } = await getGitHubKeys();
    const lines = content.split('\n').map(l => l.trim()).filter(l => l.length > 0);

    // Agar user ki key pehle se bani hui hai toh wahi do (Hum user tracking ke liye format check kar sakte hain ya simple persistent mapping rakh sakte hain)
    // Lekin sabse asan tareeqa yeh hai ke hum check karein agar user pehle command chala chuka hai
    // Chunki hum GitHub par sirf keys rakh rahe hain, hum user ko ek consistent key assign karenge uski ID ke hash/math se ya fir check karenge.
    
    // Behtareen hal: User ID ke base par ek fixed key generate ho jo kabhi change na ho!
    // Isse GitHub par baar baar nayi lines add hone ka ya mismatch ka masla hi khatam ho jayega.
    
    let userKey = "";
    // User ID ke numbers se ek unique key banayein jo hamesha ussi user ke liye same rahegi
    let numericId = parseInt(userId.replace(/\D/g, '')) || 12345;
    let generatedKeyNum = (numericId % 90000) + 10000;
    userKey = `Herry${generatedKeyNum}`;

    // Ab check karein kya yeh key already GitHub ki `keys.txt` mein hai ya nahi
    if (!lines.includes(userKey)) {
        lines.push(userKey);
        if (sha) {
            try {
                const url = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${GITHUB_PATH}`;
                const headers = {
                    'Authorization': `token ${GITHUB_TOKEN}`,
                    'Accept': 'application/vnd.github.v3+json'
                };

                const updatedContent = lines.join('\n') + '\n';
                const base64Content = Buffer.from(updatedContent).toString('base64');

                await axios.put(url, {
                    message: `Auto Sync Key for User`,
                    content: base64Content,
                    sha: sha
                }, { headers });
            } catch (e) {
                console.error("GitHub Error:", e.message);
            }
        }
    }

    return {
        isNew: false,
        key: userKey,
        hoursLeft: "Active"
    };
}

module.exports = { getOrCreateUserKey };

