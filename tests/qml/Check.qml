import QtQuick

// Assertions, a list of steps run one timer tick apart, and an exit code: a
// plain QML runtime has no test framework, and Qt.exit is the only thing the
// runner can read. The watchdog stops a harness that throws before it ends.
Item {
    id: check
    property string name: "qml"
    property int failures: 0
    property int checks: 0
    property var steps: []
    property int stepIndex: 0

    function equal(what, actual, expected) {
        checks += 1
        if (actual === expected) return
        failures += 1
        console.warn("FAIL " + what + ": expected " + JSON.stringify(expected) + ", got " + JSON.stringify(actual))
    }

    function ok(what, condition) { equal(what, !!condition, true) }

    function run(list) {
        steps = list
        stepIndex = 0
        next()
    }

    function next() {
        if (stepIndex >= steps.length) { done(); return }
        var step = steps[stepIndex]
        stepIndex += 1
        stepTimer.interval = step.after || 0
        stepTimer.body = step.run
        stepTimer.restart()
    }

    function done() {
        console.warn(name + ": " + (checks - failures) + "/" + checks + " checks, " + failures + " failed")
        Qt.exit(failures === 0 ? 0 : 1)
    }

    Timer {
        id: stepTimer
        property var body: null
        onTriggered: {
            try {
                body()
            } catch (e) {
                check.failures += 1
                console.warn("THREW in " + check.name + ": " + e + "\n" + (e.stack || ""))
            }
            check.next()
        }
    }

    Timer {
        interval: 15000
        running: true
        onTriggered: {
            console.warn(check.name + ": timed out with " + check.checks + " checks run")
            Qt.exit(2)
        }
    }
}
