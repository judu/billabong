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

function initialiseDirections() {
	var dirs = [];
	for(var x = -1; x <= 1; ++x) {
		for(var y = -1; y <= 1; ++y) {
			dirs.push(new Direction(x,y,0));
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
function cherchePremierPion(x,y,direction) {
	//TODO prendre autour de (x,y), et agrandir la recherche jusqu'à
	//trouver un pion ou ne plus pouvoir avancer.
	var xtemp = x + (direction.dx * direction.distance);
	var ytemp = y + (direction.dy * direction.distance);
	if (isInterdite(xtemp, ytemp)){
		//STOP
		return new None();
	} else if (!isVide(xtemp,ytemp)) {
		return new Some(direction);
	} else {
		return cherchePremierPion(x,y, new Direction(direction.dx, direction.dy, direction.distance+1));
	}
}

/**
 * Fonction qui vérifie si une case est utilisable ou non.
 * Renvoie vrai si on dépasse le bord ou si on est dans l'eau.
 *
 * Type : int -> int -> bool
**/
function isInterdite(x,y){
	return ((x<0 || y<0 || x>17 || y>15) || (x>=6 && x<=9 && y>=6 && y<=7));
}

/**
 * Fonction qui vérifie si une case est occupée ou non.
 * Renvoie vrai si la case est vide.
 *
 * Type : int -> int -> bool
**/
function isVide(x,y){
	return (typeof(grid.cells[x][y].pion) === "undefined");
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
 *	Type : int -> int -> [Direction] -> [ioVec]
 */
function isSautPossible(x,y,pionsASauter) {
	return pionsASauter.flatMap(function(d){
		var xpion = x + (direction.dx * direction.distance);
		var ypion = y + (direction.dy * direction.distance);
		for(var a = 1; a <= d.distance; ++a) {
			var xtemp = xpion + (direction.dx * a);
			var ytemp = ypion + (direction.dy * a);
			if (isInterdite(xtemp, ytemp) || !(isVide(xtemp,ytemp))){
				//STOP
				return new None();
			}
		}
		return Some(new iio.Vec(xtemp,ytemp));
	});
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
 * Type : ioVec -> [[Object]] -> [ioVec]
 **/
function getSingleJumpDestinations(coordPion,cells,allPions) {
	return initialiseDirections().flatMap(function(d) { return cherchePremierPion(coordPion.x,coordPion.y,d);}).flatMap(function(d) {return isSautPossible(coordPion.x,coordPion.y,d)});
}

function drawGrid(io,grid) {
	io.addObj(grid);
	var eau = new iio.Rect(400,350,200,100);
	eau.setFillStyle('#000099');
	eau.setStrokeStyle('#0000EE');
	eau.setLineWidth(3);
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
			if(!(y >= 6 && y <= 7 && x >= 6 && x <= 9))
				io.addObj(new iio.Rect(grid.getCellCenter(x,y,false),48).setFillStyle(color1));
			if(x2 >= 0 && x2 < 16 && !(y >= 6 && y <= 7 && x >= 6 && x <= 9))
				io.addObj(new iio.Rect(grid.getCellCenter(x2,y,false),48).setFillStyle(color2));
		}
	}
	io.addObj(eau);
	io.addObj(new iio.Line(00,00,800,00).setLineWidth(4));
	io.addObj(new iio.Line(800,00,800,700).setLineWidth(4));
	io.addObj(new iio.Line(00,700,800,700).setLineWidth(4));
	io.addObj(new iio.Line(00,00,00,700).setLineWidth(4));
	io.addObj(new iio.Line(400,400,400,700).setStrokeStyle('#0000EE').setLineWidth(8));
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
	var pion = new Pion(couleur,false);
	if(Optional(grid.cells[cell.x][cell.y].pion).isEmpty) {
		grid.cells[cell.x][cell.y].pion = pion;
		drawCell(io, grid, cell);
		return true;
	} else {
		return false;
	}
}
function Billabong(io) {
	var grid = new iio.Grid(0,0,16,14,50); // posX,posY,width,height,cellSize
	grid.setStrokeStyle('#201000');
	grid.setLineWidth(2);
	drawGrid(io,grid);
	drawPions(io,grid);
	io.canvas.addEventListener('mousedown',function(event) {
		console.log("Add pion: " + addPion(io,grid,grid.getCellAt(io.getEventPosition(event)), couleurs.ROUGE));
	});
}
