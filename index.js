// ===================================================
// HERRY HACKS BOT - CLEAN UTILITY & SUPPORT SYSTEM
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
    SlashCommandBuilder
} = require('discord.js');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.DirectMessages
    ],
    partials: [Partials.Channel, Partials.Message, Partials.GuildMember]
});

// Settings & Config
const PREFIX = '!';
const OWNER_ID = process.env.OWNER_ID || 'YOUR_DISCORD_USER_ID'; // Apni Discord User ID yahan daalein ya .env me OWNER_ID rakhein
const CREDITS_FILE = path.join(__dirname, 'credits.json');

// Helper Functions for Credit System
function getCredits() {
    if (!fs.existsSync(CREDITS_FILE)) {
        fs.writeFileSync(CREDITS_FILE, '{}', 'utf8');
    }
    try {
        return JSON.parse(fs.readFileSync(CREDITS_FILE, 'utf8'));
    } catch (e) {
        return {};
    }
}

function addCredits(userId, amount) {
    const data = getCredits();
    data[userId] = (data[userId] || 0) + amount;
    fs.writeFileSync(CREDITS_FILE, JSON.stringify(data, null, 2));
    return data[userId];
}

// ---------------------------------------------------
// 1. BOT READY EVENT & SLASH COMMAND REGISTRATION
// ---------------------------------------------------
client.once('ready', async () => {
    console.log(`✅ [HERRY BOT] Connected as ${client.user.tag}`);
    client.user.setActivity('HerryHacks VIP | !help', { type: 3 });

    // Slash Commands Definition
    const commands = [
        new SlashCommandBuilder()
            .setName('givecredit')
            .setDescription('Give DM credits to a user (Owner Only)')
            .addUserOption(option => 
                option.setName('user')
                    .setDescription('Target user to receive credits')
                    .setRequired(true))
            .addIntegerOption(option => 
                option.setName('amount')
                    .setDescription('Number of credits')
                    .setRequired(true)),

        new SlashCommandBuilder()
            .setName('senddm')
            .setDescription('Send a direct message to a user (Costs 10 credits per message)')
            .addUserOption(option => 
                option.setName('user')
                    .setDescription('Target user')
                    .setRequired(true))
            .addStringOption(option => 
                option.setName('message')
                    .setDescription('Message content to send')
                    .setRequired(true))
    ].map(cmd => cmd.toJSON());

    const rest = new REST({ version: '10' }).setToken(process.env.TOKEN || process.env.DISCORD_TOKEN);

    try {
        console.log('🔄 Registering Slash Commands...');
        await rest.put(
            Routes.applicationCommands(client.user.id),
            { body: commands }
        );
        console.log('✅ Slash Commands Successfully Registered!');
    } catch (err) {
        console.error('❌ Failed to register slash commands:', err);
    }
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
// 4. INTERACTION HANDLER (BUTTONS & SLASH COMMANDS)
// ---------------------------------------------------
client.on('interactionCreate', async (interaction) => {
    // --- BUTTON INTERACTIONS ---
    if (interaction.isButton()) {
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
        return;
    }

    // --- SLASH COMMAND INTERACTIONS ---
    if (interaction.isChatInputCommand()) {
        const { commandName, options, user } = interaction;

        // /givecredit Command
        if (commandName === 'givecredit') {
            if (user.id !== OWNER_ID) {
                return interaction.reply({ content: '❌ Sirf **Owner** ye command use kar sakta hai!', ephemeral: true });
            }

            const targetUser = options.getUser('user');
            const amount = options.getInteger('amount');

            const total = addCredits(targetUser.id, amount);
            return interaction.reply({ 
                content: `✅ Successfully added **${amount}** credits to ${targetUser.tag}. New Balance: **${total}**`, 
                ephemeral: true 
            });
        }

        // /senddm Command
        if (commandName === 'senddm') {
            const targetUser = options.getUser('user');
            const msgContent = options.getString('message');
            const isOwner = (user.id === OWNER_ID);
            const COST = 10;

            const userBalance = getCredits()[user.id] || 0;

            if (!isOwner && userBalance < COST) {
                return interaction.reply({ 
                    content: `❌ Aapke paas kaafi credits nahi hain! Required: **${COST}** credits. Current Balance: **${userBalance}**`, 
                    ephemeral: true 
                });
            }

            try {
                // Deduct credits if not owner
                if (!isOwner) {
                    addCredits(user.id, -COST);
                }

                await targetUser.send(`📩 **Message from ${user.username}:**\n${msgContent}`);
                
                return interaction.reply({ 
                    content: `✅ Message sent to **${targetUser.tag}**! ${!isOwner ? `(10 Credits deducted. Remaining: ${userBalance - COST})` : ''}`, 
                    ephemeral: true 
                });
            } catch (err) {
                // Refund credits if DM failed
                if (!isOwner) {
                    addCredits(user.id, COST);
                }
                return interaction.reply({ 
                    content: `❌ Message nahi bheja ja saka! User ke DMs closed ho sakte hain.`, 
                    ephemeral: true 
                });
            }
        }
    }
});

// ---------------------------------------------------
// 5. PREFIX COMMANDS & MODERATION SYSTEM
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
            if (!target) return message.reply('❌ Mention a member.');
            const reason = args.slice(1).join(' ') || 'No reason';
            try {
                await target.kick(reason);
                message.channel.send(`👞 **${target.user.tag}** was kicked!`);
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

    // Exclamation Commands (!ticketsetup, !help, !ping, !clear, !timeout, !rta)
    if (message.content.startsWith(PREFIX)) {
        const args = message.content.slice(PREFIX.length).trim().split(/ +/);
        const command = args.shift().toLowerCase();

        // Ticket Panel Setup Command (Admin Only)
        if (command === 'ticketsetup') {
            if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
                return message.reply('❌ Keyewal Admin hi ticket panel setup kar sakta he!');
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

        // !help Command
        if (command === 'help') {
            const helpEmbed = new EmbedBuilder()
                .setTitle('👑 Herry Bot Commands Panel')
                .setColor('#FFD700')
                .addFields(
                    { name: '!ticketsetup', value: 'Deploy ticket creation button (Admin Only)' },
                    { name: '!ping', value: 'Check bot latency' },
                    { name: '!clear [amount]', value: 'Delete bulk messages (1-100)' },
                    { name: '!timeout @user [mins]', value: 'Mute member' },
                    { name: '!rta @user', value: 'Remove timeout' },
                    { name: '/givecredit', value: 'Give DM credits to user (Owner Only)' },
                    { name: '/senddm', value: 'Send direct message via bot (10 credits)' },
                    { name: '.kick / .ban / .unban', value: 'Moderation commands' }
                );
            return message.reply({ embeds: [helpEmbed] });
        }

        // !ping Command
        if (command === 'ping') {
            return message.reply(`🏓 Pong! API Latency is **${client.ws.ping}ms**.`);
        }

        // !clear Command
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

        // !timeout / !mute Command
        if (command === 'timeout' || command === 'mute') {
            if (!message.member.permissions.has(PermissionsBitField.Flags.ModerateMembers)) return;
            const target = message.mentions.members.first();
            const minutes = parseInt(args[1]);
            if (!target || !minutes || isNaN(minutes)) return message.reply('❌ Usage: `!timeout @user 10`');
            try {
                await target.timeout(minutes * 60 * 1000);
                message.channel.send(`⏳ **${target.user.tag}** timed out for ${minutes} minutes.`);
            } catch (e) {}
        }

        // !rta Command (Remove Timeout)
        if (command === 'rta') {
            if (!message.member.permissions.has(PermissionsBitField.Flags.ModerateMembers)) return;
            const target = message.mentions.members.first();
            if (!target) return message.reply('❌ Mention user.');
            try {
                await target.timeout(null);
                message.channel.send(`✅ Timeout removed for **${target.user.tag}**.`);
            } catch (e) {}
        }
    }
});

// Bot Login
const botToken = process.env.TOKEN || process.env.DISCORD_TOKEN;
client.login(botToken);
