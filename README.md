# node-phpfpm-index
nodejs run php scripts via phpfpm for some framework. It is fork of https://github.com/longbill/node-phpfpm/, but all HTTP requests send to index.php as to use .htaccess for more popular frameworks. So, this code has more improvements. 
# dependency
npm install fastcgi-client 
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
