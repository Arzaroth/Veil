pragma Singleton
import QtQuick

QtObject {
    function isVideoPath(path) { return /\.(mp4|webm|mkv|mov)$/i.test(String(path || "")) }
    function fileUrl(path) { return "file://" + path }
}
