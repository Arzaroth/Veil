import QtQuick

// Reads the file the way the real one does, through XHR, and answers with the
// same signals; watchChanges is accepted and ignored.
QtObject {
    id: view
    property string path: ""
    property bool watchChanges: false
    property string content: ""
    signal loaded()
    signal loadFailed(int error)
    signal fileChanged()

    function text() { return content }
    function reload() {
        var xhr = new XMLHttpRequest()
        xhr.onreadystatechange = function () {
            if (xhr.readyState !== XMLHttpRequest.DONE) return
            if (xhr.responseText.length > 0) {
                view.content = xhr.responseText
                view.loaded()
            } else {
                view.content = ""
                view.loadFailed(1)
            }
        }
        xhr.open("GET", "file://" + path)
        xhr.send()
    }
    onPathChanged: if (path.length > 0) reload()
}
