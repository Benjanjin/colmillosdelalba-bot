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

const IMAGEN_FORMULARIO = "https://cdn.discordapp.com/attachments/1473185415056855064/1476005469670608987/00c06809-480f-4798-940e-41a5118e";

const ROLES_REACCIONES = {
  "⚔️": "1464335696390263069",
  "⚒️": "1464335639561506878",
  "⚙️": "1464335746944209161",
  "🏛️": "1464335746856128737"
};

let mensajeRolesGlobal = null;
const msgTracker = new Map();

client.once("ready", async () => {
  console.log(`Bot listo como ${client.user.tag}`);

  // Registro de Slash Commands actualizado
  const commands = [
    { name: 'info', description: 'Información del bot' },
    { name: 'comandos', description: 'Ver lista completa de comandos' },
    { name: 'jugar', description: 'Adivina el número del 1 al 100' },
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
    { name: 'warn', description: 'Advertir usuario', options: [{ name: 'usuario', description: 'Usuario a advertir', type: 6, required: true }, { name: 'razon', description: 'Razón', type: 3 }] }
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
  const mensajesRoles = await canalRoles.messages.fetch({ limit: 10 });

  let mensajeRoles = mensajesRoles.find(m => m.author.id === client.user.id);

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

// ===== REACCIONES ORIGINALES =====
client.on("messageReactionAdd", async (reaction, user) => {
  if (user.bot) return;
  if (reaction.partial) await reaction.fetch();
  if (reaction.message.channel.id !== CANAL_ROLES) return;

  const roleId = ROLES_REACCIONES[reaction.emoji.name];
  if (!roleId) return;

  const member = await reaction.message.guild.members.fetch(user.id);
  const rolesSistema = Object.values(ROLES_REACCIONES);

  const yaTieneOtro = rolesSistema.some(id =>
    id !== roleId && member.roles.cache.has(id)
  );

  if (yaTieneOtro) {
    await reaction.users.remove(user.id).catch(() => {});
    const aviso = await reaction.message.channel.send({
      content: `❌ <@${user.id}> Solo puedes tener **un rol** a la vez.`
    });
    setTimeout(() => { aviso.delete().catch(() => {}); }, 4000);
    return;
  }

  await member.roles.add(roleId).catch(() => {});
  const rol = reaction.message.guild.roles.cache.get(roleId);

  const embedConfirmacion = new EmbedBuilder()
    .setTitle("⚔️ Rol Asignado")
    .setDescription(`Has elegido el rol **${rol.name}** y se te ha añadido correctamente.\n\nAtt: ColmillosDelAlba Administración`)
    .setColor(0x00FF00)
    .setTimestamp();

  const mensajeConfirmacion = await reaction.message.channel.send({
    content: `<@${user.id}>`,
    embeds: [embedConfirmacion]
  });

  setTimeout(() => { mensajeConfirmacion.delete().catch(() => {}); }, 5000);
});

client.on("messageReactionRemove", async (reaction, user) => {
  if (user.bot) return;
  if (reaction.partial) await reaction.fetch();
  if (reaction.message.channel.id !== CANAL_ROLES) return;

  const roleId = ROLES_REACCIONES[reaction.emoji.name];
  if (!roleId) return;

  const member = await reaction.message.guild.members.fetch(user.id);
  await member.roles.remove(roleId).catch(() => {});
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
    await message.channel.send({ embeds: [embedAviso] });
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
• \`/warn\`: Advertir usuario.`)
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
        await canalDirectos.send({ content: "@everyone", embeds: [embedDirecto] });
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
      await canalAvisos.send({ 
        content: "@everyone", 
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

    if (commandName === "top" || commandName === "stats") {
      return interaction.reply({ content: "📊 Comando en desarrollo.", ephemeral: true });
    }
  }

  // ===== LÓGICA DE BOTONES (TICKETS) =====
  if (!interaction.isButton()) return;

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
🌎  Región / País:
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
