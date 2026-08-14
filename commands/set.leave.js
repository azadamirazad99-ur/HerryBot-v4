const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const fs = require('node:fs');
const path = require('node:path');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('setleave')
        .setDescription('Sets the official channel for goodbye/leave messages.')
        .addChannelOption(o => 
            o.setName('channel')
             .setDescription('Select leave text channel')
             .setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    async execute(interaction) {
        const targetChannel = interaction.options.getChannel('channel');
        
        // Channel ID ko config file ya temporary memory mein save karne ka logic
        const configPath = path.join(__dirname, '..', 'config.json');
        
        let config = {};
        try {
            if (fs.existsSync(configPath)) {
                config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
            }
        } catch (e) {
            console.error(e);
        }

        config.leaveChannelId = targetChannel.id;

        try {
            fs.writeFileSync(configPath, JSON.stringify(config, null, 4));
        } catch (e) {
            console.error(e);
        }

        await interaction.reply({ 
            content: `✅ Success! Leave channel has been set to ${targetChannel}. Ab se jane wale members ka message yahin aayega!`, 
            ephemeral: true 
        });
    },
};

