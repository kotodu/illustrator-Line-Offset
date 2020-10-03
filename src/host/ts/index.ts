/// <reference types="types-for-adobe/Illustrator/2015.3"/>
//---------------------------------------------
// aiLineOffset.jsx
// version : 1.0.0
// Copyright : kotodu
// Licence : MIT
// github : https://github.com/kotodu/illustrator-Line-Offset
// 概要:illustratorで線を高機能にオフセットできるスクリプト
// 想定使用:線を何本にもオフセットしたい時など
// 注意:カーブ未対応
//---------------------------------------------



//---------------------------------------------
// インターフェースの導入
//---------------------------------------------

import { Ipoint } from "./if/points";
import { ISeg } from "./if/segs";



//---------------------------------------------
// 大域変数の定義
//---------------------------------------------

/**
 * @summary 開発用ログ出力配列。
 * @description (pureではないが……ログを出力させる)
 * @type {string[]} 
 */
// let logLines: string[] = [];
// 用意はしたが……全体変数は今読み込めないので。
// ログ用ライブラリを今後導入？



//---------------------------------------------
// コア機能の定義
//---------------------------------------------

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



/**
 * 「pointOffset」点を暫定オフセットして2候補を返す
 * @param {number} x オフセットさせたい点のx
 * @param {number} y オフセットさせたい点のy
 * @param {number} m オフセットさせたい線の傾き
 * @param {number} offsetWidth オフセットさせたい幅
 * @returns {[Ipoint, Ipoint]} [point1,point2] オフセット先候補1,オフセット先候補2
 */
function pointOffset(x: number, y: number, m: number, offsetWidth: number):[Ipoint, Ipoint] {
    // 計算の都合上、オフセット候補は2つ算出される
    // 点(x,y)のオフセット先(x',y')と比較した時
    // OW^2=(x-x')^2+(y-y')^2
    // オフセット元直線の傾きがmなら
    // それに直角に交わる線の傾きは-1/m
    // |x-x'|をAと仮定した時、|y-y'|はmA
    // OW^2=A^2+(mA)^2
    // A^2 = OW/(1+m^2)
    const ow2 = offsetWidth * offsetWidth;
    const m2 = m * m;

    // x,yの移動量
    const moveX = Math.sqrt(Math.abs(ow2 / (1 + 1 / (m2))));
    const moveY = moveX * (-1 / m);

    // (x,y)に(moveX,moveY)か(-moveX,-moveY)を補正したものが点移動先
    const p1: Ipoint = {
        anchor: [
            x + moveX,
            y + moveY
        ]
    };

    const p2: Ipoint = {
        anchor: [
            x - moveX,
            y - moveY
        ]
    };
    // オフセット先候補1,オフセット先候補2
    const optionPoints: [Ipoint, Ipoint] = [p1,p2]
    return optionPoints;
}



//---------------------------------------------
// コア機能を元に検証する処理の定義
//---------------------------------------------


/**
 * 「joinAndCheckPoints」暫定的でオフセットされた4点を正しく繋いだ線分を返す
 * 正しい傾きかどうか、mTrueで指定された傾きを用いて判定する
 * @param {[Ipoint, Ipoint]} optionsP1 
 * @param {[Ipoint, Ipoint]} optionsP2 
 * @param {number} mTrue オフセット元の線の傾き。
 * @returns {[Ipoint, Ipoint][]}
 */
function joinAndCheckPoints(optionsP1:[Ipoint, Ipoint],optionsP2:[Ipoint, Ipoint],mTrue: number): [Ipoint, Ipoint][]{
    // 線分の2点から暫定的にオフセットし4点の候補を作る
    // これの繋ぎ方6通りの内、正しいのは傾きmの2通りのみ(それ以外は作成元に交差する)
    // (P1,P2同士で)全部繋ぎ、元の線分に交差しない2線分を返す
    const optionPairs : [Ipoint, Ipoint][] = [
        [optionsP1[0],optionsP2[0]],
        [optionsP1[0],optionsP2[1]],
        [optionsP1[1],optionsP2[0]],
        [optionsP1[1],optionsP2[1]]
    ]

    // つなぎ方候補を元に、正しい傾きの場合のみ正答とみなす
    // filterで書きたい所を回避している
    let answers: [Ipoint, Ipoint][] = new Array;
    for (const pair of optionPairs) {

        // X,Yの差を算出
        const diffY = pair[0].anchor[1] - pair[1].anchor[1];
        const diffX = pair[0].anchor[0] - pair[1].anchor[0];

        // 暫定的に傾きの値を代入
        let mOption = 0.1;

        if ((Math.abs(diffY)) < 0.0000001) {
            // 傾きが異常に小さい、Y座標が同じ、X軸に平行
            // どちらかに差がほぼなければ、これでみなす
            mOption = 0.000000001;
        } else if ((Math.abs(diffX)) < 0.0000001) {
            // Y軸にほぼ平行
            mOption = 888888.888888;
        } else{
            mOption = diffY / diffX;
        }

        // 実際の傾きとの差がほぼ無いに等しい場合
        if (Math.abs(mOption - mTrue) < 0.0000001) {
            // ==にすると誤差が見過ごされる
            answers.push(pair);
        }
    }

    // オフセット後の2線分があるはず、ただし順不同かな？
    // なお、2線分であるとの保証ができない為、[PathPoint, PathPoint][]
    return(answers);
}


/**
 * @summary pointsデータから線分データを作成する
 * 線分データは[[x1,y1],[x2,y2],m]
 * mはその線分の傾き
 * @param {PathPoints} points 
 * @return {Array<ISeg>} baseSegments [線分データ1,線分データ2,線分データ3...]
 */
function createBaseSegments(points: PathPoints): Array<ISeg> {

    // points配列からセグメント配列を作成する
    // なお、配列の個数が1つ減るので、点→セグメントでmapは使用できない
    let baseSegments: Array<ISeg> = []
    for (let i = 0; i < points.length - 1; i++){
        // 始点
        const startXY = {
            x: points[i].anchor[0],
            y: points[i].anchor[1]
        };

        // 終点。現在の次
        const endXY = {
            x: points[i+1].anchor[0],
            y: points[i+1].anchor[1]
        };

        
        // セグメント作成で使う傾き、Xの差、Yの差を求める
        let m: number;
        const diffX = startXY.x - endXY.x;
        const diffY = startXY.y - endXY.y;

        // m=y/x
        // y=mx

        if ((Math.abs(diffY) < 0.0000001)) {
            // Y座標が同じ、X軸に平行
            // どちらかに差がほぼなければ、これでみなす
            m = 0.000000001;
        } else if (Math.abs(diffX) < 0.0000001) {
            m = 888888.888888;
        } else {
            m = diffY / diffX;
        }

        // Isegに沿ったobjectを作成し、追加する
        baseSegments.push({
            startXY: startXY,
            endXY: endXY,
            m: m
        });
    }
    
    return baseSegments;
}


/**
 * @summary オフセットを行うよう各関数へ投げ、
 * 受け取ったデータを整形、2つのオフセット後のデータを返す
 * @param {PathPoints} points [[x1,y1],[x2,y2]...]
 * @param {number} offsetWidth オフセット幅
 * @returns {[[number,number][],[number,number][]]} result [左のPathPoints配列,右のPathPoints配列]
 */
function segmentsOffset(points:PathPoints,offsetWidth:number):[[number,number][],[number,number][]] {
    // 120pointsあるなら119segmentsができるはず
    // iは0から118
    // 線分データ[[x1,y1],[x2,y2],m]
    const baseSegments : ISeg[] = createBaseSegments(points);
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
    //---------------------------------------------

    let segLs: [Ipoint, Ipoint][] = new Array;
    let segRs: [Ipoint, Ipoint][] = new Array;

    // 線分がもつ点ごとに暫定オフセット
    for (const seg of baseSegments){
        // セグメントの始点と終点で、それぞれオフセット先候補を作成
        const optionsP1: [Ipoint, Ipoint] = pointOffset(seg.startXY.x, seg.startXY.y, seg.m, offsetWidth);
        const optionsP2: [Ipoint, Ipoint] = pointOffset(seg.endXY.x, seg.endXY.y, seg.m, offsetWidth);
        
        // セグメントの始点と終点で、それぞれ繋ぎ、正しい答えを探す
        const answers = joinAndCheckPoints(optionsP1, optionsP2, seg.m);
        
        //---------------------------------------------
        // そのセグメントで、パスの流れに対しオフセット候補が右にあるか左にあるか判定
        // そのセグメントが起点から終点へYがプラスなら、
        // オフセット候補の起点でX座標が大きいほうが右
        // 分からなければ4パターンしか無いから書くとわかりやすい
        // 冗長だが、ここは関数化しにくい

        // 左右を規定
        let segL: [Ipoint, Ipoint];
        let segR: [Ipoint, Ipoint];

        if (seg.endXY.y > seg.startXY.y) {
            // 起点から終点へYがプラス
            // 大きい方が右、小さい方が左

            if (answers[0][0].anchor[0] > answers[1][0].anchor[0]) {

                segR = answers[0];
                segL = answers[1];

            } else {

                segR = answers[1];
                segL = answers[0];

            }
        } else if (seg.endXY.y == seg.startXY.y) {
            // 傾き0、X軸に対し平行なパターン

            if (seg.endXY.x > seg.startXY.x) {
                // 進行方向が左から右
                // Y座標の大きい方が左、小さい方が右
                if (answers[0][0].anchor[1] > answers[1][0].anchor[1]) {

                    segR = answers[1];
                    segL = answers[0];

                } else {

                    segR = answers[0];
                    segL = answers[1];

                }
            } else {
                // 進行方向が右から左
                // Y座標の小さい方が左、大きい方が右
                if (answers[0][0].anchor[1] > answers[1][0].anchor[1]) {

                    segR = answers[0];
                    segL = answers[1];
                    
                } else {
                    
                    segR = answers[1];
                    segL = answers[0];

                }
            }
        } else {
            // 小さい方が右、大きい方が左
            if (answers[0][0].anchor[0] > answers[1][0].anchor[0]) {

                segR = answers[1];
                segL = answers[0];

            } else {
                
                segR = answers[0];
                segL = answers[1];

            }
        }

        // segLとsegRを追加
        segLs.push(segL);
        segRs.push(segR);
    }

    // 確定座標を格納する場所を定義
    // 最初の座標は確定済みなので、初期値として代入
    let offsetPPsL: [number,number][] = [[segLs[0][0].anchor[0], segLs[0][0].anchor[1]]];
    let offsetPPsR: [number,number][] = [[segRs[0][0].anchor[0], segRs[0][0].anchor[1]]];
    

    // 2線分間の交点を算出し、確定パスポイント配列に格納
    // もし120ポイントあったなら、119セグメントが出来ているはず
    // 最初の1個+for文で119セグメントの交点118個+最後の1個
    // .lengthが7であれば
    // iは0,1,2,3,4,5の6回
    // 01,12,23,34,45,56を比較し
    // 点1,2,3,4,5,6を打つ

    // segLから算出
    for (let i = 0; i < segLs.length - 1; i++){
        const x1 = segLs[i][0].anchor[0];
        const y1 = segLs[i][0].anchor[1];
        const x2 = segLs[i][1].anchor[0];
        const y2 = segLs[i][1].anchor[1];
        const x3 = segLs[i + 1][0].anchor[0];
        const y3 = segLs[i + 1][0].anchor[1];
        const x4 = segLs[i + 1][1].anchor[0];
        const y4 = segLs[i + 1][1].anchor[1];
        
        // 2線分の交点を確定座標に追加
        offsetPPsL.push(crossPoint(x1, y1, x2, y2, x3, y3, x4, y4));
    }

    // segRから算出
    for (let i = 0; i < segRs.length - 1; i++){
        const x1 = segRs[i][0].anchor[0];
        const y1 = segRs[i][0].anchor[1];
        const x2 = segRs[i][1].anchor[0];
        const y2 = segRs[i][1].anchor[1];
        const x3 = segRs[i + 1][0].anchor[0];
        const y3 = segRs[i + 1][0].anchor[1];
        const x4 = segRs[i + 1][1].anchor[0];
        const y4 = segRs[i + 1][1].anchor[1];
        
        // 2線分の交点を確定座標に追加
        offsetPPsR.push(crossPoint(x1, y1, x2, y2, x3, y3, x4, y4));

    }

    // 最後に終点座標を決定、交点もなにもない
    // l1=l2で合ってくれないと困るけど、念の為
    let l1 = segLs.length - 1;
    offsetPPsL.push([
        segLs[l1][1].anchor[0],
        segLs[l1][1].anchor[1]
    ]);

    let l2 = segRs.length - 1;
    offsetPPsR.push([
        segRs[l2][1].anchor[0],
        segRs[l2][1].anchor[1]
    ]);

    // オフセット結果
    const offsetResult:[[number,number][],[number,number][]] = [offsetPPsL,offsetPPsR]
    return offsetResult
}



/**
 * @summary segmentsOffsetで算出したPathItemsを格納し描画を行う
 * @param {PathPoints} points points、[[x1,y1],[x2,y2]...]
 * @param {number} offsetWidth オフセット幅(px)。正の数も負の数も来る
 * @returns {PathItem[]} 作成したPathItem配列
 */
function createOffsetPath(points: PathPoints, offsetWidth: number): PathItem[]{
    
    // オフセット結果配列
    const createdData: [[number,number][],[number,number][]] = segmentsOffset(points, offsetWidth);

    // @ts-ignore
    // type-for-adobeでは対応していないプロパティの模様
    let newLine01 : PathItem = app.activeDocument.pathItems.add();
    newLine01.stroked = true;
    newLine01.setEntirePath(createdData[0]);

    // @ts-ignore
    // type-for-adobeでは対応していないプロパティの模様
    let newLine02 : PathItem = app.activeDocument.pathItems.add();
    newLine02.stroked = true;
    newLine02.setEntirePath(createdData[1]);

    return [newLine01,newLine02]
}



//---------------------------------------------
// 起動時検証処理や、最初に実行される処理など
//---------------------------------------------

/**
 * @summary 選択パスごとに、入力条件に応じて作成を繰り返す
 * @param {number} countNum オフセット数
 * @param {number} widthpx 各線間のオフセット幅
 */
function generate(countNum: number, widthpx: number) {

    // @ts-ignore
    // type-for-adobeでは対応していないプロパティの模様
    const selections: any[] | null = app.activeDocument.selection;

    // nullの場合は戻す
    if (selections == null) {
        // logLines.push("no-selection!")
        return
    }

    // 型変換周りでエラーを吐く(それはそう)が、今回は無視
    let paths: PathItem[] = [];
    for (const obj of selections) {
        if ( obj.typename == "PathItem") {
            
            // pathItemとみなして追加する
            paths.push(obj as PathItem);
        }
    }

    for (const path of paths) {
        // 1つのパス→オフセット数分
        // まずは、今回操作するパスのPathPointsを取得
        const points: PathPoints = path.pathPoints;

        // オフセットしたPathItemを格納する配列

        // オフセット数が偶数か奇数か、で挙動が異なる
        // 挙動が似ている面もあるが、今回は完全に区別する
        if (countNum % 2 === 0) {
            // 偶数
            // 初回オフセットは偶数なら指定幅の半分
            // j*widthpxでどれだけオフセットするのかに該当

            // 現在のオフセット幅
            let nowOffsetWidth = widthpx / 2;

            // オフセット
            createOffsetPath(points, nowOffsetWidth);

            // 残りのオフセット回数分、オフセットを行う
            for (let j = 2; j < countNum; j += 2) {

                // オフセット幅を増やす
                nowOffsetWidth += widthpx;

                // オフセット
                createOffsetPath(points, nowOffsetWidth);

            }

        } else {
            // 奇数、初回オフセットはそのまま複製

            // @ts-ignore
            // type-for-adobeでは対応していないメソッドの模様
            const newPath: PathItem = path.duplicate();
            newPath.stroked = true;

            // 現在のオフセット幅
            let nowOffsetWidth = 0;

            // 残りのオフセット回数分、オフセットを行う
            for (let j = 1; j < countNum; j += 2) {

                // オフセット幅を増やす
                nowOffsetWidth += widthpx;

                // オフセット
                createOffsetPath(points, nowOffsetWidth);

            }
        }
    }
}

/**
 * @summary アプリケーションがセーブされているか
 * @returns {boolean} セーブされていればtrue,それ以外はfalse
 */
function isSaved(): boolean {
    // @ts-ignore
    // typescript-for-adobe非対応
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

/**
 * 本illustratorScriptでhtmlから呼び出される関数
 * @param {number} offsetCount 指定オフセット数
 * @param {number} offsetWidth 指定オフセット幅
 * @returns {string} ログ出力テキスト
 */
function start(offsetCount: number, offsetWidth: number): string {

    // logLines.push("offsetCount : " + offsetCount);
    // logLines.push("offsetCount : " + offsetWidth);
    // // ログ出力用配列
    var logLines: string[] = [];
    if (!isOpenDoc()) {
        // ドキュメントが開かれていないので何もしない
        logLines.push("開かれてない");

    } else if (!isSaved()) {
        // セーブされていないので何もしない
        logLines.push("セーブしてない");

    } else {
        // ドキュメントが開かれており、セーブもされている
        logLines.push("生成！");

        // 実行！
        generate(offsetCount, offsetWidth);
    }
    return logLines.join("\n");
}

// テスト用
function hello() :string{
    return "hello world!"
}