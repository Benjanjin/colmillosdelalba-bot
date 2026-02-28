const { Client, GatewayIntentBits } = require('discord.js');

const client = new Client({
    intents: [GatewayIntentBits.Guilds]
});

// ⚠️ PON AQUÍ EL ID DEL CANAL DE AVISOS
const CANAL_AVISOS = "1462533102130958437";

client.once("ready", async () => {
    console.log(`Bot listo como ${client.user.tag}`);

    try {
        const canal = await client.channels.fetch(CANAL_AVISOS);

        if (!canal) {
            console.log("No se encontró el canal.");
            return;
        }

        await canal.send("@everyone soy 1fsi ayuda, el bot se reveló y me baneó 😭 tiren /unban 1fsi, no me maten JAJAJA");

        console.log("Mensaje enviado correctamente.");
        process.exit(); // El bot se apaga después de enviarlo
    } catch (error) {
        console.error("Error enviando mensaje:", error);
    }
});

client.login(process.env.TOKEN);
