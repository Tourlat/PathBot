const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const MapsService = require('../../services/MapsService');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('route')
        .setDescription('Get route information between two locations')
        .addStringOption(option =>
            option.setName('origin')
                .setDescription('Starting location (address)')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('destination')
                .setDescription('Destination (address)')
                .setRequired(true))
        .addBooleanOption(option =>
            option.setName('alternatives')
                .setDescription('Show alternative routes')
                .setRequired(false)),
    
    async execute(interaction) {
        // Defer the reply since API calls can take time
        await interaction.deferReply();
        
        const origin = interaction.options.getString('origin');
        const destination = interaction.options.getString('destination');
        const showAlternatives = interaction.options.getBoolean('alternatives') || false;
        
        const mapsService = new MapsService();

        try {
            if (showAlternatives) {
                // Get alternative routes
                const routes = await mapsService.getAlternativeRoutes(origin, destination);
                
                const embed = new EmbedBuilder()
                    .setTitle('🗺️ Route Options')
                    .setDescription(`**From:** ${origin}\n**To:** ${destination}`)
                    .setColor('#0099ff')
                    .setTimestamp();

                routes.forEach((route, index) => {
                    const trafficEmoji = route.trafficDelay > 0 ? '🔴' : '🟢';
                    const trafficText = route.trafficDelay > 0 ? 
                        `\n⚠️ +${route.trafficDelay} min delay` : 
                        '\n✅ Smooth traffic';

                    embed.addFields({
                        name: `${trafficEmoji} Route ${index + 1}`,
                        value: `**Distance:** ${route.distance}\n**Duration:** ${route.durationInTraffic}${trafficText}`,
                        inline: true
                    });
                });

                await interaction.editReply({ embeds: [embed] });
            } else {
                // Get single best route
                const routeInfo = await mapsService.getRouteInfo(origin, destination);
                
                const trafficEmoji = routeInfo.hasTrafficDelay ? '🔴' : '🟢';
                const trafficText = routeInfo.hasTrafficDelay ? 
                    `\n⚠️ +${routeInfo.trafficDelay} min delay due to traffic` : 
                    '\n✅ Smooth traffic conditions';

                const embed = new EmbedBuilder()
                    .setTitle('🗺️ Route Information')
                    .setColor(routeInfo.hasTrafficDelay ? '#ff6b6b' : '#51cf66')
                    .addFields(
                        { name: '📍 From', value: routeInfo.startAddress, inline: false },
                        { name: '🎯 To', value: routeInfo.endAddress, inline: false },
                        { name: '📏 Distance', value: routeInfo.distance, inline: true },
                        { name: '⏱️ Duration', value: routeInfo.durationInTraffic, inline: true },
                        { name: '🚦 Traffic', value: trafficText, inline: false }
                    )
                    .setTimestamp()
                    .setFooter({ text: 'Real-time traffic data included' });

                await interaction.editReply({ embeds: [embed] });
            }

        } catch (error) {
            console.error('Route command error:', error);
            
            const errorEmbed = new EmbedBuilder()
                .setTitle('❌ Route Error')
                .setDescription(`Unable to get route information: ${error.message}`)
                .setColor('#ff6b6b')
                .setTimestamp();

            await interaction.editReply({ embeds: [errorEmbed] });
        }
    },
};