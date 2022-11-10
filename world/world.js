import { HANDLERS } from '../config.js'
import { Chunk } from './chunk.js'
import { generator } from './gendelegator.js'
import { Blocks } from '../blocks/block.js'
import { DataWriter } from '../utils/data.js'
export class World extends Map{
	constructor(id){
		super()
		this.id = id
	}
	load(cx, cy, p = null){
		let k = (cx&67108863)+(cy&67108863)*67108864
		let i = super.get(k)
		if(i instanceof Promise){
			if(p)i.players.push(p)
			return Promise.resolve(i)
		}
		if(i){
			if(p && p.sock){
				i.players.push(p)
				const buf = new DataWriter()
				i.toBuf(buf)
				for(const e of i.entities)if(!e.id){
					buf.double(e.x)
					buf.double(e.y)
					buf.int(e._id | 0), buf.short(e._id / 4294967296 | 0)
					buf.float(e.dx)
					buf.float(e.dy)
					buf.float(e.f)
					buf.write(e._.savedata, e)
				}
				buf.pipe(p.sock)
			}
			return Promise.resolve(i)
		}
		let pr = HANDLERS.LOADFILE('chunks/'+this.id+'/'+k).catch(Function.prototype).then(buf => buf || generator(cx, cy, this.id)).then(buf => {
			let i = new Chunk(buf, this)
			super.set(k, i)
			i.players = pr.players
			for(const p of i.players){
				if(Math.floor(p._x) >> 6 == cx && Math.floor(p._y) >> 6 == cy){
					p.chunk = i
					i.entities.add(p)
					p.mv = -1
				}
				p.sock.send(buf)
			}
			i.t = 20
			return i
		})
		pr.players = p ? [p] : []
		super.set(k, pr)
		return pr
	}
	unlink(cx, cy, p){
		let i = super.get((cx&67108863)+(cy&67108863)*67108864)
		if(i)i.players.remove(p)
	}
	async check(i){
		//Timer so that chunk unloads after 20 ticks of no players being in it, but may "cancel" unloading if players go back in during unloading process
		if(i.players.length){
			if(i.t <= 0)i.t = -1 //-1 == chunk has had a player loading it and the chunk will need saving again
			else i.t = 20 //Reset the timer
			return
		}
		if(i.t <= 0)return
		if(--i.t)return //Count down timer
		let k = (i.x&67108863)+(i.y&67108863)*67108864
		const b = i.toBuf(new DataWriter()).build()
		await HANDLERS.SAVEFILE('chunks/'+this.id+'/'+k, b)
		if(i.t == -1)i.t = 5 //If player has been in chunk, re-save chunk in 5 ticks
		else super.delete(k) //Completely unloaded with no re-loads, delete chunk
	}
	putEntity(e, x, y, force = false){
		let i = super.get((Math.floor(x)>>>6)+(Math.floor(y)>>>6)*67108864)
		if(!i || i instanceof Promise){
			if(!force)return false
			if(!i)i = this.load(Math.floor(x)>>>6, Math.floor(y)>>>6)
			if(e.chunk){
				for(const pl of e.chunk.players){
					if(!pl.sock)continue
					let buf = pl.ebuf
					if(!buf){buf = pl.ebuf = new DataWriter(); buf.byte(20)}
					buf.byte(0)
					buf.int(e._id | 0), buf.short(e._id / 4294967296 | 0)
				}
				e.chunk.entities.delete(e)
				e.chunk = null
			}
			let oldw = e._w
			e._w = this
			e.moved(e._x, e._y, (e._x = x, e._y = y, oldw))
			i.then(i => {
				if(Math.floor(e._x) >> 6 != i.x || Math.floor(e._y) >> 6 != i.y)return
				e.chunk = i
				i.entities.add(e)
				e.mv = -1
			})
			return
		}
		i.entities.add(e)
		if(e.chunk)e.chunk.entities.delete(e)
		e.chunk = i
		let oldw = e._w
		e._w = this
		e.moved(e._x, e._y, (e._x = x, e._y = y, oldw))
		return true
	}
	at(x, y){
		let ch = super.get((x>>>6)+(y>>>6)*67108864)
		if(!ch)return Blocks.air()
		return ch.tiles[(x & 63) + ((y & 63) << 6)]
	}
	put(x, y, b){
		let ch = super.get((x>>>6)+(y>>>6)*67108864)
		if(!ch)return
		ch.tiles[(x & 63) + ((y & 63) << 6)] = b
		let buf = new DataWriter()
		buf.byte(8)
		buf.int(x)
		buf.int(y)
		buf.short(b.id)
		for(const p of ch.players){
			buf.pipe(p.sock)
		}
	}
	[Symbol.for('nodejs.util.inspect.custom')](){return '<World '+this.id+'>'}
	toString(){return this.id}
}