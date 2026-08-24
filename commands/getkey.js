const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

const DB_FILE = path.join(__dirname, '../keys_database.json');
const KEYS_TXT_FILE = path.join(__dirname, '../keys.txt');

function loadDatabase() {
    if (!fs.existsSync(DB_FILE)) return {};
    try { return JSON.parse(fs.readFileSync(DB_FILE, 'utf8')); } catch (e) { return {}; }
}

function saveDatabase(data) {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));

    // keys.txt file generate/update karna GG loader ke verification ke liye
    const keysList = Object.values(data)
        .filter(item => Date.now() < item.expiresAt)
        .map(item => item.key)
        .join('\n');
    
    fs.writeFileSync(KEYS_TXT_FILE, keysList);
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

        if (userRecord && now < userRecord.expiresAt) {
            userKey = userRecord.key;
            expiresAt = userRecord.expiresAt;
        } else {
            // Short Key Format: Herry + 2 Random Digits (e.g. Herry65)
            const randomTwoDigits = Math.floor(10 + Math.random() * 90); 
            userKey = "Herry" + randomTwoDigits;
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
            .setTitle('🔑 Your 3-Day Script Key')
            .addFields(
                { name: 'Your Key', value: `\`\`\`${userKey}\`\`\`` },
                { name: 'Valid For', value: `${remainingHours} Hours`, inline: true }
            )
            .setFooter({ text: 'Locked to 1 device upon first use!' });

        await interaction.editReply({ embeds: [embed] });
    }
};

