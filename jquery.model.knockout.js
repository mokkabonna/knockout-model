(function() {

	var ajax = function(ajaxOb, data, success, error, type, dataType) {


			// if we get a string, handle it
			if (typeof ajaxOb == "string") {
				// if there's a space, it's probably the type
				var sp = ajaxOb.indexOf(" ")
				if (sp > -1) {
					ajaxOb = {
						url: ajaxOb.substr(sp + 1),
						type: ajaxOb.substr(0, sp)
					}
				} else {
					ajaxOb = {
						url: ajaxOb
					}
				}
			}

			// if we are a non-array object, copy to a new attrs
			ajaxOb.data = typeof data == "object" && !$.isArray(data) ? $.extend(ajaxOb.data || {}, data) : data;


			// get the url with any templated values filled out
			ajaxOb.url = $.String.sub(ajaxOb.url, ajaxOb.data, true);

			return $.ajax($.extend({
				type: type || "post",
				dataType: dataType || "json",
				success: success,
				error: error
			}, ajaxOb));
		},
		Inflector = {
			Inflections: {
				plural: [
					[/(quiz)$/i, "$1zes"],
					[/^(ox)$/i, "$1en"],
					[/([m|l])ouse$/i, "$1ice"],
					[/(matr|vert|ind)ix|ex$/i, "$1ices"],
					[/(x|ch|ss|sh)$/i, "$1es"],
					[/([^aeiouy]|qu)y$/i, "$1ies"],
					[/(hive)$/i, "$1s"],
					[/(?:([^f])fe|([lr])f)$/i, "$1$2ves"],
					[/sis$/i, "ses"],
					[/([ti])um$/i, "$1a"],
					[/(buffal|tomat)o$/i, "$1oes"],
					[/(bu)s$/i, "$1ses"],
					[/(alias|status)$/i, "$1es"],
					[/(octop|vir)us$/i, "$1i"],
					[/(ax|test)is$/i, "$1es"],
					[/s$/i, "s"],
					[/$/, "s"]
				],
				singular: [
					[/(quiz)zes$/i, "$1"],
					[/(matr)ices$/i, "$1ix"],
					[/(vert|ind)ices$/i, "$1ex"],
					[/^(ox)en/i, "$1"],
					[/(alias|status)es$/i, "$1"],
					[/(octop|vir)i$/i, "$1us"],
					[/(cris|ax|test)es$/i, "$1is"],
					[/(shoe)s$/i, "$1"],
					[/(o)es$/i, "$1"],
					[/(bus)es$/i, "$1"],
					[/([m|l])ice$/i, "$1ouse"],
					[/(x|ch|ss|sh)es$/i, "$1"],
					[/(m)ovies$/i, "$1ovie"],
					[/(s)eries$/i, "$1eries"],
					[/([^aeiouy]|qu)ies$/i, "$1y"],
					[/([lr])ves$/i, "$1f"],
					[/(tive)s$/i, "$1"],
					[/(hive)s$/i, "$1"],
					[/([^f])ves$/i, "$1fe"],
					[/(^analy)ses$/i, "$1sis"],
					[/((a)naly|(b)a|(d)iagno|(p)arenthe|(p)rogno|(s)ynop|(t)he)ses$/i, "$1$2sis"],
					[/([ti])a$/i, "$1um"],
					[/(n)ews$/i, "$1ews"],
					[/s$/i, ""]
				],
				irregular: [
					['move', 'moves'],
					['sex', 'sexes'],
					['child', 'children'],
					['man', 'men'],
					['person', 'people']
				],
				uncountable: ["sheep", "fish", "series", "species", "money", "rice", "information", "equipment"]
			},
			ordinalize: function(number) {
				if (11 <= parseInt(number) % 100 && parseInt(number) % 100 <= 13) {
					return number + "th";
				} else {
					switch (parseInt(number) % 10) {
					case 1:
						return number + "st";
					case 2:
						return number + "nd";
					case 3:
						return number + "rd";
					default:
						return number + "th";
					}
				}
			},
			pluralize: function(word) {
				for (var i = 0; i < Inflector.Inflections.uncountable.length; i++) {
					var uncountable = Inflector.Inflections.uncountable[i];

					if (word.toLowerCase() == uncountable) {

						return uncountable;
					}
				}
				for (var i = 0; i < Inflector.Inflections.irregular.length; i++) {
					var singular = Inflector.Inflections.irregular[i][0];
					var plural = Inflector.Inflections.irregular[i][1];
					if ((word.toLowerCase() == singular) || (word == plural)) {
						return plural;
					}
				}
				for (var i = 0; i < Inflector.Inflections.plural.length; i++) {
					var regex = Inflector.Inflections.plural[i][0];
					var replace_string = Inflector.Inflections.plural[i][1];
					if (regex.test(word)) {
						return word.replace(regex, replace_string);
					}
				}
			}
		},
		ordinalize = function(number) {
			return Inflector.ordinalize(number);
		},
		pluralize = function(word) {
			return Inflector.pluralize(word);
		},
		ajaxMethods =
		/** 
		 * @Static
		 */
		{
			create: function(str) {
				return function(attrs, success, error) {
					return ajax(str || this._apiPrefix + pluralize(this._shortName), attrs, success, error, 'post', 'json ' + this._shortName + '.model');
				};
			},
			update: function(str) {
				return function(attrs, success, error){
					return ajax(str || this._apiPrefix + pluralize(this._shortName) + "/{" + self.id + "}", attrs, success, error, "put", 'json '+ this._shortName + '.model')
				}
			},
			destroy: function(str) {
				return function(attrs, success, error) {
					return ajax(str || this._apiPrefix + pluralize(this._shortName) + "/{" + this.id + "}", attrs, success, error, "delete")
				}
			},
			findAll: function(str) {
				return function(params, success, error) {
					return ajax(str || this._apiPrefix + pluralize(this._shortName), params, success, error, "get", "json " + this._shortName + ".models");
				};
			},
			findOne: function(str) {
				return function(params, success, error) {
					return ajax(str || this._apiPrefix + pluralize(this._shortName) + "/{" + this.id + "}", params, success, error,  "get", "json " + this._shortName + ".model");
				};
			}
		};


	jQuery.Class("jQuery.KnockoutModel", {
		setup: function() {

			var self = this,
				fullName = this.fullName;

			this._fullName = $.String.underscore(fullName.replace(/\./g, "_"));
			this._shortName = this.shortName.toLowerCase();
			this._apiPrefix = (this.urlPrefix || '/api') + '/';

			if (fullName.indexOf("jQuery") == 0) {
				return;
			}

			$.each(ajaxMethods, function(name, method) {
				var prop = self[name];
				if (typeof prop !== 'function') {
					self[name] = method(prop);
				}
			});

			//add ajax converters
			var converters = {},
				convertName = "* " + this._shortName + ".model";

			converters[convertName + "s"] = this.proxy('models');
			converters[convertName] = this.proxy('model');

			$.ajaxSetup({
				converters: converters
			});

		},
		
		models: function(data) {
			var models = [],
				self = this;
			$.each(data, function(i, model) {
				models.push(self.model(model));
			});
			return models;
		},
		model: function(data) {
			return this.mapping ? new this(data) : new this(data);
		},
		map : function(data) {
			return this.mapping ? ko.mapping.fromJS(data, this.mapping) : ko.mapping.fromJS(data);	
		},
		updateProperties: function(attributes) {
			var self = this;
			
			$.each(attributes, function(prop, value) {
				self.Class.attributes[prop] = 'string';
				//If we are updating the observable with another observable
				if (typeof self[prop] === 'function' && typeof value === 'function') {
					self[prop](ko.utils.unwrapObservable(value));
				}
				//If the new value is not an observable
				// else if(typeof self[prop] === 'function' && typeof value !== 'function'){
				// 	self[prop](value);
				// }
				//If we are adding a new observable or updating a simple property that is not observable
				else if (self[prop] === undefined) {
					self[prop] = value;
				}
			});
		},
		listenToModified: function() {
			var self = this;
			$.each(self.savedState, function(property, initialValue) {
				if (typeof self[property] === 'function') {
					//Setup a subscription to all the observables, set modified
					self[property].subscribe(function(newValue) {
						var originalValue = self.savedState[property];
						if (originalValue !== undefined) self.isModified(newValue !== originalValue);
					});
				}
			});
		},
		attributes: {},
		mapping: {
			'ignore': ['constructor']
		},
		bind : function(property) {
		
		},
		id: 'Id'
	}, {
		setup: function(attributes) {
			var self = this;
			var mappedProperties = this.Class.map(attributes);
			this.Class.updateProperties.call(this, mappedProperties);
			this.savedState = this.toJS();
			this.isModified = ko.observable(false);			
			this.Class.listenToModified.call(this);
		},
		init: function() {

		},
		getId : function() {
			return ko.utils.unwrapObservable(this[this.Class.id]);
		},
		isNew: function() {
			var id = this.getId(this);
			return (id === undefined || id === null || id === ''); //if null or undefined
		},
		toJS: function() {
			return ko.mapping.toJS(this);
		},
		save: function() {
			var self = this;
			var method = this.isNew() ? 'create' : 'update';
			return this.Class[method](this.toJS(), function(data) {
				self.Class.updateProperties.call(self, data.toJS());
				self.isModified(false); //reset modified status after save
			});
		},
		destroy : function() {
			return this.Class.destroy(this.toJS())
		}

	});


})(jQuery);
