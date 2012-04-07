Knockout Model
==============

A model for [knockout](https://github.com/SteveSanderson/knockout)

Inspired by and partially based on [JavaScriptMVC's Model](http://javascriptmvc.com/docs.html#!jQuery.Model)

Also uses the jQuery.Class from that project. 

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

	var person =  new Person({ Name:'John', Age: 15 })

**Save**

	person.save().done(function(){

	});



