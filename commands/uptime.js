const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('uptime')
        .setDescription('Shows how long the bot has been running.'),
    async execute(interaction) {
        const totalSeconds = Math.floor(client.uptime / 1000);
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;
        await interaction.reply(`⏱️ Uptime: **${hours}h ${minutes}m ${seconds}s**`);
    },
};
