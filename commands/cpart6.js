// ==========================================
// PART 6: 10 NEW ADVANCED MODERATION & UTILITY COMMANDS IN A SINGLE CODE BLOCK
// ==========================================

// 1. Server Vanity URL Info (vanity.js)
const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('vanity')
        .setDescription('Displays server invite vanity URL details if available.')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    async execute(interaction) {
        const guild = interaction.guild;
        const vanityCode = guild.vanityURLCode || 'None';
        await interaction.reply({ content: `🔗 Server Vanity Invite Code: **${vanityCode}**`, ephemeral: true });
    },
};

// 2. Channel Slowmode Reset (resetslowmode.js)
module.exports = {
    data: new SlashCommandBuilder()
        .setName('resetslowmode')
        .setDescription('Instantly turns off slowmode for the current channel.')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),
    async execute(interaction) {
        await interaction.channel.setRateLimitPerUser(0);
        await interaction.reply({ content: '🔓 Channel slowmode has been completely reset to 0 seconds.', ephemeral: true });
    },
};

// 3. Purge Pinned Exemption Clear (purgemulti.js)
module.exports = {
    data: new SlashCommandBuilder()
        .setName('purgemulti')
        .setDescription('Deletes a large batch of recent channel messages (up to 50).')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),
    async execute(interaction) {
        const deleted = await interaction.channel.bulkDelete(50, true).catch(() => {});
        await interaction.reply({ content: `🧹 Cleared ${deleted ? deleted.size : 0} messages successfully.`, ephemeral: true });
    },
};

// 4. Role Color Changer (rolecolor.js)
module.exports = {
    data: new SlashCommandBuilder()
        .setName('rolecolor')
        .setDescription('Updates the HEX color code of an existing role.')
        .addRoleOption(o => o.setName('role').setDescription('Role to modify').setRequired(true))
        .addStringOption(o => o.setName('hex').setDescription('New HEX color (e.g. #00ffcc)').setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles),
    async execute(interaction) {
        const role = interaction.options.getRole('role');
        const hex = interaction.options.getString('hex');
        try {
            await role.setColor(hex);
            await interaction.reply({ content: `🎨 Successfully updated **${role.name}** color to **${hex}**.`, ephemeral: true });
        } catch (e) {
            await interaction.reply({ content: '❌ Failed to change role color. Check role hierarchy permissions.', ephemeral: true });
        }
    },
};

// 5. Server Partner Status (partnercheck.js)
module.exports = {
    data: new SlashCommandBuilder()
        .setName('partnercheck')
        .setDescription('Checks if the server has official partner or verified features enabled.'),
    async execute(interaction) {
        const guild = interaction.guild;
        const features = guild.features.length > 0 ? guild.features.join(', ') : 'Standard Community Hub';
        const embed = new EmbedBuilder()
            .setColor('#9b59b6')
            .setTitle(`🌟 Server Features - ${guild.name}`)
            .setDescription(`Active Guild Features:\n\`${features}\``)
            .setTimestamp();
        await interaction.reply({ embeds: [embed], ephemeral: true });
    },
};

// 6. Force Member Deafen in Voice (vordeafen.js)
module.exports = {
    data: new SlashCommandBuilder()
        .setName('vordeafen')
        .setDescription('Server-deafens a member in voice channels.')
        .addUserOption(o => o.setName('target').setDescription('Member to deafen').setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.MuteMembers),
    async execute(interaction) {
        const member = interaction.options.getMember('target');
        if (!member.voice.channel) {
            return interaction.reply({ content: '❌ That user is not connected to a voice channel.', ephemeral: true });
        }
        try {
            await member.voice.setDeaf(true);
            await interaction.reply({ content: `🔇 Server-deafened ${member.user.tag} in voice.`, ephemeral: true });
        } catch (e) {
            await interaction.reply({ content: '❌ Failed to deafen member.', ephemeral: true });
        }
    },
};

// 7. Force Member Undeafen in Voice (vorundeafen.js)
module.exports = {
    data: new SlashCommandBuilder()
        .setName('vorundeafen')
        .setDescription('Removes server-deafen from a member in voice channels.')
        .addUserOption(o => o.setName('target').setDescription('Member to undeafen').setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.MuteMembers),
    async execute(interaction) {
        const member = interaction.options.getMember('target');
        if (!member.voice.channel) {
            return interaction.reply({ content: '❌ That user is not connected to a voice channel.', ephemeral: true });
        }
        try {
            await member.voice.setDeaf(false);
            await interaction.reply({ content: `🔊 Removed server-deafen from ${member.user.tag}.`, ephemeral: true });
        } catch (e) {
            await interaction.reply({ content: '❌ Failed to undeafen member.', ephemeral: true });
        }
    },
};

// 8. Channel Position Shift (channelpos.js)
module.exports = {
    data: new SlashCommandBuilder()
        .setName('channelpos')
        .setDescription('Sets the display position index of a channel.')
        .addChannelOption(o => o.setName('channel').setDescription('Channel to reorder').setRequired(true))
        .addIntegerOption(o => o.setName('position').setDescription('New position number').setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),
    async execute(interaction) {
        const channel = interaction.options.getChannel('channel');
        const pos = interaction.options.getInteger('position');
        try {
            await channel.setPosition(pos);
            await interaction.reply({ content: `📑 Moved channel **${channel.name}** to position **${pos}**.`, ephemeral: true });
        } catch (e) {
            await interaction.reply({ content: '❌ Failed to reorder channel.', ephemeral: true });
        }
    },
};

// 9. Server Banner Display (serverbanner.js)
module.exports = {
    data: new SlashCommandBuilder()
        .setName('serverbanner')
        .setDescription('Displays the high-resolution server banner graphic if available.'),
    async execute(interaction) {
        const bannerURL = interaction.guild.bannerURL({ size: 1024 });
        if (!bannerURL) {
            return interaction.reply({ content: '❌ This server does not have a banner configured.', ephemeral: true });
        }
        const embed = new EmbedBuilder()
            .setColor('#3498db')
            .setTitle(`🖼️ ${interaction.guild.name} Banner`)
            .setImage(bannerURL)
            .setTimestamp();
        await interaction.reply({ embeds: [embed] });
    },
};

// 10. Core Gateway Status (gatewayping.js)
module.exports = {
    data: new SlashCommandBuilder()
        .setName('gatewayping')
        .setDescription('Measures web socket heartbeat and roundtrip connection speed.')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    async execute(interaction) {
        const wsPing = interaction.client.ws.ping;
        await interaction.reply({ content: `⚡ WebSocket Heartbeat Latency: **${wsPing}ms**`, ephemeral: true });
    },
};
              
