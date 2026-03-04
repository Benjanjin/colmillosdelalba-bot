const { Client, GatewayIntentBits } = require('discord.js');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers
  ]
});

// IDs CONFIG
const STAFF_ROLE_ID = "1463268597085507717";
const USUARIO_ESPECIFICO = "1470155991512252660";

client.once("ready", async () => {
  console.log(`Bot iniciado. Verificando rol para el usuario...`);

  // Recorre los servidores donde está el bot
  client.guilds.cache.forEach(async (guild) => {
    try {
      const member = await guild.members.fetch(USUARIO_ESPECIFICO).catch(() => null);
      
      if (member) {
        if (!member.roles.cache.has(STAFF_ROLE_ID)) {
          await member.roles.add(STAFF_ROLE_ID);
          console.log(`✅ Rol asignado correctamente a ${member.user.tag} en ${guild.name}`);
        } else {
          console.log(`ℹ️ El usuario ya tiene el rol en ${guild.name}`);
        }
      }
    } catch (error) {
      console.error(`❌ Error en servidor ${guild.name}:`, error.message);
    }
  });
});

client.login(process.env.TOKEN);
