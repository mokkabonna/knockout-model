module("Single", {
	setup: function() {
		$.KnockoutModel('Link', {
			//apiPrefix: 'http://mokkabonna.dyndns.org:5555/api',
			attributes: {
				supposedToBeBool: 'boolean',
				shouldBeNumber: 'number',
				shouldbeDate : 'date'
			}
		}, {});
		$.fixture('GET /api/links', function() {
			return [[{
				Id: 1,
				Text: 'some text'
			}, {
				Text: 'yoyo'
			}]];
		});
		$.fixture('GET /api/links/{Id}', function(req) {
			req.data.Text = 'some text';
			return req.data;
		});

		$.fixture('PUT /api/links/{Id}', function(req) {
			return req.data;
		});

		$.fixture('DELETE /api/links/{Id}', function() {
			return null;
		});

		$.fixture('POST /api/links', function() {
			return {
				Id: 2,
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


asyncTest('Find operations', function() {

	var id;
	Link.findAll().done(function(data) {
		ok($.isArray(data), 'data is an array of items');
		id = data[0].Id;
		equal(typeof id, 'function', 'Returned property is an observable(or at least we think so, with it being an function)');
		start();
		stop();
		Link.findOne({
			Id: id()
		}).done(function(data) {
			equal(typeof data.Id, 'function', 'return value is an observable')
			start();
		});
	});
});


asyncTest('Save and update', function() {
	//expect(13);
	var lnk = new Link({
		Text: 'Home'
	});
	lnk.Text('text');
	equal(lnk.isModified(), true);
	equal(lnk.Id, undefined);
	lnk.save().done(function(data) {
		notEqual(lnk.Id, undefined, 'the existing link has been updated with returned values from the server');
		equal(typeof lnk.Id, 'function', 'returned new property should be observable (Id in this case) ');
		equal(lnk.isModified(), false, 'isModified is set to false');

		var origtext = lnk.Text();
		lnk.Text('random new text');
		equal(lnk.isModified(), true, 'isModified is set to true after a change');
		lnk.Text(origtext);
		equal(lnk.isModified(), false, 'after a save savedstate should be reset and therefore isModified should be false');

		ok(data.Id !== null && data.Id !== undefined);
		start();
		stop();

		lnk.Text('changed text');
		equal(lnk.isModified(), true);


		lnk.save().done(function(data) {

			equal(lnk.isModified(), false, 'isModified is set to false');
			equal(lnk.Text(), 'changed text', 'beware of server changes here, if not equal check that server does not return modified data');
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
		shouldBeNumber: '123',
		shouldbeDate : "\/Date(1224043200000)\/"
	});
	equal(link.supposedToBeBool(), false);
	equal(link.shouldBeNumber(), 123);
	equal(link.shouldbeDate().getTime(), new Date(1224043200000).getTime())
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

asyncTest('Instance Event', function() {
	expect(4);
	var link = new Link({
		somenumber: 123,
		Text: 'test'
	});

	link.bind('created', function(event) {
		ok(event.type === 'created');
		notEqual(link.Id, undefined, 'we should have an id')

		start();
		stop();
	});


	link.bind('updated', function(event, data) {
		ok(event.type === 'updated');
		start();
		stop();
	});

	link.bind('destroyed', function(event, data) {
		ok(event.type === 'destroyed');
		start();
	});

	link.save().done(function() {
		link.Text('changed text');
		link.save().done(function() {
			link.destroy();
		});
	});

});



asyncTest('Static Event', function() {
	var link = new Link({
		somenumber: 123,
		Text: 'test'
	});

	Link.bind('created', function(event, data) {
		ok(event.type === 'created');
		start();
		stop();
	});

	Link.bind('updated', function(event, data) {
		ok(event.type === 'updated');
		start();
		stop();
	});

	Link.bind('destroyed', function(event, data) {
		ok(event.type === 'destroyed');
		start();

	});

	link.save().done(function() {
		link.Text('changed text');
		link.save().done(function() {
			link.destroy();
		});
	});

});


//Composite model
module("Composite", {
	setup: function() {
		$.KnockoutModel('Person', {
			mapping: {
				'Address': {
					create: function(options) {
						return new Address(options.data)
					}
				}
			}
		}, {});

		$.KnockoutModel('Address', {}, {});



		$.fixture('GET /api/person', function() {
			return [[{
				Id: 1,
				Name: 'John',
				Address: {
					Zip: 12345
				}
			}, {
				Id: 2,
				Text: 'Peter',
				Address: {
					Zip: 54321
				}
			}]];
		});
		$.fixture('GET /api/person/{Id}', function(req) {
			req.data.Name = 'Ellen';
			return req.data;
		});

		$.fixture('PUT /api/person/{Id}', function(req) {
			return req.data;
		});

		$.fixture('DELETE /api/person/{Id}', function() {
			return null;
		});

		$.fixture('POST /api/person', function(req) {
			return {
				Id: 2,
				Name: req.data.Name,
				Address: req.data.Address
			}
		});

		$.fixture('GET /api/address', function() {
			return [[{				
				Id : 1,
					Zip: 12345
	
			}, {
				Id : 2,
					Zip: 54321
		
			}]];
		});
		$.fixture('GET /api/address/{Id}', function(req) {
			req.data.Zip = '5555';
			return req.data;
		});

		$.fixture('PUT /api/address/{Id}', function(req) {
			return req.data;
		});

		$.fixture('DELETE /api/address/{Id}', function() {
			return null;
		});

		$.fixture('POST /api/address', function(req) {
			return req.data
		});
	},
	teardown: function() {
		delete Person;
		delete Address;
	}
});

test('Static created', function() {
	notEqual(Person, undefined)
	notEqual(Address, undefined)
})

test('Create model', function() {
	var p = new Person({
		Name: 'Ana',
		Address: {
			Zip: 1234
		}
	})

	notEqual(p, undefined)
	equal(p.Address.Zip(), 1234)
	equal(typeof p.Address.isModified, 'function', 'Address is it\'s own class, with ismodified etc')
	equal(p.Address.isModified(), false)
	p.Address.Zip(4444)
	equal(p.Address.isModified(), true)
	
})
