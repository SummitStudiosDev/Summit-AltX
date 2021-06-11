const {parentPort, workerData,isMainThread } = require("worker_threads");
if(isMainThread)process.exit(9);
const tp = require('./testproxy');


parentPort.on('message', (message) => {
	if(message.exit){
		process.exit();
	}
	//console.log("in "+message);
	tp(message)
	.then(res => {
		if(res=='good'){
			console.log("good proxy "+message);
			parentPort.postMessage(message);
		}else{ 
			//console.log("bad proxy "+message);
			parentPort.postMessage("bad");
		}
	})
});
