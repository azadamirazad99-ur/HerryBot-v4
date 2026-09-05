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
        .setDescription('Custom roles ke liye dropdown menu setup karein')
        .setDefaultMemberPermissions(PermissionsBitField.Flags.Administrator)
        .addRoleOption(option => option.setName('role1').setDescription('Pehla Role').setRequired(true))
        .addRoleOption(option => option.setName('role2').setDescription('Doosra Role').setRequired(false))
        .addRoleOption(option => option.setName('role3').setDescription('Teesra Role').setRequired(false))
        .addRoleOption(option => option.setName('role4').setDescription('Choutha Role').setRequired(false))
        .addRoleOption(option => option.setName('role5').setDescription('Panchwa Role').setRequired(false))
        .addRoleOption(option => option.setName('role6').setDescription('Chata Role').setRequired(false))
        .addRoleOption(option => option.setName('role7').setDescription('Satwa Role').setRequired(false))
        .addRoleOption(option => option.setName('role8').setDescription('Aatwa Role').setRequired(false)),

    async execute(interaction) {
        const roles = [];
        
        // Command inputs se roles collect karna
        for (let i = 1; i <= 8; i++) {
            const role = interaction.options.getRole(`role${i}`);
            if (role) {
                roles.push({
                    label: role.name,
                    value: role.id,
                    description: `${role.name} role lene ke liye select karein`
                });
            }
        }

        if (roles.length === 0) {
            return interaction.reply({ content: '❌ Kam se kam 1 role select karein!', ephemeral: true });
        }

        const embed = new EmbedBuilder()
            .setTitle('🎭 Select Your Roles')
            .setDescription('Niche diye gaye dropdown menu se apne roles choose karein!')
            .setColor('#00FFCC')
            .setFooter({ text: 'HerryHacks Role System' });

        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId('role_select_menu')
            .setPlaceholder('👉 Choose your roles here...')
            .setMinValues(0)
            .setMaxValues(roles.length)
            .addOptions(roles);

        const row = new ActionRowBuilder().addComponents(selectMenu);

        await interaction.channel.send({ embeds: [embed], components: [row] });
        await interaction.reply({ content: '✅ Role Menu successfully send ho gaya hai!', ephemeral: true });
    }
};
