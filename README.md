# illustrator-Line-Offset
- illustratorで線を高機能にオフセットできるスクリプト
- [GitHub](https://github.com/kotodu/illustrator-Line-Offset/)

## 注意
- 現在、ver1.0.0に向けた開発を実行中
- AdobeCEP対応やtypescript対応などで不安定です
- 安定版のダウンロードは[こちら](https://github.com/kotodu/illustrator-Line-Offset/releases/tag/0.1.0)

# 概要
- illustratorでパスのオフセットを複数本同時に行う
    - 今後もしかしたら機能を拡充するかも
- jsxではなく、ZXPデータでの提供

# 使い方
- ZXPデータは ./build/ilo_0.99.0.zxp にあります

## 導入
1. [ZXPデータ](./build/ilo_0.99.0.zxp)をダウンロードする
2. ZXPをインストールする
    - [ZXPinstaller](https://zxpinstaller.com/)
    - [Anastasiy’s Extension Manager](http://install.anastasiy.com/)
    - [その他情報](https://helpx.adobe.com/jp/animate/kb/install-animate-extensions.html)
3. 上のメニューバー>ウィンドウ>エクステンション からillustrator-Line-Offsetを選択する

![showExtension](./docs/showExtension.png)

## 使用
1. スクリプト実行前のIllustratorデータを保存する
1. オフセットさせたいパスを選択する
1. illustrator-Line-Offsetのパネルで2つの項目を入力する
    1. オフセット本数(本)
    1. オフセットの線間の幅(px)
1. オフセット実行を押す
1. 新たなパスが生成される

# サンプル
![サンプル](./docs/lineOffset.PNG)

# バージョン履歴
[CHANGELOG.md](./CHANGELOG)

# Licence
Copyright 2020 kotodu (MIT Licence)

---------------------------------------------
# Q & A
## 既定値を変更させたい
jsxの変更により実現できましたが、ver1.0.0に上がる際に不可能になりました。

今後機能が追加されるかも？

## 異なるオフセット幅にしたい
今は未対応。作者の銀行口座にお金を振り込めば、何か良いことがあるかもしれない。

## 指定する幅ってどこのこと
隣り合う2本のパス間の幅です。線幅は考慮しません。

## よく見たらオフセット幅が微妙にずれている
ゼロ除算などを避ける観点で意図的に誤差を出している。ごめんね。

## 曲線は対応している？
今は未対応。作者にバレンタインチョコを贈れば、何か良いことがあるかもしれない。

## 選択したパスとアピアランスなどが違う
複数選択した際にそうなるのは把握してます、そのうち直すかもしれない。

# 設計
[design.md](./docs/design)

