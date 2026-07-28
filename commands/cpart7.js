// ==========================================
// PART 7 (FIXED: NO SCREENSHOT REPEATS, PURE MODERATION)
// ==========================================

// 1. Unban Command (unban.js)
const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('unban')
        .setDescription('Unbans a user from the server using their ID.')
        .addStringOption(o => o.setName('userid').setDescription('Discord User ID to unban').setRequired(true))
        .addStringOption(o => o.setName('reason').setDescription('Reason for unbanning'))
        .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),
    async execute(interaction) {
        const userId = interaction.options.getString('userid');
        const reason = interaction.options.getString('reason') ?? 'No reason provided';
        try {
            await interaction.guild.members.unban(userId, reason);
            await interaction.reply({ content: `✅ Successfully unbanned user ID: ${userId}`, ephemeral: true });
        } catch (e) {
            await interaction.reply({ content: '❌ Failed to unban user. Check if ID is correct.', ephemeral: true });
        }
    },
};

// 2. Untimeout Command (untimeout.js)
module.exports = {
    data: new SlashCommandBuilder()
        .setName('untimeout')
        .setDescription('Removes timeout / mute restriction from a member.')
        .addUserOption(o => o.setName('target').setDescription('User to unmute').setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),
    async execute(interaction) {
        const target = interaction.options.getMember('target');
        try {
            await target.timeout(null);
            await interaction.reply({ content: `🔊 Successfully removed timeout from ${target.user.tag}.`, ephemeral: true });
        } catch (e) {
            await interaction.reply({ content: '❌ Failed to remove timeout.', ephemeral: true });
        }
    },
};

// 3. Channel Slowmode Command (slowmode.js)
module.exports = {
    data: new SlashCommandBuilder()
        .setName('slowmode')
        .setDescription('Sets slowmode delay timer for the current channel.')
        .addIntegerOption(o => o.setName('seconds').setDescription('Seconds (0 to disable)').setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),
    async execute(interaction) {
        const seconds = interaction.options.getInteger('seconds');
        await interaction.channel.setRateLimitPerUser(seconds);
        await interaction.reply({ content: `⏱️ Slowmode updated to **${seconds}** seconds.`, ephemeral: true });
    },
};

// 4. Lock Channel Command (lock.js)
module.exports = {
    data: new SlashCommandBuilder()
        .setName('lock')
        .setDescription('Locks current channel to stop general members from chatting.')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),
    async execute(interaction) {
        await interaction.channel.permissionOverwrites.edit(interaction.guild.roles.everyone, { SendMessages: false });
        await interaction.reply({ content: '🔒 **Channel Locked.** Members cannot send messages.', ephemeral: true });
    },
};

// 5. Unlock Channel Command (unlock.js)
module.exports = {
    data: new SlashCommandBuilder()
        .setName('unlock')
        .setDescription('Unlocks channel to allow chatting again.')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),
    async execute(interaction) {
        await interaction.channel.permissionOverwrites.edit(interaction.guild.roles.everyone, { SendMessages: null });
        await interaction.reply({ content: '🔓 **Channel Unlocked.** Chatting enabled for members.', ephemeral: true });
    },
};

// 6. Reset Nickname Command (resetnick.js)
module.exports = {
    data: new SlashCommandBuilder()
        .setName('resetnick')
        .setDescription('Resets a member nickname back to default username.')
        .addUserOption(o => o.setName('target').setDescription('Target user').setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageNicknames),
    async execute(interaction) {
        const target = interaction.options.getMember('target');
        try {
            await target.setNickname(null);
            await interaction.reply({ content: `✅ Reset nickname for ${target.user.tag}.`, ephemeral: true });
        } catch (e) {
            await interaction.reply({ content: '❌ Failed to reset nickname. Check role hierarchy.', ephemeral: true });
        }
    },
};

// 7. Channel NSFW Toggle (nsfwtoggle.js)
module.exports = {
    data: new SlashCommandBuilder()
        .setName('nsfwtoggle')
        .setDescription('Toggles NSFW flag on the current text channel.')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),
    async execute(interaction) {
        const currentStatus = interaction.channel.nsfw;
        try {
            await interaction.channel.setNSFW(!currentStatus);
            await interaction.reply({ content: `🔞 Channel NSFW status toggled to: **${!currentStatus}**`, ephemeral: true });
        } catch (e) {
            await interaction.reply({ content: '❌ Failed to change channel NSFW setting.', ephemeral: true });
        }
    },
};

// 8. Server Audit Log Check (auditlog.js)
module.exports = {
    data: new SlashCommandBuilder()
        .setName('auditlog')
        .setDescription('Fetches recent administrative security actions.')
        .setDefaultMemberPermissions(PermissionFlagsBits.ViewAuditLog),
    async execute(interaction) {
        const logs = await interaction.guild.fetchAuditLogs({ limit: 1 });
        const entry = logs.entries.first();
        if (!entry) {
            return interaction.reply({ content: '🔍 No recent audit log entries found.', ephemeral: true });
        }
        await interaction.reply({ content: `🔍 Last Log Action: **${entry.action}** by **${entry.executor.tag}**`, ephemeral: true });
    },
};

// 9. Disconnect Voice Member (vordisconnect.js)
module.exports = {
    data: new SlashCommandBuilder()
        .setName('vordisconnect')
        .setDescription('Disconnects a member from their voice channel.')
        .addUserOption(o => o.setName('target').setDescription('Member to disconnect').setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.MoveMembers),
    async execute(interaction) {
        const member = interaction.options.getMember('target');
        if (!member.voice.channel) {
            return interaction.reply({ content: '❌ That user is not in a voice channel.', ephemeral: true });
        }
        try {
            await member.voice.disconnect();
            await interaction.reply({ content: `🔌 Disconnected ${member.user.tag} from voice.`, ephemeral: true });
        } catch (e) {
            await interaction.reply({ content: '❌ Failed to disconnect member.', ephemeral: true });
        }
    },
};

// 10. Role Permission Security Check (roleperms.js)
module.exports = {
    data: new SlashCommandBuilder()
        .setName('roleperms')
        .setDescription('Checks administrative flag permissions of a role.')
        .addRoleOption(o => o.setName('role').setDescription('Role to check').setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    async execute(interaction) {
        const role = interaction.options.getRole('role');
        const hasAdmin = role.permissions.has(PermissionFlagsBits.Administrator);
        const hasManage = role.permissions.has(PermissionFlagsBits.ManageGuild);
        
        await interaction.reply({ content: `🛡️ Role **${role.name}** Security Audit:\n- Administrator Flag: \`${hasAdmin}\`\n- Manage Server Flag: \`${hasManage}\``, ephemeral: true });
    },
};
      
 
