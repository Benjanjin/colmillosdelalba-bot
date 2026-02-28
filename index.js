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
const TOKEN = "MTQ3NzA0NzcwNTQ4MDk4NjY0NA.Gw5X2S.bMaujKmsyJquj6I34zrAEUNTFCALF5Wo2u8plc"; // ⚠ Cambiarlo si se mostró públicamente
const STAFF_ROLE_ID = "1463268597085507717";
const CLAN_ROLE_ID = "1459687732417921227";
const CANAL_INICIAL = "1476978880672956428";
const CATEGORIA_TICKETS = "1477154960343826512";
const CATEGORIA_HISTORIAL = "1476973773579092151"; // ID de la categoría Historial
const IMAGEN_FORMULARIO = "https://cdn.discordapp.com/attachments/1473185415056855064/1476005469670608987/00c06809-480f-4798-940e-41a5118e"; // Imagen del formulario

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

  // ============================
  // CREAR TICKET
  // ============================
  if (interaction.customId === "crear_ticket") {
    // Verificar si ya existe un canal de ticket para el usuario
    const existingChannel = interaction.guild.channels.cache.find(channel => channel.name === `verificacion-${interaction.user.username}`);
    
    if (existingChannel) {
      return interaction.reply({
        content: "❌ Ya tienes un ticket abierto. Por favor, espera a que se cierre antes de crear uno nuevo.",
        ephemeral: true
      });
    }

    // Crear el canal de ticket
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
      .setDescription(
`📜 PROCESO DE RECLUTAMIENTO OFICIAL

Colmillos del Alba es un clan competitivo.
Buscamos disciplina, constancia y mentalidad de equipo.
Las solicitudes incompletas serán rechazadas.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
👤 Nombre:
🎂 Edad:
🚻 Sexo:
🌎 Región / País:
🎮 Especialidad principal:
(Constructor, Redstone, PvP, Estratega, Técnico, Explorador, etc.)
⚔ Nivel aproximado en PvP:
(Bajo / Medio / Alto / Competitivo)          
🏰 Experiencia en clanes anteriores:
(Especificar nombre y rol desempeñado)
⏳ Años de experiencia en Minecraft:
⏰ Disponibilidad semanal:
(Horarios y días activos)
🎤 ¿Dispones de micrófono y actividad en Discord?
(Sí / No – Especificar)

⚠ El ingreso no está garantizado.
Se evaluará actitud, nivel y compromiso.`
      )
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

  // ============================
  // ACEPTAR / RECHAZAR / CERRAR TICKET
  // ============================
  if (interaction.customId === "aceptar_miembro" || interaction.customId === "rechazar_miembro") {
    // SOLO STAFF
    if (!interaction.member.roles.cache.has(STAFF_ROLE_ID)) {
      return interaction.reply({
        content: "❌ No tienes permisos para usar este botón.",
        ephemeral: true
      });
    }

    // ACEPTADO
    if (interaction.customId === "aceptar_miembro") {
      
      // *** CORRECCIÓN: Obtener el username del nombre del canal ***
      const channelName = interaction.channel.name;
      // El nombre es "verificacion-username", separamos por el guión
      const usernameParts = channelName.split('-');
      const username = usernameParts.slice(1).join('-'); // Por si el username tiene guiones
      
      // Buscar al miembro por su nombre de usuario (displayName o username)
      // Primero intentamos buscar por nombre exacto en la cache de miembros
      let member = interaction.guild.members.cache.find(m => m.user.username === username || m.displayName === username);

      // Si no lo encontramos en cache, intentamos buscar por tag o buscar en toda la guild
      if (!member) {
        try {
          // Buscar entre todos los miembros de la guild
          const members = await interaction.guild.members.fetch();
          member = members.find(m => m.user.username === username || m.displayName === username);
        } catch (err) {
          console.error("Error buscando miembro:", err);
        }
      }

      if (!member) {
        return interaction.reply({ 
          content: "❌ Error: No se pudo encontrar al usuario del ticket. Puede que haya cambiado su nombre de usuario.", 
          ephemeral: true 
        });
      }
      // ************************************************************

      const embedAceptado = new EmbedBuilder()
        .setTitle("✅ Solicitud Aceptada")
        .setDescription(`¡Felicidades ${member.user.username}! Has sido aceptado en el clan. 🎉`)
        .setColor(0x00FF00);

      // Asignar el rol de "miembro" al solicitante
      const botMember = interaction.guild.members.cache.get(client.user.id);
      
      if (botMember && botMember.permissions.has(PermissionsBitField.Flags.ManageRoles)) {
        const rol = interaction.guild.roles.cache.get(CLAN_ROLE_ID);
        if (rol) {
          // *** Aquío se le da el rol al miembro correcto ***
          await member.roles.add(rol);
        } else {
          return interaction.reply({
            content: "❌ No pude encontrar el rol de 'miembro'. Por favor, revisa la configuración.",
            ephemeral: true
          });
        }
      } else {
        return interaction.reply({
          content: "❌ No tengo permisos suficientes para asignar roles. (Asegúrate de que mi rol esté por encima del rol de miembro)",
          ephemeral: true
        });
      }

      await interaction.reply({ embeds: [embedAceptado] });

      // Mover el canal a la categoría Historial de Tickets
      await interaction.channel.setParent(CATEGORIA_HISTORIAL, { lockPermissions: true });

      // Agregar un botón para cerrar el ticket
      const cerrar = new ButtonBuilder()
        .setCustomId("cerrar_ticket")
        .setLabel("Cerrar Ticket")
        .setStyle(ButtonStyle.Danger);

      const filaCerrar = new ActionRowBuilder().addComponents(cerrar);
      await interaction.channel.send({ components: [filaCerrar] });
    }

    // RECHAZADO
    if (interaction.customId === "rechazar_miembro") {
      const embedRechazado = new EmbedBuilder()
        .setTitle("❌ Solicitud Rechazada")
        .setDescription(`No fuiste aceptado para este clan por la administración del servidor.

Puedes volver a intentarlo más adelante si lo deseas.`)
        .setColor(0xFF0000);

      await interaction.reply({ embeds: [embedRechazado] });

      // Mover el canal a la categoría Historial de Tickets
      await interaction.channel.setParent(CATEGORIA_HISTORIAL, { lockPermissions: true });

      // Agregar un botón para cerrar el ticket
      const cerrar = new ButtonBuilder()
        .setCustomId("cerrar_ticket")
        .setLabel("Cerrar Ticket")
        .setStyle(ButtonStyle.Danger);

      const filaCerrar = new ActionRowBuilder().addComponents(cerrar);
      await interaction.channel.send({ components: [filaCerrar] });
    }
  }

  // ============================
  // CERRAR TICKET
  // ============================
  if (interaction.customId === "cerrar_ticket") {
    // SOLO STAFF
    if (!interaction.member.roles.cache.has(STAFF_ROLE_ID)) {
      return interaction.reply({
        content: "❌ Este botón es solo para **Staff**.",
        ephemeral: true
      });
    }

    // Mover el canal a Historial
    await interaction.channel.setParent(CATEGORIA_HISTORIAL, { lockPermissions: true });

    // Eliminar el canal
    await interaction.channel.delete().catch(() => {});
  }
});

// Iniciar el bot
client.login(TOKEN);
