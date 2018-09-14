// Copyright 2018 Fadhil, Hilmi, Arno

(function() {

    'use strict';

    /*****************************************************************************
     *
     * UI Elements Initialization Section
     *
     ****************************************************************************/
    
    // Initialize select-mode input
    document.addEventListener('DOMContentLoaded', function() {
        var elems = document.querySelectorAll('select');
        var instances = M.FormSelect.init(elems);
    });


    /*****************************************************************************
     *
     * Application, constant, and other global variables
     *
     ****************************************************************************/

    const MODE_HIST_EQUAL = 0;
    const MODE_HIST_SPEC = 1;

    var app = {
        isLoading: true,
        image: document.getElementById("imgBefore"),
        imageAfter :document.getElementById("imgAfter"),
        imageCanvas: document.createElement("canvas"),
        imageCtx: null,
        imageData: null,
        mode: MODE_HIST_EQUAL
            // 0 Histogram Equalization
            // 1 Histogram Specification
    };

})();