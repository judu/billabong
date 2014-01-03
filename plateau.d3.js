(function(){

	d3.plateau = function() {
		// 16 cols from 0 to 15.
		var game = new window.Game();
		var cols = 16, rows = 14, cellSize = 50, strokeWidth=2;
		var minMareX = 6, maxMareX = 9;
		var minMareY = 6, maxMareY = 7;
		var vertSepRange = d3.range(2,(cols+1)*cellSize+2,cellSize);
		var horizSepRange = d3.range(2,(rows+1)*cellSize+2,cellSize);
		var svg = null; // Main svg markup
		var squares = null; // svg group containing the squares
		var pionGroup = null; // svg group containing the pions

		var squareCoords = [];
		for(var x = 0; x < cols; ++x) {
			for(var y = 0; y < rows; ++y) {
				squareCoords.push({x:x,y:y});
			}
		}
		squareCoords = squareCoords.filter(function(s) {return !(s.x >= minMareX && s.x <= maxMareX && s.y >= minMareY && s.y <= maxMareY);});

		function centerOf(vec) {
			vec.cx = vec.x * cellSize + strokeWidth + (cellSize/2);
			vec.cy = vec.y * cellSize + strokeWidth + (cellSize/2);
			return vec;
		}

		function addPion(obj,pion) {
			obj.pion = pion;
			return obj;
		}

		function movePion(destDat,pionDat,pionElm) {
			// "this" is the clicked square
			if(game.move(pionDat,destDat)){
				if(destDat.score > 0) //TODO: check that pion is already passed to let it win.
					destDat.passed = true;
				else
					destDat.passed = pionDat.passed;

				destDat.pion = pionDat.pion;
				d3.select(pionElm).datum(destDat)
					.attr('cx', function(d){return d.cx})
					.attr('cy', function(d){return d.cy});

				if(destDat.score > 1){
					d3.select(pionElm).transition()
						.duration(500)
						.style('fill','#BBBBBB')
						.attr('r', 20)
						.transition()
						.duration(1000)
						.style('fill', '#FFFFFF')
						.attr('r', 0)
						.each('end', function() { d3.select(this).remove();});
				}
			}
			unhighlight();
			if(game.lastPlayer().hasFinished()) {
				d3.select('circle.pion').on('click', null);
				alert('Player ' + game.lastPlayer().color + ' won.');
			}
		}

		function accessibleClickCallback(dest, pionDat, elm) {
			return function(d) {movePion.call(this, dest, pionDat, elm);};
		}

		function displayAccessible(datum, index) {
			// Display possibilities if we clicked a pion.
			if(!game.stillSetUp()) {
				if(game.currentPlayer().color === datum.pion) {
					var self = this;
					unhighlight();
					d3.select(self).classed('active',true).attr('filter', 'url(#shadow)');
					var dests = _.map(game.getAllJumpDestinations(datum),function(d) {return centerOf(d);});
					for(var i = 0; i < dests.length; ++i) {
						var dest = dests[i];
						squares
							.selectAll('rect.square')
							.filter(function(d) {return d.x === dest.x && d.y === dest.y;})
							.classed('accessible',true)
							.on('click',accessibleClickCallback(dest,datum,self));
					}
				} else console && console.log('This is not your pion');
			} else console && console.log('Game is in set up phase');
		}

		function unhighlight() {
			pionGroup.select('circle.pion.active').attr('filter',null).classed('active',false);
			squares.selectAll('rect.square').classed('accessible',false).on('click',unhighlight);
		}

		function squareClicked(datum, index) {
			if(game.stillSetUp()) {
				var pion = game.addPion(datum.x,datum.y);
				if(pion) {
					pionGroup = pionGroup || svg.append('g').attr('id', 'piongroup');
					pionGroup.append('svg:circle').data([addPion(centerOf(datum),pion)])
						.attr('cx', function(d){return d.cx})
						.attr('cy', function(d){return d.cy})
						.attr('r', 15)
						.attr('class', 'pion')
						.style('fill', pion)
						.on('click',displayAccessible);
				}
				if(!game.stillSetUp()) {
					squares.selectAll('rect.square').on('click',unhighlight);
				}
			}
		}

		// Draw the svg plateau in `elem`.
		function plateau(elem) {
			elem.each(function() {
				var g = d3.select(this);
				svg = svg || g.append('svg');
				drawCases(svg);
			});
			return plateau;
		}

		function drawCases(g) {
			g.attr('width', cols*cellSize+10).attr('height', rows*cellSize+10);
			// Create the filter to emphasize the selected pions.
			var defs = g.append('svg:defs');
			var filter = defs.append('svg:filter').attr('id','shadow')
				.attr('primitiveUnits','objectBoundingBox');
			filter.append('svg:feSpecularLighting')
				.attr('surfaceScale',1)
			   .attr('lighting-color', '#000000')
				.attr('in','SourceAlpha')
				.attr('result','specOut')
			.append('svg:fePointLight')
			   .attr('x','5')
			   .attr('y','5')
			   .attr('z','25');
			filter.append('svg:feComposite')
				.attr('in2','specOut')
				.attr('in','SourceGraphic')
				.attr('operator','arithmetic')
				.attr('k1',1)
				.attr('k2',0.5)
				.attr('k3',0)
				.attr('k4',0);
			 //Filter created.
			var lines = g.append('svg:g').attr('id', 'thelines');
			lines.selectAll('line.vertical')
				.data(vertSepRange).enter().append('svg:line')
				.attr('x1', function(d) { return d;})
				.attr('y1', strokeWidth)
				.attr('x2', function(d) { return d;})
				.attr('y2', rows*cellSize+strokeWidth)
				.attr('class', 'separateur');
			lines.selectAll('line.horizontal')
				.data(horizSepRange)
				.enter().append('svg:line')
				.attr('x1', strokeWidth)
				.attr('y1', function(d) { return d;})
				.attr('x2', cols*cellSize+strokeWidth)
				.attr('y2', function(d) { return d;})
				.attr('class', 'separateur');
			squares = squares || g.append('g').attr('id','squares');
			squares.selectAll('rect.cases')
				.data(squareCoords)
				.enter().append('svg:rect')
				.attr('x',function(d){return d.x*cellSize+3})
				.attr('y',function(d){return d.y*cellSize+3})
				.attr('data-x', function(d){return d.x})
				.attr('data-y', function(d){return d.y})
				.attr('width',cellSize-strokeWidth)
				.attr('height', cellSize-strokeWidth)
				.classed('obscur', function(d) {return ((d.x % 2 === 0 && d.y % 2 === 1) || (d.x % 2 === 1 && d.y % 2 === 0))})
				.classed('clair', function(d) {return !((d.x % 2 === 0 && d.y % 2 === 1) || (d.x % 2 === 1 && d.y % 2 === 0))})
				.classed('square', true)
				.on('click',squareClicked);
			g.append('svg:rect')
				.attr('id','pond')
				.attr('x', minMareX*cellSize+3)
				.attr('y', minMareY*cellSize+3)
				.attr('width', (maxMareX-minMareX+1)*cellSize-strokeWidth)
				.attr('height', (maxMareY-minMareY+1)*cellSize-strokeWidth)
				.style('fill', '#000099');
			g.append('svg:line')
				.attr('id', 'river')
				.attr('x1', (cols/2) * cellSize + 3)
				.attr('y1', (maxMareY+1)*cellSize)
				.attr('x2', (cols/2) * cellSize+3)
				.attr('y2', rows*cellSize+strokeWidth)
				.attr('class', 'river');

			return plateau;
		}

		plateau.players = function(_) {
			if(!arguments.length) return game.players;
			game.setPlayers(_);
			return plateau;
		}

		plateau.addPlayer = function(p) {
			if(!d3.set(game.players).has(p))
				game.players.push(p);
			return plateau;
		}

		plateau.game = function() {
			return game;
		}

		return plateau;
	};
})();
