import { explode } from "../common/explode.js"
import { Entities, Entity } from "../entity.js"

Entities.end_crystal = class extends Entity{
	static width = 0.99
	static height = 1.99
	static gx = 0
	static gy = 0
	health = 1
	static maxHealth = 1
	died(){
		// explode
		this.goto()
		explode(180)
		this.event(3)
	}
}