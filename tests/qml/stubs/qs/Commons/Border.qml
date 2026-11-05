pragma Singleton
import QtQuick

QtObject {
    function surfaceSpec(surface, role, color, thickness, alphaKey) {
        return { surface: surface, role: role, color: color, thickness: thickness }
    }
}
