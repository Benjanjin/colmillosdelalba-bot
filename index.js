const { Client, GatewayIntentBits, Partials, ChannelType, PermissionsBitField, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require('discord.js');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMessageReactions
  ],
  partials: [Partials.Channel, Partials.Message, Partials.Reaction]
});

// ===== CONFIG =====
const STAFF_ROLE_ID = "1463268597085507717";
const CLAN_ROLE_ID = "1459687732417921227";
const CANAL_INICIAL = "1476978880672956428";
const CATEGORIA_TICKETS = "1477154960343826512";
const CATEGORIA_HISTORIAL = "1476973773579092151";
const CANAL_AVISOS = "1462533102130958437";
const CANAL_ROLES = "1464335122005491745";
const CANAL_SUGERENCIAS = "1477005989096984646";
const CANAL_COMANDOS = "1476614389749649523";

const IMAGEN_FORMULARIO = "https://cdn.discordapp.com/attachments/1473185415056855064/1476005469670608987/00c06809-480f-4798-940e-41a5118e";

const ROLES_REACCIONES = {
  "⚔️": "1464335696390263069",
  "⚒️": "1464335639561506878",
  "⚙️": "1464335746944209161",
  "🏛️": "1464335746856128737"
};

let mensajeRolesGlobal = null;

client.once("ready", async () => {
  console.log(`Bot listo como ${client.user.tag}`);

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
      .setDescription(`『⚔️』<@&1464335696390263069>
『⚒️』<@&1464335639561506878>
『⚙️』<@&1464335746944209161>
『🏛️』<@&1464335746856128737>`)
      .setColor(0x8B0000)
      .setImage(IMAGEN_FORMULARIO);

    mensajeRoles = await canalRoles.send({ embeds: [embedRoles] });

    for (const emoji of Object.keys(ROLES_REACCIONES)) {
      await mensajeRoles.react(emoji);
    }
  }

  mensajeRolesGlobal = mensajeRoles;
    // ===== REGISTRAR COMANDO /suggest =====
  await client.application.commands.create({
    name: "suggest",
    description: "Enviar una sugerencia al servidor",
    options: [
      {
        name: "texto",
        description: "Escribe tu sugerencia",
        type: 3,
        required: true
      }
    ]
  });
});

// ===== REACCIONES (MODIFICADO SOLO ESTO) =====
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

    setTimeout(() => {
      aviso.delete().catch(() => {});
    }, 4000);

    return;
  }

  await member.roles.add(roleId).catch(() => {});
    // ===== MENSAJE CUANDO ELIGE ROL (AÑADIDO) =====
  const rol = reaction.message.guild.roles.cache.get(roleId);

  const embedConfirmacion = new EmbedBuilder()
    .setTitle("⚔️ Rol Asignado")
    .setDescription(`Has elegido el rol **${rol.name}** y se te ha añadido correctamente.

Att: ColmillosDelAlba Administración`)
    .setColor(0x00FF00)
    .setTimestamp();

  const mensajeConfirmacion = await reaction.message.channel.send({
    content: `<@${user.id}>`,
    embeds: [embedConfirmacion]
  });

  setTimeout(() => {
    mensajeConfirmacion.delete().catch(() => {});
  }, 5000);
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

client.on("messageCreate", async (message) => {

  if (message.author.bot) return;

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

client.on("interactionCreate", async (interaction) => {
    if (interaction.isChatInputCommand()) {

    if (interaction.commandName === "suggest") {

      if (interaction.channel.id !== CANAL_COMANDOS) {
        return interaction.reply({
          content: "❌ Este comando solo se puede usar en el canal de comandos.",
          ephemeral: true
        });
      }

      const texto = interaction.options.getString("texto");

      const canalSugerencias = await client.channels.fetch(CANAL_SUGERENCIAS);

      const embedSugerencia = new EmbedBuilder()
        .setTitle("📌 Nueva Sugerencia")
        .setDescription(texto)
        .setColor(0x8B0000)
        .setFooter({ text: `Sugerido por ${interaction.user.tag}` })
        .setTimestamp();

      const mensaje = await canalSugerencias.send({
        embeds: [embedSugerencia]
      });

      await mensaje.react("👍");
      await mensaje.react("👎");

      await interaction.reply({
        content: "✅ Tu sugerencia fue enviada correctamente.",
        ephemeral: true
      });
    }
  }
  if (!interaction.isButton()) return;

  if (interaction.customId === "crear_ticket") {

    const nombreCanal = `verificacion-${interaction.user.id}`;

    const existingChannel = interaction.guild.channels.cache.find(
      c => c.name === nombreCanal
    );

    if (existingChannel) {
      return interaction.reply({
        content: "❌ Ya tienes un ticket abierto.",
        ephemeral: true
      });
    }

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

    const aceptar = new ButtonBuilder()
      .setCustomId("aceptar_miembro")
      .setLabel("Aceptar Miembro")
      .setStyle(ButtonStyle.Success);

    const rechazar = new ButtonBuilder()
      .setCustomId("rechazar_miembro")
      .setLabel("Rechazar Miembro")
      .setStyle(ButtonStyle.Danger);

    const cerrar = new ButtonBuilder()
      .setCustomId("cerrar_ticket")
      .setLabel("Cerrar Ticket")
      .setStyle(ButtonStyle.Secondary);

    const fila = new ActionRowBuilder().addComponents(aceptar, rechazar, cerrar);

    await canal.send({ embeds: [embedFormulario], components: [fila] });

    await interaction.reply({ content: "✅ Ticket creado.", ephemeral: true });
  }

  if (interaction.customId === "aceptar_miembro" || interaction.customId === "rechazar_miembro") {

    if (!interaction.member.roles.cache.has(STAFF_ROLE_ID)) {
      return interaction.reply({ content: "❌ Sin permisos.", ephemeral: true });
    }

    const userId = interaction.channel.name.replace("verificacion-", "");
    const member = await interaction.guild.members.fetch(userId).catch(() => null);

    if (!member) {
      return interaction.reply({ content: "❌ Usuario no encontrado.", ephemeral: true });
    }

    if (interaction.customId === "aceptar_miembro") {

      const rol = interaction.guild.roles.cache.get(CLAN_ROLE_ID);
      if (rol) await member.roles.add(rol);

      await interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setTitle("✅ Aceptado")
            .setDescription(`Bienvenido ${member.user.username}`)
            .setColor(0x00FF00)
        ]
      });

      await interaction.channel.setParent(CATEGORIA_HISTORIAL);
    }

    if (interaction.customId === "rechazar_miembro") {

      await interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setTitle("❌ Rechazado")
            .setDescription("Serás baneado en 15 segundos.")
            .setColor(0xFF0000)
        ]
      });

      setTimeout(async () => {
        await member.ban({ reason: "Solicitud rechazada." }).catch(() => {});
      }, 15000);

      await interaction.channel.setParent(CATEGORIA_HISTORIAL);
    }
  }

  if (interaction.customId === "cerrar_ticket") {

    if (!interaction.member.roles.cache.has(STAFF_ROLE_ID)) {
      return interaction.reply({ content: "❌ Solo staff.", ephemeral: true });
    }

    await interaction.channel.delete().catch(() => {});
  }
});

client.login(process.env.TOKEN);
