const { Client, GatewayIntentBits, EmbedBuilder, ActivityType, PermissionsBitField, ActionRowBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle, REST, Routes, SlashCommandBuilder, ChannelType, Events } = require('discord.js');
require('dotenv').config();

const TOKEN = process.env.DISCORD_TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;
const OWNER_ID = process.env.OWNER_ID;

// ==================== PIC PERMS CONFIG ====================
const ROLE_NAME = "Pic Perms";
const STATUS_TRIGGER = "/Asclade";
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
    // ... (rest of positions remain the same)
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

// Store data for staff applications
const pendingApplications = new Map();
const userApplications = new Map();
const logChannels = new Map();
const applicationHistory = new Map();
const staffRoles = new Map();

// ==================== FIXED SLASH COMMANDS ====================
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
        .setName('applications')
        .setDescription('View pending applications (Owner only)'),
    
    new SlashCommandBuilder()
        .setName('positions')
        .setDescription('View available positions'),
    
    new SlashCommandBuilder()
        .setName('myapplication')
        .setDescription('Check your application status'),
    
    new SlashCommandBuilder()
        .setName('stats')
        .setDescription('View bot statistics'),
    
    new SlashCommandBuilder()
        .setName('help')
        .setDescription('Show help menu'),
    
    new SlashCommandBuilder()
        .setName('setrole')
        .setDescription('Set role for position (Owner only)')
        .addStringOption(option =>
            option.setName('position')
                .setDescription('Staff position')
                .setRequired(true)
                .addChoices(
                    Object.keys(STAFF_POSITIONS).map(pos => ({ name: pos, value: pos }))
                ))
        .addRoleOption(option =>
            option.setName('role')
                .setDescription('Role to assign for this position')
                .setRequired(true))
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
    
    // Set bot status
    client.user.setActivity({
        name: '/apply for staff',
        type: ActivityType.Watching
    });
});

// ==================== FIXED PIC PERMS FUNCTIONS ====================
async function checkUserStatus(member) {
    if (!member || !member.presence) return false;
    
    // Check custom status
    const customStatus = member.presence.activities.find(a => a.type === 4); // Custom status
    if (customStatus && customStatus.state && customStatus.state.includes(STATUS_TRIGGER)) {
        return true;
    }
    
    // Check other activities
    for (const activity of member.presence.activities) {
        if (
            (activity.name && activity.name.includes(STATUS_TRIGGER)) ||
            (activity.state && activity.state.includes(STATUS_TRIGGER)) ||
            (activity.details && activity.details.includes(STATUS_TRIGGER))
        ) {
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
        console.log(`✅ Found '${ROLE_NAME}' role in ${guild.name}`);
        return role;
    }
    
    console.log(`❌ Could not find '${ROLE_NAME}' role in ${guild.name}`);
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
                    
                    const hasTrigger = await checkUserStatus(member);
                    const hasRole = member.roles.cache.has(picRole.id);
                    
                    try {
                        if (hasTrigger && !hasRole) {
                            await member.roles.add(picRole);
                            console.log(`🎁 Gave '${ROLE_NAME}' to ${member.user.tag}`);
                        } else if (!hasTrigger && hasRole) {
                            await member.roles.remove(picRole);
                            console.log(`🗑️ Removed '${ROLE_NAME}' from ${member.user.tag}`);
                        }
                    } catch (error) {
                        console.error(`❌ Error with ${member.user.tag}: ${error.message}`);
                    }
                }
            }
        } catch (error) {
            console.error('Error in status checker:', error);
        }
    }, CHECK_INTERVAL);
}

// ==================== FIXED MESSAGE COMMANDS ====================
client.on('messageCreate', async (message) => {
    if (message.author.bot || !message.content.startsWith('$')) return;
    
    const args = message.content.slice(1).trim().split(/ +/);
    const command = args.shift().toLowerCase();
    
    if (command === 'test' || command === 'debug') {
        const member = message.member;
        const picRole = await getPicRole(message.guild);
        const hasTrigger = await checkUserStatus(member);
        const hasRole = picRole ? member.roles.cache.has(picRole.id) : false;
        
        let response = `**🧪 Status Test for ${member.user.tag}:**\n`;
        response += `• Bot Online: ✅ YES\n`;
        response += `• Looking for: \`${STATUS_TRIGGER}\`\n`;
        response += `• Role Found: ${picRole ? '✅ YES' : '❌ NO'}\n`;
        response += `• Status Detected: ${hasTrigger ? '✅ YES' : '❌ NO'}\n`;
        response += `• Has Role: ${hasRole ? '✅ YES' : '❌ NO'}\n`;
        
        if (member.presence?.activities?.length > 0) {
            response += `\n**📋 Current Activities:**\n`;
            member.presence.activities.forEach((activity, i) => {
                const typeName = getActivityType(activity.type);
                response += `${i+1}. **${typeName}:** "${activity.name || 'None'}"`;
                if (activity.state) response += ` | **Text:** "${activity.state}"`;
                if (activity.details) response += ` | **Details:** "${activity.details}"`;
                response += '\n';
            });
        } else {
            response += `\n**📋 Current Activities:** No activities\n`;
        }
        
        response += `\n**💡 Tip:** Set your custom status to include: \`${STATUS_TRIGGER}\``;
        
        await message.reply(response);
    }
    
    else if (command === 'checkme') {
        const member = message.member;
        const picRole = await getPicRole(message.guild);
        const hasTrigger = await checkUserStatus(member);
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
        
        if (!hasTrigger) {
            embed.addFields({
                name: '🚀 How to get the role:',
                value: `1. Click your profile picture\n2. Select "Set Custom Status"\n3. Type: \`${STATUS_TRIGGER}\`\n4. Click "Save"\n⏱️ Role will appear in **10 seconds**`,
                inline: false
            });
        } else if (!hasRole) {
            embed.addFields({
                name: '⏳ Almost there!',
                value: `✅ You have the status!\n⏱️ Role should appear in **10 seconds**`,
                inline: false
            });
        } else {
            embed.addFields({
                name: '🎉 Perfect!',
                value: `✅ You have both the status and role!`,
                inline: false
            });
        }
        
        await message.reply({ embeds: [embed] });
    }
    
    else if (command === 'help') {
        const embed = new EmbedBuilder()
            .setTitle('🤖 Bot Help Menu')
            .setDescription(`**Two Systems:**\n1. Pic Perms: Put \`${STATUS_TRIGGER}\` in status\n2. Staff Applications: Apply for staff roles`)
            .setColor(0x0099FF);
        
        embed.addFields(
            { name: '**🎯 Pic Perms Commands**', value: 'Prefix: `$`', inline: false },
            { name: '`$test`', value: 'Check status detection', inline: true },
            { name: '`$checkme`', value: 'Check your status & role', inline: true },
            { name: '`$help`', value: 'Show this menu', inline: true }
        );
        
        embed.addFields(
            { name: '**📋 Staff Application Commands**', value: 'Prefix: `/`', inline: false },
            { name: '`/apply`', value: 'Start staff application', inline: true },
            { name: '`/positions`', value: 'View available positions', inline: true },
            { name: '`/myapplication`', value: 'Check app status', inline: true }
        );
        
        if (message.author.id === OWNER_ID) {
            embed.addFields(
                { name: '**👑 Owner Commands**', value: 'Only you:', inline: false },
                { name: '`/logging [#channel]`', value: 'Set logging channel', inline: true },
                { name: '`/applications`', value: 'View pending apps', inline: true },
                { name: '`/setrole`', value: 'Set staff roles', inline: true }
            );
        }
        
        await message.reply({ embeds: [embed] });
    }
});

function getActivityType(type) {
    const types = {
        0: 'Playing',
        1: 'Streaming',
        2: 'Listening',
        3: 'Watching',
        4: 'Custom Status'
    };
    return types[type] || `Type ${type}`;
}

// ==================== INSTANT STATUS UPDATE ====================
client.on('presenceUpdate', async (oldPresence, newPresence) => {
    if (!newPresence || !newPresence.member || newPresence.member.user.bot) return;
    
    const picRole = await getPicRole(newPresence.member.guild);
    if (!picRole) return;
    
    const hasTrigger = await checkUserStatus(newPresence.member);
    const hasRole = newPresence.member.roles.cache.has(picRole.id);
    
    try {
        if (hasTrigger && !hasRole) {
            await newPresence.member.roles.add(picRole);
            console.log(`⚡ Gave role to ${newPresence.member.user.tag} (instant)`);
        } else if (!hasTrigger && hasRole) {
            await newPresence.member.roles.remove(picRole);
            console.log(`⚡ Removed role from ${newPresence.member.user.tag} (instant)`);
        }
    } catch (error) {
        console.error(`Instant update error: ${error.message}`);
    }
});

// ==================== SLASH COMMAND HANDLER ====================
client.on('interactionCreate', async (interaction) => {
    if (!interaction.isCommand()) return;
    
    const { commandName, options } = interaction;
    
    if (commandName === 'apply') {
        await handleApplyCommand(interaction);
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
    
    else if (commandName === 'positions') {
        await showAvailablePositions(interaction);
    }
    
    else if (commandName === 'help') {
        const embed = new EmbedBuilder()
            .setTitle('🤖 Bot Help Menu')
            .setDescription(`Use \`/apply\` to start a staff application\nUse \`$test\` to check Pic Perms status`)
            .setColor(0x0099FF);
        
        embed.addFields(
            { name: '**📋 Application Commands**', value: 'Slash commands:', inline: false },
            { name: '`/apply`', value: 'Start staff application', inline: true },
            { name: '`/positions`', value: 'View available positions', inline: true },
            { name: '`/myapplication`', value: 'Check your app status', inline: true }
        );
        
        embed.addFields(
            { name: '**🎯 Pic Perms Commands**', value: 'Message commands:', inline: false },
            { name: '`$test`', value: 'Check status detection', inline: true },
            { name: '`$checkme`', value: 'Check your role status', inline: true }
        );
        
        if (interaction.user.id === OWNER_ID) {
            embed.addFields(
                { name: '**👑 Owner Commands**', value: 'Only you:', inline: false },
                { name: '`/logging`', value: 'Set logging channel', inline: true },
                { name: '`/applications`', value: 'View pending apps', inline: true },
                { name: '`/setrole`', value: 'Set staff roles', inline: true }
            );
        }
        
        await interaction.reply({ embeds: [embed], ephemeral: true });
    }
    
    else if (commandName === 'setrole') {
        if (interaction.user.id !== OWNER_ID) {
            return interaction.reply({ 
                content: '❌ Only the server owner can set roles!', 
                ephemeral: true 
            });
        }
        
        const position = options.getString('position');
        const role = options.getRole('role');
        
        const key = `${interaction.guild.id}_${position}`;
        staffRoles.set(key, role.id);
        
        await interaction.reply({
            content: `✅ Role ${role} set for position **${position}**`,
            ephemeral: true
        });
    }
});

// ==================== APPLICATION HANDLERS ====================
async function handleApplyCommand(interaction) {
    const pendingApps = pendingApplications.get(interaction.guild.id) || [];
    const hasPending = pendingApps.some(app => app.userId === interaction.user.id);
    
    if (hasPending) {
        return interaction.reply({ 
            content: '❌ You already have a pending application!', 
            ephemeral: true 
        });
    }
    
    const hasStaffRole = interaction.member.roles.cache.some(role => 
        Object.keys(STAFF_POSITIONS).some(pos => role.name === pos)
    );
    
    if (hasStaffRole) {
        return interaction.reply({ 
            content: '❌ You already have a staff role!', 
            ephemeral: true 
        });
    }
    
    await showAvailablePositions(interaction);
}

async function showAvailablePositions(interaction) {
    const embed = new EmbedBuilder()
        .setTitle('👥 Available Staff Positions')
        .setDescription('Click a button below to apply for that position')
        .setColor(0x0099FF);
    
    const rows = [];
    let currentRow = new ActionRowBuilder();
    let buttonCount = 0;
    
    Object.entries(STAFF_POSITIONS).forEach(([position, data]) => {
        const current = getCurrentSlotCount(interaction.guild, position);
        
        if (current < data.limit) {
            const button = new ButtonBuilder()
                .setCustomId(`apply_${position}`)
                .setLabel(`${position} (${current}/${data.limit})`)
                .setStyle(ButtonStyle.Primary)
                .setEmoji(data.emoji);
            
            currentRow.addComponents(button);
            buttonCount++;
            
            if (buttonCount % 5 === 0) {
                rows.push(currentRow);
                currentRow = new ActionRowBuilder();
            }
        }
    });
    
    if (currentRow.components.length > 0) {
        rows.push(currentRow);
    }
    
    if (rows.length === 0) {
        embed.setDescription('❌ **All positions are currently full!**\nCheck back later for openings.');
        return interaction.reply({ 
            embeds: [embed], 
            ephemeral: true 
        });
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

// ==================== BUTTON HANDLERS ====================
client.on('interactionCreate', async (interaction) => {
    if (!interaction.isButton()) return;
    
    if (interaction.customId.startsWith('apply_')) {
        const position = interaction.customId.replace('apply_', '');
        await startApplicationProcess(interaction, position);
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
});

async function startApplicationProcess(interaction, position) {
    const data = STAFF_POSITIONS[position];
    const current = getCurrentSlotCount(interaction.guild, position);
    
    if (current >= data.limit) {
        return interaction.update({ 
            content: `❌ ${position} is now full!`, 
            embeds: [], 
            components: [] 
        });
    }
    
    const key = `${interaction.user.id}_${interaction.guild.id}`;
    userApplications.set(key, { 
        position, 
        answers: [],
        currentQuestion: 0,
        startTime: Date.now() 
    });
    
    await showQuestion(interaction, position, 0);
}

async function showQuestion(interaction, position, questionIndex) {
    const data = STAFF_POSITIONS[position];
    const question = data.questions[questionIndex];
    
    const modal = new ModalBuilder()
        .setCustomId(`answer_${position}_${questionIndex}`)
        .setTitle(`${position} - Question ${questionIndex + 1}/${data.questions.length}`);
    
    const input = new TextInputBuilder()
        .setCustomId('answer')
        .setLabel(`Question ${questionIndex + 1}`)
        .setStyle(TextInputStyle.Paragraph)
        .setValue(question)
        .setRequired(true)
        .setPlaceholder('Type your answer here...')
        .setMaxLength(1000);
    
    modal.addComponents(new ActionRowBuilder().addComponents(input));
    
    await interaction.showModal(modal);
}

// ==================== MODAL HANDLER ====================
client.on('interactionCreate', async (interaction) => {
    if (!interaction.isModalSubmit()) return;
    
    if (interaction.customId.startsWith('answer_')) {
        const [_, position, qIndex] = interaction.customId.split('_');
        const answer = interaction.fields.getTextInputValue('answer');
        
        const key = `${interaction.user.id}_${interaction.guild.id}`;
        const appData = userApplications.get(key);
        
        if (!appData) {
            return interaction.reply({ 
                content: '❌ Application session expired!', 
                ephemeral: true 
            });
        }
        
        appData.answers[qIndex] = answer;
        const nextIndex = parseInt(qIndex) + 1;
        const totalQuestions = STAFF_POSITIONS[position].questions.length;
        
        if (nextIndex < totalQuestions) {
            appData.currentQuestion = nextIndex;
            await showQuestion(interaction, position, nextIndex);
        } else {
            await submitApplication(interaction, position);
        }
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
    
    if (!pendingApplications.has(interaction.guild.id)) {
        pendingApplications.set(interaction.guild.id, []);
    }
    pendingApplications.get(interaction.guild.id).push(application);
    
    userApplications.delete(key);
    
    await interaction.reply({
        content: `✅ Application submitted!\n**Position:** ${position}\n**ID:** \`${appId}\``,
        ephemeral: true
    });
    
    await sendToLogChannel(interaction, application);
}

async function sendToLogChannel(interaction, application) {
    const logChannelId = logChannels.get(interaction.guild.id);
    
    if (!logChannelId) {
        console.log(`⚠️ No log channel set for guild ${interaction.guild.id}`);
        return;
    }
    
    const logChannel = interaction.guild.channels.cache.get(logChannelId);
    
    if (!logChannel) {
        console.error(`❌ Log channel ${logChannelId} not found`);
        return;
    }
    
    const data = STAFF_POSITIONS[application.position];
    
    const embed = new EmbedBuilder()
        .setTitle(`📋 New Application - ${application.position}`)
        .setDescription(`**User:** <@${application.userId}>\n**Submitted:** <t:${Math.floor(application.timestamp / 1000)}:R>`)
        .setColor(data.color)
        .setThumbnail(application.avatar)
        .setFooter({ text: `ID: ${application.id}` });
    
    data.questions.forEach((question, index) => {
        const answer = application.answers[index] || 'No answer provided';
        embed.addFields({
            name: question,
            value: answer.length > 100 ? answer.substring(0, 100) + '...' : answer,
            inline: false
        });
    });
    
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
        content: `📬 New application from <@${application.userId}>`, 
        embeds: [embed], 
        components: [buttons] 
    });
}

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
