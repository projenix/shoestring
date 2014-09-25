//>>excludeStart("exclude", pragmas.exclude);
define([ "shoestring", "dom/closest" ], function(){
//>>excludeEnd("exclude");

	function addToEventCache( el, evt, eventInfo ) {
		if ( !el.shoestringData ) {
			el.shoestringData = {};
		}
		if ( !el.shoestringData.events ) {
			el.shoestringData.events = {};
		}
		if ( !el.shoestringData.events[ evt ] ) {
			el.shoestringData.events[ evt ] = [];
		}
		var obj = {};
		if( eventInfo.customCallfunc ) {
			obj.isCustomEvent = true;
		}
		obj.callback = eventInfo.customCallfunc || eventInfo.callfunc;
		obj.originalCallback = eventInfo.originalCallback;
		obj.namespace = eventInfo.namespace;

		el.shoestringData.events[ evt ].push( obj );
	}

	// In IE8 the events trigger in a reverse order (LIFO). This code
	// unbinds and rebinds all callbacks on an element in the a FIFO order.

	// This is not optimized and probably has a lot of improvement opportunity
	function reorderEvents( node, eventName ) {
		if( node.addEventListener ) {
			// add event listner obviates the need for all the callback order juggling
			return;
		} else {
			var parents = shoestring( node ).parents();
			for( var j = parents.length - 1; j >= 0; j-- ) {
			// for( var j = 0, k = parents.length; j < k; j++ ) {
				reorderEventsForElement( parents[ j ], eventName );
			}
			reorderEventsForElement( node, eventName );
		}
	}

	function reorderEventsForElement( node, eventName ) {
		if( !node.shoestringData || !node.shoestringData.events ) {
			return;
		}

		var docEl = document.documentElement,
			otherEvents = node.shoestringData.events[ eventName ] || [];

		for( var j = otherEvents.length - 1; j >= 0; j-- ) {
			if( otherEvents[ j ].isCustomEvent ) {
				docEl.detachEvent( "onpropertychange", otherEvents[ j ].callback );
				docEl.attachEvent( "onpropertychange", otherEvents[ j ].callback );
			} else {
				node.detachEvent( "on" + eventName, otherEvents[ j ].callback );
				node.attachEvent( "on" + eventName, otherEvents[ j ].callback );
			}
		}
	}

	shoestring.fn.bind = function( evt, data, originalCallback ){

		//>>includeStart("development", pragmas.development);
		if( arguments.length > 3 ){
			shoestring.error( 'on-delegate' );
		}
		if( typeof data === "string" ){
			shoestring.error( 'on-delegate' );
		}
		//>>includeEnd("development");
		if( typeof data === "function" ){
			originalCallback = data;
			data = null;
		}

		var evts = evt.split( " " ),
			docEl = document.documentElement;

		// NOTE the `triggeredElement` is purely for custom events from IE
		function encasedCallback( e, namespace, triggeredElement ){
			var result;

			if( e._namespace && e._namespace !== namespace ) {
				return;
			}

			e.data = data;
			e.namespace = e._namespace;

			var returnTrue = function(){
				return true;
			};

			e.isDefaultPrevented = function(){
				return false;
			};

			var originalPreventDefault = e.preventDefault;
			var preventDefaultConstructor = function(){
				if( originalPreventDefault ) {
					return function(){
						e.isDefaultPrevented = returnTrue;
						originalPreventDefault.call(e);
					};
				} else {
					return function(){
						e.isDefaultPrevented = returnTrue;
						e.returnValue = false;
					};
				}
			};

			// thanks https://github.com/jonathantneal/EventListener
			e.target = triggeredElement || e.target || e.srcElement;
			e.preventDefault = preventDefaultConstructor();
			e.stopPropagation = e.stopPropagation || function () {
				e.cancelBubble = true;
			};

			result = originalCallback.apply(this, [ e ].concat( e._args ) );

			if( result === false ){
				e.preventDefault();
				e.stopPropagation();
			}

			return result;
		}

		// This is exclusively for custom events on browsers without addEventListener (IE8)
		function propChange( originalEvent, boundElement, namespace ) {
			var lastEventInfo = document.documentElement[ originalEvent.propertyName ],
				triggeredElement = lastEventInfo.el;

			var boundCheckElement = boundElement;

			if( boundElement === document && triggeredElement !== document ) {
				boundCheckElement = document.documentElement;
			}

			if( triggeredElement !== undefined &&
				shoestring( triggeredElement ).closest( boundCheckElement ).length ) {

				originalEvent._namespace = lastEventInfo._namespace;
				originalEvent._args = lastEventInfo._args;
				encasedCallback.call( boundElement, originalEvent, namespace, triggeredElement );
			}
		}

		return this.each(function(){
			var domEventCallback, customEventCallback, oEl = this;

			for( var i = 0, il = evts.length; i < il; i++ ){
				var split = evts[ i ].split( "." ),
					evt = split[ 0 ],
					namespace = split.length > 0 ? split[ 1 ] : null;

				domEventCallback = function( originalEvent ) {
					if( oEl.ssEventTrigger ) {
						originalEvent._namespace = oEl.ssEventTrigger._namespace;
						originalEvent._args = oEl.ssEventTrigger._args;

						oEl.ssEventTrigger = null;
					}
					return encasedCallback.call( oEl, originalEvent, namespace );
				};
				customEventCallback = null;

				if( "addEventListener" in this ){
					this.addEventListener( evt, domEventCallback, false );
				} else if( this.attachEvent ){
					if( this[ "on" + evt ] !== undefined ) {
						this.attachEvent( "on" + evt, domEventCallback );
					} else {
						customEventCallback = (function() {
							var eventName = evt;
							return function( e ) {
								if( e.propertyName === eventName ) {
									propChange( e, oEl, namespace );
								}
							};
						})();
						docEl.attachEvent( "onpropertychange", customEventCallback );
					}
				}

				addToEventCache( this, evt, {
					callfunc: domEventCallback || encasedCallback,
					customCallfunc: customEventCallback,
					originalCallback: originalCallback,
					namespace: namespace
				});

				reorderEvents( oEl, evt );
			}
		});
	};

	shoestring.fn.on = shoestring.fn.bind;

	//>>includeStart("development", pragmas.development);
	shoestring.fn.live = function(){
		shoestring.error( 'live-delegate' );
	};

	shoestring.fn.delegate = function(){
		shoestring.error( 'live-delegate' );
	};
	//>>includeEnd("development");

//>>excludeStart("exclude", pragmas.exclude);
});
//>>excludeEnd("exclude");
