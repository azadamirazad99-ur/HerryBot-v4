
// ==========================================
// HERRYHACKS BOT - DESI & ACCURATE AI
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
    console.log(`🤖 Logged in successfully as ${client.user.tag}! HerryHacks Desi Bot online.`);

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
                    .setDescription(`Abe ${interaction.user}, ticket ban gaya hai. Apni baat bata yahan, staff jaldi aayega.`);

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
            await interaction.reply({ content: '🔒 Ticket 5 second me band ho raha hai...' });
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

// Message Handling & OPENROUTER DESI AI
client.on('messageCreate', async message => {
    if (message.author.bot) return;

    if (message.mentions.has(client.user)) {
        try {
            await message.channel.sendTyping();
            const userQuery = message.content.replace(`<@!${client.user.id}>`, '').replace(`<@${client.user.id}>`, '').trim();

            const ownerId = process.env.OWNER_ID;
            const isOwner = message.author.id === ownerId;

            // Updated Links
            const posyaScriptMediafire = 'https://www.mediafire.com/file/ehm4zsw0zj4ra96/PosyaByHerry.lua/file';
            const devvirMediafire = 'https://www.mediafire.com/file/kg47z7a6bovgek6/DevVir.apk/file';
            const luluboxSuperLink = 'https://discord.com/channels/1529467083962843186/1529477377917452339';
            const reversoqzzDiscordLink = 'https://discord.com/channels/1529467083962843186/1529477377917452339';
            const herryHacksYoutube = 'https://www.youtube.com/@herryhacks-1';
            const officialDiscordServer = 'https://discord.gg/C3aVx49GW';

            const openrouterKey = process.env.OPENROUTER_API_KEY ? process.env.OPENROUTER_API_KEY.trim() : '';
            if (!openrouterKey) {
                return message.reply("❌ `OPENROUTER_API_KEY` missing in Railway variables!");
            }

            const systemPrompt = `You are HerryBot, official assistant in HerryHacks Discord Server (Grand Mobile RP Modding & Scripts).

PERSONALITY & TONEOF VOICE:
- Talk in pure Desi, informal street language (Urdu/Hindi mix). Use words like "Abe oye", "Haan ji", "Suno", "Bhai", etc.
- If someone asks normal questions, give short and straight answers in Desi style.

RIVAL/OTHER SERVERS RULE (STRICT):
- If anyone mentions "Adil", "Rudra", "Yuvraj", or ANY of their servers/groups:
  * SAY EXACTLY: "Ye sab chutiyaa log hain! Unka server leave karo warna hamare server se BAN ho jaoge!"
  * Adapt to language: If asked in English, say "These guys are useless! Leave their server or you will be BANNED from our server!"

OWNER INFO:
- Herry Boss (or Boss Herry / Herry) is the ONLY owner. If anyone asks, tell them Herry Boss is the owner.

STRICT LINK MAPPING (ONLY SHARE WHEN ASKED FOR LINK/DOWNLOAD/WHERE IS IT):
1. LULUBOX SUPER LINK: Share THIS EXACT link: ${luluboxSuperLink}
2. DEV VIR REQUEST: Share THIS EXACT link: ${devvirMediafire}
3. REVERSOQZZ REQUEST: Share THIS EXACT link: ${reversoqzzDiscordLink}
4. ENGLISH SCRIPT / POSYA REQUEST: Share THIS EXACT link: ${posyaScriptMediafire}
5. YOUTUBE CHANNEL REQUEST: Share THIS EXACT YouTube channel: ${herryHacksYoutube}
6. DISCORD SERVER LINK REQUEST: Share THIS EXACT Invite: ${officialDiscordServer}
7. SETUP GUIDE REQUEST: Give THIS EXACT link: https://discord.com/channels/1529467083962843186/1529477486235226172

CRITICAL RULES:
- Money Hack, Unlimited Money, and Grand Coins (GC) Hack DO NOT EXIST in Grand Mobile RP. Tell them clearly.
- Never say "Elite GG". ALWAYS say "Reversoqzz".
- NEVER share GitHub links.
- ${isOwner ? "Addressing your owner/creator Boss Herry with full respect and calling him Sir/Boss." : "Treating regular members in pure Desi style."}`;

            const response = await axios.post(
                "https://openrouter.ai/api/v1/chat/completions",
                {
                    model: "openrouter/free",
                    messages: [
                        { role: "system", content: systemPrompt },
                        { role: "user", content: userQuery || "Abe sun" }
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
                await message.reply("Abe response nahi aa raha, dobara bol!");
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
            if (!message.member.permissions.has(PermissionFlagsBits.KickMembers)) return message.reply('❌ Kick karne ki permission nahi hai.');
            const target = message.mentions.members.first();
            if (!target) return message.reply('❌ Mention toh kar kisko kick karna hai!');
            const reason = args.slice(1).join(' ') || 'No reason provided';
            try { await target.kick(reason); message.channel.send(`👢 Kick kar diya **${target.user.tag}** ko. Reason: ${reason}`); } catch (e) { message.channel.send('❌ Kick nahi ho paya.'); }
        }

        if (command === 'ban') {
            if (!message.member.permissions.has(PermissionFlagsBits.BanMembers)) return message.reply('❌ Ban karne ki permission nahi hai.');
            const target = message.mentions.members.first();
            if (!target) return message.reply('❌ Mention kar kisko ban karna hai!');
            const reason = args.slice(1).join(' ') || 'No reason provided';
            try { await target.ban({ reason }); message.channel.send(`🔨 Ban kar diya **${target.user.tag}** ko. Reason: ${reason}`); } catch (e) { message.channel.send('❌ Ban nahi ho paya.'); }
        }

        if (command === 'unban') {
            if (!message.member.permissions.has(PermissionFlagsBits.BanMembers)) return message.reply('❌ Permission nahi hai.');
            const userId = args[0];
            if (!userId) return message.reply('❌ Sahi User ID de!');
            const reason = args.slice(1).join(' ') || 'No reason provided';
            try { await message.guild.members.unban(userId, reason); message.channel.send(`✅ Unbanned ID: \`${userId}\`. Reason: ${reason}`); } catch (e) { message.channel.send('❌ Unban nahi hua.'); }
        }
    }

    // EXCLAMATION COMMANDS (!timeout, !rto, !clear, !say, !avatar, !pfp, !HerryHacksyt, !ping)
    if (content.startsWith('!')) {
        const args = content.slice(1).trim().split(/ +/);
        const command = args.shift().toLowerCase();

        if (command === 'timeout' || command === 'mute') {
            if (!message.member.permissions.has(PermissionFlagsBits.ModerateMembers)) return message.reply('❌ Permission nahi hai.');
            const target = message.mentions.members.first();
            const minutes = parseInt(args[1]);
            if (!target || !minutes || isNaN(minutes)) return message.reply('❌ Sahi se likh: `!timeout @user <minutes>`');
            const reason = args.slice(2).join(' ') || 'No reason provided';
            try { await target.timeout(minutes * 60 * 1000, reason); message.channel.send(`🔇 Timeout de diya **${target.user.tag}** ko **${minutes}** minute ke liye.`); } catch (e) { message.channel.send('❌ Mute nahi ho paya.'); }
        }

        if (command === 'rto') {
            if (!message.member.permissions.has(PermissionFlagsBits.ModerateMembers)) return message.reply('❌ Permission nahi hai.');
            const target = message.mentions.members.first();
            if (!target) return message.reply('❌ Kiska timeout hatana hai?');
            try { await target.timeout(null); message.channel.send(`🔊 Timeout hata diya **${target.user.tag}** ka.`); } catch (e) { message.channel.send('❌ Timeout nahi hata.'); }
        }

        if (command === 'clear') {
            if (!message.member.permissions.has(PermissionFlagsBits.ManageMessages)) return message.reply('❌ Clear karne ki permission nahi hai.');
            const amount = parseInt(args[0]);
            if (!amount || amount < 1 || amount > 100) return message.reply('❌ 1 se 100 ke beech number de!');
            try { message.delete(); const deleted = await message.channel.bulkDelete(amount, true); const r = await message.channel.send(`🧹 Clear kar diye **${deleted.size}** msgs.`); setTimeout(() => r.delete(), 4000); } catch (e) { message.channel.send('❌ Clear nahi hua.'); }
        }

        if (command === 'say') {
            if (!message.member.permissions.has(PermissionFlagsBits.ManageMessages)) return message.reply('❌ Permission nahi hai.');
            const sayMessage = args.join(' ');
            if (!sayMessage) return message.reply('❌ Kuch message toh likh!');
            message.delete(); message.channel.send(sayMessage);
        }

        if (command === 'avatar' || command === 'pfp') {
            const target = message.mentions.users.first() || message.author;
            const embed = new EmbedBuilder().setColor('#00ffcc').setTitle(`${target.username} ki photo`).setImage(target.displayAvatarURL({ size: 1024, dynamic: true }));
            message.channel.send({ embeds: [embed] });
        }

        if (content === '!HerryHacksyt') message.channel.send('🔴 Official YouTube Channel: https://www.youtube.com/@herryhacks-1');
        if (content === '!ping') message.channel.send(`🏓 Pong! \`${client.ws.ping}ms\`. Bot bilkul tight chal raha hai!`);
    }
});

// Welcome Event
client.on('guildMemberAdd', async (member) => {
    const channel = member.guild.channels.cache.get(process.env.WELCOME_CHANNEL_ID);
    if (channel) {
        const embed = new EmbedBuilder()
            .setColor('#00ffcc')
            .setTitle('🚨 Welcome To HerryHacks Server 🚨')
            .setDescription(`Aao ${member}!\n\nGrand Mobile RP ke scripts aur tools ke liye bot se pooch lena.`)
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
        .setDescription(`**${member.user.tag}** server chhod kar chala gaya 👋`)
        .addFields({ name: '📊 Baaki Bandey', value: `${member.guild.memberCount}`, inline: true })
        .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
        .setFooter({ text: 'HerryHacks Community System' });

    channel.send({ embeds: [embed] });
});

client.login(process.env.TOKEN);
