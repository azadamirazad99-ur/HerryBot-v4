const { 
    SlashCommandBuilder, 
    EmbedBuilder, 
    ActionRowBuilder, 
    StringSelectMenuBuilder, 
    PermissionsBitField 
} = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('rolesetup')
        .setDescription('7-8 custom roles ke liye dropdown select menu setup karein')
        .setDefaultMemberPermissions(PermissionsBitField.Flags.Administrator),

    async execute(interaction) {
        const embed = new EmbedBuilder()
            .setTitle('🎭 Select Your Roles')
            .setDescription('Apne pasandida roles lene ke liye niche dropdown menu se select karein!')
            .setColor('#00FFCC')
            .setFooter({ text: 'HerryHacks VIP Role System' });

        // 7-8 Roles ki list (In IDs aur Labels ko apne server ke hisab se badlein)
        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId('role_select_menu')
            .setPlaceholder('👉 Choose your roles here...')
            .setMinValues(0)  // User 0 select karega toh role remove hoga
            .setMaxValues(8)  // Single time me 8 roles tak select kar sakta hai
            .addOptions([
                { label: 'VIP Access', description: 'VIP features ke liye', value: '1529467733161283654', emoji: '👑' },
                { label: 'Grand Mobile Player', description: 'Grand Mobile Role', value: 'ROLE_ID_2', emoji: '🚗' },
                { label: 'Script Developer', description: 'Lua/Script Access', value: 'ROLE_ID_3', emoji: '💻' },
                { label: 'Announcements', description: 'Pings & News', value: 'ROLE_ID_4', emoji: '🔔' },
                { label: 'Giveaways', description: 'Events & Giveaways', value: 'ROLE_ID_5', emoji: '🎉' },
                { label: 'Grand RP Member', description: 'Grand RP Server Role', value: 'ROLE_ID_6', emoji: '🎮' },
                { label: 'Updates Ping', description: 'Bot Updates', value: 'ROLE_ID_7', emoji: '🚀' },
                { label: 'Community Friend', description: 'General Member', value: 'ROLE_ID_8', emoji: '💬' },
            ]);

        const row = new ActionRowBuilder().addComponents(selectMenu);

        await interaction.channel.send({ embeds: [embed], components: [row] });
        await interaction.reply({ content: '✅ Role Dropdown Menu Post ho gaya!', ephemeral: true });
    }
};
