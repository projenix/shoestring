// Extensions
(function( undefined ){
	wrap.fn.is = function( sel ){
		var ret = false,
			sel = wrap( sel );
		this.each(function( i ){
			if( wrap.inArray( sel, this ) ){
				ret = true;				
			}
		});
		return ret;
	};
})();