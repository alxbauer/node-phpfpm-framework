# Описание
Для запуска большинства РНР фреймворков используется .htaccess или особые правила в nginx, которые все запросы на не существующие файлы заворачивают на index.php

Если использовать связку nginx - node.js - php-fpm в которой node.js используется как уровень представления (в терминах РНР - шаблонизаторо), а РНР, как уровень бизнес логики, то для её реализации лучше использовать простой фреймворк(Lumen, Slim, Phalcon), каждый из которых требует запуска index.php при любых запросах, и передачи url в качестве переменной окружения REQUEST_URI.  

Данный модуль может общаться по протоколу FastCGI с любым процессом, но прежде всего настроен на PHP. Это переделанный и улучшенный проект  https://github.com/longbill/node-phpfpm/

# Зависимости

Зависит от модуля  fastcgi-client 
```
    npm install fastcgi-client 
```


# Пример использования
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
