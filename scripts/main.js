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

    var app = {
      isLoading: true,
      image: document.getElementById("imgBefore"),
      imageAfter: document.getElementById("imgAfter"),
      imageRaw: null,
        // variable to store raw uploaded image
      imageCanvas: document.createElement("canvas"),
      imageCtx: null,
      imageData: null,
      mode: MODE_HIST_EQUAL
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
      } else {
        app.mode = MODE_OCR;
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

    function postImage() {
      return false;
    }



  /*****************************************************************************
   *
   * Another function for image processing
   *
   ****************************************************************************/

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