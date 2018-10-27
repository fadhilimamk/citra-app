

const ZS_COLOR_BLACK = 0;
const ZS_COLOR_WHITE = 255;

class ZhangSuenAlgorithm {
    
    constructor(grid) {
        this.grid = grid;
        this.nbrs = [[0, -1], [1, -1], [1, 0], [1, 1], [0, 1], [-1, 1], [-1, 0], [-1, -1], [0, -1]];
        this.nbrGroups = [[[0, 2, 4], [2, 4, 6]], [[0, 2, 6], [0, 4, 6]]];
    }

    process() {

        function Point(x, y) {
            this.x = x;
            this.y = y;
        }
        
        var toWhite = new Array();
        var firstStep = false;
        var hasChanged;
        do {
            hasChanged = false;
            firstStep = !firstStep;
            for (var r = 1; r < this.grid.length - 1; r++) {
                for (var c = 1; c < this.grid[0].length - 1; c++) {
                    if (this.grid[r][c][0] !== ZS_COLOR_BLACK)
                        continue;
                    var nn = this.numNeighbors(r, c);
                    if (nn < 2 || nn > 6)
                        continue;
                    if (this.numTransitions(r, c) !== 1)
                        continue;
                    if (!this.atLeastOneIsWhite(r, c, firstStep ? 0 : 1))
                        continue;
                    toWhite.push(new Point(c, r));
                    hasChanged = true;
                }
            }
            for (let i = 0; i < toWhite.length; i++) {
                var p = toWhite[i];
                this.grid[p.y][p.x] = [ZS_COLOR_WHITE, ZS_COLOR_WHITE, ZS_COLOR_WHITE, ZS_COLOR_WHITE];
            }
            toWhite = new Array();
        } while ((firstStep || hasChanged));

        return this.grid;
    }


    // -------- HELPER FUNCTION -----------------
    numNeighbors(r, c) {
        var count = 0;
        for (var i = 0; i < this.nbrs.length - 1; i++)
            if (this.grid[r + this.nbrs[i][1]][c + this.nbrs[i][0]][0] === ZS_COLOR_BLACK)
                count++;
        return count;
    };

    numTransitions(r, c) {
        var count = 0;
        for (var i = 0; i < this.nbrs.length - 1; i++)
            if (this.grid[r + this.nbrs[i][1]][c + this.nbrs[i][0]][0] === ZS_COLOR_WHITE) {
                if (this.grid[r + this.nbrs[i + 1][1]][c + this.nbrs[i + 1][0]][0] === ZS_COLOR_BLACK)
                    count++;
            }
        return count;
    };

    atLeastOneIsWhite(r, c, step) {
        var count = 0;
        var group = this.nbrGroups[step];
        for (var i = 0; i < 2; i++)
            for (var j = 0; j < group[i].length; j++) {
                var nbr = this.nbrs[group[i][j]];
                if (this.grid[r + nbr[1]][c + nbr[0]][0] === ZS_COLOR_WHITE) {
                    count++;
                    break;
                }
            }
        return count > 1;
    };

    printResult() {
        for (var i = 0; i < this.grid.length; i++) {
            var str = "";
            for (var j = 0; j < this.grid[i].length; j++) {
                str += (this.grid[i][j][0] == ZS_COLOR_BLACK)? '1' : '0';
            }
            console.log(str);
        }
    };  

}