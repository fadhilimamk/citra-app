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
            percent_code_7: 0,

            percent_code_horizontal: 0,
            percent_code_vertical: 0,
            percent_code_diagonal: 0
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
    prunningSkeleton(percentage) {
        // Cetak Gambar di Console
        var printGridInConsole = function (grid) {

            var str = "";

            for (var r = 0; r < grid.length; r++) {
                for (var c = 0; c < grid[0].length; c++) {
                    if (grid[r][c] == SK_COLOR_WHITE) {
                        str += " ";
                    } else {
                        str += "#"
                    }
                }
                str = "\t" + r + "\t" + str;
                console.log(str);
                str = "";
            }
        }

        var getNextPoint = function(visited_point, point, grid) {
            var y = point[1];
            var x = point[0];

            // printGridInConsole(grid);

            if (prev_point == null) {
                if (isPointInside([x, y + 1], grid)) {
                    if (grid[y + 1][x] == SK_COLOR_BLACK) return [x, y + 1];
                }
                if (isPointInside([x, y - 1], grid)) {
                    // console.log(x, y - 1);
                    if (grid[y - 1][x] == SK_COLOR_BLACK) return [x, y - 1];
                }
                if (isPointInside([x - 1, y], grid)) {
                    // console.log(x - 1, y);
                    if (grid[y][x - 1] == SK_COLOR_BLACK) return [x - 1, y];
                }
                if (isPointInside([x + 1, y], grid)) {
                    // console.log(x + 1, y);
                    if (grid[y][x + 1] == SK_COLOR_BLACK) return [x + 1, y];
                }
                if (isPointInside([x - 1, y - 1], grid)) {
                    // console.log(x - 1, y - 1);
                    if (grid[y - 1][x - 1] == SK_COLOR_BLACK) return [x - 1, y - 1];
                } 
                if (isPointInside([x - 1, y + 1], grid)) {
                    // console.log(x - 1, y + 1);
                    if (grid[y + 1][x - 1] == SK_COLOR_BLACK) return [x - 1, y + 1];
                }
                if (isPointInside([x + 1, y - 1], grid)) {
                    // console.log(x + 1, y - 1);
                    if (grid[y - 1][x + 1] == SK_COLOR_BLACK) return [x + 1, y - 1];
                }
                if (isPointInside([x + 1, y + 1], grid)) {
                    // console.log(x + 1, y + 1);
                    if (grid[y + 1][x + 1] == SK_COLOR_BLACK) return [x + 1, y + 1];
                } 
            } else {
                // console.log(prev_point);
                if (isPointInside([x, y + 1], grid)) {
                    if ((grid[y + 1][x] == SK_COLOR_BLACK) && !isPointInArray([x, y + 1], visited_point)) return [x, y + 1];
                }
                if (isPointInside([x, y - 1], grid) ) {
                    if ((grid[y - 1][x] == SK_COLOR_BLACK) && !isPointInArray([x, y - 1], visited_point)) return [x, y - 1];
                }
                if (isPointInside([x - 1, y], grid)) {
                    if ((grid[y][x - 1] == SK_COLOR_BLACK) && !isPointInArray([x - 1, y], visited_point)) return [x - 1, y];
                }
                if (isPointInside([x + 1, y], grid)) {
                    if ((grid[y][x + 1] == SK_COLOR_BLACK) && !isPointInArray([x + 1, y], visited_point)) return [x + 1, y];
                }
                if (isPointInside([x - 1, y - 1], grid)) {
                    if ((grid[y - 1][x - 1] == SK_COLOR_BLACK) && !isPointInArray([x - 1, y - 1], visited_point)) return [x - 1, y - 1];
                }
                if (isPointInside([x - 1, y + 1], grid)) {
                    if ((grid[y + 1][x - 1] == SK_COLOR_BLACK) && !isPointInArray([x - 1, y + 1], visited_point)) return [x - 1, y + 1];
                }
                if (isPointInside([x + 1, y - 1], grid)) {
                    if ((grid[y - 1][x + 1] == SK_COLOR_BLACK) && !isPointInArray([x + 1, y - 1], visited_point)) return [x + 1, y - 1];
                }
                if (isPointInside([x + 1, y + 1], grid)) {
                    if ((grid[y + 1][x + 1] == SK_COLOR_BLACK) && !isPointInArray([x + 1, y + 1], visited_point)) return [x + 1, y + 1];
                }

                return [-1, -1];
            }
        }

        var isPointInside = function (point, grid) {
            var width = grid[0].length;
            var height = grid.length;
            var y = point[1];
            var x = point[0];

            if (x >= 0 && x < width && y >= 0 && y < height) {
                return true;
            }
            return false;
        }

        var isPointInArray = function (point, arr) {
            for(var i in arr) {
                if (arr[i][0] == point[0] && arr[i][1] == point[1]) return true;
            }
            return false;
        }

        var max_length = percentage * this.diagonal / 100;

        if (this.prop.data_junction.length > 0) {
            for (var idx in this.prop.data_edge) {
                var prev_point = null;
                var curr_point = this.prop.data_edge[idx];
                var visited_point = [];
                visited_point.push(curr_point);
                var next_point = getNextPoint(visited_point, curr_point, this.grid);
                
                var tail_length = 1;
                var found = false;
                // console.log(next_point, this.prop.data_junction);
                found = isPointInArray(next_point, this.prop.data_junction);
                while (!found) {
                    prev_point = curr_point;
                    curr_point = next_point;
                    visited_point.push(curr_point);
                    var next_point = getNextPoint(visited_point, curr_point, this.grid);
                    // console.log("i: ", i);
                    // console.log(curr_point);
                    // console.log(next_point);
                    tail_length++;

                    if (next_point[0] == -1 && next_point[1] == -1) break;

                    found = isPointInArray(next_point, this.prop.data_junction);
                }
    
                // console.log("jarak titik ", this.prop.data_edge[idx], " ke intersect: ",  tail_length);
                if (tail_length <= max_length) {
                    // console.log("PRUNING");
                    for(var i in visited_point) {
                        this.grid[visited_point[i][1]][visited_point[i][0]] = SK_COLOR_WHITE;
                    }
                }
            }
        }

    }

    // calculating chain code percentage
    setCodePercentage(code_percentage) {
        // console.log(code_percentage);
        this.prop.percent_code_0 = code_percentage[0];
        this.prop.percent_code_1 = code_percentage[1];
        this.prop.percent_code_2 = code_percentage[2];
        this.prop.percent_code_3 = code_percentage[3];
        this.prop.percent_code_4 = code_percentage[4];
        this.prop.percent_code_5 = code_percentage[5];
        this.prop.percent_code_6 = code_percentage[6];
        this.prop.percent_code_7 = code_percentage[7];

        this.prop.percent_code_diagonal = (code_percentage[1] + code_percentage[3] + code_percentage[5] + code_percentage[7]) / parseFloat(4);
        this.prop.percent_code_vertical = (code_percentage[0] + code_percentage[4]) / parseFloat(2);
        this.prop.percent_code_horizontal = (code_percentage[2] + code_percentage[6]) / parseFloat(2);
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

                    if (y-1 < 0 && x+1 <= this.width && this.grid[y][x+1] == SK_COLOR_BLACK) white_to_black_count++;
                    if (x+1 >= this.width && y+1 <= this.height && this.grid[y+1][x] == SK_COLOR_BLACK) white_to_black_count++;
                    if (y+1 >= this.height && x-1 >= 0 && this.grid[y][x-1] == SK_COLOR_BLACK) white_to_black_count++;
                    if (x-1 < 0 && y-1 >= 0 && this.grid[y-1][x] == SK_COLOR_BLACK) white_to_black_count++;

                    if (white_to_black_count > 2) {
                        data_temp_junction.push([x, y]);
                    }
                }
            }    
        }


        // combine junction with distance less than 20% of diagonal
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

        this.prop.n_edge = this.prop.data_edge.length;
        this.prop.n_junction = this.prop.data_junction.length;
    }

    calculateEdgeJunctionRegion(percentage) {

        if (percentage > 30) percentage = 30;
        var height_limit = percentage*this.height/100;
        var width_limit = percentage*this.width/100;
        for(var i = 0; i < this.prop.data_edge.length; i++) {
            if (this.prop.data_edge[i][1] < height_limit) this.prop.n_edge_top++;
            if (this.prop.data_edge[i][1] > this.height - height_limit) this.prop.n_edge_bottom++; 
            if (this.prop.data_edge[i][0] < width_limit) this.prop.n_edge_left++; 
            if (this.prop.data_edge[i][0] > this.width - width_limit) this.prop.n_edge_right++; 
        }
        for(var i = 0; i < this.prop.data_junction.length; i++) {
            if (this.prop.data_junction[i][1] < height_limit) this.prop.n_junction_top++;
            if (this.prop.data_junction[i][1] > this.height - height_limit) this.prop.n_junction_bottom++; 
            if (this.prop.data_junction[i][0] < width_limit) this.prop.n_junction_left++; 
            if (this.prop.data_junction[i][0] > this.width - width_limit) this.prop.n_junction_right++; 
        }

        console.log(this.prop);
    }

    // count the number of circular in character
    calculateCircular() {
        this.n_circular = 0;
    }

    // generate all the character props, NEVER USE THIS FUNCTION AT THIS TIME!!!
    calculateAllProps() {
        this.prunningSkeleton();
        this.calculateCodePercentage();
        this.calculateEdgeJunction();
        this.calculateCircular();
        return this.prop;
    }


    predict() {
        return this.predictChar(this.prop.n_edge, this.prop.n_junction, this.prop.n_edge_top, this.prop.n_edge_bottom, this.prop.n_edge_left, this.prop.n_edge_right, this.prop.n_junction_top, this.prop.n_junction_bottom, this.prop.n_junction_left, this.prop.n_junction_right, this.prop.percent_code_vertical, this.prop.percent_code_horizontal, this.prop.percent_code_diagonal);
    }

    predictChar(n_edge, n_junction, n_edge_top, n_edge_bottom, n_edge_left, n_edge_right, n_junction_top, n_junction_bottom, n_junction_left, n_junction_right, percent_code_vertical, percent_code_horizontal, percent_code_diagonal) {
  if (percent_code_horizontal <= 0.0212500002235)
    if (percent_code_vertical <= 0.413333326578)
      return '$';
    else  // if percent_code_vertical > 0.413333326578
      return '1';
  else  // if percent_code_horizontal > 0.0212500002235
    if (n_edge <= 0.5)
      if (n_junction_left <= 0.5)
        if (n_junction <= 1.0)
          if (percent_code_vertical <= 0.0391666665673)
            return 'H';
          else  // if percent_code_vertical > 0.0391666665673
            if (percent_code_diagonal <= 0.0572034604847)
              return '+';
            else  // if percent_code_diagonal > 0.0572034604847
              if (percent_code_vertical <= 0.223333328962)
                return '=';
              else  // if percent_code_vertical > 0.223333328962
                if (percent_code_diagonal <= 0.108166538179)
                  return 'S';
                else  // if percent_code_diagonal > 0.108166538179
                  return '&';
        else  // if n_junction > 1.0
          return 'x';
      else  // if n_junction_left > 0.5
        return 'K';
    else  // if n_edge > 0.5
      if (n_edge <= 1.5)
        if (n_edge_bottom <= 0.5)
          if (n_junction_left <= 0.5)
            if (n_edge_top <= 0.5)
              return 'z';
            else  // if n_edge_top > 0.5
              return 'n';
          else  // if n_junction_left > 0.5
            if (n_edge_left <= 0.5)
              return 'p';
            else  // if n_edge_left > 0.5
              return 'f';
        else  // if n_edge_bottom > 0.5
          if (n_junction_right <= 0.5)
            if (n_edge_left <= 0.5)
              if (percent_code_horizontal <= 0.386249989271)
                return '/';
              else  // if percent_code_horizontal > 0.386249989271
                if (percent_code_vertical <= 0.38250002265)
                  return 'r';
                else  // if percent_code_vertical > 0.38250002265
                  return 'C';
            else  // if n_edge_left > 0.5
              if (n_junction <= 0.5)
                return 'D';
              else  // if n_junction > 0.5
                if (percent_code_horizontal <= 0.293749988079)
                  return 'P';
                else  // if percent_code_horizontal > 0.293749988079
                  if (n_junction_left <= 0.5)
                    return '|';
                  else  // if n_junction_left > 0.5
                    return '.';
          else  // if n_junction_right > 0.5
            if (percent_code_diagonal <= 0.0908321589231)
              return 'h';
            else  // if percent_code_diagonal > 0.0908321589231
              if (percent_code_horizontal <= 0.247500002384)
                return '4';
              else  // if percent_code_horizontal > 0.247500002384
                if (percent_code_horizontal <= 0.263750016689)
                  return 'b';
                else  // if percent_code_horizontal > 0.263750016689
                  return 'E';
      else  // if n_edge > 1.5
        if (n_junction <= 0.5)
          if (n_edge_left <= 0.5)
            if (n_edge_top <= 0.5)
              if (n_edge_right <= 1.0)
                return '!';
              else  // if n_edge_right > 1.0
                if (percent_code_diagonal <= 0.168490186334)
                  return 'j';
                else  // if percent_code_diagonal > 0.168490186334
                  return 'O';
            else  // if n_edge_top > 0.5
              if (percent_code_horizontal <= 0.465000003576)
                return '8';
              else  // if percent_code_horizontal > 0.465000003576
                if (percent_code_vertical <= 0.275833308697)
                  return '3';
                else  // if percent_code_vertical > 0.275833308697
                  return 'c';
          else  // if n_edge_left > 0.5
            if (n_edge_right <= 0.5)
              if (percent_code_vertical <= 0.0900000035763)
                return ';';
              else  // if percent_code_vertical > 0.0900000035763
                if (percent_code_vertical <= 0.191666662693)
                  return '<';
                else  // if percent_code_vertical > 0.191666662693
                  if (n_edge_bottom <= 0.5)
                    if (percent_code_vertical <= 0.239166676998)
                      return '?';
                    else  // if percent_code_vertical > 0.239166676998
                      if (percent_code_diagonal <= 0.169183552265)
                        return 'o';
                      else  // if percent_code_diagonal > 0.169183552265
                        return 'd';
                  else  // if n_edge_bottom > 0.5
                    if (percent_code_vertical <= 0.470833361149)
                      return 't';
                    else  // if percent_code_vertical > 0.470833361149
                      return 'u';
            else  // if n_edge_right > 0.5
              if (percent_code_diagonal <= 0.0194145068526)
                return 'Z';
              else  // if percent_code_diagonal > 0.0194145068526
                if (n_edge <= 2.5)
                  if (n_edge_bottom <= 0.5)
                    if (percent_code_diagonal <= 0.0648305863142)
                      return '%';
                    else  // if percent_code_diagonal > 0.0648305863142
                      if (n_edge_top <= 1.0)
                        if (percent_code_horizontal <= 0.503750026226)
                          return '}';
                        else  // if percent_code_horizontal > 0.503750026226
                          if (percent_code_diagonal <= 0.21529302001)
                            return 'M';
                          else  // if percent_code_diagonal > 0.21529302001
                            return ':';
                      else  // if n_edge_top > 1.0
                        if (percent_code_horizontal <= 0.0337499976158)
                          return 'F';
                        else  // if percent_code_horizontal > 0.0337499976158
                          if (percent_code_vertical <= 0.553333342075)
                            return 'Y';
                          else  // if percent_code_vertical > 0.553333342075
                            if (percent_code_vertical <= 0.821666657925)
                              return 'B';
                            else  // if percent_code_vertical > 0.821666657925
                              if (percent_code_diagonal <= 0.146995544434)
                                return 'a';
                              else  // if percent_code_diagonal > 0.146995544434
                                return 'J';
                  else  // if n_edge_bottom > 0.5
                    if (n_edge_bottom <= 1.5)
                      if (percent_code_diagonal <= 0.0457627661526)
                        return 'w';
                      else  // if percent_code_diagonal > 0.0457627661526
                        if (n_edge_top <= 0.5)
                          return 'X';
                        else  // if n_edge_top > 0.5
                          if (percent_code_diagonal <= 0.0929122790694)
                            return '0';
                          else  // if percent_code_diagonal > 0.0929122790694
                            if (percent_code_diagonal <= 0.140061795712)
                              return 'l';
                            else  // if percent_code_diagonal > 0.140061795712
                              if (percent_code_vertical <= 0.142499998212)
                                return 'm';
                              else  // if percent_code_vertical > 0.142499998212
                                if (percent_code_vertical <= 0.204999998212)
                                  return 'L';
                                else  // if percent_code_vertical > 0.204999998212
                                  if (percent_code_vertical <= 0.688333332539)
                                    return 'V';
                                  else  // if percent_code_vertical > 0.688333332539
                                    return '"';
                    else  // if n_edge_bottom > 1.5
                      return '{';
                else  // if n_edge > 2.5
                  if (n_edge_right <= 1.5)
                    if (percent_code_diagonal <= 0.0478428937495)
                      return '_';
                    else  // if percent_code_diagonal > 0.0478428937495
                      return 'Q';
                  else  // if n_edge_right > 1.5
                    return '7';
        else  // if n_junction > 0.5
          if (n_junction <= 1.5)
            if (n_junction_top <= 0.5)
              if (n_junction_left <= 0.5)
                if (n_edge_top <= 0.5)
                  if (percent_code_vertical <= 0.61333334446)
                    return 'T';
                  else  // if percent_code_vertical > 0.61333334446
                    return '5';
                else  // if n_edge_top > 0.5
                  if (n_edge_left <= 1.5)
                    if (percent_code_vertical <= 0.309166669846)
                      return 'q';
                    else  // if percent_code_vertical > 0.309166669846
                      if (percent_code_diagonal <= 0.127927735448)
                        return 'U';
                      else  // if percent_code_diagonal > 0.127927735448
                        return 'R';
                  else  // if n_edge_left > 1.5
                    if (percent_code_diagonal <= 0.184784501791)
                      return 'y';
                    else  // if percent_code_diagonal > 0.184784501791
                      return 'i';
              else  // if n_junction_left > 0.5
                if (n_edge_bottom <= 1.5)
                  if (percent_code_diagonal <= 0.0897920951247)
                    return 'W';
                  else  // if percent_code_diagonal > 0.0897920951247
                    return 'I';
                else  // if n_edge_bottom > 1.5
                  if (percent_code_diagonal <= 0.121340669692)
                    return '9';
                  else  // if percent_code_diagonal > 0.121340669692
                    return '~';
            else  // if n_junction_top > 0.5
              return '>';
          else  // if n_junction > 1.5
            if (n_junction_top <= 0.5)
              if (percent_code_vertical <= 0.206666663289)
                return 'e';
              else  // if percent_code_vertical > 0.206666663289
                if (n_edge_right <= 0.5)
                  return 'A';
                else  // if n_edge_right > 0.5
                  if (percent_code_horizontal <= 0.104999996722)
                    return 'N';
                  else  // if percent_code_horizontal > 0.104999996722
                    if (n_junction_left <= 0.5)
                      if (n_edge_bottom <= 1.5)
                        if (percent_code_vertical <= 0.3125)
                          return '@';
                        else  // if percent_code_vertical > 0.3125
                          if (percent_code_vertical <= 0.365833342075)
                            return '2';
                          else  // if percent_code_vertical > 0.365833342075
                            return 'v';
                      else  // if n_edge_bottom > 1.5
                        return 'G';
                    else  // if n_junction_left > 0.5
                      if (percent_code_horizontal <= 0.363749980927)
                        return 's';
                      else  // if percent_code_horizontal > 0.363749980927
                        if (n_edge_top <= 0.5)
                          return '6';
                        else  // if n_edge_top > 0.5
                          if (percent_code_diagonal <= 0.112326793373)
                            return 'g';
                          else  // if percent_code_diagonal > 0.112326793373
                            return ')';
            else  // if n_junction_top > 0.5
              if (n_edge_bottom <= 1.0)
                return ',';
              else  // if n_edge_bottom > 1.0
                if (n_junction <= 2.5)
                  return 'k';
                else  // if n_junction > 2.5
                  return '(';
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