// ==========================================
// PART 5 (UPDATED): SERIOUS MODERATION & GRANDHACKYT LINK COMMANDS
// ==========================================

// 1. GrandHackYT Official Link & Hub Command (grandhackyt.js)
const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('grandhackyt')
        .setDescription('Get official GrandHackYT channel link and community info.'),
    async execute(interaction) {
        const embed = new EmbedBuilder()
            .setColor('#ff0000')
            .setTitle('🔴 GrandHackYT Official Gaming Channel')
            .setDescription('Check out the official GrandHackYT channel for high-level mobile gaming and development content!')
            .addFields(
                { name: 'YouTube Channel Link', value: '[Click Here to Visit GrandHackYT](https://www.youtube.com/@grandhacks-l7j)', inline: false },
                { name: 'Platform Status', value: 'Verified & Active Hub', inline: true }
            )
            .setTimestamp();
        await interaction.reply({ embeds: [embed] });
    },
};
// PREFIX COMMAND CODE FOR index.js (!grandhackyt):
/*
if (message.content === '!grandhackyt') {
    message.channel.send('🔴 Official GrandHackYT Channel: https://www.youtube.com/@grandhacks-l7j');
}
*/

// 2. Slowmode Command (slowmode.js)
module.exports = {
    data: new SlashCommandBuilder()
        .setName('slowmode')
        .setDescription('Sets the slowmode delay for the current channel.')
        .addIntegerOption(o => o.setName('seconds').setDescription('Seconds of slowmode (0 to disable)').setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),
    async execute(interaction) {
        const seconds = interaction.options.getInteger('seconds');
        await interaction.channel.setRateLimitPerUser(seconds);
        if (seconds === 0) {
            await interaction.reply({ content: '🔓 Slowmode has been disabled for this channel.', ephemeral: true });
        } else {
            await interaction.reply({ content: `⏱️ Slowmode set to **${seconds}** seconds.`, ephemeral: true });
        }
    },
};

// 3. Lock Channel Command (lock.js)
module.exports = {
    data: new SlashCommandBuilder()
        .setName('lock')
        .setDescription('Locks the current channel to prevent general members from sending messages.')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),
    async execute(interaction) {
        const channel = interaction.channel;
        await channel.permissionOverwrites.edit(interaction.guild.roles.everyone, { SendMessages: false });
        await interaction.reply('🔒 **Channel Locked.** Regular members can no longer send messages here.');
    },
};

// 4. Unlock Channel Command (unlock.js)
module.exports = {
    data: new SlashCommandBuilder()
        .setName('unlock')
        .setDescription('Unlocks the current channel to allow members to chat again.')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),
    async execute(interaction) {
        const channel = interaction.channel;
        await channel.permissionOverwrites.edit(interaction.guild.roles.everyone, { SendMessages: null });
        await interaction.reply('🔓 **Channel Unlocked.** Regular members can now send messages.');
    },
};

// 5. Purge Bot Messages (purgebot.js)
module.exports = {
    data: new SlashCommandBuilder()
        .setName('purgebot')
        .setDescription('Cleans up recent bot messages from the channel.')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),
    async execute(interaction) {
        const messages = await interaction.channel.messages.fetch({ limit: 50 });
        const botMessages = messages.filter(m => m.author.bot);
        await interaction.channel.bulkDelete(botMessages, true).catch(() => {});
        await interaction.reply({ content: `🧹 Cleaned up ${botMessages.size} recent bot messages.`, ephemeral: true });
    },
};

// 6. Member Audit / Role Check (membercheck.js)
module.exports = {
    data: new SlashCommandBuilder()
        .setName('membercheck')
        .setDescription('Performs a quick audit of total human vs bot accounts in the server.')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    async execute(interaction) {
        const guild = interaction.guild;
        await guild.members.fetch();
        const totalBots = guild.members.cache.filter(m => m.user.bot).size;
        const totalHumans = guild.memberCount - totalBots;

        const embed = new EmbedBuilder()
            .setColor('#333333')
            .setTitle('🛡️ Server Security & Member Audit')
            .addFields(
                { name: 'Total Registered Members', value: `${guild.memberCount}`, inline: false },
                { name: 'Human Accounts', value: `${totalHumans}`, inline: true },
                { name: 'Bot Infrastructures', value: `${totalBots}`, inline: true }
            )
            .setTimestamp();
        await interaction.reply({ embeds: [embed], ephemeral: true });
    },
};

// 7. LockDown Protocol (lockdown.js)
module.exports = {
    data: new SlashCommandBuilder()
        .setName('lockdown')
        .setDescription('Initiates a high-security emergency notice for the server.')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    async execute(interaction) {
        const embed = new EmbedBuilder()
            .setColor('#ff0000')
            .setTitle('🚨 EMERGENCY LOCKDOWN PROTOCOL')
            .setDescription('Security level elevated. All unauthorized activities are being monitored by moderators.')
            .setTimestamp();
        await interaction.channel.send({ embeds: [embed] });
        await interaction.reply({ content: 'Emergency lockdown broadcast sent.', ephemeral: true });
    },
};

// 8. Server Rules Info (rules.js)
module.exports = {
    data: new SlashCommandBuilder()
        .setName('rules')
        .setDescription('Displays official security and community conduct guidelines.'),
    async execute(interaction) {
        const embed = new EmbedBuilder()
            .setColor('#00ffcc')
            .setTitle('📜 GrandHackYT Community Directives')
            .setDescription('1. Respect all peers and online staff.\n2. No unauthorized spam or advertising.\n3. Follow roleplay server standards strictly.\n4. Keep technical channels clean of off-topic chatter.')
            .setTimestamp();
        await interaction.reply({ embeds: [embed] });
    },
};

// 9. Nickname Manager (setnick.js)
module.exports = {
    data: new SlashCommandBuilder()
        .setName('setnick')
        .setDescription('Changes the nickname of a target member.')
        .addUserOption(o => o.setName('target').setDescription('Target user').setRequired(true))
        .addStringOption(o => o.setName('name').setDescription('New nickname').setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageNicknames),
    async execute(interaction) {
        const target = interaction.options.getMember('target');
        const newNick = interaction.options.getString('name');
        try {
            await target.setNickname(newNick);
            await interaction.reply({ content: `✅ Successfully updated nickname for ${target.user.tag}.`, ephemeral: true });
        } catch (e) {
            await interaction.reply({ content: '❌ Failed to change nickname. Check bot role hierarchy permissions.', ephemeral: true });
        }
    },
};

// 10. Force Ping Diagnostic (pingcheck.js)
module.exports = {
    data: new SlashCommandBuilder()
        .setName('pingcheck')
        .setDescription('Deep diagnostic check of websocket and gateway response rates.')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    async execute(interaction) {
        const latency = Date.now() - interaction.createdTimestamp;
        const apiPing = Math.round(interaction.client.ws.ping);
        await interaction.reply({ content: `⚙️ **System Diagnostics:**\n- Roundtrip Latency: \`${latency}ms\`\n- Gateway API Ping: \`${apiPing}ms\``, ephemeral: true });
    },
};
          
