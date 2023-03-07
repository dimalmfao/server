import { Entity } from "../entities/entity.js"
import { blockevent, place, summon } from "../misc/ant.js"

export class Item{
	constructor(count = 1){
		this.count = count
		this.name = ''
	}
	[Symbol.for('nodejs.util.inspect.custom')](){ return 'Items.'+this.className+'(\x1b[33m'+this.count+'\x1b[m)' }
	static savedata = null
	static burns = false
	static maxStack = 64
	breaktime(block){ return block.breaktime }
	use(b = true){
		if(b) blockevent(3)
		this.count--
	}
}
Object.setPrototypeOf(Item.prototype, null)
export const Items = Object.create(null)
export const ItemIDs = []