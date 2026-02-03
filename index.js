const { Client, GatewayIntentBits, EmbedBuilder, ActivityType, PermissionsBitField, ActionRowBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle, REST, Routes, SlashCommandBuilder, ChannelType } = require('discord.js');
require('dotenv').config();

const TOKEN = process.env.DISCORD_TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;
const OWNER_ID = process.env.OWNER_ID;

// ==================== STAFF APPLICATION CONFIG ====================
const STAFF_POSITIONS = {
    "Manager": { 
        limit: 1, 
        color: 0xFF0000, 
        emoji: "👑",
        questions: [
            "Why should you be Manager?",
            "What changes would you make?",
            "How handle staff conflicts?",
            "Your server vision?",
            "Daily availability?",
            "Leadership experience?",
            "Final message?"
        ]
    },
    "Head Admin": { 
        limit: 1, 
        color: 0xFF4500, 
        emoji: "🔴",
        questions: [
            "Why Head Admin?",
            "Admin experience?",
            "How train new admins?",
            "Conflict resolution?",
            "Activity level?",
            "Server improvements?",
            "Why choose you?"
        ]
    },
    "Senior Admin": { 
        limit: 2, 
        color: 0xFF8C00, 
        emoji: "🟠",
        questions: [
            "Why Senior Admin?",
            "Previous experience?",
            "Handle rule breakers?",
            "Availability?",
            "Work with mods?",
            "Leadership style?",
            "Goals?"
        ]
    },
    "Junior Admin": { 
        limit: 2, 
        color: 0xFFA500, 
        emoji: "🟡",
        questions: [
            "Why Junior Admin?",
            "What to learn?",
            "Mod experience?",
            "Availability?",
            "Teamwork skills?",
            "Problem solving?",
            "Why you?"
        ]
    },
    "Head Mod": { 
        limit: 1, 
        color: 0x9ACD32, 
        emoji: "🟢",
        questions: [
            "What makes Head Mod?",
            "Organize mod team?",
            "Conflict experience?",
            "Daily availability?",
            "Training plans?",
            "Mod improvements?",
            "Why lead?"
        ]
    },
    "Senior Mod": { 
        limit: 2, 
        color: 0x00FF00, 
        emoji: "🔵",
        questions: [
            "Why Senior Mod?",
            "Difficult members?",
            "Favorite tools?",
            "Hours/week?",
            "Rule knowledge?",
            "Help juniors?",
            "Motivation?"
        ]
    },
    "Junior Mod": { 
        limit: 2, 
        color: 0x1E90FF, 
        emoji: "🟣",
        questions: [
            "Why be mod?",
            "Good moderator traits?",
            "Handle toxicity?",
            "Availability?",
            "Learn from?",
            "Rules knowledge?",
            "Final message"
        ]
    },
    "Head Staff": { 
        limit: 1, 
        color: 0x9370DB, 
        emoji: "⭐",
        questions: [
            "What's Head Staff?",
            "Improve staff morale?",
            "Leadership experience?",
            "Availability?",
            "Team building?",
            "Staff issues?",
            "Vision?"
        ]
    },
    "Senior Staff": { 
        limit: 2, 
        color: 0x8A2BE2, 
        emoji: "🌟",
        questions: [
            "Why Senior Staff?",
            "Contributions so far?",
            "What to change?",
            "Availability?",
            "Help juniors?",
            "Server impact?",
            "Goals?"
        ]
    },
    "Junior Staff": { 
        limit: 2, 
        color: 0xDA70D6, 
        emoji: "✨",
        questions: [
            "Why join staff?",
            "What to contribute?",
            "Enjoy about server?",
            "Availability?",
            "Skills?",
            "Learn?",
            "Why pick you?"
        ]
    },
    "Helper/Support": { 
        limit: 3, 
        color: 0xADD8E6, 
        emoji: "💠",
        questions: [
            "Why Helper/Support?",
            "Patient with new members?",
            "Help confused members?",
            "Availability?",
            "Knowledge level?",
            "Team player?",
            "Final thoughts"
        ]
    }
};

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.DirectMessages,
        GatewayIntentBits.GuildMessageReactions
    ]
});

// Store data
const userApplications = new Map();
const pendingApplications = new Map();
const logChannels = new Map();

// ==================== BOT READY ====================
client.once('ready', async () => {
    console.log(`✅ ${client.user.tag} is online!`);
    
    const rest = new REST({ version: '10' }).setToken(TOKEN);
    try {
        await rest.put(Routes.applicationCommands(CLIENT_ID), { 
            body: [
                new SlashCommandBuilder()
                    .setName('apply')
                    .setDescription('Start a staff application'),
                
                new SlashCommandBuilder()
                    .setName('positions')
                    .setDescription('View available positions'),
                
                new SlashCommandBuilder()
                    .setName('logging')
                    .setDescription('Set log channel (Owner only)')
                    .addChannelOption(option =>
                        option.setName('channel')
                            .setDescription('Channel for applications')
                            .setRequired(true)
                            .addChannelTypes(ChannelType.GuildText))
            ]
        });
        console.log('✅ Slash commands registered!');
    } catch (error) {
        console.error('❌ Error:', error);
    }
    
    client.user.setActivity({
        name: '/apply for staff',
        type: ActivityType.Watching
    });
});

// ==================== SLASH COMMAND HANDLER ====================
client.on('interactionCreate', async (interaction) => {
    if (!interaction.isCommand()) return;
    
    if (interaction.commandName === 'apply') {
        await showPositionSelect(interaction);
    }
    
    else if (interaction.commandName === 'positions') {
        await showPositionSelect(interaction);
    }
    
    else if (interaction.commandName === 'logging') {
        if (interaction.user.id !== OWNER_ID) {
            return interaction.reply({ 
                content: '❌ Only the owner can use this command!', 
                ephemeral: true 
            });
        }
        
        const channel = interaction.options.getChannel('channel');
        logChannels.set(interaction.guild.id, channel.id);
        
        await interaction.reply({ 
            content: `✅ Log channel set to ${channel}`, 
            ephemeral: true 
        });
    }
});

// ==================== SHOW POSITION SELECTION ====================
async function showPositionSelect(interaction) {
    const embed = new EmbedBuilder()
        .setTitle('👥 Available Staff Positions')
        .setDescription('Click a button below to apply for that position')
        .setColor(0x0099FF);
    
    const rows = [];
    let currentRow = new ActionRowBuilder();
    let buttonCount = 0;
    
    Object.entries(STAFF_POSITIONS).forEach(([position, data]) => {
        const current = getCurrentSlotCount(interaction.guild, position);
        const isFull = current >= data.limit;
        
        const button = new ButtonBuilder()
            .setCustomId(`select_${position}`)
            .setLabel(`${position} (${current}/${data.limit})`)
            .setStyle(isFull ? ButtonStyle.Danger : ButtonStyle.Primary)
            .setEmoji(data.emoji)
            .setDisabled(isFull);
        
        currentRow.addComponents(button);
        buttonCount++;
        
        if (buttonCount % 5 === 0) {
            rows.push(currentRow);
            currentRow = new ActionRowBuilder();
        }
    });
    
    if (currentRow.components.length > 0) {
        rows.push(currentRow);
    }
    
    await interaction.reply({ 
        embeds: [embed], 
        components: rows,
        ephemeral: true 
    });
}

// ==================== BUTTON HANDLER ====================
client.on('interactionCreate', async (interaction) => {
    if (!interaction.isButton()) return;
    
    if (interaction.customId.startsWith('select_')) {
        const position = interaction.customId.replace('select_', '');
        await startApplication(interaction, position);
    }
    
    else if (interaction.customId.startsWith('next_')) {
        const [_, position, nextIndex] = interaction.customId.split('_');
        await showQuestionModal(interaction, position, parseInt(nextIndex));
    }
    
    else if (interaction.customId === 'cancel_application') {
        const key = `${interaction.user.id}_${interaction.guild.id}`;
        userApplications.delete(key);
        
        await interaction.update({ 
            content: '❌ Application cancelled.', 
            embeds: [], 
            components: [] 
        });
    }
    
    else if (interaction.customId === 'submit_application') {
        const key = `${interaction.user.id}_${interaction.guild.id}`;
        const appData = userApplications.get(key);
        
        if (!appData) {
            return interaction.reply({ 
                content: '❌ Application data not found!', 
                ephemeral: true 
            });
        }
        
        await submitApplication(interaction, appData.position);
    }
});

// ==================== START APPLICATION ====================
async function startApplication(interaction, position) {
    const data = STAFF_POSITIONS[position];
    
    // Check for pending application
    const pendingApps = pendingApplications.get(interaction.guild.id) || [];
    if (pendingApps.some(app => app.userId === interaction.user.id)) {
        return interaction.reply({ 
            content: '❌ You already have a pending application!', 
            ephemeral: true 
        });
    }
    
    // Initialize application data
    const key = `${interaction.user.id}_${interaction.guild.id}`;
    userApplications.set(key, {
        position: position,
        answers: [],
        currentQuestion: 0,
        startTime: Date.now()
    });
    
    // Show first question
    await showQuestionModal(interaction, position, 0);
}

// ==================== FIXED: SHOW QUESTION MODAL ====================
async function showQuestionModal(interaction, position, questionIndex) {
    const data = STAFF_POSITIONS[position];
    const question = data.questions[questionIndex];
    const totalQuestions = data.questions.length;
    
    const modal = new ModalBuilder()
        .setCustomId(`answer_${position}_${questionIndex}`)
        .setTitle(`${position} - Question ${questionIndex + 1}/${totalQuestions}`);
    
    const input = new TextInputBuilder()
        .setCustomId('answer_input')
        .setLabel(`Question ${questionIndex + 1}/${totalQuestions}`)
        .setStyle(TextInputStyle.Paragraph)
        .setPlaceholder(question)
        .setRequired(true)
        .setMinLength(10)
        .setMaxLength(1000);
    
    modal.addComponents(new ActionRowBuilder().addComponents(input));
    
    // If this is coming from a button click (not initial), we need to show modal differently
    if (interaction.isButton()) {
        await interaction.showModal(modal);
    } else {
        // This shouldn't happen, but just in case
        await interaction.showModal(modal);
    }
}

// ==================== FIXED: MODAL SUBMIT HANDLER ====================
client.on('interactionCreate', async (interaction) => {
    if (!interaction.isModalSubmit()) return;
    
    if (interaction.customId.startsWith('answer_')) {
        const [_, position, questionIndexStr] = interaction.customId.split('_');
        const questionIndex = parseInt(questionIndexStr);
        const answer = interaction.fields.getTextInputValue('answer_input');
        
        const key = `${interaction.user.id}_${interaction.guild.id}`;
        let appData = userApplications.get(key);
        
        if (!appData) {
            return interaction.reply({ 
                content: '❌ Application session expired. Please start over with `/apply`.', 
                ephemeral: true 
            });
        }
        
        // Store answer
        appData.answers[questionIndex] = answer;
        appData.currentQuestion = questionIndex + 1;
        
        const data = STAFF_POSITIONS[position];
        const nextIndex = questionIndex + 1;
        
        // Check if there are more questions
        if (nextIndex < data.questions.length) {
            // Show next question IMMEDIATELY
            await showQuestionModal(interaction, position, nextIndex);
        } else {
            // All questions answered - show summary
            await showApplicationSummary(interaction, position);
        }
    }
});

// ==================== SHOW APPLICATION SUMMARY ====================
async function showApplicationSummary(interaction, position) {
    const key = `${interaction.user.id}_${interaction.guild.id}`;
    const appData = userApplications.get(key);
    const data = STAFF_POSITIONS[position];
    
    const embed = new EmbedBuilder()
        .setTitle('📋 Application Summary')
        .setDescription(`**Position:** ${position}\n**Questions Completed:** ${appData.answers.length}/${data.questions.length}`)
        .setColor(data.color)
        .setFooter({ text: 'Review your answers below before submitting' });
    
    // Show preview of answers
    for (let i = 0; i < Math.min(3, appData.answers.length); i++) {
        if (appData.answers[i]) {
            const preview = appData.answers[i].length > 100 
                ? appData.answers[i].substring(0, 100) + '...' 
                : appData.answers[i];
            embed.addFields({
                name: `Q${i + 1} Preview`,
                value: preview,
                inline: false
            });
        }
    }
    
    const buttons = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId('submit_application')
            .setLabel('Submit Application')
            .setStyle(ButtonStyle.Success)
            .setEmoji('✅'),
        new ButtonBuilder()
            .setCustomId('cancel_application')
            .setLabel('Cancel')
            .setStyle(ButtonStyle.Danger)
            .setEmoji('❌')
    );
    
    // IMPORTANT: Modal submissions need to reply, not followUp
    await interaction.reply({ 
        content: '✅ All questions completed! Review your answers:',
        embeds: [embed], 
        components: [buttons],
        ephemeral: true 
    });
}

// ==================== SUBMIT APPLICATION ====================
async function submitApplication(interaction, position) {
    const key = `${interaction.user.id}_${interaction.guild.id}`;
    const appData = userApplications.get(key);
    
    // Validate all answers
    const data = STAFF_POSITIONS[position];
    if (appData.answers.length !== data.questions.length) {
        return interaction.reply({ 
            content: '❌ Please answer all questions before submitting!', 
            ephemeral: true 
        });
    }
    
    // Create application object
    const appId = generateId();
    const application = {
        id: appId,
        userId: interaction.user.id,
        username: interaction.user.username,
        avatar: interaction.user.displayAvatarURL(),
        position: position,
        answers: appData.answers,
        timestamp: Date.now(),
        guildId: interaction.guild.id
    };
    
    // Store in pending applications
    if (!pendingApplications.has(interaction.guild.id)) {
        pendingApplications.set(interaction.guild.id, []);
    }
    pendingApplications.get(interaction.guild.id).push(application);
    
    // Clean up
    userApplications.delete(key);
    
    // Update the interaction
    await interaction.update({
        content: `✅ **Application Submitted Successfully!**\n\n**Position:** ${position}\n**Application ID:** \`${appId}\`\n**Status:** ⏳ Pending Owner Review`,
        embeds: [],
        components: []
    });
    
    // Send to log channel
    await sendToLogChannel(interaction, application);
}

// ==================== SEND TO LOG CHANNEL ====================
async function sendToLogChannel(interaction, application) {
    const logChannelId = logChannels.get(interaction.guild.id);
    
    if (!logChannelId) {
        console.log(`⚠️ No log channel set. Use /logging to set one.`);
        return;
    }
    
    const logChannel = interaction.guild.channels.cache.get(logChannelId);
    
    if (!logChannel) {
        console.error(`❌ Log channel not found`);
        return;
    }
    
    const data = STAFF_POSITIONS[application.position];
    
    const embed = new EmbedBuilder()
        .setTitle(`📋 New Application - ${application.position}`)
        .setDescription(`**Applicant:** <@${application.userId}>\n**Submitted:** <t:${Math.floor(application.timestamp / 1000)}:R>\n**Application ID:** \`${application.id}\``)
        .setColor(data.color)
        .setThumbnail(application.avatar)
        .setTimestamp();
    
    // Add all questions and answers
    data.questions.forEach((question, index) => {
        const answer = application.answers[index] || 'No answer';
        embed.addFields({
            name: `**Q${index + 1}:** ${question}`,
            value: answer.length > 500 ? answer.substring(0, 500) + '...' : answer,
            inline: false
        });
    });
    
    await logChannel.send({ 
        content: `📬 **New Staff Application** - <@${OWNER_ID}>`, 
        embeds: [embed] 
    });
}

// ==================== HELPER FUNCTIONS ====================
function getCurrentSlotCount(guild, position) {
    const role = guild.roles.cache.find(r => r.name === position);
    return role ? role.members.size : 0;
}

function generateId() {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
}

// ==================== LOGIN ====================
client.login(TOKEN).catch(error => {
    console.error('❌ Failed to login:', error);
    process.exit(1);
});
