module("Model", {
	setup: function() {
		$.KnockoutModel('Link', {
			apiPrefix: 'http://mokkabonna.dyndns.org:5555/api',
			attributes: {
				supposedToBeBool: 'boolean',
				shouldBeNumber: 'number'
			}
		}, {});
		$.fixture('/api/links', function() {
			return [[{
				Id: 1,
				Text: 'some text'
			}, {
				Text: 'yoyo'
			}]];
		});
		$.fixture('/api/links/{id}', function() {
			return {
				Id: 1,
				Text: 'some text'
			}
		});
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
			equal(typeof data.Id, 'function')
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
	equal(link.Text(), 'some text');
	equal(link.isNew(), true, 'isNew');
	equal(link.isModified(), false, 'is default not modified');

	//Change something
	link.Text('Home');
	equal(link.isModified(), true, 'is modified after a change has been done');
});


asyncTest('Save and update', function() {

	var lnk = new Link({
		Text: 'Home'
	});
	lnk.Text('text');
	equal(lnk.isModified(), true);
	equal(lnk.Id, undefined);
	lnk.save().done(function(data) {
		notEqual(lnk.Id, undefined, 'the existing link has been updated with returned values from the server');
		equal(lnk.isModified(), false, 'isModified is set to false');

		var origtext = lnk.Text();
		lnk.Text('random new text');
		equal(lnk.isModified(), true, 'isModified is set to true');
		lnk.Text(origtext);
		equal(lnk.isModified(), false, 'after a save savedstate should be reset and therefore isModified should be false');

		ok(data.Id !== null && data.Id !== undefined);
		equal(typeof data.Id, 'function', 'Returned value is observable');
		start();
		stop();

		lnk.Text('changed text');
		equal(lnk.isModified(), true);
		lnk.save().done(function(data) {
			equal(lnk.isModified(), false, 'isModified is set to false');
			equal(lnk.Text(), 'changed text', 'beware of server changes here, if not equal check that server does not return modified data');
			equal(typeof data.Id, 'function', 'Returned value is observable');
			start();
		});

	});
});


asyncTest('Destroy', function() {
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

test('Transformation', function() {
	var link = new Link({
		supposedToBeBool: 'false',
		shouldBeNumber: '123'
	});
	equal(link.supposedToBeBool(), false);
	equal(link.shouldBeNumber(), 123);
});


test('isModified should consider different data types', function() {
	var link = new Link({
		somenumber: 123,
		boolish: '0'
	});

	link.somenumber('123'); //Updated from for instance text input
	equal(link.isModified(), false, '"123" should be considered the same as 123');

	link.boolish(false);
	equal(link.isModified(), false, '"0" should be considered the same as false');

});


test('Test modified is not reset when 2 or more properties have changed', function() {
	var link = new Link({
		somenumber: 123,
		another: 'test'
	});

	link.somenumber(324);
	equal(link.isModified(), true, 'should be modified after one property changes');

	link.another('another value');
	equal(link.isModified(), true, 'should still be modified');

	link.somenumber(123);
	equal(link.isModified(), true, 'should still be modified after one property changes back, since the other property is still changed');

	link.another('test');
	equal(link.isModified(), false, 'Now it should be not modified again');
});

asyncTest('Events', function() {
	var link = new Link({
		somenumber: 123,
		another: 'test'
	});

	Link.bind('updated', function(data, event) {
		ok(event === 'updated');
		start();
	});

	link.save();
});
