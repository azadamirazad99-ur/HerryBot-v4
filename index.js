// ===================================================
// HERRY HACKS BOT - COMPLETE & FIXED INDEX.JS
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
    ChannelType 
} = require('discord.js');
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

// Settings & Config
const PREFIX = '!';

// ---------------------------------------------------
// 1. BOT READY EVENT
// ---------------------------------------------------
client.once('ready', () => {
    console.log(`✅ [HERRY BOT] Connected as ${client.user.tag}`);
    client.user.setActivity('HerryHacks VIP | !help', { type: 3 });
});

// ---------------------------------------------------
// 2. WELCOME SYSTEM
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

// ---------------------------------------------------
// 3. LEAVE SYSTEM
// ---------------------------------------------------
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
// 4. FIXED TICKET BUTTON INTERACTION (NO TIMEOUT ERROR)
// ---------------------------------------------------
client.on('interactionCreate', async (interaction) => {
    if (!interaction.isButton()) return;

    // Create Ticket Action
    if (interaction.customId === 'create_ticket') {
        // Instant ACK to prevent "Application did not respond"
        await interaction.deferReply({ ephemeral: true });

        const ticketChannelName = `ticket-${interaction.user.username}`.toLowerCase().replace(/[^a-z0-9-_]/g, '');
        
        // Duplicate check
        const existingChannel = interaction.guild.channels.cache.find(c => c.name === ticketChannelName);
        if (existingChannel) {
            return interaction.editReply({ content: `❌ Aapka ticket pehle se open hai: ${existingChannel}` });
        }

        try {
            const rawCategoryId = process.env.TICKET_CATEGORY_ID;
            const categoryId = (rawCategoryId && rawCategoryId.length > 5) ? rawCategoryId : null;
            const staffRoleId = process.env.STAFF_ROLE_ID;

            const permissionOverwrites = [
                {
                    id: interaction.guild.id,
                    deny: [PermissionsBitField.Flags.ViewChannel]
                },
                {
                    id: interaction.user.id,
                    allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.ReadMessageHistory]
                },
                {
                    id: client.user.id,
                    allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.ManageChannels]
                }
            ];

            if (staffRoleId && staffRoleId.length > 10) {
                permissionOverwrites.push({
                    id: staffRoleId,
                    allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages]
                });
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
            await interaction.editReply({ content: `✅ Ticket create ho gaya hai: ${ticketChannel}` });

        } catch (error) {
            console.error("Ticket Creation Error:", error);
            await interaction.editReply({ content: `❌ Ticket banane me error aaya! Check karein ki bot ke paas Manage Channels permission hai ya nahi.` });
        }
    }

    // Close Ticket Action
    if (interaction.customId === 'close_ticket') {
        await interaction.reply({ content: '🔒 Is ticket ko 5 seconds me delete kiya ja raha hai...', ephemeral: true });
        setTimeout(() => {
            if (interaction.channel) interaction.channel.delete().catch(() => {});
        }, 5000);
    }
});

// ---------------------------------------------------
// 5. COMMAND HANDLER
// ---------------------------------------------------
client.on('messageCreate', async (message) => {
    if (message.author.bot || !message.guild) return;

    // Dot Commands (.kick, .ban, .unban)
    if (message.content.startsWith('.')) {
        const args = message.content.slice(1).trim().split(/ +/);
        const command = args.shift().toLowerCase();

        if (command === 'kick') {
            if (!message.member.permissions.has(PermissionsBitField.Flags.KickMembers)) return;
            const target = message.mentions.members.first();
            if (!target) return message.reply('❌ Member ko mention karein.');
            const reason = args.slice(1).join(' ') || 'No reason specified';
            try {
                await target.kick(reason);
                message.channel.send(`👞 **${target.user.tag}** ko kick kar diya gaya.`);
            } catch (e) {
                message.reply('❌ Kick karne me error aaya.');
            }
        }

        if (command === 'ban') {
            if (!message.member.permissions.has(PermissionsBitField.Flags.BanMembers)) return;
            const target = message.mentions.members.first();
            if (!target) return message.reply('❌ Member ko mention karein.');
            const reason = args.slice(1).join(' ') || 'No reason specified';
            try {
                await target.ban({ reason });
                message.channel.send(`🔨 **${target.user.tag}** ko ban kar diya gaya.`);
            } catch (e) {
                message.reply('❌ Ban karne me error aaya.');
            }
        }

        if (command === 'unban') {
            if (!message.member.permissions.has(PermissionsBitField.Flags.BanMembers)) return;
            const userId = args[0];
            if (!userId) return message.reply('❌ User ID dein.');
            try {
                await message.guild.members.unban(userId);
                message.channel.send(`✅ ID: **${userId}** ko unban kar diya gaya.`);
            } catch (e) {
                message.reply('❌ Unban karne me error aaya. Valid ID check karein.');
            }
        }
    }

    // Exclamation Commands (!ticketsetup, !help, !ping, !clear, !timeout, !rta)
    if (message.content.startsWith(PREFIX)) {
        const args = message.content.slice(PREFIX.length).trim().split(/ +/);
        const command = args.shift().toLowerCase();

        // Ticket Setup (Admin Only)
        if (command === 'ticketsetup') {
            if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
                return message.reply('❌ Sirf Admin hi ticket panel create kar sakta hai!');
            }

            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId('create_ticket')
                    .setLabel('📩 Open Ticket')
                    .setStyle(ButtonStyle.Primary)
            );

            const setupEmbed = new EmbedBuilder()
                .setTitle('🎫 HerryHacks Support Panel')
                .setDescription('Help ya query ke liye niche button par click karke ticket open karein.')
                .setColor('#0099FF');

            await message.channel.send({ embeds: [setupEmbed], components: [row] });
            return message.delete().catch(() => {});
        }

        // !help
        if (command === 'help') {
            const helpEmbed = new EmbedBuilder()
                .setTitle('👑 Herry Bot Command List')
                .setColor('#FFD700')
                .addFields(
                    { name: '!ticketsetup', value: 'Support Panel deploy karein (Admin)' },
                    { name: '!ping', value: 'Bot latency check karein' },
                    { name: '!clear [amount]', value: 'Messages delete karein (1-100)' },
                    { name: '!timeout @user [mins]', value: 'Member ko mute karein' },
                    { name: '!rta @user', value: 'Timeout remove karein' },
                    { name: '.kick / .ban / .unban', value: 'Moderation commands' }
                );
            return message.reply({ embeds: [helpEmbed] });
        }

        // !ping
        if (command === 'ping') {
            return message.reply(`🏓 Pong! Latency: **${client.ws.ping}ms**`);
        }

        // !clear
        if (command === 'clear') {
            if (!message.member.permissions.has(PermissionsBitField.Flags.ManageMessages)) return;
            const amount = parseInt(args[0]);
            if (!amount || amount < 1 || amount > 100) return message.reply('❌ 1 se 100 tak ka number dein.');
            try {
                await message.delete().catch(() => {});
                const deleted = await message.channel.bulkDelete(amount, true);
                const msg = await message.channel.send(`🧹 **${deleted.size}** messages clean kar diye gaye.`);
                setTimeout(() => msg.delete().catch(() => {}), 4000);
            } catch (e) {}
        }

        // !timeout / !mute
        if (command === 'timeout' || command === 'mute') {
            if (!message.member.permissions.has(PermissionsBitField.Flags.ModerateMembers)) return;
            const target = message.mentions.members.first();
            const minutes = parseInt(args[1]);
            if (!target || !minutes || isNaN(minutes)) return message.reply('❌ Usage: `!timeout @user 10`');
            try {
                await target.timeout(minutes * 60 * 1000);
                message.channel.send(`⏳ **${target.user.tag}** ko ${minutes} minutes ke liye mute kar diya.`);
            } catch (e) {}
        }

        // !rta (Remove Timeout)
        if (command === 'rta') {
            if (!message.member.permissions.has(PermissionsBitField.Flags.ModerateMembers)) return;
            const target = message.mentions.members.first();
            if (!target) return message.reply('❌ User ko mention karein.');
            try {
                await target.timeout(null);
                message.channel.send(`✅ **${target.user.tag}** ka timeout hata diya gaya.`);
            } catch (e) {}
        }
    }
});

// Login
const botToken = process.env.TOKEN || process.env.DISCORD_TOKEN;
client.login(botToken);
