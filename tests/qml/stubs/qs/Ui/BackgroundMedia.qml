import QtQuick

Item {
    property string path: ""
    property int version: 0
    property bool cached: false
    property bool constrainDecode: false
    property size decodeSize
    readonly property bool ready: path.length > 0
}
