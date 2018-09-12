
/**
 * constructs a Correlation object with a few public methods for analyzing data sets
 * @param x - an array of Numbers
 * @param y - an array of Numbers
 * @constructor
 */
function Correlation(x, y){
    this.x       = x;
    this.y       = y;
}

/**
 * Gets the correlation coefficient of 2 lists
 * @returns {number}
 */
Correlation.prototype.correlationCoefficient = function(){
    return this.diffFromAvg() / (Math.sqrt(this.diffFromAvgSqrd(X) * this.diffFromAvgSqrd(Y)));
};


/**
 * get the average of a list
 * @param aList - array
 * @returns {number}
 */
Correlation.prototype.avg = function(aList){
    var sum = 0;
    for(var i = 0; i < aList.length; i++){
        sum += aList[i];
    }
    return sum / aList.length;
};

/**
 * gets the standard deviation of an array
 * @param aList
 * @returns {number}
 */
Correlation.prototype.stdv = function(aList){
    return Math.sqrt(this.diffFromAvgSqrd(aList) / (aList.length - 1));
};

/**
 * The B part of the regression equation -> y = mx + B
 * @returns {number}
 */
Correlation.prototype.b0 = function(){
    return this.avg(this.y) - this.b1() * this.avg(this.x);
};

/**
 * the M part of the regression equation -> y = Mx + b
 * @returns {number}
 */
Correlation.prototype.b1 = function(){
    return this.diffFromAvg() / this.diffFromAvgSqrd(X);
};


/**
 * gets the sum of (Xi - Mx)(Yi - My)
 * @returns {number}
 */
Correlation.prototype.diffFromAvg = function(){
    var sum = 0;
    for(var i = 0; i < this.x.length; i++){
        sum += (this.x[i] - this.avg(x)) * (y[i] - this.avg(y));
    }
    return sum;
};

/**
 * Returns the sum of (Xi - Mx)^2
 * @param aList
 * @returns {number}
 */
Correlation.prototype.diffFromAvgSqrd = function(aList){
    var sum = 0;
    for(var i = 0; i < aList.length; i++){
        sum += Math.pow((aList[i] - this.avg(aList)), 2);
    }
    return sum;
};

/**
 * Gets the sum of a list
 * @param aList
 * @returns {number}
 */
Correlation.prototype.sumList = function(aList){
    var sum = 0;

    for(var i = 0; i < aList.length; i++){
        sum += aList[i];
    }
    return sum;
};

/**
 * sum of each list item squared
 * @param aList
 * @returns {number}
 */
Correlation.prototype.sumSquares = function(aList){
    var sum = 0;

    for(var i = 0; i < aList.length; i++){
        sum += Math.pow(aList[i], 2);
    }
    return sum;
};

Correlation.prototype.sumXTimesY = function(){
    var sum = 0;

    for(var i = 0; i < this.x.length; i++){
        sum += (this.y[i] * this.x[i]);
    }
    return sum;
};

/**
 * Gives the predicted value of the dependent variable based on the independent variable.
 * The equation is in the from y = mx + b
 * @param independentVariable
 * @returns {number}
 */
Correlation.prototype.linearRegression = function(independentVariable){
    return this.b1() * independentVariable + this.b0();
};

function Matrix(){

}

/**
 * performs backward substitution on a matrix
 * @param anyMatrix - a matrix that has already undergone forward substitution
 * @param arr - an array that will ultimately be the final output for A0 - Ak
 * @param row - last row index
 * @param col - column index
 * @returns {*}
 */
Matrix.prototype.backwardSubstitution = function(anyMatrix, arr, row, col){

    if(row < 0 || col < 0){
        return arr;
    } else{
        var rows = anyMatrix.length;
        var cols = anyMatrix[0].length - 1;
        var current = 0;
        var counter = 0;

        for(var i = cols - 1; i >= col; i--){

            if(i == col){
                current = anyMatrix[row][cols] / anyMatrix[row][i];


            } else{
                anyMatrix[row][cols] -= anyMatrix[row][i] * arr[rows - 1 - counter];
                counter++;
            }
        }

        arr[row] = current;
        return this.backwardSubstitution(anyMatrix, arr, row - 1, col - 1);
    }
};


/**
 * Combines a square matrix with a matrix with K rows and only 1 column for GJ Elimination
 * @param left
 * @param right
 * @returns {*[]}
 */
Matrix.prototype.combineMatrices = function(left, right){

    var rows = right.length;
    var cols = left[0].length;
    var returnMatrix = [];

    for (var i = 0; i < rows; i++) {
        returnMatrix.push([]);

        for (var j = 0; j <= cols; j++) {

            if (j == cols) {

                returnMatrix[i][j] = right[i];

            } else {

                returnMatrix[i][j] = left[i][j];
            }
        }
    }

    return returnMatrix;
};

/**
 * Performs forward elimination for GJ elimination to form an upper right triangle matrix
 * @param anyMatrix
 * @returns {*[]}
 */
Matrix.prototype.forwardElimination = function(anyMatrix){

    var rows        = anyMatrix.length;
    var cols        = anyMatrix[0].length;
    var aMatrix     = [];
    //returnMatrix = anyMatrix;
    for (var i = 0; i < rows; i++) {

        aMatrix.push([]);

        for (var j = 0; j < cols; j++) {
            aMatrix[i][j] = anyMatrix[i][j];
        }
    }

    for (var x = 0; x < rows - 1; x++) {

        for (var z = x; z < rows - 1; z++) {

            var numerator   = aMatrix[z + 1][x];
            var denominator = aMatrix[x][x];
            var result      = numerator / denominator;


            for (var i = 0; i < cols; i++) {

                aMatrix[z + 1][i] = aMatrix[z + 1][i] - (result * aMatrix[x][i]);
            }
        }
    }
    return aMatrix;
};

/**
 * THIS METHOD ACTS LIKE A CONTROLLER AND PERFORMS ALL THE NECESSARY STEPS OF GJ ELIMINATION TO PRODUCE
 * THE TERMS NECESSARY FOR POLYNOMIAL REGRESSION USING THE LEAST SQUARES METHOD WHERE SUM(RESIDUALS) = 0
 * @param leftMatrix
 * @param rightMatrix
 * @returns {*}
 */
Matrix.prototype.gaussianJordanElimination = function(leftMatrix, rightMatrix){

    var combined        = this.combineMatrices(leftMatrix, rightMatrix);
    var fwdIntegration  = this.forwardElimination(combined);
    //NOW, FINAL STEP IS BACKWARD SUBSTITUTION WHICH RETURNS THE TERMS NECESSARY FOR POLYNOMIAL REGRESSION
    return this.backwardSubstitution(fwdIntegration, [], fwdIntegration.length - 1, fwdIntegration[0].length - 2);
};

/**
 * returns the identity matrix for a matrix such that anyMatrix * identitymatrix = anyMatrix
 * This is useful for inverting a matrix
 * @param anyMatrix
 * @returns {*[]}
 */
Matrix.prototype.identityMatrix = function(anyMatrix){

    var rows = anyMatrix.length;
    var cols = anyMatrix[0].length;
    var identityMatrix = [[]];

    for (var i = 0; i < rows; i++) {
        for (var j = 0; j < cols; j++) {
            if (j == i) {
                identityMatrix[i][j] = 1;
            } else {
                identityMatrix[i][j] = 0;
            }
        }
    }
    return identityMatrix;
};


/**
 * calculates the product of 2 matrices
 * @param matrix1
 * @param matrix2
 * @returns {*}
 */
Matrix.prototype.matrixProduct = function(matrix1, matrix2){
    var numCols1 = matrix1[0].length;
    var numRows2 = matrix2.length;

    if(numCols1 != numRows2){
        return false;
    }

    var product = [[]];

    for (var rows = 0; rows < numRows2; rows++) {
        for (var cols = 0; cols < numCols1; cols++) {
            product[rows][cols] = this.doMultiplication(matrix1, matrix2, rows,
                cols, numCols1);
        }
    }
    return product;
};

/**
 * performs multiplication for an individual matrix cell
 * @param matrix1
 * @param matrix2
 * @param row
 * @param col
 * @param numCol
 * @returns {number}
 */
Matrix.prototype.doMultiplication = function(matrix1, matrix2, row, col, numCol){
    var counter = 0;
    var result = 0;
    while (counter < numCol) {
        result += matrix1[row][counter] * matrix2[counter][col];
        counter++;
    }
    return result;
};


/**
 * Multiplies a row of a matrix - 1 of the fundamental matrix operations
 * @param anyMatrix
 * @param rowNum
 * @param multiplier
 * @returns {*[]}
 */
Matrix.prototype.multiplyRow = function(anyMatrix, rowNum, multiplier){
    var rows = anyMatrix.length;
    var cols = anyMatrix[0].length;
    var mMatrix = [[]];

    for (var i = 0; i < rows; i++) {
        for (var j = 0; j < cols; j++) {
            if (i == rowNum) {
                mMatrix[i][j] = anyMatrix[i][j] * multiplier;
            } else {
                mMatrix[i][j] = anyMatrix[i][j];
            }
        }
    }

    return mMatrix;
};

/**
 * Simple data point object for use as a consistent data storage mechanism
 * @param x
 * @param y
 * @constructor
 */
function DataPoint(x,y){
    this.x = x;
    this.y = y;
}


/**
 * The constructor for a PolynomialRegression object an example of it's usage is below
 * @param theData
 * @param degrees
 * @constructor
 */
function PolynomialRegression(theData, degrees){


    //private object variables
    this.data        = theData;
    this.degree      = degrees;
    this.matrix      = new Matrix();
    this.leftMatrix  = [];
    this.rightMatrix = [];

    this.generateLeftMatrix();
    this.generateRightMatrix();
}

/**
 * Sums up all x coordinates raised to a power
 * @param anyData
 * @param power
 * @returns {number}
 */
PolynomialRegression.prototype.sumX = function(anyData, power){
    var sum = 0;
    for (var i = 0; i < anyData.length; i++) {
        sum += Math.pow(anyData[i].x, power);
    }
    return sum;
};


/**
 * sums up all x * y where x is raised to a power
 * @param anyData
 * @param power
 * @returns {number}
 */
PolynomialRegression.prototype.sumXTimesY = function(anyData, power){
    var sum = 0;
    for (var i = 0; i < anyData.length; i++) {
        sum += Math.pow(anyData[i].x, power) * anyData[i].y;
    }
    return sum;
};


/**
 * Sums up all Y's raised to a power
 * @param anyData
 * @param power
 * @returns {number}
 */
PolynomialRegression.prototype.sumY = function(anyData, power){
    var sum = 0;
    for (var i = 0; i < anyData.length; i++) {
        sum += Math.pow(anyData[i].y, power);
    }
    return sum;
};

/**
 * generate the left matrix
 */
PolynomialRegression.prototype.generateLeftMatrix = function(){
    for (var i = 0; i <= this.degree; i++) {
        this.leftMatrix.push([]);
        for (var j = 0; j <= this.degree; j++) {
            if (i === 0 && j === 0) {
                this.leftMatrix[i][j] = this.data.length;
            } else {
                this.leftMatrix[i][j] = this.sumX(this.data, (i + j));
            }
        }
    }
};

/**
 * generates the right hand matrix
 */
PolynomialRegression.prototype.generateRightMatrix = function(){
    for (var i = 0; i <= this.degree; i++) {
        if (i === 0) {
            this.rightMatrix[i] = this.sumY(this.data, 1);
        } else {
            this.rightMatrix[i] = this.sumXTimesY(this.data, i);
        }
    }
};


/**
 * gets the terms for a polynomial
 * @returns {*}
 */
PolynomialRegression.prototype.getTerms = function(){
    return this.matrix.gaussianJordanElimination(this.leftMatrix, this.rightMatrix);
};

/**
 * Predicts the Y value of a data set based on polynomial coefficients and the value of an independent variable
 * @param terms
 * @param x
 * @returns {number}
 */
PolynomialRegression.prototype.predictY = function(terms, x){

    var result = 0;
    for (var i = terms.length - 1; i >= 0; i--) {
        if (i == 0) {
            result += terms[i];
        } else {
            result += terms[i] * Math.pow(x, i);
        }
    }
    return result;
};

PolynomialRegression.runTest = function(degree){

  var actualData = [], regressionData = [], someData = [];
  
  for(var i = 0; i < 100; i++){
    var x = i;
    var randomY = getRandomInt(5, 20);
    someData.push(new DataPoint(x, randomY));
    actualData.push({x: x, y: randomY});
  }

   var poly = new PolynomialRegression(someData, degree);
   var terms = poly.getTerms();

  actualData.forEach(function(data){
    regressionData.push({x: data.x, y: poly.predictY(terms, data.x)});
  });

  return {actual : actualData, regression : regressionData}
};



function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min)) + min;
}

function graphTest(obj, svg){
  

  /*These lines are all chart setup.  Pick and choose which chart features you want to utilize. */
  nv.addGraph(function() {
    var chart = nv.models.lineChart()
                  .margin({left: 100})  //Adjust chart margins to give the x-axis some breathing room.
                  // .useInteractiveGuideline(true)  //We want nice looking tooltips and a guideline!
                  // .transitionDuration(350)  //how fast do you want the lines to transition?
                  .showLegend(true)       //Show the legend, allowing users to turn on/off line series.
                  .showYAxis(true)        //Show the y-axis
                  .showXAxis(true)        //Show the x-axis
    ;

    chart.xAxis     //Chart x-axis settings
        .axisLabel('Bar')
        .tickFormat(d3.format(',r'));

    chart.yAxis     //Chart y-axis settings
        .axisLabel('Foo')
        .tickFormat(d3.format('.02f'));

    /* Done setting the chart up? Time to render it!*/
    var myData = [{
        values: obj.actual,      //values - represents the array of {x,y} data points
        key: 'Actual Data'
    },{
      values: obj.regression,      //values - represents the array of {x,y} data points
        key: 'Regression Data',
      color: '#009688'
    }];   //You need data...

    d3.select(svg)    //Select the <svg> element you want to render the chart in.   
        .datum(myData)         //Populate the <svg> element with chart data...
        .call(chart);          //Finally, render the chart!

    //Update the chart when window resizes.
    nv.utils.windowResize(function() { chart.update() });
    return chart;
  });
  
}


// $(document).ready(function() {

//   var svg   = document.querySelector('svg');
//   var input = document.querySelector('input[type=text]');
//   var obj   = PolynomialRegression.runTest(3);
//   graphTest(obj, svg);
  
  
//   $(input).focus().on('input', function(){
//     $(this).css('border-bottom', '1px solid #fff');
//     if(this.value.trim().length > 0){
//       if(!isNaN(parseInt(this.value))){
//         $(svg).empty();
//         var obj   = PolynomialRegression.runTest(this.value);
//         graphTest(obj, svg);
//       } else{
//         $(this).css('border-bottom', '1px solid red');
//       }
//     }
//   })
//  });


