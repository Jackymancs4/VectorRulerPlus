/* jshint asi: true*/
var ruler = {}

var limitTickQty = function () {
    // Prevent it from crashing if it tries to render too many linest
    ruler.ticksPerUnit = Math.pow(ruler.subUnitBase, ruler.subUnitExponent)
    ruler.masterTickQty = ruler.ticksPerUnit * ruler.width
    if (ruler.height > 100) {
        console.warn("Unreasonable ruler height: " + ruler.height)
        console.info("Reducing height to: 15")
        ruler.height = 15
        document.getElementById("rulerHeight").value = ruler.height;
    }
    if (ruler.width > 1000) {
        console.warn("Unreasonable tick quantity: " + ruler.masterTickQty)
        console.info("Reducing width to: 500")
        ruler.width = 500
        document.getElementById("rulerWidth").value = ruler.width;
    }
    if (ruler.masterTickQty > 10000) {
        console.warn("Unreasonable tick quantity: " + ruler.masterTickQty)
        console.info("Reducing exponent")
        if (ruler.subUnitExponent > 1) {
            ruler.subUnitExponent = ruler.subUnitExponent - 1
            document.getElementById("subUnitExponent")[ruler.subUnitExponent].selected = true;
        }
    }
    if (ruler.ticksPerUnit > 100) {
        console.warn("Unreasonable exponent: " + ruler.ticksPerUnit)
        console.info("Resetting to reasonable")
        ruler.subUnitExponent = 1
        // selects resonable
        document.getElementById("subUnitExponent")[ruler.subUnitExponent].selected = true;
    }
}

var checkUnit = function () {
    // I don't think this needs to be in the object....
    var pixelsPerInch = 72
    var pixelsPerCM = pixelsPerInch / ruler.cmPerInch

    if (ruler.units === "in") {
        ruler.pixelsPerUnit = pixelsPerInch
        ruler.unitsAbbr = "\"in."
    }
    else if (ruler.units === "cm") {
        ruler.unitsAbbr = "cm."
        ruler.pixelsPerUnit = pixelsPerCM
    }
    else {
        ruler.pixelsPerUnit = 0
        console.error("Unexpected unit value. Unit value: " + rulerUnits)
    }
    ruler.heightPixels = ruler.height * ruler.pixelsPerUnit
}

var checkSubUnitBase = function () {
    // if it is fractional, make the fractional dropdown appear
    // if it is decimal, likewise
    var suffix = " " + ruler.unitsAbbr

    var subLabelsDec = [
        "1" + suffix,
        "1/10th" + suffix,
        "1/100th" + suffix,
        "1/1000th" + suffix,
        "1/10000th" + suffix,
        "1/100000th" + suffix,
        "1/1000000th" + suffix,
    ]

    var subLabelsFrac = [
        "1" + suffix,
        "1/2" + suffix,
        "1/4" + suffix,
        "1/8" + suffix,
        "1/16" + suffix,
        "1/32" + suffix,
        "1/64" + suffix,
    ]

    // Decimal!
    if (ruler.subUnitBase === '10') {
        ruler.subLabels = subLabelsDec
        document.getElementById("subUnitExponent")[3].disabled = true;
        // disable the ones that crash.
        document.getElementById("subUnitExponent")[4].disabled = true;
        document.getElementById("subUnitExponent")[5].disabled = true;
        document.getElementById("subUnitExponent")[6].disabled = true;

        for (var i = ruler.subLabels.length - 1; i >= 0; i--) {
            document.getElementById("subUnitExponent")[i].text = ruler.subLabels[i]
        }
    }
    // Fractional!
    else if (ruler.subUnitBase === '2') {
        ruler.subLabels = subLabelsFrac
        document.getElementById("subUnitExponent")[3].disabled = false;
        document.getElementById("subUnitExponent")[4].disabled = false;
        // re-enable the ones that dont crash
        document.getElementById("subUnitExponent")[5].disabled = false;
        document.getElementById("subUnitExponent")[6].disabled = false;

        for (var j = ruler.subLabels.length - 1; j >= 0; j--) {
            document.getElementById("subUnitExponent")[j].text = ruler.subLabels[j]
        }
    }
    else {
        console.error("Impossible subUnitBase. Must be 2 or 10. is:  " + ruler.subUnitBase)
    }
}

var resizeSVG = function (svgRoot) {
    svgRoot.setAttribute("x", "0")
    svgRoot.setAttribute("y", "0")

    let width = ruler.width
    let height = ruler.height

    if (ruler.verticalRuler) {
        width = ruler.height
        height = ruler.width
    }

    svgRoot.setAttribute("width", width + ruler.units)
    svgRoot.setAttribute("height", height + ruler.units)

    svgRoot.setAttribute("viewBox", "0" + ruler.units + " 0" + ruler.units + " " + width + ruler.units + "" + height + + ruler.units)

    svgRoot.setAttribute("xmlns", "http://www.w3.org/2000/svg")
    svgRoot.setAttribute("xmlns:xlink", "http://www.w3.org/1999/xlink")
    svgRoot.setAttribute("version", "1.1")
}

var constructRuler = function (svgRoot) {
    // for prevention of redunancy, an member for each tick
    ruler.tickArray = [];
    // Layers in the SVG file.
    var layerArray = new Array(ruler.subUnitExponent)

    for (var exponentIndex = 0; exponentIndex <= ruler.subUnitExponent; exponentIndex++) {
        // loop thru each desired level of ticks, inches, halves, quarters, etc....
        var tickQty = ruler.width * Math.pow(ruler.subUnitBase, exponentIndex)

        layerArray[exponentIndex] = document.createElementNS("http://www.w3.org/2000/svg", "g")
        layerArray[exponentIndex].id = ruler.subLabels[exponentIndex] + " Tick Group";

        var startNo = document.getElementById('startNo').value;

        highestTickDenomonatorMultiplier = ruler.ticksPerUnit / Math.pow(ruler.subUnitBase, exponentIndex)
        // to prevent reduntant ticks, this multiplier is applied to crrent units to ensure consistent indexing of ticks.
        for (var tickIndex = 0; tickIndex <= tickQty; tickIndex++) {
            ruler.masterTickIndex = highestTickDenomonatorMultiplier * tickIndex
            // levelToLevelMultiplier = 0.7
            var tickHeight
            tickHeight = ruler.height * Math.pow(ruler.levelToLevelMultiplier, exponentIndex)

            var tickSpacing = 1 / (Math.pow(ruler.subUnitBase, exponentIndex))
            // spacing between ticks, the fundemental datum on a ruler :-)
            var finalTick = false
            if (tickIndex === tickQty) { finalTick = true }

            var offsetTickIndex = parseInt(tickIndex) + parseInt(startNo)
            tick(layerArray[exponentIndex], tickHeight, 0, tickIndex, offsetTickIndex, exponentIndex, tickSpacing, finalTick);
            // draws the ticks
        }

        svgRoot.appendChild(layerArray[exponentIndex])
    }


}

var tick = function (svgGroup, tickHeight, horizPosition, tickIndex, offsetTickIndex, exponentIndex, tickSpacing, finalTick) {
    let x1, x2, y1, y2

    if (!ruler.horizontalFlip) {
        // all lines start at top of screen
        // exponentIndex is 0-6, how small it is, 6 being smallest
        x1 = horizPosition + (tickSpacing * tickIndex)
        // x === x because lines are vertical
        x2 = x1
    } else {
        x1 = ruler.width - (horizPosition + (tickSpacing * tickIndex))
        x2 = x1
    }

    if (!ruler.verticalFlip) {
        // all lines start at top of screen
        y1 = 0
        // downward
        y2 = tickHeight
    } else {
        y1 = ruler.height
        y2 = ruler.height - tickHeight
    }

    // A----B  C----A
    // |    |=>|    |
    // C----D  D----B

    // A=(x1,y1)
    // B=(x1+w,y1)
    // C=(x1,y1+h)
    // D=(x2,y2)

    if (ruler.verticalRuler) {
        let tempX1 = x1
        let tempX2 = x2
        let tempY1 = y1
        let tempY2 = y2

        x1 = ruler.height - tempY1
        x2 = ruler.height - tempY2
        y1 = tempX1
        y2 = tempX2
    }

    if (ruler.tickArray[ruler.masterTickIndex] === undefined || ruler.redundant) {
        // if no tick exists already, or if we want redundant lines, draw the tick.
        let line = document.createElementNS("http://www.w3.org/2000/svg", "line")
        line.setAttribute("x1", x1 + ruler.units)
        line.setAttribute("x2", x2 + ruler.units)
        line.setAttribute("y1", y1 + ruler.units)
        line.setAttribute("y2", y2 + ruler.units)

        // label for SVG editor
        line.id = ruler.subLabels[exponentIndex] + " Tick no. " + tickIndex
        // color of ruler line
        line.style.stroke = "black";
        // width of ruler line in pixels
        line.style.strokeWidth = "1";

        line.setAttribute("stroke", "#000000")
        line.setAttribute("stroke-width", "1")

        // register the tick so it is not duplicated
        ruler.tickArray[ruler.masterTickIndex] = true

        // if is a primary tick, it needs a label
        if (exponentIndex === 0) {
            tickLabel(svgGroup, x1, y2, finalTick, offsetTickIndex, exponentIndex)
        }

        svgGroup.appendChild(line)
    }
}

var tickLabel = function (svgGroup, x1, y2, finalTick, tickIndex, exponentIndex) {
    // label the tick
    var labelTextSize
    var labelTextSizeInches = 18
    var labelTextSizeCm = Math.round(labelTextSizeInches / ruler.cmPerInch)

    if (ruler.units === "in") {
        labelTextSize = labelTextSizeInches;
    }
    else {
        labelTextSize = labelTextSizeCm
    }

    let xLabelOffset
    let yLabelOffset

    if (!ruler.verticalFlip) {
        xLabelOffset = 0.02
        yLabelOffset = -0.02
    } else {
        xLabelOffset = 0.02
        yLabelOffset = 0.15
    }

    let text = document.createElementNS("http://www.w3.org/2000/svg", "text")
    text.setAttribute("text-anchor", "start")

    if (ruler.verticalRuler) {
        x1 = ruler.height - x1
        if (ruler.verticalFlip) {
            xLabelOffset = -0.05
            text.setAttribute("text-anchor", "end")
        } else
            xLabelOffset = 0.05

        if (ruler.horizontalFlip) {

            if (tickIndex == 0) {
                xLabelOffset = 0.05
                yLabelOffset = -0.05
                text.setAttribute("text-anchor", "start")
            }

            if (finalTick) {
                finalTick = false
                yLabelOffset = 0.15
            }
        } else {
            if (tickIndex == 0) {
                yLabelOffset = 0.15
            }

            if (finalTick) {
                finalTick = false
                yLabelOffset = -0.05
            }
        }

    }

    if (ruler.horizontalFlip & !ruler.verticalRuler) {
        finalTick = false

        if (tickIndex == 0) {
            // last label is right justified
            xLabelOffset = -0.02
            // last label is right justified
            text.setAttribute("text-anchor", "end")
        }
    }

    if (finalTick) {
        // last label is right justified
        xLabelOffset = -0.02
        // last label is right justified
        text.setAttribute("text-anchor", "end")
    }

    text.setAttribute("x", (x1 + xLabelOffset) + ruler.units)
    text.setAttribute("y", (y2 + yLabelOffset) + ruler.units)

    text.style.color = 'black';
    // text.style.fontFamily = 'Helvetica'
    text.style.fontFamily = 'monospace'
    text.style.fontWeight = 'bold'
    text.style.fontSize = labelTextSize + "px";
    // text.style.fontSize = 7,

    text.textContent = tickIndex;

    // label for SVG editor
    text.id = ruler.subLabels[exponentIndex] + " label no. " + tickIndex

    svgGroup.appendChild(text)
}

var debug = function () {
    console.info("--All the variables---")
    // prints all attributes of ruler object
    console.info(ruler)
}

var updateVariables = function () {
    ruler.units = document.querySelector("input[name=rulerUnits]:checked").value;
    ruler.subUnitBase = document.querySelector("input[name=subUnits]:checked").value;
    ruler.redundant = document.querySelector("input[name=redundant]").checked;
    ruler.width = Number(document.getElementById("rulerWidth").value);
    ruler.height = Number(document.getElementById('rulerHeight').value);
    ruler.subUnitExponent = document.getElementById('subUnitExponent').value;
    ruler.levelToLevelMultiplier = document.getElementById('levelToLevelMultiplier').value;
    ruler.cmPerInch = 2.54
    ruler.verticalFlip = document.querySelector("input[name=verticalFlip]").checked;
    ruler.horizontalFlip = document.querySelector("input[name=horizontalFlip]").checked;
    ruler.verticalRuler = document.querySelector("input[name=verticalRuler]").checked;
}

var build = function () {
    let svgContainer = document.getElementById("svgContainer")
    let svgs = document.querySelector("#svgContainer > svg")
    if (svgs) {
        svgContainer.removeChild(svgs)
    }

    let svgDoc = document.implementation.createDocument("http://www.w3.org/2000/svg", "svg", null);
    let svgRoot = svgDoc.documentElement;

    updateVariables()
    checkUnit()
    checkSubUnitBase()
    limitTickQty()

    resizeSVG(svgRoot)
    constructRuler(svgRoot)

    svgContainer.appendChild(svgRoot)
}

var exportSvg = function () {
    document.getElementById("svgexpbutton").onclick = function () {
        let serializer = new XMLSerializer();
        let svg = document.querySelector("#svgContainer > svg")
        let link = document.createElement('a');

        link.href = "data:image/svg+xml," + encodeURIComponent(serializer.serializeToString(svg))
        link.download = 'ruler.svg';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

    };

};

(function () {
    console.log("\t Welcome to the Ruler Generator │╵│╵│╵│╵│╵│╵│")
    // When document is loaded, call build once
    build()
    // prints all values to browser console
    debug()

    document.getElementById("rulerParameters").onchange = function () {
        // anytime anything within the form is altered, call build again
        build()
        // prints all values to browser console
        debug()
    };

    exportSvg();
})();
