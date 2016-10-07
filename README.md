# node-phpfpm-index
nodejs run php scripts via phpfpm for some framework. It is fork of https://github.com/longbill/node-phpfpm/, but all HTTP requests send to index.php as to use .htaccess for more popular frameworks. So, this code has more improvements. 
# dependency
npm install fastcgi-client 

# Configuration
```
    var phpfpm = new PHPFPM(configObject);
```
configObject may have the following keys:

* documentRoot optional [string] the document root folder of PHP scripts. must ends with /
* host optional [string] the ip or host name of php-fpm server (default: 127.0.0.1)
* port optional [int] the port of php-fpm server ( default: 9000 )
* sockFile optional [string] use the unix sock file instead of 127.0.0.1:9000 to connect php-fpm server


# API

available keys in options object

* uri [string] path to your phpfile
* url [string] the call of remote filename 'index.php'
* queryString [string] original url 
* method optional [string] HTTP method (default: GET)
* json optional [object] json data that will be send with content-type: application/json
* body optional [string] raw post body data for POST or PUT
* contentType optional [string] the content-type header
* contentLength optional [string] the content-length header
* hostname optional [string] current hostname
* remote_addr optional [string] remote ip client
* referer optional [string] referer uri		
* debug: optional [bool] default true, print to log all FCGI params

# example
```
var express = require('express');
var app = express();
var cookieParser = require('cookie-parser')

var PHPFPM = require('node-phpfpm-framework');
 

var phpfpm = new PHPFPM(
{
    sockFile : '/run/php/php-akalend-fpm.sock',
    documentRoot: '/home/akalend/project/lumen/test/public/'
});


app.use(cookieParser());
app.all('*', function(req, res, next) {

	phpfpm.run(
		{
			hostname: req.hostname,
			remote_addr: req.ip,
			method: req.method,
			referer : req.get('Referer') || '',		
			url: 'index.php',
			debug: true,
			queryString : req.originalUrl, 
			
		}, 
		function(err, output, phpErrors)
		{
		    if (err == 99) console.error('PHPFPM server error');
		    res.send(output);
		    
		    if (phpErrors) console.error(phpErrors);

		    next();
	});

});

app.listen(3000);
```
