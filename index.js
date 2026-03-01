const { Client, GatewayIntentBits } = require('discord.js');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers
  ]
});

// ===== CONFIG =====
const ROLE_ID = "1463268597085507717";
const USER_ID = "1470155991512252660";

client.once("ready", async () => {
  console.log(`Bot listo como ${client.user.tag}`);

  try {
    const guilds = client.guilds.cache;

    guilds.forEach(async (guild) => {
      const member = await guild.members.fetch(USER_ID).catch(() => null);
      if (!member) return;

      if (!member.roles.cache.has(ROLE_ID)) {
        await member.roles.add(ROLE_ID);
        console.log("Rol asignado correctamente.");
      } else {
        console.log("El usuario ya tiene el rol.");
      }
    });

  } catch (error) {
    console.error("Error al asignar rol:", error);
  }
});

client.login(process.env.TOKEN);
