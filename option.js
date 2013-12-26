/**
 * Comme on est en javascript, ce n'est pas la peine de passer une
 * option.
 * Néanmoins, on fournit la fonction Option(o) qui retourne un None si o
 * est undefined ou null.
 **/
function Optional(o) {
	if(typeof(o) === "undefined" || o === null) {
		return new None();
	} else {
		return new Some(o);
	}
}

/**
 * Absence de valeur
 */
function None(){}

/**
 * Renvoie une Option de la valeur si Some. Ou None.
 */
None.prototype.map = function(f) {
	return new None();
}

None.prototype.flatMap = function(f) {
	return new None();
}

/**
 * Exécute f1 si None, f2(obj) si Some
 */
None.prototype.fold = function(f1, f2) {
	return (typeof(f1) === "function" ? f1() : f1);
}

None.prototype.getOrElse = function(other) {
	return other;
}

/**
 * vrai si None, faux si Some
 */
None.prototype.isEmpty = true;

/**
 * Encapsule un objet
 */
function Some(o) {
	this.obj = o;
}

/**
 * Retourne un Some du résultat de la fonction appliquée à l'objet encapsulé
 */
Some.prototype.map = function(f) {
	return new Some(f(this.obj));
}

Some.prototype.flatMap = function(f) {
	var res = f(this.obj);
	if(typeof(res) != 'undefined' && (res.constructor === Some || res.constructor === None)) {
		if(res.isEmpty)
			return new None();
		else
			return res;
	} else {
		return new None();
	}
}

/**
 * Applique f2 à l'objet encapsulé
 */
Some.prototype.fold = function(f1, f2) {
	return f2(this.obj);
}

Some.prototype.getOrElse = function() {
	return this.obj;
}

Some.prototype.isEmpty = false

/**
 * [a] -> (a -> Option(b)) -> [b]
 */
Array.prototype.flatMap = function(iterator, context) {
	var arr = [];
	_.each(this, function(value, index, list) {
		var res = iterator.call(context, value, index, list);
		if(typeof(res) !== 'undefined' && (res.constructor === Some || res.constructor === None) && !res.isEmpty) {
			arr.push(res.obj);
		}
	});
	return arr;
}
