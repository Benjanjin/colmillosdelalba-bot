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
    GatewayIntentBits.GuildMembers
  ],
  partials: [Partials.Channel]
});

// ===== CONFIGURACIÓN =====
const STAFF_ROLE_ID = "1463268597085507717";
const CLAN_ROLE_ID = "1459687732417921227";
const CANAL_INICIAL = "1476978880672956428";
const CATEGORIA_TICKETS = "1477154960343826512";
const CATEGORIA_HISTORIAL = "1476973773579092151";
const IMAGEN_FORMULARIO = "https://cdn.discordapp.com/attachments/1473185415056855064/1476005469670608987/00c06809-480f-4798-940e-41a5118e";

client.once("ready", async () => {
  console.log(`Bot listo como ${client.user.tag}`);

  const canal = await client.channels.fetch(CANAL_INICIAL);

  const boton = new ButtonBuilder()
    .setCustomId("crear_ticket")
    .setLabel("Solicitar verificación")
    .setStyle(ButtonStyle.Primary);

  const fila = new ActionRowBuilder().addComponents(boton);

  canal.send({
    content: "Haz clic aquí para solicitar acceso al clan:",
    components: [fila]
  });
});

client.on("interactionCreate", async (interaction) => {
  if (!interaction.isButton()) return;

  if (interaction.customId === "crear_ticket") {

    const existingChannel = interaction.guild.channels.cache.find(
      channel => channel.name === `verificacion-${interaction.user.username}`
    );

    if (existingChannel) {
      return interaction.reply({
        content: "❌ Ya tienes un ticket abierto.",
        ephemeral: true
      });
    }

    const canal = await interaction.guild.channels.create({
      name: `verificacion-${interaction.user.username}`,
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
      .setDescription("Completa el formulario para solicitar ingreso al clan.")
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

    const cerrarTicket = new ButtonBuilder()
      .setCustomId("cerrar_ticket")
      .setLabel("Cerrar Ticket")
      .setStyle(ButtonStyle.Secondary);

    const filaBotones = new ActionRowBuilder().addComponents(aceptar, rechazar, cerrarTicket);

    await canal.send({ embeds: [embedFormulario], components: [filaBotones] });

    await interaction.reply({
      content: "✅ Tu ticket fue creado correctamente.",
      ephemeral: true
    });
  }

  if (interaction.customId === "aceptar_miembro" || interaction.customId === "rechazar_miembro") {

    if (!interaction.member.roles.cache.has(STAFF_ROLE_ID)) {
      return interaction.reply({
        content: "❌ No tienes permisos.",
        ephemeral: true
      });
    }

    if (interaction.customId === "aceptar_miembro") {

      const channelName = interaction.channel.name;
      const username = channelName.replace("verificacion-", "");

      const members = await interaction.guild.members.fetch();
      const member = members.find(
        m => m.user.username === username || m.displayName === username
      );

      if (!member) {
        return interaction.reply({
          content: "❌ No se pudo encontrar al usuario.",
          ephemeral: true
        });
      }

      const rol = interaction.guild.roles.cache.get(CLAN_ROLE_ID);
      if (rol) {
        await member.roles.add(rol);
      }

      await interaction.reply({
        content: `✅ ${member.user.username} fue aceptado en el clan.`
      });

      await interaction.channel.setParent(CATEGORIA_HISTORIAL, { lockPermissions: true });
    }

    if (interaction.customId === "rechazar_miembro") {
      await interaction.reply({
        content: "❌ Solicitud rechazada."
      });

      await interaction.channel.setParent(CATEGORIA_HISTORIAL, { lockPermissions: true });
    }
  }

  if (interaction.customId === "cerrar_ticket") {

    if (!interaction.member.roles.cache.has(STAFF_ROLE_ID)) {
      return interaction.reply({
        content: "❌ Solo Staff puede cerrar.",
        ephemeral: true
      });
    }

    await interaction.channel.delete().catch(() => {});
  }
});

// 🔥 USAR VARIABLE DE ENTORNO
client.login(process.env.TOKEN);
