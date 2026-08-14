const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('dm')
        .setDescription('Sends a direct message to a user')
        .addUserOption(option => 
            option.setName('target')
                .setDescription('The user to DM')
                .setRequired(true))
        .addStringOption(option => 
            option.setName('message')
                .setDescription('The message to send')
                .setRequired(true)),
    async execute(interaction) {
        const user = interaction.options.getUser('target');
        const message = interaction.options.getString('message');

        try {
            await user.send(message);
            await interaction.reply({ content: `Successfully sent a DM to ${user.tag}!`, ephemeral: true });
        } catch (error) {
            console.log(error);
            await interaction.reply({ content: 'Could not send DM to this user. They might have DMs closed.', ephemeral: true });
        }
    },
};

