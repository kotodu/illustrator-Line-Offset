/* 1) Create an instance of CSInterface. */
var csi = new CSInterface();

/* 2) Make a reference to your HTML button and add a click handler. */
var openButton = document.querySelector("#option-submit");
openButton.addEventListener("click", validOption);

/* 3) Write a helper function to pass instructions to the ExtendScript side. */
async function validOption() {
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

    // illustratorScript起動
    // 値が正しいか、illustratorは開かれているか、
    // などは拡張機能側で行う。
    // (evalScriptは独立された完全非同期で行われる為)
    csi.evalScript(`start(${oc},${ow})`, (log) => {
        // ログ出力された場合は、出力する。
        document.getElementById("ta").value = log;
    });
    // csi.evalScript(`hello()`, (log) => {
    //     // ログ出力された場合は、出力する。
    //     document.getElementById("ta").value = log;
    // });
}