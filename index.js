// ==========================================
// RAILWAY-READY FRESH INDEX.JS FOR GRANDHACKS BOT
// ==========================================

const { Client, GatewayIntentBits, Collection, REST, Routes, AttachmentBuilder, EmbedBuilder } = require('discord.js');
const fs = require('node:fs');
const path = require('node:path');
const Canvas = require('canvas');

// Bot Intents
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildVoiceStates
    ]
});

// Commands collection setup
client.commands = new Collection();
const commands = [];

// Commands folder handler
const foldersPath = path.join(__dirname, 'commands');
if (fs.existsSync(foldersPath)) {
    const commandFolders = fs.readdirSync(foldersPath);
    for (const folder of commandFolders) {
        const commandsPath = path.join(foldersPath, folder);
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
}

// Bot Ready Event & Slash Commands Deployment via Railway Variables
client.once('ready', async () => {
    console.log(`🤖 Logged in successfully as ${client.user.tag}! GrandHacks system online.`);

    const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

    try {
        console.log('🔄 Refreshing application (/) commands...');
        await rest.put(
            Routes.applicationCommands(process.env.CLIENT_ID),
            { body: commands },
        );
        console.log('✅ Successfully reloaded application (/) commands.');
    } catch (error) {
        console.error(error);
    }
});

// ==========================================
// SLASH COMMAND INTERACTION HANDLER
// ==========================================
client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;

    const command = client.commands.get(interaction.commandName);
    if (!command) return;

    try {
        await command.execute(interaction);
    } catch (error) {
        console.error(error);
        if (interaction.replied || interaction.deferred) {
            await interaction.followUp({ content: '❌ There was an error while executing this command!', ephemeral: true });
        } else {
            await interaction.reply({ content: '❌ There was an error while executing this command!', ephemeral: true });
        }
    }
});

// ==========================================
// PREFIX COMMANDS HANDLER (!)
// ==========================================
client.on('messageCreate', async message => {
    if (message.author.bot) return;

    const content = message.content.trim();

    if (content === '!grandhackyt') {
        message.channel.send('🔴 Official GrandHackYT Gaming Channel: https://www.youtube.com/@grandhacks-l7j');
    }
    if (content === '!serverinfo') {
        message.channel.send(`📊 Server Name: **${message.guild.name}** | Total Members: **${message.guild.memberCount}**`);
    }
    if (content === '!servericon') {
        const icon = message.guild.iconURL({ size: 1024, dynamic: true });
        if (!icon) return message.channel.send('❌ This server has no icon.');
        message.channel.send(icon);
    }
    if (content === '!ping') {
        message.channel.send(`🏓 Pong! Latency is \`${client.ws.ping}ms\`.`);
    }
    if (content === '!membercount') {
        message.channel.send(`👥 Current members in **${message.guild.name}**: **${message.guild.memberCount}**`);
    }
});

// ==========================================
// AUTOMATIC WELCOME CARD EVENT (guildMemberAdd)
// ==========================================
client.on('guildMemberAdd', async (member) => {
    const channelId = process.env.WELCOME_CHANNEL_ID || 'APKE_WELCOME_CHANNEL_ID_YAHAN_DALEN'; 
    const channel = member.guild.channels.cache.get(channelId);
    if (!channel) return;

    try {
        const canvas = Canvas.createCanvas(1024, 500);
        const ctx = canvas.getContext('2d');

        ctx.fillStyle = '#111111';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        const avatarURL = member.guild.iconURL({ extension: 'png', size: 512 }) || 'https://i.imgur.com/AfFp7pu.png';
        const avatar = await Canvas.loadImage(avatarURL);

        ctx.save();
        ctx.beginPath();
        ctx.arc(512, 160, 90, 0, Math.PI * 2, true);
        ctx.closePath();
        ctx.clip();
        ctx.drawImage(avatar, 422, 70, 180, 180);
        ctx.restore();

        ctx.font = 'bold 45px sans-serif';
        ctx.fillStyle = '#00ffcc';
        ctx.textAlign = 'center';
        ctx.fillText('GrandHacks Community', canvas.width / 2, 310);

        ctx.font = 'bold 32px sans-serif';
        ctx.fillStyle = '#ffffff';
        ctx.fillText(`WELCOME, ${member.user.tag}!`, canvas.width / 2, 380);

        ctx.font = '20px sans-serif';
        ctx.fillStyle = '#aaaaaa';
        ctx.fillText('Bhai ka swagat hai! Aaja maidan mein, maza aayega!', canvas.width / 2, 430);

        const attachment = new AttachmentBuilder(canvas.toBuffer(), { name: 'welcome-image.png' });

        await channel.send({
            content: `🎉 Oye sab suno! ${member} bhai hamare server **GrandHacks** mein aa chuke hain! Dil se welcome hai bhai! 🚀`,
            files: [attachment]
        });

    } catch (error) {
        console.log('Welcome image error: ', error);
        await channel.send(`🎉 Welcome ${member} to **GrandHacks**! Server pe aane ke liye shukriya, enjoy your stay! 🚀`);
    }
});

// Bot Login via Railway Variable
client.login(process.env.TOKEN);
