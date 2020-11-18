var app = {
	page_title: null,
	page_link: null,
	back_title: null,
	back_link: null,
	go: function(link, title){
		app.back_title = app.page_title;
		app.back_link = app.page_link;
		app.page_link = link;
		app.page_title = title;
		$('#page-header').text( app.page_title );
		$('#pageBody').hide();
		$.get( app.page_link ,function(data){
			$('#pageBody').html(data).slideDown();
		}).fail(function(qXHR, textStatus, errorThrown){
			$('#pageBody').html(qXHR.responseText).slideDown();
		})
	},
	back: function(){
		app.page_title = app.back_title;
		app.page_link = app.back_link;
		$('#page-header').text( app.page_title );
		$('#pageBody').hide();
		$.get( app.page_link ,function(data){
			$('#pageBody').html(data).slideDown();
		}).fail(function(qXHR, textStatus, errorThrown){
			$('#pageBody').html(qXHR.responseText).slideDown();
		})
	},
	update: function(){
	    $('#ajax-msg').html('');
		var formData = $("#editForm").serializeArray();
		$.ajax({
            type        : 'PUT',
            url         : app.page_link,
            data        : formData,
            dataType    : 'json',
            encode      : true
        }).done(function(data) {
			$('#ajax-msg').html(data.status);
			$("input[name='_id']",'form').val(data._id);
			app.page_link = app.page_link.replace('/new','/'+data._id);
			$('button[name=delete]').prop('disabled',false);
		}).fail(function(jqXHR, textStatus, errorThrown){
			$('#ajax-msg').html(errorThrown);
		});
	},
	delete: function(){
		var answer = confirm("Realy DELETE item ?!");
		if (answer == true) {
			$.ajax({
				type        : 'DELETE',
				url         : app.page_link,
				dataType    : 'json',
				encode      : true
			}).done(function(data) {
				$('#ajax-msg').html(data.status);
				$('button[name=save]').prop('disabled',true);
				$('button[name=delete]').prop('disabled',true);
			}).fail(function(jqXHR, textStatus, errorThrown){
				$('#ajax-msg').html(errorThrown);
			});
		}
	},
	initTable: function(){
		$('button[name=edit]','table.table').on('click', function () {
				app.go(app.page_link+'/'+$(this).data('id'), app.page_title + ' / Edit');
			});
		$('button[name=add]').click(function() {
			app.go(app.page_link+'/new', app.page_title + ' / Add New');
		});
	},
	initForm: function(){
		if( item._id=='new' ){ $('button[name=delete]').prop('disabled',true); }
		for(var el in item){
			$("input[name='"+el+"'][type=text]",'form').val(item[el]);
			$("input[name='"+el+"'][type=hidden]",'form').val(item[el]);
			$("input[name='"+el+"'][type=radio][value='"+item[el]+"']",'form').prop('checked',true).parent().addClass('active');
			if($("input[name='"+el+"']:eq(0)").attr('type')=='checkbox' && Array.isArray(item[el])){
				item[el].map(function(i){
					$("input[name='"+el+"'][type=checkbox][value='"+i+"']",'form').prop('checked',true).parent().addClass('active');
				})
			}
			$("select[name='"+el+"']",'form').val(item[el]);
			$("textarea[name='"+el+"']",'form').val(item[el]);
		}
		$('button[name=back]').click(function(){
			app.back();
		});
		$('button[name=save]').click(function(){
			$("#editForm").submit();
		});
		$('button[name=delete]').click(function(){
			app.delete();
			return false;
		});
		$("#editForm").validate({
		  submitHandler: function() {
			app.update();
			return false;
		  }
		});
	}
}
