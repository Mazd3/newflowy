import { Client, Guild, VoiceChannel } from 'discord.js'
import { Source, Track, TrackPlayer, VoiceConnection } from 'yasha'
import { Music } from './Manager'
import { Queue } from './Queue'

interface PlayerCreateOptions {
  defaultSource?: keyof typeof Source
  manager: Music
  voiceChannel: VoiceChannel
  textChannel: string
  volume?: number
  guild: Guild
}

type QueueStrategy = 'FIFO' | 'LIFO'

type RepeatMode = 'off' | 'track' | 'queue'

export class Player extends TrackPlayer {
  public manager: Music
  public playing: boolean
  public volume: number
  public stayInVoice: boolean
  public queue: Queue
  public voiceChannel: VoiceChannel
  public textChannel: string
  public leaveTimeout: NodeJS.Timeout | null
  public guild: Guild
  public connection: VoiceConnection | null
  public defaultSource: keyof typeof Source
  public nowPlayingMessage: any // TODO: Add correct type
  public repeatMode: RepeatMode
  public queueStrategy: QueueStrategy

  constructor(options: PlayerCreateOptions) {
    super({ external_encrypt: true, external_packet_send: true })
    this.manager = options.manager
    this.stayInVoice = false
    this.playing = false
    this.volume = options.volume ?? 100
    this.queue = new Queue()
    this.voiceChannel = options.voiceChannel
    this.textChannel = options.textChannel
    this.leaveTimeout = null
    this.guild = options.guild
    this.connection = null
    this.defaultSource = options.defaultSource ?? 'Spotify' // TODO: add source to config
    this.repeatMode = 'off'
    this.queueStrategy = 'FIFO'

    // if (this.manager.players.has(options.guild.id)) {
    //   return this.manager.players.get(options.guild.id)
    // }
  }

  async connect() {
    this.connection = await VoiceConnection.connect(this.voiceChannel, {
      selfDeaf: true,
    })
    this.connection.subscribe(this)
    this.connection.on('error', (e: any) => console.error(e))
  }
  disconnect() {
    if (this.connection) this.connection.disconnect()
  }

  // stop() {
  //   if (this.connection) {
  //     super.destroy()
  //     this.connection.destroy()
  //     this.connection = null
  //     this.manager.destroy(this.guild)
  //   }
  // }

  play(track?: Track) {
    if (!track) {
      if (!this.queue.current) return
      super.play(this.queue.current)
    } else {
      super.play(track)
    }
    if (this.leaveTimeout) clearTimeout(this.leaveTimeout)
    if (!this.connection) this.connect()

    this.leaveTimeout = null
    super.start()
    this.playing = true
  }

  playpause() {
    if (this.queue.current && this.playing) {
      super.stop()
      this.playing = false
      this.manager.trackStart(this)
    }
    if (this.queue.current && !this.playing) {
      super.start()
      this.playing = false
      this.manager.queuePaused(this)
    }
  }

  skip() {
    this.manager.trackEnd(this, false)
  }

  skipTo(index: number) {
    this.queue.slice(0, index)
    this.manager.trackEnd(this, false)
  }

  setVolume(volume: number) {
    super.setVolume(volume)
  }

  setRepeatMode(repeatMode: RepeatMode) {
    this.repeatMode = repeatMode
  }

  async delete(force: boolean) {
    try {
      if (this.stayInVoice && !force) return

      if (this.nowPlayingMessage) {
        // if (this.nowPlayingMessageInterval) clearInterval(this.nowPlayingMessageInterval);
        // eslint-disable-next-line no-empty-function
        await this.nowPlayingMessage.edit({ components: [] }).catch(() => {})
      }
      if (this.connection) this.disconnect()
      super.destroy()

      this.manager.players.delete(this.guild.id)
    } catch (e) {
      console.error(e)
    }
  }
}
