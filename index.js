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
    GatewayIntentBits.MessageContent
  ],
  partials: [Partials.Channel]
});

// ===== CONFIG =====
const STAFF_ROLE_ID = "1463268597085507717";
const CLAN_ROLE_ID = "1459687732417921227";
const CANAL_INICIAL = "1476978880672956428";
const CATEGORIA_TICKETS = "1477154960343826512";
const CATEGORIA_HISTORIAL = "1476973773579092151";
const CANAL_AVISOS = "1462533102130958437";
const IMAGEN_FORMULARIO = "https://cdn.discordapp.com/attachments/1473185415056855064/1476005469670608987/00c06809-480f-4798-940e-41a5118e";

client.once("ready", async () => {
  console.log(`Bot listo como ${client.user.tag}`);

  const canal = await client.channels.fetch(CANAL_INICIAL);
  const mensajes = await canal.messages.fetch({ limit: 20 });

  const yaExiste = mensajes.find(
    m => m.author.id === client.user.id && m.components.length > 0
  );

  if (yaExiste) return; // 👈 evita duplicar botón

  const boton = new ButtonBuilder()
    .setCustomId("crear_ticket")
    .setLabel("Solicitar verificación")
    .setStyle(ButtonStyle.Primary);

  const fila = new ActionRowBuilder().addComponents(boton);

  await canal.send({
    content: "Haz clic aquí para solicitar acceso al clan:",
    components: [fila]
  });
});

client.on("messageCreate", async (message) => {

  if (message.author.bot) return;

  // DM
  if (!message.guild) {
    const embedDM = new EmbedBuilder()
      .setTitle("🤖 Información del Bot")
      .setDescription("**Creado por 1fsi**\n\nVenta de bots personalizados.\nDiscord: **1fsi**")
      .setColor(0x00AEFF);

    await message.reply({ embeds: [embedDM] });
    return;
  }

  // Avisos
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
      .setDescription(`📜 **PROCESO DE RECLUTAMIENTO OFICIAL**

👤 Nick:
🎂 Edad:
🚻 Sexo:
🌎 Región / País:
🎮 Especialidad:
⚔ Nivel PvP:
🏰 Experiencia:
⏳ Años jugando:
⏰ Disponibilidad:
🎤 Micrófono:

⚠ Se evaluará actitud y compromiso.`)
      .setColor(0xFF0000)
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
