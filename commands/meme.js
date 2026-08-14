const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('meme')
        .setDescription('Sends a random meme'),
    async execute(interaction) {
        await interaction.deferReply();
        try {
            const response = await fetch('https://meme-api.com/gimme');
            const data = await response.json();

            const embed = new EmbedBuilder()
                .setTitle(data.title)
                .setImage(data.url)
                .setColor('Random')
                .setFooter({ text: `Source: r/${data.subreddit}` });

            await interaction.editReply({ embeds: [embed] });
        } catch (error) {
            await interaction.editReply('Failed to fetch a meme right now!');
        }
    },
};

