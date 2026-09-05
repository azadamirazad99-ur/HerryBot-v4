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
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessageReactions // Added for Reaction Role
    ],
    partials: [Partials.Channel, Partials.Message, Partials.GuildMember, Partials.Reaction, Partials.User]
});

client.commands = new Collection();
const PREFIX = '!';

// REACTION ROLE CONFIGURATION (Yahan Apni Details Adjust Karein)
const REACTION_CONFIG = {
    messageId: process.env.REACTION_MESSAGE_ID || "123456789012345678", // Command se setup karne par auto-update bhi hoga
    emoji: "✅",                                                        // Emoji jo click karna hai
    roleId: process.env.REACTION_ROLE_ID || "1529467733161283654"      // Role Jo Dena Hai
};

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
// 4. REACTION ROLE SYSTEM (ADD & REMOVE)
// ---------------------------------------------------
client.on('messageReactionAdd', async (reaction, user) => {
    if (user.bot) return;

    if (reaction.partial) {
        try {
            await reaction.fetch();
        } catch (error) {
            console.error('Error fetching reaction message:', error);
            return;
        }
    }

    if (reaction.message.id === REACTION_CONFIG.messageId && reaction.emoji.name === REACTION_CONFIG.emoji) {
        try {
            const guild = reaction.message.guild;
            const member = await guild.members.fetch(user.id);
            const role = guild.roles.cache.get(REACTION_CONFIG.roleId);

            if (role && member) {
                await member.roles.add(role);
                console.log(`✅ [ReactionRole] Added ${role.name} to ${user.tag}`);
            }
        } catch (err) {
            console.error('Reaction Role Add Error:', err);
        }
    }
});

client.on('messageReactionRemove', async (reaction, user) => {
    if (user.bot) return;

    if (reaction.partial) {
        try {
            await reaction.fetch();
        } catch (error) {
            return;
        }
    }

    if (reaction.message.id === REACTION_CONFIG.messageId && reaction.emoji.name === REACTION_CONFIG.emoji) {
        try {
            const guild = reaction.message.guild;
            const member = await guild.members.fetch(user.id);
            const role = guild.roles.cache.get(REACTION_CONFIG.roleId);

            if (role && member) {
                await member.roles.remove(role);
                console.log(`🗑️ [ReactionRole] Removed ${role.name} from ${user.tag}`);
            }
        } catch (err) {
            console.error('Reaction Role Remove Error:', err);
        }
    }
});

// ---------------------------------------------------
// 5. MAIN INTERACTION HANDLER (COMMANDS & TICKET BUTTONS)
// ---------------------------------------------------
client.on('interactionCreate', async (interaction) => {

    if (interaction.isChatInputCommand()) {
        const command = client.commands.get(interaction.commandName);
        if (!command) return;

        try {
            await command.execute(interaction);
        } catch (error) {
            console.error(error);
            await interaction.reply({ content: '❌ Command execute karne me error aaya!', ephemeral: true });
        }
    }

    if (interaction.isButton()) {

        if (interaction.customId === 'create_ticket') {
            await interaction.deferReply({ ephemeral: true });

            const cleanName = `ticket-${interaction.user.username.toLowerCase().replace(/[^a-z0-9]/g, '')}`;
            const existingChannel = interaction.guild.channels.cache.find(c => c.name === cleanName);

            if (existingChannel) {
                return interaction.editReply({ content: `❌ Aapka ticket pehle se open hai: ${existingChannel}` });
            }

            try {
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
                            PermissionsBitField.Flags.ManageChannels
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
                    permissionOverwrites: permissionOverwrites
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
                    .setDescription(`Welcome ${interaction.user}!\nApna masla yahan likhein, Staff jald reply karega.\n\n*(Please state your issue here, Staff will assist you shortly.)*`)
                    .setColor('#00ffcc')
                    .setTimestamp();

                await ticketChannel.send({ 
                    content: `Welcome ${interaction.user}!`, 
                    embeds: [ticketEmbed], 
                    components: [closeBtn] 
                });

                const adminRoleId = '1529467733161283654';
                const adminChannelId = '1529478417907716178';
                const adminChannel = interaction.guild.channels.cache.get(adminChannelId);

                if (adminChannel) {
                    await adminChannel.send({
                        content: `<@&${adminRoleId}> **New Ticket Alert!**\nUser ${interaction.user} has created a new ticket.\n👉 **Reach out here for help:** ${ticketChannel}`
                    });
                }

                await interaction.editReply({ content: `✅ Ticket ban gaya hai: ${ticketChannel}` });

            } catch (err) {
                console.error("Ticket Creation Error:", err);
                await interaction.editReply({ content: '❌ Ticket create nahi ho saka!' });
            }
        }

        if (interaction.customId === 'close_ticket') {
            const member = interaction.member;

            const isAdminOrStaff = member.permissions.has(PermissionsBitField.Flags.Administrator) || 
                                   (process.env.STAFF_ROLE_ID && member.roles.cache.has(process.env.STAFF_ROLE_ID.trim()));

            if (!isAdminOrStaff) {
                return interaction.reply({ 
                    content: '❌ Aap ye ticket close nahi kar sakte! Sirf Admin / Staff hi ticket close kar sakte hain.', 
                    ephemeral: true 
                });
            }

            await interaction.reply({ content: '🔒 Ticket 5 seconds me delete ho raha hai...', ephemeral: true });
            setTimeout(() => {
                if (interaction.channel) interaction.channel.delete().catch(() => {});
            }, 5000);
        }
    }
});

// ---------------------------------------------------
// 6. LEGACY PREFIX, MODERATION & SETUP COMMANDS
// ---------------------------------------------------
client.on('messageCreate', async (message) => {
    if (message.author.bot || !message.guild) return;

    // REACTION ROLE SETUP COMMAND (.rrsetup)
    if (message.content.startsWith('.rrsetup')) {
        if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
            return message.reply('❌ System: Aapke paas permissions nahi hain!');
        }

        const embed = new EmbedBuilder()
            .setTitle('🎭 Get Member Role')
            .setDescription(`Click on the ${REACTION_CONFIG.emoji} reaction below to get your role!`)
            .setColor('#00FFCC');

        const msg = await message.channel.send({ embeds: [embed] });
        await msg.react(REACTION_CONFIG.emoji);

        // Update active message ID dynamically
        REACTION_CONFIG.messageId = msg.id;
        console.log(`✅ Reaction Role setup created. Message ID: ${msg.id}`);
        return;
    }

    if (message.content.startsWith('.')) {
        const args = message.content.slice(1).trim().split(/ +/);
        const command = args.shift().toLowerCase();

        if (command === 'kick') {
            if (!message.member.permissions.has(PermissionsBitField.Flags.KickMembers)) return;
            const target = message.mentions.members.first();
            if (!target) return message.reply('❌ Member mention karein.');
            try {
                await target.kick();
                message.channel.send(`👞 **${target.user.tag}** kick ho gaya.`);
            } catch (e) {}
        }

        if (command === 'ban') {
            if (!message.member.permissions.has(PermissionsBitField.Flags.BanMembers)) return;
            const target = message.mentions.members.first();
            if (!target) return message.reply('❌ Member mention karein.');
            try {
                await target.ban();
                message.channel.send(`🔨 **${target.user.tag}** ban ho gaya.`);
            } catch (e) {}
        }

        if (command === 'unban') {
            if (!message.member.permissions.has(PermissionsBitField.Flags.BanMembers)) return;
            const userId = args[0];
            if (!userId) return message.reply('❌ User ID dein.');
            try {
                await message.guild.members.unban(userId);
                message.channel.send(`✅ ID: **${userId}** unban ho gaya.`);
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
            if (!amount || amount < 1 || amount > 100) return message.reply('❌ 1-100 number dein.');
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
// 7. BOT LOGIN
// ---------------------------------------------------
const botToken = process.env.TOKEN || process.env.DISCORD_TOKEN;
client.login(botToken);
