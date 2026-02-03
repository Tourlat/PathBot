const { SlashCommandBuilder } = require('discord.js');


/**
 * Allows reloading a command.
 * Usage : /reload <command>
 */
module.exports = {
    data: new SlashCommandBuilder()
        .setName('reload')
        .setDescription('Reloads a command.')
        .addStringOption((option) => option.setName('command').setDescription('The command to reload.').setRequired(true)),
    async execute(interaction) {
        const commandName = interaction.options.getString('command', true).toLowerCase();
        const command = interaction.client.commands.get(commandName);
        if (!command) {
            return interaction.reply(`There is no command with name \`${commandName}\`!`);
        }

        delete require.cache[require.resolve(`./${commandName}Command.js`)];
        const newCommand = require(`./${commandName}Command.js`);
        interaction.client.commands.set(newCommand.data.name, newCommand);
        await interaction.reply(`Command \`${commandName}\` has been reloaded!`);
    },
};