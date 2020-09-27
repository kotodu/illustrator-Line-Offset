# echo "1"
$SIGNCMD="C:/Users/who/Documents/ZXPSignCmd"
$SRCDIR="C:/Users/who/Documents/GitHub/illustrator-Line-Offset/src"
$SIGFILE="C:/Users/who/Documents/sign.p12"
$ZXPFILE="C:/Users/who/Documents/GitHub/illustrator-Line-Offset/dist/ilo.zxp"
$PW="kotorailway"

# ZXPを事前に削除
if (Test-Path $ZXPFILE){
    Remove-Item $ZXPFILE
}

# パッケージ・署名
Start-Process -FilePath $SIGNCMD -ArgumentList "-sign $SRCDIR $ZXPFILE $SIGFILE $PW" -Wait
exit
