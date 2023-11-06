import { Track } from 'yasha'

export class Queue extends Array {
  public current: Track | null

  constructor() {
    super()
    this.current = null
  }

  add(track: Track, index?: number) {
    if (!this.current) this.current = track
    else if (!index) this.push(track)
    else this.splice(index, 0, track)
  }

  remove(index: number) {
    this.splice(index, 1)
  }

  clear() {
    this.splice(0)
  }

  shuffle() {
    for (let i = this.length - 1; i > 0; i--) {
      const n = Math.floor(Math.random() * (i + 1))
      ;[this[i], this[n]] = [this[n], this[i]]
    }
  }

  totalSize() {
    return this.length + (this.current ? 1 : 0)
  }
}
