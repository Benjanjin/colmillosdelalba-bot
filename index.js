const { Client, GatewayIntentBits, Partials, ChannelType, PermissionsBitField, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, SlashCommandBuilder, Events } = require('discord.js');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.GuildPresences,
    GatewayIntentBits.GuildModeration // Necesario para logs de baneos/kicks
  ],
  partials: [Partials.Channel, Partials.Message, Partials.Reaction]
});

// ===== CONFIG =====
const STAFF_ROLE_ID = "1463268597085507717";
const CLAN_ROLE_ID = "1459687732417921227";
const MUTE_ROLE_ID = "1477518735983251638";
const CANAL_INICIAL = "1476978880672956428";
const CATEGORIA_TICKETS = "1477154960343826512";
const CATEGORIA_HISTORIAL = "1476973773579092151";
const CANAL_AVISOS = "1462533102130958437";
const CANAL_ROLES = "1464335122005491745";
const CANAL_SUGERENCIAS = "1477005989096984646";
const CANAL_COMANDOS = "1476614389749649523";
const CANAL_BIENVENIDAS = "1459690080607146167";
const CANAL_DIRECTOS = "1477722071202004992";
const CANAL_LOGS = "1462534103063724062"; // <--- CANAL DE REGISTROS

// IDs DE ROLES PARA MENCIONES
const ROL_AVISOS = "1477748637202382888";
const ROL_DIRECTOS = "1477748975603023873";

const IMAGEN_FORMULARIO = "https://cdn.discordapp.com/attachments/1473185415056855064/1476005469670608987/00c06809-480f-4798-940e-41a5118e";

const ROLES_REACCIONES = {
  "⚔️": "1464335696390263069",
  "⚒️": "1464335639561506878",
  "⚙️": "1464335746944209161",
  "🏛️": "1464335746856128737"
};

// NUEVOS ROLES DE NOTIFICACIONES (Reacciones)
const ROLES_NOTIF = {
  "📢": ROL_AVISOS,
  "🎥": ROL_DIRECTOS
};

let mensajeRolesGlobal = null;
const msgTracker = new Map();
// ===== NUEVO: GESTIÓN DE JUEGOS TTT =====
const tttGames = new Map();

// ===== NUEVO: FUNCIONES AUXILIARES TTT =====
function checkWinner(board) {
    const lines = [
        [0, 1, 2], [3, 4, 5], [6, 7, 8], // Horizontales
        [0, 3, 6], [1, 4, 7], [2, 5, 8], // Verticales
        [0, 4, 8], [2, 4, 6]  // Diagonales
    ];
    for (const line of lines) {
        const [a, b, c] = line;
        if (board[a] && board[a] === board[b] && board[a] === board[c]) {
            return board[a];
        }
    }
    return board.includes(null) ? null : 'tie';
}

function createBoardComponents(board) {
    const rows = [];
    for (let i = 0; i < 3; i++) {
        const row = new ActionRowBuilder();
        for (let j = 0; j < 3; j++) {
            const index = i * 3 + j;
            const button = new ButtonBuilder()
                .setCustomId(`ttt_cell_${index}`)
                .setLabel(board[index] || '➖')
                .setStyle(board[index] ? ButtonStyle.Secondary : ButtonStyle.Primary)
                .setDisabled(!!board[index]);
            row.addComponents(button);
        }
        rows.push(row);
    }
    return rows;
}

client.once("ready", async () => {
  console.log(`Bot listo como ${client.user.tag}`);

  // Registro de Slash Commands actualizado
  const commands = [
    { name: 'info', description: 'Información del bot' },
    { name: 'comandos', description: 'Ver lista completa de comandos' },
    { name: 'jugar', description: 'Adivina el número del 1 al 100' },
    // ===== NUEVO: COMANDO TTT =====
    { name: 'ttt', description: 'Jugar tres en raya', options: [{ name: 'usuario', description: 'Usuario a desafiar', type: 6, required: true }] },
    { name: 'chamba', description: 'Envía un mensaje de chamba', options: [{ name: 'mensaje', description: 'El mensaje a enviar', type: 3, required: true }] },
    { name: 'directo', description: 'Anunciar directo', options: [{ name: 'enlace', description: 'Link del directo', type: 3, required: true }, { name: 'juego', description: 'Juego', type: 3, required: true }] },
    { name: 'mute', description: 'Mutea a un usuario', options: [{ name: 'usuario', description: 'Usuario', type: 6, required: true }, { name: 'tiempo', description: 'Tiempo (min)', type: 4, required: true }, { name: 'razon', description: 'Razón', type: 3 }] },
    { name: 'unmute', description: 'Quita el mute a un usuario', options: [{ name: 'usuario', description: 'Usuario', type: 6, required: true }] },
    
    // NUEVOS COMANDOS SOLICITADOS
    { name: 'clear', description: 'Borrar mensajes', options: [{ name: 'cantidad', description: 'Cantidad de mensajes a borrar', type: 4, required: true }] },
    { name: 'role', description: 'Gestionar roles', options: [
        { 
            name: 'add', 
            description: 'Añadir rol a un usuario', 
            type: 1, 
            options: [
                { name: 'usuario', description: 'Usuario a gestionar', type: 6, required: true },
                { name: 'rol', description: 'Rol a añadir', type: 8, required: true }
            ]
        }
    ]},

    { name: 'miembros', description: 'Ver miembros online y estadísticas' },
    { name: 'reglas', description: 'Ver las normas del clan' },
    { name: 'top', description: 'Ver el top de miembros' },
    { name: 'stats', description: 'Ver estadísticas', options: [{ name: 'usuario', description: 'Usuario a ver', type: 6 }] },
    { name: 'suggest', description: 'Enviar una sugerencia', options: [{ name: 'texto', description: 'Tu sugerencia', type: 3, required: true }] },
    { name: 'anunciar', description: 'Mandar un aviso oficial', options: [{ name: 'mensaje', description: 'Contenido del aviso', type: 3, required: true }] },
    { name: 'kick', description: 'Expulsar usuario', options: [{ name: 'usuario', description: 'Usuario a expulsar', type: 6, required: true }, { name: 'razon', description: 'Razón', type: 3 }] },
    { name: 'ban', description: 'Banear usuario', options: [{ name: 'usuario', description: 'Usuario a banear', type: 6, required: true }, { name: 'razon', description: 'Razón', type: 3 }] },
    { name: 'warn', description: 'Advertir usuario', options: [{ name: 'usuario', description: 'Usuario a advertir', type: 6, required: true }, { name: 'razon', description: 'Razón', type: 3 }] },
    
    // COMANDO SORTEO AÑADIDO
    { name: 'sorteo', description: 'Iniciar un sorteo', options: [
        { name: 'premio', description: '¿Qué se sortea?', type: 3, required: true },
        { name: 'duracion', description: 'Duración en minutos', type: 4, required: true }
    ]}
  ];

  await client.application.commands.set(commands);
  console.log("Comandos slash actualizados en Discord.");

  const canal = await client.channels.fetch(CANAL_INICIAL);
  const mensajes = await canal.messages.fetch({ limit: 20 });

  const yaExiste = mensajes.find(
    m => m.author.id === client.user.id && m.components.length > 0
  );

  if (!yaExiste) {
    const boton = new ButtonBuilder()
      .setCustomId("crear_ticket")
      .setLabel("Solicitar verificación")
      .setStyle(ButtonStyle.Primary);

    const fila = new ActionRowBuilder().addComponents(boton);

    await canal.send({
      content: "Haz clic aquí para solicitar acceso al clan:",
      components: [fila]
    });
  }

  // ===== EMBED ROLES =====
  const canalRoles = await client.channels.fetch(CANAL_ROLES);
  const mensajesRoles = await canalRoles.messages.fetch({ limit: 15 });

  // MENSAJE 1: Roles de Clase
  let mensajeRoles = mensajesRoles.find(m => m.author.id === client.user.id && m.embeds[0]?.title?.includes("Roles"));

  if (!mensajeRoles) {
    const embedRoles = new EmbedBuilder()
      .setTitle("╔══ ≪ ° Roles ° ≫ ══╗")
      .setDescription(`『⚔️』<@&1464335696390263069>\n『⚒️』<@&1464335639561506878>\n『⚙️』<@&1464335746944209161>\n『🏛️』<@&1464335746856128737>`)
      .setColor(0x8B0000)
      .setImage(IMAGEN_FORMULARIO);

    mensajeRoles = await canalRoles.send({ embeds: [embedRoles] });

    for (const emoji of Object.keys(ROLES_REACCIONES)) {
      await mensajeRoles.react(emoji);
    }
  }
  mensajeRolesGlobal = mensajeRoles;

  // MENSAJE 2: Roles de Notificaciones (NUEVO)
  let mensajeNotif = mensajesRoles.find(m => m.author.id === client.user.id && m.embeds[0]?.title?.includes("Notificaciones"));
  
  if (!mensajeNotif) {
      const embedNotif = new EmbedBuilder()
        .setTitle("╔══ ≪ ° Notificaciones ° ≫ ══╗")
        .setDescription(`Selecciona cómo quieres recibir las actualizaciones:\n\n📢 <@&${ROL_AVISOS}> - Avisos Generales\n🎥 <@&${ROL_DIRECTOS}> - Notificaciones de Directos\n\n*Obligatorio elegir al menos uno.*`)
        .setColor(0x00FF00);

      mensajeNotif = await canalRoles.send({ content: "@everyone", embeds: [embedNotif] });
      for (const emoji of Object.keys(ROLES_NOTIF)) {
          await mensajeNotif.react(emoji);
      }
  }
});

// ===== SISTEMA DE LOGS (REGISTROS) =====
client.on(Events.MessageDelete, async (message) => {
    if (!message.guild || message.author?.bot) return;
    const logChannel = message.guild.channels.cache.get(CANAL_LOGS);
    if (!logChannel) return;

    const embed = new EmbedBuilder()
        .setTitle("🗑️ Mensaje Eliminado")
        .setDescription(`**Autor:** ${message.author.tag} (${message.author.id})\n**Canal:** <#${message.channel.id}>\n**Mensaje:** ${message.content || "No hay texto"}`)
        .setColor(0xFF0000)
        .setTimestamp();
    logChannel.send({ embeds: [embed] });
});

client.on(Events.MessageUpdate, async (oldMessage, newMessage) => {
    if (!oldMessage.guild || oldMessage.author?.bot || oldMessage.content === newMessage.content) return;
    const logChannel = oldMessage.guild.channels.cache.get(CANAL_LOGS);
    if (!logChannel) return;

    const embed = new EmbedBuilder()
        .setTitle("✏️ Mensaje Editado")
        .setDescription(`**Autor:** ${oldMessage.author.tag}\n**Canal:** <#${oldMessage.channel.id}>\n**Antiguo:** ${oldMessage.content}\n**Nuevo:** ${newMessage.content}`)
        .setColor(0xFFA500)
        .setTimestamp();
    logChannel.send({ embeds: [embed] });
});

client.on(Events.GuildMemberUpdate, async (oldMember, newMember) => {
    const logChannel = newMember.guild.channels.cache.get(CANAL_LOGS);
    if (!logChannel) return;

    // Detectar cambios de roles
    const addedRoles = newMember.roles.cache.filter(role => !oldMember.roles.cache.has(role.id));
    const removedRoles = oldMember.roles.cache.filter(role => !newMember.roles.cache.has(role.id));

    if (addedRoles.size > 0) {
        logChannel.send({
            embeds: [new EmbedBuilder()
                .setTitle("🛡️ Roles Añadidos")
                .setDescription(`**Usuario:** ${newMember.user.tag}\n**Roles:** ${addedRoles.map(r => r.name).join(", ")}`)
                .setColor(0x00FF00)
                .setTimestamp()]
        });
    }
    if (removedRoles.size > 0) {
        logChannel.send({
            embeds: [new EmbedBuilder()
                .setTitle("🛡️ Roles Eliminados")
                .setDescription(`**Usuario:** ${newMember.user.tag}\n**Roles:** ${removedRoles.map(r => r.name).join(", ")}`)
                .setColor(0xFF0000)
                .setTimestamp()]
        });
    }
});

// ===== BIENVENIDAS =====
client.on(Events.GuildMemberAdd, async member => {
    const channel = member.guild.channels.cache.get(CANAL_BIENVENIDAS);
    if (!channel) return;

    const embed = new EmbedBuilder()
        .setTitle("👋 ¡Nuevo miembro!")
        .setDescription(`¡Bienvenido al **Clan ColmillosDelAlba** <@${member.id}>!\nPasala bien!! 🐺`)
        .setColor(0x00FF00)
        .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
        .setFooter({ text: `Eres el miembro #${member.guild.memberCount}` })
        .setTimestamp();
    
    channel.send({ content: `¡Bienvenido <@${member.id}>!`, embeds: [embed] });
});

// ===== REACCIONES ROLES =====
client.on("messageReactionAdd", async (reaction, user) => {
  if (user.bot) return;
  if (reaction.partial) await reaction.fetch();

  const member = await reaction.message.guild.members.fetch(user.id);
  
  // Lógica Roles Clases (Antiguo)
  if (reaction.message.channel.id === CANAL_ROLES && ROLES_REACCIONES[reaction.emoji.name]) {
      const roleId = ROLES_REACCIONES[reaction.emoji.name];
      const rolesSistema = Object.values(ROLES_REACCIONES);

      const yaTieneOtro = rolesSistema.some(id =>
        id !== roleId && member.roles.cache.has(id)
      );

      if (yaTieneOtro) {
        await reaction.users.remove(user.id).catch(() => {});
        const aviso = await reaction.message.channel.send({
          content: `❌ <@${user.id}> Solo puedes tener **un rol** de clase a la vez.`
        });
        setTimeout(() => { aviso.delete().catch(() => {}); }, 4000);
        return;
      }

      await member.roles.add(roleId).catch(() => {});
      const rol = reaction.message.guild.roles.cache.get(roleId);
      const m = await reaction.message.channel.send(`✅ Rol **${rol.name}** asignado.`);
      setTimeout(() => m.delete().catch(() => {}), 4000);
  }

  // Lógica Roles Notificaciones (NUEVO)
  if (reaction.message.channel.id === CANAL_ROLES && ROLES_NOTIF[reaction.emoji.name]) {
      const roleId = ROLES_NOTIF[reaction.emoji.name];
      await member.roles.add(roleId).catch(() => {});
      const rol = reaction.message.guild.roles.cache.get(roleId);
      const m = await reaction.message.channel.send(`✅ Rol **${rol.name}** asignado.`);
      setTimeout(() => m.delete().catch(() => {}), 4000);
  }
});

client.on("messageReactionRemove", async (reaction, user) => {
  if (user.bot) return;
  if (reaction.partial) await reaction.fetch();
  if (reaction.message.channel.id !== CANAL_ROLES) return;

  const member = await reaction.message.guild.members.fetch(user.id);
  
  // Remover rol clase
  if (ROLES_REACCIONES[reaction.emoji.name]) {
      await member.roles.remove(ROLES_REACCIONES[reaction.emoji.name]).catch(() => {});
  }
  // Remover rol notif
  if (ROLES_NOTIF[reaction.emoji.name]) {
      await member.roles.remove(ROLES_NOTIF[reaction.emoji.name]).catch(() => {});
  }

  // VALIDACIÓN OBLIGATORIA (Notificaciones)
  const tieneNotif = member.roles.cache.has(ROL_AVISOS) || member.roles.cache.has(ROL_DIRECTOS);
  
  if (!tieneNotif) {
      const aviso = await reaction.message.channel.send({
          content: `⚠️ <@${user.id}> Debes tener al menos **uno** de los roles de notificaciones (📢 Avisos o 🎥 Directos). Por favor reacciona de nuevo.`
      });
      setTimeout(() => aviso.delete().catch(() => {}), 6000);
  }
});

// ===== AUTOMODERACIÓN Y MENSAJES =====
client.on("messageCreate", async (message) => {
  if (message.author.bot) return;

  // Anti-Spam (5 mensajes idénticos)
  const uid = message.author.id;
  if (!msgTracker.has(uid)) msgTracker.set(uid, []);
  let userMsgs = msgTracker.get(uid);
  userMsgs.push({ content: message.content.toLowerCase(), time: Date.now() });
  userMsgs = userMsgs.filter(m => Date.now() - m.time < 10000);
  msgTracker.set(uid, userMsgs);

  if (userMsgs.length >= 5) {
    const spam = userMsgs.every(m => m.content === message.content.toLowerCase());
    if (spam) {
      await message.channel.bulkDelete(5).catch(() => {});
      return message.channel.send(`🚫 No hagas spam, <@${uid}>.`).then(m => setTimeout(() => m.delete(), 4000));
    }
  }

  // Responder menciones al bot
  if (message.mentions.has(client.user)) {
    return message.reply({
      embeds: [
        new EmbedBuilder()
          .setTitle("🐺 Bot Del Clan ColmillosDelAlba")
          .setDescription("Creado y personalizado desde 0 por el usuario **1fsi**.\n\nSi te interesa crear tu bot, manda soli al DM de **1fsi**.")
          .setColor(0x8B0000)
          .setFooter({ text: "ColmillosDelAlba 2026" })
      ]
    });
  }

  if (!message.guild) {
    const embedDM = new EmbedBuilder()
      .setTitle("🤖 Información del Bot")
      .setDescription("**Creado por 1fsi**\n\nVenta de bots personalizados.\nDiscord: **1fsi**")
      .setColor(0x00AEFF);
    await message.reply({ embeds: [embedDM] });
    return;
  }

  if (message.channel.id === CANAL_AVISOS) {
    await message.delete().catch(() => {});
    const embedAviso = new EmbedBuilder()
      .setTitle("🚨 AVISO IMPORTANTE 🚨")
      .setDescription(message.content)
      .setColor(0xFF0000)
      .setImage(IMAGEN_FORMULARIO)
      .setFooter({ text: `Publicado por ${message.author.tag}` })
      .setTimestamp();
    await message.channel.send({ content: `<@&${ROL_AVISOS}>`, embeds: [embedAviso] });
  }
});

// ===== INTERACCIONES (COMANDOS Y TICKETS) =====
client.on("interactionCreate", async (interaction) => {
  if (interaction.isChatInputCommand()) {
    const { commandName, options, guild, member } = interaction;

    if (commandName === "info") {
      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setTitle("🐺 Bot Del Clan ColmillosDelAlba")
            .setDescription("Creado y personalizado desde 0 por el usuario **1fsi.**\n\nSi te interesa crear tu bot, manda soli al DM de **1fsi.**.")
            .setColor(0x8B0000)
            .setFooter({ text: "ColmillosDelAlba 2026" })
        ]
      });
    }

    if (commandName === "comandos") {
      const embedComandos = new EmbedBuilder()
        .setTitle("📜 Lista de Comandos")
        .setDescription(`
**Comandos Públicos:**
• \`/info\`: Información del bot.
• \`/comandos\`: Ver esta lista.
• \`/jugar\`: Juego de adivinar número.
• \`/ttt @usuario\`: Jugar Tres en Raya.
• \`/reglas\`: Normas del clan.
• \`/miembros\`: Estadísticas de usuarios.
• \`/suggest\`: Enviar sugerencia.
• \`/stats\`: Ver estadísticas.

**Comandos de Staff:**
• \`/clear [cantidad]\`: Borrar mensajes.
• \`/role add [usuario] [rol]\`: Añadir rol a usuario.
• \`/directo\`: Anunciar directo.
• \`/mute\`: Mutear usuario.
• \`/unmute\`: Desmutear usuario.
• \`/chamba\`: Enviar mensaje decorado.
• \`/anunciar\`: Mandar aviso oficial.
• \`/kick\`: Expulsar usuario.
• \`/ban\`: Banear usuario.
• \`/warn\`: Advertir usuario.
• \`/sorteo [premio] [duracion]\`: Iniciar sorteo (Staff).`)
        .setColor(0x8B0000);
      return interaction.reply({ embeds: [embedComandos] });
    }

    // ===== JUGAR =====
    if (commandName === "jugar") {
        const number = Math.floor(Math.random() * 100) + 1;
        let attempts = 0;
        await interaction.reply(`¡Hola <@${interaction.user.id}>! He pensado un número del 1 al 100. ¡Adivínalo!`);
        
        const collector = interaction.channel.createMessageCollector({ time: 60000 });
        collector.on('collect', async m => {
            if (m.author.bot) return;
            attempts++;
            const guess = parseInt(m.content);
            if (isNaN(guess)) return;

            if (guess === number) {
                m.reply(`🎉 ¡Correcto <@${m.author.id}>! Adivinaste el número **${number}** en ${attempts} intentos.`);
                collector.stop();
            } else if (guess < number) {
                m.reply('⬆️ Más alto.');
            } else {
                m.reply('⬇️ Más bajo.');
            }
        });
        return;
    }

    // ===== NUEVO: LÓGICA TTT COMMAND =====
    if (commandName === "ttt") {
        const target = options.getMember("usuario");
        if (target.user.bot) return interaction.reply("❌ No puedes jugar contra bots.");
        if (target.id === member.id) return interaction.reply("❌ No puedes jugar contra ti mismo.");

        const acceptButton = new ButtonBuilder().setCustomId(`ttt_accept_${member.id}`).setLabel("Aceptar").setStyle(ButtonStyle.Success);
        const rejectButton = new ButtonBuilder().setCustomId(`ttt_reject_${member.id}`).setLabel("Rechazar").setStyle(ButtonStyle.Danger);
        const row = new ActionRowBuilder().addComponents(acceptButton, rejectButton);

        await interaction.reply({
            content: `${target}, ${member} te ha desafiado a un Tres en Raya.`,
            components: [row]
        });
        return;
    }

    // ===== CHAMBA =====
    if (commandName === "chamba") {
        if (!member.roles.cache.has(STAFF_ROLE_ID)) return interaction.reply({ content: "❌ Sin permisos.", ephemeral: true });
        const text = options.getString("mensaje");
        const embedChamba = new EmbedBuilder()
            .setTitle("🔨 AVISO DE CHAMBA 🔨")
            .setDescription(text)
            .setColor(0xFFFF00)
            .setImage(IMAGEN_FORMULARIO)
            .setFooter({ text: "Att: El esclavizador" })
            .setTimestamp();
        
        await interaction.reply({ content: "✅ Mensaje de chamba enviado.", ephemeral: true });
        await interaction.channel.send({ embeds: [embedChamba] });
        return;
    }

    // ===== DIRECTO =====
    if (commandName === "directo") {
        if (!member.roles.cache.has(STAFF_ROLE_ID)) return interaction.reply({ content: "❌ Sin permisos.", ephemeral: true });
        const enlace = options.getString("enlace");
        const juego = options.getString("juego");
        
        const canalDirectos = guild.channels.cache.get(CANAL_DIRECTOS);
        if (!canalDirectos) return interaction.reply({ content: "❌ Canal de directos no encontrado.", ephemeral: true });

        const embedDirecto = new EmbedBuilder()
            .setTitle("🎥 ¡ESTAMOS EN DIRECTO! 🎥")
            .setDescription(`**${interaction.user.username}** está transmitiendo **${juego}**.\n\n👉 [¡Click aquí para verlo!](${enlace})`)
            .setColor(0x9146FF)
            .setImage(IMAGEN_FORMULARIO)
            .setTimestamp();
        
        await interaction.reply({ content: `✅ Anuncio de directo enviado a <#${CANAL_DIRECTOS}>.`, ephemeral: true });
        // CAMBIO: Mención de rol en lugar de everyone
        await canalDirectos.send({ content: `<@&${ROL_DIRECTOS}>`, embeds: [embedDirecto] });
        return;
    }

    // ===== MUTE =====
    if (commandName === "mute") {
        if (!member.roles.cache.has(STAFF_ROLE_ID)) return interaction.reply({ content: "❌ Sin permisos.", ephemeral: true });
        const target = options.getMember("usuario");
        const tiempo = options.getInteger("tiempo");
        const razon = options.getString("razon") || "No especificada";

        if (!target) return interaction.reply({ content: "❌ Usuario no encontrado.", ephemeral: true });

        const muteRole = guild.roles.cache.get(MUTE_ROLE_ID);
        if (!muteRole) return interaction.reply({ content: "❌ No se encontró el rol de muteo.", ephemeral: true });

        await target.roles.add(muteRole);
        await interaction.reply({ embeds: [new EmbedBuilder().setTitle("🔇 Usuario Muteado").setDescription(`**Usuario:** ${target.user.tag}\n**Tiempo:** ${tiempo} min\n**Razón:** ${razon}`).setColor(0xFFA500)] });

        setTimeout(async () => {
            await target.roles.remove(muteRole).catch(() => {});
        }, tiempo * 60000);
        return;
    }

    // ===== UNMUTE =====
    if (commandName === "unmute") {
        if (!member.roles.cache.has(STAFF_ROLE_ID)) return interaction.reply({ content: "❌ Sin permisos.", ephemeral: true });
        const target = options.getMember("usuario");
        if (!target) return interaction.reply({ content: "❌ Usuario no encontrado.", ephemeral: true });

        const muteRole = guild.roles.cache.get(MUTE_ROLE_ID);
        if (!muteRole) return interaction.reply({ content: "❌ No se encontró el rol de muteo.", ephemeral: true });

        await target.roles.remove(muteRole);
        await interaction.reply({ embeds: [new EmbedBuilder().setTitle("🔊 Usuario Desmuteado").setDescription(`**Usuario:** ${target.user.tag}`).setColor(0x00FF00)] });
        return;
    }

    // ===== CLEAR (NUEVO) =====
    if (commandName === "clear") {
        if (!member.roles.cache.has(STAFF_ROLE_ID)) return interaction.reply({ content: "❌ Sin permisos.", ephemeral: true });
        const amount = options.getInteger("cantidad");
        if (amount < 1 || amount > 100) return interaction.reply({ content: "❌ Pon un número entre 1 y 100.", ephemeral: true });
        
        await interaction.channel.bulkDelete(amount, true);
        const reply = await interaction.reply({ content: `✅ Eliminados **${amount}** mensajes.`, ephemeral: true });
        setTimeout(() => reply.delete().catch(() => {}), 3000);
        return;
    }

    // ===== ROLE ADD (NUEVO) =====
    if (commandName === "role") {
        if (!member.roles.cache.has(STAFF_ROLE_ID)) return interaction.reply({ content: "❌ Sin permisos.", ephemeral: true });
        
        const subCommand = options.getSubcommand();
        const target = options.getMember("usuario");
        const role = options.getRole("rol");

        if (subCommand === "add") {
            if (!target || !role) return interaction.reply({ content: "❌ Datos inválidos.", ephemeral: true });
            
            await target.roles.add(role);
            interaction.reply({ content: `✅ Rol **${role.name}** añadido a ${target.user.tag}.`, ephemeral: true });
        }
        return;
    }

    if (commandName === "reglas") {
      const embedReglas = new EmbedBuilder()
        .setTitle("╔═══════ ≪ ° 🐺 ° ≫ ═══════╗\n    NORMAS COLMILLOS DEL ALBA\n╚═══════ ≪ ° 🐺 ° ≫ ═══════╝")
        .setDescription(`
:sunrise::dragon: Normas del Clan **ColmillosdelAlba** :dragon::sunrise:
Discord: ColmillosdelAlba | Minecraft: dioses.mc (Vegetta y Willy)
─────────────────────────────
:one: :small_blue_diamond: **Respeto y buena convivencia**
- Tratar a todos con respeto en Discord y Minecraft
- Nada de insultos, racismo o comportamiento tóxico

:two: :video_game: :small_blue_diamond: **Roles y actividades**
- Cumplir tu rol: ⚔ PvP | :tools: Builder | :game_die: Casual
- Apoyar al clan en aventuras, guerras y construcciones
- ⚔ PvP: si no hay combates activos, ayudar en construcciones

:three: :handshake: :small_blue_diamond: **Cooperación y trabajo en equipo**
- Compartir recursos y ayudar en proyectos del clan
- Coordinar ataques y defensas como un verdadero equipo

:four: :no_entry_sign: :small_blue_diamond: **Prohibido hacer trampas**
- Nada de hacks, cheats o exploits en Minecraft
- :x: Incumplir puede derivar en **expulsión del clan y del Discord**

:five: :construction_site: :small_blue_diamond: **Cuidar el servidor y las construcciones**
- :x: **No griefear ni destruir construcciones ajenas**
- Mantener el chat limpio y evitar spam

:six: :date: :small_blue_diamond: **Participación**
- Mantenerse activo en Discord y en dioses.mc
- Avisar si vas a estar inactivo por un tiempo

:seven: :bow_arrow: :small_blue_diamond: **Respeto al lider**
- Líder: **guepar**
- Seguir sus decisiones y sugerencias
- Proponer ideas de manera respetuosa y constructiva

─────────────────────────────
:fire::sunrise: ¡Que **ColmillosdelAlba** crezca fuerte, unido y legendario! :sunrise::dragon:`)
        .setColor(0x8B0000)
        .setImage(IMAGEN_FORMULARIO);
      return interaction.reply({ embeds: [embedReglas] });
    }

    if (commandName === "miembros") {
      const online = guild.members.cache.filter(m => m.presence?.status !== 'offline' && m.presence?.status !== undefined).size;
      return interaction.reply({
        embeds: [new EmbedBuilder().setTitle("👥 Estadísticas").setDescription(`🟢 Online: **${online}**\n👥 Total: **${guild.memberCount}**`).setColor(0x00FF00)]
      });
    }

    if (commandName === "anunciar") {
      if (!member.roles.cache.has(STAFF_ROLE_ID)) return interaction.reply({ content: "❌ No eres staff.", ephemeral: true });
      const canalAvisos = guild.channels.cache.get(CANAL_AVISOS);
      const m = options.getString("mensaje");
      // CAMBIO: Mención de rol en lugar de everyone
      await canalAvisos.send({ 
        content: `<@&${ROL_AVISOS}>`, 
        embeds: [new EmbedBuilder().setTitle("📢 ANUNCIO OFICIAL").setDescription(m).setColor(0xFF0000).setImage(IMAGEN_FORMULARIO).setTimestamp()] 
      });
      return interaction.reply({ content: "✅ Anuncio enviado.", ephemeral: true });
    }

    if (["kick", "ban", "warn"].includes(commandName)) {
      if (!member.roles.cache.has(STAFF_ROLE_ID)) return interaction.reply({ content: "❌ Sin permisos.", ephemeral: true });
      const target = options.getUser("usuario");
      const razon = options.getString("razon") || "Sin razón especificada";
      const embedMod = new EmbedBuilder().setColor(0x8B0000).setTimestamp().setFooter({ text: `Staff: ${interaction.user.tag}` });

      if (commandName === "kick") {
        await guild.members.kick(target, razon);
        embedMod.setTitle("👢 Usuario Expulsado").setDescription(`**Usuario:** ${target.tag}\n**Razón:** ${razon}`);
      } else if (commandName === "ban") {
        await guild.members.ban(target, { reason: razon });
        embedMod.setTitle("🔨 Usuario Baneado").setDescription(`**Usuario:** ${target.tag}\n**Razón:** ${razon}`);
      } else {
        embedMod.setTitle("⚠️ Advertencia").setDescription(`**Usuario:** ${target.tag}\n**Razón:** ${razon}`);
      }
      return interaction.reply({ embeds: [embedMod] });
    }

    if (commandName === "suggest") {
      if (interaction.channel.id !== CANAL_COMANDOS) {
        return interaction.reply({ content: "❌ Este comando solo se puede usar en el canal de comandos.", ephemeral: true });
      }
      const texto = options.getString("texto");
      const canalSugerencias = await client.channels.fetch(CANAL_SUGERENCIAS);
      const embedSugerencia = new EmbedBuilder()
        .setTitle("📌 Nueva Sugerencia")
        .setDescription(texto)
        .setColor(0x8B0000)
        .setFooter({ text: `Sugerido por ${interaction.user.tag}` })
        .setTimestamp();
      const mensaje = await canalSugerencias.send({ embeds: [embedSugerencia] });
      await mensaje.react("👍");
      await mensaje.react("👎");
      await interaction.reply({ content: "✅ Tu sugerencia fue enviada correctamente.", ephemeral: true });
    }

    // ===== COMANDO /STATS (INTEGRADO) =====
    if (commandName === "stats") {
        const targetMember = options.getMember("usuario") || member;
        
        const joinedAt = targetMember.joinedAt.toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });

        const roles = targetMember.roles.cache
            .filter(role => role.id !== guild.id)
            .map(role => `<@&${role.id}>`)
            .join(', ') || 'Ninguno';

        const embedStats = new EmbedBuilder()
            .setTitle(`📊 Estadísticas de ${targetMember.user.username}`)
            .setThumbnail(targetMember.user.displayAvatarURL({ dynamic: true }))
            .setColor(0x8B0000)
            .addFields(
                { name: '👤 Usuario', value: `${targetMember.user.tag}`, inline: true },
                { name: '🆔 ID', value: `${targetMember.user.id}`, inline: true },
                { name: '📅 Se unió el', value: `${joinedAt}`, inline: true },
                { name: '🛡️ Roles', value: roles }
            )
            .setFooter({ text: `Consultado por ${interaction.user.tag}` })
            .setTimestamp();

        return interaction.reply({ embeds: [embedStats] });
    }

    if (commandName === "top") {
        return interaction.reply({ content: "📊 Comando en desarrollo.", ephemeral: true });
    }

    // ===== LÓGICA COMANDO /SORTEO (MEJORADA) =====
    if (commandName === "sorteo") {
        if (!member.roles.cache.has(STAFF_ROLE_ID)) return interaction.reply({ content: "❌ Sin permisos.", ephemeral: true });
        const premio = options.getString("premio");
        const duracion = options.getInteger("duracion");

        const embedSorteo = new EmbedBuilder()
            .setTitle("🎉 ¡NUEVO SORTEO! 🎉")
            .setDescription(`Premio: **${premio}**\n\nReacciona con 🎟️ para participar.\nDuración: ${duracion} minutos.`)
            .setColor(0x00FF00)
            .setFooter({ text: `Sorteo iniciado por ${interaction.user.username}` })
            .setTimestamp(Date.now() + duracion * 60000);

        await interaction.reply({ content: "✅ Sorteo creado.", ephemeral: true });
        const mensajeSorteo = await interaction.channel.send({ content: "@everyone", embeds: [embedSorteo] });
        await mensajeSorteo.react("🎟️");

        // Temporizador para finalizar
        setTimeout(async () => {
            // Actualizar mensaje para obtener reacciones frescas
            const fetchedMessage = await mensajeSorteo.fetch();
            const reactions = fetchedMessage.reactions.cache.get("🎟️");
            
            if (!reactions || reactions.count <= 1) {
                return interaction.channel.send("😞 No hubo suficientes participantes para el sorteo.");
            }

            // Obtener usuarios participantes (excluyendo al bot)
            const users = await reactions.users.fetch();
            const participants = users.filter(u => !u.bot);

            if (participants.size === 0) {
                return interaction.channel.send("😞 No hubo participantes para el sorteo.");
            }

            // Seleccionar ganador al azar
            const winner = participants.random();

            // Embed de Ganador
            const embedGanador = new EmbedBuilder()
                .setTitle("🏆 ¡Tenemos un Ganador! 🏆")
                .setDescription(`Premio: **${premio}**\n\nFelicidades <@${winner.id}> por ganar el sorteo.\nGracias a todos por participar.`)
                .setColor(0xFFD700)
                .setThumbnail(winner.displayAvatarURL({ dynamic: true }))
                .setFooter({ text: "Sorteo finalizado" })
                .setTimestamp();

            await interaction.channel.send({ content: `🎉 ¡El sorteo ha terminado!`, embeds: [embedGanador] });
            
            // Opcional: Registrar ganadores en el canal de logs si existe
            const logChannel = guild.channels.cache.get(CANAL_LOGS);
            if(logChannel) {
                logChannel.send(`🏆 **${premio}** fue ganado por **${winner.tag}**`);
            }
            
        }, duracion * 60000);
        
        return;
    }
  }

  // ===== LÓGICA DE BOTONES (TICKETS Y TTT) =====
  if (!interaction.isButton()) return;

  // ===== NUEVO: LÓGICA BOTONES TTT =====
  if (interaction.customId.startsWith("ttt_")) {
      const customId = interaction.customId;

      // Aceptar/Rechazar desafío
      if (customId.startsWith("ttt_accept_") || customId.startsWith("ttt_reject_")) {
          const challengerId = customId.split("_")[2];
          const acceptorId = interaction.user.id;
          const challenger = await interaction.guild.members.fetch(challengerId);

          if (customId.startsWith("ttt_reject_")) {
              await interaction.update({ content: `❌ ${interaction.user} rechazó el desafío.`, components: [] });
              return;
          }

          // Iniciar juego
          const board = Array(9).fill(null);
          const gameData = {
              board,
              player1: challengerId,
              player2: acceptorId,
              turn: challengerId,
              message: null
          };
          tttGames.set(interaction.message.id, gameData);

          const msg = await interaction.update({
              content: `🎮 **Tres en Raya**\nTurno de: <@${challengerId}> (❌)`,
              components: createBoardComponents(board)
          });
          gameData.message = msg;
          return;
      }

      // Clics en el tablero
      if (customId.startsWith("ttt_cell_")) {
          const gameData = tttGames.get(interaction.message.id);
          if (!gameData) return interaction.reply({content: "❌ Juego no encontrado.", ephemeral: true});
          if (interaction.user.id !== gameData.turn) return interaction.reply({content: "❌ No es tu turno.", ephemeral: true});

          const index = parseInt(customId.split("_")[2]);
          gameData.board[index] = gameData.turn === gameData.player1 ? "❌" : "⭕";
          
          const winner = checkWinner(gameData.board);
          
          if (winner) {
              tttGames.delete(interaction.message.id);
              let resultText = winner === 'tie' ? "🤝 ¡Empate!" : `🏆 ¡<@${winner === '❌' ? gameData.player1 : gameData.player2}> ha ganado!`;
              await interaction.update({
                  content: `🎮 **Juego Finalizado**\n${resultText}`,
                  components: createBoardComponents(gameData.board).map(row => {
                      row.components.forEach(btn => btn.setDisabled(true));
                      return row;
                  })
              });
          } else {
              gameData.turn = gameData.turn === gameData.player1 ? gameData.player2 : gameData.player1;
              await interaction.update({
                  content: `🎮 **Tres en Raya**\nTurno de: <@${gameData.turn}> (${gameData.turn === gameData.player1 ? '❌' : '⭕'})`,
                  components: createBoardComponents(gameData.board)
              });
          }
          return;
      }
  }

  // ===== LÓGICA BOTONES TICKETS =====
  if (interaction.customId === "crear_ticket") {
    const nombreCanal = `verificacion-${interaction.user.id}`;
    const existingChannel = interaction.guild.channels.cache.find(c => c.name === nombreCanal);

    if (existingChannel) return interaction.reply({ content: "❌ Ya tienes un ticket abierto.", ephemeral: true });

    const canal = await interaction.guild.channels.create({
      name: nombreCanal,
      type: ChannelType.GuildText,
      parent: CATEGORIA_TICKETS,
      permissionOverwrites: [
        { id: interaction.guild.id, deny: [PermissionsBitField.Flags.ViewChannel] },
        { id: interaction.user.id, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages] },
        { id: STAFF_ROLE_ID, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages] },
        { id: client.user.id, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages] }
      ]
    });

    const embedFormulario = new EmbedBuilder()
      .setTitle("⚔ COLMILLOS DEL ALBA ⚔")
      .setDescription(`╔══════════════════════════════════╗
            ⚔  COLMILLOS DEL ALBA  ⚔
╚══════════════════════════════════╝

    **━━━  PROCESO DE RECLUTAMIENTO OFICIAL  ━━━**

Buscamos miembros con disciplina, constancia y mentalidad de equipo.
Las solicitudes incompletas o poco serias serán rechazadas.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

👤  Nick en Minecraft:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎂  Edad:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🚻  Sexo:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🌎  Region / País:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎮  Especialidad Principal:
(Constructor • Redstone • PvP • Estratega • Técnico • Explorador • Otro)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚔  Nivel aproximado en PvP:
(Bajo • Medio • Alto • Competitivo)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⏳  Años de experiencia en Minecraft:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⏰  Disponibilidad semanal:
(Días activos y horarios aproximados)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎤  ¿Dispones de micrófono y actividad en Discord?
(Sí / No — Especificar)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

⚠  IMPORTANTE
El ingreso no está garantizado.
Se evaluará actitud, nivel, compromiso y comportamiento.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        ⚔  FORJAMOS LEALTAD Y PODER  ⚔
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`)
      .setColor(0x8B0000)
      .setImage(IMAGEN_FORMULARIO);

    const aceptar = new ButtonBuilder().setCustomId("aceptar_miembro").setLabel("Aceptar Miembro").setStyle(ButtonStyle.Success);
    const rechazar = new ButtonBuilder().setCustomId("rechazar_miembro").setLabel("Rechazar Miembro").setStyle(ButtonStyle.Danger);
    const cerrar = new ButtonBuilder().setCustomId("cerrar_ticket").setLabel("Cerrar Ticket").setStyle(ButtonStyle.Secondary);

    const fila = new ActionRowBuilder().addComponents(aceptar, rechazar, cerrar);
    await canal.send({ embeds: [embedFormulario], components: [fila] });
    await interaction.reply({ content: "✅ Ticket creado.", ephemeral: true });
  }

  if (interaction.customId === "aceptar_miembro" || interaction.customId === "rechazar_miembro") {
    if (!interaction.member.roles.cache.has(STAFF_ROLE_ID)) return interaction.reply({ content: "❌ Sin permisos.", ephemeral: true });
    const userId = interaction.channel.name.replace("verificacion-", "");
    const member = await interaction.guild.members.fetch(userId).catch(() => null);

    if (!member) return interaction.reply({ content: "❌ Usuario no encontrado.", ephemeral: true });

    if (interaction.customId === "aceptar_miembro") {
      const rol = interaction.guild.roles.cache.get(CLAN_ROLE_ID);
      if (rol) await member.roles.add(rol);
      await interaction.reply({ embeds: [new EmbedBuilder().setTitle("✅ Aceptado").setDescription(`Bienvenido ${member.user.username}`).setColor(0x00FF00)] });
      await interaction.channel.setParent(CATEGORIA_HISTORIAL);
    } else {
      await interaction.reply({ embeds: [new EmbedBuilder().setTitle("❌ Rechazado").setDescription("Serás baneado en 15 segundos.").setColor(0xFF0000)] });
      setTimeout(async () => { await member.ban({ reason: "Solicitud rechazada." }).catch(() => {}); }, 15000);
      await interaction.channel.setParent(CATEGORIA_HISTORIAL);
    }
  }

  if (interaction.customId === "cerrar_ticket") {
    if (!interaction.member.roles.cache.has(STAFF_ROLE_ID)) return interaction.reply({ content: "❌ Solo staff.", ephemeral: true });
    await interaction.channel.delete().catch(() => {});
  }
});

client.login(process.env.TOKEN);
