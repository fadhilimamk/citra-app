// Main class for character skeleton processing
// Grid is 1 and 0 matrix, value 1 indicates the skeleton of character

const SK_COLOR_WHITE = 0;
const SK_COLOR_BLACK = 1;

class CharSkeletonGrid {

    // --------------------- CONSTRUCTOR SECTION -------------------
    constructor(binary_grid) {
        this.width = binary_grid[0].length;
        this.height = binary_grid.length;
        this.diagonal = Math.sqrt(Math.pow(this.width, 2) + Math.pow(this.height, 2));

        // initialize empty grid
        this.grid = binary_grid;

        // initialize character properties
        this.prop = {
            // data of edge and junction coordinate
            data_edge: [],
            data_junction: [],

            // number of edge and junction, per sector (up, bottom, left, right)
            n_edge: 0,
            n_junction: 0,
            n_edge_top: 0,
            n_edge_bottom: 0,
            n_edge_left: 0,
            n_edge_right: 0,
            n_junction_top: 0,
            n_junction_bottom: 0,
            n_junction_left: 0,
            n_junction_right: 0,

            // number of circular in the character
            n_circular: 0,

            // chain code percentage
            percent_code_0: 0,
            percent_code_1: 0,
            percent_code_2: 0,
            percent_code_3: 0,
            percent_code_4: 0,
            percent_code_5: 0,
            percent_code_6: 0,
            percent_code_7: 0
        };
    }

    // --------------------- MAIN METHOD SECTION --------------------

    // Change value in grid, assuming val always 1 or 0
    setGridVal(x, y, val) {
        this.grid[y][x] = val;
    }

    // assuming height and width of incoming grid is the same
    setWholeGrid(grid) {
        this.grid = grid;
    }

    // removing "kutil" or "tail" from skeleton
    prunningSkeleton() {

    }

    // calculating chain code percentage
    calculateCodePercentage() {

    }

    // calculate edge and junction from character skeleton
    calculateEdgeJunction() {
        var data_temp_junction = [];
        for(var y = 0; y < this.height; y++) {
            for(var x = 0; x < this.width; x++) {
                if (this.grid[y][x] == SK_COLOR_BLACK) {
                    var black_count = 0;
                    var white_to_black_count = 0;
                    if (x-1 >=0 && y-1 >=0 && this.grid[y-1][x-1] == SK_COLOR_BLACK) black_count++;
                    if (y-1 >=0 && this.grid[y-1][x] == SK_COLOR_BLACK) black_count++;
                    if (x+1 < this.width && y-1 >=0 && this.grid[y-1][x+1] == SK_COLOR_BLACK) black_count++;
                    if (x-1 >=0 && this.grid[y][x-1] == SK_COLOR_BLACK) black_count++;
                    if (x+1 < this.width && this.grid[y][x+1] == SK_COLOR_BLACK) black_count++;
                    if (x-1 >= 0 && y+1 < this.height && this.grid[y+1][x-1] == SK_COLOR_BLACK) black_count++;
                    if (y+1 < this.height && this.grid[y+1][x] == SK_COLOR_BLACK) black_count++;
                    if (x+1 < this.width && y+1 < this.height && this.grid[y+1][x+1] == SK_COLOR_BLACK) black_count++;
    
                    if (black_count == 1) {
                        this.prop.data_edge.push([x, y]);
                    }


                    if (x-1 >= 0 && y-1 >=0 && this.grid[y-1][x-1] == SK_COLOR_WHITE && this.grid[y-1][x] == SK_COLOR_BLACK) white_to_black_count++;
                    if (x+1 < this.width && y-1 >= 0 && this.grid[y-1][x] == SK_COLOR_WHITE && this.grid[y-1][x+1] == SK_COLOR_BLACK) white_to_black_count++;
                    if (x+1 < this.width && y-1 >=0 && this.grid[y-1][x+1] == SK_COLOR_WHITE && this.grid[y][x+1]) white_to_black_count++;
                    if (x+1 < this.width && y+1 < this.height && this.grid[y][x+1] == SK_COLOR_WHITE && this.grid[y+1][x+1] == SK_COLOR_BLACK) white_to_black_count++;
                    if (x+1 < this.width && y+1 < this.height && this.grid[y+1][x+1] == SK_COLOR_WHITE && this.grid[y+1][x] == SK_COLOR_BLACK) white_to_black_count++;
                    if (x-1 >= 0 && y+1 < this.height && this.grid[y+1][x] == SK_COLOR_WHITE && this.grid[y+1][x-1] == SK_COLOR_BLACK) white_to_black_count++;
                    if (x-1 >= 0 && y+1 < this.height && this.grid[y+1][x-1] == SK_COLOR_WHITE && this.grid[y][x-1] == SK_COLOR_BLACK) white_to_black_count++;
                    if (x-1 >=0 && y-1 >= 0 && this.grid[y][x-1] == SK_COLOR_WHITE && this.grid[y-1][x-1] == SK_COLOR_BLACK) white_to_black_count++;    

                    if (white_to_black_count > 2) {
                        data_temp_junction.push([x, y]);
                    }
                }
            }    
        }


        // combine junction with distance less than 10 px
        if (data_temp_junction.length > 2) {
            var prev_idx = 0;
            this.prop.data_junction.push(data_temp_junction[0]);
            for (var i = 1; i < data_temp_junction.length; i++) {
                if (Math.abs(data_temp_junction[i][0]-data_temp_junction[prev_idx][0]) + Math.abs(data_temp_junction[i][1]-data_temp_junction[prev_idx][1]) > this.diagonal * 0.2) {
                    this.prop.data_junction.push(data_temp_junction[i]);
                    prev_idx = i;
                }
            }
        } else {
            this.prop.data_junction = data_temp_junction;
        }
        console.log(0.2 * this.diagonal);
        console.log(this.prop.data_junction);

    }

    // count the number of circular in character
    calculateCircular() {
        this.n_circular = 0;
    }

    // generate all the character props
    calculateAllProps() {
        this.prunningSkeleton();
        this.calculateCodePercentage();
        this.calculateEdgeJunction();
        this.calculateCircular();
        return this.prop;
    }


    // HELPER METHOD ================================================
    static match3x3Array(X, Y) {
        var cek = true;
        for (var r = 0; r < 3 && cek; r++) {
            for (var c = 0; c < 3 && cek; c++) {
                if (X[r][c] == COLOR_DONT_CARE) {
                    continue
                } else {
                    if (X[r][c] != Y[r][c]) {
                        cek = false;
                    }
                }
            }
        }
        return cek;
    }

}