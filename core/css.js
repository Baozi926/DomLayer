define([], function () {

		var loadCss = function (url) {
				var link = document.createElement("link");
				link.type = "text/css";
				link.rel = "stylesheet";
				link.href = url;
				document
						.body
						.appendChild(link);
		}

		return {
				// summary: 		This module implements the dojo/text! plugin and the dojo.cache
				// API. description: 		We choose to include our own plugin to leverage
				// functionality already contained in dojo 		and thereby reduce the size of the
				// plugin compared to various foreign loader implementations. 		Also, this
				// allows foreign AMD loaders to be used without their plugins.
				//
				// 		CAUTION: this module is designed to optionally function synchronously to
				// support the dojo v1.x synchronous 		loader. This feature is outside the scope
				// of the CommonJS plugins specification. the dojo/text caches it's own
				// resources because of dojo.cache
				dynamic: true,

				normalize: function (id, toAbsMid) {
						// id is something like (path may be relative):
						//
						//	 "path/to/text.html" 	 "path/to/text.html!strip"
						var parts = id.split("!"),
								url = parts[0];
						return (/^\./.test(url)
								? toAbsMid(url)
								: url) + (parts[1]
								? "!" + parts[1]
								: "");
				},

				load: function (id, require, load) {
					try{
						loadCss(id)
					}catch(e){
							console.log(e);
					}
					load(id);
				}
		};
})