import { Client, Collection, Guild, VoiceChannel } from 'discord.js'
import { EventEmitter } from 'node:events'
import { Node } from './Node'
import { Track } from 'yasha'

// export type MusicEvents = {
//   trackStart: [player: Player, track: Track]
//   trackEnd: [player: Player, track: Track]
//   queueEnd: [player: Player, track: Track]
// }

export class Player extends EventEmitter {
  client: Client
  nodes: Collection<string, Node>

  // public emit<K extends keyof MusicEvents>(event: K, ...args: MusicEvents[K]): boolean;

  constructor(client: Client, options: {}) {
    super()
    this.client = client
    this.nodes = new Collection()
  }

  async newPlayer(guild: Guild, voiceChannel: VoiceChannel, textChannel: string) {
    // const dbOptions = await getPlayerOptionsFromDB(guild)
    const node = new Node({
      manager: this,
      guild: guild,
      voiceChannel: voiceChannel,
      textChannel: textChannel,
    })

    this.nodes.set(node.guild.id, node)

    node.on('ready', () => {
      this.trackStart(node)
      console.log('ready')
    })

    node.on('finish', () => {
      this.trackEnd(node)
      console.log('finish')
    })

    // player.on(VoiceConnection.Status.Destroyed, () => {
    //   if (player) player.destroy(true)
    // })

    // player.on('error', (err) => {
    //   this.logger.error(`${player.queue.current.id} ${err} ${err.stack}`)
    //   player.skip()

    return node
  }

  trackStart(node: Node) {
    node.playing = true

    const track = node.queue.current
    this.emit('trackStart', node, track)
  }

  trackEnd(node: Node) {
    const track = node.queue.current
    if (!track) return

    if (node.repeatMode === 'track') {
      this.emit('trackEnd', node, track)
      node.play()
      return
    }

    if (node.repeatMode === 'queue') {
      if (node.queueStrategy === 'FIFO') {
        node.queue.add(track)
        node.queue.current = node.queue.shift()
      } else {
        node.queue.add(track, 0)
        node.queue.current = node.queue.pop()
      }
      this.emit('trackEnd', node, track)
      node.play()
      return
    }

    if (node.queue.length) {
      if (node.queueStrategy === 'FIFO') {
        node.queue.current = node.queue.shift()
      } else {
        node.queue.current = node.queue.pop()
      }
      this.emit('trackEnd', node, track)
      node.play()
      return
    }

    if (!node.queue.length) {
      this.emit('trackEnd', node, track)
      node.stop()
      node.queue.current = null
      node.playing = false
      return this.queueEnd(node, track)
    }
  }

  queueEnd(node: Node, track: Track) {
    if (!node.stayInVoice) {
      node.leaveTimeout = setTimeout(() => {
        node.stop()
      }, 1000 * 60) // TODO: maybe add variable
    }
    this.emit('queueEnd', node, track)
  }

  queuePaused(node: Node) {
    this.emit('queuePaused', node)
  }

  get(guildId: string) {
    return this.nodes.get(guildId)
  }

  destroy(guildId: string) {
    this.nodes.delete(guildId)
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
    return this.nodes.filter((p) => p.playing)
  }
}
