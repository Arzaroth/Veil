import QtQuick
import QtQuick.Effects
import Quickshell
import Quickshell.Io
import Quickshell.Services.UPower
import qs.Commons
import qs.Commons as Commons
import qs.Ui
import "Model.mjs" as Model

Item {
  id: root

  property string backgroundPath: ""
  property string videoPosterPath: ""
  property int backgroundVersion: 0
  property bool fingerprintConfigured: false
  property bool fingerprintUnavailable: false
  property bool authenticatingPassword: false
  property string failureMessage: ""
  property int failedAttempts: 0
  property bool inputEnabled: true
  property bool unlocking: false
  property bool presented: true
  property double lockedAtMs: 0
  property string snapshotPath: ""
  property bool loadBackground: true
  property string passwordText: ""
  property bool syncingPasswordText: false

  property string displayName: Model.displayName(Quickshell.env("USER"))
  property string logoPath: (Quickshell.env("OMARCHY_PATH") || "/usr/share/omarchy") + "/logo.svg"
  property string brandingPath: Quickshell.env("HOME") + "/.config/omarchy/branding/about.txt"
  property string brandingArt: ""
  property string timeFormat: "HH:mm"
  property string dateFormat: "dddd d MMMM"
  property color ink: Qt.tint(Commons.Color.lock.text, Qt.rgba(1, 1, 1, 0.6))

  readonly property string placeholderText: Commons.I18n.t("lock.enterPassword")
  readonly property int fieldWidth: 381
  readonly property int fieldHeight: 67
  readonly property int outlineThickness: 3
  readonly property int fieldFontSize: Math.round(Style.font.heading * 1.125)
  readonly property int passwordDotFontSize: Math.round(Style.font.heading * 1.33)
  readonly property int passwordDotLetterSpacing: Math.round(Style.font.heading * 0.19)
  // Space to keep clear on each side of the field for the fingerprint icon
  // (icon width plus a gap) so the centered dots never run under it.
  readonly property real fingerprintReserve: fingerprintConfigured ? Math.round(fingerprintIcon.implicitWidth + 12) : 0
  // Shrink the dots to fit once the password outgrows the field, so every
  // keystroke stays visible — otherwise long passwords clip with no feedback.
  readonly property real passwordDotScale: dotMetrics.advanceWidth > 0
    ? Math.min(1, (passwordInput.width - 4) / dotMetrics.advanceWidth)
    : 1
  readonly property bool showPasswordCursor: inputEnabled && !authenticatingPassword && failureMessage.length === 0
  readonly property bool errorState: failureMessage.length > 0
  readonly property var inputBorderSpec: errorState
    ? Border.surfaceSpec("lock", "border-error", Commons.Color.lock.borderError, root.outlineThickness, "border-alpha")
    : Border.surfaceSpec("lock", "border-active", Commons.Color.lock.borderActive, root.outlineThickness, "border-alpha")

  // A video wallpaper shows its still poster: nothing plays behind the lock.
  readonly property bool video: Util.isVideoPath(root.backgroundPath)

  property bool started: false
  property real reveal: started && presented && !unlocking ? 1 : 0
  Behavior on reveal {
    NumberAnimation { duration: root.unlocking ? 380 : 700; easing.type: root.unlocking ? Easing.OutCubic : Easing.InOutCubic }
  }

  property double now: Date.now()
  Timer {
    interval: 1000
    running: root.visible
    repeat: true
    triggeredOnStart: true
    onTriggered: root.now = Date.now()
  }

  readonly property string lockedForText: Model.lockedForText(root.lockedAtMs, root.now)

  readonly property string batteryText: {
    var device = UPower.displayDevice
    return Model.batteryText(!!device && device.isPresent, device ? device.percentage : 0,
      !!device && (device.state === UPowerDeviceState.Charging || device.state === UPowerDeviceState.FullyCharged))
  }

  readonly property string infoText: Model.infoText([root.batteryText, root.lockedForText])

  signal submitPassword(string password)
  signal passwordTextEdited(string password)
  signal clearFailureRequested()
  signal wakeRequested()

  function forcePasswordFocus() {
    passwordInput.forceActiveFocus()
  }

  function clearPassword() {
    passwordTextEdited("")
  }

  // Waking a DPMS-blanked display can stall the compositor for seconds while
  // the monitor modesets, so the wake key's release arrives late and client-side
  // key repeat floods the field with that character. A held key has no business
  // typing a password; only holding Backspace/Delete to clear stays useful.
  function dropsAutoRepeat(key) {
    return key !== Qt.Key_Backspace && key !== Qt.Key_Delete
  }

  function syncPasswordText() {
    if (passwordInput.text === passwordText) return
    syncingPasswordText = true
    passwordInput.text = passwordText
    syncingPasswordText = false
  }

  // The field loses focus while a password is checked (it is disabled then),
  // and forcing focus onto it would not stick until the check ends.
  function restorePasswordFocus() {
    if (inputEnabled && passwordInput.enabled && !passwordInput.activeFocus) forcePasswordFocus()
  }

  onPasswordTextChanged: syncPasswordText()
  onInputEnabledChanged: {
    if (inputEnabled) Qt.callLater(forcePasswordFocus)
  }
  onFailedAttemptsChanged: {
    if (failedAttempts > 0) shake.restart()
  }

  // A VT switch, which the NVIDIA driver forces around every suspend, takes the
  // keyboard away and Qt drops the field's focus with it. Nothing gives it back
  // when the keyboard returns, so typing went nowhere until the field was clicked.
  Window.onActiveFocusItemChanged: Qt.callLater(restorePasswordFocus)
  Component.onCompleted: {
    syncPasswordText()
    if (inputEnabled) Qt.callLater(forcePasswordFocus)
    Qt.callLater(function() { root.started = true })
  }

  FileView {
    path: root.brandingPath
    watchChanges: true
    onFileChanged: reload()
    onLoaded: root.brandingArt = Model.brandingArt(text())
    onLoadFailed: root.brandingArt = ""
  }

  // Measures the masked password at full size; passwordDotScale compares this
  // against the field width to decide how far the dots must shrink to fit.
  TextMetrics {
    id: dotMetrics
    font.family: Style.font.family
    font.pixelSize: root.passwordDotFontSize
    font.letterSpacing: root.passwordDotLetterSpacing
    text: "●".repeat(passwordInput.text.length)
  }

  Rectangle {
    anchors.fill: parent
    color: Commons.Color.background

    BackgroundMedia {
      id: wallpaper
      objectName: "lockWallpaper"
      anchors.fill: parent
      path: root.loadBackground ? (root.video ? root.videoPosterPath : root.backgroundPath) : ""
      version: root.backgroundVersion
      // Decode only once sized, at the lock's own size: an unsized first
      // request decoded the file at its native resolution, then again once
      // sized. That size is what the lock service keeps decoded ahead of the
      // lock, so the first frame has the wallpaper.
      cached: true
      constrainDecode: true
      decodeSize: Qt.size(width, height)
    }

    MultiEffect {
      anchors.fill: wallpaper
      source: wallpaper
      autoPaddingEnabled: false
      blurEnabled: root.loadBackground && wallpaper.ready
      blur: snapshot.available ? 1 : root.reveal
      blurMax: 128
      blurMultiplier: 1.25
      contrast: -0.08 * (snapshot.available ? 1 : root.reveal)
    }

    Image {
      id: snapshot
      readonly property bool available: root.snapshotPath.length > 0 && status === Image.Ready
      anchors.fill: parent
      source: root.snapshotPath.length > 0 ? Util.fileUrl(root.snapshotPath) : ""
      asynchronous: false
      cache: false
      fillMode: Image.PreserveAspectCrop
      visible: false
    }

    MultiEffect {
      anchors.fill: snapshot
      source: snapshot
      visible: snapshot.available && opacity > 0
      opacity: 1 - root.reveal
      autoPaddingEnabled: false
      blurEnabled: true
      blur: root.reveal
      blurMax: 128
      blurMultiplier: 1.25
    }

    Rectangle {
      anchors.fill: parent
      color: Commons.Color.background
      opacity: 0.5 * root.reveal
    }

    MouseArea {
      anchors.fill: parent
      hoverEnabled: true
      onClicked: { root.wakeRequested(); root.forcePasswordFocus() }
      onPositionChanged: root.wakeRequested()
    }

    Item {
      anchors.fill: parent
      opacity: root.reveal
      transform: Translate { y: (1 - root.reveal) * (root.unlocking ? -18 : 18) }

      Column {
        anchors.centerIn: parent
        anchors.verticalCenterOffset: -root.fieldHeight
        spacing: 0
        layer.enabled: true
        layer.effect: MultiEffect {
          shadowEnabled: true
          shadowColor: "#000000"
          shadowOpacity: 0.6
          shadowBlur: 0.7
          shadowVerticalOffset: 1
        }

        Text {
          anchors.horizontalCenter: parent.horizontalCenter
          textFormat: Text.PlainText
          text: Qt.formatDateTime(new Date(root.now), root.timeFormat)
          color: root.ink
          font.family: Style.font.family
          font.pixelSize: Style.font.display * 4
          font.weight: Font.Light
        }

        Text {
          anchors.horizontalCenter: parent.horizontalCenter
          textFormat: Text.PlainText
          text: Qt.locale().toString(new Date(root.now), root.dateFormat)
          color: root.ink
          opacity: 0.9
          font.family: Style.font.family
          font.pixelSize: Math.round(Style.font.heading * 1.25)
        }

        Item { width: 1; height: 56 }

        Text {
          anchors.horizontalCenter: parent.horizontalCenter
          textFormat: Text.PlainText
          text: root.displayName
          visible: text.length > 0
          color: root.ink
          font.family: Style.font.family
          font.pixelSize: Style.font.heading
          font.letterSpacing: 1.5
        }

        Item { width: 1; height: 14 }

        BorderSurface {
          id: inputField
          anchors.horizontalCenter: parent.horizontalCenter
          width: root.fieldWidth
          height: root.fieldHeight
          color: Commons.Color.lock.background
          borderSpec: root.inputBorderSpec
          radius: Style.cornerRadius
          clip: true
          transform: Translate { id: shakeOffset }

          SequentialAnimation {
            id: shake
            NumberAnimation { target: shakeOffset; property: "x"; to: -7; duration: 60; easing.type: Easing.OutQuad }
            NumberAnimation { target: shakeOffset; property: "x"; to: 6; duration: 90; easing.type: Easing.InOutQuad }
            NumberAnimation { target: shakeOffset; property: "x"; to: -3; duration: 80; easing.type: Easing.InOutQuad }
            NumberAnimation { target: shakeOffset; property: "x"; to: 0; duration: 70; easing.type: Easing.OutQuad }
          }

          TextInput {
            id: passwordInput
            anchors.fill: parent
            anchors.topMargin: inputField.borderTop
            // Reserve the fingerprint icon's width on both sides so the centered
            // dots stay symmetric and never slide under the icon as they grow.
            anchors.rightMargin: inputField.borderRight + 18 + root.fingerprintReserve
            anchors.bottomMargin: inputField.borderBottom
            anchors.leftMargin: inputField.borderLeft + 18 + root.fingerprintReserve
            verticalAlignment: TextInput.AlignVCenter
            horizontalAlignment: TextInput.AlignHCenter
            activeFocusOnPress: true
            clip: true
            enabled: root.inputEnabled && !root.authenticatingPassword
            readOnly: root.authenticatingPassword
            echoMode: TextInput.Password
            passwordCharacter: "●"
            passwordMaskDelay: 0
            color: Commons.Color.lock.text
            selectionColor: Commons.Color.lock.selection
            selectedTextColor: Commons.Color.lock.text
            font.family: Style.font.family
            font.pixelSize: text.length > 0 ? Math.max(1, Math.floor(root.passwordDotFontSize * root.passwordDotScale)) : root.fieldFontSize
            font.letterSpacing: text.length > 0 ? root.passwordDotLetterSpacing * root.passwordDotScale : 0
            cursorVisible: activeFocus && root.showPasswordCursor && text.length > 0
            cursorDelegate: Rectangle {
              width: 2
              color: Commons.Color.lock.text
              visible: passwordInput.cursorVisible
            }

            onTextChanged: {
              if (!root.syncingPasswordText) root.passwordTextEdited(text)
              if (text.length > 0) {
                root.wakeRequested()
              }
              if (text.length > 0 && root.failureMessage.length > 0) root.clearFailureRequested()
            }

            onAccepted: {
              var submitted = root.passwordText
              root.passwordTextEdited("")
              if (submitted.length > 0) root.submitPassword(submitted)
            }

            Keys.onPressed: function(event) {
              root.wakeRequested()
              if (event.isAutoRepeat && root.dropsAutoRepeat(event.key)) {
                event.accepted = true
                return
              }
              if (event.key === Qt.Key_Escape || (event.modifiers & Qt.ControlModifier && event.key === Qt.Key_U)) {
                root.passwordTextEdited("")
                event.accepted = true
              }
            }
          }

          Text {
            textFormat: Text.PlainText
            anchors.fill: passwordInput
            text: root.authenticatingPassword ? Commons.I18n.t("lock.checking") : (root.failureMessage.length > 0 ? root.failureMessage : root.placeholderText)
            visible: passwordInput.text.length === 0
            color: root.authenticatingPassword ? Commons.Color.lock.text : (root.failureMessage.length > 0 ? Commons.Color.lock.textError : Qt.rgba(root.ink.r, root.ink.g, root.ink.b, 0.6))
            font.family: Style.font.family
            font.pixelSize: root.fieldFontSize
            font.italic: !root.authenticatingPassword && root.failureMessage.length > 0
            horizontalAlignment: Text.AlignHCenter
            verticalAlignment: Text.AlignVCenter
            elide: Text.ElideRight
          }

          // Fingerprint hint pinned inside the field's right edge when a sensor is
          // enrolled, so the user knows they can touch to unlock instead of typing.
          // Matches hyprlock, which draws its fingerprint icon in the same spot.
          // A reader the shell cannot reach crosses out rather than disappears, so
          // it stops inviting touches that can never unlock.
          Text {
            id: fingerprintIcon
            objectName: "fingerprintIndicator"
            textFormat: Text.PlainText
            anchors.right: parent.right
            anchors.rightMargin: inputField.borderRight + 18
            anchors.verticalCenter: parent.verticalCenter
            visible: root.fingerprintConfigured
            text: root.fingerprintUnavailable ? "󰺱" : "󰈷"
            color: root.fingerprintUnavailable ? Commons.Color.lock.textError : Commons.Color.lock.placeholder
            font.family: Style.font.family
            font.pixelSize: Math.round(root.fieldFontSize * 1.1)
            horizontalAlignment: Text.AlignHCenter
            verticalAlignment: Text.AlignVCenter
          }
        }

        Item { width: 1; height: 18 }

        Text {
          anchors.horizontalCenter: parent.horizontalCenter
          textFormat: Text.PlainText
          text: root.infoText
          opacity: text.length > 0 ? 0.8 : 0
          color: root.ink
          font.family: Style.font.family
          font.pixelSize: Style.font.title
        }

        Item { width: 1; height: 10 }

        // The crossed-out icon has no meaning to a user who has never seen it — it
        // is not intuitive that it signals a broken reader — so the words carry the
        // explanation and the icon only reinforces it.
        Text {
          objectName: "fingerprintUnavailableNotice"
          anchors.horizontalCenter: parent.horizontalCenter
          textFormat: Text.PlainText
          visible: root.fingerprintConfigured && root.fingerprintUnavailable
          text: Commons.I18n.t("lock.fingerprintUnavailable")
          color: Commons.Color.lock.textError
          font.family: Style.font.family
          font.pixelSize: Style.font.heading
          font.italic: true
          horizontalAlignment: Text.AlignHCenter
        }
      }

      Text {
        anchors.horizontalCenter: parent.horizontalCenter
        anchors.bottom: parent.bottom
        anchors.bottomMargin: 48
        visible: root.brandingArt.length > 0
        textFormat: Text.PlainText
        text: root.brandingArt
        color: root.ink
        opacity: 0.7
        font.family: Style.font.family
        font.pixelSize: 9
        lineHeightMode: Text.FixedHeight
        lineHeight: 10
      }

      Item {
        id: logo
        anchors.horizontalCenter: parent.horizontalCenter
        anchors.bottom: parent.bottom
        anchors.bottomMargin: 56
        visible: root.brandingArt.length === 0
        height: 24
        width: Math.round(height * 1215 / 285)
        opacity: 0.7

        Image {
          id: logoImage
          anchors.fill: parent
          source: Util.fileUrl(root.logoPath)
          sourceSize: Qt.size(parent.width * 2, parent.height * 2)
          fillMode: Image.PreserveAspectFit
          visible: false
          layer.enabled: true
        }

        Rectangle {
          id: logoFill
          anchors.fill: parent
          color: root.ink
          visible: false
          layer.enabled: true
        }

        MultiEffect {
          anchors.fill: parent
          source: logoFill
          maskEnabled: true
          maskSource: logoImage
          maskThresholdMin: 0.5
          maskSpreadAtMin: 1.0
        }
      }
    }
  }
}
