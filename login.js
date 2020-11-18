var router = require('express').Router();

router.get('/:service', async function(req,res){
	res.render(req.params.service+'/login',{
		service: req.params.service
	});
});

module.exports = router;
