// ===================================================
// HERRY HACKS BOT - FULL COMMAND HANDLER SYSTEM
// ===================================================

const { 
    Client, 
    GatewayIntentBits, 
    Partials, 
    EmbedBuilder, 
    ActionRowBuilder, 
    ButtonBuilder, 
    ButtonStyle, 
    PermissionsBitField, 
    ChannelType,
    REST,
    Routes,
    Collection
} = require('discord.js');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers
    ],
    partials: [Partials.Channel, Partials.Message, Partials.GuildMember]
});

// Collections
client.commands = new Collection();
const PREFIX = '!';

// Memory Stores
const pendingRolesMap = new Map(); 
const warningsMap = new Map(); // Store user warnings in memory

// ---------------------------------------------------
// WHITELISTED USERS SYSTEM (ONLY THESE 2 CAN USE HB SYSTEM)
// ---------------------------------------------------
const ALLOWED_USERS = [
    '1379398921385672744', // Co Owner Roman Lineytsev
    '1235573252429058050'  // herry owner
];

// Helper Function: Parse Time Strings
function parseDuration(text) {
    if (!text) return null;

    const match = text.match(/(\d+)\s*(s|sec|m|min|h|hour|hr|d|day)s?/i);
    if (!match) return null;

    const value = parseInt(match[1]);
    const unit = match[2].toLowerCase();

    switch (unit) {
        case 's': case 'sec': return value * 1000;
        case 'm': case 'min': return value * 60 * 1000;
        case 'h': case 'hour': case 'hr': return value * 60 * 60 * 1000;
        case 'd': case 'day': return value * 24 * 60 * 60 * 1000;
        default: return null;
    }
}

// ---------------------------------------------------
// 1. COMMAND HANDLER (READ COMMANDS FOLDER)
// ---------------------------------------------------
const slashCommandsArray = [];
const commandsPath = path.join(__dirname, 'commands');

if (fs.existsSync(commandsPath)) {
    const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

    for (const file of commandFiles) {
        const filePath = path.join(commandsPath, file);
        const command = require(filePath);

        if ('data' in command && 'execute' in command) {
            client.commands.set(command.data.name, command);
            slashCommandsArray.push(command.data.toJSON());
            console.log(`📁 Loaded Slash Command: ${command.data.name}`);
        } else {
            console.log(`⚠️ [WARNING] The command at ${filePath} is missing "data" or "execute" property.`);
        }
    }
} else {
    console.log(`⚠️ 'commands' folder not found! Creating 'commands' directory...`);
    fs.mkdirSync(commandsPath);
}

// ---------------------------------------------------
// 2. BOT READY & REGISTER SLASH COMMANDS
// ---------------------------------------------------
client.once('ready', async () => {
    console.log(`✅ [HERRY BOT] Connected as ${client.user.tag}`);
    client.user.setActivity('HerryHacks VIP | HB Action List', { type: 3 });

    const rest = new REST({ version: '10' }).setToken(process.env.TOKEN || process.env.DISCORD_TOKEN);
    try {
        console.log('🔄 Registering Slash Commands to Discord...');
        await rest.put(
            Routes.applicationCommands(client.user.id),
            { body: slashCommandsArray }
        );
        console.log(`✅ Successfully registered ${slashCommandsArray.length} Slash Commands!`);
    } catch (error) {
        console.error('❌ Slash Command Registration Error:', error);
    }
});

// ---------------------------------------------------
// 3. WELCOME & LEAVE SYSTEM
// ---------------------------------------------------
client.on('guildMemberAdd', async (member) => {
    const channelId = process.env.WELCOME_CHANNEL_ID;
    if (!channelId) return;

    const channel = member.guild.channels.cache.get(channelId);
    if (!channel) return;

    const welcomeEmbed = new EmbedBuilder()
        .setTitle('👑 Welcome to HerryHacks Official! 👑')
        .setDescription(`Hey ${member}, welcome to the server!\n\n🔑 Check rules and enjoy your stay!`)
        .setColor('#00FF00')
        .addFields({ name: '📊 Total Members', value: `${member.guild.memberCount}` })
        .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
        .setFooter({ text: 'HerryHacks Community' })
        .setTimestamp();

    channel.send({ content: `👋 Welcome ${member}!`, embeds: [welcomeEmbed] });
});

client.on('guildMemberRemove', async (member) => {
    const channelId = process.env.LEAVE_CHANNEL_ID;
    if (!channelId) return;

    const channel = member.guild.channels.cache.get(channelId);
    if (!channel) return;

    const leaveEmbed = new EmbedBuilder()
        .setTitle('👋 Member Left')
        .setDescription(`**${member.user.tag}** has left the server.`)
        .setColor('#FF0000')
        .addFields({ name: '📊 Remaining Members', value: `${member.guild.memberCount}` })
        .setTimestamp();

    channel.send({ embeds: [leaveEmbed] });
});

// ---------------------------------------------------
// 4. INTERACTION EVENT (COMMANDS + BUTTONS)
// ---------------------------------------------------
client.on('interactionCreate', async (interaction) => {

    if (interaction.isChatInputCommand()) {
        const command = client.commands.get(interaction.commandName);

        if (!command) {
            console.error(`No command matching ${interaction.commandName} was found.`);
            return;
        }

        try {
            await command.execute(interaction);
        } catch (error) {
            console.error(`Error executing ${interaction.commandName}:`, error);
            if (interaction.replied || interaction.deferred) {
                await interaction.followUp({ content: '❌ Command execute karne me error aaya!', ephemeral: true });
            } else {
                await interaction.reply({ content: '❌ Command execute karne me error aaya!', ephemeral: true });
            }
        }
        return;
    }

    if (!interaction.isButton()) return;

    if (interaction.customId === 'create_ticket') {
        const ticketChannelName = `ticket-${interaction.user.username}`.toLowerCase().replace(/[^a-z0-9-_]/g, '');
        
        const existingChannel = interaction.guild.channels.cache.find(c => c.name === ticketChannelName);
        if (existingChannel) {
            return interaction.reply({ content: `❌ Aapka ticket already open he: ${existingChannel}`, ephemeral: true });
        }

        try {
            const rawCategoryId = process.env.TICKET_CATEGORY_ID;
            const categoryId = (rawCategoryId && rawCategoryId.length > 5) ? rawCategoryId : null;
            const staffRoleId = process.env.STAFF_ROLE_ID;

            const permissionOverwrites = [
                { id: interaction.guild.id, deny: [PermissionsBitField.Flags.ViewChannel] },
                { id: interaction.user.id, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.ReadMessageHistory] },
                { id: client.user.id, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.ManageChannels] }
            ];

            if (staffRoleId && staffRoleId.length > 10) {
                permissionOverwrites.push({ id: staffRoleId, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages] });
            }

            const channelOptions = {
                name: ticketChannelName,
                type: ChannelType.GuildText,
                permissionOverwrites: permissionOverwrites
            };

            if (categoryId) channelOptions.parent = categoryId;

            const ticketChannel = await interaction.guild.channels.create(channelOptions);

            const closeBtn = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId('close_ticket')
                    .setLabel('🔒 Close Ticket')
                    .setStyle(ButtonStyle.Danger)
            );

            const ticketEmbed = new EmbedBuilder()
                .setTitle('🎫 Support Ticket')
                .setDescription(`Welcome ${interaction.user}!\nApna masla ya query yahan likhein. Admin/Staff jald hi reply karega.`)
                .setColor('#5865F2')
                .setTimestamp();

            await ticketChannel.send({ content: `${interaction.user}`, embeds: [ticketEmbed], components: [closeBtn] });
            await interaction.reply({ content: `✅ Ticket created successfully: ${ticketChannel}`, ephemeral: true });

        } catch (error) {
            console.error("Ticket Creation Error:", error);
            await interaction.reply({ content: `❌ Ticket banane me error aaya! Bot permissions check karein.`, ephemeral: true });
        }
    }

    if (interaction.customId === 'close_ticket') {
        await interaction.reply('🔒 Closing this ticket in 5 seconds...');
        setTimeout(() => {
            if (interaction.channel) interaction.channel.delete().catch(() => {});
        }, 5000);
    }
});

// ---------------------------------------------------
// 5. MESSAGE EVENT (GETKEY AUTO-DELETE & PREFIX COMMANDS)
// ---------------------------------------------------
client.on('messageCreate', async (message) => {
    if (message.author.bot || !message.guild || message.interaction) return;

    // GetKey Channel Auto-Delete & DM Warning
    const rawGetKeyChannelId = process.env.GETKEY_CHANNEL_ID;
    const getKeyChannelId = rawGetKeyChannelId ? String(rawGetKeyChannelId).trim() : null;

    if (getKeyChannelId && String(message.channel.id) === getKeyChannelId) {
        setImmediate(async () => {
            try {
                if (message.deletable) {
                    await message.delete().catch(() => {});
                }

                await message.author.send(
                    "⚠️ **Warning:** Yahan Getkey Command ke ilava kuch or message mat send karo. Sirf /getkey Command chalao otherwise next time timeout!"
                ).catch(() => {});

            } catch (err) {
                console.error("❌ GetKey Filter Error:", err.message);
            }
        });

        return; 
    }

    const contentLower = message.content.toLowerCase().trim();

    // ---------------------------------------------------
    // FULL ADVANCED "HB" MODERATION ENGINE (2 ALLOWED USERS)
    // ---------------------------------------------------
    if (contentLower.startsWith('hb ') || contentLower === 'hb' || contentLower.startsWith('herrybot')) {
        
        // Strict Authorization Check
        if (!ALLOWED_USERS.includes(message.author.id)) {
            return message.reply('⛔ **Access Denied!** Sirf Co Owner Roman Lineytsev aur Herry Owner hi is feature ko use kar sakte hain.');
        }

        const mentions = message.mentions.members;
        const roleMentions = message.mentions.roles;

        // --- ACTION LIST MENU ---
        if (contentLower === 'hb action list' || contentLower === 'hb actions' || contentLower === 'hb help') {
            const listEmbed = new EmbedBuilder()
                .setTitle('⚙️ HerryHacks HB Fast Moderation Actions Menu')
                .setDescription('Niche diye gaye saare actions `HB <action>` karke use kiye ja sakte hain:')
                .setColor('#FF0055')
                .addFields(
                    { name: '🔨 Ban & Kick System', value: '• `HB ban @user` - Ban user\n• `HB softban @user` - Ban & instantly unban (clears msgs)\n• `HB unban <UserID>` - Unban user by ID\n• `HB kick @user` - Kick user', inline: false },
                    { name: '⏳ Timeout / Mute System', value: '• `HB timeout @user 10m` - Apply timeout (10m, 2h, 1d)\n• `HB remove timeout @user` - Remove timeout/unmute', inline: false },
                    { name: '🎭 Role Management', value: '• `HB give role @user @role` - Assign role\n• `HB remove role @user @role` - Permanent remove\n• `HB remove role @user @role 5m` - Temp remove for 5 mins\n• `HB remove role @user @role till i ask` - Save for giveback\n• `HB giveback role @user` - Restore saved roles', inline: false },
                    { name: '⚠️ Warning System', value: '• `HB warn @user <reason>` - Give warning\n• `HB unwarn @user` - Remove warning', inline: false },
                    { name: '🔒 Channel Moderation', value: '• `HB clear 20` - Purge up to 100 messages\n• `HB lock channel` - Lock current channel\n• `HB unlock channel` - Unlock current channel\n• `HB slowmode 10s` - Set slowmode (e.g. 5s, 10s, off)', inline: false },
                    { name: '🏷️ User & Nickname System', value: '• `HB nick @user <NewName>` - Change Nickname\n• `HB reset nick @user` - Reset to original name\n• `HB userinfo @user` - View user details', inline: false }
                )
                .setFooter({ text: 'Authorized: Co-Owner Roman & Herry Owner' })
                .setTimestamp();

            return message.reply({ embeds: [listEmbed] });
        }

        // --- 1. UNBAN ACTION ---
        if (/\b(unban|pardon|un-ban)\b/i.test(contentLower)) {
            const userIdMatch = message.content.match(/\d{17,19}/);
            if (!userIdMatch) return message.reply('❌ Please specify a valid User ID to unban.');
            
            try {
                await message.guild.members.unban(userIdMatch[0]);
                return message.channel.send(`✅ **Unbanned User ID:** ${userIdMatch[0]}`);
            } catch (e) {
                return message.reply(`❌ Could not unban user: ${e.message}`);
            }
        }

        // --- 2. SOFTBAN ACTION ---
        if (/\b(softban|soft ban)\b/i.test(contentLower)) {
            if (mentions.size === 0) return message.reply('❌ Mention member to softban.');
            const target = mentions.first();
            try {
                await target.ban({ deleteMessageSeconds: 7 * 24 * 60 * 60, reason: 'Softban via HB' });
                await message.guild.members.unban(target.id);
                return message.channel.send(`🧹 **Softbanned ${target.user.tag}! (Messages cleared & unbanned)**`);
            } catch (e) {
                return message.reply(`❌ Softban failed: ${e.message}`);
            }
        }

        // --- 3. BAN ACTION ---
        if (/\b(ban|banned|nikal do|khatam|ura do)\b/i.test(contentLower)) {
            if (mentions.size === 0) return message.reply('❌ Please mention at least one member to ban.');

            let successCount = 0;
            for (const [id, target] of mentions) {
                try {
                    await target.ban({ reason: `Banned via HB action by ${message.author.tag}` });
                    successCount++;
                } catch (e) {}
            }
            return message.channel.send(`🔨 **Banned ${successCount} member(s)!**`);
        }

        // --- 4. KICK ACTION ---
        if (/\b(kick|kicked|hata do|bhaga do)\b/i.test(contentLower)) {
            if (mentions.size === 0) return message.reply('❌ Please mention at least one member to kick.');

            let successCount = 0;
            for (const [id, target] of mentions) {
                try {
                    await target.kick(`Kicked via HB action by ${message.author.tag}`);
                    successCount++;
                } catch (e) {}
            }
            return message.channel.send(`MB **Kicked ${successCount} member(s)!**`);
        }

        // --- 5. REMOVE TIMEOUT / UNTIMEOUT ---
        if (/\b(remove timeout|untimeout|unmute|remove mute)\b/i.test(contentLower)) {
            if (mentions.size === 0) return message.reply('❌ Please mention member to remove timeout.');

            let successCount = 0;
            for (const [id, target] of mentions) {
                try {
                    await target.timeout(null);
                    successCount++;
                } catch (e) {}
            }
            return message.channel.send(`🔓 **Removed timeout for ${successCount} member(s)!**`);
        }

        // --- 6. GIVE TIMEOUT / MUTE ---
        if (/\b(timeout|mute|chup|band)\b/i.test(contentLower)) {
            if (mentions.size === 0) return message.reply('❌ Please mention member to timeout.');

            const parsedTime = parseDuration(contentLower);
            const durationMs = parsedTime ? parsedTime : (10 * 60 * 1000); // Default 10m
            const minutesDisplay = Math.round(durationMs / 60000);

            let successCount = 0;
            for (const [id, target] of mentions) {
                try {
                    await target.timeout(durationMs, `Timeout via HB action by ${message.author.tag}`);
                    successCount++;
                } catch (e) {}
            }
            return message.channel.send(`⏳ **Applied ${minutesDisplay}m timeout to ${successCount} member(s)!**`);
        }

        // --- 7. GIVEBACK ROLE ---
        if (/\b(giveback|give back|role back)\b/i.test(contentLower)) {
            if (mentions.size === 0) return message.reply('❌ Mention user to give back role.');

            let count = 0;
            for (const [id, target] of mentions) {
                if (pendingRolesMap.has(target.id)) {
                    const roleIds = pendingRolesMap.get(target.id);
                    for (const rId of roleIds) {
                        try {
                            await target.roles.add(rId);
                        } catch (e) {}
                    }
                    pendingRolesMap.delete(target.id);
                    count++;
                }
            }
            return message.channel.send(`🔄 **Gave back stored roles to ${count} user(s)!**`);
        }

        // --- 8. GIVE / ADD ROLE ---
        if (/\b(give role|add role|role give|role add)\b/i.test(contentLower)) {
            if (mentions.size === 0 || roleMentions.size === 0) {
                return message.reply('❌ Mention at least one member AND one role. Example: `HB give role @user @role`');
            }

            const role = roleMentions.first();
            let count = 0;
            for (const [id, target] of mentions) {
                try {
                    await target.roles.add(role);
                    count++;
                } catch (e) {}
            }
            return message.channel.send(`✅ **Added role ${role.name} to ${count} user(s)!**`);
        }

        // --- 9. REMOVE ROLE (PERMANENT / TEMPORARY / TILL I ASK) ---
        if (/\b(remove role|take role|role remove)\b/i.test(contentLower)) {
            if (mentions.size === 0 || roleMentions.size === 0) {
                return message.reply('❌ Mention member AND role. Example: `HB remove role @user @role`');
            }

            const role = roleMentions.first();
            const tempTimeMs = parseDuration(contentLower);
            const isTillIAsk = contentLower.includes('till i ask') || contentLower.includes('jab tak');

            let count = 0;
            for (const [id, target] of mentions) {
                try {
                    await target.roles.remove(role);
                    count++;

                    if (tempTimeMs) {
                        setTimeout(async () => {
                            try {
                                await target.roles.add(role);
                                message.channel.send(`⏰ **Time up! Restored role ${role.name} to ${target.user.tag}**`);
                            } catch (err) {}
                        }, tempTimeMs);
                    }

                    if (isTillIAsk) {
                        const existing = pendingRolesMap.get(target.id) || [];
                        existing.push(role.id);
                        pendingRolesMap.set(target.id, existing);
                    }

                } catch (e) {}
            }

            if (tempTimeMs) {
                const mins = Math.round(tempTimeMs / 60000);
                return message.channel.send(`⏳ **Temporarily removed role ${role.name} from ${count} member(s) for ${mins} minute(s)!**`);
            } else if (isTillIAsk) {
                return message.channel.send(`📌 **Removed role ${role.name} from ${count} member(s). Saved for 'giveback'!**`);
            } else {
                return message.channel.send(`🗑️ **Removed role ${role.name} from ${count} member(s)!**`);
            }
        }

        // --- 10. WARN SYSTEM ---
        if (/\b(warn|warning)\b/i.test(contentLower) && !contentLower.includes('unwarn')) {
            if (mentions.size === 0) return message.reply('❌ Mention user to warn.');
            const target = mentions.first();
            const reason = message.content.split(/ +/).slice(3).join(' ') || 'No reason provided';

            const currentWarns = (warningsMap.get(target.id) || 0) + 1;
            warningsMap.set(target.id, currentWarns);

            return message.channel.send(`⚠️ **Warned ${target.user.tag}!** Total Warnings: **${currentWarns}** | Reason: ${reason}`);
        }

        // --- 11. UNWARN SYSTEM ---
        if (/\b(unwarn|remove warn)\b/i.test(contentLower)) {
            if (mentions.size === 0) return message.reply('❌ Mention user to unwarn.');
            const target = mentions.first();
            
            warningsMap.set(target.id, 0);
            return message.channel.send(`✅ **Cleared all warnings for ${target.user.tag}!**`);
        }

        // --- 12. LOCK CHANNEL ---
        if (/\b(lock channel|lockdown|lock)\b/i.test(contentLower) && !contentLower.includes('unlock')) {
            try {
                await message.channel.permissionOverwrites.edit(message.guild.roles.everyone, { SendMessages: false });
                return message.channel.send('🔒 **Channel has been locked!**');
            } catch (e) {
                return message.reply(`❌ Lock failed: ${e.message}`);
            }
        }

        // --- 13. UNLOCK CHANNEL ---
        if (/\b(unlock channel|unlock)\b/i.test(contentLower)) {
            try {
                await message.channel.permissionOverwrites.edit(message.guild.roles.everyone, { SendMessages: null });
                return message.channel.send('🔓 **Channel has been unlocked!**');
            } catch (e) {
                return message.reply(`❌ Unlock failed: ${e.message}`);
            }
        }

        // --- 14. SLOWMODE ---
        if (/\b(slowmode|slow mode)\b/i.test(contentLower)) {
            if (contentLower.includes('off') || contentLower.includes('0')) {
                await message.channel.setRateLimitPerUser(0);
                return message.channel.send('🚀 **Slowmode disabled!**');
            }

            const parsed = parseDuration(contentLower);
            const seconds = parsed ? Math.round(parsed / 1000) : 5;

            try {
                await message.channel.setRateLimitPerUser(seconds);
                return message.channel.send(`⏳ **Slowmode set to ${seconds} seconds!**`);
            } catch (e) {
                return message.reply(`❌ Failed to set slowmode: ${e.message}`);
            }
        }

        // --- 15. PURGE / CLEAR MESSAGES ---
        if (/\b(clear|delete|clean|purge)\b/i.test(contentLower)) {
            const amountMatch = contentLower.match(/\d+/);
            const amount = amountMatch ? parseInt(amountMatch[0]) : 10;

            if (amount < 1 || amount > 100) return message.reply('❌ Specify message count between 1 and 100.');

            try {
                await message.delete().catch(() => {});
                const deleted = await message.channel.bulkDelete(amount, true);
                const r = await message.channel.send(`🧹 Cleared **${deleted.size}** messages.`);
                setTimeout(() => r.delete().catch(() => {}), 3000);
                return;
            } catch (e) {
                return message.reply(`❌ Could not delete messages: ${e.message}`);
            }
        }

        // --- 16. CHANGE NICKNAME ---
        if (/\b(nick|nickname|set nick)\b/i.test(contentLower) && !contentLower.includes('reset')) {
            if (mentions.size === 0) return message.reply('❌ Mention user to change nickname.');
            
            const target = mentions.first();
            const args = message.content.split(/ +/);
            const newNick = args.slice(3).join(' ') || null;

            try {
                await target.setNickname(newNick);
                return message.channel.send(`🏷️ **Updated nickname for ${target.user.tag}!**`);
            } catch (e) {
                return message.reply(`❌ Failed to change nickname: ${e.message}`);
            }
        }

        // --- 17. RESET NICKNAME ---
        if (/\b(reset nick|reset nickname)\b/i.test(contentLower)) {
            if (mentions.size === 0) return message.reply('❌ Mention user to reset nickname.');
            const target = mentions.first();
            try {
                await target.setNickname(null);
                return message.channel.send(`🏷️ **Reset nickname for ${target.user.tag}!**`);
            } catch (e) {
                return message.reply(`❌ Reset failed: ${e.message}`);
            }
        }

        // --- 18. USER INFO ---
        if (/\b(userinfo|whois|user info)\b/i.test(contentLower)) {
            const target = mentions.first() || message.member;
            const infoEmbed = new EmbedBuilder()
                .setTitle(`👤 User Info - ${target.user.tag}`)
                .setThumbnail(target.user.displayAvatarURL())
                .setColor('#00FFFF')
                .addFields(
                    { name: '🆔 User ID', value: target.id, inline: true },
                    { name: '📅 Joined Server', value: `<t:${Math.floor(target.joinedTimestamp / 1000)}:R>`, inline: true },
                    { name: '🚀 Account Created', value: `<t:${Math.floor(target.user.createdTimestamp / 1000)}:R>`, inline: true }
                );
            return message.reply({ embeds: [infoEmbed] });
        }

        return message.reply('❓ Action samajh nahi aaya! `HB Action List` type karke saare commands dekhein.');
    }

    // Dot Commands (.kick, .ban, .unban)
    if (message.content.startsWith('.')) {
        const args = message.content.slice(1).trim().split(/ +/);
        const command = args.shift().toLowerCase();

        if (command === 'kick') {
            if (!message.member.permissions.has(PermissionsBitField.Flags.KickMembers)) return;
            const target = message.mentions.members.first();
            if (!target) return message.reply('❌ Mention a member.');
            const reason = args.slice(1).join(' ') || 'No reason';
            try {
                await target.kick(reason);
                message.channel.send(`MB **${target.user.tag}** was kicked!`);
            } catch (e) {}
        }

        if (command === 'ban') {
            if (!message.member.permissions.has(PermissionsBitField.Flags.BanMembers)) return;
            const target = message.mentions.members.first();
            if (!target) return message.reply('❌ Mention a member.');
            const reason = args.slice(1).join(' ') || 'No reason';
            try {
                await target.ban({ reason });
                message.channel.send(`🔨 **${target.user.tag}** was banned!`);
            } catch (e) {}
        }

        if (command === 'unban') {
            if (!message.member.permissions.has(PermissionsBitField.Flags.BanMembers)) return;
            const userId = args[0];
            if (!userId) return message.reply('❌ Provide User ID.');
            try {
                await message.guild.members.unban(userId);
                message.channel.send(`✅ Unbanned User ID: **${userId}**`);
            } catch (e) {}
        }
    }

    // Exclamation Commands
    if (message.content.startsWith(PREFIX)) {
        const args = message.content.slice(PREFIX.length).trim().split(/ +/);
        const command = args.shift().toLowerCase();

        if (command === 'ticketsetup') {
            if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
                return message.reply('❌ Keval Admin hi ticket panel setup kar sakta he!');
            }

            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId('create_ticket')
                    .setLabel('📩 Open Ticket')
                    .setStyle(ButtonStyle.Primary)
            );

            const setupEmbed = new EmbedBuilder()
                .setTitle('🎫 HerryHacks Support System')
                .setDescription('Staff ya Owner se kisi help ya script issue ke liye niche button par click karke ticket open karein.')
                .setColor('#0099FF');

            await message.channel.send({ embeds: [setupEmbed], components: [row] });
            return message.delete().catch(() => {});
        }

        if (command === 'ping') {
            return message.reply(`🏓 Pong! API Latency is **${client.ws.ping}ms**.`);
        }

        if (command === 'clear') {
            if (!message.member.permissions.has(PermissionsBitField.Flags.ManageMessages)) return;
            const amount = parseInt(args[0]);
            if (!amount || amount < 1 || amount > 100) return message.reply('❌ Specify 1-100 messages.');
            try {
                await message.delete().catch(() => {});
                const deleted = await message.channel.bulkDelete(amount, true);
                const r = await message.channel.send(`🧹 Cleared **${deleted.size}** messages.`);
                setTimeout(() => r.delete().catch(() => {}), 4000);
            } catch (e) {}
        }
    }
});

// Bot Login
const botToken = process.env.TOKEN || process.env.DISCORD_TOKEN;
client.login(botToken);
