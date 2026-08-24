const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

// GitHub Repo Configuration
const GITHUB_TOKEN = process.env.GITHUB_TOKEN || '';
const REPO_OWNER = 'urdushahzaib111-ctrl';
const REPO_NAME = 'HerryBot-v4';
const FILE_PATH = 'keys.txt'; // Repository ki root directory me keys.txt file

const DB_FILE = path.join(__dirname, '../keys_database.json');

function loadDatabase() {
    if (!fs.existsSync(DB_FILE)) return {};
    try {
        return JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
    } catch (e) {
        return {};
    }
}

// GitHub API ke zariye direct keys.txt update karna
async function updateGitHubKeysFile(activeKeysString) {
    if (!GITHUB_TOKEN) {
        console.error('❌ GITHUB_TOKEN Missing in Railway Environment Variables!');
        return;
    }

    try {
        const url = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${FILE_PATH}`;
        
        // 1. Get current file SHA
        let sha = '';
        try {
            const getRes = await axios.get(url, {
                headers: { Authorization: `token ${GITHUB_TOKEN}` }
            });
            sha = getRes.data.sha;
        } catch (e) {
            // File optional check
        }

        // 2. Commit & Push updated keys to GitHub
        await axios.put(url, {
            message: 'Auto-update keys.txt via Discord Bot',
            content: Buffer.from(activeKeysString).toString('base64'),
            sha: sha || undefined
        }, {
            headers: { 
                Authorization: `token ${GITHUB_TOKEN}`,
                'Content-Type': 'application/json'
            }
        });

        console.log('✅ Successfully synced keys.txt to GitHub!');
    } catch (error) {
        console.error('❌ Error updating GitHub keys.txt:', error.response?.data || error.message);
    }
}

async function saveDatabase(data) {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));

    const activeKeys = Object.values(data)
        .filter(item => Date.now() < item.expiresAt)
        .map(item => item.key)
        .join('\n');

    await updateGitHubKeysFile(activeKeys);
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('getkey')
        .setDescription('Get 3-Day Key for Posya & Herry Script'),

    async execute(interaction) {
        await interaction.deferReply({ ephemeral: true });

        const userId = interaction.user.id;
        const db = loadDatabase();
        const now = Date.now();
        const THREE_DAYS_MS = 3 * 24 * 60 * 60 * 1000;

        let userRecord = db[userId];
        let userKey = '';
        let expiresAt = 0;

        if (userRecord && now < userRecord.expiresAt) {
            userKey = userRecord.key;
            expiresAt = userRecord.expiresAt;
        } else {
            const randomNum = Math.floor(Math.random() * 1000) + 1;
            const formattedNum = String(randomNum).padStart(3, '0');
            userKey = "Herry" + formattedNum;
            expiresAt = now + THREE_DAYS_MS;

            db[userId] = {
                key: userKey,
                expiresAt: expiresAt,
                createdAt: now
            };
            await saveDatabase(db);
        }

        const remainingHours = Math.round((expiresAt - now) / (1000 * 60 * 60));

        const embed = new EmbedBuilder()
            .setColor('#00FF00')
            .setTitle('🔑 HerryHacks - Script Key')
            .addFields(
                { name: 'Your Script Key', value: `\`\`\`${userKey}\`\`\`` },
                { name: 'Validity', value: `${remainingHours} Hours (3 Days)`, inline: true },
                { name: 'Device Lock', value: '🔒 Locked to 1 Device on first use', inline: true }
            )
            .setFooter({ text: 'Note: Correct key GameGuardian script me enter karein!' });

        await interaction.editReply({ embeds: [embed] });
    }
};
        
