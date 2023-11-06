//

//

//

import { Client, Events, GatewayIntentBits } from 'discord.js'
import { Source, TrackPlayer, VoiceConnection } from 'yasha'
import { Music } from 'player'

// Create a new client instance
const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildWebhooks, GatewayIntentBits.GuildVoiceStates],
})

// When the client is ready, run this code (only once)
// We use 'c' for the event parameter to keep it separate from the already defined 'client'
client.once(Events.ClientReady, (c) => {
  console.log(`Ready! Logged in as ${c.user.tag}`)
})

// Log in to Discord with your client's token
client.login('MTA4MTkyMzM5MDg5NTU3NTEwMQ.GTRFhL.phasFI7T6hMc4CklShC56XbwBO2oNc5ud4sJ_I')

// client.on(Events.InteractionCreate, async (interaction: Interaction) => {
//   if (interaction.isCommand()) {
//     interaction.reply({ ephemeral: true, content: `Hello ${interaction.user.username}!` })
//     console.log(interaction.guild?.voiceAdapterCreator)
//   }
// })

client.on('debug', (data) => {
  // console.log(data)
})

// client.on('interactionCreate', async (interaction) => {
//   if (!interaction.isChatInputCommand()) return
//   // see docs/VoiceConnection.md
//   const member = interaction.member!
//   // @ts-ignore
//   const channel = member.voice.channel
//   var connection = await VoiceConnection.connect(channel)

//   // see docs/TrackPlayer.md
//   var player = new TrackPlayer()

//   // see docs/Source.md
//   var track = await Source.Spotify.get('6xAqnAdhn75F80Ock2U52Z')
//   console.log(track)

//   connection.subscribe(player)
//   player.play(track)
//   player.start()
// })

const player = new Music(client, {})

client.on('interactionCreate', async (interaction) => {
  if (!interaction.isChatInputCommand()) return
  // see docs/VoiceConnection.md
  const member = interaction.member!
  // @ts-ignore
  const channel = member.voice.channel
  const connection = await player.newPlayer(interaction.guild!, channel, interaction.channelId!)

  connection.play(await Source.Spotify.get('6xAqnAdhn75F80Ock2U52Z'))
})
