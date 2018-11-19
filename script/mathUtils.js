// 复数
const Complex = function (r, i) {
    this.real = r;
    this.imaginary = i;
};

// 由数组生成复数
const getComplexFromArray = function(arr) {
    return new Complex(arr[0], arr[1]);
};

// 求模
Complex.prototype.getLength = function () {
    return Math.sqrt(this.real*this.real + this.imaginary*this.imaginary);
};

// 转换成字符串
Complex.prototype.toString = function() {
    return this.real + '+' + this.imaginary + 'i';
};

// 转换成数组
Complex.prototype.toArray = function () {
    let arr = [this.real, this.imaginary];
    return arr;
};

// 加法
Complex.prototype.add = function (that) {
    return new Complex(this.real + that.real, this.imaginary + that.imaginary);
};

// 乘法
Complex.prototype.multiply= function (that) {
    return new Complex(this.real * that.real - this.imaginary * that.imaginary, this.real * that.imaginary + this.imaginary * that.real);
};

// 数乘
Complex.prototype.scaling = function (real) {
    return new Complex(this.real * real, this.imaginary * real);
};

//-----------------------以上规定复数-------------------------------
// 注意, f(x) 都是复数

// 求定积分
const integral = function(f, x1, x2, samples) {         // f 是复函数
    let sum = new Complex(0, 0);                                   // 总面积
    step = (x2 - x1) / samples;
    for (let i = x1; i < x2; i += step) {
        let area = f(i).scaling(step);                 // 每个小长方形的面积
        sum = sum.add(area);
    }
    return sum;
};

// 连续傅里叶变换
const cft = function (f, x1, x2, samples) {         // 原函数 下限 上限 采样点数
    return function (omega) {return integral(function (x) {return f(x).multiply(new Complex(Math.cos(-2*Math.PI*omega*x), Math.sin(-2*Math.PI*omega*x)))}, x1, x2, samples)}
};

// 离散傅里叶变换
const dft = function(x) {               // x为复序列
    let N = x.length;
    let X = new Array(N);
    for (let k = 0; k < N; k++) {
        X[k] = new Complex(0, 0);
        for(let n = 0; n < N; n++) {
            let comp = new Complex(Math.cos(-2 * Math.PI * n * k / N), Math.sin(-2 * Math.PI * n * k / N));       // W^nk
            X[k] = X[k].add(x[n].multiply(comp));
        }
    }
    // 调整周期
    /*    let sliceIndex = Math.ceil(X.length / 2);
        let newX = X.slice(sliceIndex, X.length).concat(X.slice(0, sliceIndex));
        return newX;*/
    return X;
};

// 函数的傅里叶展开（terms）
const fourierExpand = function (f, terms) {
    const a = new Array(terms);         // 这里a[0]是指a1，以此类推
    const b = new Array(terms);         // b同上
    const a0 = integral(f, -Math.PI, Math.PI, 1e4).scaling(1/Math.PI);      // a, b也是复数
    for (let n = 1; n <= terms; n++) {
        a[n - 1] = integral(function (x) {return f(x)*Math.cos(n*x)}, -Math.PI, Math.PI, 1e4).scaling(1/Math.PI);
        b[n - 1] = integral(function (x) {return f(x)*Math.sin(n*x)}, -Math.PI, Math.PI, 1e4).scaling(1/Math.PI);
    }
    let fourierExp = function (x) {                 // 用若干正弦波拟合的函数
        let expression = new Complex(a0 / 2, 0);
        for (let n = 1; n <= terms; n++) expression = expression.add(new Complex(a[n - 1] * Math.cos(n * x), b[n - 1] * Math.sin(n * x)));
        return expression;
    };
    return fourierExp;              // 返回值也是复函数
};

// 傅里叶变换（其实是求连续幅度谱）
const ft = function(f, terms) {
    const a = new Array(terms);         // 这里a[0]是指a1，以此类推
    const b = new Array(terms);         // b同上
    for (let n = 1; n <= terms; n++) {
        a[n - 1] = integral(function (x) {return f(x)*Math.cos(n*x)}, -Math.PI, Math.PI, 1e4) / Math.PI;
        b[n - 1] = integral(function (x) {return f(x)*Math.sin(n*x)}, -Math.PI, Math.PI, 1e4) / Math.PI;
    }
    let fourierAmplitude = new Array(terms);
    for (let i = 0; i < terms; i++) {
        fourierAmplitude[i] = new Array(2);
        let tempComp =  new Complex(a[i], b[i]);
        fourierAmplitude[i][0] = i;
        fourierAmplitude[i][1] = tempComp.getLength();
    }
    return fourierAmplitude;

};


// 连续幅度图
const toFrequency = function(f, x1, x2) {
    let step = 1e-3;
    let freqFunc_cos = function (frequency) {
        return integral(function (x){return f(x) * Math.cos(-2*Math.PI*frequency*x)}, x1, x2, 1e-4);
    };
    let freqFunc_sin = function (frequency) {
        return integral(function (x){return f(x) * Math.sin(-2*Math.PI*frequency*x)}, x1, x2, 1e-4);
    };
    return [freqFunc_cos, freqFunc_sin];
};


// 获取连续的幅度谱
const getCftAmplitude = function (f, x0, x1, samples) {
    let fourierFunc = cft(f, x0, x1, samples);              // 傅里叶变换后的函数
    return function(omega) {return fourierFunc(omega).getLength();};       // 频率-幅度函数
};

// 获取连续的相位谱
const getCftPhase = function (f, x0, x1, samples) {
    let fourierFunc = cft(f, x0, x1, samples);              // 傅里叶变换后的函数
    return function (omega) {return Math.atan(fourierFunc(omega).imaginary / fourierFunc(omega).real);};        // 频率-相位函数
};

// 获取离散复序列的幅度谱（二维数组）
const getDftAmplitude = function (x) {          // x为离散复序列
    let compResult = dft(x);                                // 离散傅里叶变换结果（复数数组）
    let arrResult = new Array(compResult.length);
    for (let i = 0; i < arrResult.length; i++) {
        arrResult[i] = new Array(2);
        arrResult[i][0] = i;
        arrResult[i][1] = compResult[i].getLength();
    }
    // 调整周期
    let sliceIndex = Math.ceil(arrResult.length / 2);
    for (let i = arrResult.length - 1, j = 0; i >= sliceIndex; i--) {
        j--;
        arrResult[i][0] = j;
    }
    let newArr = arrResult.slice(sliceIndex, arrResult.length).concat(arrResult.slice(0, sliceIndex));
    return newArr;
};

// 获取离散复序列的相位谱（二维数组）
const getDftPhase = function (x) {          // x为离散复序列
    let compResult = dft(x);                                // 离散傅里叶变换结果（复数数组）
    let arrResult = new Array(compResult.length);
    for (let i = 0; i < arrResult.length; i++) {
        arrResult[i] = new Array(2);
        arrResult[i][0] = i;
        arrResult[i][1] = Math.atan(compResult[i].imaginary / compResult[i].real);
    }
    // 调整周期
    let sliceIndex = Math.ceil(arrResult.length / 2);
    for (let i = arrResult.length - 1, j = 0; i >= sliceIndex; i--) {
        j--;
        arrResult[i][0] = j;
    }
    let newArr = arrResult.slice(sliceIndex, arrResult.length).concat(arrResult.slice(0, sliceIndex));
    return newArr;
};

// 离散傅里叶反变换
const idft = function(X) {                 // X为复序列
    let N = X.length;                           // 先求序列长度
    let x = new Array(N);                   // 结果序列
    for (let n = 0; n < N; n++){
        x[n] = new Complex(0, 0);           // 求xn
        for(let k = 0; k < N; k++){
            let comp = new Complex(Math.cos(2 * Math.PI * n * k / N), Math.sin(2 * Math.PI * n * k / N));       // W^-nk
            x[n] = x[n].add(X[k].multiply(comp));
        }
        x[n].real /= N;
        x[n].imaginary /= N;
    }
/*    // 调整周期
    let sliceIndex = Math.ceil(x.length / 2);
    let newx = x.slice(sliceIndex, x.length).concat(x.slice(0, sliceIndex));
    return newx;*/
    return x;
};