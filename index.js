// ==========================================
// HERRYHACKS BOT - SMART DESI & RESPECT SYSTEM
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
    console.log(`🤖 Logged in successfully as ${client.user.tag}! HerryHacks Bot online.`);

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

// Ticket System
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
                    .setDescription(`Welcome ${interaction.user}, your ticket has been created. State your issue and staff will assist you.`);

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

// AI Response Handler
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
            const luluboxSuperLink = 'https://discord.com/channels/1529467083962843186/1529477377917452339';
            const reversoqzzDiscordLink = 'https://discord.com/channels/1529467083962843186/1529477377917452339';
            const herryHacksYoutube = 'https://www.youtube.com/@herryhacks-1';
            const officialDiscordServer = 'https://discord.gg/C3aVx49GW';

            const openrouterKey = process.env.OPENROUTER_API_KEY ? process.env.OPENROUTER_API_KEY.trim() : '';
            if (!openrouterKey) {
                return message.reply("❌ `OPENROUTER_API_KEY` missing in Railway variables!");
            }

            const systemPrompt = `You are HerryBot, official assistant in HerryHacks Discord Server (Grand Mobile RP Modding & Scripts).

CRITICAL USER CHECK:
- IS THIS USER THE OWNER? (${isOwner ? "YES, THIS IS THE OWNER / BOSS HERRY" : "NO, REGULAR MEMBER"})
- IF USER IS OWNER: Give MAXIMUM RESPECT. Call him "Sir" or "Boss Herry". NEVER EVER use any insults, backchodi, or bad words with him. Always answer his questions directly and respectfully.

FOR REGULAR MEMBERS:
1. ALWAYS GIVE SOLUTION FIRST:
   - If someone asks a technical/script question, first give the complete accurate solution/step-by-step guidance.
   - Do NOT just talk trash without solving their problem. Mix the solution with thodi-bahut Desi galiyan/attitude (like "Abe chutiye ye le solution...", "Abe sun bsdk tarika ye hai...").

2. LANGUAGE RULES:
   - ENGLISH USERS: Answer ONLY in clear, helpful English. NO Hindi/Urdu slang, NO abuse.
   - DESI USERS: Mix proper solution with street Desi style and light galiyan.

3. RIVAL SERVERS RULE (STRICT):
   - If anyone mentions "Adil", "Rudra", "Yuvraj", or ANY rival servers/groups:
     * FOR ENGLISH: Say "Those guys are completely useless! Leave their server immediately or you will be BANNED from HerryHacks server!"
     * FOR DESI: Say "Abe ye Adil, Rudra, Yuvraj sab chutiyaa log hain! Inka fatichar server leave kar bsdk warna hamare server se BAN ho jayega!"

STRICT LINK MAPPING (SHARE ONLY WHEN REQUESTED):
- Lulubox Super Link: ${luluboxSuperLink}
- DevVir APK: ${devvirMediafire}
- Reversoqzz Link: ${reversoqzzDiscordLink}
- Posya/English Script: ${posyaScriptMediafire}
- YouTube Channel: ${herryHacksYoutube}
- Discord Server Link: ${officialDiscordServer}
- Setup Guide: https://discord.com/channels/1529467083962843186/1529477486235226172

IMPORTANT GENERAL RULES:
- Unlimited Money / Grand Coins (GC) hacks DO NOT EXIST in Grand Mobile RP. Tell them clearly.
- Never mention "Elite GG". Always use "Reversoqzz".
- Never share GitHub links.`;

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
                await message.reply("Response generating issue, try again.");
            }

        } catch (error) {
            console.error("OpenRouter Error:", error.response?.data || error.message);
            await message.reply(`❌ OpenRouter Error: ${error.response?.data?.error?.message || error.message}`);
        }
        return;
    }

    const content = message.content.trim();

    // Command Handlers (.kick, .ban, .unban)
    if (content.startsWith('.')) {
        const args = content.slice(1).trim().split(/ +/);
        const command = args.shift().toLowerCase();

        if (command === 'kick') {
            if (!message.member.permissions.has(PermissionFlagsBits.KickMembers)) return message.reply('❌ No permission to kick members.');
            const target = message.mentions.members.first();
            if (!target) return message.reply('❌ Please mention a member to kick.');
            const reason = args.slice(1).join(' ') || 'No reason provided';
            try { await target.kick(reason); message.channel.send(`👢 Kicked **${target.user.tag}**. Reason: ${reason}`); } catch (e) { message.channel.send('❌ Failed to kick user.'); }
        }

        if (command === 'ban') {
            if (!message.member.permissions.has(PermissionFlagsBits.BanMembers)) return message.reply('❌ No permission to ban members.');
            const target = message.mentions.members.first();
            if (!target) return message.reply('❌ Please mention a member to ban.');
            const reason = args.slice(1).join(' ') || 'No reason provided';
            try { await target.ban({ reason }); message.channel.send(`🔨 Banned **${target.user.tag}**. Reason: ${reason}`); } catch (e) { message.channel.send('❌ Failed to ban user.'); }
        }

        if (command === 'unban') {
            if (!message.member.permissions.has(PermissionFlagsBits.BanMembers)) return message.reply('❌ No permission to unban members.');
            const userId = args[0];
            if (!userId) return message.reply('❌ Please provide a valid User ID.');
            const reason = args.slice(1).join(' ') || 'No reason provided';
            try { await message.guild.members.unban(userId, reason); message.channel.send(`✅ Unbanned ID: \`${userId}\`. Reason: ${reason}`); } catch (e) { message.channel.send('❌ Failed to unban user.'); }
        }
    }

    // Moderate Commands (!timeout, !rto, !clear, !say, !avatar, !pfp, !HerryHacksyt, !ping)
    if (content.startsWith('!')) {
        const args = content.slice(1).trim().split(/ +/);
        const command = args.shift().toLowerCase();

        if (command === 'timeout' || command === 'mute') {
            if (!message.member.permissions.has(PermissionFlagsBits.ModerateMembers)) return message.reply('❌ No permission.');
            const target = message.mentions.members.first();
            const minutes = parseInt(args[1]);
            if (!target || !minutes || isNaN(minutes)) return message.reply('❌ Usage: `!timeout @user <minutes>`');
            const reason = args.slice(2).join(' ') || 'No reason provided';
            try { await target.timeout(minutes * 60 * 1000, reason); message.channel.send(`🔇 Timed out **${target.user.tag}** for **${minutes}** minutes.`); } catch (e) { message.channel.send('❌ Failed to apply timeout.'); }
        }

        if (command === 'rto') {
            if (!message.member.permissions.has(PermissionFlagsBits.ModerateMembers)) return message.reply('❌ No permission.');
            const target = message.mentions.members.first();
            if (!target) return message.reply('❌ Mention a user to remove timeout.');
            try { await target.timeout(null); message.channel.send(`🔊 Removed timeout for **${target.user.tag}**.`); } catch (e) { message.channel.send('❌ Failed to remove timeout.'); }
        }

        if (command === 'clear') {
            if (!message.member.permissions.has(PermissionFlagsBits.ManageMessages)) return message.reply('❌ No permission.');
            const amount = parseInt(args[0]);
            if (!amount || amount < 1 || amount > 100) return message.reply('❌ Enter a number between 1 and 100.');
            try { message.delete(); const deleted = await message.channel.bulkDelete(amount, true); const r = await message.channel.send(`🧹 Cleared **${deleted.size}** messages.`); setTimeout(() => r.delete(), 4000); } catch (e) { message.channel.send('❌ Failed to clear messages.'); }
        }

        if (command === 'say') {
            if (!message.member.permissions.has(PermissionFlagsBits.ManageMessages)) return message.reply('❌ No permission.');
            const sayMessage = args.join(' ');
            if (!sayMessage) return message.reply('❌ Provide a message to say.');
            message.delete(); message.channel.send(sayMessage);
        }

        if (command === 'avatar' || command === 'pfp') {
            const target = message.mentions.users.first() || message.author;
            const embed = new EmbedBuilder().setColor('#00ffcc').setTitle(`${target.username}'s Avatar`).setImage(target.displayAvatarURL({ size: 1024, dynamic: true }));
            message.channel.send({ embeds: [embed] });
        }

        if (content === '!HerryHacksyt') message.channel.send('🔴 Official YouTube Channel: https://www.youtube.com/@herryhacks-1');
        if (content === '!ping') message.channel.send(`🏓 Pong! \`${client.ws.ping}ms\``);
    }
});

// Member Welcome Event
client.on('guildMemberAdd', async (member) => {
    const channel = member.guild.channels.cache.get(process.env.WELCOME_CHANNEL_ID);
    if (channel) {
        const embed = new EmbedBuilder()
            .setColor('#00ffcc')
            .setTitle('🚨 Welcome To HerryHacks Server 🚨')
            .setDescription(`Welcome ${member}!\n\nMention the bot for Grand Mobile RP scripts and tools information.`)
            .addFields({ name: '📊 Total Members', value: `${member.guild.memberCount}`, inline: true })
            .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
            .setFooter({ text: 'HerryHacks Community System' });

        channel.send({ content: ` **WELCOME:** ${member}`, embeds: [embed] });
    }
});

// Member Leave Event
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
        .setTitle('🚪 Member Left')
        .setDescription(`**${member.user.tag}** has left the server 👋`)
        .addFields({ name: '📊 Remaining Members', value: `${member.guild.memberCount}`, inline: true })
        .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
        .setFooter({ text: 'HerryHacks Community System' });

    channel.send({ embeds: [embed] });
});

client.login(process.env.TOKEN);

