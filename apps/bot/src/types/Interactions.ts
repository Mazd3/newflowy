import {
  AutocompleteInteraction,
  ButtonComponentData,
  ButtonInteraction,
  ChatInputApplicationCommandData,
  ChatInputCommandInteraction,
  MessageApplicationCommandData,
  MessageContextMenuCommandInteraction,
  UserApplicationCommandData,
  UserContextMenuCommandInteraction,
} from 'discord.js'

import { Validations } from '../utils/valiation'

export interface SlashCommand {
  data: ChatInputApplicationCommandData
  validations?: Validations[]
  autocomplete?: (interaction: AutocompleteInteraction) => Promise<void>
  run: (interaction: ChatInputCommandInteraction) => Promise<void>
}

export interface Button {
  data: ButtonComponentData
  validations?: Validations[]
  run: (interaction: ButtonInteraction) => Promise<void>
}

export interface UserContextMenuCommand {
  data: UserApplicationCommandData
  validations?: Validations[]
  run: (interaction: UserContextMenuCommandInteraction) => Promise<void>
}

export interface MessageContextMenuCommand {
  data: MessageApplicationCommandData
  validations?: Validations[]
  run: (interaction: MessageContextMenuCommandInteraction) => Promise<void>
}
