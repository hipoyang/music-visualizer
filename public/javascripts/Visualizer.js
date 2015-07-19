/**
 * 音乐可视化
 * @param {Object} options 配置项
 */
function Visualizer(options) {

    /**
     * AudioContext的AudioBufferSource对象
     * @type {Object}
     */
    this.buffer = {};

    /**
     * 当前正在播放的bufferSource
     * @type {Object}
     */
    this.source = null;

    /**
     * 播放开始时间
     * @type {Number}
     */
    this.startTime = 0;

    /**
     * 暂停播放时播放时长
     * @type {Number}
     */
    this.offsetTime = 0;

    /**
     * 音频总时长
     * @type {Number}
     */
    this.duration = 0;

    /**
     * 选择过的资源数的累计值
     * @type {number}
     */
    this.count = 0;

    /**
     * AudioAnalyser的解码Buffer的大小
     * @type {number}
     */
    this.size = options.size;

    /**
     * canvas绘制函数
     * @type {Function}
     */
    this.render = options.render;

    /**
     * 分析的类型，分为时域（TimeDomain）和频域（Frequency）
     * @type {String}
     */
    this.analyseType = options.analyseType || 'Frequency';

    /**
     * 音乐播放的AudioContext对象
     * @type {Object}
     */
    this.audioCtx = new (window.AudioContext || window.webkitAudioContext || window.mozAudioContext)();

    /**
     * 音量控制GainNode对象
     * @type {Object}
     */
    this.gainNode = this.audioCtx[this.audioCtx.createGain ? 'createGain' : 'createGainNode']();

    /**
     * 音频分析器
     * @type {Object}
     */
    this.analyser = this.audioCtx.createAnalyser();

    /**
     * 异步请求对象
     * @type {Object}
     */
    this.xhRequest = new window.XMLHttpRequest();

    this._init();
}

// Visualizer原型扩展
Visualizer.prototype = {
    /**
     * Visualizer初始化
     */
    _init: function () {
        this.analyser.connect(this.gainNode);
        this.gainNode.connect(this.audioCtx.destination);
        // 调用音乐可视化渲染
        this.analyse(this.analyseType);
    },

    /**
     * 工具方法：是否为函数的判断
     * @param  {Function}  func 被检测对象
     * @return {Boolean}        是否为函数
     */
    isFunction: function (func) {
        return Object.prototype.toString.call(func) === '[object Function]';
    },

    /**
     * 异步获取音频数据，并调用回掉函数
     * @param  {string}   url      目标路径
     * @param  {Function} callback 回掉函数
     */
    loadData: function (url, callback) {
        var self = this;
        // 避免重复请求
        this.xhRequest.abort();
        // 设置同步请求
        this.xhRequest.open('GET', url, true);
        this.xhRequest.responseType = 'arraybuffer';

        this.xhRequest.onload = function () {
            self.isFunction(callback) && callback.call(self.xhRequest.response);
        };
        this.xhRequest.send();
    },

    /**
     * 对于ArrayBuffer类型的音频数据，解码为BufferSourceNode的buffer
     * @param  {Object}   arraybuffer 音频数据
     * @param  {Function} callback    回调函数
     */
    decode: function(arraybuffer, callback){
        var self = this;
        this.audioCtx.decodeAudioData(arraybuffer, function(buffer){
            var bufferSourceNode = self.audioCtx.createBufferSource();
            bufferSourceNode.buffer = buffer;
            callback.call(bufferSourceNode);
        }, function (err) {
            console.log(err);
        });
    },

    /**
     * 异步加载音频数据，并播放
     * @param  {string} url 音频地址
     */
    play: function (url) {
        // 保存当前上线文
        var self = this;
        var count = ++self.count;
        self.startTime = self.audioCtx.currentTime;
        // 停止当前播放
        self.source && self.stop();
        self.loadData(url, function () {
            if (count !== self.count) {
                return false;
            }
            self.decode(this, function() {
                if (count !== self.count) {
                    return false;
                }
                // 将要播放的对象保存在source中
                self.source = this;
                self.duration = this.buffer.duration;
                self.source.connect(self.analyser);
                // 播放
                self.source[self.source.start ? 'start' : 'noteOn'](0);

            });
        });

    },
    /**
     * 停止音频播放
     */
    stop: function () {
        if (this.source) {
            this.startTime = 0;
            this.source[this.source.stop ? 'stop' : 'noteOff']();
        }
    },

    /**
     * 暂停播放
     */
    pause: function () {
        if (this.source) {
            this.offsetTime = this.audioCtx.currentTime - this.startTime;
            this.startTime = 0;
            this.source[this.source.stop ? 'stop' : 'noteOff']();
        }
    },

    /**
     * 恢复播放
     */
    resume: function () {
        if (this.source) {
            // todo: little problem
            var source = this.audioCtx.createBufferSource();
            source.buffer = this.source.buffer;
            this.source = source;
            this.source.connect(this.analyser);
            this.source[this.source.start ? 'start' : 'noteOn'](0, this.offsetTime, this.source.buffer.duration);
            this.startTime = this.audioCtx.currentTime;
        }
    },

    /**
     * 音频的频域能量分析
     * @param {string} type 分析类型: TimeDomain, Frequency
     */
    analyse: function (type) {
        var self = this;
        
        self.analyser.fftSize = self.size;
        var meterData = null;
        if (type === 'Frequency') {
            meterData = new Uint8Array(self.analyser.frequencyBinCount);
        } else if (type === 'TimeDomain') {
            meterData = new Uint8Array(self.analyser.fftSize);
        } else {
            return false;
        }

        var requestAnimationFrame = window.requestAnimationFrame
                                        || window.webkitRequestAnimationFrame
                                        || window.mozRequestAnimationFrame
                                        || window.oRequestAnimationFrame
                                        || widnow.msRequestAnimaitonFrame;

        /**
         * 通过requestAnimationFrame实现实时获取数据
         */
        function reRender() {
            if (self.startTime !== 0) {
                self.offsetTime = self.audioCtx.currentTime - self.startTime;
            } else {
                self.offsetTime = 0;
            }
            if (type === 'Frequency') {
                self.analyser.getByteFrequencyData(meterData);
            } else if (type === 'TimeDomain') {
                self.analyser.getByteTimeDomainData(meterData);
            } else {
                return false;
            }
            self.render(meterData, self.offsetTime, self.duration);
            requestAnimationFrame(reRender);
        }
        requestAnimationFrame(reRender);
    }
};