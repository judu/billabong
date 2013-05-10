/**
 * Variable globale qui définit les 8 cases sur lesquelles on n'a pas le
 * droit d'aller.
 **/
var billabong = [];
for(var ii = 6; ii <= 9; ++ii) {
	for(var jj = 6; jj <= 7; ++jj) {
		billabong.push({x:ii,y:jj});
	}
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
 * Type : int -> int -> [Direction] -> [Direction]
 **/
function cherchePremierPion(x,y,directions) {
	//TODO prendre autour de (x,y), et agrandir la recherche jusqu'à
	//trouver un pion ou ne plus pouvoir avancer.
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
 *	Type : int -> int -> [ioVec] -> [ioVec]
 */
function isSautPossible(x,y,pionsASauter) {
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

}

function Billabong(io) {
	var grid = new iio.ioGrid(0,0,16,14,50); // posX,posY,width,height,cellSize
	grid.setStrokeStyle('#201000');
	grid.setLineWidth(2);
	io.addObj(grid);
	var eau = new iio.ioRect(400,350,200,100);
	eau.setFillStyle('#000099');
	eau.setStrokeStyle('#0000EE');
	eau.setLineWidth(3);

	var color1 = 'rgba(61,40,25,0.8)';
	var color2 = 'rgba(255,234,197,0.8)';
	for(var y = 0; y < 14; ++y) {
		for(var x = y%2; x < 16; x += 2) {
			var x2;
			if(x%2 == 0) {
				x2 = x+1;
			} else {
				x2 = x-1;
			}
			if(!(y >= 6 && y <= 7 && x >= 6 && x <= 9))
				io.addObj(new iio.ioRect(grid.getCellCenter(x,y,false),48).setFillStyle(color1));
			if(x2 >= 0 && x2 < 16 && !(y >= 6 && y <= 7 && x >= 6 && x <= 9))
				io.addObj(new iio.ioRect(grid.getCellCenter(x2,y,false),48).setFillStyle(color2));
		}
	}
	io.addObj(eau);
	io.addObj(new iio.ioLine(00,00,800,00).setLineWidth(4));
	io.addObj(new iio.ioLine(800,00,800,700).setLineWidth(4));
	io.addObj(new iio.ioLine(00,700,800,700).setLineWidth(4));
	io.addObj(new iio.ioLine(00,00,00,700).setLineWidth(4));
	io.addObj(new iio.ioLine(400,400,400,700).setStrokeStyle('#0000EE').setLineWidth(8));

	io.canvas.addEventListener('mousedown',function(event) {
		//console.log(grid.getCellAt(io.getEventPosition(event))); // Exemple de log
		var cellPos = grid.getCellCenter(io.getEventPosition(event),true);
		io.addObj(new iio.ioCircle(cellPos, 13).setFillStyle('#E00000').setStrokeStyle('#A00000').setLineWidth(3));
	});
}
