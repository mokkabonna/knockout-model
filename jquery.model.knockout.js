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
		ajaxMethods = {
			create: function(str) {
				return function(attrs, success, error) {
					return ajax(str || this._serviceUrl, attrs, success, error, 'post', 'json ' + this._shortName + '.model');
				};
			},
			update: function(str) {
				return function(attrs, success, error) {
					return ajax(str || this._serviceUrl + "/{" + this.id + "}", attrs, success, error, "put", 'json ' + this._shortName + '.model')
				}
			},
			destroy: function(str) {
				return function(attrs, success, error) {
					return ajax(str || this._serviceUrl + "/{" + this.id + "}", attrs, success, error, "delete")
				}
			},
			findAll: function(str) {
				return function(params, success, error) {
					return ajax(str || this._serviceUrl, params, success, error, "get", "json " + this._shortName + ".models");
				};
			},
			findOne: function(str) {
				return function(params, success, error) {
					return ajax(str || this._serviceUrl + "/{" + this.id + "}", params, success, error, "get", "json " + this._shortName + ".model");
				};
			}
		};

	jQuery.Class("jQuery.KnockoutModel", {
		setup: function() {

			var self = this,
				fullName = this.fullName;

			this._fullName = $.String.underscore(fullName.replace(/\./g, "_"));
			this._shortName = this.shortName.toLowerCase();
			this._apiPrefix = (this.apiPrefix || '/api') + '/'; //default /api/
			this._resourceName = (this.resourceName || this._shortName + 's');
			this._serviceUrl = this._apiPrefix + this._resourceName;

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
		id: 'Id',
		attributes: {},
		defaultMapping: {
			'ignore': ['constructor']
		},
		transform : function(data) {
			var self = this;
			$.each(data, function(property, value) {
				self.attributes[property] = self.attributes[property] || 'string';				
				data[property] = self.transformValue(value, self.attributes[property]);
			});
		},
		transformValue: function(value, type) {
			switch (type) {
			case 'boolean':
				return value === 'true' || value === '1';
				break;
			case 'number':
				return parseInt(value, 10);
				break; 
			case 'date':
			 	throw 'date converstion not implemented yet' ;
			 	break;
			default:
				return value;
			}
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
		map: function(data) {
			this.transform(data);
			this.mapping = $.extend({}, this.defaultMapping, this.mapping);
			return ko.mapping.fromJS(data, this.mapping);
		},
		updateProperties: function(attributes) {
			var self = this;
			$.each(attributes, function(prop, value) {
				//If we are updating the observable with another observable
				if (typeof self[prop] === 'function' && typeof value === 'function') {
					self[prop](ko.utils.unwrapObservable(value));
				}
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
		}
	}, {
		setup: function(attributes) {
			var self = this;
			var mappedProperties = this.Class.map(attributes);
			this.Class.updateProperties.call(this, mappedProperties);
			this.savedState = this.toJS();
			this.isModified = ko.observable(false);
			this.Class.listenToModified.call(this);
		},
		getId: function() {
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
				self.savedState = self.toJS();
				self.isModified(false); //reset modified status after save
			});
		},
		destroy: function() {
			return this.Class.destroy(this.toJS())
		}

	});


})(jQuery);
