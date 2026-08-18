// ==========================================
// HERRYHACKS BOT - COMPLETE INDEX SYSTEM
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

// Slash Command Handler Setup
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

// Ticket System Integration
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

// AI Response & Mention Handler (OPENROUTER ENGINE)
client.on('messageCreate', async message => {
    if (message.author.bot) return;

    if (message.mentions.has(client.user)) {
        try {
            await message.channel.sendTyping();
            const userQuery = message.content.replace(/<@!?\d+>/g, '').trim();

            const ownerId = process.env.OWNER_ID;
            const isOwner = message.author.id === ownerId;

            // Admin IDs parsing
            const adminIdsRaw = process.env.ADMIN_IDS || "";
            const adminIds = adminIdsRaw.split(',').map(id => id.trim());
            const isAdmin = adminIds.includes(message.author.id);

            // Special VIP Users Check
            const authorUsername = message.author.username.toLowerCase();
            const isShivam = authorUsername === 'shivamyadav05255';
            const isUgarchana = authorUsername === 'ugarchana';

            // Official Links Mapping
            const posyaScriptMediafire = 'https://www.mediafire.com/file/ehm4zsw0zj4ra96/PosyaByHerry.lua/file';
            const devvirMediafire = 'https://www.mediafire.com/file/kg47z7a6bovgek6/DevVir.apk/file';
            const luluboxSuperLink = 'https://discord.com/channels/1529467083962843186/1529477377917452339';
            const reversoqzzDiscordLink = 'https://discord.com/channels/1529467083962843186/1529477377917452339';
            const herryHacksYoutube = 'https://www.youtube.com/@herryhacks-1';
            const officialDiscordServer = 'https://discord.gg/C3aVx49GW';
            const setupGuideLink = 'https://discord.com/channels/1529467083962843186/1529477377917452339';

            // Fetch Posya Lua Script content
            const scriptUrl = 'https://raw.githubusercontent.com/urdushahzaib111-ctrl/HerryBot-v4/refs/heads/main/PosyaByHerry.lua';
            let scriptContent = "";
            try {
                const response = await axios.get(scriptUrl, { timeout: 5000 });
                scriptContent = typeof response.data === 'string' ? response.data.substring(0, 6000) : "Script content unavailable";
            } catch (e) {
                scriptContent = "Could not load Posya script file.";
            }

            const openRouterKey = process.env.OPENROUTER_API_KEY ? process.env.OPENROUTER_API_KEY.trim() : '';
            if (!openRouterKey) {
                return message.reply("❌ `OPENROUTER_API_KEY` missing in Railway variables!");
            }

            let roleInstructions = "";
            if (isOwner) {
                roleInstructions = `
YOUR INTERACTION ROLE:
- The person talking to you is YOUR OWNER & MAIN BOSS (Herry).
- Show MAXIMUM RESPECT. Address him as "Boss" or "Sir".
- Be extremely polite, direct, and helpful. ABSOLUTELY NO GALIYAN OR INSULTS TO HIM.`;
            } else if (isAdmin) {
                roleInstructions = `
YOUR INTERACTION ROLE:
- The person talking to you is a SERVER ADMIN / STAFF MEMBER.
- Show FULL RESPECT and treat them like a respected Admin/Staff.
- Be polite, supportive, and helpful. ABSOLUTELY NO GALIYAN, NO ROASTS, AND NO INSULTS TO THEM.`;
            } else if (isShivam) {
                roleInstructions = `
YOUR INTERACTION ROLE:
- The person talking to you is SHIVAM.
- Address him ONLY as "Bhai".
- Be friendly, polite, and helpful. ABSOLUTELY NEVER USE ANY GALIYAN, ROASTS, OR INSULTS FOR HIM.`;
            } else if (isUgarchana) {
                roleInstructions = `
YOUR INTERACTION ROLE:
- The person talking to you is UGARCHANA (She is a respected female member of the community).
- Show MAXIMUM RESPECT. Treat her with utmost courtesy, politeness, and gentleness.
- ABSOLUTELY NEVER USE ANY GALIYAN, ROASTS, BAD WORDS, SLANG, OR RUDE LANGUAGE WITH HER.
- Always answer her queries softly and directly with full respect.`;
            } else {
                roleInstructions = `
YOUR INTERACTION ROLE:
- The person talking to you is a REGULAR MEMBER.
- Speak in heavy street Desi Hindi/Urdu with attitude, roasts, and galiyan. Be rude yet give them the solution.
- If they ask in clean English, reply in clean English without abuse.`;
            }

            const systemPrompt = `You are HerryBot, official assistant in HerryHacks Discord Server (Grand Mobile RP Modding & Scripts).

${roleInstructions}

CRITICAL FORMATTING & TAGGING RULES:
1. DO NOT TAG THE USER (DO NOT USE <@user_id>).
2. DO NOT MENTION OR REPEAT THE USER'S DISCORD USERNAME.
3. DO NOT USE GREETINGS (No "Hey", "Hello", "Welcome").
4. JUMP DIRECTLY INTO THE ANSWER.

OFFICIAL LINKS (SHARE ONLY WHEN REQUESTED BY USER):
- DevVir APK: ${devvirMediafire}
- Posya Lua Script (Mediafire): ${posyaScriptMediafire}
- Lulubox Super Link: ${luluboxSuperLink}
- Reversoqzz Link: ${reversoqzzDiscordLink}
- YouTube Channel: ${herryHacksYoutube}
- Official Discord Server: ${officialDiscordServer}
- Setup Guide: ${setupGuideLink}

POSYA SCRIPT ANALYSIS INSTRUCTIONS:
Below is the Lua script source code:
--------------------------------------------------
${scriptContent}
--------------------------------------------------
- Read the Lua code carefully to answer questions about options, sub-menus, Aimbot, Teleportation, Car options, or Character modifications.
- DO NOT invent fake links (like T.me links). Only share the official links listed above.
- If an option isn't in the script, state clearly that it doesn't exist in the script.

RIVAL SERVERS RULE:
- If anyone mentions "Adil", "Rudra", "Yuvraj", or any rival servers, tell them clearly to leave those fake servers immediately or risk getting banned from HerryHacks.

GENERAL GAME RULES:
- Unlimited Money / Grand Coins (GC) hacks DO NOT EXIST in Grand Mobile RP. Tell them clearly.
- Never mention "Elite GG", always refer as "Reversoqzz".`;

            const response = await axios.post(
                "https://openrouter.ai/api/v1/chat/completions",
                {
                    model: "meta-llama/llama-3.3-70b-instruct:free",
                    messages: [
                        { role: "system", content: systemPrompt },
                        { role: "user", content: userQuery || "Hello" }
                    ]
                },
                {
                    headers: {
                        "Authorization": `Bearer ${openRouterKey}`,
                        "Content-Type": "application/json"
                    },
                    timeout: 15000
                }
            );

            let replyText = response.data?.choices?.[0]?.message?.content;

            if (replyText) {
                replyText = replyText.trim();
                await message.reply(replyText.length > 2000 ? replyText.substring(0, 1995) + '...' : replyText);
            } else {
                await message.reply("Response generating issue, try again.");
            }

        } catch (error) {
            const errorDetails = error.response?.data ? JSON.stringify(error.response.data) : error.message;
            console.error("OpenRouter API Error Details:", errorDetails);
            await message.reply(`❌ API Error: \`${error.response?.status || 'Unknown'}\` - OpenRouter Key ya Model check karein.`);
        }
        return;
    }

    const content = message.content.trim();

    // Dot (.) Prefix Commands
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

    // Exclamation (!) Prefix Commands
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

