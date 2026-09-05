const { 
    SlashCommandBuilder, 
    EmbedBuilder, 
    ActionRowBuilder, 
    StringSelectMenuBuilder, 
    PermissionsBitField 
} = require('discord.js');

const builder = new SlashCommandBuilder()
    .setName('rolesetup')
    .setDescription('Custom roles ke liye dropdown menu setup karein (Up to 19 Roles)')
    .setDefaultMemberPermissions(PermissionsBitField.Flags.Administrator);

// 1 se 19 roles tak options add karna
for (let i = 1; i <= 19; i++) {
    builder.addRoleOption(option => 
        option.setName(`role${i}`)
              .setDescription(`Role ${i} select karein`)
              .setRequired(i === 1) // Pehla role compulsory
    );
}

module.exports = {
    data: builder,

    async execute(interaction) {
        const roles = [];
        
        for (let i = 1; i <= 19; i++) {
            const role = interaction.options.getRole(`role${i}`);
            if (role) {
                roles.push({
                    label: role.name,
                    value: role.id,
                    description: `${role.name} role lene ke liye select karein`,
                    emoji: '🎭'
                });
            }
        }

        const embed = new EmbedBuilder()
            .setTitle('🎭 Select Your Roles')
            .setDescription('Niche menu se jitne chahe roles select karein. Unselect karne par role hat jayega!')
            .setColor('#00FFCC')
            .setFooter({ text: 'HerryHacks VIP Role System' });

        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId('role_select_menu')
            .setPlaceholder('👉 Choose your roles here...')
            .setMinValues(0)
            .setMaxValues(roles.length) // Dynamic limit (Jitne roles select kiye utne maximum choose kar sakte hain)
            .addOptions(roles);

        const row = new ActionRowBuilder().addComponents(selectMenu);

        await interaction.channel.send({ embeds: [embed], components: [row] });
        await interaction.reply({ content: '✅ Role Menu successfully send ho gaya hai!', ephemeral: true });
    }
};
