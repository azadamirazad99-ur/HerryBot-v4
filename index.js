// ==========================================
// HERRYHACKS BOT - 100% WORKING FREE AI CODE
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
        GatewayIntentBits.GuildPresences
    ]
});

client.commands = new Collection();
const commands = [];

// Slash Command Handler
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

    const botToken = process.env.TOKEN || process.env.DISCORD_TOKEN;
    const clientId = process.env.CLIENT_ID || process.env['CLIENT ID'];

    if (!botToken || !clientId) {
        console.error("❌ TOKEN or CLIENT_ID missing in Railway Variables!");
        return;
    }

    const rest = new REST({ version: '10' }).setToken(botToken);

    try {
        console.log('🔄 Refreshing application (/) commands...');
        await rest.put(
            Routes.applicationCommands(clientId),
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

// AI Response & Moderation Handler
client.on('messageCreate', async message => {
    if (message.author.bot) return;

    if (message.mentions.has(client.user)) {
        try {
            await message.channel.sendTyping();
            const userQuery = message.content.replace(/<@!?\d+>/g, '').trim();
            const lowerQuery = userQuery.toLowerCase();

            // Auto-Timeout System for Abuses
            const badWords = ["mc", "bc", "bhenchod", "madarchod", "gandu", "chutiye", "bsdk", "bhosdike", "laude", "lode", "lodu", "randi", "harami"];
            const containsAbuse = badWords.some(word => lowerQuery.includes(word));

            if (containsAbuse) {
                try {
                    if (message.member && message.guild.members.me.permissions.has(PermissionFlagsBits.ModerateMembers)) {
                        await message.member.timeout(60 * 60 * 1000, "Abusing HerryBot");
                        await message.reply("Tu bot ko gali dega bsdk? Chal ab nikal aur 60 minutes tak timeout ke maza kar!");
                        return;
                    }
                } catch (e) {
                    console.error("Timeout Error:", e.message);
                }
            }

            const ownerId = process.env.OWNER_ID;
            const isOwner = message.author.id === ownerId;

            let member = message.member;
            if (message.guild && (!member || !member.roles)) {
                try {
                    member = await message.guild.members.fetch(message.author.id);
                } catch (e) {
                    console.error("Fetch Member Error:", e);
                }
            }

            const adminRoleId = "1538952736169656330";
            const staffRoleId = process.env.STAFF_ROLE_ID;
            const adminIdsRaw = process.env.ADMIN_IDS || "";
            const adminIds = adminIdsRaw.split(',').map(id => id.trim());

            const hasAdminId = adminIds.includes(message.author.id);
            const hasAdminRole = member ? member.roles.cache.has(adminRoleId) : false;
            const hasStaffRole = (staffRoleId && member) ? member.roles.cache.has(staffRoleId) : false;
            const hasAdminPermission = member ? (member.permissions.has(PermissionFlagsBits.Administrator) || member.permissions.has(PermissionFlagsBits.ManageGuild) || member.permissions.has(PermissionFlagsBits.ModerateMembers)) : false;

            const isAdmin = hasAdminId || hasAdminRole || hasStaffRole || hasAdminPermission;

            const authorUsername = message.author.username.toLowerCase();
            const isUgarchana = authorUsername.includes('ugarchana');
            const isGojo = authorUsername.includes('gojo');

            const grandHacksDownloadChannel = 'https://discord.com/channels/1529467083962843186/1529477377917452339';
            const setupGuideChannel = 'https://discord.com/channels/1529467083962843186/1529477486235226172';

            let roleInstructions = "";
            if (isOwner) {
                roleInstructions = `User is OWNER (Herry). Give MAXIMUM RESPECT. Address as "Boss/Sir". Strictly no abuses.`;
            } else if (isAdmin) {
                roleInstructions = `User is ADMIN/STAFF. Respectful, BUT if they start doing unnecessary bakchodi/abuses with you, roast them back!`;
            } else if (isGojo) {
                roleInstructions = `User is GOJO. Address as Gojo Bhai respectfully.`;
            } else if (isUgarchana) {
                roleInstructions = `User is UGARCHANA. Be respectful.`;
            } else {
                roleInstructions = `User is Regular Member. IF POLITE: Clear answers in Roman Urdu/Hindi. IF BAD/ATTITUDE: Roast them hard using street abuses.`;
            }

            const systemPrompt = `You are HerryBot, official assistant in HerryHacks Discord Server (Grand Mobile RP Modding).

BEHAVIOR MATRIX:
${roleInstructions}

STRICT LANGUAGE RULES:
- ALWAYS write using English alphabets (Roman Urdu / Hinglish). 
- NEVER write in Devanagari Hindi or Arabic script.
- If user asks in English, reply strictly in English.

LINK & HACK RULES:
1. ONLY allowed hacks: Lulubox, Devvir, Herryposya, Reversoqzz, Multispace / script run, and general Hacks.
2. Download/Hack links: ${grandHacksDownloadChannel}
3. Hack Setup/Guide: ${setupGuideChannel}

GENERAL DIRECTIVE:
- Keep answers short, bold, and straight to the point.
- Do NOT tag user.`;

            let replyText = null;

            // --- OPTION 1: GROQ API (Primary Working Model) ---
            const groqKey = (process.env.GROQ_API_KEY || '').trim();
            if (groqKey) {
                try {
                    console.log("Trying Groq (llama-3.1-8b-instant)...");
                    const groqRes = await axios.post(
                        "https://api.groq.com/openai/v1/chat/completions",
                        {
                            model: "llama-3.1-8b-instant",
                            messages: [
                                { role: "system", content: systemPrompt },
                                { role: "user", content: userQuery || "Hello" }
                            ],
                            temperature: 0.7
                        },
                        {
                            headers: {
                                "Authorization": `Bearer ${groqKey}`,
                                "Content-Type": "application/json"
                            },
                            timeout: 8000
                        }
                    );

                    if (groqRes.data?.choices?.[0]?.message?.content) {
                        replyText = groqRes.data.choices[0].message.content.trim();
                        console.log("✅ Groq Success!");
                    }
                } catch (e) {
                    console.log(`⚠️ Groq failed: ${e.response?.data?.error?.message || e.message}`);
                }
            }

            // --- OPTION 2: OPENROUTER FREE FALLBACK ---
            const openRouterApiKey = (process.env.OPENROUTER_API_KEY || '').trim();
            if (!replyText && openRouterApiKey) {
                const openRouterModels = [
                    "meta-llama/llama-3.2-3b-instruct:free",
                    "google/gemma-2-9b-it:free"
                ];

                for (const model of openRouterModels) {
                    try {
                        console.log(`Trying OpenRouter model: ${model}...`);
                        const openRouterRes = await axios.post(
                            "https://openrouter.ai/api/v1/chat/completions",
                            {
                                model: model,
                                messages: [
                                    { role: "system", content: systemPrompt },
                                    { role: "user", content: userQuery || "Hello" }
                                ]
                            },
                            {
                                headers: {
                                    "Authorization": `Bearer ${openRouterApiKey}`,
                                    "Content-Type": "application/json"
                                },
                                timeout: 8000
                            }
                        );

                        if (openRouterRes.data?.choices?.[0]?.message?.content) {
                            replyText = openRouterRes.data.choices[0].message.content.trim();
                            console.log(`✅ OpenRouter Success: ${model}`);
                            break;
                        }
                    } catch (e) {
                        console.log(`⚠️ OpenRouter ${model} failed`);
                    }
                }
            }

            // --- OPTION 3: PUBLIC API FALLBACK ---
            if (!replyText) {
                try {
                    console.log("Trying Public API Fallback...");
                    const pubRes = await axios.get(`https://api.duckduckgo.com/?q=${encodeURIComponent(userQuery)}&format=json`, { timeout: 5000 });
                    if (pubRes.data?.AbstractText) {
                        replyText = pubRes.data.AbstractText;
                    }
                } catch (e) {
                    console.log(`⚠️ Public Fallback failed: ${e.message}`);
                }
            }

            if (replyText) {
                await message.reply(replyText.length > 2000 ? replyText.substring(0, 1995) + '...' : replyText);
            } else {
                await message.reply("Bhai AI services down hain, thodi der baad try karo.");
            }

        } catch (error) {
            console.error("Main AI Handler Error:", error.message);
            await message.reply("❌ API connection fail ho gaya.");
        }
        return;
    }

    const content = message.content.trim();

    // Moderation Commands (.kick, .ban, .unban)
    if (content.startsWith('.')) {
        const args = content.slice(1).trim().split(/ +/);
        const command = args.shift().toLowerCase();

        if (command === 'kick') {
            if (!message.member.permissions.has(PermissionFlagsBits.KickMembers)) return message.reply('❌ No permission to kick members.');
            const target = message.mentions.members.first();
            if (!target) return message.reply('❌ Please mention a member to kick.');
            const reason = args.slice(1).join(' ') || 'No reason provided';
            try { 
                await target.kick(reason); 
                message.channel.send(`👢 Kicked **${target.user.tag}**. Reason: ${reason}`); 
            } catch (e) { 
                message.channel.send('❌ Failed to kick user.'); 
            }
        }

        if (command === 'ban') {
            if (!message.member.permissions.has(PermissionFlagsBits.BanMembers)) return message.reply('❌ No permission to ban members.');
            const target = message.mentions.members.first();
            if (!target) return message.reply('❌ Please mention a member to ban.');
            const reason = args.slice(1).join(' ') || 'No reason provided';
            try { 
                await target.ban({ reason }); 
                message.channel.send(`🔨 Banned **${target.user.tag}**. Reason: ${reason}`); 
            } catch (e) { 
                message.channel.send('❌ Failed to ban user.'); 
            }
        }

        if (command === 'unban') {
            if (!message.member.permissions.has(PermissionFlagsBits.BanMembers)) return message.reply('❌ No permission to unban members.');
            const userId = args[0];
            if (!userId) return message.reply('❌ Please provide a valid User ID.');
            const reason = args.slice(1).join(' ') || 'No reason provided';
            try { 
                await message.guild.members.unban(userId, reason); 
                message.channel.send(`✅ Unbanned ID: \`${userId}\`. Reason: ${reason}`); 
            } catch (e) { 
                message.channel.send('❌ Failed to unban user.'); 
            }
        }
    }

    // Utility Commands (!timeout, !rto, !clear, !say, !pfp)
    if (content.startsWith('!')) {
        const args = content.slice(1).trim().split(/ +/);
        const command = args.shift().toLowerCase();

        if (command === 'timeout' || command === 'mute') {
            if (!message.member.permissions.has(PermissionFlagsBits.ModerateMembers)) return message.reply('❌ No permission.');
            const target = message.mentions.members.first();
            const minutes = parseInt(args[1]);
            if (!target || !minutes || isNaN(minutes)) return message.reply('❌ Usage: `!timeout @user <minutes>`');
            const reason = args.slice(2).join(' ') || 'No reason provided';
            try { 
                await target.timeout(minutes * 60 * 1000, reason); 
                message.channel.send(`🔇 Timed out **${target.user.tag}** for **${minutes}** minutes.`); 
            } catch (e) { 
                message.channel.send('❌ Failed to apply timeout.'); 
            }
        }

        if (command === 'rto') {
            if (!message.member.permissions.has(PermissionFlagsBits.ModerateMembers)) return message.reply('❌ No permission.');
            const target = message.mentions.members.first();
            if (!target) return message.reply('❌ Mention a user to remove timeout.');
            try { 
                await target.timeout(null); 
                message.channel.send(`🔊 Removed timeout for **${target.user.tag}**.`); 
            } catch (e) { 
                message.channel.send('❌ Failed to remove timeout.'); 
            }
        }

        if (command === 'clear') {
            if (!message.member.permissions.has(PermissionFlagsBits.ManageMessages)) return message.reply('❌ No permission.');
            const amount = parseInt(args[0]);
            if (!amount || amount < 1 || amount > 100) return message.reply('❌ Enter a number between 1 and 100.');
            try { 
                message.delete(); 
                const deleted = await message.channel.bulkDelete(amount, true); 
                const r = await message.channel.send(`🧹 Cleared **${deleted.size}** messages.`); 
                setTimeout(() => r.delete(), 4000); 
            } catch (e) { 
                message.channel.send('❌ Failed to clear messages.'); 
            }
        }

        if (command === 'say') {
            if (!message.member.permissions.has(PermissionFlagsBits.ManageMessages)) return message.reply('❌ No permission.');
            const sayMessage = args.join(' ');
            if (!sayMessage) return message.reply('❌ Provide a message to say.');
            message.delete(); 
            message.channel.send(sayMessage);
        }

        if (command === 'avatar' || command === 'pfp') {
            const target = message.mentions.users.first() || message.author;
            const embed = new EmbedBuilder()
                .setColor('#00ffcc')
                .setTitle(`${target.username}'s Avatar`)
                .setImage(target.displayAvatarURL({ size: 1024, dynamic: true }));
            message.channel.send({ embeds: [embed] });
        }

        if (content === '!HerryHacksyt') message.channel.send('🔴 Official YouTube Channel: https://www.youtube.com/@herryhacks-1');
        if (content === '!ping') message.channel.send(`🏓 Pong! \`${client.ws.ping}ms\``);
    }
});

// Member Join Events
client.on('guildMemberAdd', async (member) => {
    const channelId = process.env.WELCOME_CHANNEL_ID;
    if (!channelId) return;
    const channel = member.guild.channels.cache.get(channelId);
    if (channel) {
        const embed = new EmbedBuilder()
            .setColor('#00ffcc')
            .setTitle('🚨 Welcome To HerryHacks Server 🚨')
            .setDescription(`Welcome ${member}!\n\nMention the bot for Grand Mobile RP scripts and tools information.`)
            .addFields({ name: '📊 Total Members', value: `${member.guild.memberCount}`, inline: true })
            .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
            .setFooter({ text: 'HerryHacks Community System' });

        channel.send({ content: `👋 **WELCOME:** ${member}`, embeds: [embed] });
    }
});

client.on('guildMemberRemove', async (member) => {
    let channelId = process.env.LEAVE_CHANNEL_ID;
    const configPath = path.join(__dirname, 'config.json');
    if (!channelId && fs.existsSync(configPath)) {
        try {
            const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
            channelId = config.leaveChannelId;
        } catch (e) { 
            console.error(e); 
        }
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

// Bot Login
const botToken = process.env.TOKEN || process.env.DISCORD_TOKEN;
client.login(botToken);


