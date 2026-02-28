const {
  Client,
  GatewayIntentBits,
  Partials,
  ChannelType,
  PermissionsBitField,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder
} = require('discord.js');

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
const CANAL_ROLES = "1464335122005491745";

const IMAGEN_FORMULARIO = "https://cdn.discordapp.com/attachments/1473185415056855064/1476005469670608987/00c06809-480f-4798-940e-41a5118e8885.png";

// ROLES REACCIONES
const ROLES_REACCIONES = {
  "⚔️": "1464335696390263069",
  "⚒️": "1464335639561506878",
  "⚙️": "1464335746944209161",
  "🏛️": "1464335746856128737"
};

client.once("ready", async () => {
  console.log(`Bot listo como ${client.user.tag}`);

  // ===== BOTÓN TICKET =====
  const canalInicial = await client.channels.fetch(CANAL_INICIAL);
  const mensajes = await canalInicial.messages.fetch({ limit: 10 });

  const yaExiste = mensajes.find(
    m => m.author.id === client.user.id && m.components.length > 0
  );

  if (!yaExiste) {
    const boton = new ButtonBuilder()
      .setCustomId("crear_ticket")
      .setLabel("Solicitar verificación")
      .setStyle(ButtonStyle.Primary);

    const fila = new ActionRowBuilder().addComponents(boton);

    await canalInicial.send({
      content: "Haz clic aquí para solicitar acceso al clan:",
      components: [fila]
    });
  }

  // ===== MENSAJE ROLES =====
  const canalRoles = await client.channels.fetch(CANAL_ROLES);
  const mensajesRoles = await canalRoles.messages.fetch({ limit: 10 });

  let mensajeRoles = mensajesRoles.find(m => m.author.id === client.user.id);

  const contenidoRoles = `╔══ ≪ ° Roles ° ≫ ══╗
『⚔️』<@&1464335696390263069>
『⚒️』<@&1464335639561506878>
『⚙️』<@&1464335746944209161>
『🏛️』<@&1464335746856128737>`;

  if (!mensajeRoles) {
    mensajeRoles = await canalRoles.send(contenidoRoles);

    for (const emoji of Object.keys(ROLES_REACCIONES)) {
      await mensajeRoles.react(emoji);
    }
  }
});

// ===== SISTEMA REACCIONES =====
client.on("messageReactionAdd", async (reaction, user) => {
  if (user.bot) return;

  if (reaction.partial) await reaction.fetch();

  if (reaction.message.channel.id !== CANAL_ROLES) return;

  const roleId = ROLES_REACCIONES[reaction.emoji.name];
  if (!roleId) return;

  const member = await reaction.message.guild.members.fetch(user.id);
  await member.roles.add(roleId).catch(() => {});
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

// ===== TICKETS =====
client.on("interactionCreate", async (interaction) => {
  if (!interaction.isButton()) return;

  if (interaction.customId === "crear_ticket") {

    const nombreCanal = `verificacion-${interaction.user.id}`;

    const existing = interaction.guild.channels.cache.find(
      c => c.name === nombreCanal
    );

    if (existing) {
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
        { id: STAFF_ROLE_ID, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages] }
      ]
    });

    await interaction.reply({ content: "✅ Ticket creado.", ephemeral: true });

    const preguntas = [
      "👤 Nick:",
      "🎂 Edad:",
      "🚻 Sexo:",
      "🌎 Región / País:",
      "🎮 Especialidad:",
      "⚔ Nivel PvP:",
      "🏰 Experiencia:",
      "⏳ Años jugando:",
      "⏰ Disponibilidad:",
      "🎤 Micrófono:"
    ];

    const respuestas = [];

    const embedInicio = new EmbedBuilder()
      .setTitle("⚔ COLMILLOS DEL ALBA ⚔")
      .setDescription("Responde las siguientes preguntas:")
      .setImage(IMAGEN_FORMULARIO)
      .setColor(0xFF0000);

    await canal.send({ embeds: [embedInicio] });

    for (const pregunta of preguntas) {
      await canal.send(pregunta);

      const collected = await canal.awaitMessages({
        filter: m => m.author.id === interaction.user.id,
        max: 1,
        time: 300000
      }).catch(() => null);

      if (!collected || !collected.first()) {
        await canal.send("⏰ Tiempo agotado. Ticket cerrado.");
        return canal.delete().catch(() => {});
      }

      respuestas.push(collected.first().content);
    }

    const resumen = preguntas.map((p, i) => `${p} ${respuestas[i]}`).join("\n");

    const embedFinal = new EmbedBuilder()
      .setTitle("📋 Solicitud completada")
      .setDescription(resumen)
      .setColor(0x00AEFF);

    const aceptar = new ButtonBuilder()
      .setCustomId("aceptar_miembro")
      .setLabel("Aceptar")
      .setStyle(ButtonStyle.Success);

    const rechazar = new ButtonBuilder()
      .setCustomId("rechazar_miembro")
      .setLabel("Rechazar")
      .setStyle(ButtonStyle.Danger);

    const fila = new ActionRowBuilder().addComponents(aceptar, rechazar);

    await canal.send({ embeds: [embedFinal], components: [fila] });
  }

  if (interaction.customId === "aceptar_miembro" || interaction.customId === "rechazar_miembro") {

    if (!interaction.member.roles.cache.has(STAFF_ROLE_ID)) {
      return interaction.reply({ content: "❌ Sin permisos.", ephemeral: true });
    }

    const userId = interaction.channel.name.replace("verificacion-", "");
    const member = await interaction.guild.members.fetch(userId).catch(() => null);
    if (!member) return;

    if (interaction.customId === "aceptar_miembro") {
      await member.roles.add(CLAN_ROLE_ID).catch(() => {});
      await interaction.reply("✅ Usuario aceptado.");
      await interaction.channel.setParent(CATEGORIA_HISTORIAL);
    }

    if (interaction.customId === "rechazar_miembro") {
      await interaction.reply("❌ Usuario rechazado. Será baneado en 15 segundos.");

      setTimeout(async () => {
        await member.ban({ reason: "Solicitud rechazada." }).catch(() => {});
      }, 15000);

      await interaction.channel.setParent(CATEGORIA_HISTORIAL);
    }
  }
});

client.login(process.env.TOKEN);
