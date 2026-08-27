// ===================================================
// HERRY HACKS BOT - COMPLETE & SECURED INDEX.JS
// ===================================================

const { 
    Client, 
    GatewayIntentBits, 
    Partials, 
    Collection, 
    EmbedBuilder, 
    ActionRowBuilder, 
    ButtonBuilder, 
    ButtonStyle, 
    PermissionsBitField, 
    ChannelType,
    REST,
    Routes
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

client.commands = new Collection();
const PREFIX = '!';

// ---------------------------------------------------
// 1. LOAD SLASH COMMANDS FROM FOLDER
// ---------------------------------------------------
const commands = [];
const commandsPath = path.join(__dirname, 'commands');

if (fs.existsSync(commandsPath)) {
    const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

    for (const file of commandFiles) {
        const filePath = path.join(commandsPath, file);
        const command = require(filePath);
        if ('data' in command && 'execute' in command) {
            client.commands.set(command.data.name, command);
            commands.push(command.data.toJSON());
        }
    }
}

// ---------------------------------------------------
// 2. BOT READY & REGISTER SLASH COMMANDS
// ---------------------------------------------------
client.once('ready', async () => {
    console.log(`✅ [HERRY BOT] Logged in as ${client.user.tag}`);
    client.user.setActivity('HerryHacks VIP | /ticketsetup', { type: 3 });

    const rest = new REST({ version: '10' }).setToken(process.env.TOKEN || process.env.DISCORD_TOKEN);

    try {
        console.log('🔄 Registering Slash Commands...');
        await rest.put(
            Routes.applicationCommands(client.user.id),
            { body: commands }
        );
        console.log('✅ All Slash Commands Registered Successfully!');
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
    const channel = member.guild.channels.cache.get(channelId.trim());
    if (!channel) return;

    const welcomeEmbed = new EmbedBuilder()
        .setTitle('👑 Welcome to HerryHacks Official! 👑')
        .setDescription(`Hey ${member}, welcome to the server!`)
        .setColor('#00FF00')
        .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
        .setTimestamp();

    channel.send({ content: `👋 Welcome ${member}!`, embeds: [welcomeEmbed] });
});

client.on('guildMemberRemove', async (member) => {
    const channelId = process.env.LEAVE_CHANNEL_ID;
    if (!channelId) return;
    const channel = member.guild.channels.cache.get(channelId.trim());
    if (!channel) return;

    const leaveEmbed = new EmbedBuilder()
        .setTitle('👋 Member Left')
        .setDescription(`**${member.user.tag}** left the server.`)
        .setColor('#FF0000')
        .setTimestamp();

    channel.send({ embeds: [leaveEmbed] });
});

// ---------------------------------------------------
// 4. MAIN INTERACTION HANDLER (COMMANDS & TICKET BUTTONS)
// ---------------------------------------------------
client.on('interactionCreate', async (interaction) => {
    
    // Execute Slash Commands from commands/ folder
    if (interaction.isChatInputCommand()) {
        const command = client.commands.get(interaction.commandName);
        if (!command) return;

        try {
            await command.execute(interaction);
        } catch (error) {
            console.error(error);
            await interaction.reply({ content: '❌ Command execute karne me error aaya! / An error occurred while executing the command!', ephemeral: true });
        }
    }

    // Button Click Interactions
    if (interaction.isButton()) {

        // Open Ticket Button
        if (interaction.customId === 'create_ticket') {
            await interaction.deferReply({ ephemeral: true });

            const cleanName = `ticket-${interaction.user.username.toLowerCase().replace(/[^a-z0-9]/g, '')}`;
            const existingChannel = interaction.guild.channels.cache.find(c => c.name === cleanName);

            if (existingChannel) {
                return interaction.editReply({ content: `❌ Aapka ticket pehle se open hai: ${existingChannel} / Your ticket is already open: ${existingChannel}` });
            }

            try {
                // Strict Permission Overwrites (Deny Manage Channels and Delete permissions for everyone except owner/bot/staff)
                const permissionOverwrites = [
                    {
                        id: interaction.guild.roles.everyone.id,
                        deny: [
                            PermissionsBitField.Flags.ViewChannel,
                            PermissionsBitField.Flags.ManageChannels,
                            PermissionsBitField.Flags.ManageWebhooks
                        ]
                    },
                    {
                        id: interaction.user.id,
                        allow: [
                            PermissionsBitField.Flags.ViewChannel, 
                            PermissionsBitField.Flags.SendMessages, 
                            PermissionsBitField.Flags.ReadMessageHistory
                        ],
                        deny: [
                            PermissionsBitField.Flags.ManageChannels // Explicitly block user from deleting/managing the channel directly via settings
                        ]
                    },
                    {
                        id: client.user.id,
                        allow: [
                            PermissionsBitField.Flags.ViewChannel, 
                            PermissionsBitField.Flags.SendMessages, 
                            PermissionsBitField.Flags.ManageChannels
                        ]
                    }
                ];

                // Add Staff Role Permissions (Optional via ENV)
                const rawStaff = process.env.STAFF_ROLE_ID;
                if (rawStaff && rawStaff.trim().length >= 17) {
                    const cleanStaffId = rawStaff.trim();
                    if (interaction.guild.roles.cache.has(cleanStaffId)) {
                        permissionOverwrites.push({
                            id: cleanStaffId,
                            allow: [
                                PermissionsBitField.Flags.ViewChannel, 
                                PermissionsBitField.Flags.SendMessages, 
                                PermissionsBitField.Flags.ReadMessageHistory
                            ]
                        });
                    }
                }

                // AUTOMATIC CATEGORY CREATION (No ID required)
                let category = interaction.guild.channels.cache.find(
                    c => c.name.toUpperCase() === 'TICKETS' && c.type === ChannelType.GuildCategory
                );

                if (!category) {
                    category = await interaction.guild.channels.create({
                        name: 'TICKETS',
                        type: ChannelType.GuildCategory
                    });
                }

                const channelOptions = {
                    name: cleanName,
                    type: ChannelType.GuildText,
                    parent: category.id,
                    permissionOverwrites: permissionOverwrites,
                    topic: `ticket_owner_${interaction.user.id}` // Storing Owner ID safely in channel topic
                };

                const ticketChannel = await interaction.guild.channels.create(channelOptions);

                const closeBtn = new ActionRowBuilder().addComponents(
                    new ButtonBuilder()
                        .setCustomId('close_ticket')
                        .setLabel('🔒 Close Ticket')
                        .setStyle(ButtonStyle.Danger)
                );

                const ticketEmbed = new EmbedBuilder()
                    .setTitle('🎫 Support Ticket')
                    .setDescription(`Welcome ${interaction.user}!\nApna masla yahan likhein, Staff jald reply karega.\n\n**\n*(Write your issue here, Staff will reply soon. Only ticket owner or staff can close this.)*`)
                    .setColor('#00ffcc')
                    .setTimestamp();

                await ticketChannel.send({ content: `${interaction.user}`, embeds: [ticketEmbed], components: [closeBtn] });
                await interaction.editReply({ content: `✅ Ticket ban gaya hai / Ticket created: ${ticketChannel}` });

            } catch (err) {
                console.error("Ticket Creation Error:", err);
                await interaction.editReply({ content: '❌ Ticket create nahi ho saka! Check karein ki **HerryBot** Role Server Settings me top par ho aur Administrator permission active ho.' });
            }
        }

        // Close Ticket Button (ULTRA SECURED)
        if (interaction.customId === 'close_ticket') {
            const channel = interaction.channel;
            const member = interaction.member;

            // Check if user is Admin or Staff
            const isAdminOrStaff = member.permissions.has(PermissionsBitField.Flags.Administrator) || 
                                   (process.env.STAFF_ROLE_ID && member.roles.cache.has(process.env.STAFF_ROLE_ID.trim()));

            // Check if user is the exact ticket owner using channel topic
            const channelTopic = channel.topic || '';
            const isTicketOwner = channelTopic === `ticket_owner_${interaction.user.id}`;

            // Fallback check via channel name if topic is missing
            const cleanUserName = interaction.user.username.toLowerCase().replace(/[^a-z0-9]/g, '');
            const isNameMatch = channel.name.includes(cleanUserName);

            if (!isAdminOrStaff && !isTicketOwner && !isNameMatch) {
                return interaction.reply({ 
                    content: '❌ Aap ye ticket close nahi kar sakte! Sirf ticket banane wala user ya Server Staff hi ise close kar sakta hai.\n*(You cannot close this ticket! Only the ticket creator or Server Staff can close it.)*', 
                    ephemeral: true 
                });
            }

            await interaction.reply({ content: '🔒 Ticket 5 seconds me delete ho raha / deleting in 5 seconds...', ephemeral: true });
            setTimeout(() => {
                if (interaction.channel) interaction.channel.delete().catch(() => {});
            }, 5000);
        }
    }
});

// ---------------------------------------------------
// 5. LEGACY PREFIX & MODERATION COMMANDS
// ---------------------------------------------------
client.on('messageCreate', async (message) => {
    if (message.author.bot || !message.guild) return;

    if (message.content.startsWith('.')) {
        const args = message.content.slice(1).trim().split(/ +/);
        const command = args.shift().toLowerCase();

        if (command === 'kick') {
            if (!message.member.permissions.has(PermissionsBitField.Flags.KickMembers)) return;
            const target = message.mentions.members.first();
            if (!target) return message.reply('❌ Member mention karein / Please mention a member.');
            try {
                await target.kick();
                message.channel.send(`👞 **${target.user.tag}** kick ho gaya / has been kicked.`);
            } catch (e) {}
        }

        if (command === 'ban') {
            if (!message.member.permissions.has(PermissionsBitField.Flags.BanMembers)) return;
            const target = message.mentions.members.first();
            if (!target) return message.reply('❌ Member mention karein / Please mention a member.');
            try {
                await target.ban();
                message.channel.send(`🔨 **${target.user.tag}** ban ho gaya / has been banned.`);
            } catch (e) {}
        }

        if (command === 'unban') {
            if (!message.member.permissions.has(PermissionsBitField.Flags.BanMembers)) return;
            const userId = args[0];
            if (!userId) return message.reply('❌ User ID dein / Please provide a User ID.');
            try {
                await message.guild.members.unban(userId);
                message.channel.send(`✅ ID: **${userId}** unban ho gaya / unbanned.`);
            } catch (e) {}
        }
    }

    if (message.content.startsWith(PREFIX)) {
        const args = message.content.slice(PREFIX.length).trim().split(/ +/);
        const command = args.shift().toLowerCase();

        if (command === 'ping') return message.reply(`🏓 Latency: **${client.ws.ping}ms**`);

        if (command === 'clear') {
            if (!message.member.permissions.has(PermissionsBitField.Flags.ManageMessages)) return;
            const amount = parseInt(args[0]);
            if (!amount || amount < 1 || amount > 100) return message.reply('❌ 1-100 number dein / Provide a number between 1-100.');
            try {
                await message.delete().catch(() => {});
                const deleted = await message.channel.bulkDelete(amount, true);
                const msg = await message.channel.send(`🧹 Cleared **${deleted.size}** messages.`);
                setTimeout(() => msg.delete().catch(() => {}), 4000);
            } catch (e) {}
        }
    }
});

// ---------------------------------------------------
// 6. BOT LOGIN
// ---------------------------------------------------
const botToken = process.env.TOKEN || process.env.DISCORD_TOKEN;
client.login(botToken);
