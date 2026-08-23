const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const fs = require('fs');
const path = require('path');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('getkey')
        .setDescription('Get your private 3-Day VIP Game Guardian Access Key')
        .setDefaultMemberPermissions(PermissionFlagsBits.SendMessages),

    async execute(interaction) {
        // 1. Generate Unique Key (Format: herry-hacks786XXXX)
        const randomNum = Math.floor(1000 + Math.random() * 9000);
        const generatedKey = `herry-hacks786${randomNum}`;

        // 2. Expiry Timestamp Calculation (Current Time + 3 Days in seconds)
        const currentSeconds = Math.floor(Date.now() / 1000);
        const expiryTimestamp = currentSeconds + (3 * 24 * 60 * 60);

        // 3. Key Format Record (Key|Expiry|HWID)
        const keyRecord = `${generatedKey}|${expiryTimestamp}|\n`;

        // 4. Append Key to keys.txt
        const keysFilePath = path.join(__dirname, '../keys.txt');
        fs.appendFileSync(keysFilePath, keyRecord);

        // 5. Ephemeral Private Message (Only User Sees This)
        await interaction.reply({
            content: `🔑 **YOUR PRIVATE VIP KEY GENERATED!**\n\n` +
                     `\`\`\`text\n${generatedKey}\n\`\`\`\n` +
                     `⏱️ **Validity:** 3 Days\n` +
                     `🔒 **Security:** Locked to 1 Device on first use.\n\n` +
                     `⚠️ *Ye key bilkul private hai aur sirf aapko dikh rahi hai. Kisi ke sath share mat karna!*`,
            ephemeral: true // Single-user visibility setup
        });
    },
};

