/// <reference types="types-for-adobe/Illustrator/2015.3"/>
// alert(String(app));
// aiLineOffset.jsx
// version : 1.0.0
// Copyright : kotodu(busroutemap)
// Licence : MIT
// github : https://github.com/busroutemap/illustrator-Line-Offset
// 概要:illustratorで線を高機能にオフセットできるスクリプト
// 想定使用:線を何本にもオフセットしたい時など
// 注意:カーブ未対応
//---------------------------------------------
// ユーザー定義変数
// (1)ユーザーが指定する既定オフセット本数
// var userCounts = 4;
// (2)ユーザーが指定する既定オフセット幅(px)
// var userWidth = 24.0;
//---------------------------------------------
// 制作メモ
// app.executeMenuCommand("OffsetPath v23");
// 実はこれでもいけるらしい、メニューコマンドだから開くのかな
//---------------------------------------------
// 全体定義
// var myDoc = app.activeDocument;
// var myLines = myDoc.selection;
//---------------------------------------------
import { Ipoint } from "./if/points";
import { ISeg } from "./if/segs";
// 線分AB,CDのペアA(x1,y1),B(x2,y2),C(x3,y3),D(x4,y4)
// P1,P2,P3で、P1P2とP2P3を仮オフセットした線分AB,CDからその交点を算出したい
/**
 * 「crossPoint」交点算出
 * @param {number} x1 
 * @param {number} y1 
 * @param {number} x2 
 * @param {number} y2 
 * @param {number} x3 
 * @param {number} y3 
 * @param {number} x4 
 * @param {number} y4 
 * @return {[number,number]} [x,y] 交点のPathItem
 */
function crossPoint(
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    x3: number,
    y3: number,
    x4: number,
    y4: number): [number,number]{
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
 * @param {number} x オフセットさせたい点のx
 * @param {number} y オフセットさせたい点のy
 * @param {number} m オフセットさせたい線の傾き
 * @param {number} offsetWidth オフセットさせたい幅
 * @returns {Array<Array<number>>} [point1,point2] オフセット先候補1,オフセット先候補2
 */
function pointOffset(x: number, y: number, m: number, offsetWidth: number):Array<Array<number>> {
    // 計算の都合上、オフセット候補は2つ算出される
    // 点(x,y)のオフセット先(x',y')と比較した時
    // OW^2=(x-x')^2+(y-y')^2
    // オフセット元直線の傾きがmなら
    // それに直角に交わる線の傾きは-1/m
    // |x-x'|をAと仮定した時、|y-y'|はmA
    // OW^2=A^2+(mA)^2
    // A^2 = OW/(1+m^2)
    var ow2 = offsetWidth*offsetWidth;
    var m2 = m*m;
    var moveX = Math.sqrt(Math.abs(ow2/(1+1/(m2))));
    var moveY = moveX*(-1/m);
    // (x,y)に(moveX,moveY)か(-moveX,-moveY)を補正したものが点移動先
    var option1 = [
        x + moveX,
        y + moveY
    ];
    var option2 = [
        x - moveX,
        y - moveY
    ]
    $.writeln("option1:"+option1);
    $.writeln("option2:"+option2);
    var result = [option1,option2];
    return result;
}
//---------------------------------------------
/**
 * 「joinAndCheckPoints」暫定的でオフセットされた4点を正しく繋いだ線分を返す
 * 正しい傾きかどうか、mTrueで指定された傾きを用いて判定する
 * @param {Array<Array<number>>} optionsP1 
 * @param {Array<Array<number>>} optionsP2 
 * @param {number} mTrue オフセット元の線の傾き。
 * @returns {Array<Array<number>>}
 */
function joinAndCheckPoints(optionsP1: Array<Array<number>>,optionsP2:Array<Array<number>>,mTrue: number): Array<Array<Array<number>>>{
    // 線分の2点から暫定的にオフセットし4点の候補を作る
    // これの繋ぎ方6通りの内、正しいのは傾きmの2通りのみ(それ以外は作成元に交差する)
    // (P1,P2同士で)全部繋ぎ、元の線分に交差しない2線分を返す
    // options = [[x1,y1],[x2,y2]]
    var answers:Array<Array<Array<number>>> = [];
    var optionPairs = [
        [optionsP1[0],optionsP2[0]],
        [optionsP1[0],optionsP2[1]],
        [optionsP1[1],optionsP2[0]],
        [optionsP1[1],optionsP2[1]]
    ]
    $.writeln("mTrue"+mTrue);
    for (var i=0;i<optionPairs.length;i++){
        var pair = optionPairs[i];
        if ((Math.abs(pair[0][1]-pair[1][1]))<0.0000001){
            // 傾きが異常に小さい、Y座標が同じ、X軸に平行
            // どちらかに差がほぼなければ、これでみなす
            var mOption = 0.000000001;
        } else if ((Math.abs(pair[0][0]-pair[1][0]))<0.0000001){
            // Y軸にほぼ平行
            var mOption = 888888.888888;
        } else{
            var mOption = (pair[0][1]-pair[1][1])/(pair[0][0]-pair[1][0]);
        }
        $.writeln("mOption"+mOption);
        if(Math.abs(mOption-mTrue)<0.0000001){
            // ==にすると誤差が？
            answers.push([pair[0],pair[1]]);
        }
    }
    // オフセット後の2線分があるはず、ただし順不同かな？
    return(answers);
}
//---------------------------------------------
/**
 * @summary pointsデータから線分データを作成する
 * 線分データは[[x1,y1],[x2,y2],m]
 * mはその線分の傾き
 * @param {Array<Ipoint>} points 
 * @return {Array<ISeg>} baseSegments [線分データ1,線分データ2,線分データ3...]
 */
function createBaseSegments(points:Array<Ipoint>): Array<ISeg> {
    var baseSegments:Array<ISeg> = [];
    for (var i=0;i<points.length-1;i++){
        var startXY = {
            x: points[i].anchor[0],
            y:points[i].anchor[1]
        };
        var endXY = {
            x: points[i+1].anchor[0],
            y:points[i+1].anchor[1]
        };
        // m=y/x
        // y=mx
        if ((Math.abs((startXY.y-endXY.y))<0.0000001)){
            // Y座標が同じ、X軸に平行
            // どちらかに差がほぼなければ、これでみなす
            var m = 0.000000001;
        } else if (Math.abs((startXY.x-endXY.x))<0.0000001){
            var m = 888888.888888;
        } else{
            var m = (startXY.y-endXY.y)/(startXY.x-endXY.x);
        }
        baseSegments[i] = {
            startXY:startXY,
            endXY:endXY,
            m:m
        }
    }
    return baseSegments;
}

//---------------------------------------------
/**
 * @summary オフセットを行うよう各関数へ投げ、
 * 受け取ったデータを整形、2つのオフセット後のデータを返す
 * @param {Array<Ipoint>} points [[x1,y1],[x2,y2]...]
 * @param {number} offsetWidth オフセット幅
 * @returns {Array<Array<Array<number>>>} result [左のPathPoints配列,右のPathPoints配列]
 */
function segmentsOffset(points:Array<Ipoint>,offsetWidth:number):[number,number][][] {
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
    var offsetSegmentsL:Array<Array<Array<number>>> = [];
    var offsetSegmentsR:Array<Array<Array<number>>> = [];
    //---------------------------------------------
    // 線分がもつ点ごとに暫定オフセット
    for (var i = 0; i < baseSegments.length; i++) {
        var nowSeg = baseSegments[i];
        var m = nowSeg.m;
        var optionsP1 = pointOffset(nowSeg.startXY.x, nowSeg.startXY.y, m, offsetWidth);
        var optionsP2 = pointOffset(nowSeg.endXY.x, nowSeg.endXY.y, m, offsetWidth);
        $.writeln("optionsP1:"+optionsP1);
        $.writeln("optionsP2:"+optionsP2);
        // 各2候補、合計4候補、繋ぎ方6通り
        // 繋いでも傾きがmになる2通りのみが正解の線分
        var answers = joinAndCheckPoints(optionsP1,optionsP2,m);
        // とりあえず1線分から生まれる2つの新しい線分データを補完
        // [[x1,y1],[x2,y2],m],[[x3,y3],[x4,y4],m]
        $.writeln("answers.length"+answers.length);
        $.writeln("answers0"+answers[0]);
        //---------------------------------------------
        // そのセグメントで、パスの流れに対しオフセット候補が右にあるか左にあるか判定
        // そのセグメントが起点から終点へYがプラスなら、
        // オフセット候補の起点でX座標が大きいほうが右
        // 分からなければ4パターンしか無いから書くとわかりやすい
        // 冗長だが、ここは関数化しにくい
        if (nowSeg.endXY.y>nowSeg.startXY.y){
            // 起点から終点へYがプラス
            // 大きい方が右、小さい方が左
            if(answers[0][0][0]>answers[1][0][0]){
                // $.writeln("A1");
                offsetSegmentsR[i]=answers[0];
                offsetSegmentsL[i]=answers[1];
            } else{
                // $.writeln("A2");
                offsetSegmentsR[i]=answers[1];
                offsetSegmentsL[i]=answers[0];
            }
        } else if (nowSeg.endXY.y==nowSeg.startXY.y){
            // 傾き0、X軸に対し平行なパターン
            if(nowSeg.endXY.x>nowSeg.startXY.x){
                // 進行方向が左から右
                // Y座標の大きい方が左、小さい方が右
                if(answers[0][0][1]>answers[1][0][1]){
                    // $.writeln("B1");
                    offsetSegmentsR[i]=answers[1];
                    offsetSegmentsL[i]=answers[0];
                } else{
                    // $.writeln("B2");
                    offsetSegmentsR[i]=answers[0];
                    offsetSegmentsL[i]=answers[1];
                }
            } else{
                // 進行方向が右から左
                // Y座標の小さい方が左、大きい方が右
                if(answers[0][0][1]>answers[1][0][1]){
                    // $.writeln("B3");
                    offsetSegmentsR[i]=answers[0];
                    offsetSegmentsL[i]=answers[1];
                } else{
                    // $.writeln("B4");
                    offsetSegmentsR[i]=answers[1];
                    offsetSegmentsL[i]=answers[0];
                }
            }
        } else{
            // 小さい方が右、大きい方が左
            if(answers[0][0][0]>answers[1][0][0]){
                // $.writeln("C1");
                offsetSegmentsL[i]=answers[0];
                offsetSegmentsR[i]=answers[1];
            } else{
                // $.writeln("C2");
                offsetSegmentsL[i]=answers[1];
                offsetSegmentsR[i]=answers[0];
            }
        }
    }
    $.writeln("osL.length:"+offsetSegmentsL.length);
    // で、左右の仮オフセットセグメントごとに交点算出
    // まず最初の線分の起点は交点もなにもないので確定
    var decidedPathPointsL:[number,number][]=[];
    decidedPathPointsL.push([
        offsetSegmentsL[0][0][0],
        offsetSegmentsL[0][0][1]
    ]);
    var decidedPathPointsR:[number,number][]=[];
    decidedPathPointsR.push([
        offsetSegmentsR[0][0][0],
        offsetSegmentsR[0][0][1]
    ]);
    // 2線分間の交点を算出し、確定パスポイント配列に格納
    // もし120ポイントあったなら、119セグメントが出来ているはず
    // 最初の1個+for文で119セグメントの交点118個+最後の1個
    for(var i=0;i<offsetSegmentsL.length-1;i++){
        var x1 = offsetSegmentsL[i][0][0];
        var y1 = offsetSegmentsL[i][0][1];
        var x2 = offsetSegmentsL[i][1][0];
        var y2 = offsetSegmentsL[i][1][1];
        var x3 = offsetSegmentsL[i+1][0][0];
        var y3 = offsetSegmentsL[i+1][0][1];
        var x4 = offsetSegmentsL[i+1][1][0];
        var y4 = offsetSegmentsL[i+1][1][1];
        var point:[number,number] = crossPoint(x1,y1,x2,y2,x3,y3,x4,y4);
        decidedPathPointsL.push(point);
    }
    // .lengthが7
    // iは0,1,2,3,4,5の6回
    // 01,12,23,34,45,56を比較し
    // 点1,2,3,4,5,6を打つ
    for(var i=0;i<offsetSegmentsR.length-1;i++){
        var x1 = offsetSegmentsR[i][0][0];
        var y1 = offsetSegmentsR[i][0][1];
        var x2 = offsetSegmentsR[i][1][0];
        var y2 = offsetSegmentsR[i][1][1];
        var x3 = offsetSegmentsR[i+1][0][0];
        var y3 = offsetSegmentsR[i+1][0][1];
        var x4 = offsetSegmentsR[i+1][1][0];
        var y4 = offsetSegmentsR[i+1][1][1];
        var point:[number,number]= crossPoint(x1,y1,x2,y2,x3,y3,x4,y4);
        decidedPathPointsR.push(point);
    }
    // 最後に終点ポイントを決定、交点もなにもない
    // l1=l2で合ってくれないと困るけど、念の為
    var l1 = offsetSegmentsL.length-1;
    decidedPathPointsL.push([
        offsetSegmentsL[l1][1][0],
        offsetSegmentsL[l1][1][1],
    ]);
    var l2 = offsetSegmentsR.length-1;
    decidedPathPointsR.push([
        offsetSegmentsR[l2][1][0],
        offsetSegmentsR[l2][1][1],
    ]);
    $.writeln("dPPL.length:"+decidedPathPointsL.length);
    var result:[number,number][][] = [decidedPathPointsL,decidedPathPointsR]
    return(result)
}

//---------------------------------------------
/**
 * @summary segmentsOffsetで算出したPathItemsを格納し描画を行う
 * @param {Array<Ipoint>} points points、[[x1,y1],[x2,y2]...]
 * @param {number} offsetWidth オフセット幅(px)。正の数も負の数も来る
 */
function createOffsetPath(points: Array<Ipoint>,offsetWidth:number){
    var createdData:[number,number][][] = segmentsOffset(points,offsetWidth);
    var newLine01 = app.activeDocument.pathItems.add();
    newLine01.stroked = true;
    newLine01.setEntirePath(createdData[0]);
    // var createdData = segmentsOffset(points,offsetWidth);
    var newLine02 = app.activeDocument.pathItems.add();
    newLine02.stroked = true;
    newLine02.setEntirePath(createdData[1]);
}
//---------------------------------------------
/**
 * @summary 選択パスごとに、入力条件に応じて作成を繰り返す
 * @param {number} countNum オフセット数
 * @param {number} widthpx 各線間のオフセット幅
 */
function generate(countNum: number, widthpx: number) {

    const myLines: Array<any> = app.activeDocument.selection;
    
    for(var i=0; i < myLines.length; i++){
        // それぞれの選択オブジェクトごとに実行
        var myLine = myLines[i];
        if (myLine.typename =="PathItem"){
            // 指定回数分オフセットしていく
            // jが作成回数分相当
            // まずmyLineのpathPointsを算出
            // [point1,point2...]
            // point=[x,y]
            var points:Array<Ipoint> = myLine.pathPoints;
            if (countNum%2==0){
                // 偶数
                // 初回オフセットは偶数なら指定幅の半分
                // j*widthpxでどれだけオフセットするのかに該当
                var nowpx = widthpx/2;
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

// //---------------------------------------------
// // ただの情報入力画面定義
// function useropt() {
//     var win = new Window('dialog', "enter options");
//     win.add('statictext', undefined, "(1)ユーザー指定のオフセット数");
//     var iCounts = win.add('edittext', undefined, userCounts);
//     win.add('statictext', undefined, "(2)ユーザー指定のオフセット幅");
//     var iWidthpx = win.add('edittext', undefined, userWidth);
//     //---------------------------------------------
//     win.confirmBtn = win.add('button', undefined, "OK", {
//         name: 'confirm'
//     }).onClick = function() {
//         var countNum = Math.ceil(parseInt(iCounts.text, 10));
//         var widthpx = parseInt(iWidthpx.text, 10);
//         win.close();
//         $.writeln("---------------------------------------------");
//         $.writeln("計算開始");
//         if (widthpx > 0&&countNum > 0){
//             // 0pxオフセットと0回はさすがに回避
//             generate(countNum,widthpx);
//             $.writeln("計算終了");
//         } else{
//             window.alert("入力された数または幅が想定されていません");
//         }
//         // return;
//     }
//     win.add('button', undefined, "Cancel", {
//         name: 'cancel'
//     }).onClick = function() {
//         win.close();
//         // return;
//     }
//     win.show();
//     return;
// }
// //---------------------------------------------
// // 処理をする流れ
// function go() {

//     // 条件1 : ドキュメントが開かれている
//     // 条件2 : 保存されている
//     if (app.documents.length == 0) {
//         Window.alert("ドキュメントが開かれていません");
//         return
//     }
    
//     // セーブされているかどうか
//     var isSaved = myDoc.saved;

//     if (isSaved) {
//         Window.alert("実行します");
//         useropt();
//     } else {
//         Window.alert("セーブしてください");
//     }

// }

/**
 * @summary アプリケーションがセーブされているか
 * @returns {boolean} セーブされていればtrue,それ以外はfalse
 */
function isSaved():boolean {
    return app.activeDocument.saved;
}

/**
 * @summary ドキュメントを最低1つは開いているかどうか
 * @returns {boolean} 何も開いていなければfalse,それ以外はtrue
 */
function isOpenDoc(): boolean {
    const docsCount:number = app.documents.length;
    if (docsCount > 0) {
        return true;
    } else {
        return false;
    }
}