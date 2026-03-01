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
const CANAL_LOG = "1477154960343826513"; // Canal para logs de warn/ban/kick

const IMAGEN_FORMULARIO = "https://cdn.discordapp.com/attachments/1473185415056855064/1476005469670608987/00c06809-480f-4798-940e-41a5118e";

const ROLES_REACCIONES = {
  "⚔️": "1464335696390263069",
  "⚒️": "1464335639561506878",
  "⚙️": "1464335746944209161",
  "🏛️": "1464335746856128737"
};

// Mapa para anti-spam (guarda los últimos mensajes del usuario)
const userMessages = new Map();

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

  // ===== REGISTRAR COMANDOS =====
  
  // /info
  await client.application.commands.create({
    name: "info",
    description: "Información del clan y del bot"
  });

  // /reglas
  await client.application.commands.create({
    name: "reglas",
    description: "Muestra las normas del clan"
  });

  // /miembros
  await client.application.commands.create({
    name: "miembros",
    description: "Lista de todos los miembros del clan"
  });

  // /miembros online
  await client.application.commands.create({
    name: "miembros_online",
    description: "Muestra los miembros conectados"
  });

  // /miembro
  await client.application.commands.create({
    name: "miembro",
    description: "Ver información de un miembro",
    options: [
      {
        name: "usuario",
        description: "Usuario a buscar",
        type: 6,
        required: false
      }
    ]
  });

  // /reglas
  await client.application.commands.create({
    name: "reglas",
    description: "Muestra las reglas del clan"
  });

  // /ban
  await client.application.commands.create({
    name: "ban",
    description: "Banea a un miembro del clan",
    options: [
      {
        name: "usuario",
        description: "Usuario a banear",
        type: 6,
        required: true
      },
      {
        name: "razón",
        description: "Razón del baneo",
        type: 3,
        required: true
      }
    ]
  });

  // /kick
  await client.application.commands.create({
    name: "kick",
    description: "Expulsa a un miembro del clan",
    options: [
      {
        name: "usuario",
        description: "Usuario a expulsar",
        type: 6,
        required: true
      },
      {
        name: "razón",
        description: "Razón de la expulsión",
        type: 3,
        required: true
      }
    ]
  });

  // /warn
  await client.application.commands.create({
    name: "warn",
    description: "Advierte a un miembro",
    options: [
      {
        name: "usuario",
        description: "Usuario a warnear",
        type: 6,
        required: true
      },
      {
        name: "razón",
        description: "Razón de la advertencia",
        type: 3,
        required: true
      }
    ]
  });

  // /anunciar
  await client.application.commands.create({
    name: "anunciar",
    description: "Envía un anuncio oficial al canal de avisos",
    options: [
      {
        name: "mensaje",
        description: "Mensaje del anuncio",
        type: 3,
        required: true
      }
    ]
  });

  // /top
  await client.application.commands.create({
    name: "top",
    description: "Top de miembros más activos"
  });

  // /stats
  await client.application.commands.create({
    name: "stats",
    description: "Estadísticas del servidor",
    options: [
      {
        name: "usuario",
        description: "Usuario a buscar",
        type: 6,
        required: false
      }
    ]
  });

  // /suggest
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

// ===== REACCIONES ROLES =====
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

// ===== ANTI-SPAM Y ANTI-CAPS =====
client.on("messageCreate", async (message) => {
  if (message.author.bot) return;

  // === ANTI-SPAM: 5 palabras similares o idénticas ===
  const userId = message.author.id;
  const currentTime = Date.now();
  const timeWindow = 5000; // 5 segundos
  
  if (!userMessages.has(userId)) {
    userMessages.set(userId, []);
  }
  
  const messages = userMessages.get(userId);
  messages.push({ content: message.content.toLowerCase(), time: currentTime });
  
  // Limpiar mensajes viejos
  const recentMessages = messages.filter(m => currentTime - m.time < timeWindow);
  userMessages.set(userId, recentMessages);
  
  // Verificar spam
  if (recentMessages.length >= 5) {
    // Contar palabras similares
    const wordCounts = {};
    for (const msg of recentMessages) {
      const words = msg.content.split(/\s+/);
      for (const word of words) {
        if (word.length >= 3) { // Ignorar palabras muy cortas
          wordCounts[word] = (wordCounts[word] || 0) + 1;
        }
      }
    }
    
    // Si alguna palabra se repite 5+ veces
    const spamDetected = Object.values(wordCounts).some(count => count >= 5);
    
    if (spamDetected) {
      await message.delete().catch(() => {});
      const warnMsg = await message.channel.send({
        content: `⚠️ <@${message.author.id}> No hagas spam, estás repetitivo.`
      });
      setTimeout(() => warnMsg.delete().catch(() => {}), 3000);
      return;
    }
  }

  // === ANTI-CAPS: más de 7 mayúsculas seguidas ===
  const words = message.content.split(/\s+/);
  for (const word of words) {
    const uppercaseLetters = word.replace(/[^A-Z]/g, '');
    if (uppercaseLetters.length > 7) {
      await message.delete().catch(() => {});
      const warnMsg = await message.channel.send({
        content: `⚠️ <@${message.author.id}> Evita escribir en mayúsculas excesivas.`
      });
      setTimeout(() => warnMsg.delete().catch(() => {}), 3000);
      return;
    }
  }

  // ===== RESPONDER SI MENCIONAN AL BOT =====
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

// ===== INTERACTION CREATE (COMANDOS) =====
client.on("interactionCreate", async (interaction) => {
  
  // ===== COMANDO /reglas =====
  if (interaction.commandName === "reglas") {
    const embedReglas = new EmbedBuilder()
      .setTitle("🌅 🐉 Normas del Clan ColmillosdelAlba 🐉 🌅")
      .setDescription(`
**━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━**

> **1️⃣ 👑 Respeto y buena convivencia**
- Tratar a todos con respeto en Discord y Minecraft
- Nada de insultos, racismo o comportamiento tóxico

> **2️⃣ ⚔️ Roles y actividades**
- Cumplir tu rol: ⚔️ PvP | 🛠️ Builder | 🎲 Casual
- Apoyar al clan en aventuras, guerras y construcciones
- Si no hay combates activos, ayudar en construcciones

> **3️⃣ 🤝 Cooperación y trabajo en equipo**
- Compartir recursos y ayudar en proyectos del clan
- Coordinar ataques y defensas como un verdadero equipo

> **4️⃣ 🚫 Prohibido hacer trampas**
- Nada de hacks, cheats o exploits en Minecraft
- ❌ Incumplir puede derivar en **expulsión del clan y del Discord**

> **5️⃣ 🏗️ Cuidar el servidor y las construcciones**
- ❌ **No griefear ni destruir construcciones ajenas**
- Mantener el chat limpio y evitar spam

> **6️⃣ 📅 Participación**
- Mantenerse activo en Discord y en dioses.mc
- Avisar si vas a estar inactivo por un tiempo

> **7️⃣ 🏹 Respeto al líder**
- Líder: **guepar**
- Seguir sus decisiones y sugerencias
- Proponer ideas de manera respetuosa y constructiva

**━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━**

🔥🌅 ¡Que **ColmillosDelAlba** crezca fuerte, unido y legendario! 🐉🌅
`)
      .setColor(0x8B0000)
      .setThumbnail("https://cdn.discordapp.com/attachments/1473185415056855064/1476005469670608987/00c06809-480f-4798-940e-41a5118e")
      .setFooter({ text: "ColmillosDelAlba | Discord: ColmillosdelAlba | MC: dioses.mc" });

    return interaction.reply({ embeds: [embedReglas], ephemeral: false });
  }

  // ===== COMANDO /miembros =====
  if (interaction.commandName === "miembros") {
    const guild = interaction.guild;
    const miembros = await guild.members.fetch();
    const miembrosClan = miembros.filter(m => m.roles.cache.has(CLAN_ROLE_ID));
    const miembrosStaff = miembrosClan.filter(m => m.roles.cache.has(STAFF_ROLE_ID));
    const miembrosNormales = miembrosClan.filter(m => !m.roles.cache.has(STAFF_ROLE_ID));

    const embed = new EmbedBuilder()
      .setTitle("👥 Miembros del Clan")
      .setColor(0x8B0000)
      .setFooter({ text: `Total: ${miembrosClan.size} miembros` });

    if (miembrosStaff.size > 0) {
      embed.addFields({
        name: "🛡️ Staff",
        value: miembrosStaff.map(m => `• ${m.user.username}`).join("\n") || "Sin staff",
        inline: false
      });
    }

    if (miembrosNormales.size > 0) {
      embed.addFields({
        name: "⚔️ Miembros",
        value: miembrosNormales.map(m => `• ${m.user.username}`).join("\n") || "Sin miembros",
        inline: false
      });
    }

    return interaction.reply({ embeds: [embed], ephemeral: true });
  }

  // ===== COMANDO /miembros_online =====
  if (interaction.commandName === "mi
