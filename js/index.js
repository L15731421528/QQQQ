// 参考案例：http://zxt_team.gitee.io/qq-music-player/


//解决300ms延迟问题
FastClick.attach(document.body);


(async function () {
    const baseBox = document.querySelector('.header-box .base')
    const playerButton = document.querySelector('.player-button')
    const wrapperBox = document.querySelector('.wrapper')
    const footerBox = document.querySelector('.footer-box')
    const currentBox = footerBox.querySelector('.current')
    const durationBox = footerBox.querySelector('.duration')
    const alreadyBox = footerBox.querySelector('.already')
    const markImageBox = document.querySelector('.mark-image')
    const loadingBox = document.querySelector('.loading-box')
    const audioBox = document.querySelector('#audioBox')
    let wrapperList = []
    let timer = null
    let macthNUm = 0//历史匹配的数量

    /* 音乐控制 */
    const format = function format(time) {
        let minutes = Math.floor(time / 60)
        let seconds = Math.round(time - minutes * 60)
        minutes = minutes < 10 ? '0' + minutes : '' + minutes
        seconds = seconds < 10 ? '0' + seconds : '' + seconds
        return {
            minutes,
            seconds
        }
    }
    const playend = function playrend() {
        clearInterval(timer)
        timer = null
        currentBox.innerHTML = "00:00"
        alreadyBox.innerHTML = "0%"
        wrapperBox.style.transform = 'translateY(0)'
        macthNUm = 0
        playerButton.className = "player-button"

    }

    const handle = function handle() {
        let PH = wrapperList[0].offsetHeight
        let { currentTime, duration } = audioBox
        if (isNaN(currentTime) || isNaN(duration)) return
        //播放结束
        if (currentTime > duration) {
            playend()
            return
        }



        //控制进度条
        let { minutes: currentTimeMinutes, seconds: currentTimeSeconds } = format(currentTime)
        let { minutes: durationMinutes, seconds: durationSeconds } = format(duration)
        let ratio = Math.round(currentTime / duration * 100)
        // console.log(currentTime, duration);
        currentBox.innerHTML = `${currentTimeMinutes}:${currentTimeSeconds}`
        durationBox.innerHTML = `${durationMinutes}:${durationSeconds}`
        alreadyBox.style.width = `${ratio}%`

        //控制歌词
        let matchs = wrapperList.filter(item => {
            let minutes = item.getAttribute('minutes')
            let seconds = item.getAttribute('seconds')
            return minutes === currentTimeMinutes && seconds === currentTimeSeconds
        })
        if (matchs.length > 0) {
            
            //让匹配的段落有徐选中样式，其余的移除
            wrapperList.forEach(item => item.className='')
            matchs.forEach(item => item.className='active')
            //控制移动
            macthNUm += matchs.length
            if (macthNUm > 3) {
                let offset = (macthNUm - 3) * PH
                wrapperBox.style.transform = `translateY(${-offset}px)`
            }
        }


    }
    playerButton.addEventListener('click', function (ev) {
        if (audioBox.paused) {
            // true 当前是暂停的，让其播放
            audioBox.play()
            playerButton.classList.add('move')
            handle()
            if (!timer) timer = setInterval(handle, 1000)

            return

        }
        // false 当前是播放的，让其暂停
        audioBox.pause()
        playerButton.classList.remove('move')
        clearInterval(timer)
        timer = null
    })

    //绑定数据
    const bindLyric = function bindLyric(lyric) {
        //
        lyric = lyric.replace(/&#(\d+);/g, (value, $1) => {
            let instead = value
            switch (+$1) {
                case 32:
                    instead = ''
                    break
                case 40:
                    instead = '('
                    break
                case 41:
                    instead = ')'
                    break
                case 45:
                    instead = '-'
                    break
                default:

            }
            return instead
        })


        //解析歌词信息
        let arr = []
        lyric.replace(
            /\[(\d+)&#58;(\d+)&#46;(?:\d+)\]([^&#?]+)(?:&#10;)?/g,
            (_, $1, $2, $3) => {
                arr.push({
                    minutes: $1,
                    seconds: $2,
                    text: $3
                })
            }
        )
        // console.log(arr);


        //歌词绑定
        let str = ``
        arr.forEach(({ minutes, seconds, text }) => {
            str += `<p minutes='${minutes}'  seconds='${seconds}' >${text}</p>`
        })
        wrapperBox.innerHTML = str
        wrapperList = Array.from(wrapperBox.querySelectorAll('p'))
        console.log(wrapperList);


    }
    const bingding = function bingding(data) {
        let { title, author, duration, pic, audio, lyric } = data
        //@1 绑定头部基本信息
        baseBox.innerHTML = ` 
            <div class="cover">
                <img src="${pic}" alt="">
            </div>
            <div class="info">
                <h2 class="title">${title}</h2>
                <h3 class="author">${author}</h3>
            </div>`

        //@2 杂七杂八的信息
        durationBox.innerHTML = duration
        markImageBox.style.backgroundImage = `url(${pic})`
        // no-repeat

        audioBox.src = audio

        //@3 绑定歌词信息
        bindLyric(lyric)

        //@4 关闭loading层
        loadingBox.style.display = 'none'
    }


    //向服务器发请求，从服务器获取相关的数据
    try {
        let { code, data } = await API.queryLyric()
        if (+code === 0) {
            //请求成功：网络层和业务层都成功
            bingding(data)
            return
        }
    } catch (error) {
        console.log(error);
    }
    //请求失败
    alert('网络繁忙，请刷新页面！')

})()