# illustrator-Line-Offset
illustratorで線を高機能にオフセットできるスクリプト

# 概要
- illustratorでパスのオフセットを複数本同時に行う
    - 今後もしかしたら機能を拡充するかも

# 使い方
## 導入
1. スクリプトを実行したいIllustratorデータを開く
1. 本githubの"aiLineOffset.jsx"をRAWから名前を付けて保存する
1. PC内のどこかに"aiLineOffset.jsx"を配置する
    - 例えば、adobe既定のスクリプト保管フォルダ

## 使用
1. ***スクリプト実行前のIllustratorデータを保存します***
1. オフセットさせたいパスを選択する
1. ファイル>スクリプトからPC内にある"aiLineOffset.jsx"を選択する
1. 設定画面で2つの項目を入力する
    1. オフセット本数(本)
    1. オフセットの線間の幅(px)
1. OKを押すと新たなパスが生成されます

# サンプル
![サンプル](./doc/lineOffset.PNG)

# バージョン履歴
[CHANGELOG.md](./CHANGELOG)

# Licence
MIT

---------------------------------------------
# Q & A
## 既定値を変更させたい
jsxの冒頭に「ユーザー定義変数」があるので、ここを変えると設定画面での既定値も変わります。テキストエディタで変更すればOK。

## 異なるオフセット幅にしたい
今は未対応。作者の銀行口座にお金を振り込めば、何か良いことがあるかもしれない。

## 指定する幅ってどこのこと
隣り合う2本のパス間の幅です。線幅は考慮しません。

## よく見たらオフセット幅が微妙にずれている
ゼロ除算などを避ける観点で意図的に誤差を出していることもあります。どうしようもない。

## 曲線は対応している？
今は未対応。作者にバレンタインチョコを贈れば、何か良いことがあるかもしれない。

## 選択したパスとアピアランスなどが違う
複数選択した際にそうなるのは把握してます、そのうち直すかもしれない。

# 設計
[設計.md](./docs/設計.md)

# npm-scriptについて
- windows向けですので、各自で適宜変更してください
    - 想定しているフォルダ構成は別記の通りです
- 今回使用していませんが、zxpのビルドにはシェルスクリプトも用意しました
- powershellが環境変数にセットされている前提です
- sampleを元に、powershellのデータを各自で用意いただく形になります

## npm-scriptsで想定している物

### clean
- io.kotodu.iloをアンインストールする
    - 結果のステータスが-406なら、そもそも拡張機能が存在しない

`npm run clean`

### deploy
- cleanを除く一連の動作を全て実行する
    - build, deploy, check
`npm run deploy`

### build:zxp
- 拡張機能のzxpデータをビルドする
`npm run build:zxp`

### deploy:zxp
- ビルドデータをillustratorにインストールする
`npm run deploy:zxp`

### check
- インストールできたか確認する
`npm run check`

## 想定しているフォルダ構成
- パスを適宜変える必要があります

```
C:/Users/YourName/Documents
├ Github
│ └ illustrator-Line-Offset
│ 　 ├ dist(ビルドしたものを出力するディレクトリ)
│ 　 │ └ ilo.zxp(出力拡張機能)
│ 　 ├ src
│ 　 │ └ ソースコード群
│ 　 ├ package.json
│ 　 ├ build.ps1(拡張機能ビルド用powershell)
│ 　 ├ clean.ps1(拡張機能アンインストール用powershell)
│ 　 ├ install.ps1(拡張機能インストール用powershell)
│ 　 └ zxpbuild.sh.sample(今回未使用のビルド用シェルスクリプト)
├ ExManCmd_win
│ └ ExManCmd.exe(インストール用CUI)
├ ZXPSignCmd.exe(ZXP用の証明書発行exe)
└ sign.p12(ZXPSignCmd.exeから出力された証明書)
```