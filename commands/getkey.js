
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

const DB_FILE = path.join(__dirname, '../keys_database.json');
const KEYS_TXT_FILE = path.join(__dirname, '../keys.txt');

// Load JSON database
function loadDatabase() {
    if (!fs.existsSync(DB_FILE)) return {};
    try {
        return JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
    } catch (e) {
        return {};
    }
}

// Save JSON database & update keys.txt for GameGuardian Loader
function saveDatabase(data) {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));

    // Non-expired active keys extract karke keys.txt me line by line save karna
    const activeKeys = Object.values(data)
        .filter(item => Date.now() < item.expiresAt)
        .map(item => item.key)
        .join('\n');

    fs.writeFileSync(KEYS_TXT_FILE, activeKeys);
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('getkey')
        .setDescription('Get 3-Day Short Access Key for Posya Script'),

    async execute(interaction) {
        await interaction.deferReply({ ephemeral: true });

        const userId = interaction.user.id;
        const db = loadDatabase();
        const now = Date.now();
        const THREE_DAYS_MS = 3 * 24 * 60 * 60 * 1000;

        let userRecord = db[userId];
        let userKey = '';
        let expiresAt = 0;

        // Check if existing key is still valid
        if (userRecord && now < userRecord.expiresAt) {
            userKey = userRecord.key;
            expiresAt = userRecord.expiresAt;
        } else {
            // Generate Key: Herry + 3 Digits (1 to 1000 e.g. Herry816, Herry042)
            const randomNum = Math.floor(Math.random() * 1000) + 1;
            const formattedNum = String(randomNum).padStart(3, '0');
            userKey = "Herry" + formattedNum;
            expiresAt = now + THREE_DAYS_MS;

            db[userId] = {
                key: userKey,
                expiresAt: expiresAt,
                createdAt: now
            };
            saveDatabase(db);
        }

        const remainingHours = Math.round((expiresAt - now) / (1000 * 60 * 60));

        const embed = new EmbedBuilder()
            .setColor('#00FF00')
            .setTitle('🔑 Posya By Herry - Script Access Key')
            .addFields(
                { name: 'Your Script Key', value: `\`\`\`${userKey}\`\`\`` },
                { name: 'Validity', value: `${remainingHours} Hours (3 Days)`, inline: true },
                { name: 'Device Lock', value: '🔒 Locked to 1 Device on first use', inline: true }
            )
            .setFooter({ text: 'Note: Single device only. Share karne par doosre phone par error aayega!' });

        await interaction.editReply({ embeds: [embed] });
    }
};
