// Main class for character skeleton processing
// Grid is 1 and 0 matrix, value 1 indicates the skeleton of character

class CharSkeletonGrid {

    // --------------------- CONSTRUCTOR SECTION -------------------
    constructor(width, height) {
        this.width = width;
        this.height = height;

        // initialize empty grid
        this.grid = [];
        for(var i=0; i<height; i++) {
            this.grid[i] = Array.apply(null, Array(width)).map(Number.prototype.valueOf,0);
        }

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

}