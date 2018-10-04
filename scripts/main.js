// Copyright 2018 Fadhil, Hilmi, Arno

(function() {
    'use strict';

    document.addEventListener('DOMContentLoaded', function() {
      var elems = document.querySelectorAll('select');
      var instances = M.FormSelect.init(elems);
    });

    const MODE_HIST_EQUAL = 0;
    const MODE_HIST_SPEC = 1;
    const MODE_OCR = 2;
    const MODE_THINNING = 3;

    const COLOR_WHITE = 255;
    const COLOR_BLACK = 0;
    const COLOR_DONT_CARE = 99;

    var B1 = [
      [COLOR_DONT_CARE, COLOR_BLACK, COLOR_BLACK],
      [COLOR_WHITE, COLOR_WHITE, COLOR_BLACK],
      [COLOR_DONT_CARE, COLOR_BLACK, COLOR_BLACK]
    ]
    var B2 = [
      [COLOR_DONT_CARE, COLOR_WHITE, COLOR_DONT_CARE],
      [COLOR_BLACK, COLOR_WHITE, COLOR_BLACK],
      [COLOR_BLACK, COLOR_BLACK, COLOR_BLACK]
    ]
    var B3 = [
      [COLOR_BLACK, COLOR_BLACK, COLOR_DONT_CARE],
      [COLOR_BLACK, COLOR_WHITE, COLOR_WHITE],
      [COLOR_BLACK, COLOR_BLACK, COLOR_DONT_CARE]
    ]
    var B4 = [
      [COLOR_BLACK, COLOR_BLACK, COLOR_BLACK],
      [COLOR_BLACK, COLOR_WHITE, COLOR_BLACK],
      [COLOR_DONT_CARE, COLOR_WHITE, COLOR_DONT_CARE]
    ]
    var B5 = [
      [COLOR_WHITE, COLOR_BLACK, COLOR_BLACK],
      [COLOR_BLACK, COLOR_WHITE, COLOR_BLACK],
      [COLOR_BLACK, COLOR_BLACK, COLOR_BLACK]
    ]
    var B6 = [
      [COLOR_BLACK, COLOR_BLACK, COLOR_WHITE],
      [COLOR_BLACK, COLOR_WHITE, COLOR_BLACK],
      [COLOR_BLACK, COLOR_BLACK, COLOR_BLACK]
    ]
    var B7 = [
      [COLOR_BLACK, COLOR_BLACK, COLOR_BLACK],
      [COLOR_BLACK, COLOR_WHITE, COLOR_BLACK],
      [COLOR_BLACK, COLOR_BLACK, COLOR_WHITE]
    ]
    var B8 = [
      [COLOR_BLACK, COLOR_BLACK, COLOR_BLACK],
      [COLOR_BLACK, COLOR_WHITE, COLOR_BLACK],
      [COLOR_WHITE, COLOR_BLACK, COLOR_BLACK]
    ]
    
    var B = [B1, B2, B3, B4, B5, B6, B7, B8];

    var app = {
      isLoading: true,
      image: document.getElementById("imgBefore"),
      imageAfter: document.getElementById("imgAfter"),
      imageRaw: null,
        // variable to store raw uploaded image
      imageCanvas: document.createElement("canvas"),
      imageCtx: null,
      imageData: null,
      mode: MODE_THINNING
      // mode: MODE_HIST_EQUAL
        // 0 Histogram Equalization
        // 1 Histogram Specification
    };

    // default value for slider
    var sliderVal = [10, 50, 90, 50, 10];

    var chans = [[]];
    var r_cum = [], r_map = [];
    var g_cum = [], g_map = [];
    var b_cum = [], b_map = [];
    var image_size;
    var first_cum;

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
    var inputHistogram = document.getElementById("inputHistogram");

    inputMode.addEventListener('change', function() {
      var mode = inputMode.options[inputMode.selectedIndex].value;
      if (mode === 'equalization') {
        app.mode = MODE_HIST_EQUAL;
      } else if (mode == 'specification') {
        app.mode = MODE_HIST_SPEC;
      } else if (mode == 'ocr') {
        app.mode = MODE_OCR;
      } else {
        app.mode = MODE_THINNING;
      }

      // reset all after mode changed
      if (app.imageRaw != null) {
        app.imageRaw = null;
        app.image.src = 'images/empty.png';
        app.imageAfter.src = 'images/empty.png';
        inputImageCamera.value = '';
        inputImageGallery.value = '';
        viewHistogram.style.display = 'none';
        inputHistogram.style.display = 'none';
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
        app.image.onload = function () {

          if (app.imageRaw == null) {
            return;
          }

          // prepare canvas and data for processing
          app.imageCanvas.width = app.image.width;
          app.imageCanvas.height = app.image.height;
          app.imageCtx = app.imageCanvas.getContext('2d');
          app.imageCtx.drawImage(app.image, 0, 0, app.image.width, app.image.height);
          app.imageData = app.imageCtx.getImageData(0, 0, app.image.width, app.image.height).data;
          
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
          }
          
        }
        app.image.src = e.target.result;

      };
      reader.readAsDataURL(image);

    };

    // Main function to handle histogram equalization
    app.processImageEqualization = function() {
        viewHistogram.style.display = "block";
            
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

      var form = document.createElement("form");

      var imageInput = null;
      if (inputImageCamera.src != null) {
        imageInput = inputImageCamera;
      } else {
        imageInput = inputImageGallery;
      }
      form.appendChild(imageInput);
      document.body.appendChild(form);

      var xhr = new XMLHttpRequest();
      xhr.open("POST", "https://citra-apps.herokuapp.com/process", true);
      xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
      xhr.responseType = "arraybuffer";

      // Load result to image after
      xhr.onload = function(e) {
        if (this.status == 200) {
          var uInt8Array = new Uint8Array(this.response);
          var i = uInt8Array.length;
          var binaryString = new Array(i);
          while (i--) {
            binaryString[i] = String.fromCharCode(uInt8Array[i]);
          }
          var data = binaryString.join('');
          var base64 = window.btoa(data);
      
          app.imageAfter.src="data:image/png;base64,"+base64;
        }
      }

      xhr.send(new FormData(form));

    };

    app.getPixelValue = function(x, y) {
      var arr = Array(4);
      var offset = (app.image.width * y + x) * 4;
      for (var i = 0; i < 4; ++i) {
        arr.push(app.imageData[offset+i]);
      }

      return arr;
    }

    app.getPixelValue = function (x, y) {
      var arr = Array(4);
      var offset = (app.image.width * y + x) * 4;
      for (var i = 0; i < 4; ++i) {
        arr.push(app.imageData[offset + i]);
      }

      return arr;
    }

    app.setPixelValue = function (x, y, val) {
      var offset = (app.image.width * y + x) * 4;
      for (var i = 0; i < 4; ++i) {
        app.imageData[offset + i] = val[i];
      }
    }

    app.findEndPoints = function (grid) {

      // for (var r = 0; r < app.image.height; ++r) {
      //   for (var c = 0; c < app.image.width; ++c) {
      //     if (grid[r][c] == COLOR_BLACK) {
      //       grid[r][c] == COLOR_WHITE;
      //     } else {
      //       grid[r][c] == COLOR_BLACK;
      //     }
      //   }
      // }

      console.log("Nyoba Grid");

      var str = "";

      for (var r = 0; r < app.image.height; r++) {
        for (var c = 0; c < app.image.width; c++) {
          if (grid[r][c] == COLOR_WHITE) {
            str += " ";
          } else {
            str += "#"
          }
        }
        console.log(str);
        str = "";
      }

      var EndPoints = {};
      EndPoints.grid = Array(app.image.height);


      for (var r = 0; r < app.image.height; ++r) {
        EndPoints.grid[r] = Array(app.image.width);
        for (var c = 0; c < app.image.width; ++c) {
          EndPoints.grid[r].push(COLOR_BLACK);
        }
      }

      EndPoints.match3x3Array = function(X, Y) {
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

      for (var r = 1; r < app.image.height-1; ++r) {
        for (var c = 1; c < app.image.width-1; ++c) {
          var last_point = false;
          var arr = [
            [grid[r-1][c-1], grid[r-1][c], grid[r-1][c+1]],
            [grid[r][c-1], grid[r][c], grid[r][c+1]],
            [grid[r+1][c-1], grid[r+1][c], grid[r+1][c+1]]
          ]

          B.forEach(function (element) {
            var is_equal = EndPoints.match3x3Array(element, arr);
            if (is_equal) {
              last_point = true
            }
          });

          if (last_point) {
            EndPoints.grid[r][c] = COLOR_WHITE;
          }
          
        }
      }

      // EndPoints.grid[2][2] = COLOR_WHITE;

      return EndPoints.grid;

    }

    // Main function to handle image thinning
    app.processImageThinning = function() {
      var ZhangSuen = {};
      ZhangSuen.grid = Array(app.image.height);
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
        if (column == app.image.width) {
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

      for (var r = 0; r < app.image.height; r++) {
        for (var c = 0; c < app.image.width; c++) {
          // var offset = (app.image.width*r + c)*4;
          if (ZhangSuen.grid[r][c] == COLOR_WHITE) {
            app.setPixelValue(c, r, WHITE);
            // app.imageData[offset] = COLOR_WHITE;
            // app.imageData[offset+1] = COLOR_WHITE;
            // app.imageData[offset+2] = COLOR_WHITE;
          } else {
            app.setPixelValue(c, r, BLACK);
            // app.imageData[offset] = COLOR_BLACK;
            // app.imageData[offset+1] = COLOR_BLACK;
            // app.imageData[offset+2] = COLOR_BLACK;
          }
        }
      }

      for (var r = 0; r < app.image.height; ++r) {
        for (var c = 0; c < app.image.width; ++c) {
          if (ZhangSuen.grid[r][c] == COLOR_BLACK) {
            ZhangSuen.grid[r][c] = COLOR_WHITE;
          } else {
            ZhangSuen.grid[r][c] = COLOR_BLACK;
          }
        }
      }
      
      var grid = app.findEndPoints(ZhangSuen.grid);
      
      // Cetak Gambar di Console
      console.log(app.image.height);
      console.log(app.image.width);
      var str = "";

      for (var r = 0; r < app.image.height; r++) {
        for (var c = 0; c < app.image.width; c++) {
          var offset = (app.image.width * r + c) * 4;
          if (grid[r][c] == COLOR_WHITE) {
            str += " ";
          } else {
            str += "#"
          }
        }
        console.log(str);
        str = "";
      }

      app.showResultImage();

    }



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

        if (r < 0 || c < 0 || r > app.image.height-1 || r > app.image.width-1) {
          continue;
        }

        var offset = (app.image.width * r + c)*4;
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

        if (r < 0 || c < 0 || r > app.image.height-1 || r > app.image.width-1) {
          continue;
        }

        var offset = (app.image.width * r + c)*4;
        if (app.imageData[offset] == COLOR_WHITE) {
          r = row + nbrs[i+1][1];
          c = column + nbrs[i+1][0];
          offset = (app.image.width * r + c)*4;
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
            var offset = (app.image.width * r + c)*4;
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
      image_size = app.image.width * app.image.height;
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
      canvas.width = app.image.width;
      canvas.height = app.image.height;
      var ctx = canvas.getContext("2d");
      ctx.putImageData(new ImageData(app.imageData, canvas.width, canvas.height), 0, 0);  
      app.imageAfter.src = canvas.toDataURL("img/png");
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