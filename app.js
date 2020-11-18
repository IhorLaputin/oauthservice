const { v4: uuidv4 } = require('uuid');
const createError = require('http-errors');
const path = require('path');
const express = require('express');
const bodyParser = require('body-parser');
const session = require("express-session");
const MemoryStore = require('memorystore')(session);
const serveStatic = require('serve-static');
const jwt = require("jsonwebtoken");
const lokijs = require('lokijs');
const logger = require('morgan');

require('dotenv').config();

const JWT_URL = process.env.JWT_URL;
const JWT_SECRET = process.env.JWT_SECRET;
const app = express();

const db = new lokijs('./app.db',{
	autoload: true,
	autoloadCallback : function(){
		var entries = db.getCollection("users");
		if (entries === null) {
			entries = db.addCollection("users",{autoupdate: true});
			db.saveDatabase();
		}
		var entries = db.getCollection("services");
		if (entries === null) {
			entries = db.addCollection("services",{autoupdate: true});
			db.saveDatabase();
		}
	},
	autosave: true, 
	autosaveInterval: 4000,
	persistenceMethod: null
}); 

app.set('trust proxy', 1);
app.disable('etag');
app.disable('x-powered-by');

global.createError = createError;
global.dir 		= __dirname;
global.db 		= db;

app.set("dir", __dirname);
app.set('port', process.env.HTTP_PORT );
app.set('view cache', process.env.NODE_ENV == 'production');
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
app.use(serveStatic(path.join(__dirname, 'public'),{maxAge: '1d'}))
app.use(logger('dev'));

app.use(session({
	genid: (req) => { return uuidv4() },
	secret: uuidv4(),
	store: new MemoryStore({ checkPeriod: 86400000 }),
	resave: true,
	saveUninitialized: false,
	rolling: true,
	cookie: { 
		maxAge: parseInt(process.env.COOKIE_EXPIRATION)
	}
}));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

const signUserToken = user => jwt.sign(
    {
		email: user.email,
		name: user.name,
		tracsense_access: user.tracsense_access,
		avl_access: user.tracsense_access,
		avl_module: user.avl_module
    }, JWT_SECRET, {
		algorithm: 'HS512',
		expiresIn: 1*60*60 // in sec
	}
);

app.post("/auth", async (req, res, next) => {
	if (!req.body.email || !req.body.password || !req.body.service) {
		return res.status(400).send({error: 'serviceId, username and password are required parameters'});
	}	
	var service = global.db.getCollection("services").findOne({name:req.body.service});
	if(!service) {
		return res.status(404).send({error: 'Service ['+req.body.service+'] does not exist'});
	}
	var user = global.db.getCollection("users").findOne({email:req.body.email});
	if(user && user.password==req.body.password) {
		res.status(200).send({
			token: signUserToken(user),
			callback: service.callback
		});		
	} else {
		return res.status(404).send({error: 'User does not exist'});
	}
});

app.post("/check", async (req, res, next) => {
	if (!req.body.token || !req.body.service) {
		return res.status(400).send({error: 'serviceId and token are required parameters'});
	}	
	var service = global.db.getCollection("services").findOne({name:req.body.service});
	if(!service) {
		return res.status(404).send({error: 'Service ['+req.body.service+'] does not exist'});
	}
	try {
		var decoded = jwt.verify(req.body.token, JWT_SECRET);
		return res.status(200).send(decoded);
	} catch(err) {
		return res.status(400).send(err);
	}
});

app.get('/', async (req, res, next) => {
	return res.status(200).end("Restricted");
});

app.use('/login', require('./login.js') );
app.use('/admincp', require('./admincp.js') );

app.all('*', async function(req, res, next) {
	console.log(0);
	res.set('Access-Control-Allow-Origin', '*');
	res.set('Access-Control-Allow-Credentials', true);
	res.set('Access-Control-Allow-Methods', 'OPTIONS, HEAD, GET, POST, PUT, DELETE');
	res.set('Access-Control-Allow-Headers', 'X-Requested-With, Content-Type, Content-Range, Content-Disposition, Accept, Origin');
	if ('OPTIONS' == req.method) return res.send(200);
	next();
});

app.use(function(req, res, next) {
    next(createError(404));
});

app.use((err, req, res, next) => {
	console.error({
		message: err.message,
		error: err,
		req: req.url,
	});
	const statusCode = err.status || 500;
	let message = err.message || "Internal Server Error";
	if (statusCode === 500) {
		message = "Internal Server Error";
	}
	res.status(statusCode).json({ message });
});

app.listen(process.env.HTTP_PORT, process.env.HTTP_HOST,function(){
	console.log("Started on PORT "+process.env.HTTP_PORT);
});
