
const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('getkey')
        .setDescription('Get your private 3-Day VIP Game Guardian Access Key'),

    async execute(interaction) {
        try {
            await interaction.deferReply({ ephemeral: true });

            const userId = interaction.user.id;
            const GITHUB_TOKEN = process.env.GITHUB_TOKEN; // Railway Variables me set hona chahiye
            const REPO_OWNER = "urdushahzaib111-ctrl";
            const REPO_NAME = "HerryBot-v4";
            const FILE_PATH = "keys.txt";

            const githubApiUrl = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${FILE_PATH}`;

            // 1. Fetch current keys.txt from GitHub
            let fileData = { sha: null, content: "" };
            try {
                const getRes = await fetch(githubApiUrl, {
                    headers: { 
                        'Authorization': `Bearer ${GITHUB_TOKEN}`,
                        'Accept': 'application/vnd.github.v3+json',
                        'User-Agent': 'DiscordBot'
                    }
                });
                if (getRes.ok) {
                    const data = await getRes.json();
                    fileData.sha = data.sha;
                    fileData.content = Buffer.from(data.content, 'base64').toString('utf-8');
                }
            } catch (err) {
                console.error("GitHub Fetch Error:", err);
            }

            const currentSeconds = Math.floor(Date.now() / 1000);
            let lines = fileData.content.split('\n').filter(line => line.trim() !== '');
            let userKey = null;

            // 2. Check if this Discord user already has an active key
            for (let line of lines) {
                let parts = line.split('|');
                // parts[3] is Discord User ID
                if (parts[3] && parts[3].trim() === userId) {
                    let exp = parseInt(parts[1]);
                    if (exp > currentSeconds) {
                        userKey = parts[0].trim();
                        break;
                    }
                }
            }

            // 3. If no active key exists, generate a new unique key
            if (!userKey) {
                const randomNum = Math.floor(100 + Math.random() * 900); // 3-digit number
                userKey = `HerryHacks${randomNum}`;
                const expiryTime = currentSeconds + (3 * 24 * 60 * 60); // 3 Days Valid

                // Format: Key|ExpiryTimestamp||DiscordUserId
                const newRecord = `${userKey}|${expiryTime}||${userId}`;
                lines.push(newRecord);

                const updatedContent = lines.join('\n') + '\n';
                const base64Content = Buffer.from(updatedContent).toString('base64');

                // 4. Push/Update directly to GitHub repository
                await fetch(githubApiUrl, {
                    method: 'PUT',
                    headers: {
                        'Authorization': `Bearer ${GITHUB_TOKEN}`,
                        'Content-Type': 'application/json',
                        'Accept': 'application/vnd.github.v3+json',
                        'User-Agent': 'DiscordBot'
                    },
                    body: JSON.stringify({
                        message: `Add VIP Key for user ${userId}`,
                        content: base64Content,
                        sha: fileData.sha || undefined
                    })
                });
            }

            // 5. Send key to user privately
            await interaction.editReply({
                content: `🔑 **YOUR PRIVATE VIP KEY:**\n\n` +
                         `\`\`\`text\n${userKey}\n\`\`\`\n` +
                         `⏱️ **Validity:** 3 Days\n` +
                         `🔒 **Security:** Locked to your 1st Device on use.\n\n` +
                         `⚠️ *Ye key sirf aapke liye hai!*`
            });

        } catch (error) {
            console.error("Getkey Error:", error);
            await interaction.editReply({ content: "❌ Key generate karne me issue aaya! Developer ko contact karein." });
        }
    },
};
