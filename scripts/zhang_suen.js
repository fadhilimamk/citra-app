

const ZS_COLOR_BLACK = 0;
const ZS_COLOR_WHITE = 255;

class ZhangSuenAlgorithm {
    
    constructor(grid) {
        this.grid = grid;
        this.nbrs = [[0, -1], [1, -1], [1, 0], [1, 1], [0, 1], [-1, 1], [-1, 0], [-1, -1], [0, -1]];
        this.nbrGroups = [[[0, 2, 4], [2, 4, 6]], [[0, 2, 6], [0, 4, 6]]];
        this.code_percentage = []
    }

    process() {

        this.calculateCodePercentage();

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

    calculateCodePercentage() {
        var first_black_x = 0;
        var first_black_y = 0;
        var found_first_black = false;

        // find starting point
        var x = 0;
        var y = 0;
        while (!found_first_black && y < this.grid.length) {
            if (this.grid[y][x][0] == ZS_COLOR_BLACK) {
                first_black_x = x;
                first_black_y = y;
                found_first_black = true;
            }

            x++;
            if (x == this.grid[0].length) {
                x = 0;
                y++;
            }
        }
        // console.log("first_x y " + first_black_x + " " + first_black_y);

        var getGridValue = function(x, y, grid) {
            return grid[y][x][0];
        }

        var x = first_black_x, y = first_black_y;
        var count_code = [0, 0, 0, 0, 0, 0, 0, 0];
        // 7 0 1
        // 6 x 2
        // 5 4 3
        var count = 0;

        do {
            var code = 0;
            
            // find white to black pixel around
            if (getGridValue(x-1, y-1, this.grid) == ZS_COLOR_WHITE && getGridValue(x, y-1, this.grid) == ZS_COLOR_BLACK)
                code = 0;
            else if (getGridValue(x, y-1, this.grid) == ZS_COLOR_WHITE && getGridValue(x+1, y-1, this.grid) == ZS_COLOR_BLACK)
                code = 1;
            else if (getGridValue(x+1, y-1, this.grid) == ZS_COLOR_WHITE && getGridValue(x+1, y, this.grid) == ZS_COLOR_BLACK)
                code = 2;
            else if (getGridValue(x+1, y, this.grid) == ZS_COLOR_WHITE && getGridValue(x+1, y+1, this.grid) == ZS_COLOR_BLACK)
                code = 3;
            else if (getGridValue(x+1, y+1, this.grid) == ZS_COLOR_WHITE && getGridValue(x, y+1, this.grid) == ZS_COLOR_BLACK)
                code = 4;
            else if (getGridValue(x, y+1, this.grid) == ZS_COLOR_WHITE && getGridValue(x-1, y+1, this.grid) == ZS_COLOR_BLACK)
                code = 5;
            else if (getGridValue(x-1, y+1, this.grid) == ZS_COLOR_WHITE && getGridValue(x-1, y, this.grid) == ZS_COLOR_BLACK)
                code = 6;
            else if (getGridValue(x-1, y, this.grid) == ZS_COLOR_WHITE && getGridValue(x-1, y-1, this.grid) == ZS_COLOR_BLACK)
                code = 7;

            count_code[code]++;
            
            // change current position to that position
            if (code == 0) {
                x = x; y = y-1;
            } else if (code == 1) {
                x = x+1; y = y-1;
            } else if (code == 2) {
                x = x+1; y = y;
            } else if (code == 3) {
                x = x+1; y = y+1;
            } else if (code == 4) {
                x = x; y = y+1;
            } else if (code == 5) {
                x = x-1; y = y+1;
            } else if (code == 6) {
                x = x-1; y = y;
            } else if (code == 7) {
                x = x-1; y = y-1;
            }

            // console.log(code);
            count++;
            if (count == 1000) {
                x = first_black_x;
                y = first_black_y;
            }

        } while (x != first_black_x || y != first_black_y);

        // console.log(count_code);
        
        // calculate percentage
        var height = parseFloat(this.grid.length);
        var width = parseFloat(this.grid[0].length);
        var diagonal = parseFloat(Math.sqrt(Math.pow(width, 2) + Math.pow(height, 2)));
        for (var i = 0; i < count_code.length; i++) {
            count_code[i] = parseFloat(count_code[i]);
            if (i == 0 || i == 4) count_code[i] = count_code[i]/height;
            if (i == 2 || i == 6) count_code[i] = count_code[i]/width;
            if (i == 7 || i == 3 || i == 1 || i == 5) count_code[i] = count_code[i]/diagonal;
        }

        this.code_percentage = count_code;
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