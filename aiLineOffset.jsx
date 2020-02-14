// aiLineOffset.jsx
// version : 0.1.0
// Copyright : kotodu(busroutemap)
// Licence : MIT
// github : https://github.com/busroutemap/illustrator-Line-Offset
// 概要:illustratorで線を高機能にオフセットできるスクリプト
// 想定使用:線を何本にもオフセットしたい時など
// 注意:カーブ未対応
//---------------------------------------------
// ユーザー定義変数
// (1)ユーザーが指定する既定オフセット本数
var userCounts = 3;
// (2)ユーザーが指定する既定オフセット幅(px)
var userWidth = 12.0;
//---------------------------------------------
// 制作メモ
// app.executeMenuCommand("OffsetPath v23");
// 実はこれでもいけるらしい、メニューコマンドだから開くのかな
//---------------------------------------------
// 全体定義
var myDoc = app.activeDocument;
var myLines = myDoc.selection;
//---------------------------------------------
// 線分AB,CDのペアA(x1,y1),B(x2,y2),C(x3,y3),D(x4,y4)
// P1,P2,P3で、P1P2とP2P3を仮オフセットした線分AB,CDからその交点を算出したい
/**
 * 「crossPoint」交点算出
 * @param {*} x1 
 * @param {*} y1 
 * @param {*} x2 
 * @param {*} y2 
 * @param {*} x3 
 * @param {*} y3 
 * @param {*} x4 
 * @param {*} y4 
 * @return {*} [x,y] 交点のPathItem
 */
function crossPoint(x1, y1, x2, y2, x3, y3, x4, y4){
    var vy1 = y2 - y1;
    var vx1 = x1 - x2;
    var c_1 = -1 * vy1 * x1 - vx1 * y1;
    var vy2 = y4 - y3;
    var vx2 = x3 - x4;
    var c_2 = -1 * vy2 * x3 - vx2 * y3;
    
    var c_3 = vx1 * vy2 - vx2 * vy1;
    if(c_3 === 0){ //平行によりうまく求められないとき。
        return [
            (x2 + x3) * 0.5,
            (y2 + y3) * 0.5];
    } else {
        return [
            (c_1 * vx2 - c_2 * vx1) / c_3,
            (vy1 * c_2 - vy2 * c_1) / c_3
        ];
    }
}

//---------------------------------------------
/**
 * 「pointOffset」点を暫定オフセットして2候補を返す
 * @param {*} x オフセットさせたい点のx
 * @param {*} y オフセットさせたい点のy
 * @param {*} m オフセットさせたい線の傾き
 * @param {*} offsetWidth オフセットさせたい幅
 * @return {*} point1 オフセット先候補1
 * @return {*} point2 オフセット先候補2
 */
function pointOffset(x, y, m, offsetWidth) {
    // 計算の都合上、オフセット候補は2つ算出される
    var moveX = Math.sqrt(offsetWidth*offsetWidth-(m+1)*(m+1));
    var moveY = moveX*(-m);
    // (x,y)に(moveX,moveY)か(-moveX,-moveY)を補正したものが点移動先
    var option1 = [
        x + moveX,
        y + moveY
    ];
    var option2 = [
        x - moveX,
        y - moveY
    ]
    return ([option1,option2]);
}
//---------------------------------------------
/**
 * 「joinAndCheckPoints」暫定的でオフセットされた4点を正しく繋いだ線分を返す
 * 正しい傾きかどうか、mTrueで指定された傾きを用いて判定する
 * @param {*} optionsP1 
 * @param {*} optionsP2 
 * @param {*} mTrue 
 */
function joinAndCheckPoints(optionsP1,optionsP2,mTrue){
    // 線分の2点から暫定的にオフセットし4点の候補を作る
    // これの繋ぎ方6通りの内、正しいのは傾きmの2通りのみ(それ以外は作成元に交差する)
    // (P1,P2同士で)全部繋ぎ、元の線分に交差しない2線分を返す
    // options = [[x1,y1],[x2,y2]]
    var answers = [];
    var optionPairs = [
        [optionsP1[0],optionsP2[0]],
        [optionsP1[0],optionsP2[1]],
        [optionsP1[0],optionsP2[0]],
        [optionsP1[0],optionsP2[1]]
    ]
    $.writeln("mTrue:"+mTrue);
    for (var i=0;i<optionPairs.length;i++){
        var pair = optionPairs[i];
        var mOption = (pair[0][1]-pair[1][1])/(pair[0][0]-pair[1][0]);
        $.writeln("mOption"+mOption);
        if(mOption-mTrue<0.00001){
            // ==にすると誤差が？
            answers.push(pair[0],pair[1]);
            $.writeln("をPush!");
        }
    }
    // オフセット後の2線分があるはず、ただし順不同かな？
    return(answers);
}
//---------------------------------------------
/**
 * 「createBaseSegments」pointsデータから線分データを作成する
 * 線分データは[[x1,y1],[x2,y2],m]
 * mはその線分の傾き
 * @param {*} points 
 * @return {*} baseSegments [線分データ1,線分データ2,線分データ3...]
 */
function createBaseSegments(points) {
    var baseSegments = [[]];
    for (var i=0;i<points.length-1;i++){
        var startXY = [
            points[i].anchor[0],
            points[i].anchor[1]
        ];
        var endXY = [
            points[i+1].anchor[0],
            points[i+1].anchor[1]
        ];
        // m=y/x
        // y=mx
        var m = (startXY[1]-endXY[1])/(startXY[0]-endXY[0]);
        baseSegments[i]=[
            startXY,
            endXY,
            m
        ];
    }
    return baseSegments;
}

//---------------------------------------------
/**
 * 「segmentsOffset」オフセットを行うよう各関数へ投げ、
 * 受け取ったデータを整形、2つのオフセット後のデータを返す
 * @param {*} points [[x1,y1],[x2,y2]...]
 * @param Number(int) offsetWidth
 * @return result [左のPathPoints配列,右のPathPoints配列]
 */
function segmentsOffset(points,offsetWidth) {
    // 120pointsあるなら119segmentsができるはず
    // iは0から118
    // 線分データ[[x1,y1],[x2,y2],m]
    var baseSegments = createBaseSegments(points);
    //---------------------------------------------
    // まだ繋がってない、オフセットしただけの線分がもつ
    // x座標とy座標を格納した変数(左右別)
    // [
    //     [[x1,y1],[x2,y2]],
    //     [[x3,y3],[x4,y4]],
    //     [[x5,y5],[x6,y6]],
    //     [[x7,y7],[x8,y8]],
    //     ...
    // ]
    var offsetSegmentsL = [[]];
    var offsetSegmentsR = [[]];
    //---------------------------------------------
    // 線分がもつ点ごとに暫定オフセット
    for (var i = 0; i < baseSegments.length - 1; i++) {
        var nowSeg = baseSegments[i];
        var m = nowSeg[2];
        var optionsP1 = pointOffset(nowSeg[0][0], nowSeg[0][1], m, offsetWidth);
        var optionsP2 = pointOffset(nowSeg[1][0], nowSeg[1][1], m, offsetWidth);
        // 各2候補、合計4候補、繋ぎ方6通り
        // 繋いでも傾きがmになる2通りのみが正解の線分
        var answers = joinAndCheckPoints(optionsP1,optionsP2,m);
        // とりあえず1線分から生まれる2つの新しい線分データを補完
        // [[x1,y1],[x2,y2],m],[[x3,y3],[x4,y4],m]
        //---------------------------------------------
        // そのセグメントで、パスの流れに対しオフセット候補が右にあるか左にあるか判定
        // そのセグメントが起点から終点へYがプラスなら、
        // オフセット候補の起点でX座標が大きいほうが右
        // 分からなければ4パターンしか無いから書くとわかりやすい
        // 冗長だが、ここは関数化しにくい
        if (nowSeg[1][1]>nowSeg[0][1]){
            // 起点から終点へYがプラス
            // 大きい方が右、小さい方が左
            if(answers[0][0][0]>answers[1][0][0]){
                offsetSegmentsR[i]=answers[0];
                offsetSegmentsL[i]=answers[1];
            } else{
                offsetSegmentsR[i]=answers[1];
                offsetSegmentsL[i]=answers[0];
            }
        } else if (nowSeg[1][1]==nowSeg[0][1]){
            // 傾き0、X軸に対し平行なパターン
            if(nowSeg[1][0]>nowSeg[0][0]){
                // 進行方向が左から右
                // Y座標の大きい方が左、小さい方が右
                if(answers[0][0][1]>answers[1][0][1]){
                    offsetSegmentsR[i]=answers[1];
                    offsetSegmentsL[i]=answers[0];
                } else{
                    offsetSegmentsR[i]=answers[0];
                    offsetSegmentsL[i]=answers[1];
                }
            } else{
                // 進行方向が右から左
                // Y座標の小さい方が左、大きい方が右
                if(answers[0][0][1]>answers[1][0][1]){
                    offsetSegmentsR[i]=answers[0];
                    offsetSegmentsL[i]=answers[1];
                } else{
                    offsetSegmentsR[i]=answers[1];
                    offsetSegmentsL[i]=answers[0];
                }
            }
        } else{
            // 小さい方が右、大きい方が左
            if(answers[0][0][0]>answers[1][0][0]){
                offsetSegmentsL[i]=answers[0];
                offsetSegmentsR[i]=answers[1];
            } else{
                offsetSegmentsL[i]=answers[1];
                offsetSegmentsR[i]=answers[0];
            }
        }
    }
    // で、左右の仮オフセットセグメントごとに交点算出
    // まず最初の線分の起点は交点もなにもないので確定
    var decidedPathPointsL=[];
    decidedPathPointsL.push([
        offsetSegmentsL[0][0][0],
        offsetSegmentsL[0][0][1],
    ]);
    var decidedPathPointsR=[];
    decidedPathPointsR.push([
        offsetSegmentsR[0][0][0],
        offsetSegmentsR[0][0][1],
    ]);
    // 2線分間の交点を算出し、確定パスポイント配列に格納
    // もし120ポイントあったなら、119セグメントが出来ているはず
    // 最初の1個+for文で119セグメントの交点118個+最後の1個
    for(var i=0;i<offsetSegmentsL;i++){
        var x1 = offsetSegmentsL[i][0][0];
        var y1 = offsetSegmentsL[i][0][1];
        var x2 = offsetSegmentsL[i][1][0];
        var y2 = offsetSegmentsL[i][1][1];
        var x3 = offsetSegmentsL[i+1][0][0];
        var y3 = offsetSegmentsL[i+1][0][1];
        var x4 = offsetSegmentsL[i+1][0][0];
        var y4 = offsetSegmentsL[i+1][0][1];
        decidedPathPointsL.push(crossPoint(x1,y1,x2,y2,x3,y3,x4,y4));
    }
    for(var i=0;i<offsetSegmentsR;i++){
        var x1 = offsetSegmentsR[i][0][0];
        var y1 = offsetSegmentsR[i][0][1];
        var x2 = offsetSegmentsR[i][1][0];
        var y2 = offsetSegmentsR[i][1][1];
        var x3 = offsetSegmentsR[i+1][0][0];
        var y3 = offsetSegmentsR[i+1][0][1];
        var x4 = offsetSegmentsR[i+1][0][0];
        var y4 = offsetSegmentsR[i+1][0][1];
        decidedPathPointsR.push(crossPoint(x1,y1,x2,y2,x3,y3,x4,y4));
    }
    // 最後に終点ポイントを決定、交点もなにもない
    // l1=l2で合ってくれないと困るけど、念の為
    var l1 = offsetSegmentsL.length;
    decidedPathPointsL.push([
        offsetSegmentsL[l1][0][0],
        offsetSegmentsL[l1][0][1],
    ]);
    var l2 = offsetSegmentsR.length;
    decidedPathPointsR.push([
        offsetSegmentsR[l2][0][0],
        offsetSegmentsR[l2][0][1],
    ]);
    var result = [decidedPathPointsL,decidedPathPointsR]
    return(result)
}

//---------------------------------------------
/**
 * 「createOffsetPath」segmentsOffsetで算出したPathItemsを格納し描画を行う
 * @param {*} points points、[[x1,y1],[x2,y2]...]
 * @param Number(int) offsetWidth オフセット幅(px)。正の数も負の数も来る
 */
function createOffsetPath(points,offsetWidth){
    var createdData = segmentsOffset(points,offsetWidth);
    var newLine01 = myDoc.pathItems.add();
    newLine01.stroked = true;
    newLine01.setEntirePath(createdData[0]);
    var createdData = segmentsOffset(points,offsetWidth);
    var newLine01 = myDoc.pathItems.add();
    newLine01.stroked = true;
    newLine01.setEntirePath(createdData[0]);
}
//---------------------------------------------
/**
 * 「generate」選択パスごとに、入力条件に応じて作成を繰り返す
 * @param {*} countNum オフセット数
 * @param {*} widthpx 各線間のオフセット幅
 */
function generate(countNum,widthpx){
    for(var i=0; i < myLines.length; i++){
        // それぞれの選択オブジェクトごとに実行
        var myLine = myLines[i];
        if (myLine.typename =="PathItem"){
            // 指定回数分オフセットしていく
            // jが作成回数分相当
            // まずmyLineのpathPointsを算出
            // [point1,point2...]
            // point=[x,y]
            var points = myLine.pathPoints;
            if (countNum%2==0){
                // 偶数
                // 初回オフセットは偶数なら指定幅の半分
                // j*widthpxでどれだけオフセットするのかに該当
                var nowpx = j*widthpx/2;
                createOffsetPath(points,nowpx);
                for (var j=2; j < countNum;j+=2){
                    nowpx+= widthpx;
                    createOffsetPath(points,nowpx);
                }
            } else{
                // 奇数、初回オフセットはそのまま複製
                var newLine = myLine.duplicate();
                newLine.stroked = true;
                var nowpx = 0;
                for (var j=1; j < countNum;j+=2){
                    nowpx+= widthpx;
                    createOffsetPath(points,nowpx);
                    $.writeln(j+"回目描画終了");
                }
            }
        } else{
            // 何もしない
        }
    }
}

//---------------------------------------------
// ただの情報入力画面定義
function useropt() {
    var win = new Window('dialog', "enter options");
    win.add('statictext', undefined, "(1)ユーザー指定のオフセット数");
    var iCounts = win.add('edittext', undefined, userCounts);
    win.add('statictext', undefined, "(2)ユーザー指定のオフセット幅");
    var iWidthpx = win.add('edittext', undefined, userWidth);
    //---------------------------------------------
    win.confirmBtn = win.add('button', undefined, "OK", {
        name: 'confirm'
    }).onClick = function() {
        var countNum = Math.ceil(parseInt(iCounts.text, 10));
        var widthpx = parseInt(iWidthpx.text, 10);
        win.close();
        $.writeln("---------------------------------------------");
        $.writeln("計算開始");
        if (widthpx > 0&&countNum > 0){
            // 0pxオフセットと0回はさすがに回避
            generate(countNum,widthpx);
            $.writeln("計算終了");
        } else{
            window.alert("入力された数または幅が想定されていません");
        }
        // return;
    }
    win.add('button', undefined, "Cancel", {
        name: 'cancel'
    }).onClick = function() {
        win.close();
        // return;
    }
    win.show();
    return;
}
//---------------------------------------------
// 処理をする流れ
function go(){
    useropt();
    // $.writeln(result);
}


//---------------------------------------------
// ユーザー操作
// ドキュメントが開かれていて、かつ保存されていれば実行
// パスが選択されているかどうかは条件に入れてない
if (app.documents.length > 0) {
    if (!myDoc.saved) {
        Window.alert("ドキュメントが保存されていません");
        // myDoc.save();
        // でもいいかも？
    } else if( myDoc.selection.length > 0 ){
        go();
    } else{
        // 何もしない
    }
} else {
    Window.alert("ドキュメントが開かれていません");
}