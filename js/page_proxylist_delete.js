'use strict';

$(()=>$('#clearAll').click(e=> {
	e.preventDefault();
	deleteAllProxies().then(()=> window.location = e.target.href);
}));
