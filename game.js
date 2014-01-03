(function(){
	function Vec(x,y) {
		this.x = x;
		this.y = y;
	}

	function Player(color, numPions) {
		this.color = color;
		this.pionsEnJeu = numPions;
		this.finished = false;
	}

	Player.prototype.addPion = function() {
		++this.pionsEnJeu;
	};

	Player.prototype.removePion = function() {
		--this.pionsEnJeu;
		if(this.pionsEnJeu <= 0) this.finished = true;
	};

	Player.prototype.hasFinished = function() {
		return this.finished;
	}

	/**
	 * Constructeur pour les objets de type Direction
	 * (int,int,int)
	 **/
	function Direction(dx,dy,distance) {
		this.dx = dx;
		this.dy = dy;
		this.distance = distance;
	}

	Direction.prototype.inc = function() {
		return new Direction(this.dx,this.dy,this.distance +1);
	}

	if(!window.game) {
		var cols = 16, rows = 14;

		function Game(players) {
			this.current = 0;
			this.pions = 0;
			this.maxPionPerPlayer = 5;
			this.setPlayers(players);
			this.cases = [];
			for(var x = 0; x < cols; ++x) {
				this.cases[x] = [];
				for(var y = 0; y < rows; ++y) {
					this.cases[x][y] = {};
				}
			}
		}

		Game.prototype.setPlayers = function(players) {
			var self = this;
			this.players = _.map(players, function(color) {return new Player(color,self.maxPionPerPlayer);});
		}

		Game.prototype.currentPlayer = function() {
			return this.players[this.current];
		}

		Game.prototype.nextPlayer = function() {
			this.current = (this.current + 1) % this.players.length;
			return this.players[this.current];
		}

		Game.prototype.lastPlayer = function() {
			var last = (this.current - 1) % this.players.length;
			return this.players[last];
		}


		/**
		 * Fonction qui recherche le premier pion dans une direction.
		 * Elle peut être récursive. L'idée est de rechercher pour chaque
		 * direction (améliorer cet objet, il peut manquer des trucs) si la case
		 * à la distance N est atteignable / est un pion. Si on a trouvé un
		 * pion, on garde la direction (qu'on flag comme OK). Si on tombe sur un
		 * empêchement (bord de terrain ou case du billabong), on supprime la
		 * direction. Si on tombe sur une case vide, on garde la direction, en
		 * mode NOK (ou pas trouvé) et on augmente sa distance.
		 *
		 *
		 * Type : int -> int -> Direction -> Option[Direction]
		 **/
		Game.prototype.cherchePremierPion = function(vec,direction) {
			var xtemp = vec.x + (direction.dx * direction.distance);
			var ytemp = vec.y + (direction.dy * direction.distance);
			if (isInterdite(xtemp, ytemp)){
				//STOP
				return undefined;
			} else if (!this.isVide(xtemp,ytemp)) {
				return direction;
			} else {
				return this.cherchePremierPion(vec, direction.inc());
			}
		}

		function getAffine(orig,dest) {
			var a = (dest.y - orig.y) / (dest.x - orig.x);
			var b = orig.y - (a * orig.x);
			return function(x) { return a*x + b;};
		}

		function passeRiviere(orig,dest) {
			var f = getAffine(orig,dest);
			return f(7) > 7;
		}

		function scoreDeplacement(orig,dest) {
			if((orig.x <= 7 && dest.x > 7) || (orig.x > 7 && dest.x <= 7)) {
				if(passeRiviere(orig,dest)) {
					if(orig.x <= 7) {
						dest.score = (orig.score ? orig.score : 0) + 1;
					} else {
						dest.score = (orig.score ? orig.score : 0) - 1;
					}
				} else dest.score = (orig.score ? orig.score : 0);
			} else dest.score = (orig.score ? orig.score : 0);
			return dest;
		}

		/**
		 * À partir de coordonnées, trouver toutes les possibilités pour un
		 * saut. On a les cellules (un tableau) et les coordonnées de tous les
		 * pions (peut-être avec celles des cases du billabong)
		 *
		 * Type : ioVec -> iio.Grid -> [ioVec]
		 **/
		Game.prototype.getSingleJumpDestinations = function(coordPion) {
			var self = this;
			return _.reduce(_.reduce(initialiseDirections(),function(t,d) {
				var p = self.cherchePremierPion(coordPion,d);
				if(p)
				t.push(p)
				return t;
			},[]),function(t,d) {
				var pp = self.isSautPossible(coordPion,d);
				if(pp) {
					t.push(scoreDeplacement(coordPion,pp));
				}
				return t;
			},[]);
		}

		/**
		 *	À partir d'un tableau de directions qui indiquent des pions, il faut
		 *	tester si on peut sauter par dessus le pion. En gros, il faut suivre
		 *	le chemin de la `direction` après le pion pour voir s'il y a assez de
		 *	place pour sauter et s'il n'y a pas un autre pion sur le chemin
		 *
		 *	L'idée si possible serait de ressortir une liste de coordonnées
		 *	atteignables par un saut.
		 *
		 *	Type : ioVec -> Direction -> [ioVec]
		 */
		Game.prototype.isSautPossible = function(vec,pionASauter) {
			var xpion = vec.x + (pionASauter.dx * pionASauter.distance);
			var ypion = vec.y + (pionASauter.dy * pionASauter.distance);
			for(var a = 1; a <= pionASauter.distance; ++a) {
				var xtemp = xpion + (pionASauter.dx * a);
				var ytemp = ypion + (pionASauter.dy * a);
				if (isInterdite(xtemp, ytemp) || !(this.isVide(xtemp,ytemp))){
					//STOP
					return undefined;
				}
			}
			return {x:xtemp,y:ytemp};
		}

		function uniqCoords(coords) {
			return _.uniq(coords, function(co) {
				var xstr = (co.x < 10 ? '0': '') + co.x;
				var ystr = (co.y < 10 ? '0': '') + co.y;
				return xstr + ystr;
			});
		}

		Game.prototype.getAllJumpDestinations = function(coordPion) {
			var self = this;
			var lastLength = 0;
			var res = this.getSingleJumpDestinations(coordPion);
			var res2 = _.clone(res);
			while(res.length > lastLength) {
				lastLength = res.length;
				res2 = uniqCoords(_.flatten(_.map(res2, function(co){return self.getSingleJumpDestinations(co);})));
				res = uniqCoords(res.concat(res2));
			}
			res = uniqCoords(_.map(_.filter(_.map(initialiseDirections(),function(direction) {
					return new Vec(coordPion.x + (direction.dx * direction.distance),coordPion.y + (direction.dy * direction.distance));
				}), function(coords) {
					return !isInterdite(coords.x,coords.y) && self.isVide(coords.x,coords.y);
				}), function(coords) {
					return scoreDeplacement(coordPion,coords);
				}).concat(res));
			if(coordPion.passed) {
				res = _.reject(res, function(c) { return c.score < 0;});
			}
			return res;
		}

		// Initialise the board. All squares are empty.
		function initialiseDirections() {
			var dirs = [];
			for(var x = -1; x <= 1; ++x) {
				for(var y = -1; y <= 1; ++y) {
					if(x !== 0 || y !== 0) dirs.push(new Direction(x,y,1));
				}
			}
			return dirs;
		}
		/**
		 * Fonction qui vérifie si une case est utilisable ou non.
		 * Renvoie vrai si on dépasse le bord ou si on est dans l'eau.
		 *
		 * Type : int -> int -> bool
		 **/
		function isInterdite(x,y){
			return !(_.isNaN(x) || _.isNaN(y)) && ((x<0 || y<0 || x>=cols || y>=rows) || (x>=6 && x<=9 && y>=6 && y<=7));
		}

		/**
		 * Fonction qui vérifie si une case est occupée ou non.
		 * Renvoie vrai si la case est vide.
		 *
		 * Type : int -> int -> bool
		 **/
		Game.prototype.isVide = function(x,y){
			return typeof(this.cases[x][y].pion) === 'undefined';
		}

		Game.prototype.stillSetUp = function() {
			return this.pions < this.maxPionPerPlayer * this.players.length;
		}

		Game.prototype.setPion = function(x,y,couleur) {
			this.cases[x][y].pion = couleur;
		}

		Game.prototype.getPion = function(x,y) {
			return this.cases[x][y].pion;
		}
		Game.prototype.removePion = function(x,y) {
			this.cases[x][y].pion = undefined;
		}

		Game.prototype.addPion = function(x,y) {
			if(this.isVide(x,y)) {
				this.setPion(x,y,this.currentPlayer().color);
				this.nextPlayer();
				++this.pions;
				return this.getPion(x,y);
			} else return false;
		}
		Game.prototype.move = function(orig,dest) {
			if(this.isVide(dest.x,dest.y)) {
				this.setPion(dest.x,dest.y,this.getPion(orig.x,orig.y));
				this.removePion(orig.x,orig.y);
				if(dest.score > 1) {
					this.currentPlayer().removePion();
					this.removePion(dest.x,dest.y);
				}
				this.nextPlayer();
				return true;
			} else return false;
		}
		window.Game = Game;
	}
})();
