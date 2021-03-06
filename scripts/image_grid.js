

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

        this.otsu_data_maxSum = 0;
        this.otsu_data_thresholds = [];
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

    getImageFirstChannel() {
        var arr = [];
        for (var y = 0; y < this.height; y++) {
            for (var x = 0; x < this.width; x++) {
                arr.push(this.getImagePixel(x, y)[0])
            }
        }
        return arr;
    }

    getImageSecondChannel() {
        var arr = [];
        for (var y = 0; y < this.height; y++) {
            for (var x = 0; x < this.width; x++) {
                arr.push(this.getImagePixel(x, y)[1])
            }
        }
        return arr;
    }

    getImageThirdChannel() {
        var arr = [];
        for (var y = 0; y < this.height; y++) {
            for (var x = 0; x < this.width; x++) {
                arr.push(this.getImagePixel(x, y)[2])
            }
        }
        return arr;
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

    isPixelSkin(x, y) {
        var isSkin = false;

        var color_rgba = this.getImagePixel(x, y);
        var color_hsv = this.rgbToHSV(color_rgba[0], color_rgba[1], color_rgba[2]);
        var color_ycbcr = this.rgbToYcbcr(color_rgba[0], color_rgba[1], color_rgba[2])

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

        if (H >= 0.0 && H <=50.0 && 
            S >= 0.23 && S <= 0.68 && 
            R > 95 && G > 40 && B > 20 && R > G && R > B && 
            Math.abs(R - G) > 15 && A > 15) {
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

    logOpp(x) {
        return Math.log10(x+1) * 105;
    }

    skinFilter() {
        var R,G,B;
        R = this.getImageFirstChannel();
        G = this.getImageSecondChannel();
        B = this.getImageThirdChannel();
        // console.log(R);
        // console.log(G);
        // console.log(B);

        var I = [];
        var Rg = [];
        var By = [];

        for (var i = 0; i < R.length; ++i) {
            I.push(Math.trunc((this.logOpp(R[i]) + this.logOpp(G[i]) + this.logOpp(B[i]))/3));
        }

        for (var i = 0; i < R.length; ++i) {
            Rg.push(Math.trunc((this.logOpp(R[i])) - (this.logOpp(G[i]))));
        }

        for (var i = 0; i < R.length; ++i) {
            By.push(Math.trunc(this.logOpp(B[i]) - (this.logOpp(R[i]) + this.logOpp(R[i]))/2));
        }

        
        var scale = Math.trunc((this.height + this.width)/320);
        
        if (scale == 0) {
            scale = 1;
        }
        
        Rg = this.processImageMedianFilter(Rg, this.height, this.width, 2*2*scale);
        By = this.processImageMedianFilter(By, this.height, this.width, 2*2*scale);
        
        // console.log(I);
        // console.log(Rg);
        // console.log(By);
        
        var I_filt = this.processImageMedianFilter(I, this.height, this.width, 2*4*scale);

        var MAD = Array();

        for(var i = 0; i < I.length; ++i) {
            MAD.push(Math.abs(I[i] - I_filt[i]));
        }

        MAD = this.processImageMedianFilter(MAD, this.height, this.width, 2*6*scale);

        var hue = [];

        for (var i = 0; i < I.length; ++i) {
            hue.push(Math.trunc(Math.atan2(Rg[i],By[i]) * 180 / Math.PI));
        }

        var saturation = Array();

        for (var i = 0; i < I.length; ++i) {
            saturation.push(Math.trunc(Math.sqrt(Math.pow(Rg[i], 2) + Math.pow(By[i], 2))));
        }

        // console.log(MAD);
        // console.log(hue);
        // console.log(saturation);
        
        var map = Array();

        for (var i = 0; i < I.length; ++i) {
            var color = 0;

            if (MAD[i] < 4.5 & 120 < hue[i] & hue[i] < 160 & 10 < saturation[i] & saturation[i] < 60) {
                color = 1;
                // console.log("COLOR");
            }

            if (MAD[i] < 4.5 & 150 < hue[i] & hue[i] < 180 & saturation[i] > 20 & saturation[i] < 80) {
                color = 1;
            }

            map.push(color);
        }

        // console.log(map);

        var point_data = [];    // store all human skin pixel location
        var visited = [];

        var x_min = 999999;
        var y_min = 999999;
        var x_max = 0;
        var y_max = 0;
        for (var y = 0; y < this.height; y++) {
            for (var x = 0; x < this.width; x++) {
                var idx = y * this.width + x;
                if (map[idx] == 0) {
                    this.setImagePixel(x, y, IG_COLOR_BLACK);
                } else {
                    point_data.push({ x: x, y: y, visited: false });
                    if (visited[x] == undefined) visited[x] = [];
                    visited[x][y] = false;

                    if (x < x_min) x_min = x;
                    if (y < y_min) y_min = y;
                    if (x > x_max) x_max = x;
                    if (y > y_max) y_max = y;
                }
            }
        }

        // start flooding to get face candidate
        var MIN_PIXEL_PER_CLUSTER = 25;
        var clusters = [];
        for (var i = 0; i < point_data.length; i++) {
            var crt_cluster = [];
            var x_min_cluster = 999999;
            var y_min_cluster = 999999;
            var x_max_cluster = 0;
            var y_max_cluster = 0;

            var flood_queue = [];
            flood_queue.push({ x: point_data[i].x, y: point_data[i].y });
            while (flood_queue.length > 0) {
                var crt_pixel = flood_queue.pop();
                var x = crt_pixel.x;
                var y = crt_pixel.y;

                if (visited[x][y] == true) {
                    break;
                } else {
                    visited[x][y] = true;
                    crt_cluster.push({ x: x, y: y });
                    if (x < x_min_cluster) x_min_cluster = x;
                    if (y < y_min_cluster) y_min_cluster = y;
                    if (x > x_max_cluster) x_max_cluster = x;
                    if (y > y_max_cluster) y_max_cluster = y;
                }

                if (y - 1 >= 0) {
                    if (map[(y-1) * this.width + x] == 1) flood_queue.push({ x: x, y: y - 1 });
                    if (map[(y - 1) * this.width + x] == 0) this.setImagePixel(x, y - 1, IG_COLOR_GREEN);
                }
                if (y - 1 >= 0 && x + 1 < this.width) {
                    if (map[(y-1) * this.width + x + 1] == 1) flood_queue.push({ x: x + 1, y: y - 1 });
                    if (map[(y-1) * this.width + x + 1] == 0) this.setImagePixel(x + 1, y - 1, IG_COLOR_GREEN);
                }
                if (x + 1 < this.width) {
                    if (map[(y) * this.width + x + 1] == 1) flood_queue.push({ x: x + 1, y: y });
                    if (map[(y) * this.width + x + 1] == 0) this.setImagePixel(x + 1, y, IG_COLOR_GREEN);
                }
                if (x + 1 < this.width && y + 1 < this.height) {
                    if (map[(y + 1) * this.width + x + 1] == 1) flood_queue.push({ x: x + 1, y: y + 1 });
                    if (map[(y + 1) * this.width + x + 1] == 0) this.setImagePixel(x + 1, y + 1, IG_COLOR_GREEN);
                }
                if (y + 1 < this.height) {
                    if (map[(y+1) * this.width + x] == 1) flood_queue.push({ x: x, y: y + 1 });
                    if (map[(y+1) * this.width + x] == 0) this.setImagePixel(x, y + 1, IG_COLOR_GREEN);
                }
                if (y + 1 < this.height && x - 1 >= 0) {
                    if (map[(y+1) * this.width + x-1] == 1) flood_queue.push({ x: x - 1, y: y + 1 });
                    if (map[(y+1) * this.width + x-1] == 0) this.setImagePixel(x - 1, y + 1, IG_COLOR_GREEN);
                }
                if (x - 1 >= 0) {
                    if (map[(y) * this.width + x-1] == 1) flood_queue.push({ x: x - 1, y: y });
                    if (map[(y) * this.width + x-1] == 0) this.setImagePixel(x - 1, y, IG_COLOR_GREEN);
                }

            }

            if (crt_cluster.length > MIN_PIXEL_PER_CLUSTER) {
                clusters.push({
                    member: crt_cluster,
                    top_left: {
                        x: x_min_cluster,
                        y: y_min_cluster
                    },
                    bottom_right: {
                        x: x_max_cluster,
                        y: y_max_cluster
                    },
                });
            }
        }

        for (var j = 0; j < clusters.length; j++) {
            var y_min = clusters[j].top_left.y;
            var x_min = clusters[j].top_left.x;
            var y_max = clusters[j].bottom_right.y;
            var x_max = clusters[j].bottom_right.x;

            for (var i = x_min; i <= x_max; i++) {
                this.setImagePixel(i, y_min, IG_COLOR_RED);
                this.setImagePixel(i, y_max, IG_COLOR_RED);
            }
            for (var i = y_min; i <= y_max; i++) {
                this.setImagePixel(x_min, i, IG_COLOR_RED);
                this.setImagePixel(x_max, i, IG_COLOR_RED);
            }
        }

        
    }


    processImageMedianFilter(img, height, width, kernel_size) {
        var grid = Array(height);
        for (var i = 0; i < height; i++) {
            grid[i] = Array(width);
        }

        var result = Array();

        var size = Math.ceil(kernel_size / 2);
        var get_median = function (img, r, c, kernel_size) {
            var channel_array = Array();
            
            for (var i = -size; i <= size; i++) {
                for (var j = -size; j <= size; j++) {
                    channel_array.push(img[(r + j) * width + (c + i) ]);
                }
            }

            var sorted_channel = channel_array.sort();

            return sorted_channel[Math.trunc(kernel_size*kernel_size/2)];
        }

        for (var r = 0; r < height; r++) {
            for (var c = 0; c < width; c++) {
                if (c > size && r > size) {
                    result.push(get_median(img, r, c, kernel_size));
                } else {
                    result.push(img[r * width + c])
                }
            }
        }

        return result;
    } 

    calculateHistogram(x_min, y_min, x_max, y_max) {
        var histogram = new Array(256);
        histogram.fill(1);

        for(var i = 0; i < x_max-x_min+1; i++) {
            for(var j = 0; j < y_max-y_min+1; j++) {
                var color = this.getImagePixel(x_min + i, y_min + j);
                var luma = (11 * color[0] + 16 * color[1] + 5 * color[2]) >> 5;
                histogram[luma]++;
            }
        }
 
        return histogram;
    }

    createLookUpTable(histogram) {
        // calculate cumulative sum table
        var P = new Array(histogram.length + 1);
        var S = new Array(histogram.length + 1);
        P[0] = 0;
        S[0] = 0;

        var sumP = 0;
        var sumS = 0;

        for (var i = 0; i < histogram.length; i++) {
            sumP += histogram[i];
            sumS += i * histogram[i];
            P[i+1] = sumP;
            S[i+1] = sumS;
        }

        // calculate the between-class variance for the interval u-v
        var H = new Array(histogram.length * histogram.length);
        H.fill(0.);

        for (var u = 0; u < histogram.length; u++)
            for (var v = u + 1; v < histogram.length; v++) {
                H[v + u * histogram.length] = Math.pow(S[v] - S[u], 2) / (P[v] - P[u]);
            }
                

        return H;
    }

    getOtsuThreshold(histogram) {
        this.otsu_data_maxSum = 0;
        this.otsu_data_thresholds = new Array(1);
        this.otsu_data_thresholds.fill(0)

        var lookUpTable = this.createLookUpTable(histogram);
        var index = new Array(3);
        index[0] = 0;
        index[2] = histogram.length-1;

        this.otsu_for_loop(lookUpTable, 1, histogram.length - 3, 1, histogram.length, index);

        return this.otsu_data_thresholds[0];
    }

    otsu_for_loop(H, u, vmax, level, levels, index) {
        var classes = index.length - 1;

        for (var i = u; i < vmax; i++) {
            index[level] = i;

            if (level + 1 >= classes) {
                // Reached the end of the for loop.

                // Calculate the quadratic sum of al intervals.
                var sum = 0.;

                for (var c = 0; c < classes; c++) {
                    var u = index[c];
                    var v = index[c + 1];
                    var s = H[v + u * levels];
                    sum += s;
                }

                if (this.otsu_data_maxSum < sum) {
                    // Return calculated threshold.
                    this.otsu_data_thresholds = index.slice(1, index.length - 1);
                    this.otsu_data_maxSum = sum;
                }
            } else
                // Start a new for loop level, one position after current one.
                otsu_for_loop(H,
                        i + 1,
                        vmax + 1,
                        level + 1,
                        levels,
                        index);
        }
    }

    otsuBinarization(x_min, y_min, x_max, y_max) {
        var histogram = this.calculateHistogram(x_min, y_min, x_max, y_max);

        var threshold = this.getOtsuThreshold(histogram);
        // console.log(threshold);

        for(var i = 0; i < x_max-x_min+1; i++) {
            for(var j = 0; j < y_max-y_min+1; j++) {
                var color = this.getImagePixel(x_min + i, y_min + j);
                var luma = (11 * color[0] + 16 * color[1] + 5 * color[2]) >> 5;
                if (luma > threshold) {
                    this.setImagePixel(x_min+i, y_min+j, IG_COLOR_WHITE);
                } else {
                    this.setImagePixel(x_min+i, y_min+j, IG_COLOR_BLACK);
                }
            }
        }
    }

    getFaceCandidateCluster(visited, map) {
        var MIN_PIXEL_PER_CLUSTER = 1500;
        var clusters = [];

        for (var j = 0; j < this.height; j++) {
            for (var i = 0; i < this.width; i++) {
                var crt_cluster = [];
                var x_min_cluster = 999999;
                var y_min_cluster = 999999;
                var x_max_cluster = 0;
                var y_max_cluster = 0;

                if (visited[j][i] == false) {
                    var flood_queue = [];
                    var point = [i, j];
                    flood_queue.push(point);
                    while (flood_queue.length > 0) {
                        var crt_pixel = flood_queue.pop();
                        var x = crt_pixel[0];
                        var y = crt_pixel[1];

                        if (visited[y][x] == true) {
                            continue;
                        } else {
                            visited[y][x] = true;
                            crt_cluster.push({ x: x, y: y });
                            if (x < x_min_cluster) x_min_cluster = x;
                            if (y < y_min_cluster) y_min_cluster = y;
                            if (x > x_max_cluster) x_max_cluster = x;
                            if (y > y_max_cluster) y_max_cluster = y;
                        }

                        if (y - 1 >= 0) {
                            if (visited[y-1][x] == false) {
                                var point = [x, y - 1];
                                if (map[y - 1][x] == 1) flood_queue.push(point);
                                if (map[y - 1][x] == 0) this.setImagePixel(x, y - 1, IG_COLOR_GREEN);
                            }
                        }
                        if (x + 1 < this.width) {
                            if (visited[y][x+1] == false) {
                                var point = [x + 1, y];
                                if (map[y][x + 1] == 1) flood_queue.push(point);
                                if (map[y][x + 1] == 0) this.setImagePixel(x + 1, y, IG_COLOR_GREEN);
                            }
                        }
                        if (y + 1 < this.height) {
                            if (visited[y + 1][x] == false) {
                                var point = [x, y + 1];
                                if (map[y + 1][x] == 1) flood_queue.push(point);
                                if (map[y + 1][x] == 0) this.setImagePixel(x, y + 1, IG_COLOR_GREEN);
                            }
                        }
                        if (x - 1 >= 0) {
                            if (visited[y][x-1] == false) {
                                var point = [x - 1, y];
                                if (map[y][x - 1] == 1) flood_queue.push(point);
                                if (map[y][x - 1] == 0) this.setImagePixel(x - 1, y, IG_COLOR_GREEN);
                            }
                        }
                    }
                }

                if (crt_cluster.length > MIN_PIXEL_PER_CLUSTER) {

                    // cek rasio widthxheight kandidat muka [0.8 - 1.6]
                    var cluster_width = x_max_cluster-x_min_cluster+1;
                    var cluster_height = y_max_cluster-y_min_cluster+1;
                    var cluster_size_ratio = cluster_height/cluster_width;

                    // cek rasio pixel skin
                    var cluster_area = cluster_height*cluster_width;
                    var cluster_skin_ratio = crt_cluster.length / cluster_area;

                    if (cluster_size_ratio >= 0.8 && cluster_size_ratio <= 2.2 && cluster_skin_ratio >= 0.4) {
                        clusters.push({
                            member: crt_cluster,
                            top_left: {
                                x: x_min_cluster,
                                y: y_min_cluster
                            },
                            bottom_right: {
                                x: x_max_cluster,
                                y: y_max_cluster
                            },
                            is_face: false,
                            cluster_skin_ratio: cluster_skin_ratio
                        });
                    }
                }
            }
        }

        return clusters;
    }

    detectFaceFromCandidate(clusters) {

        var area_threshold_percentage = 0.001;
        var face_data = [];

        // detect hole per cluster
        for (var j = 0; j < clusters.length; j++) {
            var y_min = clusters[j].top_left.y;
            var x_min = clusters[j].top_left.x;
            var y_max = clusters[j].bottom_right.y;
            var x_max = clusters[j].bottom_right.x;
            var local_height = y_max - y_min + 1;
            var local_width = x_max - x_min + 1;

            var local_visited = Array(local_height);
            for (var i = 0; i < local_height; i++) {
                local_visited[i] = Array.apply(null, Array(local_width)).map(Number.prototype.valueOf,0);
            }
            
            // tag non hole (pinggiran yang bukan termasuk muka)
            // iterate 1 pixel in the boundary, 0 is move right, 1 is move down, 2 is move left, 3 is move up.
            var crt_point = [0, 0];
            var len = local_width, dx = 1, dy = 0;
            for (var side = 0; side < 4; side++) {
                for (var k = 0; k < len-1; k++) {
                    var x = crt_point[0];
                    var y = crt_point[1];

                    // start flooding for non skin pixel
                    if (!this.isPixelSkin(x+x_min, y + y_min) && local_visited[y][x] == 0) {
                        var flood_queue = [];
                        var point = [x, y];
                        flood_queue.push(point);
                        while (flood_queue.length > 0) {
                            var hole_pixel = flood_queue.pop();
                            var x = hole_pixel[0];
                            var y = hole_pixel[1];

                            if (local_visited[y][x] != 0) {
                                continue;
                            } else {
                                local_visited[y][x] = 1;
                            }

                            if (y - 1 >= 0) {
                                if (!this.isPixelSkin(x + x_min, y - 1 + y_min) && local_visited[y-1][x] == 0) {
                                    var point = [x, y - 1];
                                    flood_queue.push(point);
                                }
                            }
                            if (y + 1 < local_height) {
                                if (!this.isPixelSkin(x + x_min, y + 1 + y_min) && local_visited[y+1][x] == 0) {
                                    var point = [x, y + 1];
                                    flood_queue.push(point);
                                }
                            }
                            if (x - 1 >= 0) {
                                if (!this.isPixelSkin(x - 1 + x_min, y + y_min) && local_visited[y][x-1] == 0) {
                                    var point = [x - 1, y];
                                    flood_queue.push(point);
                                }
                            }
                            if (x + 1 < local_width) {
                                if (!this.isPixelSkin(x + 1 + x_min, y + y_min) && local_visited[y][x+1] == 0) {
                                    var point = [x + 1, y];
                                    flood_queue.push(point);
                                }
                            }
                        }
                    }

                    crt_point[0] += dx;
                    crt_point[1] += dy;
                }

                // turn right
                var temp = dx;
                dx = -dy;
                dy = temp;
                len = (side%2==0) ? local_height : local_width;
            }
            
            // tag holes
            var area_threshold = area_threshold_percentage * local_width * local_height;
            var holes = []
            for (var k = 0; k < local_height; k++) {
                for (var i = 0; i < local_width; i++) {
                    var flood_queue = [];
                    var point = [i, k];
                    flood_queue.push(point);
                    var hole = [];
                    var x_min_local = 9999999;
                    var x_max_local = -1;
                    var y_min_local = 9999999;
                    var y_max_local = -1;
                    while (flood_queue.length > 0) {
                        var hole_pixel = flood_queue.pop();
                        var x = hole_pixel[0];
                        var y = hole_pixel[1];

                        if (local_visited[y][x] != 0) {
                            continue;
                        } else if (this.isPixelSkin(x + x_min, y + y_min)) {
                            local_visited[y][x] = 1;
                            continue;
                        } else {
                            local_visited[y][x] = 2;
                            if (x < x_min_local) x_min_local = x;
                            if (y < y_min_local) y_min_local = y;
                            if (x > x_max_local) x_max_local = x;
                            if (y > y_max_local) y_max_local = y;
                            hole.push({x: x + x_min, y: y + y_min})
                        }

                        if (y - 1 >= 0) {
                            if (!this.isPixelSkin(x + x_min, y - 1 + y_min) && local_visited[y-1][x] == 0) {
                                var point = [x, y - 1];
                                flood_queue.push(point);
                            }
                        }
                        if (y + 1 < local_height) {
                            if (!this.isPixelSkin(x + x_min, y + 1 + y_min) && local_visited[y+1][x] == 0) {
                                var point = [x, y + 1];
                                flood_queue.push(point);
                            }
                        }
                        if (x - 1 >= 0) {
                            if (!this.isPixelSkin(x - 1 + x_min, y + y_min) && local_visited[y][x-1] == 0) {
                                var point = [x - 1, y];
                                flood_queue.push(point);
                            }
                        }
                        if (x + 1 < local_width) {
                            if (!this.isPixelSkin(x + 1 + x_min, y + y_min) && local_visited[y][x+1] == 0) {
                                var point = [x + 1, y];
                                flood_queue.push(point);
                            }
                        }
                    }

                    if (hole.length >= area_threshold && hole.length > 0) {
                        holes.push({
                            member: hole,
                            top_left: {
                                x: x_min_local + x_min,
                                y: y_min_local + y_min
                            },
                            bottom_right: {
                                x: x_max_local + x_min,
                                y: y_max_local + y_min
                            },
                        });
                    }
                }
            }

            clusters[j].holes = holes;
            if (holes.length >= 2) {
                clusters[j].is_face = true;
                face_data.push(clusters[j]);
            }            

        }

        return face_data;
    }

    // make non skin pixel become black
    preprocessBeforeOtsu(x_min, y_min, x_max, y_max) {
        for(var i = 0; i < x_max-x_min+1; i++) {
            for(var j = 0; j < y_max-y_min+1; j++) {
                if (!this.isPixelSkin(x_min+i, y_min+j)) {
                    this.setImagePixel(x_min+i, y_min+j, IG_COLOR_BLACK);
                }
            }
        }
    }

    makeGrayscale(x_min, y_min, x_max, y_max) {
        for(var i = 0; i < x_max-x_min+1; i++) {
            for(var j = 0; j < y_max-y_min+1; j++) {
                var color = this.getImagePixel(x_min+i, y_min+j);
                var avrg = (color[0] + color[1] + color[2]) / 3;
                this.setImagePixel(x_min+i, y_min+j, [avrg, avrg, avrg, 255]);
            }
        }
    }

    gaussianFilter(x_min, y_min, x_max, y_max) {
        
    }

    // asumsi ukuran matrix sama coy! bentuknya array of array
    dotProduct(matA, matB) {
        var total = 0;

        for (var i = 0; i < matA.length; i++) {
            for (var j = 0; j < matA[0].length; j++) {
                total += matA[i][j] * matB[i][j];
            }
        }

        return total;
    }

    getGrayscale(x,y) {
        var color = this.getImagePixel(x, y);
        var avrg = (color[0] + color[1] + color[2]) / 3;

        return avrg;
    }

    sobelFilter(x_min, y_min, x_max, y_max) {
        var filter_vertical = [
            [-1,0,1],
            [-2,0,2],
            [-1,0,1]
        ];
        var filter_horizontal = [
            [-1,-2,-1],
            [0,0,0],
            [1,2,1]
        ];

        var sobel_result = new Array(y_max-y_min+1);
        for (var i = 0; i < sobel_result.length; i++) {
            sobel_result[i] = new Array(x_max-x_min+1);
            sobel_result[i].fill(0);
        }

        // asumsi skip padding
        for(var i = 1; i < x_max-x_min; i++) {
            for(var j = 1; j < y_max-y_min; j++) {
                var crt_matrix = [
                    [this.getGrayscale(x_min+i-1, y_min+j-1), this.getGrayscale(x_min+i, y_min+j-1), this.getGrayscale(x_min+i+1, y_min+j-1)],
                    [this.getGrayscale(x_min+i-1, y_min+j), this.getGrayscale(x_min+i, y_min+j), this.getGrayscale(x_min+i+1, y_min+j)],
                    [this.getGrayscale(x_min+i-1, y_min+j+1), this.getGrayscale(x_min+i, y_min+j+1), this.getGrayscale(x_min+i+1, y_min+j+1)]
                ];

                var val_hor = this.dotProduct(crt_matrix, filter_horizontal);
                var val_ver = this.dotProduct(crt_matrix, filter_vertical);
                var val = Math.sqrt(val_ver*val_ver + val_hor*val_hor);

                sobel_result[i][j] = Math.round(val/1443*255);
            }
        }

        for(var i = 1; i < x_max-x_min; i++) {
            for(var j = 1; j < y_max-y_min; j++) {
                var val = sobel_result[i][j];// > 20 ? 255 : 0;
                this.setImagePixel(x_min+i, y_min+j, [val,val,val,255]);
            }
        }

    }

    detectEyeByHistogram(x_min, y_min, x_max, y_max) {
        var isEye = false;
        var histogram = new Array(26);
        var white_counter = 0;
        var area = (x_max-x_min+1)*(y_max-y_min+1);
        histogram.fill(0);

        // calculate white percentage
        for (var i = 0; i < x_max-x_min+1; i++) {
            for (var j = 0; j < y_max-y_min+1; j++) {
                var avg = Math.round(this.getGrayscale(x_min+i, y_min+j));
                avg = Math.round(avg/10);
                histogram[avg]++;

                if (avg < 5) white_counter++;
            }
        }

        // console.log(white_counter/area);
        if (white_counter/area > 0.14) isEye = true;

        return isEye;
    }

    variance(arr) {
        var len = 0;
        var sum=0;
        for(var i=0;i<arr.length;i++) {
            if (arr[i] == ""){

            } else {
                len = len + 1;
                sum = sum + parseFloat(arr[i]);
            }
        }
        
        var v = 0;
        if (len > 1) {
            var mean = sum / len;
            for(var i=0;i<arr.length;i++) {
                if (arr[i] == ""){}
                else {
                    v = v + (arr[i] - mean) * (arr[i] - mean);
                }
            }
            return v / len;
        } else {
            return 0;
        }
    }

    detectHumanSkin() {
        
        var visited = new Array(this.height);
        var map = new Array(this.height);
        for (var i = 0; i < this.height; i++) {
            visited[i] = new Array(this.width);
            map[i] = new Array(this.width);
        }
        
        // Detect skin and non skin pixel
        for (var y = 0; y < this.height; y++) {
            for (var x = 0; x < this.width; x++) {
                visited[y][x] = true;
                if (!this.isPixelSkin(x, y)) {
                    // this.setImagePixel(x, y, IG_COLOR_BLACK);
                    map[y][x] = 0;
                } else {
                    visited[y][x] = false;
                    map[y][x] = 1;
                }
            }
        }

        // Find cluster (face candidate)
        var clusters = this.getFaceCandidateCluster(visited, map);

        // Cek minimal tiap cluster harus ada 2 lubang dengan ukuran minimum
        var face_data = this.detectFaceFromCandidate(clusters);
        // console.log(face_data);

    
        // draw square per face
        for (var j = 0; j < face_data.length; j++) {
            var y_min = face_data[j].top_left.y;
            var x_min = face_data[j].top_left.x;
            var y_max = face_data[j].bottom_right.y;
            var x_max = face_data[j].bottom_right.x;


            var eye_left = { x: 0, y: 0, idx_hole: 0 };
            var eye_right = { x: 0, y: 0, idx_hole: 0 };

            // this.makeGrayscale(x_min, y_min, x_max, y_max);
            
            // edge detection
            // this.gaussianFilter(x_min, y_min, x_max, y_max);
            // this.sobelFilter(x_min, y_min, x_max, y_max);

            // preprocess face area, before otsu
            // this.preprocessBeforeOtsu(x_min, y_min, x_max, y_max);

            // start otsu binarization
            // this.otsuBinarization(x_min, y_min, x_max, y_max);

            for (var i = x_min; i <= x_max; i++) {
                this.setImagePixel(i, y_min, IG_COLOR_RED);
                this.setImagePixel(i, y_max, IG_COLOR_RED);
            }
            for (var i = y_min; i <= y_max; i++) {
                this.setImagePixel(x_min, i, IG_COLOR_RED);
                this.setImagePixel(x_max, i, IG_COLOR_RED);
            }

            // continue;
            // square holes
            var holes = face_data[j].holes;
            // eyebrow, eye, mouth
            for (var k = 0; k < holes.length; k++) {
                var y_min_hole = holes[k].top_left.y;
                var x_min_hole = holes[k].top_left.x;
                var y_max_hole = holes[k].bottom_right.y;
                var x_max_hole = holes[k].bottom_right.x;

                // detect eye using histogram
                var is_eye = this.detectEyeByHistogram(x_min_hole, y_min_hole, x_max_hole, y_max_hole);
                var local_color = IG_COLOR_GREEN;

                if (is_eye) {
                    local_color = IG_COLOR_BLUE;
                    if (eye_left.x == 0) {
                        eye_left.x = Math.round((x_min_hole + x_max_hole)/2);
                        eye_left.y = Math.round((y_min_hole + y_max_hole)/2);
                        eye_left.idx_hole = k;
                    } else {
                        eye_right.x = Math.round((x_min_hole + x_max_hole)/2);
                        eye_right.y = Math.round((y_min_hole + y_max_hole)/2);
                        eye_right.idx_hole = k;
                    }
                }
                for (var i = x_min_hole; i <= x_max_hole; i++) {
                    this.setImagePixel(i, y_min_hole, local_color);
                    this.setImagePixel(i, y_max_hole, local_color);
                }
                for (var i = y_min_hole; i <= y_max_hole; i++) {
                    this.setImagePixel(x_min_hole, i, local_color);
                    this.setImagePixel(x_max_hole, i, local_color);
                }
            }

            if (eye_left.x > eye_right.x) {
                var x = eye_left.x;
                var y = eye_left.y;
                var idx = eye_left.idx_hole;
                eye_left.x = eye_right.x;
                eye_left.y = eye_right.y;
                eye_left.idx_hole = eye_right.idx_hole;
                eye_right.x = x;
                eye_right.y = y;
                eye_right.idx_hole = idx;
            }
            
            // console.log("eye_left");
            // console.log(eye_left);
            // console.log("eye_right");
            // console.log(eye_right);

            // console.log("holes[eye_left.idx_hole]");
            // console.log(holes[eye_left.idx_hole]);
            // console.log("holes[eye_right.idx_hole]");
            // console.log(holes[eye_right.idx_hole]);

            // eye_left.x = holes[eye_left.idx_hole].bottom_right.x;
            // eye_right.x = holes[eye_right.idx_hole].top_left.x;

            // console.log("eye_left");
            // console.log(eye_left);
            // console.log("eye_right");
            // console.log(eye_right);


            var diff_eye = eye_right.x - eye_left.x;
            var x_center = Math.round((eye_right.x + eye_left.x) / 2);
            var y_center = Math.round((eye_right.y + eye_left.y) / 2);

            var roi_face = {x_min : 0, x_max : 0, y_min : 0, y_max : 0};

            roi_face.x_min = Math.round(x_center - 1.85 * (x_center - eye_left.x));
            roi_face.x_max = Math.round(x_center + 1.85 * (eye_right.x - x_center));
            // roi_face.x_min = Math.round(((1.618 * eye_left.x) - x_center) / 0.618);
            // roi_face.x_max = Math.round(((1.618 * eye_right.x) - x_center) / 0.618);
            roi_face.y_max = Math.round(y_center + 1.618*diff_eye);
            roi_face.y_min = Math.round(roi_face.y_max - 1.618*(roi_face.y_max-y_center)); 

            // console.log("roi_face");
            // console.log(roi_face);

            for (var i = roi_face.x_min; i <= roi_face.x_max; i++) {
                this.setImagePixel(i, roi_face.y_min, IG_COLOR_BLACK);
                this.setImagePixel(i, roi_face.y_max, IG_COLOR_BLACK);
            }
            for (var i = roi_face.y_min; i <= roi_face.y_max; i++) {
                this.setImagePixel(roi_face.x_min, i, IG_COLOR_BLACK);
                this.setImagePixel(roi_face.x_max, i, IG_COLOR_BLACK);
            }

            // RESIZE THE SIZE TO 250x300
            var height = roi_face.y_max - roi_face.y_min;
            var width = roi_face.x_max - roi_face.x_min;
            var ratio_width = 255/width;
            var ratio_height = 300/height;
            var c = document.getElementById("myCanvas");
            c.width = width;
            c.height = height;
            var ctx = c.getContext("2d");

            var frames = new Uint8ClampedArray(4*height*width);
            var i = 0;
            for (var m = roi_face.y_min; m < roi_face.y_max; m++) {
                for (var n = roi_face.x_min; n < roi_face.x_max; n++) {
                    var px = this.getImagePixel(n, m);
                    frames[4*i] = ((px[0]+px[1]+px[2])/3);
                    frames[4*i+1] = ((px[0]+px[1]+px[2])/3);
                    frames[4*i+2] = ((px[0]+px[1]+px[2])/3);
                    frames[4*i+3] = 255;
                    i++;
                }   
            }

            var imageData = new ImageData(frames, width, height);

            ctx.putImageData(imageData, 0, 0);

            this.resizeCanvas(c, ratio_width, ratio_height);

            ctx = c.getContext("2d");
            imageData = ctx.getImageData(0, 0, c.width, c.height);
            
            // GAUSSIAN BLUR
            // // console.log(imageData);
            // var tempData = new Uint8ClampedArray(4 * c.height * c.width);

            // for (var m = 0; m < tempData.length; m++) {
            //     tempData[m] = imageData.data[m];
            // }

            // var sigma = 2;
            // this.gaussian_filter(imageData.data, tempData, c.width, c.height, sigma);
            // ctx.putImageData(new ImageData(tempData, c.width, c.height), 0, 0);

            // console.log(tempData);
            var degree = 20;
            var data = {};
            var predictors = [];
            for (var m = 0; m < c.height; m++) {
                var someData = [];
                var array = {};
                for (var n = 0; n < c.width; n++) {
                    someData.push(new DataPoint(n, imageData.data[4*(m * width + n)]));
                    array[n] = imageData.data[4 * (m * width + n)];
                }
                data[m] = array; 

                var poly = new PolynomialRegression(someData, degree);
                var term = poly.getTerms();
                predictors.push({term:term, poly:poly});
            }

            // localStorage.setItem("hilmi", JSON.stringify(data));

            var names = ["adrian", "barry", "blaw", "david", "dhands", "hilmi"];
            var predicted_name = "undefined";

            var i = 0;
            var min_error = 1000;

            var reference = JSON.parse(localStorage.getItem(names[0]));

            var error = 0;
            for (var m = 0; m < c.height; m++) {
                var predictor = predictors[m];
                for (var n = 0; n < c.width; n++) {
                    var Y = predictor.poly.predictY(predictor.term, n);
                    if (reference[m][n] != null && Y != null)
                        error += Math.abs(reference[m][n] - Y);
                }    
            }

            error = error / (c.width * c.height);

            // console.log(c.width);
            // console.log(c.height);

            if (error < min_error) {
                min_error = error;
                predicted_name = names[0];
            }

            // console.log("Error " + names[0] + ": " + error);



            for (i = 1; i < names.length; i++) {
                var reference = JSON.parse(localStorage.getItem(names[i]));
    
                var error = 0;
                for (var m = 0; m < c.height; m++) {
                    var predictor = predictors[m];
                    for (var n = 0; n < c.width; n++) {
                        var Y = predictor.poly.predictY(predictor.term, n);
                        if (reference[m][n] != null && Y != null)
                            error += Math.abs(reference[m][n] - Y);
                    }
                }

                // console.log(c.width);
                // console.log(c.height);
    
                error = error / (c.width * c.height);

                if (error < min_error) {
                    min_error = error;
                    predicted_name = names[i];
                }

                // console.log("Error " + names[i] + ": " + error);
            } 

            console.log("Predicted name: ", predicted_name);
            console.log("Error: ", min_error);
        }

        return;

    }

    // if normalize is true, map pixels to range 0..MAX_BRIGHTNESS
    convolution(input, output, kernel, nx, ny, kn, normalize) {
        if (kn % 2 != 1) return;
        if (!(nx > kn && ny > kn)) return;
        var khalf = kn / 2;
        var min = Math.FLT_MAX, max = -Math.FLT_MAX;
        var MAX_BRIGHTNESS = 255;

        if (normalize)
            for (var m = khalf; m < nx - khalf; m++)
                for (var n = khalf; n < ny - khalf; n++) {
                    var pixel = 0.0;
                    var c = 0;
                    for (var j = -khalf; j <= khalf; j++)
                        for (var i = -khalf; i <= khalf; i++) {
                            pixel += input[4* ((n - j) * nx + m - i)] * kernel[c];
                            c++;
                        }
                    if (pixel < min)
                        min = pixel;
                    if (pixel > max)
                        max = pixel;
                }

        for (var m = khalf; m < nx - khalf; m++)
            for (var n = khalf; n < ny - khalf; n++) {
                var pixel = 0.0;
                var c = 0;
                for (var j = -khalf; j <= khalf; j++)
                    for (var i = -khalf; i <= khalf; i++) {
                        pixel += input[4 * ((n - j) * nx + m - i)] * kernel[c];
                        c++;
                    }

                if (normalize)
                    pixel = MAX_BRIGHTNESS * (pixel - min) / (max - min);
                output[4 * (n * nx + m)] = pixel;
                output[4 * (n * nx + m) + 1] = pixel;
                output[4 * (n * nx + m) + 2] = pixel;
                output[4 * (n * nx + m) + 3] = 255;
            }
    }

    /*
    * gaussianFilter:
    * http://www.songho.ca/dsp/cannyedge/cannyedge.html
    * determine size of kernel (odd #)
    * 0.0 <= sigma < 0.5 : 3
    * 0.5 <= sigma < 1.0 : 5
    * 1.0 <= sigma < 1.5 : 7
    * 1.5 <= sigma < 2.0 : 9
    * 2.0 <= sigma < 2.5 : 11
    * 2.5 <= sigma < 3.0 : 13 ...
    * kernelSize = 2 * int(2*sigma) + 3;
    */

    gaussian_filter(input, output, nx, ny, sigma) {
        var n = 2 * (2 * sigma) + 3;
        var mean = Math.floor(n / 2.0);
        var length_array = n*n;
        var kernel = []; // variable length array
        var c = 0;
        for (var i = 0; i < n; i++)
            for (var j = 0; j < n; j++) {
                kernel[c] = Math.exp(-0.5 * (Math.pow((i - mean) / sigma, 2.0) + Math.pow((j - mean) / sigma, 2.0)))/ (2 * Math.PI * sigma * sigma);
                c++;
            }

        // console.log("kernel");
        // console.log(kernel);

        this.convolution(input, output, kernel, nx, ny, n, true);
    }


    resizeCanvas(canvas, width_ratio, height_ratio) {
        var tempCanvas = document.createElement("canvas");
        var tctx = tempCanvas.getContext("2d");
        var cw = canvas.width;
        var ch = canvas.height;
        tempCanvas.width = cw;
        tempCanvas.height = ch;
        tctx.drawImage(canvas, 0, 0);
        canvas.width *= width_ratio;
        canvas.height *= height_ratio;
        var ctx = canvas.getContext('2d');
        ctx.drawImage(tempCanvas, 0, 0, cw, ch, 0, 0, cw * width_ratio, ch * height_ratio);
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