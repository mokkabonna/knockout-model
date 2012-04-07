Knockout Model
==============

**Contributions are very welcome!**

A model for [knockout](https://github.com/SteveSanderson/knockout)

Inspired by and partially based on [JavaScriptMVC's Model](http://javascriptmvc.com/docs.html#!jQuery.Model)

Also uses the jQuery.Class from that project. 

Dependencies:

- jQuery
- jQuery Class
- Knockout
- Knockout mapping


Built with ASP.NET Web API in mind, so it assumes some conventions:

- by default all url start with /api
- urls are made up by the lowercase, pluralized name of the model, Person model => /api/persons
- Built in conversion of ASP.NET JSON date format  \/Date(1224043200000)\/ 
- the id of the model defaults to Id


**All conventions can however be overridden and you can use it with any server side framework**



Usage
-----

	$.KnockoutModel('Person', {}, {});

This assumes a full REST way of accessing that model on the server:

	GET /api/persons //Lists all persons
	GET /api/persons/1 //Get person with id 1
	POST /api/persons //Create a new person
	PUT /api/persons/1 //Update person with id 1
	DELETE /api/persons/1 //Delete person with id 1


**Create new model**

	var person =  new Person({ Name:'John', Age: 15 });

**Save**

	person.save().done(function(){
		//person is now updated/created on the server
	});

**Destroy**

	person.destroy().done(function(){
		//person is now deleted on the server
	});

**Mapping**

By default all properties are observable and part of the main object. However you can define specific mapping options that follow standard knockout mapping standards. 

The following example don't make observables of the Id, Created and Updated properties.

	$.KnockoutModel('Person', {
	    mapping : {
	        'copy' : ['Id', 'Created', 'Updated']
	    }
	}, {});

If the server returns a separate model from the server can also combine models like so:

	$.KnockoutModel('Address', {
		mapping : {
			'copy' : ['Id'] 
		}
	}, {});

	$.KnockoutModel('Person', {
		mapping: {
			'Address': {
				create: function(options) {
					return new Address(options.data)
				}
			}
		}
	}, {});	

This will make the Address property of Person a separate class, with it's own methods like save, destroy etc. Also on Address, we choose to not make observable of the property Id;

