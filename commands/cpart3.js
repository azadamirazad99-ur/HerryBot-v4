// ==========================================
// PART 3: 10 MORE NEW COMMANDS IN A SINGLE CODE BLOCK
// ==========================================

// 1. Password Generator (password.js)
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('password')
        .setDescription('Generates a secure random password.'),
    async execute(interaction) {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
        let pass = '';
        for (let i = 0; i < 12; i++) {
            pass += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        await interaction.reply({ content: `🔒 Generated Password: \`${pass}\``, ephemeral: true });
    },
};

// 2. Reverse Text (reverse.js)
module.exports = {
    data: new SlashCommandBuilder()
        .setName('reverse')
        .setDescription('Reverses the text you provide.')
        .addStringOption(o => o.setName('text').setDescription('Text to reverse').setRequired(true)),
    async execute(interaction) {
        const text = interaction.options.getString('text');
        const reversed = text.split('').reverse().join('');
        await interaction.reply(`🔄 Reversed: ${reversed}`);
    },
};

// 3. Math Fact (mathfact.js)
module.exports = {
    data: new SlashCommandBuilder()
        .setName('mathfact')
        .setDescription('Sends a cool math trivia fact.'),
    async execute(interaction) {
        const facts = [
            "Zero is the only number that cannot be represented in Roman numerals.",
            "Pi is an irrational number, meaning its decimal representation never ends or repeats.",
            "A 'jiffy' is an actual unit of time: 1/100th of a second."
        ];
        const fact = facts[Math.floor(Math.random() * facts.length)];
        await interaction.reply(`🔢 **Math Fact:** ${fact}`);
    },
};

// 4. Shout Command (shout.js)
module.exports = {
    data: new SlashCommandBuilder()
        .setName('shout')
        .setDescription('Shouts out your text in uppercase letters.')
        .addStringOption(o => o.setName('text').setDescription('Text to shout').setRequired(true)),
    async execute(interaction) {
        const text = interaction.options.getString('text').toUpperCase();
        await interaction.reply(`📢 ${text} !!!`);
    },
};

// 5. Highfive Command (highfive.js)
module.exports = {
    data: new SlashCommandBuilder()
        .setName('highfive')
        .setDescription('Give a high-five to someone.')
        .addUserOption(o => o.setName('target').setDescription('User to high-five').setRequired(true)),
    async execute(interaction) {
        const target = interaction.options.getUser('target');
        await interaction.reply(`✋ ${interaction.user} gives a high-five to ${target} 🌟`);
    },
};

// 6. Cyberpunk Quote (cyberquote.js)
module.exports = {
    data: new SlashCommandBuilder()
        .setName('cyberquote')
        .setDescription('Sends a futuristic tech quote.'),
    async execute(interaction) {
        const quotes = [
            "The future is already here — it's just not very evenly distributed.",
            "Any sufficiently advanced technology is indistinguishable from magic.",
            "Code is like humor. When you have to explain it, it’s bad."
        ];
        const quote = quotes[Math.floor(Math.random() * quotes.length)];
        await interaction.reply(`🤖 *"${quote}"*`);
    },
};

// 7. Riddle Command (riddle.js)
module.exports = {
    data: new SlashCommandBuilder()
        .setName('riddle')
        .setDescription('Asks a tricky riddle.'),
    async execute(interaction) {
        const riddles = [
            "What has to be broken before you can use it? (Answer: An egg)",
            "I speak without a mouth and hear without ears. I have no body, but I come alive with wind. (Answer: An echo)",
            "What has many keys but can't open a single lock? (Answer: A piano)"
        ];
        const riddle = riddles[Math.floor(Math.random() * riddles.length)];
        await interaction.reply(`❓ **Riddle Time:**\n${riddle}`);
    },
};

// 8. Color Hex Generator (randomcolor.js)
module.exports = {
    data: new SlashCommandBuilder()
        .setName('randomcolor')
        .setDescription('Generates a random HEX color code.'),
    async execute(interaction) {
        const color = '#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0');
        await interaction.reply(`🎨 Random Color Code: **${color.toUpperCase()}**`);
    },
};

// 9. Server Boosters Check (boosters.js)
module.exports = {
    data: new SlashCommandBuilder()
        .setName('boosters')
        .setDescription('Check server boost status summary.'),
    async execute(interaction) {
        const guild = interaction.guild;
        await interaction.reply(`🚀 **${guild.name}** currently has **${guild.premiumSubscriptionCount || 0}** server boosts!`);
    },
};

// 10. Coin Multi-Flip (multicoin.js)
module.exports = {
    data: new SlashCommandBuilder()
        .setName('multicoin')
        .setDescription('Flips 3 coins at once.'),
    async execute(interaction) {
        const outcomes = ['Heads', 'Tails'];
        const c1 = outcomes[Math.floor(Math.random() * outcomes.length)];
        const c2 = outcomes[Math.floor(Math.random() * outcomes.length)];
        const c3 = outcomes[Math.floor(Math.random() * outcomes.length)];
        await interaction.reply(`🪙 Triple Coin Flip Results: **${c1} | ${c2} | ${c3}**`);
    },
}; 
    
