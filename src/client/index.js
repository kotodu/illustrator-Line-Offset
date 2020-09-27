/* 1) Create an instance of CSInterface. */
var csi = new CSInterface();

/* 2) Make a reference to your HTML button and add a click handler. */
var openButton = document.querySelector("#option-submit");
openButton.addEventListener("click", validOption);

/* 3) Write a helper function to pass instructions to the ExtendScript side. */
function validOption() {
    let frm = document.getElementById('ilo-options');
    let fd = new FormData(frm);
    const isSaved = csi.evalScript("isSaved()");
    const isOpenDoc = csi.evalScript("isOpenDoc()");
    if (!isOpenDoc) {
        Window.alert("ドキュメントが開かれていません")
        return
    }
    if (!isSaved) {
        Window.alert("セーブしてください");
    } else {
        csi.evalScript(`generate(${fd.get("offsetCount")},${fd.get("offsetWidth")});`);
    }
}

