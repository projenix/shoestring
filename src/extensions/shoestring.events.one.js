// Extensions

// keep this wrapper around the ones you use!
(function( undefined ){
	shoestring.fn.one = function( evt, callback ){
		var evts = evt.split( " " );
		return this.each(function(){
			var cb;

			for( var i = 0, il = evts.length; i < il; i++ ){
				if( "addEventListener" in this ){
					cb = function( e ){
						callback.call( this, e );
						this.removeEventListener( evt, cb );
					};
					this.addEventListener( evt, cb, false );
				}
				else if( this.attachEvent ){
					cb = function( e ){
						callback.call( this, e );
						this.detachEvent( "on" + evt, cb );
					};
					this.attachEvent( "on" + evt, cb );
				}
			}
		});
	};
}());