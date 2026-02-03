const { SlashCommandBuilder } = require('discord.js');
const PathService = require('../../services/PathService');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('deleteroute')
        .setDescription('Delete a saved route')
        .addStringOption(option =>
            option.setName('alias')
                .setDescription('Route alias to delete')
                .setRequired(true)),

    async execute(interaction) {
        const pathService = new PathService();
        const alias = interaction.options.getString('alias');

        try {
            await pathService.deleteRoute(interaction.user.id, alias);

            await interaction.reply({
                content: `✅ Route "${alias}" deleted successfully!`,
                ephemeral: true
            });
        } catch (error) {
            await interaction.reply({
                content: `❌ Error: ${error.message}`,
                ephemeral: true
            });
        }
    },
};