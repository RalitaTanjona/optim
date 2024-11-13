/*!
 * jQuery Cookie Plugin v1.4.1
 * https://github.com/carhartl/jquery-cookie
 *
 * Copyright 2006, 2014 Klaus Hartl
 * Released under the MIT license
 */
(function (factory) {
	if (typeof define === 'function' && define.amd) {
		// AMD (Register as an anonymous module)
		define(['jquery'], factory);
	} else if (typeof exports === 'object') {
		// Node/CommonJS
		module.exports = factory(require('jquery'));
	} else {
		// Browser globals
		factory(jQuery);
	}
}(function ($) {

	var pluses = /\+/g;

	function encode(s) {
		return config.raw ? s : encodeURIComponent(s);
	}

	function decode(s) {
		return config.raw ? s : decodeURIComponent(s);
	}

	function stringifyCookieValue(value) {
		return encode(config.json ? JSON.stringify(value) : String(value));
	}

	function parseCookieValue(s) {
		if (s.indexOf('"') === 0) {
			// This is a quoted cookie as according to RFC2068, unescape...
			s = s.slice(1, -1).replace(/\\"/g, '"').replace(/\\\\/g, '\\');
		}

		try {
			// Replace server-side written pluses with spaces.
			// If we can't decode the cookie, ignore it, it's unusable.
			// If we can't parse the cookie, ignore it, it's unusable.
			s = decodeURIComponent(s.replace(pluses, ' '));
			return config.json ? JSON.parse(s) : s;
		} catch(e) {}
	}

	function read(s, converter) {
		var value = config.raw ? s : parseCookieValue(s);
		return $.isFunction(converter) ? converter(value) : value;
	}

	var config = $.cookie = function (key, value, options) {

		// Write

		if (arguments.length > 1 && !$.isFunction(value)) {
			options = $.extend({}, config.defaults, options);

			if (typeof options.expires === 'number') {
				var days = options.expires, t = options.expires = new Date();
				t.setMilliseconds(t.getMilliseconds() + days * 864e+5);
			}

			return (document.cookie = [
				encode(key), '=', stringifyCookieValue(value),
				options.expires ? '; expires=' + options.expires.toUTCString() : '', // use expires attribute, max-age is not supported by IE
				options.path    ? '; path=' + options.path : '',
				options.domain  ? '; domain=' + options.domain : '',
				options.secure  ? '; secure' : ''
			].join(''));
		}

		// Read

		var result = key ? undefined : {},
			// To prevent the for loop in the first place assign an empty array
			// in case there are no cookies at all. Also prevents odd result when
			// calling $.cookie().
			cookies = document.cookie ? document.cookie.split('; ') : [],
			i = 0,
			l = cookies.length;

		for (; i < l; i++) {
			var parts = cookies[i].split('='),
				name = decode(parts.shift()),
				cookie = parts.join('=');

			if (key === name) {
				// If second argument (value) is a function it's a converter...
				result = read(cookie, value);
				break;
			}

			// Prevent storing a cookie that we couldn't decode.
			if (!key && (cookie = read(cookie)) !== undefined) {
				result[name] = cookie;
			}
		}

		return result;
	};

	config.defaults = {};

	$.removeCookie = function (key, options) {
		// Must not alter options, thus extending a fresh object...
		$.cookie(key, '', $.extend({}, options, { expires: -1 }));
		return !$.cookie(key);
	};

}));
/*=======================================FIN COOKIES=============================================*/

$(document).ready(function() {

	var http_host = 'https://' + window.location.hostname;
	if(http_host == "https://conseils.hellopro.fr")
	{
		http_host = "https://www.hellopro.fr"
	}
	var loadingcart = new Image(); 
	loadingcart.src = http_host + "/mhp/assets/images/loader.gif";

	$.cookie.json = false;
	
	$('body').on('click', '.ajouter_au_panier', function(event) {
		event.preventDefault();

		var element = $(this);
		var html_element = element.html();
		var product = rechercher_produit_gtm(element);

		var id_vendeur = $(this).data('vendeurmhp');
		var id_produit = $(this).data('prodmhp');
		var quantite = $(this).data('qtemhp');

		if(quantite > 0 ) 
		{
			$(this).attr('disabled','true');
			$(this).html('<span class="ico-mhp-loader-btn"></span><i> Ajout en cours... </i>');

			var data = {
				'action' : 1,
				'id_vendeur' : id_vendeur,
				'id_produit' : id_produit,
				'quantite' : quantite
			}

			$.ajax({
				url: http_host + '/mhp/ajax/cart/mhp_traitement_panier_ajax_v2.php',
				type: 'POST',
				data: data,
				dataType: "json",
				success: function (result) {
					if (result.error !== undefined) {						
						element.html(html_element);
					}
					else if (result.status == 'success') {
						if(result.etat_frns)
						{
							element.html('<span class="ico-mhp-loader-btn"></span> Ajouté ');
							purchase_gtm_push(product, "Ajouter au panier", {"ecommerce": true, "panier": result.cart, "host": http_host, "id_produit": id_produit, "quantite": quantite, "url": result.url, "panier_crypt": result.cart_crypt}, redirect_to.bind(null, result.url));
						}
						else
						{
							var last_url = (result.url == undefined) ? http_host + "/mhp/panier/" : result.url;
							redirect_to(last_url);
						}
					}
				}
			});

		} else {
			alert("Veuillez renseigner une quantité supérieure à 0.");
		}
	});

	$(document).on("click", ".redir_di,.redir_ci,.btn-etape-suivant[data-ecran=1]:not(.disabled)", function () {
		if (
            ($(this).hasClass("btn-etape-suivant") &&
                $(this).closest("#cn-bloc-dmd-devis").find(".contains-error")
                    .length == 0 &&
                    $(this)
                        .closest("#cn-bloc-dmd-devis")
                        .find(".error-nb-caractere").length == 0) ||
            $(this).hasClass("redir_di") ||
            $(this).hasClass("redir_ci")
        ) {
            var product = rechercher_produit_gtm($(this));

            if (product != undefined) {
                purchase_gtm_push(product, $(this).text(), {
                    ecommerce: false,
                    panier: "",
                    host: http_host,
                });
            }
        }
    });

	/**
	 * @author Rindra ANDRIANJANAKA <randrianjanaka@hellopro.fr>
	 * @todo Unbind l'event click sur le bouton deconnexion du header et rattacher un nouvel eventlistener
	 */
	if ($("#mhp_logout > a").length > 0) {
		if ($._data($("#mhp_logout > a").get(0), "events")) {
			$("#mhp_logout").off();
			$("#mhp_logout > a").off();
		}

		$("#mhp_logout > a").on("click", function(event) {
			event.preventDefault();
			var url_deconnexion = $(this).data("deconnexion-mca");
			redirect_to(url_deconnexion);
		});
	}

	/**
	 * @author Rindra ANDRIANJANAKA <randrianjanaka@hellopro.fr>
	 * @todo Ajout de l'event impressionClick lors d'un click sur un produit dans une impression
	 */
	$(document).on("click", ".list_produit", function (event) {
		event.preventDefault();

		var element = event.target;
		var regex = /.*-(\d+)-societe\.html/gm;

		if ($(element).hasClass("link_nom_societe_di")) {
			var results;
			var link;
			if($(element).length){
				link = $(element).attr("href").trim();
				results = regex.exec(link);
			}
			if (results && results.length > 0) {
				redirect_to(link);
			}
		} else if (
			!$(element).hasClass("ajouter_au_panier")
			&& !$(element).hasClass("redir_ci")
			&& !$(element).hasClass("redir_di")
			&& $(element).css("cursor") === "pointer"
		) {
			var product = rechercher_produit_gtm($(element));

			if (product != undefined) {
				impression_click_push(product, redirect_to.bind(null, product.link));
			}
		}
	});

	/**
	 * @author Rindra ANDRIANJANAKA <randrianjanaka@hellopro.fr>
	 * @todo Mise en place du GTM pour la navigation dans le menu header
	 * @date 2023-05-11
	 */
	$("body").on("click", "#mhp_univers_list a", function (event) {
		event.preventDefault();
		event.stopPropagation();
		let target = $(this);
		let name = "";
		
		if (target.data("type") == "univers") {
			name = target.text().trim();
		} else {
			let parent = target.parents('[id^="mm-univers"]').find('a[data-type="univers"]');
			
			if (parent.length > 0) {
				console.log(parent.text().trim());
				name = parent.text().trim();
			}
		}

		if (name) {
			dataLayer.push({
				"event": "navigation_interaction",
				"action_type": "click",
				"action_name": name,
				"action_area": "menu"
			});
		}

		window.location.href = target.attr("href");
	});
});

function purchase_gtm_push(product, dimension, infoMarketplace, callback) {
    var data = {
        event: "eec.add",
		AddToCartType: "",
        ecommerce: {
            currencyCode: "EUR",
            add: {
				products: []
			},
        }
    };

	if (product.list) {
		data.ecommerce.add.actionField = {
			list: product.list
		};
	}

    if (infoMarketplace.ecommerce) {
		var products = [];
		var id_produit = infoMarketplace.id_produit;
		var quantite = infoMarketplace.quantite;
		var panier, is_conseil = false;

		if (window.location.hostname.includes("conseils")) {
			panier = infoMarketplace.panier;
			is_conseil = true;
		}

        $.ajax({
            url: infoMarketplace.host + "/mhp/ajax/cart/mhp_traitement_panier_ajax_v2.php",
            type: "POST",
            dataType: "json",
            data: {
                action: 13,
				id_produit: id_produit,
				panier: panier
            },
            success: function (response) {
                if (response.length == 0) {
                    return false;
				}
				
				total = response.total;

                $(response.products).each(function (index, element) {
                    products.push({
                        id: element.id,
                        name: element.name,
                        category: element.category,
                        variant: element.variant,
                        brand: element.brand,
                        quantity: quantite,
                        price: element.price,
                        tax: element.tax,
                    });
				});

				data.AddToCartType = "achat";

				data.ecommerce.add.products = products;

				if (typeof callback === "function") {
					if (is_conseil) callback = redirect_to.bind(null, infoMarketplace.url + `&cart=${infoMarketplace.panier_crypt}`);
					data.eventCallback = function () { callback() };
					data.eventTimeout = 2000;
				}
				
				dataLayer.push(data);

				if (is_conseil) {
					setTimeout(() => {
						redirect_to(infoMarketplace.url + `&cart=${infoMarketplace.panier_crypt}`);
					}, 500);
				}
            },
        });
    } else {
        var products = [
            {
                id: product.id,
                name: product.name,
                category: product.category,
                variant: product.variant,
                brand: product.brand,
                dimension10: dimension.trim().replace(/\s+/g, " ").replace(/\s-\s/g, " ").replace(/\s/g, " "),
            },
        ];

		data.AddToCartType = "devis";

		data.ecommerce.add.products = products;

		if (typeof callback === "function") {
			data.eventCallback = function () { callback() };
			data.eventTimeout = 2000;
		}		
		dataLayer.push(data);
    }
}

function redirect_to(url) {
	window.location.href = url;
}

function rechercher_produit_gtm(target) {
    var product;
    var position;
    var id_produit;
    var regex = /.*-(\d+)-produit\.html/gm;
    var link = target.prevAll("a").attr("href");
    var results;

	if (target.closest(".list_produit").length > 0) {
		position = target.closest(".list_produit").data("pos");
	}

    if (typeof prod_gtm != "undefined") {
        product = prod_gtm;
    }

    if (!link) {
		var links = [
            $(
                target
                    .closest(".list_produit")
                    .find("a:not([class]), a:not([class!=''])")
            ),
            $(
                target
                    .closest(".list_produit")
                    .find("a.titre_produit_avec_lien")
            ),
            $(target.closest(".list_produit").find("a.lien_prod")),
            $(target.closest(".list_produit").find("a.link-produit")),
        ];

		$(links).each(function (index, element) {
			if ($(element).length > 0) {
				links = $(element);
				return false;
			}
		});
		
        $(links).each(function (index, element) {
            link = $(element).attr("href");

            if (link) {
                link = link.trim();
            }

            results = regex.exec(link);

            if (results && results.length > 0) {
                id_produit = results[1];

                return false;
            }
        });
    } else {
        link = link.trim();

        results = regex.exec(link);

        if (results && results.length > 0) {
            id_produit = results[1];
        }
    }

    if (!position) {
        position = 0;
    }

    if (position > 0 && id_produit) {
        product = undefined;

        var array_gtm = [];

        if (typeof prod_intern_gtm != "undefined")
            array_gtm.push(prod_intern_gtm);
        if (typeof prod_related_gtm != "undefined")
            array_gtm.push(prod_related_gtm);
        if (typeof prod_top5_gtm != "undefined") array_gtm.push(prod_top5_gtm);
        if (typeof new_prod_gtm != "undefined") array_gtm.push(new_prod_gtm);
		if (typeof prod_soc_gtm != "undefined") array_gtm.push(prod_soc_gtm);

        $.each(array_gtm, function (index, element) {
            var gtm = Object.keys(element).map(function (elem) {
                return element[elem];
            });

            $(gtm).each(function (i, e) {
                if (e.id == id_produit && e.position == position) {
                    product = e;

                    return false;
                }
            });

            if (product) return false;
        });

		if (link) {
			product.link = link;
		}
    }

    return product;
}

function impression_click_push(product_gtm, callback) {
	dataLayer.push({
		event: "eec.impressionClick",
		ecommerce: {
			click: {
				actionField: {
					list: product_gtm.list
				},
				products: [
					{
						id: product_gtm.id,
						name: product_gtm.name,
						brand: product_gtm.brand,
						category: product_gtm.category,
						variant: product_gtm.variant,
						position: product_gtm.position
					}
				]
			}
		},
		eventTimeout: 2000,
		eventCallback: function () { callback() }
	});
}

function click_vignette(element, url, position = 0) {
	if (position == 0 && $(element).closest(".list_produit").length > 0) {
		position = $(element).closest(".list_produit").data("pos");
	}

	impression_click_push(prod_intern_gtm[position], redirect_to.bind(null, url));
}