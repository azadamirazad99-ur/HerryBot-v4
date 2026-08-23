const { SlashCommandBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('getkey')
        .setDescription('Get your private 3-Day VIP Game Guardian Access Key'),

    async execute(interaction) {
        try {
            const userId = interaction.user.id;
            const keysFilePath = path.join(__dirname, '../keys.txt');

            // Auto-create keys.txt if missing
            if (!fs.existsSync(keysFilePath)) {
                fs.writeFileSync(keysFilePath, '');
            }

            let fileContent = fs.readFileSync(keysFilePath, 'utf8');
            let lines = fileContent.split('\n').filter(line => line.trim() !== '');

            const currentSeconds = Math.floor(Date.now() / 1000);
            let userKey = null;
            let expiryTime = null;

            // 1. Check if user ALREADY has an active key (Format: Key|Expiry|HWID|UserId)
            for (let line of lines) {
                let parts = line.split('|');
                if (parts[3] === userId) {
                    let exp = parseInt(parts[1]);
                    if (exp > currentSeconds) {
                        userKey = parts[0];
                        expiryTime = exp;
                        break;
                    }
                }
            }

            // 2. If NO active key found, Generate NEW Key with 3-digit number (e.g. HerryHacks386)
            if (!userKey) {
                const randomNum = Math.floor(100 + Math.random() * 900); // Exactly 3 digits (100 - 999)
                userKey = `HerryHacks${randomNum}`;
                expiryTime = currentSeconds + (3 * 24 * 60 * 60); // 3 Days

                // Format to save: Key|Expiry|HWID|UserId
                const newRecord = `${userKey}|${expiryTime}||${userId}\n`;
                fs.appendFileSync(keysFilePath, newRecord);
            }

            // 3. Ephemeral Private Message (Only this user sees it)
            await interaction.reply({
                content: `🔑 **YOUR PRIVATE VIP KEY:**\n\n` +
                         `\`\`\`text\n${userKey}\n\`\`\`\n` +
                         `⏱️ **Validity:** 3 Days\n` +
                         `🔒 **Security:** Locked to your Discord Account & Device.\n\n` +
                         `⚠️ *Ye key private hai. Kisi aur ke saath share mat karna!*`,
                ephemeral: true
            });

        } catch (error) {
            console.error("Getkey Command Error:", error);
            await interaction.reply({
                content: "❌ Key generate karne me error aaya!",
                ephemeral: true
            }).catch(() => {});
        }
    },
};

