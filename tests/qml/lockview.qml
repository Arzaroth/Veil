import QtQuick
import Quickshell.Services.UPower
import "../../omarchy/arzaroth.veil" as Veil
import "../../omarchy/arzaroth.veil/Model.mjs" as Model

// The lock view in a plain QML runtime with the shell's modules stubbed:
// what it shows, when it fades, and what it reads from the branding file.
Item {
    width: 1280
    height: 800

    Check { id: check; name: "lockview" }

    Veil.LockView {
        id: view
        anchors.fill: parent
        presented: false
        lockedAtMs: Date.now() - 3 * 60000
        brandingPath: Qt.resolvedUrl("fixtures/branding.txt").toString().replace(/^file:\/\//, "")
    }

    Component.onCompleted: check.run([
        { run: function () {
            check.equal("the name is the capitalized login", view.displayName, "Arzaroth")
            check.equal("the info line has the battery and the lock time", view.infoText, "󰁹 80%   ·   locked 3m")
            check.equal("nothing is revealed before the compositor shows the lock", view.reveal, 0)
            check.equal("no snapshot without a capture", view.snapshotPath, "")
        } },
        { after: 600, run: function () {
            check.equal("the branding art is read and its trailing blank lines trimmed", view.brandingArt, "  ⣿⣿\n ⣿⣿⣿")
            check.equal("still hidden while the lock is not on screen", view.reveal, 0)
            view.presented = true
        } },
        { after: 1400, run: function () {
            check.equal("revealed once the lock is on screen", view.reveal, 1)
            UPower.displayDevice = { isPresent: true, percentage: 1, state: UPowerDeviceState.Charging }
            check.equal("a charging battery switches icon", view.batteryText, "󰂄 100%")
            UPower.displayDevice = { isPresent: false, percentage: 0, state: 0 }
            check.equal("no battery, only the lock time", view.infoText, "locked 3m")
            view.unlocking = true
        } },
        { after: 900, run: function () {
            check.equal("everything fades back out on unlock", view.reveal, 0)
            view.unlocking = false
            view.brandingPath = "/nonexistent/veil-branding.txt"
        } },
        { after: 600, run: function () {
            check.equal("a missing branding file falls back to the wordmark", view.brandingArt, "")
            check.equal("the default time format", view.timeFormat, "HH:mm")
            check.equal("the default date format", view.dateFormat, "dddd d MMMM")
            view.settings = Model.resolveSettings(
                Model.readSettings(JSON.stringify({ plugins: [{ id: "arzaroth.veil", displayName: "Someone", timeFormat: "h:mm AP", dateFormat: "d MMM" }] })).settings,
                { user: "arzaroth", home: "/home/arzaroth" })
        } },
        { run: function () {
            check.equal("a shell.json name reaches the view", view.displayName, "Someone")
            check.equal("a shell.json time format reaches the view", view.timeFormat, "h:mm AP")
            check.equal("a shell.json date format reaches the view", view.dateFormat, "d MMM")
            check.equal("and the default branding path is home-expanded", view.settings.brandingPath, "/home/arzaroth/.config/omarchy/branding/about.txt")
        } }
    ])
}
