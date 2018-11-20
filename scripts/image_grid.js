

const IG_COLOR_RED = [255, 0, 0, 255];
const IG_COLOR_GREEN = [0, 255, 0, 255];
const IG_COLOR_BLUE = [0, 0, 255, 255];
const IG_COLOR_BLACK = [0, 0, 0, 255];
const IG_COLOR_WHITE = [255, 255, 255, 255];

class ImageGrid {

    // type of data is Uint8ClampedArray
    constructor (data, width, height) {
        this.data = data;
        this.width = width;
        this.height = height;
    }

    // color is array [r,g,b,a]
    setImagePixel(x, y, color) {
        var offset = (y * this.width + x)*4;
        for (var i = 0; i < color.length; i++) {
            this.data[offset + i] = color[i];
        }
    }

    getImagePixel(x, y) {
        var offset = (y * this.width + x)*4;
        var color = [0,0,0,0]; // color is array [r,g,b,a]
        for (var i = 0; i < color.length; i++) {
            color[i] = this.data[offset + i];
        }

        return color;
    }

    // detect character boundary, assuming character is black
    getCharacter() {
        var max_x = 0;
        var max_y = 0;
        var min_x = 999999999;
        var min_y = 999999999;
        for (var y = 0; y < this.height; y++) {
            for (var x = 0; x < this.width; x++) {
                if (this.getImagePixel(x, y)[0] == IG_COLOR_BLACK[0]) {
                    if (x < min_x) min_x = x;
                    if (y < min_y) min_y = y;
                    if (x > max_x) max_x = x;
                    if (y > max_y) max_y = y;
                }
            }
        }

        var boundary = [[min_x, min_y], [max_x, max_y]];

        var char_width = max_x-min_x+1;
        var char_height = max_y-min_y+1;
        var char_grid = new Array(char_height);
        for (var y = min_y; y <= max_y; y++) {
            char_grid[y-min_y] = new Array(char_width);
            for (var x = min_x; x <= max_x; x++) {
                char_grid[y-min_y][x-min_x] = (this.getImagePixel(x, y)[0] == IG_COLOR_BLACK[0]) ? 1 : 0;
            }
        }

        return {
            grid: char_grid,
            boundary: boundary
        };
    }

    drawSquare(x, y, color) {
        for (var i = x-3; i <= x+3; i++) {
            this.setImagePixel(i, y-3, color);
            this.setImagePixel(i, y+3, color);
        }
        for (var i = y-3; i < y+3; i++) {
            this.setImagePixel(x-3, i, color);
            this.setImagePixel(x+3, i, color);
        }
    }


    // draw border
    drawBorder(boundary) {
        var min_x = boundary[0][0];
        var min_y = boundary[0][1];
        var max_x = boundary[1][0];
        var max_y = boundary[1][1];
        
        for (var y = min_y - 1; y < max_y + 1; y++) {
            this.setImagePixel(min_x - 1, y, IG_COLOR_RED);
            this.setImagePixel(max_x + 1, y, IG_COLOR_RED);
        }
        for (var x = min_x - 1; x <= max_x + 1; x++) {
            this.setImagePixel(x, min_y - 1, IG_COLOR_RED);
            this.setImagePixel(x, max_y + 1, IG_COLOR_RED);
        }
    }

    // assuming threshold is between 0 and 100 (percentage)
    makeBlackWhite(threshold) {
        var threshold_byte = threshold * 255 / 100;
        for (var y = 0; y < this.height; y++) {
            for (var x = 0; x < this.width; x++) {
                var crt_color = this.getImagePixel(x, y);
                var avg_color = (crt_color[0] + crt_color[1] + crt_color[2])/3;

                if (avg_color <= threshold_byte) {
                    this.setImagePixel(x, y, IG_COLOR_BLACK);
                } else {
                    this.setImagePixel(x, y, IG_COLOR_WHITE);
                }
            }
        }
    }

    rgbToHSV(r, g, b) {
        r /= 255, g /= 255, b /= 255;

        var max = Math.max(r, g, b), min = Math.min(r, g, b);
        var h, s, v = max;
      
        var d = max - min;
        s = max == 0 ? 0 : d / max;
      
        if (max == min) {
            h = 0; // achromatic
        } else {
            switch (max) {
                case r: h = (g - b) / d + (g < b ? 6 : 0); break;
                case g: h = (b - r) / d + 2; break;
                case b: h = (r - g) / d + 4; break;
          }
      
          h /= 6;
        }
      
        return [ h, s, v ];
    }

    rgbToYcbcr(r, g, b) {
        return [16 + (65.481*r + 128.553*g + 24.966*b),
            128 + (-37.797*r - 74.203*g + 112*b),
            128 + (112*r - 93.786*g - 18.214*b)];
    }

    isPixelSkin(color_rgba, color_hsv, color_ycbcr) {
        var isSkin = false;

        var R = color_rgba[0];
        var G = color_rgba[1];
        var B = color_rgba[2];
        var A = color_rgba[3];
        var H = color_hsv[0];
        var S = color_hsv[1];
        var V = color_hsv[2];
        var Y = color_ycbcr[0];
        var Cb = color_ycbcr[1];
        var Cr = color_ycbcr[2];

        if ( H > 0.0 && H <=50.0 && S > 0.23 && S <= 0.68 && R > 95 && G > 40 && B > 20 && R > G && R > B && Math.abs(R - G) > 15 && A > 15) {
            isSkin = true;
        }

        if (R > 95 && 
            G > 40 && 
            B > 20 &&
            R > G &&
            R > B &&
            Math.abs(R-G) > 15 && 
            A > 15 &&
            Cr > 135 &&
            Cb > 85 &&
            Y > 80 &&
            Cr <= (1.5862*Cb)+20 &&
            Cr >= (0.3448*Cb)+76.2069 &&
            Cr >= (-4.5652*Cb)+234.5652 &&
            Cr <= (-1.15*Cb)+301.75 &&
            Cr <= (-2.2857*Cb)+432.85) {
                isSkin = true;
            }

        return isSkin;
    }

    detectHumanSkin() {

        /**
 * DBSCAN - Density based clustering
 *
 * @author Lukasz Krawczyk <contact@lukaszkrawczyk.eu>
 * @copyright MIT
 */

/**
 * DBSCAN class construcotr
 * @constructor
 *
 * @param {Array} dataset
 * @param {number} epsilon
 * @param {number} minPts
 * @param {function} distanceFunction
 * @returns {DBSCAN}
 */
function DBSCAN(dataset, epsilon, minPts, distanceFunction) {
    /** @type {Array} */
    this.dataset = [];
    /** @type {number} */
    this.epsilon = 1;
    /** @type {number} */
    this.minPts = 2;
    /** @type {function} */
    this.distance = this._euclideanDistance;
    /** @type {Array} */
    this.clusters = [];
    /** @type {Array} */
    this.noise = [];
  
    // temporary variables used during computation
  
    /** @type {Array} */
    this._visited = [];
    /** @type {Array} */
    this._assigned = [];
    /** @type {number} */
    this._datasetLength = 0;
  
    this._init(dataset, epsilon, minPts, distanceFunction);
  };
  
  /******************************************************************************/
  // public functions
  
  /**
   * Start clustering
   *
   * @param {Array} dataset
   * @param {number} epsilon
   * @param {number} minPts
   * @param {function} distanceFunction
   * @returns {undefined}
   * @access public
   */
  DBSCAN.prototype.run = function(dataset, epsilon, minPts, distanceFunction) {
    this._init(dataset, epsilon, minPts, distanceFunction);
  
    for (var pointId = 0; pointId < this._datasetLength; pointId++) {
      // if point is not visited, check if it forms a cluster
      if (this._visited[pointId] !== 1) {
        this._visited[pointId] = 1;
  
        // if closest neighborhood is too small to form a cluster, mark as noise
        var neighbors = this._regionQuery(pointId);
  
        if (neighbors.length < this.minPts) {
          this.noise.push(pointId);
        } else {
          // create new cluster and add point
          var clusterId = this.clusters.length;
          this.clusters.push([]);
          this._addToCluster(pointId, clusterId);
  
          this._expandCluster(clusterId, neighbors);
        }
      }
    }
  
    return this.clusters;
  };
  
  /******************************************************************************/
  // protected functions
  
  /**
   * Set object properties
   *
   * @param {Array} dataset
   * @param {number} epsilon
   * @param {number} minPts
   * @param {function} distance
   * @returns {undefined}
   * @access protected
   */
  DBSCAN.prototype._init = function(dataset, epsilon, minPts, distance) {
  
    if (dataset) {
  
      if (!(dataset instanceof Array)) {
        throw Error('Dataset must be of type array, ' +
          typeof dataset + ' given');
      }
  
      this.dataset = dataset;
      this.clusters = [];
      this.noise = [];
  
      this._datasetLength = dataset.length;
      this._visited = new Array(this._datasetLength);
      this._assigned = new Array(this._datasetLength);
    }
  
    if (epsilon) {
      this.epsilon = epsilon;
    }
  
    if (minPts) {
      this.minPts = minPts;
    }
  
    if (distance) {
      this.distance = distance;
    }
  };
  
  /**
   * Expand cluster to closest points of given neighborhood
   *
   * @param {number} clusterId
   * @param {Array} neighbors
   * @returns {undefined}
   * @access protected
   */
  DBSCAN.prototype._expandCluster = function(clusterId, neighbors) {
  
    /**
     * It's very important to calculate length of neighbors array each time,
     * as the number of elements changes over time
     */
    for (var i = 0; i < neighbors.length; i++) {
      var pointId2 = neighbors[i];
  
      if (this._visited[pointId2] !== 1) {
        this._visited[pointId2] = 1;
        var neighbors2 = this._regionQuery(pointId2);
  
        if (neighbors2.length >= this.minPts) {
          neighbors = this._mergeArrays(neighbors, neighbors2);
        }
      }
  
      // add to cluster
      if (this._assigned[pointId2] !== 1) {
        this._addToCluster(pointId2, clusterId);
      }
    }
  };
  
  /**
   * Add new point to cluster
   *
   * @param {number} pointId
   * @param {number} clusterId
   */
  DBSCAN.prototype._addToCluster = function(pointId, clusterId) {
    this.clusters[clusterId].push(pointId);
    this._assigned[pointId] = 1;
  };
  
  /**
   * Find all neighbors around given point
   *
   * @param {number} pointId,
   * @param {number} epsilon
   * @returns {Array}
   * @access protected
   */
  DBSCAN.prototype._regionQuery = function(pointId) {
    var neighbors = [];
  
    for (var id = 0; id < this._datasetLength; id++) {
      var dist = this.distance(this.dataset[pointId], this.dataset[id]);
      if (dist < this.epsilon) {
        neighbors.push(id);
      }
    }
  
    return neighbors;
  };
  
  /******************************************************************************/
  // helpers
  
  /**
   * @param {Array} a
   * @param {Array} b
   * @returns {Array}
   * @access protected
   */
  DBSCAN.prototype._mergeArrays = function(a, b) {
    var len = b.length;
  
    for (var i = 0; i < len; i++) {
      var P = b[i];
      if (a.indexOf(P) < 0) {
        a.push(P);
      }
    }
  
    return a;
  };
  
  /**
   * Calculate euclidean distance in multidimensional space
   *
   * @param {Array} p
   * @param {Array} q
   * @returns {number}
   * @access protected
   */
  DBSCAN.prototype._euclideanDistance = function(p, q) {
    var sum = 0;
    var i = Math.min(p.length, q.length);
  
    while (i--) {
      sum += (p[i] - q[i]) * (p[i] - q[i]);
    }
  
    return Math.sqrt(sum);
  };
  
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = DBSCAN;
  }

        var point_data = [];

        var x_min = 999999;
        var y_min = 999999;
        var x_max = 0;
        var y_max = 0;
        for (var y = 0; y < this.height; y++) {
            for (var x = 0; x < this.width; x++) {
                var color_rgba = this.getImagePixel(x, y);
                var color_hsv = this.rgbToHSV(color_rgba[0], color_rgba[1], color_rgba[2]);
                var color_ycbcr = this.rgbToYcbcr(color_rgba[0], color_rgba[1], color_rgba[2])
                if (!this.isPixelSkin(color_rgba, color_hsv, color_ycbcr)) {
                    this.setImagePixel(x, y, IG_COLOR_BLACK);
                } else {
                    point_data.push([x,y]);
                    if (x < x_min) x_min = x;
                    if (y < y_min) y_min = y;
                    if (x > x_max) x_max = x;
                    if (y > y_max) y_max = y;
                }
            }
        }

        console.log(point_data);

        // var dbscanner = jDBSCAN().eps(300).minPts(1).distance('EUCLIDEAN').data(point_data);
        // var point_assignment_result = dbscanner();
        // console.log(point_assignment_result);

        var dbscan = new DBSCAN();
        var clusters = dbscan.run(point_data, 10, 10);
        console.log(clusters);

        for (var x = 0; x < clusters.length; x++) {
            // x_min = point_data[i][0];
            // y_min = point_data[i][1];
            // x_max = point_data[clusters[i].length-1][0];
            for (var i = x_min; i <= x_max; i++) {
                this.setImagePixel(i, y_min, IG_COLOR_RED);
                this.setImagePixel(i, y_max, IG_COLOR_RED);
            }
            for (var i = y_min; i <= y_max; i++) {
                this.setImagePixel(x_min, i, IG_COLOR_RED);
                this.setImagePixel(x_max, i, IG_COLOR_RED);
            }
        }


        console.log(y_min, y_max, x_min, x_max);

        // draw square
        for (var i = x_min; i <= x_max; i++) {
            this.setImagePixel(i, y_min, IG_COLOR_RED);
            this.setImagePixel(i, y_max, IG_COLOR_RED);
        }
        for (var i = y_min; i <= y_max; i++) {
            this.setImagePixel(x_min, i, IG_COLOR_RED);
            this.setImagePixel(x_max, i, IG_COLOR_RED);
        }
    }

    static convertDataToGrid(data, height, width) {
        var grid = [];
        for (var y = 0; y < height; y++) {
            grid.push(new Array(width));
            for(var x = 0; x < width; x++) {
                var offset = (y * width + x)*4;
                var color = [data[offset], data[offset+1], data[offset+2], data[offset+3]];
                grid[y][x] = color;
            }
        }

        return grid;
    }

    static convertGridToData(grid) {
        var img_data = new Uint8ClampedArray(grid.length * grid[0].length * 4);
        
        var i = 0;
        for (var y = 0; y < grid.length; y++) {
            for(var x = 0; x < grid[0].length; x++) {
                for(var cnl = 0; cnl < 4; cnl++) {
                    img_data[i] = (grid[y][x][cnl]);
                    i = i+1;
                }
            }
        }
        return img_data;
    }

}