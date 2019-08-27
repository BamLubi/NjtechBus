// miniprogram/pages/index/index.js

var util = require('../../utils/util.js');

Page({

    /**
     * 页面的初始数据
     */
    data: {
        windowHeight: null,
        windowWidth: null,
        todayDate: {}, //今天
        selectDate: {}, //用户选择的时间,默认为当日
        dateZN: "", //用于展示的日期,仅包括月日
        busLineShow: [], //用于显示的列表
        hasBus: false, //是否有班车
        position: ["象山", "校门"],
        positionStartIndex: 0,
        positionEndIndex: 1,
        direction: 0,
        allBusInfo: null,
        isChangePlace: false
    },

    /**
     * 生命周期函数--监听页面加载
     */
    onLoad: function(options) {
        var that = this
        // 获取手机信息
        wx.getSystemInfo({
            success: function(res) {
                console.log(res);
                // 屏幕宽度、高度
                console.log('height=' + res.windowHeight);
                console.log('width=' + res.windowWidth);
                // 高度,宽度 单位为px
                that.setData({
                    windowHeight:  res.windowHeight,
                    windowWidth:  res.windowWidth
                })
            }
        })
        // 设置时间
        let nowDate = new Date()
        this.setData({
            dateZN: (nowDate.getMonth() + 1) + "月" + nowDate.getDate() + "日",
            selectDate: {
                year: nowDate.getFullYear(),
                month: (nowDate.getMonth() + 1) < 9 ? ("0" + (nowDate.getMonth() + 1)) : (nowDate.getMonth() + 1),
                day: nowDate.getDate() < 9 ? ("0" + nowDate.getDate()) : nowDate.getDate(),
                hour: nowDate.getHours(),
                minutes: nowDate.getMinutes(),
                week: nowDate.getDay(),
				weekZN: transToWeek(nowDate.getDay())
            }
        })
        this.setData({
            todayDate: JSON.parse(JSON.stringify(this.data.selectDate)) //深拷贝对象
        })
        // 连接数据库并设置班车信息
        this.connectDB();
    },

    /**
     * 生命周期函数--监听页面初次渲染完成
     */
    onReady: function() {

    },

    /**
     * 生命周期函数--监听页面显示
     */
    onShow: function() {

    },

    /**
     * 生命周期函数--监听页面隐藏
     */
    onHide: function() {

    },

    /**
     * 生命周期函数--监听页面卸载
     */
    onUnload: function() {

    },

    /**
     * 页面相关事件处理函数--监听用户下拉动作
     */
    onPullDownRefresh: function() {

    },

    /**
     * 页面上拉触底事件的处理函数
     */
    onReachBottom: function() {

    },

    /**
     * 用户点击右上角分享
     */
    onShareAppMessage: function() {

    },
    /**
     * 用户下拉刷新
     */
    onPullDownRefresh() {
        // 上拉刷新
        if (!this.loading) {
            this.getBusLine()
            wx.stopPullDownRefresh()
        }
    },
    /**
     * 连接数据库，下载班车信息
     */
    connectDB: function() {
        var that = this
        console.log("准备连接数据库")
        // 显示加载框
        wx.showLoading({
            title: '加载中',
        })
        // 获取信息
        const db = wx.cloud.database()
        db.collection('schoolBusTable').doc('f0b862af-d862-4a8a-937a-a3ce4f221fdc').get({
            success: function(res) {
                console.log("下载班车信息成功")
                // 更具星期设置变量
                if (that.data.selectDate.week == 6 || that.data.selectDate.week == 7) {
                    // 周末
                    that.setData({
                        allBusInfo: res.data.weekendData
                    })
                } else {
                    // 工作日
                    that.setData({
                        allBusInfo: res.data.workingDayData
                    })
                }
                // 产生班车列表
                that.setBusLine()
                // 隐藏加载框
                wx.hideLoading()
            }
        })
    },
    /**
     * 产生班车列表
     */
    setBusLine: function() {
        console.log("准备生成班车列表")
        let data = this.data.allBusInfo;
        let ans = new Array();
        // 遍历
        let nowTime = parseInt(this.data.selectDate.hour) * 100 + parseInt(this.data.selectDate.minutes)
        for (var i = 0; i < data.length; i++) {
            let st = parseInt(parseFloat(data[i].startTime).toFixed(2) * 100);
            let ed = parseInt(parseFloat(data[i].endTime).toFixed(2) * 100);
            // 筛选当前时间之后的班车
            if (parseInt(ed - nowTime) >= -5) {
                // 方向一致，或为循环车
                if (data[i].direction == this.data.direction || data[i].status != 1) {
                    ans.push(new busLine(data[i]))
                }
            }
        }
        // 赋值
        this.setData({
            busLineShow: ans
        })
        console.log("生成班车列表成功")
        // 若班车信息为空，则设置无班车
        if (ans.length != 0) {
            this.setData({
                hasBus: true
            })
        } else {
            this.setData({
                hasBus: false
            })
        }
    },
    /**
     * 更改方向
     */
    changeDirection: function() {
        let edIndex = this.data.positionEndIndex
        let stIndex = this.data.positionStartIndex
        this.setData({
            positionStartIndex: edIndex,
            positionEndIndex: stIndex,
            direction: !this.data.direction
        })
    },
    Search: function() {
        // 赋空值
        this.setData({
            busLineShow: []
        })
        // 连接数据库
		if (this.data.selectDate.year != this.data.todayDate.year || this.data.selectDate.month != this.data.todayDate.month || this.data.selectDate.day != this.data.todayDate.day) {
            this.connectDB()
        }
        // 获取班车信息
        this.setBusLine()
        // 
        this.HideMask()
    },
    /**
     * 更改时间,更改selectDate里的年月日
     */
    DateChange(e) {
        let selectTime = new Date(e.detail.value)
        let date = e.detail.value.split('-')
        // 重新设置年月日星期
        this.setData({
            ["selectDate.year"]: date[0],
            ["selectDate.month"]: date[1],
            ["selectDate.day"]: date[2],
            ["selectDate.week"]: selectTime.getDay(),
			["selectDate.weekZN"]: transToWeek(selectTime.getDay()),
            dateZN: parseInt(date[1]) + "月" + date[2] + "日"
        })
        // 如果不是今天，则将时间设置为07:00
        let todayTime = this.data.todayDate
        if (date[0] != todayTime.year || date[1] != todayTime.month || date[2] != todayTime.day) {
            this.setData({
                ["selectDate.hour"]: 7,
                ["selectDate.minutes"]: 0
            })
        } else {
            let nowDate = new Date()
            this.setData({
                ["selectDate.hour"]: nowDate.getHours(),
                ["selectDate.minutes"]: nowDate.getMinutes(),
                ["todayDate.hour"]: nowDate.getHours(),
                ["todayDate.minutes"]: nowDate.getMinutes()
            })
        }
    },
    /**
     * 更改时间,更改selectDate里的年月日
     */
    TimeChange(e) {
        let time = e.detail.value.split(':')
        this.setData({
            ["selectDate.hour"]: parseInt(time[0]),
            ["selectDate.minutes"]: parseInt(time[1])
        })

    },
    /**
     * 显示遮罩层
     */
    ShowMask: function() {
        this.setData({
            isChangePlace: true
        })
		// 若日期为今天，则时间设置为当前时间
		if (this.data.selectDate.year == this.data.todayDate.year && this.data.selectDate.month == this.data.todayDate.month && this.data.selectDate.day == this.data.todayDate.day) {
			let nowDate = new Date()
			this.setData({
				["selectDate.hour"]: nowDate.getHours(),
				["selectDate.minutes"]: nowDate.getMinutes(),
				["todayDate.hour"]: nowDate.getHours(),
				["todayDate.minutes"]: nowDate.getMinutes()
			})
		}
    },
    /**
     * 隐藏遮罩层
     */
    HideMask: function() {
        this.setData({
            isChangePlace: false
        })
    }
})

// 对象构造器
function busLine(line) {
    // 开始时间
    let stNum = parseFloat(line.startTime).toFixed(2).split(".");
    this.startTime = stNum[0] + ":" + stNum[1];
    // 结束时间
    let edNum = parseFloat(line.endTime).toFixed(2).split(".");
    this.endTime = edNum[0] + ":" + edNum[1];
    // 备注信息
    // this.info = line.info;
    // 方向，0：象山开往校门口，1：校门口开往象山
    this.direction = line.direction;
    // 状态，1：准点发车，3：三车循环，4：四车循环
    this.status = line.status;
}

// 将数字转换为星期
function transToWeek(week) {
	switch(week){
		case 1:
			return "星期一";
		case 2:
			return "星期二";
		case 3:
			return "星期三";
		case 4:
			return "星期四";
		case 5:
			return "星期五";
		case 6:
			return "星期六";
		case 0:
			return "星期日";
	}
}