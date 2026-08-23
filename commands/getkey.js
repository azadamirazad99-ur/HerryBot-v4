const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const axios = require('axios');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('getkey')
        .setDescription('Get your private 3-Day VIP Game Guardian Access Key')
        .setDMPermission(true),

    async execute(interaction) {
        await interaction.deferReply({ ephemeral: true });

        const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
        const REPO_OWNER = 'urdushahzaib111-ctrl';
        const REPO_NAME = 'HerryBot-v4';
        const FILE_PATH = 'keys.txt';
        const userId = interaction.user.id;

        try {
            // 1. Fetch current keys.txt from GitHub
            const getUrl = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${FILE_PATH}`;
            const fileRes = await axios.get(getUrl, {
                headers: { Authorization: `token ${GITHUB_TOKEN}` }
            });

            const sha = fileRes.data.sha;
            let currentContent = Buffer.from(fileRes.data.content, 'base64').toString('utf-8');

            // 2. Check if user already has an active key
            const lines = currentContent.split('\n');
            let existingKey = null;

            for (let line of lines) {
                const parts = line.split('|');
                if (parts[3] && parts[3].trim() === userId) {
                    existingKey = parts[0].trim();
                    break;
                }
            }

            if (existingKey) {
                const existingEmbed = new EmbedBuilder()
                    .setTitle('🔑 VIP ACCESS KEY')
                    .setColor('#FFD700')
                    .setDescription(`Aapki key pehle se active hai!\n\n**Key:** \`${existingKey}\``)
                    .addFields(
                        { name: '⏳ Expiry', value: '3 Days', inline: true },
                        { name: '🔒 Device', value: 'Locked to 1st device', inline: true }
                    )
                    .setFooter({ text: 'HerryHacks Official Security System' });

                return await interaction.editReply({ embeds: [existingEmbed] });
            }

            // 3. Generate New Key & Expiry Timestamp (Current Seconds + 3 Days)
            const keyNum = Math.floor(100 + Math.random() * 900);
            const newKey = `HerryHacks${keyNum}`;
            const expiryTimestamp = Math.floor(Date.now() / 1000) + (3 * 24 * 60 * 60);

            // Format: Key|ExpiryTimestamp|HWID_Slot|Discord_UserID
            const newLine = `${newKey}|${expiryTimestamp}||${userId}`;
            
            // Clean trail before appending
            const updatedContent = currentContent.trim() ? `${currentContent.trim()}\n${newLine}` : newLine;

            // 4. Push Updated keys.txt back to GitHub
            await axios.put(getUrl, {
                message: `Add key for ${interaction.user.tag}`,
                content: Buffer.from(updatedContent).toString('base64'),
                sha: sha
            }, {
                headers: { Authorization: `token ${GITHUB_TOKEN}` }
            });

            // 5. Send Key Embed Response
            const embed = new EmbedBuilder()
                .setTitle('🎉 VIP ACCESS KEY GENERATED!')
                .setColor('#00FF00')
                .setDescription(`Aapki private GG key generate ho chuki hai:\n\n**🔑 VIP Key:** \`${newKey}\``)
                .addFields(
                    { name: '⌛ Validity', value: '3 Days', inline: true },
                    { name: '🔒 Security', value: 'Locked to 1st Device', inline: true }
                )
                .setFooter({ text: '⚠️ Key kisi ke sath share na karein!' });

            await interaction.editReply({ embeds: [embed] });

        } catch (error) {
            console.error('Error generating key:', error);
            await interaction.editReply({
                content: '❌ Key generate karne me error aaya. Developer (herry_escobar) se contact karein.'
            });
        }
    }
};

