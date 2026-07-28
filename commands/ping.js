const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ping')
        .setDescription('Replies with Pong and bot latency!'),
    async execute(interaction) {
        const ping = Date.now() - interaction.createdTimestamp;
        await interaction.reply(`Pong! Latency is ${ping}ms.`);
    },
};
