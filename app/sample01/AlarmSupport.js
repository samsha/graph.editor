var AlarmType = {
    CRITICAL: {value: 40, color: Q.toColor(0xEEFF0000), shape: Q.Consts.SHAPE_CIRCLE, sortName: "C"},
    MAJOR: {value: 30, color: Q.toColor(0xEEFFAA00), shape: Q.Consts.SHAPE_DIAMOND, sortName: "M"},
    MINOR: {value: 20, color: Q.toColor(0xEEFFFF00), shape: Q.Consts.SHAPE_ROUNDRECT, sortName: "m"},
    WARNING: {value: 10, color: Q.toColor(0xEE00FFFF), shape: Q.Consts.SHAPE_HEXAGON, sortName: "W"}
}

function registerAlarmType(name, alarm) {
    AlarmType[name] = alarm;
}

function randomAlarmType() {
    var names = Object.getOwnPropertyNames(AlarmType);
    return AlarmType[names[Q.randomInt(names.length)]];
}

function getAlarmColor(alarm) {
    if (alarm.color) {
        return alarm.color;
    }
    if (alarm.alarmType) {
        return alarm.alarmType.color;
    }
    throw new Error('can not get alarm color')
}

var auperOnParentChanged = Q.Element.prototype.onParentChanged
Q.Element.prototype.onParentChanged = function (oldParent, newParent) {
    var result = auperOnParentChanged.apply(this, arguments);

    if (this.hasAlarm()) {
        if (oldParent) {
            oldParent.onChildrenAlarmChanged()
        }
        if (newParent) {
            newParent.onChildrenAlarmChanged();
        }
    }
    return result;
}

Q.Element.prototype.onChildrenAlarmChanged = function () {
    this._deriveAlarmInvalidateFlag = true;
    if (this.parent) {
        this.parent.onChildrenAlarmChanged();
    } else {
        this.getDerivedAlarm();
    }
}

function cumsumHighestAlarm(alarm1, alarm2) {
    if (!alarm1 || !alarm2) {
        return alarm1 || alarm2;
    }
    if (alarm1.alarmType.value < alarm2.alarmType.value) {
        return alarm2;
    }
    if (alarm1.alarmType.value > alarm2.alarmType.value) {
        return alarm1;
    }
    return {
        alarmType: alarm1.alarmType,
        count: alarm1.count + alarm2.count
    }
}

Q.Element.prototype.getDerivedAlarm = function () {
    if (!this._deriveAlarmInvalidateFlag) {
        return this.derivedAlarm;
    }
    this._deriveAlarmInvalidateFlag = false;
    var highestAlarm;
    this.forEachChild(function (child) {
        highestAlarm = cumsumHighestAlarm(highestAlarm, cumsumHighestAlarm(child.getDerivedAlarm(), child.alarm));
    })
    this.derivedAlarm = highestAlarm;
    this.updateDerivedAlarmStyles();
    return this.derivedAlarm;
}

Q.Element.prototype.setAlarm = function (AlarmType, count) {
    if (!AlarmType) {
        this.alarm = null;
    } else {
        this.alarm = {
            alarmType: AlarmType,
            count: count || ''
        }
    }
    if (this.parent) {
        this.parent.onChildrenAlarmChanged()
    }

    this.updateAlarmStyles();
}

Q.Element.prototype.hasAlarm = function () {
    return this.alarm || this.derivedAlarm;
}

//alarm from children
Q.Element.prototype.updateDerivedAlarmStyles = function () {
    if (!this.derivedAlarm) {
        this.setStyle(Q.Styles.BORDER, null);
        this.setStyle(Q.Styles.BORDER_COLOR, null);
        this.setStyle(Q.Styles.PADDING, null);
        return;
    }
    this.setStyle(Q.Styles.BORDER, 1);
    this.setStyle(Q.Styles.PADDING, 5);
    this.setStyle(Q.Styles.BORDER_COLOR, getAlarmColor(this.derivedAlarm));
}

//alarm on self
Q.Element.prototype.updateAlarmStyles = function () {
    if (!this.alarm) {
        this.setStyle(Q.Styles.RENDER_COLOR, null);
        if(this._alarmUIs){
            for(var name in this._alarmUIs){
                this.removeUI(this._alarmUIs[name]);
            }
            this._alarmUIs = null;
        }
        return;
    }

    alarmWithbackgroundShape(this, this.alarm)
    alarmWithRenderColorAndLabel(this, this.alarm);
}
Q.Element.prototype.addAlarmUI = function(name, ui){
    if(!this._alarmUIs){
        this._alarmUIs = {};
    }
    this._alarmUIs[name] = ui;
    this.addUI(ui);
}

function alarmWithbackgroundShape(element, alarm) {
    var color = getAlarmColor(alarm);
    var name = 'background', ui;
    if(!element._alarmUIs || !element._alarmUIs[name]){
        ui = new Q.ImageUI();
        ui.position = Q.Position.CENTER_MIDDLE;
        ui.zIndex = -1;
        element.addAlarmUI(name, ui);
    }else{
        ui = element._alarmUIs[name];
    }
    var shape = alarm.alarmType.shape || Q.Consts.SHAPE_CIRCLE;
    if (Q.isString(shape)) {
        shape = Q.Shapes.getShape(shape, 60, 60);
    }
    if(!(shape instanceof Q.Path)){
        throw new Error('shape must be type of Path');
    }
    // var shape = Q.Shapes.getShape(Q.Consts.SHAPE_CIRCLE, 60, 60);
    // var shape = Q.Shapes.createRegularShape(10, 0, 0, 30);
    // var shape = new Q.Path();
    // shape.moveTo(10, 0);
    // shape.lineTo(50, 0);
    // shape.lineTo(60, 60);
    // shape.lineTo(0, 60);
    // shape.closePath();

    ui.data = shape;
    ui.fillColor = color;
    element.invalidate();
}

function alarmWithRenderColorAndLabel(element, alarm) {
    var color = getAlarmColor(alarm);
    element.setStyle(Q.Styles.RENDER_COLOR, color);
    var name = 'label', ui;
    if(!element._alarmUIs || !element._alarmUIs[name]){
        ui = new Q.LabelUI();
        ui.position = Q.Position.CENTER_TOP;
        ui.anchorPosition = Q.Position.LEFT_BOTTOM;
        ui.border = 1;
        ui.backgroundGradient = Q.Gradient.LINEAR_GRADIENT_VERTICAL;
        ui.padding = new Q.Insets(2, 5);
        ui.showPointer = true;
        ui.offsetY = -10;
        ui.offsetX = -10;
        ui.rotatable = false;
        ui.showOnTop = true;
        element.addAlarmUI(name, ui);
    }else{
        ui = element._alarmUIs[name];
    }
    ui.data = alarm.count + alarm.alarmType.sortName;
    ui.backgroundColor = color;
    element.invalidate();
}

Q.AlarmType = AlarmType;
Q.registerAlarmType = registerAlarmType;
Q.randomAlarmType = randomAlarmType;