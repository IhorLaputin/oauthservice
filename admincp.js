var router = require('express').Router();

function restrict(req, res, next) {
	if (req.session.superuser) { 
		req.session.touch();
		next();
	} else {
		req.session.error = 'Access denied! Authentication failed, please Sign in before!';
		res.status(401).render('error_auth');	
	}
}

router.get('/', restrict, async function(req,res){
	res.render('app',{});
});

router.get('/users', restrict, async function(req,res){
	var data = global.db.getCollection("users").find();
	res.render('users',{
		rows: data
	});
});
router.get('/services', restrict, async function(req,res){
	var data = global.db.getCollection("services").find();
	res.render('services',{
		rows: data
	});
});

router.get('/users/new', restrict, async function(req,res){
	res.render('users_edit',{
		item: JSON.stringify( { _id: 'new'} )
	});
});
router.get('/services/new', restrict, async function(req,res){
	res.render('services_edit',{
		item: JSON.stringify( { _id: 'new'} )
	});
});

router.get('/users/:id', restrict, async function(req,res){
	var item = global.db.getCollection("users").get(req.params.id);
	item._id = item.$loki;
	res.render('users_edit',{
		item: JSON.stringify( item )
	});
});
router.get('/services/:id', restrict, async function(req,res){
	var item = global.db.getCollection("services").get(req.params.id);
	item._id = item.$loki;
	res.render('services_edit',{
		item: JSON.stringify( item )
	});
});

router.put('/users/:id', restrict, async function(req,res){
	delete req.body._id;
	if( req.params.id =='new' ){
		global.db.getCollection("users").insert(req.body);
		res.send({status:'SAVED'});
	}else{
		var item = global.db.getCollection("users").get(req.params.id);
		for(var el in req.body){
			item[el] = req.body[el];
		}
		global.db.getCollection("users").update(item);
		res.send({status:'SAVED',_id:req.params.id});
	}
});
router.put('/services/:id', restrict, async function(req,res){
	delete req.body._id;
	if( req.params.id =='new' ){
		global.db.getCollection("services").insert(req.body);
		res.send({status:'SAVED'});
	}else{
		var item = global.db.getCollection("services").get(req.params.id);
		for(var el in req.body){
			item[el] = req.body[el];
		}
		global.db.getCollection("services").update(item);
		res.send({status:'SAVED',_id:req.params.id});
	}
});

router.get('/login', async function(req,res){
	res.render('login',{});
});

router.post('/login', async function(req,res){
	if( req.body.password && req.body.password===process.env.ADMIN_PASSWORD ){
		req.session.regenerate(function(){
			req.session.superuser = true;
			req.session.success = 'Authenticated as Admin';
			res.end('done');
		});
	}else{
		req.session.error = 'Authentication failed.';
		res.status(400).end('Error: ' + req.session.error);
	}
});

module.exports = router;
