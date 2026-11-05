pragma Singleton
import QtQuick

QtObject {
    property color background: "#001c2b"
    property QtObject lock: QtObject {
        property color text: "#6c7c81"
        property color placeholder: "#a86c7c81"
        property color background: "#cc001c2b"
        property color borderActive: "#268bd2"
        property color borderError: "#dc322f"
        property color selection: "#268bd2"
        property color textError: "#dc322f"
    }
}
