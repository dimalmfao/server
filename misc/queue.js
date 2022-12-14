const queued = []
export function queue(ws){
	if(queued.length >= 1e5)return ws.send('-119What the heck!!? Queue is full (100000 players)'), true
	let pr = new Promise(r => (r.ws = ws, queued.push(r), queueLength++))
	ws.send('-21fPosition in queue: ' + queueLength)
	console.log(queued, queueLength)
	return pr
}

export function playerLeft(){
	if(!queueLength)return
	queued.shift()(false)
	let i = 0
	for(const {ws} of queued)ws.send('-21fPosition in queue: ' + ++i)
	queueLength--
}

export function playerLeftQueue(){
	console.log(this)
	let i = 0
	while(i < queueLength && queued[i].ws != this)i++
	if(i == queueLength)return
	queued.splice(i, 1)
	queueLength--
	while(i < queued.length)queued[i].ws.send('-21fPosition in queue: ' + ++i)
}
export let queueLength = 0