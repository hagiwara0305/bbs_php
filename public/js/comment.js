// websoketオープン
var pas = '192.168.137.1';

var getquery = GetQueryString();

var conn = new WebSocket('ws://' + pas + ':8080?sled_id=' + getquery['sled_id']);
conn.onerror = function () {
    alert('サーバに接続できませんでした...');
    location.href = '../../index.php';
}

var user_json = {
    'id': undefined,
    'name': undefined,
    'message': undefined,
    'sled_id': getquery['sled_id']
};  // ユーザーの基本情報
var cookie_obj = new Object();

conn.onopen = function (e) {
    console.log('Connection established!');

    //クッキー情報の読み込み
    var cookie = document.cookie.split(';');
    cookie.forEach(function (item) {
        cookie_obj[item.split('=')[0].replace(/\s+/g, '')] = item.split('=')[1];
    });

    user_json['id'] = cookie_obj['user_id'];
    user_json['name'] = decodeURIComponent(cookie_obj['user_name']);
    document.getElementById('name_print').innerHTML = 'ユーザーネーム：' + user_json['name'];
};

//テキストエリアにて値が入力、Enterが押された時に発火するイベント
function sendMessage(e) {   //キーコードを取得
    var code = (e.keyCode ? e.keyCode : e.which);
    //Enterの投下
    if (code !== 13) {
        return;
    }

    //JSONデータを作成
    user_json.message = document.getElementById('comment_area').value;

    if (user_json.message.length === 0) {
        return;
    }
    //メッセージをコンソールに渡す
    conn.send(JSON.stringify(user_json));

    //初期化＋chat欄に書き込み
    document.getElementById('chat').innerHTML += '<div class=\'user\'>'
        + '<span class=\'user_name\'>' + user_json.name + '</span>'
        + '<p>' + user_json.message + '</p>'
        + '</div>'
        + '<div class=\'bms_clear\'></div>';

    document.getElementById('comment_area').value = '';

    ScrollWindow();
};

//相手からメッセージが送られてきたときに発火するイベント
conn.onmessage = function (e) {
    console.log(e.data);

    e = JSON.parse(e.data);

    //初期化＋chat欄に書き込み
    document.getElementById('chat').innerHTML += '<div class=\'client\'>'
        + '<span class=\'client_name\'>' + e.name + '</span>'
        + '<p>' + e.message + '</p>'
        + '</div>'
        + '<div class=\'bms_clear\'></div>';

    ScrollWindow();
};

function ScrollWindow() {
    var targetScroll = document.body.scrollHeight;
    window.scrollTo(0, targetScroll);
}

function GetQueryString() {
    var result = {};
    if (1 < window.location.search.length) {
        // 最初の1文字 (?記号) を除いた文字列を取得する
        var query = window.location.search.substring(1);

        // クエリの区切り記号 (&) で文字列を配列に分割する
        var parameters = query.split('&');

        for (var i = 0; i < parameters.length; i++) {
            // パラメータ名とパラメータ値に分割する
            var element = parameters[i].split('=');

            var paramName = decodeURIComponent(element[0]);
            var paramValue = decodeURIComponent(element[1]);

            // パラメータ名をキーとして連想配列に追加する
            result[paramName] = paramValue;
        }
    }
    return result;
}