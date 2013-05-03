var billabong = [];
for(var ii = 6; ii <= 9; ++ii) {
	for(var jj = 6; jj <= 7; ++jj) {
		billabong.push({x:ii,y:jj});
	}
}

function Recherche(x,y,found,error,next) {
	this.x = x;
	this.y = y;
	this.found = found;
	this.error = error;
	this.next = next;
}


function Direction(dx,dy,distance) {
	this.dx = dx;
	this.dy = dy;
	this.distance = distance;
}

function testBillabongPossibilites(x,y,directions) {
	return directions.filter(function(dir) {
		return !billabong.some(function(b) { return b.x == x+(dir.dx * dir.distance) && b.y == y + (dir.dy * dir.distance);});
	});
}
function testPossibilites(x,y,directions,pions) {
	//Test if billabong
	return directions.filter(function(dir) {
		return
			!billabong.some(function(b) { return b.x == x+(dir.dx * dir.distance) && b.y == y + (dir.dy * dir.distance);})
		&& !pions.some(function(p) { return p.x == x+(dir.dx * dir.distance) && p.y == y + (dir.dy * dir.distance);});
	});
}

function cherchePremierPion(x,y,directions) {
	//TODO prendre autour de (x,y), et agrandir la recherche jusqu'à
	//trouver un pion ou ne plus pouvoir avancer.
}

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
		var cellPos = grid.getCellCenter(io.getEventPosition(event),true);
		io.addObj(new iio.ioCircle(cellPos, 13).setFillStyle('#E00000').setStrokeStyle('#A00000').setLineWidth(3));
	});
	alert("true: " + isLigneDroitePossible({x:0,y:0},{x:13,y:0}));
	alert("true: " + isLigneDroitePossible({x:0,y:0},{x:3,y:3}));
	alert("false: " + isLigneDroitePossible({x:0,y:0},{x:3,y:5}));
	alert("false: " + isLigneDroitePossible({x:0,y:0},{x:13,y:13}));
}
