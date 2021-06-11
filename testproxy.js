
module.exports = async function ae(p){
  const axios = require("axios");
  let httpsProxyAgent = require("https-proxy-agent");
  const agent = new httpsProxyAgent('http://'+p,{ rejectUnauthorized: false,keepAlive: true });
  //const agent = new httpsProxyAgent('http://'+p);
  const config = {
    method: "GET",
    url: "https://1.1.1.1",
    httpsAgent: agent
  };
  var timeout = 5000; //ms
	var resp;
	//console.log("req");
	try{
		resp = await axios.request(config, {timeout:timeout});
	}catch(err){
		//console.log(err);
		if (err.code == 'ECONNABORTED' || err.code=="ETIMEDOUT"){
			return ('bad');
		}else{
			return ('err');
		}
	}
	//console.log(resp);
	return( 'good');
  /*
  .then(response =>{
	  console.log(resp);
    return 'good';
  })
  .catch(error => {
      if (error.code === 'ECONNABORTED')
          return 'bad';
  });
  */
  

}


