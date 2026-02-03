const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');


/**
 * Allows reloading a command.
 * Usage : /reload <command>
 */
module.exports = {
    data: new SlashCommandBuilder()
        .setName('reload')
        .setDescription('Reloads a command.')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addStringOption((option) => option.setName('command').setDescription('The command to reload.').setRequired(true)),
    async execute(interaction) {

        if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
            return interaction.reply({ content: "You don't have permission to use this command.", ephemeral: true });
        }
        const commandName = interaction.options.getString('command', true).toLowerCase();
        const command = interaction.client.commands.get(commandName);

        if (!command) {
            return interaction.reply({ content: `There is no command with name \`${commandName}\`!`, ephemeral: true });
        }

        const commandPath = `../paths/${commandName}Command.js`;
        delete require.cache[require.resolve(`${commandPath}`)];
        const newCommand = require(`${commandPath}`);
        interaction.client.commands.set(newCommand.data.name, newCommand);
        await interaction.reply({
            content: `Command \`${commandName}\` has been reloaded!`,
            ephemeral: true
        });
    },
};