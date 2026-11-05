pragma Singleton
import QtQuick

QtObject {
    property int cornerRadius: 0
    property QtObject font: QtObject {
        property string family: "monospace"
        property int title: 14
        property int heading: 16
        property int display: 24
    }
}
