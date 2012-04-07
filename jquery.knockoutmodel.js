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
		fn = 'function',
		bind = function(eventType, handler) {
			return $.fn.bind.apply($([this]), arguments);
		},
		unbind = function(eventType, handler) {
			return $.fn.unbind.apply($([this]), arguments);
		},
		trigger = function(obj, event, args) {
			$.event.trigger(event, args, obj, true);
		},
		ajaxMethods = {
			create: function(str) {
				return function(attrs, success, error) {
					return ajax(str || this._serviceUrl, attrs, success, error, 'post');
				};
			},
			update: function(str) {
				return function(attrs, success, error) {
					return ajax(str || this._serviceUrl + "/{" + this.id + "}", attrs, success, error, "put")
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
				if (typeof prop !== fn) {
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
		transform: function(data) {
			var self = this;
			$.each(data, function(property, value) {
				self.attributes[property] = self.attributes[property] || 'string';
				data[property] = self.transformValue(value, self.attributes[property]);
			});
		},
		transformValue: function(value, type) {
			switch (type) {
			case 'boolean':
				if (value === 'true' || value === '1' || value === 1) return true;
				if (value === 'false' || value === '0' || value === 0) return false;
				return value; //If not boolean, return value as is
				break;
			case 'number':
				return parseInt(value, 10);
				break;
			case 'date':
				var valueType = typeof value;
				if(valueType === 'string' && value.match(/\/Date\((-?\d+)\)\//)){
					return new Date(parseInt(value.substr(6)));
				} else if ( valueType === "string" ) {
					return isNaN(Date.parse(value)) ? null : Date.parse(value)
				} else if ( valueType === 'number' ) {
					return new Date(value)
				} else {
					return value
				}
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
			var self = this;
			this.transform(data);
			this.mapping = $.extend({}, this.defaultMapping, this.mapping);
			return ko.mapping.fromJS(data, this.mapping);
		},
		bind: bind,
		unbind: unbind,
		updateProperties: function(attributes) {
			var self = this;
			$.each(attributes, function(prop, value) {
				if (self.Class.attributes[prop] !== undefined || prop !== '__ko_mapping__') { //Only update properties that is part of the data, not methods etc
					if (typeof self[prop] === fn) { //Property is already an observable
						self[prop](ko.utils.unwrapObservable(value));
					} else {
						self[prop] = value;
					}
				}
			});
		},
		listenToModified: function() {
			var self = this;
			$.each(self.savedState, function(property, initialValue) {
				if (typeof self[property] === fn && typeof self[property].subscribe === fn) {
					//Setup a subscription to all the observables, set modified
					self[property].subscribe(function(newValue) {
						var originalValue = self.savedState[property];
						if (originalValue !== undefined) {
							if (newValue != originalValue) {
								self.modifiedProperties.push(property);
							} else {
								self.modifiedProperties.remove(property);
							}
						}
					});
				}
			});
		}
	}, {
		setup: function(attributes) {
			var self = this;

			var mappedProperties = this.Class.map(attributes);

			this.Class.updateProperties.call(this, mappedProperties);
			this.isModified = ko.observable(false);
			this.modifiedProperties = ko.observableArray([]);

			this.modifiedProperties.subscribe(function(arr) {
				self.isModified(arr.length > 0);
			});

			this.savedState = this.toJS();
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
			var plain = {},
				self = this;
			$.each(this.Class.attributes, function(prop, type) {
				plain[prop] = ko.utils.unwrapObservable(self[prop]);
			});
			return plain;
		},
		save: function() {
			var self = this;
			var method = this.isNew() ? 'create' : 'update';
			return this.Class[method](this.toJS(), function(data) {
				var mappedProperties = self.Class.map(data);
				self.Class.updateProperties.call(self, mappedProperties);
				self.savedState = self.toJS();
				self.isModified(false); //reset modified status after save
				self[method + 'd'](); //trigger updated/created event
			});
		},
		destroy: function() {
			var self = this;
			return this.Class.destroy(this.toJS(), function() {
				self.destroyed();
			})
		},
		bind: bind,
		unbind: unbind
	});


	$.each(["created", "updated", "destroyed"], function(i, funcName) {
		$.KnockoutModel.prototype[funcName] = function() {
			var stub, constructor = this.constructor;
			trigger(this, funcName);
			trigger(constructor, funcName, this);
		};
	});


})(jQuery);