
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const DB_FILE = path.join(__dirname, '../keys_database.json');

// Database loading function
function loadDatabase() {
    if (!fs.existsSync(DB_FILE)) {
        fs.writeFileSync(DB_FILE, JSON.stringify({}));
    }
    try {
        return JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
    } catch (e) {
        return {};
    }
}

// Database saving function
function saveDatabase(data) {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('getkey')
        .setDescription('Get your 3-day access key for GameGuardian script'),

    async execute(interaction) {
        await interaction.deferReply({ ephemeral: true });

        const userId = interaction.user.id;
        const db = loadDatabase();
        const now = Date.now();
        const THREE_DAYS_MS = 3 * 24 * 60 * 60 * 1000;

        let userRecord = db[userId];
        let userKey = '';
        let expiresAt = 0;

        // Agar user ki key pehle se hai aur 3 din expire nahi hue
        if (userRecord && now < userRecord.expiresAt) {
            userKey = userRecord.key;
            expiresAt = userRecord.expiresAt;
        } else {
            // New Key for 3 Days
            userKey = "HERRY-" + crypto.randomBytes(4).toString('hex').toUpperCase();
            expiresAt = now + THREE_DAYS_MS;

            db[userId] = {
                key: userKey,
                expiresAt: expiresAt,
                hwid: null,
                createdAt: now
            };
            saveDatabase(db);
        }

        const remainingHours = Math.round((expiresAt - now) / (1000 * 60 * 60));

        const embed = new EmbedBuilder()
            .setColor('#00FF00')
            .setTitle('🔑 Your Script Key')
            .setDescription(`Here is your 3-day script access key. Use it in GameGuardian.`)
            .addFields(
                { name: 'Your Key', value: `\`\`\`${userKey}\`\`\`` },
                { name: 'Valid For', value: `${remainingHours} Hours remaining`, inline: true },
                { name: 'Device Bound', value: userRecord && userRecord.hwid ? '🔒 Locked to your device' : '🔓 Unlocked (Will lock on first use in GG)', inline: true }
            )
            .setFooter({ text: 'Note: Key cannot be shared with others!' });

        await interaction.editReply({ embeds: [embed] });
    }
};
