/**
 * Some utils that are not included in underscore
 */
if(typeof(_) === 'undefined') _ = {};

/**
 * Variable globale qui définit les 8 cases sur lesquelles on n'a pas le
 * droit d'aller.
 **/
var billabong = {
	start : {
		x : 6,
		y : 6
	},
	end : {
		x : 9,
		y : 7
	}
};

/**
 * Create game instance:
 * @param players: subset of couleurs: the colors of the players
 */
function Game(players, io, grid) {
	this.players = players;
	this.current = -1;
	this.pions = 0;
	this.grid = grid;
	this.io = io;
}

Game.prototype.pionPerPlayer = 4;

Game.prototype.nextPlayer = function() {
	this.current = (this.current + 1) % this.players.length;
	return this.players[this.current];
};

Game.prototype.setUp = function() {
		var self = this;
		function putPionOnClick(event) {
			if(self.pions < (self.pionPerPlayer * self.players.length)){
				//FIXME: test output of addPion
				addPion(self.io,self.grid,self.grid.getCellAt(self.io.getEventPosition(event)), self.nextPlayer());
				++self.pions;
				if(self.pions >= (self.pionPerPlayer * self.players.length)) {
					self.io.canvas.removeEventListener('click', putPionOnClick);
					self.play();
				}
			} else {
				console.log("Cannot add pion");
				self.io.canvas.removeEventListener('click', putPionOnClick);
				self.play();
			}
		}
		if(this.pions <= (this.pionPerPlayer * this.players.length))
			this.io.canvas.addEventListener('click',putPionOnClick);
}

Game.prototype.play = function() {
	var self = this;
	if(this.pions <= (this.pionPerPlayer * this.players.length)) {
		this.io.canvas.addEventListener('click',function(event) {
			if(typeof(self.reachablePlaces) !== 'undefined') {
				// Remove reachable places from previous test.
				_.each(self.reachablePlaces,function(circ) {
					circ.clearSelf(self.io.context);
					var vec = self.grid.getCellAt(circ.pos);
					self.grid.cells[vec.x][vec.y].bg.clearSelf(self.io.context);
					self.grid.cells[vec.x][vec.y].bg.draw(self.io.context);
					redrawGrid(self.io,self.grid);
				});
			}
			// Display possibilities if we clicked a pion.
			var vec = self.grid.getCellAt(self.io.getEventPosition(event));
			if(!isVide(self.grid,vec.x,vec.y)) {
				var dests = getAllJumpDestinations(self.grid,vec);
				var circles = _.map(dests,function(v) {
					var rr = new iio.Circle(self.grid.getCellCenter(v), 13).setFillStyle('#EFEFEF').setStrokeStyle('#201000').setAlpha(0.5).setLineWidth(3);
					return rr;
				});
				self.reachablePlaces = circles;
				_.each(circles,function(circ) {
					self.io.addObj(circ);
				});
			}
		});
	}
}

var couleurs = {
	BLEU : "#005DFE",
	ROUGE : "#FE0000",
	VERT : "#0AB015",
	JAUNE : "#FEDC00"
}

var grid;

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
 * Constructeur pour les objets de type Pion
 * couleur = la couleur du pion
 * ruisseau = vrai si le pion a passé le ruisseau
 * (string,bool)
 **/
function Pion(couleur,ruisseau) {
	this.couleur = couleur;
	this.ruisseau = ruisseau;
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
function cherchePremierPion(grid,vec,direction) {
	var xtemp = vec.x + (direction.dx * direction.distance);
	var ytemp = vec.y + (direction.dy * direction.distance);
	if (isInterdite(grid,xtemp, ytemp)){
		//STOP
		return new None();
	} else if (!isVide(grid,xtemp,ytemp)) {
		return new Some(direction);
	} else {
		return cherchePremierPion(grid,vec, direction.inc());
	}
}

/**
 * Fonction qui vérifie si une case est utilisable ou non.
 * Renvoie vrai si on dépasse le bord ou si on est dans l'eau.
 *
 * Type : int -> int -> bool
**/
function isInterdite(grid,x,y){
	return !(_.isNaN(x) || _.isNaN(y)) && ((x<0 || y<0 || x>=grid.C || y>=grid.R) || (x>=6 && x<=9 && y>=6 && y<=7));
}

/**
 * Fonction qui vérifie si une case est occupée ou non.
 * Renvoie vrai si la case est vide.
 *
 * Type : int -> int -> bool
**/
function isVide(grid,x,y){
	return (Optional(grid.cells[x][y].pion).isEmpty);
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
function isSautPossible(grid,vec,pionASauter) {
	var xpion = vec.x + (pionASauter.dx * pionASauter.distance);
	var ypion = vec.y + (pionASauter.dy * pionASauter.distance);
	for(var a = 1; a <= pionASauter.distance; ++a) {
		var xtemp = xpion + (pionASauter.dx * a);
		var ytemp = ypion + (pionASauter.dy * a);
		if (isInterdite(grid,xtemp, ytemp) || !(isVide(grid,xtemp,ytemp))){
			//STOP
			return new None();
		}
	}
	return new Some(new iio.Vec(xtemp,ytemp));
}

/**
 * À finir.
 * Fonction qui retourne vrai si un chemin est possible entre deux
 * coordonnées. C'est possible si les points sont alignés
 * horizontalement, verticalement ou en diagonale.
 *
 * Pour l'instant on vérifie qu'il n'y a pas de case de billabong entre
 * les deux. Il faut l'améliorer pour y ajouter des pions. Voire
 * directement passer une liste de cases qui ne doivent pas s'y trouver,
 * plutôt que de faire ça avec la variable globale billabong
 *
 * Type : ioVec -> ioVec -> bool
 **/
function isLigneDroitePossible(coords1,coords2) {
	var diffX = coords2.x - coords1.x;
	var diffY = coords2.y - coords1.y;
	var coef = diffX == 0 ? 0 : diffY/diffX;
	if(Math.abs(coef) > 1) {
		return false;
	}
	var minX = Math.min(coords1.x,coords2.x);
	var maxX = Math.max(coords1.x,coords2.x);
	var orig = coords1.y - (coords1.x * coef);
	var f = function(x) { return x*coef + orig; };

	for(var xx = minX; xx <= maxX; ++xx) {
		if(billabong.some(function(b) { return b.x == xx && b.y == f(xx); })) {
			return false;
		}
	}
	return true;
}

/**
 * À partir de coordonnées, trouver toutes les possibilités pour un
 * saut. On a les cellules (un tableau) et les coordonnées de tous les
 * pions (peut-être avec celles des cases du billabong)
 *
 * Type : ioVec -> iio.Grid -> [ioVec]
 **/
function getSingleJumpDestinations(grid,coordPion) {
	return _.map(initialiseDirections(),function(d) {
		return cherchePremierPion(grid,coordPion,d);
	}).flatMap(function(d) {
		return d.flatMap(function(dd) {
			return isSautPossible(grid,coordPion,dd);
		});
	});
}

function uniqCoords(coords) {
	return _.uniq(coords, function(co) {
		var xstr = (co.x < 10 ? '0': '') + co.x;
		var ystr = (co.y < 10 ? '0': '') + co.y;
		return xstr + ystr;
	});
}

function getAllJumpDestinations(grid, coordPion) {
	var lastLength = 0;
	var res = getSingleJumpDestinations(grid,coordPion);
	var res2 = _.clone(res);
	while(res.length > lastLength) {
		lastLength = res.length;
		res2 = uniqCoords(_.flatten(_.map(res2, function(co){return getSingleJumpDestinations(grid,co);})));
		res = uniqCoords(res.concat(res2));
	}
	return uniqCoords(_.filter(_.map(initialiseDirections(),function(direction) {
		return new iio.Vec(coordPion.x + (direction.dx * direction.distance),coordPion.y + (direction.dy * direction.distance));
	}), function(coords) {
		return !isInterdite(grid,coords.x,coords.y) && isVide(grid,coords.x,coords.y);
	}).concat(res));
}

function redrawGrid(io,grid) {
	if(typeof(io.eau) === 'undefined') {
		grid.draw(io.context);
		io.eau = new iio.Rect(400,350,200,100);
		io.eau.setFillStyle('#000099');
		io.eau.setStrokeStyle('#201000');
		io.eau.setLineWidth(0);
		io.addObj(io.eau);
	} else {
		io.eau.clearSelf(io.context);
		grid.draw(io.context);
		io.eau.draw(io.context);
	}
	io.addObj(new iio.Line(400,400,400,700).setStrokeStyle('#0000EE').setLineWidth(8));
}

function drawGrid(io,grid) {
	io.addObj(grid);
	fillCellsBg(io,grid);
	redrawGrid(io,grid);
}
function fillCellsBg(io, grid) {
	var color1 = 'rgba(61,40,25,0.8)';
	var color2 = 'rgba(255,234,197,0.8)';
	// Make it look like a chessboard.
	for(var y = 0; y < grid.R; ++y) {
		for(var x = y%2; x < grid.C; x += 2) {
			var x2;
			if(x%2 == 0) {
				x2 = x+1;
			} else {
				x2 = x-1;
			}
			if(!(y >= 6 && y <= 7 && x >= 6 && x <= 9)) {
				grid.cells[x][y].bg = new iio.Rect(grid.getCellCenter(x,y,false),48).setFillStyle(color1);
				io.addObj(grid.cells[x][y].bg);
			}
			if(x2 >= 0 && x2 < 16 && !(y >= 6 && y <= 7 && x >= 6 && x <= 9)) {
				grid.cells[x2][y].bg = new iio.Rect(grid.getCellCenter(x2,y,false),48).setFillStyle(color2);
				io.addObj(grid.cells[x2][y].bg);
			}
		}
	}
}
function drawCell(io, grid, coords) {
	var cell = grid.cells[coords.x][coords.y];
	if(Optional(cell.pion).isEmpty) {
		if(!Optional(cell.ioObj).isEmpty) {
			cell.ioObj.clearSelf(io.context);
			cell.ioObj = null;
		}
	} else {
		if(Optional(cell.ioObj).isEmpty) {
			var cellPos = grid.getCellCenter(coords);
			cell.ioObj = new iio.Circle(cellPos, 13).setFillStyle(cell.pion.couleur).setStrokeStyle('#101010').setLineWidth(3);
			io.addObj(cell.ioObj);
		}
	}
}
function drawPions(io,grid) {
	for(var y = 0; y < grid.R; ++y) {
		for(var x= 0; x < grid.C; ++x) {
			drawCell(io,grid, new iio.Vec(x,y));
		}
	}
}

function addPion(io, grid, cell, couleur) {
	//FIXME: do not permit to put pion right to the river.
	var pion = new Pion(couleur,false);
	if(Optional(grid.cells[cell.x][cell.y].pion).isEmpty) {
		grid.cells[cell.x][cell.y].pion = pion;
		drawCell(io, grid, cell);
		return true;
	} else {
		return false;
	}
}

var game;

function Billabong(io) {
	var grid = new iio.Grid(0,0,16,14,50); // posX,posY,width,height,cellSize
	grid.setStrokeStyle('#201000');
	grid.setLineWidth(2);
	drawGrid(io,grid);
	game = new Game([couleurs.BLEU,couleurs.ROUGE], io, grid);
	game.setUp();
}
