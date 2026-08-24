const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = './userKeys.json';

// Check if database file exists, if not create it
if (!fs.existsSync(path)) {
    fs.writeFileSync(path, '{}');
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('getkey')
        .setDescription('Get your 3-day HerryHacks VIP Key'),

    async execute(interaction) {
        const userId = interaction.user.id;
        const currentTime = Date.now();
        const THREE_DAYS = 3 * 24 * 60 * 60 * 1000; // 3 Days in MS

        let data = {};
        try {
            data = JSON.parse(fs.readFileSync(path, 'utf8'));
        } catch (err) {
            data = {};
        }

        // Check if user already has an active key
        if (data[userId]) {
            const user = data[userId];
            const timePassed = currentTime - user.assignedAt;

            // Agar 3 din (72 ghante) abhi poore NAHI hue
            if (timePassed < THREE_DAYS) {
                const timeLeft = THREE_DAYS - timePassed;
                const hoursLeft = Math.floor(timeLeft / (1000 * 60 * 60));
                const minutesLeft = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));

                const existEmbed = new EmbedBuilder()
                    .setTitle('🔑 Your Existing HerryHacks Key')
                    .setColor('#FF9900')
                    .setDescription(`Aapki key pehle se generated hai aur locked hai.\n\n**Key:** \`${user.key}\`\n\n⏰ **Nayi key test/generate karne me baaki time:** \`${hoursLeft} hours ${minutesLeft} mins\``)
                    .setFooter({ text: 'Same key will remain active for 3 days.' });

                return interaction.reply({ embeds: [existEmbed], ephemeral: true });
            }
        }

        // 3 din poore ho gaye ya Naya user hai -> Generate New Key
        const randomString = Math.random().toString(36).substring(2, 8).toUpperCase();
        const newKey = `HerryHacks-${randomString}`;

        data[userId] = {
            key: newKey,
            assignedAt: currentTime
        };

        // Save back to JSON file
        fs.writeFileSync(path, JSON.stringify(data, null, 2));

        const newEmbed = new EmbedBuilder()
            .setTitle('✅ New HerryHacks Key Generated')
            .setColor('#00FF00')
            .setDescription(`Aapki 3-Day Key successful generate ho gayi hai!\n\n**Key:** \`${newKey}\`\n\n⚠️ Ye key 3 din tak aapke Discord account par lock rahegi.`)
            .setFooter({ text: 'HerryHacks Official System' });

        return interaction.reply({ embeds: [newEmbed], ephemeral: true });
    }
};

