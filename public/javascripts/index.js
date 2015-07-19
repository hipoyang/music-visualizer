/**
 * get specific elements by selector
 * @param  {string} selector Element selector
 * @return {Array}           Array of element
 */
function $(selector) {
    return document.querySelectorAll(selector);
}

/**
 * 获取2位补齐的数字
 * @param  {number} num 待补齐的数字
 * @return {number}     补齐后的数字
 */
function _(num) {
    var target = (parseInt(num, 10) + 100).toString();
    return target.substring(1, target.length);
}
// 音乐播放列表
var playlist = $('nav li a');
// 正在播放音乐的名称显示div
var titleBar = $('.title')[0];
// 歌名
var titleText = $('#title')[0];
// 时长
var durationText = $('#duration')[0];
// 停止按钮
var stop = $('#stop')[0];
// 开始播放
var resume = $('#resume')[0];
// 上一首
var prev = $('#prev')[0];
// 下一曲
var next = $('#next')[0];
// 进度条
var progress = $('.progress')[0];
// 图形绘制区域
var visualizer = $('.visualizer')[0];
// canvas的宽高
var width, height;
var canvas = document.createElement('canvas');
var ctx = canvas.getContext('2d');
// FFT SIZE, 必须为2指数
var size = 128;
// 分析类型
var analyseType = 'Frequency';
// 回调渲染方法
var render = renderFrequencyEffect;
// 初始化音乐可视化类
var musicVisualizer = new Visualizer({
    size: size,
    render:  render,
    analyseType: analyseType
});

window.onresize = resize;
resize();
visualizer.appendChild(canvas);

/**
 * 改变窗口大小重绘
 */
function resize() {
    width = visualizer.clientWidth;
    height = visualizer.clientHeight;
    canvas.width = width;
    canvas.height = height;
    var line = ctx.createLinearGradient(0, 0, 0, height);
    line.addColorStop(0, 'rgba(229, 29, 71, 1)');
    line.addColorStop(0.7, 'rgba(229, 29, 71, 0.6)');
    line.addColorStop(0.9, 'rgba(229, 29, 71, 0.3)');
    line.addColorStop(1, 'rgba(229, 29, 71, 0.1)');
    ctx.fillStyle = line;
};

/**
 * 根据实时音频频域数据，绘制图形
 * @param  {Array} arr  音频数据
 * @param  {number} offsetTime 音频当前时间
 * @param  {number} duration    总时长
 */
function renderFrequencyEffect(arr, offsetTime, duration) {
    ctx.clearRect(0, 0, width, height);
    var w = width / size * 2;
    for (var i = 0; i < size; i++) {
        var h = arr[i] / 256 * height;
        ctx.fillRect(w * i, height - h, w * 0.9, h);  
    }
    renderProgress(offsetTime, duration);
}

/**
 * 根据实时音频时域数据，绘制图形
 * @param  {Array} arr  音频数据
 * @param  {number} offsetTime 音频当前时间
 * @param  {number} duration    总时长
 */
function renderTimeDomainEffect(arr, offsetTime, duration) {
    ctx.clearRect(0, 0, width, height);
    var w = width / size;
    ctx.beginPath();
    ctx.lineWidth='2';
    ctx.strokeStyle='rgba(229, 29, 71, .8)';
    ctx.moveTo(0, arr[0] / 256 * height);
    for (var i = 1; i < size; i++) {
        var h = arr[i] / 256 * height;
        ctx.lineTo(w * i, height - h);
    }
    ctx.stroke();
    renderProgress(offsetTime, duration);
}

/**
 * 更新进度条显示
 * @param  {number} percent 完成百分比
 * @param  {number} offsetTime 音频当前时间
 * @param  {number} duration    总时长
 */
function renderProgress (offsetTime, duration) {
    var durationStr = '';
    durationStr += _(Math.floor(offsetTime / 60));
    durationStr += ':';
    durationStr += _(Math.round(offsetTime % 60));
    durationStr += ' / ';
    durationStr += _(Math.floor(duration / 60));
    durationStr += ':';
    durationStr += _(Math.round(duration % 60));
    progress.style.width = offsetTime / duration * 100 + '%';
    durationText.innerHTML = durationStr;
}

// 初始化点击播放事件
for (var i = 0, len = playlist.length; i < len; i++) {
    playlist[i].onclick = function (event) {
        titleText.innerHTML = this.title;
        titleBar.style.display = 'block';
        musicVisualizer.play('/medias/' + this.title);
    };
}
// 停止事件
stop.onclick = function () {
    stop.style.display = 'none';
    resume.style.display = 'inline-block';
    musicVisualizer.stop();
};
// 恢复事件
resume.onclick = function () {
    stop.style.display = 'inline-block';
    resume.style.display = 'none';
    musicVisualizer.resume();
};
// 上一首
prev.onclick = function () {
    var playlist = $('#playlist a');
    var currentSong = title.innerHTML;
    if (playlist && playlist.length > 0) {
        for (var i = 0, len = playlist.length; i < len; i++) {
            if (playlist[i].title === currentSong) {
                if (playlist[i - 1]) {
                    playlist[i - 1].onclick();
                }
            }
        }
    }
};

next.onclick = function () {
    var playlist = $('#playlist a');
    var currentSong = title.innerHTML;
    if (playlist && playlist.length > 0) {
        for (var i = 0, len = playlist.length; i < len; i++) {
            if (playlist[i].title === currentSong) {
                if (playlist[i + 1]) {
                    playlist[i + 1].onclick();
                }
            }
        }
    }
};