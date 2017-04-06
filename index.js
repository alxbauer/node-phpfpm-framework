/**
 * phpfpm-framework, call php scripts (index.php for frameworks) by fastcgi
 *  
 * @author Chunlong longbill      longbill.cn@gmail.com
 * @author Alexandre Kalendarev   akalend@mail.ru
 * @author Soldovskij Boris       soldovskij@hotmail.com
 */

var fastcgiConnector = require('fastcgi-client');
module.exports = phpfpm;
var urlencode = require('urlencode-for-php');


/**
 * phpfpm
 * @param  options
 *
 * default options will be  { host:127.0.0.1, port:9000 }
 */
function phpfpm(options)
{
	options = options || {};
	!options.host && (options.host = '127.0.0.1');
	!options.port && (options.port = 9000);
	!options.documentRoot && (options.documentRoot = '');

	this.options = options;
	var self = this;
	options.skipCheckServer = true;
	this.client = fastcgiConnector(options);
	this.ready = false;
	this.client.on('ready', function()
	{
		self.ready = true;
		self._clearQueue();
	});
	this.queue = [];

	this.PARAMS = 
		{
			QUERY_STRING: '',
			REQUEST_METHOD: '',
			CONTENT_TYPE: '',
			CONTENT_LENGTH: '',
			SCRIPT_FILENAME: '',
			SCRIPT_NAME: '',
			REQUEST_URI: '',
			DOCUMENT_URI: '',
			DOCUMENT_ROOT: '',
			SERVER_PROTOCOL: 'HTTP/1.1',
			GATEWAY_INTERFACE: 'CGI/1.1',
			REMOTE_ADDR: '127.0.0.1',
			REMOTE_PORT: 1234,
			SERVER_ADDR: '127.0.0.1',
			SERVER_PORT: 80,
			SERVER_NAME: '127.0.0.1',
			SERVER_SOFTWARE: 'node-phpfpm',
			REDIRECT_STATUS: 200
		};
}

/**
 * clear the queued tasks after connected to phpfpm
 */
phpfpm.prototype._clearQueue = function()
{
	var evt;
	while(evt = this.queue.shift())
	{
		this.run(evt.info, evt.cb);
	}
};


phpfpm.prototype.setParam = function(paramName, value)
{	
	this.PARAMS[paramName] = value;
}

/**
 * send command to phpfpm to run a php script
 */
phpfpm.prototype.run = function(info, cb)
{
	
	if (typeof info == 'string') info = { method: 'GET', uri: info };
	if (info.url && !info.uri) info.uri = info.url;

	if (!this.ready)
	{
		this.queue.push({info: info, cb:cb});
		return;
	}


	if (info.body && !info.method) info.method = 'POST';

	//support json data
	if (info.json)
	{
		info.body = JSON.stringify(info.json);
		!info.method && (info.method = 'POST');
		info.contentType = 'application/json';
	}

	!info.method && (info.method = 'GET');
	info.method = info.method.toUpperCase();

	var uri_ini = info.uri;

	var phpfile = info.uri;
	if (!phpfile.match(/^\//)) phpfile = this.options.documentRoot + phpfile;

	this.setParam('QUERY_STRING', info.queryString.split('?').pop());
	this.setParam('REQUEST_METHOD', info.method);
	this.setParam('CONTENT_TYPE', info.contentType || '');
	this.setParam('CONTENT_LENGTH', info.contentLength || '');
	this.setParam('SCRIPT_FILENAME', phpfile);
	this.setParam('SCRIPT_NAME', phpfile.split('/').pop());
	this.setParam('REQUEST_URI', info.queryString);
	this.setParam('DOCUMENT_URI', phpfile);
	this.setParam('DOCUMENT_ROOT', this.options.documentRoot);

	if (info.referer) {
		this.PARAMS.HTTP_REFERER = info.referer;
	}

	if (info.remote_addr) {
		this.PARAMS.REMOTE_ADDR = info.remote_addr;
	}

	if (info.hostname) {
		this.PARAMS.SERVER_NAME = info.hostname;
	}


	if (info.debug) {
        console.log('===[ New Request ]===============================================');
		console.log(this.PARAMS);
	}


	var self = this;

	self.client.request(this.PARAMS, function(err, request)
	{
		if (err)
		{
			cb(99, err.toString(), err.toString());
			return;
		}

		var output = '', errors = '';
		request.stdout.on('data', function(data)
		{
			output += data.toString('utf8');
		});

		request.stderr.on('data', function(data)
		{
			errors += data.toString('utf8');
		});
		
		request.stdout.on('end', function()
		{
			// Split header and body
            var parts = output.split(/\r?\n\r?\n/, 2);
            var header = parts.shift().trim();
            var body = parts.length > 0 ? parts.shift().trim() : '';

            if (info.debug) {
                console.log('---[ Header from php-fpm response ]------------------');
				console.log(header);
                console.log('---[ Body from php-fpm response ]--------------------');
				console.log(body);
				console.log('-----------------------------------------------------');
			}

			cb(false, header, body, errors);
		});

		if (info.contentLength > 0)
		{
            console.log('---[ Sent content to php-fpm]------------------------');
            console.log(info.body);

			request.stdin.write(info.body, 'utf8');
		}

		request.stdin.end();
	});
};
