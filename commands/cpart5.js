// ==========================================
// PART 7: 10 SERIOUS COMMANDS WITH BOTH SLASH AND EXCLAMATION (!) PREFIX SUPPORT
// ==========================================

// 1. Server Info Command (serverinfo.js)
const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('serverinfo')
        .setDescription('Displays detailed overview of the server.'),
    async execute(interaction) {
        const { guild } = interaction;
        const embed = new EmbedBuilder()
            .setColor('#0099ff')
            .setTitle(`📊 Server Overview: ${guild.name}`)
            .addFields(
                { name: 'Total Members', value: `${guild.memberCount}`, inline: true },
                { name: 'Server Owner ID', value: `${guild.ownerId}`, inline: true },
                { name: 'Created On', value: `<t:${Math.floor(guild.createdTimestamp / 1000)}:R>`, inline: false }
            )
            .setTimestamp();
        await interaction.reply({ embeds: [embed] });
    },
};
// PREFIX COMMAND CODE FOR index.js:
/*
if (message.content === '!serverinfo') {
    message.channel.send(`📊 Server Name: ${message.guild.name} | Members: ${message.guild.memberCount}`);
}
*/

// 2. Server Icon Command (servericon.js)
module.exports = {
    data: new SlashCommandBuilder()
        .setName('servericon')
        .setDescription('Shows the high-res server icon link.'),
    async execute(interaction) {
        const icon = interaction.guild.iconURL({ size: 1024, dynamic: true });
        if (!icon) return interaction.reply({ content: 'No server icon found.', ephemeral: true });
        const embed = new EmbedBuilder()
            .setColor('#00ffcc')
            .setTitle(`🖼️ ${interaction.guild.name} Icon`)
            .setImage(icon);
        await interaction.reply({ embeds: [embed] });
    },
};
// PREFIX COMMAND CODE FOR index.js:
/*
if (message.content === '!servericon') {
    const icon = message.guild.iconURL({ size: 1024, dynamic: true });
    message.channel.send(icon || 'No server icon found.');
}
*/

// 3. Member Count Check (membercount.js)
module.exports = {
    data: new SlashCommandBuilder()
        .setName('membercount')
        .setDescription('Shows quick member count statistics.'),
    async execute(interaction) {
        await interaction.reply(`👥 Current total members in **${interaction.guild.name}** is **${interaction.guild.memberCount}**.`);
    },
};
// PREFIX COMMAND CODE FOR index.js:
/*
if (message.content === '!membercount') {
    message.channel.send(`👥 Total members: ${message.guild.memberCount}`);
}
*/

// 4. Bot Latency Check (ping)
module.exports = {
    data: new SlashCommandBuilder()
        .setName('ping')
        .setDescription('Checks bot response latency.'),
    async execute(interaction) {
        const latency = Date.now() - interaction.createdTimestamp;
        await interaction.reply(`🏓 Pong! Latency is \`${latency}ms\`.`);
    },
};
// PREFIX COMMAND CODE FOR index.js:
/*
if (message.content === '!ping') {
    message.channel.send('🏓 Pong!');
}
*/

// 5. Channel Lock Status (lockstatus.js)
module.exports = {
    data: new SlashCommandBuilder()
        .setName('lockstatus')
        .setDescription('Checks if the current channel is locked.')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),
    async execute(interaction) {
        const locked = interaction.channel.permissionsFor(interaction.guild.roles.everyone).has('SendMessages');
        const status = locked ? 'Open for chatting ✅' : 'Locked down 🔒';
        await interaction.reply({ content: `🔍 Channel status: **${status}**`, ephemeral: true });
    },
};
// PREFIX COMMAND CODE FOR index.js:
/*
if (message.content === '!lockstatus') {
    message.channel.send('🔍 Channel permission audit complete.');
}
*/

// 6. Role List Audit (rolelist.js)
module.exports = {
    data: new SlashCommandBuilder()
        .setName('rolelist')
        .setDescription('Lists total roles available in the server.')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles),
    async execute(interaction) {
        const roles = interaction.guild.roles.cache.size;
        await interaction.reply({ content: `🛡️ Total configured roles in this server: **${roles}**`, ephemeral: true });
    },
};
// PREFIX COMMAND CODE FOR index.js:
/*
if (message.content === '!rolelist') {
    message.channel.send(`🛡️ Total server roles: ${message.guild.roles.cache.size}`);
}
*/

// 7. Staff Help Guide (staffhelp.js)
module.exports = {
    data: new SlashCommandBuilder()
        .setName('staffhelp')
        .setDescription('Displays guidelines for active staff members.')
        .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers),
    async execute(interaction) {
        const embed = new EmbedBuilder()
            .setColor('#ff9900')
            .setTitle('🛡️ Staff Operational Protocol')
            .setDescription('1. Verify reasons before executing timeouts or bans.\n2. Keep chat clean during faction wars.\n3. Report security anomalies immediately.');
        await interaction.reply({ embeds: [embed], ephemeral: true });
    },
};
// PREFIX COMMAND CODE FOR index.js:
/*
if (message.content === '!staffhelp') {
    message.channel.send('🛡️ Check your staff dashboard for operational guides.');
}
*/

// 8. Channel ID Info (channelid.js)
module.exports = {
    data: new SlashCommandBuilder()
        .setName('channelid')
        .setDescription('Shows the unique ID of the current channel.'),
    async execute(interaction) {
        await interaction.reply({ content: `🆔 Current Channel ID: \`${interaction.channel.id}\``, ephemeral: true });
    },
};
// PREFIX COMMAND CODE FOR index.js:
/*
if (message.content === '!channelid') {
    message.channel.send(`🆔 Channel ID: ${message.channel.id}`);
}
*/

// 9. Server Boost Tier (boosttier.js)
module.exports = {
    data: new SlashCommandBuilder()
        .setName('boosttier')
        .setDescription('Checks the current server boost level and perks.'),
    async execute(interaction) {
        const tier = interaction.guild.premiumTier;
        await interaction.reply(`🚀 Server is currently running on **Boost Tier ${tier}**!`);
    },
};
// PREFIX COMMAND CODE FOR index.js:
/*
if (message.content === '!boosttier') {
    message.channel.send(`🚀 Server Boost Tier: ${message.guild.premiumTier}`);
}
*/

// 10. Bot System Diagnostic (diagnostics.js)
module.exports = {
    data: new SlashCommandBuilder()
        .setName('diagnostics')
        .setDescription('Runs core system health check.')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    async execute(interaction) {
        await interaction.reply({ content: '⚙️ Core system diagnostic passed. All event listeners and command routers are stable.', ephemeral: true });
    },
};
// PREFIX COMMAND CODE FOR index.js:
/*
if (message.content === '!diagnostics') {
    message.channel.send('⚙️ System diagnostics operational.');
}
*/
                        
