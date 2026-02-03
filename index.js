const { Client, GatewayIntentBits, EmbedBuilder, ActivityType, ActionRowBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle, REST, Routes, SlashCommandBuilder, ChannelType } = require('discord.js');
require('dotenv').config();

const TOKEN = process.env.DISCORD_TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;
const OWNER_ID = process.env.OWNER_ID;

// ==================== ALL 11 STAFF POSITIONS WITH DIFFERENT QUESTIONS ====================
const STAFF_POSITIONS = {
    "Manager": {
        limit: 1,
        color: 0xFF0000,
        emoji: "ðŸ‘‘",
        questions: [
            "Why should you be Manager? (List your qualifications and experience)",
            "What specific changes would you implement in the server?",
            "How would you handle serious conflicts between staff members?",
            "Describe your vision for the server's future growth",
            "What is your daily availability and timezone?",
            "Share your previous leadership experience in detail",
            "Final message: Why should we choose you over others?"
        ]
    },
    "Head Admin": {
        limit: 1,
        color: 0xFF4500,
        emoji: "ðŸ”´",
        questions: [
            "Why do you want to be Head Admin specifically?",
            "What is your previous admin experience? (List servers, duration)",
            "How would you train and mentor new admins?",
            "Describe your approach to conflict resolution",
            "What is your activity level (hours per day, days per week)?",
            "What specific improvements would you suggest for the server?",
            "Why should we trust you with administrative powers?"
        ]
    },
    "Senior Admin": {
        limit: 2,
        color: 0xFF8C00,
        emoji: "ðŸŸ ",
        questions: [
            "Why are you applying for Senior Admin?",
            "What admin/mod experience do you have?",
            "How do you handle rule breakers and what punishments do you give?",
            "What is your availability schedule?",
            "How do you collaborate with moderators?",
            "Describe your leadership style in detail",
            "What goals would you have as Senior Admin?"
        ]
    },
    "Junior Admin": {
        limit: 3,
        color: 0xFFA500,
        emoji: "ðŸŸ¡",
        questions: [
            "Why do you want to be Junior Admin?",
            "What specific skills do you hope to learn?",
            "Do you have any previous mod/admin experience? If yes, describe",
            "What is your weekly availability?",
            "How do you handle teamwork and cooperation?",
            "Describe a recent problem you solved and how you solved it",
            "Why should we invest time in training you?"
        ]
    },
    "Head Mod": {
        limit: 1,
        color: 0x9ACD32,
        emoji: "ðŸŸ¢",
        questions: [
            "What qualities make you suitable for Head Mod?",
            "How would you organize and schedule the mod team?",
            "Share your experience with conflict resolution",
            "What is your daily availability for moderation?",
            "How would you train new moderators?",
            "What improvements would you make to the moderation system?",
            "Why do you want to lead the moderation team?"
        ]
    },
    "Senior Mod": {
        limit: 2,
        color: 0x00FF00,
        emoji: "ðŸ”µ",
        questions: [
            "Why Senior Moderator position?",
            "How do you handle difficult or toxic members?",
            "What moderation tools and bots are you familiar with?",
            "How many hours per week can you dedicate to moderation?",
            "How well do you know the server rules? List 5 important rules",
            "How would you assist and guide junior moderators?",
            "What motivates you to moderate consistently?"
        ]
    },
    "Junior Mod": {
        limit: 4,
        color: 0x1E90FF,
        emoji: "ðŸŸ£",
        questions: [
            "Why do you want to become a Moderator?",
            "What are the most important qualities of a good moderator?",
            "How do you handle toxic behavior and harassment?",
            "What is your availability schedule?",
            "Which staff members do you look up to and why?",
            "How familiar are you with all the server rules?",
            "Any final message or questions for us?"
        ]
    },
    "Head Staff": {
        limit: 1,
        color: 0x9370DB,
        emoji: "â­",
        questions: [
            "What does 'Head Staff' mean to you?",
            "How would you improve staff morale and teamwork?",
            "Describe your previous leadership experience",
            "What is your availability for staff meetings?",
            "How would you build a stronger staff team?",
            "How would you address staff conflicts and issues?",
            "What is your vision for the staff team?"
        ]
    },
    "Senior Staff": {
        limit: 2,
        color: 0x8A2BE2,
        emoji: "ðŸŒŸ",
        questions: [
            "Why Senior Staff position?",
            "What contributions have you made to the server so far?",
            "What changes would you implement in the staff team?",
            "What is your availability for staff duties?",
            "How would you mentor and help junior staff?",
            "What impact do you want to have on the server?",
            "What are your goals as Senior Staff?"
        ]
    },
    "Junior Staff": {
        limit: 5,
        color: 0xDA70D6,
        emoji: "âœ¨",
        questions: [
            "Why do you want to join the staff team?",
            "What specific contributions can you make to the server?",
            "What do you enjoy most about our server?",
            "What is your availability schedule?",
            "What skills and experiences do you bring?",
            "What do you hope to learn as staff?",
            "Why should we choose you over other applicants?"
        ]
    },
    "Helper/Support": {
        limit: 6,
        color: 0xADD8E6,
        emoji: "ðŸ’ ",
        questions: [
            "Why Helper/Support role?",
            "How patient are you with new members? Give examples",
            "How do you explain complex things to confused members?",
            "What is your availability for helping others?",
            "How knowledgeable are you about server features and rules?",
            "Are you a team player? Describe your teamwork experience",
            "Final thoughts on being a helper/support"
        ]
    }
};

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.DirectMessages
    ]
});

// Store data
const userApplications = new Map(); // Active applications
const pendingApplications = new Map(); // Submitted applications
const applicationHistory = new Map(); // Past applications
const logChannels = new Map(); // Log channels

// ==================== SLASH COMMANDS ====================
const commands = [
    new SlashCommandBuilder()
        .setName('apply')
        .setDescription('Apply for a staff position'),
    
    new SlashCommandBuilder()
        .setName('positions')
        .setDescription('View all staff positions and openings'),
    
    new SlashCommandBuilder()
        .setName('logging')
        .setDescription('Set applications log channel (Owner only)')
        .addChannelOption(option =>
            option.setName('channel')
                .setDescription('Where applications will be sent')
                .setRequired(true)
                .addChannelTypes(ChannelType.GuildText)),
    
    new SlashCommandBuilder()
        .setName('applications')
        .setDescription('View pending applications (Owner only)'),
    
    new SlashCommandBuilder()
        .setName('setup')
        .setDescription('Setup application message in channel (Owner only)')
        .addChannelOption(option =>
            option.setName('channel')
                .setDescription('Channel to send application message')
                .setRequired(true)
                .addChannelTypes(ChannelType.GuildText)),
    
    new SlashCommandBuilder()
        .setName('myapplication')
        .setDescription('Check your application status'),
    
    new SlashCommandBuilder()
        .setName('stats')
        .setDescription('View staff statistics')
];

// ==================== BOT READY ====================
client.once('ready', async () => {
    console.log(`âœ… ${client.user.tag} is online!`);
    
    // Register slash commands
    const rest = new REST({ version: '10' }).setToken(TOKEN);
    try {
        await rest.put(Routes.applicationCommands(CLIENT_ID), { body: commands });
        console.log('âœ… Slash commands registered!');
    } catch (error) {
        console.error('âŒ Error registering commands:', error);
    }
    
    client.user.setActivity({
        name: '/apply for staff',
        type: ActivityType.Watching
    });
});

// ==================== SLASH COMMAND HANDLER ====================
client.on('interactionCreate', async (interaction) => {
    if (!interaction.isCommand()) return;
    
    const { commandName, options } = interaction;
    
    if (commandName === 'apply') {
        await showPositionSelection(interaction);
    }
    
    else if (commandName === 'positions') {
        await showAllPositions(interaction);
    }
    
    else if (commandName === 'logging') {
        if (interaction.user.id !== OWNER_ID) {
            return interaction.reply({ 
                content: 'âŒ Only the owner can set the logging channel!', 
                ephemeral: true 
            });
        }
        
        const channel = options.getChannel('channel');
        logChannels.set(interaction.guild.id, channel.id);
        
        await interaction.reply({ 
            content: `âœ… Log channel set to ${channel}`, 
            ephemeral: true 
        });
    }
    
    else if (commandName === 'applications') {
        if (interaction.user.id !== OWNER_ID) {
            return interaction.reply({ 
                content: 'âŒ Only the owner can view applications!', 
                ephemeral: true 
            });
        }
        
        const apps = pendingApplications.get(interaction.guild.id) || [];
        
        if (apps.length === 0) {
            return interaction.reply({ 
                content: 'ðŸ“­ No pending applications.', 
                ephemeral: true 
            });
        }
        
        const embed = new EmbedBuilder()
            .setTitle('ðŸ“‹ Pending Applications')
            .setColor(0xFFA500)
            .setDescription(`**${apps.length}** applications waiting for review`);
        
        apps.forEach((app, index) => {
            const user = client.users.cache.get(app.userId) || { username: 'Unknown' };
            embed.addFields({
                name: `${index + 1}. ${user.username} - ${app.position}`,
                value: `ID: \`${app.id}\`\nSubmitted: <t:${Math.floor(app.timestamp/1000)}:R>`,
                inline: true
            });
        });
        
        await interaction.reply({ embeds: [embed], ephemeral: true });
    }
    
    else if (commandName === 'setup') {
        if (interaction.user.id !== OWNER_ID) {
            return interaction.reply({ 
                content: 'âŒ Only the owner can setup the application system!', 
                ephemeral: true 
            });
        }
        
        const channel = options.getChannel('channel');
        
        const embed = new EmbedBuilder()
            .setTitle('ðŸ“ Staff Applications Open!')
            .setDescription('Want to join our staff team? Apply now for one of our positions!')
            .setColor(0x0099FF)
            .addFields(
                { name: 'ðŸ“‹ How to Apply', value: '1. Click "Apply Now"\n2. Choose a position\n3. Answer all questions\n4. Submit application', inline: false },
                { name: 'â±ï¸ Review Time', value: '24-48 hours', inline: true },
                { name: 'ðŸ‘‘ Reviewer', value: 'Owner Only', inline: true }
            );
        
        const button = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('apply_now')
                .setLabel('Apply Now')
                .setStyle(ButtonStyle.Primary)
                .setEmoji('ðŸ“')
        );
        
        await channel.send({ embeds: [embed], components: [button] });
        
        await interaction.reply({ 
            content: `âœ… Application system setup in ${channel}!`, 
            ephemeral: true 
        });
    }
    
    else if (commandName === 'myapplication') {
        const apps = pendingApplications.get(interaction.guild.id) || [];
        const userApp = apps.find(app => app.userId === interaction.user.id);
        
        if (!userApp) {
            return interaction.reply({ 
                content: 'ðŸ“­ You have no pending applications.', 
                ephemeral: true 
            });
        }
        
        const embed = new EmbedBuilder()
            .setTitle('ðŸ“‹ Your Application Status')
            .setColor(0x0099FF)
            .addFields(
                { name: 'Position', value: userApp.position, inline: true },
                { name: 'Status', value: 'â³ Pending Review', inline: true },
                { name: 'Submitted', value: `<t:${Math.floor(userApp.timestamp/1000)}:R>`, inline: true },
                { name: 'Application ID', value: `\`${userApp.id}\``, inline: false }
            );
        
        await interaction.reply({ embeds: [embed], ephemeral: true });
    }
    
    else if (commandName === 'stats') {
        const totalMembers = interaction.guild.memberCount;
        const staffCount = Object.keys(STAFF_POSITIONS).reduce((total, position) => {
            return total + getCurrentSlotCount(interaction.guild, position);
        }, 0);
        
        const pendingApps = pendingApplications.get(interaction.guild.id) || [];
        const logChannelId = logChannels.get(interaction.guild.id);
        const logChannel = logChannelId ? interaction.guild.channels.cache.get(logChannelId) : null;
        
        const embed = new EmbedBuilder()
            .setTitle('ðŸ“Š Staff Statistics')
            .setColor(0x0099FF)
            .addFields(
                { name: 'ðŸ‘¥ Total Members', value: `**${totalMembers}**`, inline: true },
                { name: 'ðŸ‘‘ Current Staff', value: `**${staffCount}**`, inline: true },
                { name: 'ðŸ“‹ Pending Apps', value: `**${pendingApps.length}**`, inline: true },
                { name: 'ðŸ“ Log Channel', value: logChannel ? `${logChannel}` : 'âŒ Not set', inline: true },
                { name: 'ðŸŽ¯ Positions', value: `**${Object.keys(STAFF_POSITIONS).length}** total`, inline: true },
                { name: 'ðŸ‘‘ Owner', value: `<@${OWNER_ID}>`, inline: true }
            );
        
        await interaction.reply({ embeds: [embed], ephemeral: false });
    }
});

// ==================== BUTTON HANDLER ====================
client.on('interactionCreate', async (interaction) => {
    if (!interaction.isButton()) return;
    
    // Apply now button
    if (interaction.customId === 'apply_now') {
        await showPositionSelection(interaction);
    }
    
    // Select position
    else if (interaction.customId.startsWith('select_')) {
        const position = interaction.customId.replace('select_', '');
        await startApplicationForPosition(interaction, position);
    }
    
    // Cancel application
    else if (interaction.customId === 'cancel_application') {
        const key = `${interaction.user.id}_${interaction.guild.id}`;
        userApplications.delete(key);
        
        await interaction.update({ 
            content: 'âŒ Application cancelled.', 
            embeds: [], 
            components: [] 
        });
    }
    
    // Submit application
    else if (interaction.customId === 'submit_application') {
        const key = `${interaction.user.id}_${interaction.guild.id}`;
        const appData = userApplications.get(key);
        
        if (!appData) {
            return interaction.reply({ 
                content: 'âŒ Application data not found!', 
                ephemeral: true 
            });
        }
        
        await submitApplication(interaction, appData.position);
    }
    
    // Owner buttons
    else if (interaction.customId.startsWith('owner_')) {
        if (interaction.user.id !== OWNER_ID) {
            return interaction.reply({ 
                content: 'âŒ Only the owner can review applications!', 
                ephemeral: true 
            });
        }
        
        const [_, action, appId] = interaction.customId.split('_');
        
        if (action === 'accept' || action === 'deny') {
            await handleOwnerDecision(interaction, appId, action);
        }
        else if (action === 'accept_reason' || action === 'deny_reason') {
            await showReasonModal(interaction, appId, action);
        }
        else if (action === 'history') {
            await showUserHistory(interaction, appId);
        }
    }
});

// ==================== SHOW POSITION SELECTION ====================
async function showPositionSelection(interaction) {
    const embed = new EmbedBuilder()
        .setTitle('ðŸ‘¥ Select Staff Position')
        .setDescription('Choose a position to apply for:\n*All questions are text-based (no skip, no yes/no)*')
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
    
    if (interaction.replied || interaction.deferred) {
        await interaction.editReply({ 
            embeds: [embed], 
            components: rows 
        });
    } else {
        await interaction.reply({ 
            embeds: [embed], 
            components: rows,
            ephemeral: true 
        });
    }
}

// ==================== SHOW ALL POSITIONS ====================
async function showAllPositions(interaction) {
    const embed = new EmbedBuilder()
        .setTitle('ðŸ‘¥ All Staff Positions')
        .setDescription('**11 different positions available:**')
        .setColor(0x0099FF);
    
    Object.entries(STAFF_POSITIONS).forEach(([position, data]) => {
        const current = getCurrentSlotCount(interaction.guild, position);
        const status = current >= data.limit ? 'âŒ FULL' : 'âœ… OPEN';
        
        embed.addFields({
            name: `${data.emoji} ${position}`,
            value: `**Slots:** ${current}/${data.limit}\n**Status:** ${status}\n**Questions:** ${data.questions.length}`,
            inline: true
        });
    });
    
    embed.addFields({
        name: 'ðŸ“ Application Process',
        value: '1. Use `/apply` to start\n2. Choose a position\n3. Answer ALL text questions\n4. Submit for review',
        inline: false
    });
    
    await interaction.reply({ 
    embeds: [embed], 
        ephemeral: false 
    });
}

// ==================== START APPLICATION FOR POSITION ====================
async function startApplicationForPosition(interaction, position) {
    const data = STAFF_POSITIONS[position];
    
    if (!data) {
        return interaction.reply({ 
            content: 'âŒ Invalid position selected!', 
            ephemeral: true 
        });
    }
    
    // Check if position is full
    const current = getCurrentSlotCount(interaction.guild, position);
    if (current >= data.limit) {
        return interaction.update({ 
            content: `âŒ ${position} is currently full (${current}/${data.limit})!`, 
            embeds: [], 
            components: [] 
        });
    }
    
    // Check if user already has pending application
    const pendingApps = pendingApplications.get(interaction.guild.id) || [];
    if (pendingApps.some(app => app.userId === interaction.user.id)) {
        return interaction.reply({ 
            content: 'âŒ You already have a pending application!', 
            ephemeral: true 
        });
    }
    
    // Check if user already has staff role
    const hasStaffRole = interaction.member.roles.cache.some(role => 
        Object.keys(STAFF_POSITIONS).some(pos => role.name === pos)
    );
    
    if (hasStaffRole) {
        return interaction.reply({ 
            content: 'âŒ You already have a staff role!', 
            ephemeral: true 
        });
    }
    
    // Initialize application
    const key = `${interaction.user.id}_${interaction.guild.id}`;
    userApplications.set(key, {
        userId: interaction.user.id,
        guildId: interaction.guild.id,
        position: position,
        answers: new Array(data.questions.length).fill(''),
        currentQuestion: 0,
        startTime: Date.now()
    });
    
    // Show first question
    await showQuestionModal(interaction, position, 0);
}

// ==================== SHOW QUESTION MODAL ====================
async function showQuestionModal(interaction, position, questionIndex) {
    const data = STAFF_POSITIONS[position];
    const question = data.questions[questionIndex];
    const totalQuestions = data.questions.length;
    
    const modal = new ModalBuilder()
        .setCustomId(`question_${position}_${questionIndex}`)
        .setTitle(`${position} - Question ${questionIndex + 1}/${totalQuestions}`);
    
    const input = new TextInputBuilder()
        .setCustomId('answer')
        .setLabel(`Question ${questionIndex + 1}/${totalQuestions}`)
        .setStyle(TextInputStyle.Paragraph)
        .setPlaceholder(question)
        .setRequired(true)
        .setMinLength(10)
        .setMaxLength(2000);
    
    modal.addComponents(new ActionRowBuilder().addComponents(input));
    
    await interaction.showModal(modal);
}

// ==================== MODAL SUBMIT HANDLER ====================
client.on('interactionCreate', async (interaction) => {
    if (!interaction.isModalSubmit()) return;
    
    if (interaction.customId.startsWith('question_')) {
        const [_, position, questionIndexStr] = interaction.customId.split('_');
        const questionIndex = parseInt(questionIndexStr);
        const answer = interaction.fields.getTextInputValue('answer');
        
        const key = `${interaction.user.id}_${interaction.guild.id}`;
        let appData = userApplications.get(key);
        
        if (!appData) {
            return interaction.reply({ 
                content: 'âŒ Application session expired. Please start over with `/apply`.', 
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
            // Show next question
            await showQuestionModal(interaction, position, nextIndex);
        } else {
            // All questions answered - show summary
            await showApplicationSummary(interaction, position);
        }
    }
    
    // Reason modal for owner
    else if (interaction.customId.startsWith('reason_')) {
        const [_, action, appId] = interaction.customId.split('_');
        const reason = interaction.fields.getTextInputValue('reason');
        
        await handleOwnerDecision(interaction, appId, action, reason);
    }
});

// ==================== SHOW APPLICATION SUMMARY ====================
async function showApplicationSummary(interaction, position) {
    const key = `${interaction.user.id}_${interaction.guild.id}`;
    const appData = userApplications.get(key);
    const data = STAFF_POSITIONS[position];
    
    const embed = new EmbedBuilder()
        .setTitle('ðŸ“‹ Application Summary')
        .setDescription(`**Position:** ${position}\n**Questions Completed:** ${appData.answers.filter(a => a).length}/${data.questions.length}`)
        .setColor(data.color)
        .setFooter({ text: 'Review your answers before submitting' });
    
    // Show preview of first 2 answers
    for (let i = 0; i < Math.min(2, appData.answers.length); i++) {
        if (appData.answers[i]) {
            const preview = appData.answers[i].length > 150 
                ? appData.answers[i].substring(0, 150) + '...' 
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
            .setEmoji('âœ…'),
        new ButtonBuilder()
            .setCustomId('cancel_application')
            .setLabel('Cancel')
            .setStyle(ButtonStyle.Danger)
            .setEmoji('âŒ')
    );
    
    await interaction.reply({ 
        content: 'âœ… All questions completed! Review your answers:',
        embeds: [embed], 
        components: [buttons],
        ephemeral: true 
    });
}

// ==================== SUBMIT APPLICATION ====================
async function submitApplication(interaction, position) {
    const key = `${interaction.user.id}_${interaction.guild.id}`;
    const appData = userApplications.get(key);
    
    if (!appData) {
        return interaction.reply({ 
            content: 'âŒ Application data not found!', 
            ephemeral: true 
        });
    }
    
    // Validate all answers are filled
    const data = STAFF_POSITIONS[position];
    const missingAnswers = appData.answers.some(answer => !answer || answer.trim() === '');
    
    if (missingAnswers) {
        return interaction.reply({ 
            content: 'âŒ Please answer all questions before submitting!', 
            ephemeral: true 
        });
    }
    
    // Create application object
    const appId = generateId();
    const member = interaction.guild.members.cache.get(appData.userId) || await interaction.guild.members.fetch(appData.userId).catch(() => null);
    
    const application = {
        id: appId,
        userId: appData.userId,
        username: interaction.user.username,
        avatar: interaction.user.displayAvatarURL(),
        position: position,
        answers: [...appData.answers],
        timestamp: Date.now(),
        guildId: interaction.guild.id,
        joinedAt: member ? member.joinedTimestamp : Date.now(),
        level: 0 // You can add level system later
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
        content: `âœ… **Application Submitted Successfully!**\n\n**Position:** ${position}\n**Application ID:** \`${appId}\`\n**Status:** â³ Pending Owner Review\n\nYour application has been sent to the owner.`,
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
        console.log(`âš ï¸ No log channel set. Use /logging to set one.`);
        return;
    }
    
    const logChannel = interaction.guild.channels.cache.get(logChannelId);
    
    if (!logChannel) {
        console.error(`âŒ Log channel not found`);
        return;
    }
    
    const data = STAFF_POSITIONS[application.position];
    const member = interaction.guild.members.cache.get(application.userId) || await interaction.guild.members.fetch(application.userId).catch(() => null);
    const joinedDate = member ? Math.floor(member.joinedTimestamp / 1000) : Math.floor(Date.now() / 1000);
    
    // Create main embed
    let logContent = `**${application.username}'s Application for ${application.position}**\n\n`;
    
    // Add all questions and answers
    data.questions.forEach((question, index) => {
        const answer = application.answers[index] || 'No answer provided';
        logContent += `**${question}**\n`;
        logContent += `${answer}\n\n`;
    });
    logContent += '## Submission Stats\n';
    logContent += `**User ID:** ${application.userId}\n`;
    logContent += `**Username:** ${application.username}\n`;
    logContent += `**User:** <@${application.userId}>\n`;
    logContent += `**Level:** 0\n`;
    logContent += `**Requirement Check:** âœ… Met (Req: 0)\n`;
    logContent += `**Joined guild:** <t:${joinedDate}:R>\n`;
    logContent += `**Submitted:** <t:${Math.floor(application.timestamp / 1000)}:R>\n`;
    logContent += `**Application ID:** \`${application.id}\``;
    
    const embed = new EmbedBuilder()
        .setDescription(logContent.substring(0, 4096))
        .setColor(data.color)
        .setThumbnail(application.avatar)
        .setFooter({ text: `Application ID: ${application.id}` });
    
    // Action buttons for owner
    const row1 = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId(`owner_accept_${application.id}`)
            .setLabel('Accept')
            .setStyle(ButtonStyle.Success),
        new ButtonBuilder()
            .setCustomId(`owner_deny_${application.id}`)
            .setLabel('Deny')
            .setStyle(ButtonStyle.Danger)
    );
    
    const row2 = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId(`owner_accept_reason_${application.id}`)
            .setLabel('Accept with reason')
            .setStyle(ButtonStyle.Success),
        new ButtonBuilder()
            .setCustomId(`owner_deny_reason_${application.id}`)
            .setLabel('Deny with reason')
            .setStyle(ButtonStyle.Danger)
    );
    
    const row3 = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId(`owner_history_${application.id}`)
            .setLabel('History')
            .setStyle(ButtonStyle.Secondary),
        new ButtonBuilder()
            .setLabel('View Profile')
            .setStyle(ButtonStyle.Link)
            .setURL(`https://discord.com/users/${application.userId}`)
    );
    
    await logChannel.send({ 
        content: `ðŸ“¬ **New Staff Application** - <@${OWNER_ID}>`, 
        embeds: [embed], 
        components: [row1, row2, row3] 
    });
}

// ==================== OWNER FUNCTIONS ====================
async function handleOwnerDecision(interaction, appId, action, reason = 'No reason provided') {
    const apps = pendingApplications.get(interaction.guild.id) || [];
    const appIndex = apps.findIndex(app => app.id === appId);
    
    if (appIndex === -1) {
        return interaction.reply({ 
            content: 'âŒ Application not found!', 
            ephemeral: true 
        });
    }
    
    const application = apps[appIndex];
    const user = await client.users.fetch(application.userId).catch(() => null);
    
    apps.splice(appIndex, 1);
    pendingApplications.set(interaction.guild.id, apps);
    
    // Add to history
    const historyKey = `${application.userId}_${application.guildId}`;
    if (!applicationHistory.has(historyKey)) {
        applicationHistory.set(historyKey, []);
    }
    
    applicationHistory.get(historyKey).push({
        position: application.position,
        status: action.includes('accept') ? 'ACCEPTED' : 'DENIED',
        reason: reason,
        timestamp: Date.now(),
        reviewedBy: interaction.user.tag
    });
    
    if (action === 'accept' || action === 'accept_reason') {
        try {
            await user.send({
                embeds: [
                    new EmbedBuilder()
                        .setTitle('ðŸŽ‰ Application Accepted!')
                        .setDescription(`Your application for **${application.position}** has been **accepted**!`)
                        .setColor(0x00FF00)
                        .addFields(
                            { name: 'Position', value: application.position, inline: true },
                            { name: 'Accepted By', value: interaction.user.tag, inline: true },
                            { name: 'Reason', value: reason, inline: false }
                        )
                ]
            });
        } catch (error) {
            console.log(`Could not DM ${user?.tag}`);
        }
        
        try {
            await interaction.message.delete();
        } catch (error) {}
        
        await interaction.reply({
            content: `âœ… Accepted ${user?.tag || 'Unknown'}'s application for **${application.position}**!`,
            ephemeral: true
        });
        
    } else if (action === 'deny' || action === 'deny_reason') {
        try {
            await user.send({
                embeds: [
                    new EmbedBuilder()
                        .setTitle('âŒ Application Denied')
                        .setDescription(`Your application for **${application.position}** has been **denied**.`)
                        .setColor(0xFF0000)
                        .addFields(
                            { name: 'Position', value: application.position, inline: true },
                            { name: 'Denied By', value: interaction.user.tag, inline: true },
                            { name: 'Reason', value: reason, inline: false }
                        )
                ]
            });
        } catch (error) {
            console.log(`Could not DM ${user?.tag}`);
        }
        
        try {
            await interaction.message.delete();
        } catch (error) {}
        
        await interaction.reply({
            content: `âŒ Denied ${user?.tag || 'Unknown'}'s application for **${application.position}**.`,
            ephemeral: true
        });
    }
}

async function showReasonModal(interaction, appId, action) {
    const modal = new ModalBuilder()
        .setCustomId(`reason_${action}_${appId}`)
        .setTitle(`${action === 'accept_reason' ? 'Accept' : 'Deny'} with Reason`);
    
    const input = new TextInputBuilder()
        .setCustomId('reason')
        .setLabel('Enter your reason')
        .setStyle(TextInputStyle.Paragraph)
        .setRequired(true)
        .setPlaceholder('Type your reason here...')
        .setMaxLength(1000);
    
    modal.addComponents(new ActionRowBuilder().addComponents(input));
    
    await interaction.showModal(modal);
}

async function showUserHistory(interaction, appId) {
    const apps = pendingApplications.get(interaction.guild.id) || [];
    const application = apps.find(app => app.id === appId);
    
    if (!application) {
        return interaction.reply({ 
            content: 'âŒ Application not found!', 
            ephemeral: true 
        });
    }
    
    const historyKey = `${application.userId}_${application.guildId}`;
    const userHistory = applicationHistory.get(historyKey) || [];
    
    if (userHistory.length === 0) {
        return interaction.reply({ 
            content: 'ðŸ“­ No previous applications found for this user.', 
            ephemeral: true 
        });
    }
    
    const embed = new EmbedBuilder()
        .setTitle(`ðŸ“‹ Application History - ${application.username}`)
        .setColor(0x0099FF)
        .setDescription(`**Current Application:** ${application.position}`);
    
    userHistory.forEach((app, i) => {
        const statusEmoji = app.status === 'ACCEPTED' ? 'âœ…' : 'âŒ';
        embed.addFields({
            name: `${i + 1}. ${app.position} - ${statusEmoji} ${app.status}`,
            value: `**Reason:** ${app.reason}\n**Reviewed by:** ${app.reviewedBy}\n**Date:** <t:${Math.floor(app.timestamp / 1000)}:R>`,
            inline: false
        });
    });
    
    await interaction.reply({ 
        embeds: [embed], 
        ephemeral: true 
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
    console.error('âŒ Failed to login:', error);
    process.exit(1);
});
