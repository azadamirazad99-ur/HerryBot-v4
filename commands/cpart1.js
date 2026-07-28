// ==========================================
// PART 1: 10 NEW COMMANDS IN A SINGLE CODE BLOCK
// ==========================================

// 1. Weather Command (weather.js)
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('weather')
        .setDescription('Check weather for a city.')
        .addStringOption(option => option.setName('city').setDescription('City name').setRequired(true)),
    async execute(interaction) {
        const city = interaction.options.getString('city');
        await interaction.reply(`🌤️ Weather report for **${city}**: Clear skies, 24°C.`);
    },
};

// 2. Calculator Command (calc.js)
module.exports = {
    data: new SlashCommandBuilder()
        .setName('calc')
        .setDescription('Simple calculation.')
        .addNumberOption(o => o.setName('num1').setDescription('First number').setRequired(true))
        .addStringOption(o => o.setName('operator').setDescription('+, -, *, /').setRequired(true))
        .addNumberOption(o => o.setName('num2').setDescription('Second number').setRequired(true)),
    async execute(interaction) {
        const n1 = interaction.options.getNumber('num1');
        const op = interaction.options.getString('operator');
        const n2 = interaction.options.getNumber('num2');
        let res;
        if (op === '+') res = n1 + n2;
        else if (op === '-') res = n1 - n2;
        else if (op === '*') res = n1 * n2;
        else if (op === '/') res = n2 !== 0 ? n1 / n2 : 'Cannot divide by zero';
        else res = 'Invalid operator';
        await interaction.reply(`🧮 Result: **${res}**`);
    },
};

// 3. Joke Command (joke.js)
module.exports = {
    data: new SlashCommandBuilder()
        .setName('joke')
        .setDescription('Tells a random joke.'),
    async execute(interaction) {
        const jokes = [
            "Why don't programmers like nature? It has too many bugs.",
            "Why do programmers wear glasses? Because they don't C#.",
            "There are 10 types of people in the world: those who understand binary, and those who don't."
        ];
        const joke = jokes[Math.floor(Math.random() * jokes.length)];
        await interaction.reply(`😂 ${joke}`);
    },
};

// 4. Fact Command (fact.js)
module.exports = {
    data: new SlashCommandBuilder()
        .setName('fact')
        .setDescription('Gives a random fun fact.'),
    async execute(interaction) {
        const facts = [
            "Honey never spoils. Archaeologists have found pots of honey in ancient Egyptian tombs that are over 3,000 years old.",
            "Bananas are curved because they grow towards the sun.",
            "Octopuses have three hearts."
        ];
        const fact = facts[Math.floor(Math.random() * facts.length)];
        await interaction.reply(`🧠 **Fun Fact:** ${fact}`);
    },
};

// 5. Meme Command (meme.js)
module.exports = {
    data: new SlashCommandBuilder()
        .setName('meme')
        .setDescription('Sends a funny text meme.'),
    async execute(interaction) {
        await interaction.reply("💻 Programmer: *Writes 100 lines of code*\n💻 Code: *Doesn't work*\n💻 Programmer: *Looks at it for 2 hours*\n💻 Programmer: *Changes a semicolon*\n💻 Code: *Works perfectly*");
    },
};

// 6. Hug Command (hug.js)
module.exports = {
    data: new SlashCommandBuilder()
        .setName('hug')
        .setDescription('Give a warm hug to someone.')
        .addUserOption(o => o.setName('target').setDescription('User to hug').setRequired(true)),
    async execute(interaction) {
        const target = interaction.options.getUser('target');
        await interaction.reply(`🤗 ${interaction.user} gives a warm hug to ${target}!`);
    },
};

// 7. Slap Command (slap.js)
module.exports = {
    data: new SlashCommandBuilder()
        .setName('slap')
        .setDescription('Slap someone playfully.')
        .addUserOption(o => o.setName('target').setDescription('User to slap').setRequired(true)),
    async execute(interaction) {
        const target = interaction.options.getUser('target');
        await interaction.reply(`👋 ${interaction.user} slaps ${target} around a bit with a large trout!`);
    },
};

// 8. Rate Command (rate.js)
module.exports = {
    data: new SlashCommandBuilder()
        .setName('rate')
        .setDescription('Rates something out of 10.')
        .addStringOption(o => o.setName('thing').setDescription('What to rate').setRequired(true)),
    async execute(interaction) {
        const thing = interaction.options.getString('thing');
        const rating = Math.floor(Math.random() * 11);
        await interaction.reply(`⭐ I rate **${thing}** a **${rating}/10**!`);
    },
};

// 9. RPS Command (rps.js - Rock Paper Scissors)
module.exports = {
    data: new SlashCommandBuilder()
        .setName('rps')
        .setDescription('Play Rock, Paper, Scissors.')
        .addStringOption(o => 
            o.setName('choice')
            .setDescription('Choose rock, paper, or scissors')
            .setRequired(true)
            .addChoices(
                { name: 'Rock', value: 'rock' },
                { name: 'Paper', value: 'paper' },
                { name: 'Scissors', value: 'scissors' }
            )),
    async execute(interaction) {
        const userChoice = interaction.options.getString('choice');
        const choices = ['rock', 'paper', 'scissors'];
        const botChoice = choices[Math.floor(Math.random() * choices.length)];
        
        let result = '';
        if (userChoice === botChoice) {
            result = "It's a tie!";
        } else if (
            (userChoice === 'rock' && botChoice === 'scissors') ||
            (userChoice === 'paper' && botChoice === 'rock') ||
            (userChoice === 'scissors' && botChoice === 'paper')
        ) {
            result = 'You win! 🎉';
        } else {
            result = 'I win! 🤖';
        }

        await interaction.reply(`You chose **${userChoice}**, I chose **${botChoice}**. ${result}`);
    },
};

// 10. Coin Toss Custom (rollcoin.js)
module.exports = {
    data: new SlashCommandBuilder()
        .setName('rollcoin')
        .setDescription('Advanced coin toss game.'),
    async execute(interaction) {
        const outcomes = ['Heads', 'Tails', 'Edge (Lucky!)'];
        const result = outcomes[Math.floor(Math.random() * outcomes.length)];
        await interaction.reply(`🪙 The coin spin result is: **${result}**`);
    }, 
}; 
  
