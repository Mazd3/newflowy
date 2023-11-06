import { Client, Collection, Guild, VoiceChannel } from 'discord.js'
import { EventEmitter } from 'node:events'
import { Player, RepeatMode } from './Player'
import { Track } from 'yasha'

export type MusicEvents {
  trackStart: [player: Player, track: Track]
  trackEnd: [player: Player, track: Track]
  queueEnd: [player: Player, track: Track]
}

export class Music extends EventEmitter {
  client: Client
  players: Collection<string, Player>

  public emit<K extends keyof MusicEvents>(event: K, ...args: MusicEvents[K]): boolean;
 
  constructor(client: Client, options: {}) {
    super()
    this.client = client
    this.players = new Collection()
  }

  async newPlayer(guild: Guild, voiceChannel: VoiceChannel, textChannel: string) {
    // const dbOptions = await getPlayerOptionsFromDB(guild)
    const player = new Player({
      manager: this,
      guild: guild,
      voiceChannel: voiceChannel,
      textChannel: textChannel,
    })

    this.players.set(player.guild.id, player)

    player.on('ready', () => {
      this.trackStart(player)
      console.log('ready')
    })

    player.on('finish', () => {
      this.trackEnd(player)
      console.log('finish')
    })

    // player.on(VoiceConnection.Status.Destroyed, () => {
    //   if (player) player.destroy(true)
    // })

    // player.on('error', (err) => {
    //   this.logger.error(`${player.queue.current.id} ${err} ${err.stack}`)
    //   player.skip()

    return player
  }

  trackStart(player: Player) {
    player.playing = true

    const track = player.queue.current
    this.emit('trackStart', player, track)
  }

  trackEnd(player: Player) {
    const track = player.queue.current
    if (!track) return

    if (player.repeatMode === 'track') {
      this.emit('trackEnd', player, track)
      player.play()
      return
    }

    if (player.repeatMode === 'queue') {
      if (player.queueStrategy === 'FIFO') {
        player.queue.add(track)
        player.queue.current = player.queue.shift()
      } else {
        player.queue.add(track, 0)
        player.queue.current = player.queue.pop()
      }
      this.emit('trackEnd', player, track)
      player.play()
      return
    }

    if (player.queue.length) {
      if (player.queueStrategy === 'FIFO') {
        player.queue.current = player.queue.shift()
      } else {
        player.queue.current = player.queue.pop()
      }
      this.emit('trackEnd', player, track)
      player.play()
      return
    }

    if (!player.queue.length) {
      this.emit('trackEnd', player, track)
      player.stop()
      player.queue.current = null
      player.playing = false
      return this.queueEnd(player, track)
    }
  }

  queueEnd(player: Player, track: Track) {
    if (!player.stayInVoice) {
      player.leaveTimeout = setTimeout(() => {
        player.cleanup()
      }, 1000 * 60) // TODO: maybe add variable
    }
    this.emit('queueEnd', player, track)
  }

  queuePaused(player: Player) {
    this.emit('queuePaused', player)
  }

  get(guild) {
    return this.players.get(guild.id)
  }

  destroy(guild) {
    this.players.delete(guild.id)
  }

  async search(query: string, requester: string, source: 'soundcloud' | 'spotify' | 'apple') {
    let track

    try {
      switch (source) {
        case 'soundcloud':
          track = (await Source.Soundcloud.search(query))[0]
          break
        case 'spotify':
          track = (await Source.Spotify.search(query))[0]
          break
        case 'apple':
          track = (await Source.AppleMusic.search(query))[0]
          break
        default:
          track = await Source.resolve(query)
          break
      }

      if (!track || track.source == 'youtube') {
        track = (await Source.Soundcloud.search(query))[0]
        source = 'soundcloud'
      }

      if (!track) throw new Error('No track found')
      else {
        if (track instanceof TrackPlaylist) {
          track.forEach((t) => {
            t.requester = requester
            t.icon = null
            t.thumbnail = QueueHelper.reduceThumbnails(t.thumbnails)
          })
        } else {
          track.requester = requester
          track.icon = null
          track.thumbnail = QueueHelper.reduceThumbnails(track.thumbnails)
        }
        return track
      }
    } catch (err) {
      throw new Error(err)
    }
  }

  getPlayingPlayers() {
    return this.players.filter((p) => p.playing)
  }
}
