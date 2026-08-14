const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('setleave')
        .setDescription('Sets the official channel for goodbye/leave messages.')
        .addChannelOption(o => o.setName('channel').setDescription('Select leave text channel').setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    async execute(interaction) {
        const targetChannel = interaction.options.getChannel('channel');
        
        // Yahan channel ID save hogi
        await interaction.reply({ 
            content: `✅ Success! Leave channel has been set to ${targetChannel}.`, 
            ephemeral: true 
        });
    },
};

