/* 1) Create an instance of CSInterface. */
var csi = new CSInterface();

/* 2) Make a reference to your HTML button and add a click handler. */
var openButton = document.querySelector("#option-submit");
openButton.addEventListener("click", validOption);

/* 3) Write a helper function to pass instructions to the ExtendScript side. */
async function validOption() {
    addLog("実行")
    // フォームのクライアントサイドでのvalidation
    const frm = document["ilo-option"];
    const isNormalValue = frm.checkValidity();
    frm.classList.add('was-validated');
    if (!isNormalValue) {
        return
    }

    // フォームの値を取得
    const oc = frm.offsetCount.value;
    const ow = frm.offsetWidth.value;
    addLog("frm:" + frm);
    addLog("oc:" + oc);
    addLog("ow:" + ow);


    let isSaved;
    await csi.evalScript("app.activeDocument.saved", function (result){
        addLog("eval isSaved:" + result);
        isSaved = result;
    });
    let isOpenDoc;
    await csi.evalScript("isOpenDoc()", function (result){
        addLog("eval isOpenDoc:" + result);
        isOpenDoc = result;
    });
    addLog("save:" + isSaved);
    addLog("doc:" + isOpenDoc);
    // Window.alert(isSaved,isOpenDoc);
    if (!isOpenDoc) {
        // Window.alert("ドキュメントが開かれていません")
        addLog("開かれてない");
        return
    }
    if (!isSaved) {
        addLog("セーブしてない");
        // Window.alert("セーブしてください");
    } else {
        addLog("生成！");
        csi.evalScript(`generate(${oc},${ow})`);
    }
}

function addLog(text) {
    const taValue = document.getElementById("ta").value;
    document.getElementById("ta").value = taValue + "\n" + text;
}