pragma Singleton
import QtQuick

QtObject {
    property var environment: ({ USER: "arzaroth", HOME: "/home/arzaroth", OMARCHY_PATH: "/opt/omarchy" })
    property var screens: []
    function env(name) { return environment[name] }
}
