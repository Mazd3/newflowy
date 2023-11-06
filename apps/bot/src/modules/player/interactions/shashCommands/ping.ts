import { SlashCommand } from '../../../../types/Interactions'

export const Ping: SlashCommand = {
  data: {
    name: 'ping',
    description: 'Ping the bot',
  },
  validations: ['botInVoiceChannel', 'userInVoiceChannel'],
  autocomplete: async (interaction) => {
    return void console.log('ping')
  },
  run: async (interaction) => {
    interaction.reply('pong')
    return void console.log('ping')
  },
}
