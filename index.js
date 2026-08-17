// ==========================================
// HERRYHACKS BOT - FULL ORIGINAL INDEX.JS
// WITH OPENROUTER/FREE MODEL
// ==========================================

const { Client, GatewayIntentBits, Collection, REST, Routes, EmbedBuilder, PermissionFlagsBits, ChannelType, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const fs = require('node:fs');
const path = require('node:path');
const axios = require('axios');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.GuildPresences
    ]
});

client.commands = new Collection();
const commands = [];

// Command Handler Setup
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

client.once('ready', async () => {
    console.log(`🤖 Logged in successfully as ${client.user.tag}! HerryHacks system online.`);

    if (!process.env.TOKEN || !process.env.CLIENT_ID) {
        console.error("❌ TOKEN or CLIENT_ID is missing in Railway Variables!");
        return;
    }

    const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

    try {
        console.log('🔄 Refreshing application (/) commands...');
        await rest.put(
            Routes.applicationCommands(process.env.CLIENT_ID),
            { body: commands },
        );
        console.log('✅ Successfully reloaded application (/) commands.');
    } catch (error) {
        console.error("Slash Command Error:", error);
    }
});

// Ticket Button System
client.on('interactionCreate', async interaction => {
    if (interaction.isButton()) {
        if (interaction.customId === 'create_ticket') {
            const guild = interaction.guild;
            const rawCategoryId = process.env.TICKET_CATEGORY_ID;
            const categoryId = (rawCategoryId && rawCategoryId.length > 10) ? rawCategoryId : null;
            const staffRoleId = process.env.STAFF_ROLE_ID;

            try {
                const permissionOverwrites = [
                    {
                        id: guild.id,
                        deny: [PermissionFlagsBits.ViewChannel],
                    },
                    {
                        id: interaction.user.id,
                        allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory],
                    }
                ];

                if (staffRoleId && staffRoleId.length > 10) {
                    permissionOverwrites.push({
                        id: staffRoleId,
                        allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory],
                    });
                }

                const channelOptions = {
                    name: `ticket-${interaction.user.username}`,
                    type: ChannelType.GuildText,
                    permissionOverwrites: permissionOverwrites,
                };

                if (categoryId) {
                    channelOptions.parent = categoryId;
                }

                const channel = await guild.channels.create(channelOptions);

                const embed = new EmbedBuilder()
                    .setColor('#00ffcc')
                    .setTitle('🎫 Support Ticket')
                    .setDescription(`Hello ${interaction.user}, support team will assist you shortly. Please describe your issue.`);

                const row = new ActionRowBuilder().addComponents(
                    new ButtonBuilder()
                        .setCustomId('close_ticket')
                        .setLabel('🔒 Close Ticket')
                        .setStyle(ButtonStyle.Danger)
                );

                await channel.send({ content: `${interaction.user}`, embeds: [embed], components: [row] });
                await interaction.reply({ content: `✅ Ticket created: ${channel}`, ephemeral: true });
            } catch (error) {
                console.error("Ticket Creation Error:", error);
                await interaction.reply({ content: `❌ Error creating ticket! (${error.message})`, ephemeral: true });
            }
        }

        if (interaction.customId === 'close_ticket') {
            await interaction.reply({ content: '🔒 Closing ticket in 5 seconds...' });
            setTimeout(() => {
                interaction.channel.delete().catch(() => {});
            }, 5000);
        }
        return;
    }

    if (!interaction.isChatInputCommand()) return;

    const command = client.commands.get(interaction.commandName);
    if (!command) return;

    try {
        await command.execute(interaction);
    } catch (error) {
        console.error("Interaction Error:", error);
        if (interaction.replied || interaction.deferred) {
            await interaction.followUp({ content: '❌ Error executing command!', ephemeral: true });
        } else {
            await interaction.reply({ content: '❌ Error executing command!', ephemeral: true });
        }
    }
});

// Message Handling & OPENROUTER/FREE AI
client.on('messageCreate', async message => {
    if (message.author.bot) return;

    if (message.mentions.has(client.user)) {
        try {
            await message.channel.sendTyping();
            const userQuery = message.content.replace(`<@!${client.user.id}>`, '').replace(`<@${client.user.id}>`, '').trim();

            const ownerId = process.env.OWNER_ID;
            const isOwner = message.author.id === ownerId;

            const posyaScriptMediafire = 'https://www.mediafire.com/file/ehm4zsw0zj4ra96/PosyaByHerry.lua/file';
            const devvirMediafire = 'https://www.mediafire.com/file/kg47z7a6bovgek6/DevVir.apk/file';
            const reversoqzzDiscordLink = 'https://discord.com/channels/1529467083962843186/1529477377917452339';

            const openrouterKey = process.env.OPENROUTER_API_KEY ? process.env.OPENROUTER_API_KEY.trim() : '';
            if (!openrouterKey) {
                return message.reply("❌ `OPENROUTER_API_KEY` missing in Railway variables!");
            }

            const systemPrompt = `You are HerryBot, official assistant in HerryHacks Discord Server (Grand Mobile RP Modding & Scripts).

CRITICAL STRICT LINK MAPPING:
1. DEV VIR REQUEST: Give THIS EXACT Mediafire link: ${devvirMediafire}
2. REVERSOQZZ REQUEST: Reply EXACTLY with: "Reversoqzz link is here: ${reversoqzzDiscordLink}"
3. ENGLISH SCRIPT REQUEST: Reply EXACTLY: "Check in here if English Posya is available link :https://discord.com/channels/1529467083962843186/1529477377917452339"
4. SETUP REQUEST: Reply EXACTLY: "Check out the setup guide here: https://discord.com/channels/1529467083962843186/1529477486235226172"

CRITICAL RULE - MONEY HACK / GC HACK:
- Money Hack, Unlimited Money, and Grand Coins (GC) Hack ARE NOT AVAILABLE!
- Say: "Money Hack and GC Hack are NOT AVAILABLE in Grand Mobile RP."

GENERAL RULES:
- Never say "Elite GG". ALWAYS say "Reversoqzz".
- Provide links ONLY when user explicitly asks for "link", "download", or "kahan hai".
- MATCH LANGUAGE! English -> English, Roman Urdu -> Roman Urdu.
- NEVER share GitHub links.
- ${isOwner ? "Addressing Boss Herry / Sir." : "Be respectful to members."}`;

            const response = await axios.post(
                "https://openrouter.ai/api/v1/chat/completions",
                {
                    model: "openrouter/free",
                    messages: [
                        { role: "system", content: systemPrompt },
                        { role: "user", content: userQuery || "Hello" }
                    ]
                },
                {
                    headers: {
                        "Authorization": `Bearer ${openrouterKey}`,
                        "Content-Type": "application/json"
                    }
                }
            );

            const replyText = response.data?.choices?.[0]?.message?.content;

            if (replyText) {
                await message.reply(replyText.length > 2000 ? replyText.substring(0, 1995) + '...' : replyText);
            } else {
                await message.reply("❌ No response received from OpenRouter.");
            }

        } catch (error) {
            console.error("OpenRouter Error:", error.response?.data || error.message);
            await message.reply(`❌ OpenRouter Error: ${error.response?.data?.error?.message || error.message}`);
        }
        return;
    }

    const content = message.content.trim();

    // DOT COMMANDS (.kick, .ban, .unban)
    if (content.startsWith('.')) {
        const args = content.slice(1).trim().split(/ +/);
        const command = args.shift().toLowerCase();

        if (command === 'kick') {
            if (!message.member.permissions.has(PermissionFlagsBits.KickMembers)) return message.reply('❌ No permission.');
            const target = message.mentions.members.first();
            if (!target) return message.reply('❌ Mention a member!');
            const reason = args.slice(1).join(' ') || 'No reason provided';
            try { await target.kick(reason); message.channel.send(`👢 Kicked **${target.user.tag}**. Reason: ${reason}`); } catch (e) { message.channel.send('❌ Failed.'); }
        }

        if (command === 'ban') {
            if (!message.member.permissions.has(PermissionFlagsBits.BanMembers)) return message.reply('❌ No permission.');
            const target = message.mentions.members.first();
            if (!target) return message.reply('❌ Mention a member!');
            const reason = args.slice(1).join(' ') || 'No reason provided';
            try { await target.ban({ reason }); message.channel.send(`🔨 Banned **${target.user.tag}**. Reason: ${reason}`); } catch (e) { message.channel.send('❌ Failed.'); }
        }

        if (command === 'unban') {
            if (!message.member.permissions.has(PermissionFlagsBits.BanMembers)) return message.reply('❌ No permission.');
            const userId = args[0];
            if (!userId) return message.reply('❌ Provide a valid ID!');
            const reason = args.slice(1).join(' ') || 'No reason provided';
            try { await message.guild.members.unban(userId, reason); message.channel.send(`✅ Unbanned ID: \`${userId}\`. Reason: ${reason}`); } catch (e) { message.channel.send('❌ Failed.'); }
        }
    }

    // EXCLAMATION COMMANDS (!timeout, !rto, !clear, !say, !avatar, !pfp, !HerryHacksyt, !ping)
    if (content.startsWith('!')) {
        const args = content.slice(1).trim().split(/ +/);
        const command = args.shift().toLowerCase();

        if (command === 'timeout' || command === 'mute') {
            if (!message.member.permissions.has(PermissionFlagsBits.ModerateMembers)) return message.reply('❌ No permission.');
            const target = message.mentions.members.first();
            const minutes = parseInt(args[1]);
            if (!target || !minutes || isNaN(minutes)) return message.reply('❌ Usage: `!timeout @user <minutes>`');
            const reason = args.slice(2).join(' ') || 'No reason provided';
            try { await target.timeout(minutes * 60 * 1000, reason); message.channel.send(`🔇 Timed out **${target.user.tag}** for **${minutes}** min.`); } catch (e) { message.channel.send('❌ Failed.'); }
        }

        if (command === 'rto') {
            if (!message.member.permissions.has(PermissionFlagsBits.ModerateMembers)) return message.reply('❌ No permission.');
            const target = message.mentions.members.first();
            if (!target) return message.reply('❌ Mention a member!');
            try { await target.timeout(null); message.channel.send(`🔊 Removed timeout from **${target.user.tag}**.`); } catch (e) { message.channel.send('❌ Failed to remove timeout.'); }
        }

        if (command === 'clear') {
            if (!message.member.permissions.has(PermissionFlagsBits.ManageMessages)) return message.reply('❌ No permission.');
            const amount = parseInt(args[0]);
            if (!amount || amount < 1 || amount > 100) return message.reply('❌ Specify 1-100.');
            try { message.delete(); const deleted = await message.channel.bulkDelete(amount, true); const r = await message.channel.send(`🧹 Cleared **${deleted.size}** msgs.`); setTimeout(() => r.delete(), 4000); } catch (e) { message.channel.send('❌ Failed.'); }
        }

        if (command === 'say') {
            if (!message.member.permissions.has(PermissionFlagsBits.ManageMessages)) return message.reply('❌ No permission.');
            const sayMessage = args.join(' ');
            if (!sayMessage) return message.reply('❌ Provide a message.');
            message.delete(); message.channel.send(sayMessage);
        }

        if (command === 'avatar' || command === 'pfp') {
            const target = message.mentions.users.first() || message.author;
            const embed = new EmbedBuilder().setColor('#00ffcc').setTitle(`${target.username}'s Avatar`).setImage(target.displayAvatarURL({ size: 1024, dynamic: true }));
            message.channel.send({ embeds: [embed] });
        }

        if (content === '!HerryHacksyt') message.channel.send('🔴 Official: https://www.youtube.com/@grandhacks-l7j');
        if (content === '!ping') message.channel.send(`🏓 Pong! \`${client.ws.ping}ms\`.`);
    }
});

// Welcome Event
client.on('guildMemberAdd', async (member) => {
    const channel = member.guild.channels.cache.get(process.env.WELCOME_CHANNEL_ID);
    if (channel) {
        const embed = new EmbedBuilder()
            .setColor('#00ffcc')
            .setTitle('🚨 Welcome To HerryHacks Server 🚨')
            .setDescription(`Welcome ${member}!\n\nFor help with Grand Mobile RP scripts, setups, and tools, feel free to mention the bot.`)
            .addFields({ name: '📊 Total Members', value: `${member.guild.memberCount}`, inline: true })
            .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
            .setFooter({ text: 'HerryHacks Community System' });

        channel.send({ content: ` **WELCOME:** ${member}`, embeds: [embed] });
    }
});

// Leave Event
client.on('guildMemberRemove', async (member) => {
    let channelId = process.env.LEAVE_CHANNEL_ID;
    const configPath = path.join(__dirname, 'config.json');
    if (!channelId && fs.existsSync(configPath)) {
        try {
            const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
            channelId = config.leaveChannelId;
        } catch (e) { console.error(e); }
    }

    if (!channelId) return;
    const channel = member.guild.channels.cache.get(channelId);
    if (!channel) return;

    const embed = new EmbedBuilder()
        .setColor('#ff4d4d')
        .setTitle('🚪 Player Left')
        .setDescription(`**${member.user.tag}** left the server. Good Bye 👋`)
        .addFields({ name: '📊 Remaining Members', value: `${member.guild.memberCount}`, inline: true })
        .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
        .setFooter({ text: 'HerryHacks Community System' });

    channel.send({ embeds: [embed] });
});

client.login(process.env.TOKEN);

