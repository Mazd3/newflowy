import { GuildMember, Interaction } from 'discord.js'

type ValidationRes = { status: true } | { status: false; message: string }
export type Validations = keyof typeof validations

export const validate = (interaction: Interaction, validations: Validations[]): ValidationRes => {
  for (const validation of validations) {
    // @ts-ignore // TODO: remove
    console.log(validations[validation](interaction))
    // @ts-ignore // idk how to fix this typescript err
    return validations[validation](interaction)
  }
  return { status: true }
}

const validations = {
  userInVoiceChannel: (interaction: Interaction): ValidationRes => {
    return interaction.member instanceof GuildMember && interaction.member.voice.channel
      ? { status: true }
      : { status: false, message: 'You must be in a voice channel' }
  },
  botInVoiceChannel: (interaction: Interaction): ValidationRes => {
    return interaction.guild?.members.me?.voice.channelId
      ? { status: true }
      : { status: false, message: 'Bot must be in a voice channel' }
  },
}
