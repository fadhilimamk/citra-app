// Copyright 2018 Fadhil, Hilmi, Arno

(function() {
    'use strict';

    var script = document.createElement('script');
    script.src = 'scripts/char_skeleton_grid.js';
    var script2 = document.createElement('script');
    script2.src = 'scripts/image_grid.js';
    var script3 = document.createElement('script');
    script3.src = 'scripts/zhang_suen.js';
    var script4 = document.createElement('script');
    script4.src = 'scripts/mlp.js';
    document.head.appendChild(script);
    document.head.appendChild(script2);
    document.head.appendChild(script3);
    document.head.appendChild(script4);

    document.addEventListener('DOMContentLoaded', function() {
      var elems = document.querySelectorAll('select');
      var instances = M.FormSelect.init(elems);
    });

    const MODE_HIST_EQUAL = 0;
    const MODE_HIST_SPEC = 1;
    const MODE_OCR = 2;
    const MODE_THINNING = 3;
    const MODE_THINNING_OCR = 4;
    const MODE_FILTER = 5;
    const MODE_FACE = 6;

    const MODE_FILTER_MEDIAN = 5;
    const MODE_FILTER_GRADIENT = 6;
    const MODE_FILTER_DIFFERENCE = 7;
    const MODE_FILTER_PREWITT = 8;
    const MODE_FILTER_SOBEL = 9;
    const MODE_FILTER_ROBERTS = 11;
    const MODE_FILTER_FREICHEN = 12;
    const MODE_FILTER_CUSTOM = 13;

    const COLOR_WHITE = 255;
    const COLOR_BLACK = 0;

    // direction for filter
    const DIRECTION_VERTICAL = 0;
    const DIRECTION_HORISONTAL = 0;

    var app = {
      isLoading: true,
      image: document.getElementById("imgBefore"),
      imageAfter: document.getElementById("imgAfter"),
      imageRaw: null,
        // variable to store raw uploaded image
      imageCanvas: document.createElement("canvas"),
      imageCtx: null,
      imageData: null,
      real_width: null,
      real_height:null,
      // mode: MODE_PREWITT_FILTER
      // mode: MODE_THINNING_OCR
      mode: MODE_HIST_EQUAL,
        // 0 Histogram Equalization
        // 1 Histogram Specification

      filter_mode: MODE_FILTER_MEDIAN

    };

    // default value for slider
    var sliderVal = [10, 50, 90, 50, 10];

    var chans = [[]];
    var r_cum = [], r_map = [];
    var g_cum = [], g_map = [];
    var b_cum = [], b_map = [];
    var image_size;
    var first_cum;
    var char_idx = 33;

    function Point(x, y) {
      this.x = x;
      this.y = y;
    }

    // global var for histogram
    var properties, responsiveOptions;

    properties = {
      axisX: {
        showLabel: false
      },
      axisY: {
        onlyInteger: true
      },
      lineSmooth: Chartist.Interpolation.cardinal({
        tension: 0.2
      })
    };

    responsiveOptions = [
      ['screen and (min-width: 641px) and (max-width: 1024px)', {
        showPoint: false,
        axisX: {
          labelInterpolationFnc: function (value) {
            // Will return Mon, Tue, Wed etc. on medium screens
            return value.slice(0, 3);
          }
        }
      }],
      ['screen and (max-width: 640px)', {
        showLine: false,
        axisX: {
          labelInterpolationFnc: function (value) {
            // Will return M, T, W etc. on small screens
            return value[0];
          }
        }
      }]
    ];

  
    /*****************************************************************************
     *
     * Event listeners for UI elements
     *
     ****************************************************************************/

    var inputMode = document.getElementById("app-mode");
    var inputImageCamera = document.getElementById("inputImageCamera");
    var inputImageGallery = document.getElementById("inputImageGallery");
    var butCamera = document.getElementById("butCamera");
    var butGallery = document.getElementById("butGallery");
    var viewHistogram = document.getElementById("viewHistogram"); 
    var viewDesiredHistogram = document.getElementById("viewDesiredHistogram");
    var viewPredictionResult = document.getElementById("predictionResultView");
    var inputHistogram = document.getElementById("inputHistogram");

    var titleHistRed = document.getElementById("titleHistRed");
    var titleCumRed = document.getElementById("titleCumRed");
    var titleHistGreen = document.getElementById("titleHistGreen");
    var titleCumGreen = document.getElementById("titleCumGreen");
    var titleHistBlue = document.getElementById("titleHistBlue");
    var titleCumBlue = document.getElementById("titleCumBlue");
    var titleHistGrey = document.getElementById("titleHistGrey");
    var titleCumGrey = document.getElementById("titleCumGrey");

    var txtPredictionChar = document.getElementById("predictedChar");
    var txtPredictionASCII = document.getElementById("predictedASCII");
    var txtChainCodeResult = document.getElementById("chainCodeResult");

    var viewFilterOptions = document.getElementById("filterInputOptionsView");
    var viewCustomInput = document.getElementById("customFilterInput");
    var inputFilterMode = document.getElementById("filter-mode");
    var btnProcessFilter = document.getElementById("btnProcessFilter");

    inputMode.addEventListener('change', function() {
      var mode = inputMode.options[inputMode.selectedIndex].value;
      if (mode === 'equalization') {
        app.mode = MODE_HIST_EQUAL;
      } else if (mode === 'specification') {
        app.mode = MODE_HIST_SPEC;
      } else if (mode === 'ocr') {
        app.mode = MODE_OCR;
      } else if (mode === 'thinning') {
        app.mode = MODE_THINNING;
      } else if (mode === 'thinning-ocr') {
        app.mode = MODE_THINNING_OCR;
      } else if (mode === 'filter') {
        app.mode = MODE_FILTER;
      } else if (mode === 'face-detection') {
        app.mode = MODE_FACE;
      } else { // default
        app.mode = MODE_HIST_EQUAL;
      }

      // reset all after mode changed
      app.imageRaw = null;
      app.image.src = 'images/empty.png';
      app.imageAfter.src = 'images/empty.png';
      inputImageCamera.value = '';
      inputImageGallery.value = '';
      viewHistogram.style.display = 'none';
      viewPredictionResult.style.display = 'none';
      inputHistogram.style.display = 'none';
      viewFilterOptions.style.display = 'none';
      viewCustomInput.style.display = 'none';
      inputFilterMode.selectedIndex = "0";

      if (app.mode == MODE_FILTER) {
        viewFilterOptions.style.display = 'block';
        viewCustomInput.style.display = 'none';
      }

    });

    inputFilterMode.addEventListener('change', function() {
      var filterMode = inputFilterMode.options[inputFilterMode.selectedIndex].value;

      viewCustomInput.style.display = 'none';

      if (filterMode == 'median-filter') {
        app.filter_mode = MODE_FILTER_MEDIAN;
      } else if (filterMode == 'gradient-filter') {
        app.filter_mode = MODE_FILTER_GRADIENT;
      } else if (filterMode == 'difference-filter') {
        app.filter_mode = MODE_FILTER_DIFFERENCE;
      } else if (filterMode == 'prewitt-filter') {
        app.filter_mode = MODE_FILTER_PREWITT;
      } else if (filterMode == 'sobel-filter') {
        app.filter_mode = MODE_FILTER_SOBEL;
      } else if (filterMode == 'roberts-filter') {
        app.filter_mode = MODE_FILTER_ROBERTS;
      } else if (filterMode == 'freichen-filter') {
        app.filter_mode = MODE_FILTER_FREICHEN;
      } else if (filterMode == 'custom-filter') {
        app.filter_mode = MODE_FILTER_CUSTOM;
        viewCustomInput.style.display = 'block';
      } else { // default
        app.filter_mode = MODE_FILTER_MEDIAN;
      }

      // reset image after
      app.imageAfter.src = 'images/empty.png';

    });

    btnProcessFilter.addEventListener('click', function() {

      // check if image empty
      if (app.imageData == null) return;

      if (app.filter_mode == MODE_FILTER_MEDIAN) {
        app.processImageMedianFilter();
      } else if (app.filter_mode == MODE_FILTER_GRADIENT) {
        app.processImageGradientFilter();
      } else if (app.filter_mode == MODE_FILTER_DIFFERENCE) {
        app.processImageDifferenceFilter();
      } else if (app.filter_mode == MODE_FILTER_PREWITT) {
        app.processImagePrewittFilter();
      } else if (app.filter_mode == MODE_FILTER_SOBEL) {
        app.processImageSobelFilter();
      } else if (app.filter_mode == MODE_FILTER_ROBERTS) {
        app.processImageRobertsFilter();
      } else if (app.filter_mode == MODE_FILTER_FREICHEN) {
        app.processImageFreichenFilter();
      } else if (app.filter_mode == MODE_FILTER_CUSTOM) {
        app.processImageCustomFilter();
      }

    });
    
    inputImageCamera.addEventListener('change', function() {
      if (inputImageCamera.files && inputImageCamera.files[0]) {
        var reader = new FileReader();
        reader.onload = function (e) {
          document.getElementById("imgBefore").src = e.target.result;
        };
        app.imageRaw = inputImageCamera.files[0];
        reader.readAsDataURL(app.imageRaw);
        app.processImage(app.imageRaw);
      }
    });

    inputImageGallery.addEventListener('change', function() {
      if (inputImageGallery.files && inputImageGallery.files[0]) {
        var reader = new FileReader();
        reader.onload = function (e) {
          document.getElementById("imgBefore").src = e.target.result;
        };
        app.imageRaw = inputImageGallery.files[0];
        reader.readAsDataURL(app.imageRaw);
        app.processImage(app.imageRaw);
      }
    });

    butCamera.addEventListener('click', function() {
      inputImageCamera.focus();
      inputImageCamera.click();
    });

    butGallery.addEventListener('click', function() {
      inputImageGallery.focus();
      inputImageGallery.click();
    });

    var inputSliders = document.querySelectorAll('[id^=slider-]');
    var count = 0;
    inputSliders.forEach( function(slider) {
      slider.addEventListener('change', function() {
        var sliderId = slider.id.split('-', 2)[1];
        document.getElementById("value-slider-" + sliderId).textContent = slider.value;
        sliderVal[sliderId] = parseInt(slider.value);
      });
      
      // set default value
      slider.value = sliderVal[count];
      document.getElementById('value-slider-' + count).textContent = sliderVal[count];
      count++;
    });

    var btnProcessSpecification = document.getElementById('btnProcessSpecification');
    btnProcessSpecification.onclick = function() {
      app.imageAfter.src = 'images/empty.png';
      app.processImage(app.imageRaw);
    };

  /*****************************************************************************
   *
   * Methods to process the given image with selected mode
   *
   ****************************************************************************/

    // Display selected image to imgBefore, then start to process the histogram
    app.processImage = function(image) {
      var reader = new FileReader();
      reader.onload = function (e) {
        
        var image = new Image();
        image.src = e.target.result;

        image.onload = function () {
        // app.image.onload = function () {

          if (app.imageRaw == null) {
            return;
          }

          // penting
          app.real_height = this.height;
          app.real_width = this.width;

          console.log(app.real_width);
          console.log(app.real_height);

          // prepare canvas and data for processing
          app.imageCanvas.width = this.width;
          app.imageCanvas.height = this.height;
          app.imageCtx = app.imageCanvas.getContext('2d');
          // console.log(app.imageCtx);
          app.imageCtx.drawImage(app.image, 0, 0, this.width, this.height);
          app.imageData = app.imageCtx.getImageData(0, 0, this.width, this.height).data;
          app.imageGrid = new ImageGrid(app.imageData, app.real_width, app.real_height);
          // console.log(app.imageData);

          viewDesiredHistogram.style.display = "none";

          // check mode
          if (app.mode == MODE_HIST_EQUAL) {
                app.processImageEqualization();
          } else if (app.mode == MODE_HIST_SPEC) {
                app.processImageSpecification();
          } else if (app.mode == MODE_OCR) {
                app.processImageOCR();
          } else if (app.mode == MODE_THINNING) {
                app.processImageThinning();
          } else if (app.mode == MODE_THINNING_OCR) {
                app.processImageThinningOCR();
          } else if (app.mode == MODE_FILTER) {
                app.processImageMedianFilter(); // default filter process
          } else if (app.mode == MODE_FACE) {
                app.processFaceDetection();
          }
          
        }
        app.image.src = e.target.result;

      };
      reader.readAsDataURL(image);

    };

    // Main function to handle histogram equalization
    app.processImageEqualization = function() {
        viewHistogram.style.display = "block";

        titleHistRed.textContent="Histogram Red";
        titleCumRed.textContent="Cum. Histogram Red";
        titleHistGreen.textContent="Histogram Green";
        titleCumGreen.textContent="Cum. Histogram Green";
        titleHistBlue.textContent="Histogram Blue";
        titleCumBlue.textContent="Cum. Histogram Blue";
        titleHistGrey.textContent="Histogram Grey";
        titleCumGrey.textContent="Cum. Histogram Grey";
            
        app.calculateHistogram();
        app.showHistogram();
        app.CalculateAluMapping();

        app.convertImage();
        app.calculateHistogram();
        app.showHistogram();
        app.showResultImage();
    };

    // Main function to handle histogram specification
    app.processImageSpecification = function() {
        viewHistogram.style.display = "block";
        inputHistogram.style.display = "block";
        viewDesiredHistogram.style.display = "block";

        titleHistRed.textContent="Red Before";
        titleCumRed.textContent="Red After";
        titleHistGreen.textContent="Green Before";
        titleCumGreen.textContent="Green After";
        titleHistBlue.textContent="Blue Before";
        titleCumBlue.textContent="Blue After";
        titleHistGrey.textContent="Grey Before";
        titleCumGrey.textContent="Grey After";

        app.calculateHistogram();
        app.showHistogram();

        // histogram specification
        // Nyoba regresi dengan 5 titik
        var degree = 4;
        var someData = [];
        var x = 0;
        var y = sliderVal[0];
        someData.push(new DataPoint(x, y));
        x = 64;
        y = sliderVal[1];
        someData.push(new DataPoint(x, y));
        x = 128;
        y = sliderVal[2];
        someData.push(new DataPoint(x, y));
        x = 192;
        y = sliderVal[3];
        someData.push(new DataPoint(x, y));
        x = 255;
        y = sliderVal[4];
        someData.push(new DataPoint(x, y));

        var poly = new PolynomialRegression(someData, degree);
        var terms = poly.getTerms();

        var hist_spec = [];
        for (var i = 0; i < 256; ++i) {
          hist_spec.push(Math.round(poly.predictY(terms, i)));
        }

        var desired_data = {
          labels: [...Array(256).keys()],
          series: [
            hist_spec
          ]
        };

        new Chartist.Bar("#histDesired", desired_data, properties);
        var second_bar_id = ['#cumRed', '#cumGreen', '#cumBlue', '#cumGrey'];


        var hist_spec_sum = [];
        var sum = 0;
        for (var i = 0; i < 256; ++i) {
          hist_spec_sum.push(hist_spec[i] + sum);
          sum += hist_spec[i];
        }

        for (var cnl = 0; cnl < chans.length; cnl++) {                  

          var cum = [];
          var sum_cum = 0;
          for (var i = 0; i < chans[cnl].length; ++i) {
            cum[i] = chans[cnl][i] + sum_cum;
            sum_cum += chans[cnl][i];
          }

          var map_hist_spec;
          map_hist_spec = app.getHistSpecArr(cum, hist_spec_sum);

          var val, n, step = 4;
          if (cnl == 0) {
            for (var i = 0, n = app.imageData.length; i < n; i += step) {
              app.imageData[i] = map_hist_spec[app.imageData[i]];
            }
          } else if (cnl == 1) {
            for (var i = 0, n = app.imageData.length; i < n; i += step) {
              app.imageData[i + 1] = map_hist_spec[app.imageData[i + 1]];
            }
          } else if (cnl == 2) {
            for (var i = 0, n = app.imageData.length; i < n; i += step) {
              app.imageData[i + 2] = map_hist_spec[app.imageData[i + 2]];
            }
          }

          app.calculateHistogram();
          var data = {
            labels: [...Array(256).keys()],
            series: [
              chans[cnl]
            ]
          };

          new Chartist.Bar(second_bar_id[cnl], data, properties);

          app.showResultImage();
          
        }

    };

    app.processImageOCR = function() {
      viewPredictionResult.style.display = 'block';
      txtPredictionASCII.style.display = 'none';
      txtChainCodeResult.style.display = 'block';

      // preprocess image to binary
      var row = 0, col = 0, threshold = 100;
      var first_black_x = 0;
      var first_black_y = 0;
      var first_black = false;
      for (var i = 0, n = app.imageData.length; i < n; i+= 4) {
        var red = app.imageData[i];
        var green = app.imageData[i+1];
        var blue = app.imageData[i+2];
        var greyscale = Math.round((red+green+blue)/3)

        if (greyscale < threshold) {
          app.imageData[i] = COLOR_BLACK;
          app.imageData[i+1] = COLOR_BLACK;
          app.imageData[i+2] = COLOR_BLACK;
          
          if (!first_black) {
            first_black = true;
            first_black_x = col;
            first_black_y = row;
          }
        } else {
          app.imageData[i] = COLOR_WHITE;
          app.imageData[i+1] = COLOR_WHITE;
          app.imageData[i+2] = COLOR_WHITE;
        }
        app.imageData[i+3] = 255;

        col++;
        if (col == app.real_width) {
          col = 0;
          row++;
        }
      }

      // Base data for prediction
      var base_count = [
        [85, 27, 34, 27, 85, 27, 34, 27],     // 0
        [123, 31, 18, 0, 136, 19, 29, 1],     // 1
        [58, 90, 112, 22, 66, 77, 130, 17],   // 2
        [81, 57, 95, 57, 79, 56, 99, 54],     // 3
        [73, 62, 29, 2, 133, 1, 91, 1],       // 4
        [101, 41, 137, 43, 94, 48, 130, 43],  // 5
        [92, 45, 69, 45, 86, 48, 69, 42],     // 6
        [85, 47, 88, 0, 82, 52, 81, 2],       // 7
        [61, 39, 47, 41, 59, 39, 49, 39],     // 8
        [86, 48, 68, 43, 89, 46, 69, 44]      // 9
      ];

      // Start recording chain code
      console.log("first black = (" + first_black_x + ", " + first_black_y + ")");
      var x = first_black_x, y = first_black_y;
      var count_code = [0, 0, 0, 0, 0, 0, 0, 0];
      var count = 0;
      var min_x = x, max_x = x;
      var min_y = y, max_y = y;
      var predicted = 0;

      do {
        var code = 0;

        // console.log(app.getPixelValue(x-1,y-1)[0]/255 + " " + app.getPixelValue(x,y-1)[0]/255 + " " + app.getPixelValue(x+1,y-1)[0]/255);
        // console.log(app.getPixelValue(x-1,y)[0]/255 + " " + app.getPixelValue(x,y)[0]/255 + " " + app.getPixelValue(x+1,y)[0]/255);
        // console.log(app.getPixelValue(x-1,y+1)[0]/255 + " " + app.getPixelValue(x,y+1)[0]/255 + " " + app.getPixelValue(x+1,y+1)[0]/255);

        if (x < min_x) min_x = x;
        if (x > max_x) max_x = x;
        if (y < min_y) min_y = y;
        if (y > max_y) max_y = y;
        
        // find white to black pixel around
        if (app.getPixelValue(x-1, y-1)[0] == COLOR_WHITE && app.getPixelValue(x, y-1)[0] == COLOR_BLACK)
          code = 0;
        else if (app.getPixelValue(x, y-1)[0] == COLOR_WHITE && app.getPixelValue(x+1, y-1)[0] == COLOR_BLACK)
          code = 1;
        else if (app.getPixelValue(x+1, y-1)[0] == COLOR_WHITE && app.getPixelValue(x+1, y)[0] == COLOR_BLACK)
          code = 2;
        else if (app.getPixelValue(x+1, y)[0] == COLOR_WHITE && app.getPixelValue(x+1, y+1)[0] == COLOR_BLACK)
          code = 3;
        else if (app.getPixelValue(x+1, y+1)[0] == COLOR_WHITE && app.getPixelValue(x, y+1)[0] == COLOR_BLACK)
          code = 4;
        else if (app.getPixelValue(x, y+1)[0] == COLOR_WHITE && app.getPixelValue(x-1, y+1)[0] == COLOR_BLACK)
          code = 5;
        else if (app.getPixelValue(x-1, y+1)[0] == COLOR_WHITE && app.getPixelValue(x-1, y)[0] == COLOR_BLACK)
          code = 6;
        else if (app.getPixelValue(x-1, y)[0] == COLOR_WHITE && app.getPixelValue(x-1, y-1)[0] == COLOR_BLACK)
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

      console.log(count_code);

      // Start predicting
      var min_error = 99999;
      for (var i = 0; i < base_count.length; i++) {
        var error = 0;
        for (var j = 0; j < base_count[i].length; j++) {
          error = error + Math.abs(count_code[j] - base_count[i][j]);
        }
        console.log(error);
        if (error < min_error) {
          min_error = error;
          predicted = i;
        }
      }

      txtPredictionChar.textContent = predicted;
      txtChainCodeResult.innerHTML = "Boundary square: ("+min_x+","+min_y+") ("+max_x+","+max_y+")<br> \
      Character dimension: "+(max_x-min_x)+"x"+(max_y-min_y)+" <br>\
      #Chain code 0 : "+count_code[0]+" <br> \
      #Chain code 1 : "+count_code[1]+" <br>  \
      #Chain code 2 : "+count_code[2]+" <br> \
      #Chain code 3 : "+count_code[3]+" <br>  \
      #Chain code 4 : "+count_code[4]+" <br> \
      #Chain code 5 : "+count_code[5]+" <br>  \
      #Chain code 6 : "+count_code[6]+" <br> \
      #Chain code 7 : "+count_code[7]+" <br>";
      app.showResultImage();

      return;

    };

    app.getPixelValue = function (x, y) {
      if (x<0 || y<0 || x>=app.real_width || y>=app.real_height) {
        return [COLOR_BLACK, COLOR_BLACK, COLOR_BLACK, COLOR_BLACK];
      }

      var arr = [];
      var offset = (app.real_width * y + x) * 4;
      for (var i = 0; i < 4; ++i) {
        arr.push(app.imageData[offset + i]);
      }

      return arr;
    }

    app.setPixelValue = function (x, y, val) {
      var offset = (app.real_width * y + x) * 4;
      for (var i = 0; i < 4; ++i) {
        app.imageData[offset + i] = val[i];
      }
    }

    // Main function to handle image thinning
    app.processImageThinning = function() {
      var ZhangSuen = {};
      ZhangSuen.grid = Array(app.real_height);
      var threshold = 100;
      
      // Ubah gambar menjadi black-white
      var row = 0, column = 0;
      for (var i = 0, n = app.imageData.length; i < n; i+= 4) {
        var red = app.imageData[i];
        var green = app.imageData[i+1];
        var blue = app.imageData[i+2];
        var greyscale = Math.round((red+green+blue)/3)

        if (column == 0) {
          ZhangSuen.grid[row] = Array();
        }

        if (greyscale < threshold) {
          app.imageData[i] = COLOR_BLACK;
          app.imageData[i+1] = COLOR_BLACK;
          app.imageData[i+2] = COLOR_BLACK;
          ZhangSuen.grid[row].push(COLOR_BLACK);
        } else {
          app.imageData[i] = COLOR_WHITE;
          app.imageData[i+1] = COLOR_WHITE;
          app.imageData[i+2] = COLOR_WHITE;
          ZhangSuen.grid[row].push(COLOR_WHITE);
        }
        app.imageData[i+3] = 255;

        column++;
        if (column == app.real_width) {
          column = 0;
          row++;
        }
      }

      app.showResultImage();
      
      ZhangSuen.nbrs = [[0, -1], [1, -1], [1, 0], [1, 1], [0, 1], [-1, 1], [-1, 0], [-1, -1], [0, -1]];
      ZhangSuen.nbrGroups = [[[0, 2, 4], [2, 4, 6]], [[0, 2, 6], [0, 4, 6]]];
      ZhangSuen.toWhite = new Array();

      ZhangSuen.numNeighbors = function (r, c) {
        var count = 0;
        for (var i = 0; i < ZhangSuen.nbrs.length - 1; i++)
            if (ZhangSuen.grid[r + ZhangSuen.nbrs[i][1]][c + ZhangSuen.nbrs[i][0]] === COLOR_BLACK)
                count++;
        return count;
      };
      ZhangSuen.numTransitions = function (r, c) {
          var count = 0;
          for (var i = 0; i < ZhangSuen.nbrs.length - 1; i++)
              if (ZhangSuen.grid[r + ZhangSuen.nbrs[i][1]][c + ZhangSuen.nbrs[i][0]] === COLOR_WHITE) {
                  if (ZhangSuen.grid[r + ZhangSuen.nbrs[i + 1][1]][c + ZhangSuen.nbrs[i + 1][0]] === COLOR_BLACK)
                      count++;
              }
          return count;
      };
      ZhangSuen.atLeastOneIsWhite = function (r, c, step) {
          var count = 0;
          var group = ZhangSuen.nbrGroups[step];
          for (var i = 0; i < 2; i++)
              for (var j = 0; j < group[i].length; j++) {
                  var nbr = ZhangSuen.nbrs[group[i][j]];
                  if (ZhangSuen.grid[r + nbr[1]][c + nbr[0]] === COLOR_WHITE) {
                      count++;
                      break;
                  }
              }
          return count > 1;
      };
      ZhangSuen.printResult = function () {
        for (var i = 0; i < ZhangSuen.grid.length; i++) {
            var row = ZhangSuen.grid[i];
            console.log(row.join(''));
        }
      };  

      var firstStep = false;
      var hasChanged;
      do {
          hasChanged = false;
          firstStep = !firstStep;
          for (var r = 1; r < ZhangSuen.grid.length - 1; r++) {
              for (var c = 1; c < ZhangSuen.grid[0].length - 1; c++) {
                  if (ZhangSuen.grid[r][c] !== COLOR_BLACK)
                      continue;
                  var nn = ZhangSuen.numNeighbors(r, c);
                  if (nn < 2 || nn > 6)
                      continue;
                  if (ZhangSuen.numTransitions(r, c) !== 1)
                      continue;
                  if (!ZhangSuen.atLeastOneIsWhite(r, c, firstStep ? 0 : 1))
                      continue;
                  ZhangSuen.toWhite.push(new Point(c, r));
                  hasChanged = true;
              }
          }
          for (let i = 0; i < ZhangSuen.toWhite.length; i++) {
              var p = ZhangSuen.toWhite[i];
              ZhangSuen.grid[p.y][p.x] = COLOR_WHITE;
          }
          ZhangSuen.toWhite = new Array();
      } while ((firstStep || hasChanged));
      
      var BLACK = new Array(COLOR_BLACK, COLOR_BLACK, COLOR_BLACK, COLOR_WHITE);
      var WHITE = new Array(COLOR_WHITE, COLOR_WHITE, COLOR_WHITE, COLOR_WHITE);

      for (var r = 0; r < app.real_height; r++) {
        for (var c = 0; c < app.real_width; c++) {
          if (ZhangSuen.grid[r][c] == COLOR_BLACK) {
            app.setPixelValue(c, r, WHITE);
          }
        }
      }

      app.showResultImage();

    }

    app.processImageThinningOCR = function() {

      // make image become black and white
      app.imageGrid.makeBlackWhite(40);

      // thinning
      var grid = ImageGrid.convertDataToGrid(app.imageGrid.data, app.imageGrid.height, app.imageGrid.width);
      var ZS = new  ZhangSuenAlgorithm(grid);
      ZS.process();
      app.imageGrid.data = ImageGrid.convertGridToData(ZS.grid);

      // detect character boundary, and get the character grid
      var char_b_grid = app.imageGrid.getCharacter(); // binary grid
      var char_skeleton = new CharSkeletonGrid(char_b_grid.grid);

      // processing character grid
      char_skeleton.calculateEdgeJunction();
      char_skeleton.prunningSkeleton(15);

      for (var y = 0; y < char_skeleton.height; y++) {
        for (var x = 0; x < char_skeleton.width; x++) {
          if (char_skeleton.grid[y][x] == SK_COLOR_WHITE) {
            var idx = (y + char_b_grid.boundary[0][1]) *app.real_width + x + char_b_grid.boundary[0][0];
            app.imageGrid.setImagePixel(x + char_b_grid.boundary[0][0], y + char_b_grid.boundary[0][1], IG_COLOR_WHITE);
          }
        }
      }

      app.imageData = app.imageGrid.data;
      
      char_b_grid = app.imageGrid.getCharacter(); // binary grid
      app.imageGrid.drawBorder(char_b_grid.boundary);
      char_skeleton = new CharSkeletonGrid(char_b_grid.grid);
      char_skeleton.calculateEdgeJunction();

      for (var i = 0; i < char_skeleton.prop.data_edge.length; i++) {
        app.drawSquare(char_skeleton.prop.data_edge[i][0] + char_b_grid.boundary[0][0], char_skeleton.prop.data_edge[i][1] + char_b_grid.boundary[0][1], [0, 255, 0, 255]);
      }
      for (var i = 0; i < char_skeleton.prop.data_junction.length; i++) {
        app.drawSquare(char_skeleton.prop.data_junction[i][0] + char_b_grid.boundary[0][0], char_skeleton.prop.data_junction[i][1] + char_b_grid.boundary[0][1], [0, 0, 255, 255]);
      }

      char_skeleton.setCodePercentage(ZS.code_percentage);
      char_skeleton.calculateEdgeJunctionRegion(15);

      var classifier = new MLPClassifier();
      classifier.predict(char_skeleton.prop);
      console.log(classifier.result);

      app.showResultImage();
      // console.log(char_skeleton.predict());
      return;

    }

    app.processImageMedianFilter = function() {
      var grid = Array(app.real_height);
      for (var i=0; i<app.real_height; i++) {
        grid[i] = Array(app.real_width);
      }

      var get_median = function(r, c) {
        var channel_array = Array(4);
        for (var i=0; i<4; i++) {
          channel_array[i] = Array();
        }

        for (var i=-1; i<=1; i++) {
          for (var j=-1; j<=1; j++) {
            var pixel = app.getPixelValue(c+i, r+j);
            for (var k=0; k<4; k++) {
              channel_array[k].push(pixel[k]);
            }
          }
        }

        var result = Array();
        for (var i=0; i<4; i++) {
          var sorted_channel = channel_array[i].sort();
          result.push(sorted_channel[4]);
        }

        return result;
      }

      for (var r=0; r<app.real_height; r++) {
        for (var c=0; c<app.real_width; c++) {
          grid[r][c] = get_median(r,c);
        }
      }

      for (var r=0; r<app.real_height; r++) {
        for (var c=0; c<app.real_width; c++) {
          app.setPixelValue(c, r, grid[r][c]);
        }
      }

      app.showResultImage();
      return;
    }


    app.processImageGradientFilter = function () {
      
      var grid = Array(app.real_height);
      for (var i = 0; i < app.real_height; i++) {
        grid[i] = Array(app.real_width);
      }

      var get_gradient = function (r, c) {
        var channel_array = Array(4);
        for (var i = 0; i < 4; i++) {
          channel_array[i] = Array();
        }

        for (var i = -1; i <= 1; i++) {
          for (var j = -1; j <= 1; j++) {
            var pixel = app.getPixelValue(c + i, r + j);
            for (var k = 0; k < 4; k++) {
              channel_array[k].push(pixel[k]);
            }
          }
        }

        var result = Array();
        for (var i = 0; i < 4; i++) {
          var val = Math.max(
            Math.abs(channel_array[i][0] - channel_array[i][8]),
            Math.abs(channel_array[i][1] - channel_array[i][7]),
            Math.abs(channel_array[i][2] - channel_array[i][6]),
            Math.abs(channel_array[i][3] - channel_array[i][5]));

          if (i == 3) {
            result.push(COLOR_WHITE);
          } else {
            result.push(val);
          }
            
        }

        return result;
      }

      for (var r = 0; r < app.real_height; r++) {
        for (var c = 0; c < app.real_width; c++) {
          grid[r][c] = get_gradient(r, c);
        }
      }
      

      for (var r = 0; r < app.real_height; r++) {
        for (var c = 0; c < app.real_width; c++) {
          app.setPixelValue(c, r, grid[r][c]);
        }
      }

      app.showResultImage();
      return;
    }

    app.processImageDifferenceFilter = function () {
      var grid = Array(app.real_height);
      for (var i = 0; i < app.real_height; i++) {
        grid[i] = Array(app.real_width);
      }

      var get_difference = function (r, c) {
        var channel_array = Array(4);
        for (var i = 0; i < 4; i++) {
          channel_array[i] = Array();
        }

        for (var i = -1; i <= 1; i++) {
          for (var j = -1; j <= 1; j++) {
            var pixel = app.getPixelValue(c + i, r + j);
            for (var k = 0; k < 4; k++) {
              channel_array[k].push(pixel[k]);
            }
          }
        }


        var result = Array();
        for (var i = 0; i < 4; i++) {
          
          if (i == 3) {
            result.push(COLOR_WHITE);
          } else {
            var val = Math.max(
              Math.abs(channel_array[i][0] - channel_array[i][4]),
              Math.abs(channel_array[i][1] - channel_array[i][4]),
              Math.abs(channel_array[i][2] - channel_array[i][4]),
              Math.abs(channel_array[i][3] - channel_array[i][4]),
              Math.abs(channel_array[i][5] - channel_array[i][4]),
              Math.abs(channel_array[i][6] - channel_array[i][4]),
              Math.abs(channel_array[i][7] - channel_array[i][4]),
              Math.abs(channel_array[i][8] - channel_array[i][4]));
            
            result.push(val);
          }

        }

        return result;
      }

      for (var r = 0; r < app.real_height; r++) {
        for (var c = 0; c < app.real_width; c++) {
          grid[r][c] = get_difference(r, c);
        }
      }

      for (var r = 0; r < app.real_height; r++) {
        for (var c = 0; c < app.real_width; c++) {
          app.setPixelValue(c, r, grid[r][c]);
        }
      }

      app.showResultImage();
      return;
    }


    app.dotProduct = function (arr1, arr2) {
      var ret = 0;
      // console.log(arr1.length);
      // console.log(arr2.length);
      if (arr1.length == arr2.length) {
        for (var idx in arr1) {
          ret += arr1[idx] * arr2[idx];
        }
      }

      return ret;
    }


    app.processImagePrewittFilter = function () {
      var grid = Array(app.real_height);
      for (var i = 0; i < app.real_height; i++) {
        grid[i] = Array(app.real_width);
      }

      var getPrewitt = function (r, c) {
        var channel_array = Array(4);
        for (var i = 0; i < 4; i++) {
          channel_array[i] = Array();
        }

        var filter_vertical = [-1, 0, 1,
            -1, 0, 1,
            -1, 0, 1];

        // HORISONTAL
        var filter_horisontal = [-1, -1, -1, 
            0, 0, 0,
            1, 1, 1];
    

        for (var i = -1; i <= 1; i++) {
          for (var j = -1; j <= 1; j++) {
            var pixel = app.getPixelValue(c + i, r + j);
            for (var k = 0; k < 4; k++) {
              channel_array[k].push(pixel[k]);
            }
          }
        }

        var result = Array();
        for (var i = 0; i < 4; i++) {
          if (i == 3) {
            result.push(COLOR_WHITE);
          } else {
            var val_ver = app.dotProduct(filter_vertical, channel_array[i]);
            var val_hor = app.dotProduct(filter_horisontal, channel_array[i]);
            var val = Math.sqrt(val_ver*val_ver + val_hor*val_hor);
            result.push(val);
          }
        }

        return result;
      }

      for (var r = 0; r < app.real_height; r++) {
        for (var c = 0; c < app.real_width; c++) {
          grid[r][c] = getPrewitt(r, c);
        }
      }

      for (var r = 0; r < app.real_height; r++) {
        for (var c = 0; c < app.real_width; c++) {
          app.setPixelValue(c, r, grid[r][c]);
        }
      }

      app.showResultImage();

      return;
    }


    app.processImageSobelFilter = function () {
      var grid = Array(app.real_height);
      for (var i = 0; i < app.real_height; i++) {
        grid[i] = Array(app.real_width);
      }

      var getSobel = function (r, c) {
        var channel_array = Array(4);
        for (var i = 0; i < 4; i++) {
          channel_array[i] = Array();
        }

        var filter_vertical = [-1, 0, 1,
            -2, 0, 2,
            -1, 0, 1];

        // HORISONTAL
        var filter_horisontal = [-1, -2, -1, 
            0, 0, 0,
            1, 2, 1];
    

        for (var i = -1; i <= 1; i++) {
          for (var j = -1; j <= 1; j++) {
            var pixel = app.getPixelValue(c + i, r + j);
            for (var k = 0; k < 4; k++) {
              channel_array[k].push(pixel[k]);
            }
          }
        }

        var result = Array();
        for (var i = 0; i < 4; i++) {
          if (i == 3) {
            result.push(COLOR_WHITE);
          } else {
            var val_ver = app.dotProduct(filter_vertical, channel_array[i]);
            var val_hor = app.dotProduct(filter_horisontal, channel_array[i]);
            var val = Math.sqrt(val_ver*val_ver + val_hor*val_hor);
            result.push(val);
          }
        }

        return result;
      }

      for (var r = 0; r < app.real_height; r++) {
        for (var c = 0; c < app.real_width; c++) {
          grid[r][c] = getSobel(r, c);
        }
      }

      for (var r = 0; r < app.real_height; r++) {
        for (var c = 0; c < app.real_width; c++) {
          app.setPixelValue(c, r, grid[r][c]);
        }
      }

      app.showResultImage();

      return;
    }

    app.processImageRobertsFilter = function () {
      var grid = Array(app.real_height);
      for (var i = 0; i < app.real_height; i++) {
        grid[i] = Array(app.real_width);
      }

      var getRoberts = function (r, c) {
        var channel_array = Array(4);
        for (var i = 0; i < 4; i++) {
          channel_array[i] = Array();
        }

        var filter_vertical = [1, 0, 
          0, -1];
        var filter_horisontal = [0, 1, 
          -1, 0];

        for (var i = -1; i <= 0; i++) {
          for (var j = -1; j <= 0; j++) {
            var pixel = app.getPixelValue(c + i, r + j);
            for (var k = 0; k < 4; k++) {
              channel_array[k].push(pixel[k]);
            }
          }
        }

        var result = Array();
        for (var i = 0; i < 4; i++) {
          if (i == 3) {
            result.push(COLOR_WHITE);
          } else {
            var val_ver = app.dotProduct(filter_vertical, channel_array[i]);
            var val_hor = app.dotProduct(filter_horisontal, channel_array[i]);
            var val = Math.sqrt(val_ver*val_ver + val_hor*val_hor);
            result.push(val);
          }
        }

        return result;
      }

      for (var r = 0; r < app.real_height; r++) {
        for (var c = 0; c < app.real_width; c++) {
          grid[r][c] = getRoberts(r, c);
        }
      }

      for (var r = 0; r < app.real_height; r++) {
        for (var c = 0; c < app.real_width; c++) {
          app.setPixelValue(c, r, grid[r][c]);
        }
      }

      app.showResultImage();

      return;
    }

    app.processImageFreichenFilter = function () {
      var grid = Array(app.real_height);
      for (var i = 0; i < app.real_height; i++) {
        grid[i] = Array(app.real_width);
      }

      var getFreichen = function (r, c) {
        var channel_array = Array(4);
        for (var i = 0; i < 4; i++) {
          channel_array[i] = Array();
        }

        var F1 = [1, Math.sqrt(2), 1,
          0, 0, 0,
          -1, -Math.sqrt(2), -1];

        var F2 = [1, 0, -1,
          Math.sqrt(2), 0, -Math.sqrt(2),
          1, 0, -1];

        var F3 = [0, -1, Math.sqrt(2),
          1, 0, -1,
          -Math.sqrt(2), 1, 0];

        var F4 = [Math.sqrt(2), -1, 0,
          -1, 0, 1,
          0, 1, -Math.sqrt(2)];


        for (var i = -1; i <= 1; i++) {
          for (var j = -1; j <= 1; j++) {
            var pixel = app.getPixelValue(c + i, r + j);
            for (var k = 0; k < 4; k++) {
              channel_array[k].push(pixel[k]);
            }
          }
        }

        var result = Array();
        for (var i = 0; i < 4; i++) {
          if (i == 3) {
            result.push(COLOR_WHITE);
          } else {
            var val1 = app.dotProduct(F1, channel_array[i]);
            var val2 = app.dotProduct(F2, channel_array[i]);
            var val3 = app.dotProduct(F3, channel_array[i]);
            var val4 = app.dotProduct(F4, channel_array[i]);
            var val = Math.sqrt((val1 * val1 + val2 * val2 + val3 * val3 + val4 * val4) / 8);
            result.push(val);
          }
        }

        return result;
      }

      for (var r = 0; r < app.real_height; r++) {
        for (var c = 0; c < app.real_width; c++) {
          grid[r][c] = getFreichen(r, c);
        }
      }

      for (var r = 0; r < app.real_height; r++) {
        for (var c = 0; c < app.real_width; c++) {
          app.setPixelValue(c, r, grid[r][c]);
        }
      }

      app.showResultImage();

      return;
    }

    app.processImageCustomFilter = function () {
      var grid = Array(app.real_height);
      for (var i = 0; i < app.real_height; i++) {
        grid[i] = Array(app.real_width);
      }

      var getCustom = function (r, col) {
        var channel_array = Array(4);
        for (var i = 0; i < 4; i++) {
          channel_array[i] = Array();
        }
      
        var custom_filter = [
          document.getElementById("filter_1").value,
          document.getElementById("filter_2").value,
          document.getElementById("filter_3").value,
          document.getElementById("filter_4").value,
          document.getElementById("filter_5").value,
          document.getElementById("filter_6").value,
          document.getElementById("filter_7").value,
          document.getElementById("filter_8").value,
          document.getElementById("filter_9").value,
        ]

        for (var i = -1; i <= 1; i++) {
          for (var j = -1; j <= 1; j++) {
            var pixel = app.getPixelValue(col + i, r + j);
            for (var k = 0; k < 4; k++) {
              channel_array[k].push(pixel[k]);
            }
          }
        }

        var result = Array();
        for (var i = 0; i < 4; i++) {
          if (i == 3) {
            result.push(COLOR_WHITE);
          } else {
            var val = app.dotProduct(custom_filter, channel_array[i]);
            result.push(val);
          }
        }

        return result;
      }

      for (var r = 0; r < app.real_height; r++) {
        for (var c = 0; c < app.real_width; c++) {
          grid[r][c] = getCustom(r, c);
        }
      }

      for (var r = 0; r < app.real_height; r++) {
        for (var c = 0; c < app.real_width; c++) {
          app.setPixelValue(c, r, grid[r][c]);
        }
      }

      app.showResultImage();

      return;
    }

    app.processFaceDetection = function() {
      app.imageGrid.detectHumanSkin();
      app.imageData = app.imageGrid.data;
      app.showResultImage();
    }

    app.classify_digit = function (intersection_list, endpoint_list) {
      console.log(endpoint_list.length);
      console.log(intersection_list.length);
      if (endpoint_list.length == 0) {
        if (intersection_list.length == 0) {
          return 0;
        }
        else {
          return 8;
        }
      }
      else if (endpoint_list.length == 1) {
        if (intersection_list[0][0] < endpoint_list[0][0]) { // x intersection di atas
          return 9;
        }
        else {
          return 6;
        }
      }
      else if (endpoint_list.length == 2) {
        if (intersection_list.length == 1) {
          return 4;
        }
        else {
          if (endpoint_list[0][1] < 60) {
            if (endpoint_list[1][1] > 90) {
              return 2;
            } else {
              return 7;
            }
          }
          else {
            return 5;
          }
        }
      }
      else {
        if (endpoint_list[2][0] - intersection_list[0][0] < 10) {
          return 1;
        }
        else {
          return 3;
        }
      }
    };

    app.classify = function (intersection_list, endpoint_list) {
      if (endpoint_list.length == 0) {
        if (intersection_list.length == 0) {
          return '0';
        } else if (intersection_list.length == 2) {
          return '8';
        } else {
          return 'W';
        }
      }

      else if (endpoint_list.length == 1) {
        if (intersection_list.length == 0) {
          return '.';
        } else if (intersection_list.length == 1) {
          return 'e';
        }
      }

      else if (endpoint_list.length == 2) {
        if (intersection_list.length == 0) {
          var var_baris_end_0 = endpoint_list[0][0]/app.real_height;
          var var_kolom_end_0 = endpoint_list[0][1]/app.real_width;
          var var_baris_end_1 = endpoint_list[1][0]/app.real_height;
          var var_kolom_end_1 = endpoint_list[1][1]/app.real_width;
          
          if (var_baris_end_0 < 0.25) {
          	if (var_kolom_end_1 > 0.5) {
          	  return '(';
          	} else {
          	  return ')';
          	}
          }

          else if (var_baris_end_0 < 0.37) {
          	if (var_kolom_end_0 < 0.4) {
          	  if (var_baris_end_1 < 0.5) {
          	  	return 'U';
          	  } else {
          	  	if (var_kolom_end_1 < 0.35) {
          	  	  return 'b';
          	  	} else if (var_kolom_end_1 < 0.55) {
          	  	  return '7';
          	  	} else if (var_kolom_end_1 < 0.75) {
          	  	  return 'L';
          	  	} else {
          	  	  return 'Z';
          	  	}
          	  }
          	} else if (var_kolom_end_0 < 0.55) {
          	  if (var_baris_end_1 < 0.6) {
          	  	return '\'';
          	  } else {
          	  	return 'I';
          	  }
          	} else if (var_kolom_end_0 < 0.665) {
          	  if (var_kolom_end_1 < 0.32) {
          	  	return 'J';
          	  } else {
          	  	return '/';
          	  }
          	} else if (var_kolom_end_0 < 0.74) {
          	  if (var_baris_end_1 < 0.795) {
          	  	return '5';
          	  } else {
          	  	return '%';
          	  }
          	} else if (var_kolom_end_0 < 0.82) {
          	  return 'N';
          	} else {
          	  return 'V';
          	}
          }

          else if (var_baris_end_0 < 0.495) {
          	if (var_kolom_end_0 < 0.47) {
          	  if (var_kolom_end_1 < 0.7126) {
          	  	return '2';
          	  } else {
          	  	return 'z';
          	  }
          	} else if (var_kolom_end_0 < 0.85) {
          	  if (var_baris_end_1 < 0.53) {
          	  	return 'v';
          	  } else if (var_baris_end_1 < 0.64) {
          	  	return 'z';
          	  } else {
          	  	if (var_kolom_end_1 < 0.5) {
          	  	  return 'S';
          	  	} else {
          	  	  return 'C';
          	  	}
          	  }
          	} else {
          	  return 'w';
          	}
          }

          else if (var_baris_end_0 < 0.595) {
          	if (var_kolom_end_1 < 0.5) {
          	  return 's';
          	} else {
          	  return 'c';
          	}
          }

          else if (var_baris_end_0 < 0.71) {
          	return '-';
          }

          else {
          	if (var_kolom_end_1 < 0.64) {
          	  return ',';
          	} else {
          	  return 'M';
          	}
          }
        }

        else if (intersection_list.length == 1) {
          return 'Q';
        }
        else if (intersection_list.length == 1) {
          return 'a';
        } else {
          return '4';
        }
      }

      else if (endpoint_list.length == 3) {
        if (intersection_list.length == 0) {
          return 'i';
        } else if (intersection_list.length == 1) {
          return '3';
        } else if (intersection_list.length < 5) {
          return '4';
        } else {
          return '$';
        }
      }

      else if (endpoint_list.length == 4) {
        if (intersection_list.length == 0) {
          return '"';
        } else if (intersection_list.length == 1) {
          return 'X';
        } else if (intersection_list.length == 2) {
          return 'K';
        } else {
          return 'f';
        }
      }

      else if (endpoint_list.length == 4) {
        return '*';
      }

      else {
      	return '#';
      }

       
    };



  /*****************************************************************************
   *
   * Another function for image processing
   *
   ****************************************************************************/
   
   var nbrs = [[0, -1], [1, -1], [1, 0], [1, 1], [0, 1], [-1, 1], [-1, 0], [-1, -1], [0, -1]];
   var nbrGroups = [[[0, 2, 4], [2, 4, 6]], [[0, 2, 6], [0, 4, 6]]];

   // Menghitung jumlah tetangga yang berwarna putih 
   app.countBlackNighbors = function(row, column) {
      var count = 0;

      for (var i = 0; i < nbrs.length-1; i++) {
        var r = row + nbrs[i][1];
        var c = column + nbrs[i][0];

        if (r < 0 || c < 0 || r > app.real_height-1 || r > app.real_width-1) {
          continue;
        }

        var offset = (app.real_width * r + c)*4;
        if (app.imageData[offset] == COLOR_BLACK) {
          count++;
        }

      }

      return count;
    }

    app.countTransition = function(row, column) {
      var count = 0;

      for (var i = 0; i < nbrs.length-1; i++) {
        var r = row + nbrs[i][1];
        var c = column + nbrs[i][0];

        if (r < 0 || c < 0 || r > app.real_height-1 || r > app.real_width-1) {
          continue;
        }

        var offset = (app.real_width * r + c)*4;
        if (app.imageData[offset] == COLOR_WHITE) {
          r = row + nbrs[i+1][1];
          c = column + nbrs[i+1][0];
          offset = (app.real_width * r + c)*4;
          if (app.imageData[offset] == COLOR_BLACK) {
            count++;
          }
        }

      }

      return count;
    }

    app.atLeastOneIsWhite = function(row, column, step) {
      var count = 0;
      var group = nbrGroups[step];

      for (var i = 0; i < 2; i++)
        for (var j = 0; j < group[i].length; j++) {
            var nbr = nbrs[group[i][j]];
            var r = row + nbr[1];
            var c = column + nbr[0];
            var offset = (app.real_width * r + c)*4;
            if (app.imageData[offset] == COLOR_WHITE) {
                count++;
                break;
            }
        }

      return count > 1;
    }

    app.getHistSpecArr = function(cum_first, cum_second) {
      
      // normaliaasi ukuran.
      // biar max nya sama
      for (var i =0; i < 256; ++i) {
        cum_first[i] = Math.round(cum_first[i] * cum_second[255] / cum_first[255]);
      }
      
      // console.log(cum_first);
      // console.log(cum_second);
      
      var inverse_second = [];
      var last_val = 0;
      for (var i = 0; i < cum_second[255]; ++i) {
        if (i <= cum_second[0]) {
          inverse_second[i] = 0;
        } else if (i >= cum_second[255]) {
          inverse_second[i] = 255;
        } else {
          if (i <= cum_second[last_val]) {
            inverse_second[i] = last_val;
          } else if (i > cum_second[last_val]) {
            var range = cum_second[last_val+1] - cum_second[last_val];
            var dif = i - cum_second[last_val];
            if (2*dif >= range) {
              last_val++;
            }
            inverse_second[i] = last_val;
          }
        }
      }
      
      // console.log("INVERSE");
      // console.log(cum_first[255]);
      // console.log(inverse_second);

      var ret = [];
      for (var i = 0; i < 256; ++i) {
        ret[i] = inverse_second[cum_first[i]];
      }

      return ret;

    }

    // Calculate image RGB-Grey histogram, using canvas
    app.calculateHistogram = function() {
      var img = app.image;

      var type = 'rgb';
      var maxCount = 0, val, subtypes = [type];

      chans = [[], [], [], []];
      subtypes = ['red', 'green', 'blue', 'grey'];

      for (var cnl = 0; cnl < chans.length; cnl++) {
        for (var x = 0; x < 256; x++)
          chans[cnl][x] = 0;
      }

      var step = 1;
      if (isNaN(step) || step < 1) {
        step = 1;
      } else if (step > 50) {
        step = 50;
      }
      step *= 4;

      for (var i = 0, n = app.imageData.length; i < n; i+= step) {
        val = [
          app.imageData[i], 
          app.imageData[i+1], 
          app.imageData[i+2], 
          Math.round((app.imageData[i]+app.imageData[i+1]+app.imageData[i+2])/3)
        ];

        for (var y = 0; y < val.length; y++) {
          chans[y][val[y]]++;

          if (chans[y][val[y]] > maxCount) {
            maxCount = chans[y][val[y]];
          }
        }
      }

      if (maxCount === 0) {
        return;
      }
    };

    // Unhide histogram div to show all the histogram generated
    app.showHistogram = function() {
      // Draw histogram
      var hist_id = ['#histRed', '#histGreen', '#histBlue', '#histGrey'];
      var cum_id = ['#cumRed', '#cumGreen', '#cumBlue', '#cumGrey'];
      for (var cnl = 0; cnl < chans.length; cnl++) {
        var data = {
          labels: [...Array(256).keys()],
          series: [
            chans[cnl]
          ]
        };
        
        // console.log("chans")
        // console.log(chans[cnl]);

        var cum = [];
        var sum_cum = 0;
        for (var i = 0; i < chans[cnl].length; ++i) {
          cum[i] = chans[cnl][i] + sum_cum;
          sum_cum += chans[cnl][i];
        }

        if (cnl == 0) {
          r_cum = cum;
          first_cum = r_cum;
        } else if (cnl == 1) {
          g_cum = cum;
        } else if (cnl == 2) {
          b_cum = cum;
        }

        // for (var i = 0; i < chans[cnl].length; ++i) {
        //   cum[i] /= sum_cum;
        // }

        // console.log(cum);
        var cum_dis = {
          labels: [...Array(256).keys()],
          series: [
            cum
          ]
        };

        new Chartist.Bar(hist_id[cnl], data, properties);
        new Chartist.Line(cum_id[cnl], cum_dis, properties, responsiveOptions);
      }
    };

    app.CalculateAluMapping = function () {
      // console.log(r_cum);
      // console.log(g_cum);
      // console.log(b_cum);
      image_size = app.real_width * app.real_height;
      for (var i = 0; i < r_cum.length; ++i) {
        r_map[i] = Math.abs(Math.round((r_cum[i]-1)*255/image_size));
      }
      // console.log(r_map);
      for (var i = 0; i < g_cum.length; ++i) {
        g_map[i] = Math.abs(Math.round((g_cum[i] - 1) * 255 / image_size));
      }

      for (var i = 0; i < b_cum.length; ++i) {
        b_map[i] = Math.abs(Math.round((b_cum[i] - 1) * 255 / image_size));
      }
    };

    app.convertImage = function () {
      var step = 4;

      for (var i = 0, n = app.imageData.length; i < n; i += step) {
        app.imageData[i] = r_map[app.imageData[i]];
        app.imageData[i + 1] = g_map[app.imageData[i + 1]];
        app.imageData[i + 2] = b_map[app.imageData[i + 2]];
      }
    } 

    app.showResultImage = function () {
      var canvas = document.createElement("canvas");
      canvas.setAttribute("id", "mainCanvas");
      canvas.width = app.real_width;
      canvas.height = app.real_height;
      var ctx = canvas.getContext("2d");
      ctx.putImageData(new ImageData(app.imageData, canvas.width, canvas.height), 0, 0);  
      app.imageAfter.src = canvas.toDataURL("img/png");
    }

    app.drawSquare = function(x, y, color) {
      for (var i = x-3; i <= x+3; i++) {
        app.setPixelValue(i, y-3, color);
        app.setPixelValue(i, y+3, color);
      }
      for (var i = y-3; i < y+3; i++) {
        app.setPixelValue(x-3, i, color);
        app.setPixelValue(x+3, i, color);
      }
    }

    if('serviceWorker' in navigator) {
        navigator.serviceWorker
        .register('scripts/service-worker.js')
        .then(function() {
          console.log("Service Worker registered successfully");
        })
        .catch(function() {
          console.log("Service worker registration failed")
        });
    }

    let deferredPrompt;
    window.addEventListener('beforeinstallprompt', (e) => {
        // Prevent Chrome 67 and earlier from automatically showing the prompt
        e.preventDefault();
        // Stash the event so it can be triggered later.
        deferredPrompt = e;
        alert('This app can be installed!');
        prompt();
    });

}());