module("Link", {
	setup: function() {
		$.KnockoutModel('Link', {}, {});
		Link._apiPrefix = 'http://mokkabonna.dyndns.org:5555/api/';
	},
	teardown: function() {
		delete Link;
	}
});

test('Static created', function() {
	notEqual(Link, undefined)
});

asyncTest('Find operations', function() {
	var id;
	Link.findAll().done(function(data) {
		ok($.isArray(data));
		id = data[0].Id;
		equal(typeof id, 'function');
		start();
		Link.findOne({
			Id: id()
		}).done(function(data) {
			equal(typeof data.Id,'function')
			start();
		});
	});
});

test('Create model', function() {
	link = new Link({
		Text: 'some text'
	});

	notEqual(link, undefined)
	equal(typeof link.Text, 'function');
	equal(link.Text(),'some text');
	equal(link.isNew(),true, 'isNew');
	equal(link.isModified(), false, 'is default not modified');

	//Change something
	link.Text('Home');
	equal(link.isModified(), true, 'is modified after a change has been done');
});


asyncTest('Create new and save and update', function() {
	
	var lnk = new Link({Text :'Home'});
	lnk.Text('ny tekst');
	equal(lnk.isModified(), true);
	equal(lnk.Id, undefined);
	lnk.save().done(function(data) {
		notEqual(lnk.Id, undefined, 'the existing link has been updated with returned values from the server,');
		equal(lnk.isModified(), false,'isModified is set to false');
		ok(data.Id !== null && data.Id !== undefined);
		equal(typeof data.Id, 'function', 'Returned value is observable');
		start();
		stop();

		lnk.Text('changed text');
		equal(lnk.isModified(), true);
		lnk.save().done(function(data) {
			equal(lnk.isModified(), false,'isModified is set to false');
			equal(lnk.Text(), 'changed text', 'beware of server changes here, if not equal check that server does not return modified data');
			equal(typeof data.Id, 'function', 'Returned value is observable');
			start();
		});

	});
});


asyncTest('Delete link', function() {
	var lnk;
	Link.findAll().done(function(data) {
		lnk = data.pop();
		start();
		stop();
		lnk.destroy().done(function() {
			expect(0);	
			start();
		});
	});

});
