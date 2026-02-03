const { Client, GatewayIntentBits, EmbedBuilder, ActivityType, PermissionsBitField, ActionRowBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle, REST, Routes, SlashCommandBuilder, ChannelType } = require('discord.js');
require('dotenv').config();

const TOKEN = process.env.DISCORD_TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;
const OWNER_ID = process.env.OWNER_ID;

// ==================== PIC PERMS CONFIG ====================
const ROLE_NAME = "Pic Perms";
const STATUS_TRIGGER = "/Ascalde"; // Fixed to match your screenshot
const CHECK_INTERVAL = 10000;
const roleCache = new Map();

// ==================== STAFF APPLICATION CONFIG ====================
const STAFF_POSITIONS = {
    "Manager": { 
        limit: 1, 
        color: 0xFF0000, 
        emoji: "👑",
        questions: [
            "1. Why should you be Manager?",
            "2. What changes would you make?",
            "3. How handle staff conflicts?",
            "4. Your server vision?",
            "5. Daily availability?",
            "6. Leadership experience?",
            "7. Final message?"
        ]
    },
    "Head Admin": { 
        limit: 1, 
        color: 0xFF4500, 
        emoji: "🔴",
        questions: [
            "1. Why Head Admin?",
            "2. Admin experience?",
            "3. How train new admins?",
            "4. Conflict resolution?",
            "5. Activity level?",
            "6. Server improvements?",
            "7. Why choose you?"
        ]
    },
    "Senior Admin": { 
        limit: 2, 
        color: 0xFF8C00, 
        emoji: "🟠",
        questions: [
            "1. Why Senior Admin?",
            "2. Previous experience?",
            "3. Handle rule breakers?",
            "4. Availability?",
            "5. Work with mods?",
            "6. Leadership style?",
            "7. Goals?"
        ]
    },
    "Junior Admin": { 
        limit: 2, 
        color: 0xFFA500, 
        emoji: "🟡",
        questions: [
            "1. Why Junior Admin?",
            "2. What to learn?",
            "3. Mod experience?",
            "4. Availability?",
            "5. Teamwork skills?",
            "6. Problem solving?",
            "7. Why you?"
        ]
    },
    "Head Mod": { 
        limit: 1, 
        color: 0x9ACD32, 
        emoji: "🟢",
        questions: [
            "1. What makes Head Mod?",
            "2. Organize mod team?",
            "3. Conflict experience?",
            "4. Daily availability?",
            "5. Training plans?",
            "6. Mod improvements?",
            "7. Why lead?"
        ]
    },
    "Senior Mod": { 
        limit: 2, 
        color: 0x00FF00, 
        emoji: "🔵",
        questions: [
            "1. Why Senior Mod?",
            "2. Difficult members?",
            "3. Favorite tools?",
            "4. Hours/week?",
            "5. Rule knowledge?",
            "6. Help juniors?",
            "7. Motivation?"
        ]
    },
    "Junior Mod": { 
        limit: 2, 
        color: 0x1E90FF, 
        emoji: "🟣",
        questions: [
            "1. Why be mod?",
            "2. Good moderator traits?",
            "3. Handle toxicity?",
            "4. Availability?",
            "5. Learn from?",
            "6. Rules knowledge?",
            "7. Final message"
        ]
    },
    "Head Staff": { 
        limit: 1, 
        color: 0x9370DB, 
        emoji: "⭐",
        questions: [
            "1. What's Head Staff?",
            "2. Improve staff morale?",
            "3. Leadership experience?",
            "4. Availability?",
            "5. Team building?",
            "6. Staff issues?",
            "7. Vision?"
        ]
    },
    "Senior Staff": { 
        limit: 2, 
        color: 0x8A2BE2, 
        emoji: "🌟",
        questions: [
            "1. Why Senior Staff?",
            "2. Contributions so far?",
            "3. What to change?",
            "4. Availability?",
            "5. Help juniors?",
            "6. Server impact?",
            "7. Goals?"
        ]
    },
    "Junior Staff": { 
        limit: 2, 
        color: 0xDA70D6, 
        emoji: "✨",
        questions: [
            "1. Why join staff?",
            "2. What to contribute?",
            "3. Enjoy about server?",
            "4. Availability?",
            "5. Skills?",
            "6. Learn?",
            "7. Why pick you?"
        ]
    },
    "Helper/Support": { 
        limit: 3, 
        color: 0xADD8E6, 
        emoji: "💠",
        questions: [
            "1. Why Helper/Support?",
            "2. Patient with new members?",
            "3. Help confused members?",
            "4. Availability?",
            "5. Knowledge level?",
            "6. Team player?",
            "7. Final thoughts"
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
        GatewayIntentBits.GuildMessageReactions,
        GatewayIntentBits.GuildPresences
    ]
});

// Store data
const pendingApplications = new Map();
const userApplications = new Map();
const logChannels = new Map();

// Slash Commands
const commands = [
    new SlashCommandBuilder()
        .setName('apply')
        .setDescription('Apply for a staff position'),
    
    new SlashCommandBuilder()
        .setName('logging')
        .setDescription('Set applications channel (Owner only)')
        .addChannelOption(option =>
            option.setName('channel')
                .setDescription('Select the logging channel')
                .setRequired(true)
                .addChannelTypes(ChannelType.GuildText)),
    
    new SlashCommandBuilder()
        .setName('positions')
        .setDescription('View all staff positions'),
    
    new SlashCommandBuilder()
        .setName('myapplication')
        .setDescription('Check your application status'),
    
    new SlashCommandBuilder()
        .setName('help')
        .setDescription('Show help menu')
];

// ==================== BOT READY ====================
client.once('ready', async () => {
    console.log("=".repeat(50));
    console.log(`✅ ${client.user.tag} is ONLINE!`);
    console.log(`📋 Staff Application System Active`);
    console.log(`🎯 Pic Perms System Active`);
    console.log(`👑 Owner ID: ${OWNER_ID}`);
    console.log("=".repeat(50));
    
    // Register slash commands
    const rest = new REST({ version: '10' }).setToken(TOKEN);
    try {
        await rest.put(Routes.applicationCommands(CLIENT_ID), { body: commands });
        console.log('✅ Slash commands registered!');
    } catch (error) {
        console.error('❌ Error registering commands:', error);
    }
    
    // Start Pic Perms checker
    startStatusChecker();
    
    client.user.setActivity({
        name: '/apply for staff',
        type: ActivityType.Watching
    });
});

// ==================== PIC PERMS FUNCTIONS ====================
function checkUserStatus(member) {
    if (!member || !member.presence) return false;
    
    for (const activity of member.presence.activities) {
        if (activity.type === 4 && activity.state && activity.state.includes(STATUS_TRIGGER)) {
            return true;
        }
        if (activity.name && activity.name.includes(STATUS_TRIGGER)) {
            return true;
        }
        if (activity.state && activity.state.includes(STATUS_TRIGGER)) {
            return true;
        }
    }
    
    return false;
}

async function getPicRole(guild) {
    if (roleCache.has(guild.id)) {
        return roleCache.get(guild.id);
    }
    
    const role = guild.roles.cache.find(r => r.name === ROLE_NAME);
    
    if (role) {
        roleCache.set(guild.id, role);
        return role;
    }
    
    return null;
}

function startStatusChecker() {
    setInterval(async () => {
        try {
            for (const guild of client.guilds.cache.values()) {
                const picRole = await getPicRole(guild);
                if (!picRole) continue;
                
                await guild.members.fetch();
                
                for (const member of guild.members.cache.values()) {
                    if (member.user.bot) continue;
                    
                    const hasTrigger = checkUserStatus(member);
                    const hasRole = member.roles.cache.has(picRole.id);
                    
                    try {
                        if (hasTrigger && !hasRole) {
                            await member.roles.add(picRole);
                        } else if (!hasTrigger && hasRole) {
                            await member.roles.remove(picRole);
                        }
                    } catch (error) {
                        console.error(`❌ Error with ${member.user.tag}:`, error.message);
                    }
                }
            }
        } catch (error) {
            console.error('Error in status checker:', error);
        }
    }, CHECK_INTERVAL);
}

// ==================== MESSAGE COMMANDS ====================
client.on('messageCreate', async (message) => {
    if (message.author.bot || !message.content.startsWith('$')) return;
    
    const args = message.content.slice(1).trim().split(/ +/);
    const command = args.shift().toLowerCase();
    
    if (command === 'test') {
        const member = message.member;
        const picRole = await getPicRole(message.guild);
        const hasTrigger = checkUserStatus(member);
        const hasRole = picRole ? member.roles.cache.has(picRole.id) : false;
        
        let response = `**🧪 Status Test for ${member.user.tag}:**\n`;
        response += `• Looking for: \`${STATUS_TRIGGER}\`\n`;
        response += `• Status Detected: ${hasTrigger ? '✅ YES' : '❌ NO'}\n`;
        response += `• Has Role: ${hasRole ? '✅ YES' : '❌ NO'}\n`;
        
        await message.reply(response);
    }
    
    else if (command === 'checkme') {
        const member = message.member;
        const picRole = await getPicRole(message.guild);
        const hasTrigger = checkUserStatus(member);
        const hasRole = picRole ? member.roles.cache.has(picRole.id) : false;
        
        const embed = new EmbedBuilder()
            .setTitle(`🔍 Status Check for ${member.user.username}`)
            .setColor(hasTrigger ? 0x00FF00 : 0xFF0000);
        
        embed.addFields({
            name: '✅ Status Check',
            value: `Looking for \`${STATUS_TRIGGER}\`: **${hasTrigger ? 'FOUND!' : 'NOT FOUND'}**`,
            inline: false
        });
        
        embed.addFields({
            name: '👑 Role Status',
            value: `\`${ROLE_NAME}\` role: **${hasRole ? 'HAS IT!' : 'DOES NOT HAVE'}**`,
            inline: false
        });
        
        await message.reply({ embeds: [embed] });
    }
    
    else if (command === 'help') {
        const embed = new EmbedBuilder()
            .setTitle('🤖 Bot Help Menu')
            .setColor(0x0099FF);
        
        embed.addFields(
            { name: '**📋 Staff Application Commands**', value: 'Slash commands:', inline: false },
            { name: '`/apply`', value: 'Start staff application', inline: true },
            { name: '`/positions`', value: 'View all positions', inline: true },
            { name: '`/myapplication`', value: 'Check your app', inline: true }
        );
        
        embed.addFields(
            { name: '**🎯 Pic Perms Commands**', value: 'Message commands:', inline: false },
            { name: '`$test`', value: 'Check status detection', inline: true },
            { name: '`$checkme`', value: 'Check your role status', inline: true }
        );
        
        await message.reply({ embeds: [embed] });
    }
});

// ==================== SLASH COMMAND HANDLER ====================
client.on('interactionCreate', async (interaction) => {
    if (!interaction.isCommand()) return;
    
    const { commandName, options } = interaction;
    
    if (commandName === 'apply') {
        await showAllPositions(interaction);
    }
    
    else if (commandName === 'positions') {
        await showAllPositions(interaction);
    }
    
    else if (commandName === 'logging') {
        if (interaction.user.id !== OWNER_ID) {
            return interaction.reply({ 
                content: '❌ Only the server owner can set the logging channel!', 
                ephemeral: true 
            });
        }
        
        const channel = options.getChannel('channel');
        logChannels.set(interaction.guild.id, channel.id);
        
        await interaction.reply({
            content: `✅ Logging channel set to ${channel}`,
            ephemeral: true
        });
    }
    
    else if (commandName === 'help') {
        const embed = new EmbedBuilder()
            .setTitle('🤖 Bot Help Menu')
            .setColor(0x0099FF);
        
        embed.addFields(
            { name: '**📋 Staff Application Commands**', value: 'Slash commands:', inline: false },
            { name: '`/apply`', value: 'Start staff application', inline: true },
            { name: '`/positions`', value: 'View all positions', inline: true },
            { name: '`/myapplication`', value: 'Check your application status', inline: true }
        );
        
        embed.addFields(
            { name: '**🎯 Pic Perms Commands**', value: 'Message commands:', inline: false },
            { name: '`$test`', value: 'Check status detection', inline: true },
            { name: '`$checkme`', value: 'Check your role status', inline: true }
        );
        
        await interaction.reply({ embeds: [embed], ephemeral: true });
    }
});

// ==================== FIXED: SHOW ALL POSITIONS ====================
async function showAllPositions(interaction) {
    const embed = new EmbedBuilder()
        .setTitle('👥 Available Staff Positions')
        .setDescription('Click a button below to apply for that position\n*Note: You can apply even if position shows as "full"*')
        .setColor(0x0099FF)
        .setFooter({ text: 'Positions in RED are currently full' });
    
    // Create buttons for ALL positions (not filtering out full ones)
    const rows = [];
    let currentRow = new ActionRowBuilder();
    let buttonCount = 0;
    
    Object.entries(STAFF_POSITIONS).forEach(([position, data]) => {
        const current = getCurrentSlotCount(interaction.guild, position);
        const isFull = current >= data.limit;
        
        const button = new ButtonBuilder()
            .setCustomId(`apply_${position}`)
            .setLabel(`${position} (${current}/${data.limit})`)
            .setStyle(isFull ? ButtonStyle.Danger : ButtonStyle.Primary)
            .setEmoji(data.emoji)
            .setDisabled(isFull); // Optional: disable if full
        
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
    
    if (interaction.customId.startsWith('apply_')) {
        const position = interaction.customId.replace('apply_', '');
        await startApplicationProcess(interaction, position);
    }
});

// ==================== FIXED APPLICATION PROCESS ====================
async function startApplicationProcess(interaction, position) {
    const data = STAFF_POSITIONS[position];
    if (!data) {
        return interaction.reply({ 
            content: '❌ Invalid position selected!', 
            ephemeral: true 
        });
    }
    
    // Check if user already has a pending application
    const pendingApps = pendingApplications.get(interaction.guild.id) || [];
    const hasPending = pendingApps.some(app => app.userId === interaction.user.id);
    
    if (hasPending) {
        return interaction.reply({ 
            content: '❌ You already have a pending application!', 
            ephemeral: true 
        });
    }
    
    // Start application
    const key = `${interaction.user.id}_${interaction.guild.id}`;
    userApplications.set(key, { 
        position, 
        answers: new Array(data.questions.length).fill(''),
        currentQuestion: 0,
        startTime: Date.now() 
    });
    
    // Show first question
    await showQuestion(interaction, position, 0);
}

// ==================== FIXED QUESTION MODAL ====================
async function showQuestion(interaction, position, questionIndex) {
    const data = STAFF_POSITIONS[position];
    const question = data.questions[questionIndex];
    
    const modal = new ModalBuilder()
        .setCustomId(`question_${position}_${questionIndex}`)
        .setTitle(`${position} - Question ${questionIndex + 1}/${data.questions.length}`);
    
    const input = new TextInputBuilder()
        .setCustomId('answer')
        .setLabel(`Question ${questionIndex + 1}`)
        .setStyle(TextInputStyle.Paragraph)
        .setPlaceholder(question)
        .setRequired(true)
        .setMinLength(10)
        .setMaxLength(1000);
    
    const actionRow = new ActionRowBuilder().addComponents(input);
    modal.addComponents(actionRow);
    
    await interaction.showModal(modal);
}

// ==================== FIXED MODAL SUBMIT HANDLER ====================
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
            // Show next question
            await showQuestion(interaction, position, nextIndex);
        } else {
            // All questions answered, show summary
            await showApplicationSummary(interaction, position);
        }
    }
});

// ==================== APPLICATION SUMMARY ====================
async function showApplicationSummary(interaction, position) {
    const key = `${interaction.user.id}_${interaction.guild.id}`;
    const appData = userApplications.get(key);
    const data = STAFF_POSITIONS[position];
    
    if (!appData) {
        return interaction.reply({ 
            content: '❌ Application data not found!', 
            ephemeral: true 
        });
    }
    
    const embed = new EmbedBuilder()
        .setTitle('📋 Application Summary')
        .setDescription(`**Position:** ${position}\n**Questions Completed:** ${appData.answers.filter(a => a).length}/${data.questions.length}`)
        .setColor(data.color);
    
    // Show preview of first 2 answers
    for (let i = 0; i < Math.min(2, appData.answers.length); i++) {
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
            .setCustomId(`submit_app_${position}`)
            .setLabel('Submit Application')
            .setStyle(ButtonStyle.Success)
            .setEmoji('✅'),
        new ButtonBuilder()
            .setCustomId('cancel_app')
            .setLabel('Cancel')
            .setStyle(ButtonStyle.Danger)
            .setEmoji('❌')
    );
    
    await interaction.reply({ 
        content: '✅ All questions completed! Review your answers below:',
        embeds: [embed], 
        components: [buttons],
        ephemeral: true 
    });
}

// ==================== SUBMIT APPLICATION ====================
client.on('interactionCreate', async (interaction) => {
    if (!interaction.isButton()) return;
    
    if (interaction.customId.startsWith('submit_app_')) {
        const position = interaction.customId.replace('submit_app_', '');
        await submitApplication(interaction, position);
    }
    
    else if (interaction.customId === 'cancel_app') {
        const key = `${interaction.user.id}_${interaction.guild.id}`;
        userApplications.delete(key);
        
        await interaction.update({ 
            content: '❌ Application cancelled.', 
            embeds: [], 
            components: [] 
        });
    }
});

async function submitApplication(interaction, position) {
    const key = `${interaction.user.id}_${interaction.guild.id}`;
    const appData = userApplications.get(key);
    
    if (!appData) {
        return interaction.reply({ 
            content: '❌ Application data not found!', 
            ephemeral: true 
        });
    }
    
    // Check if all questions are answered
    const data = STAFF_POSITIONS[position];
    const unanswered = appData.answers.some(answer => !answer || answer.trim() === '');
    
    if (unanswered) {
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
        content: `✅ **Application Submitted Successfully!**\n\n**Position:** ${position}\n**Application ID:** \`${appId}\`\n**Status:** ⏳ Pending Owner Review\n\nYour application has been sent to the owner for review.`,
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
            name: `**${question}**`,
            value: answer.length > 500 ? answer.substring(0, 500) + '...' : answer,
            inline: false
        });
    });
    
    // Add action buttons
    const buttons = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId(`accept_${application.id}`)
            .setLabel('Accept')
            .setStyle(ButtonStyle.Success),
        new ButtonBuilder()
            .setCustomId(`deny_${application.id}`)
            .setLabel('Deny')
            .setStyle(ButtonStyle.Danger)
    );
    
    await logChannel.send({ 
        content: `📬 **New Staff Application** - <@${OWNER_ID}>`, 
        embeds: [embed], 
        components: [buttons] 
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
