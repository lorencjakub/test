// --- MODUL PRO PRÁCI S CANVAS ELEMENTEM PRO ZADÁVÁNÍ OBECNÝCH PRŮŘEZŮ GRAFICKY--- //


// funkce měnící šířku canvasu na zadanou hodnotu (defaultně 300 px)
function widthOfMyCanvas() {
    let canvas = $('#myCanvas')[0];
    let width = $('#widthOfCanvas')[0];

    if ((isNaN(width.value)) || (width.value <= 0)) {
        canvas.setAttribute('width', canvas.parentElement.getBoundingClientRect()["width"] * 0.9);
        width.value = `Šířka: ${canvas.parentElement.getBoundingClientRect()["width"]}`;
    }

    else {
        canvas.setAttribute('width', width.value);
    }

    redrawAll('');
}


// funkce měnící výšku canvasu na zadanou hodnotu (defaultně 300 px)
function heightOfMyCanvas() {
    let canvas = $('#myCanvas')[0];
    let height = $('#heightOfCanvas')[0];

    if ((isNaN(height.value)) || (height.value <= 0)) {
        canvas.setAttribute('height', canvas.parentElement.getBoundingClientRect()["width"] * 0.9);
        height.value = `Šířka: ${canvas.parentElement.getBoundingClientRect()["width"]}`;
    }

    else {
        canvas.setAttribute('height', height.value);
    }
    redrawAll('');
}

/*
function changeScale(evt) {
    let scaleValue = parseFloat($('#scaleValue')[0].value);
    let scale = scaleValue * evt.deltaY * 0.5;
    let stepValue = Math.min(Math.max(0.125, scale), 4);
    $('#scaleValue')[0].value = stepValue;
    redrawAll('');
}
*/


function canvasGridNew() {      //--- funkce pro správu gridu pomocí inputu ---//
    let canvas = $('#myCanvas')[0];
    let context = canvas.getContext('2d');
    let scaleValue = parseFloat($('#scaleValue')[0].value);
    let gridValue = parseFloat($('#canvasGrid')[0].value);

    // není-li definováno kladné nenulové měřítko, je měřítko rovno 1 (defaultní hodnota)
    if ((isNaN(scaleValue)) || (scaleValue <= 0)) {
        scaleValue = 1;
        $('#scaleValue')[0].value = '';
    }

    let gridPointsX = $('#gridPointsX')[0];
    let gridPointsY = $('#gridPointsY')[0];
    gridPointsX.value = '';
    gridPointsY.value = '';

    // není-li definováno kladné nenulové měřítko, je krok grid mřížky roven 0 (defaultní hodnota)
    if ((isNaN(gridValue)) || (gridValue <= 0)) {
        gridValue = 0;
        $('#gridPointsX')[0].value = '';
        $('#gridPointsY')[0].value = '';
    }

    if (gridValue != 0) {
        for (i = 0; i * gridValue < canvas.width; i++) {
            for (j = 0; j * gridValue * scaleValue < canvas.height; j++) {

                if (gridPointsX.value == '') {
                    gridPointsX.value += i * gridValue * scaleValue;
                    gridPointsY.value += j * gridValue * scaleValue;
                }

                else {
                    gridPointsX.value += ',' + i * gridValue * scaleValue;
                    gridPointsY.value += ',' + j * gridValue * scaleValue;
                }
            }
        }
    }

    redrawAll('');
}


function deleteLastPoint() {
    let holesButton = $('#holesButton')[0];
    let myPointsX = $('#cnv_Xco')[0];     // skrytý input obsahující seznam X souřadnich kliknutých bodů
    let myPointsY = $('#cnv_Yco')[0];     // skrytý input obsahující seznam Y souřadnich kliknutých bodů
    let holesPointsX = $('#cnv_Xho')[0];     // skrytý input obsahující seznam X souřadnich kliknutých bodů
    let holesPointsY = $('#cnv_Yho')[0];     // skrytý input obsahující seznam Y souřadnich kliknutých bodů
    let numberOfPoints = $('#numberOfPoints')[0];

    if ((window.location.href.includes('frame')) || (holesButton.getAttribute('active') != 'yes')) {
        if (myPointsX.value != '') {
            let listOfX = myPointsX.value.split(',');
            let listOfY = myPointsY.value.split(',');
            let newListX = '';
            let newListY = '';
            listOfX.pop();
            listOfY.pop();

            if (listOfX.length != 0) {
                newListX = listOfX[0];
                newListY = listOfY[0];
            }

            for (i = 1; i < listOfX.length; i++) {
                newListX += ',' + listOfX[i];
                newListY += ',' + listOfY[i];
            }

            myPointsX.value = newListX;
            myPointsY.value = newListY;

            if (parseFloat(numberOfPoints.value) > 1) {
                numberOfPoints.value = parseFloat(numberOfPoints.value) - 1;
            }

            else {
                numberOfPoints.value = '';
            }
        }

        else {
            window.location.href.includes('frame') ? alert('Všechny uzly konstrukce už jsou smazány!') : alert('Všechny obrysové body průřezu už jsou smazány!')
        }
    }

    else {
        if (holesPointsX.value != '') {
            let listOfX = holesPointsX.value.split(',');
            let listOfY = holesPointsY.value.split(',');
            let newListX = '';
            let newListY = '';
            listOfX.pop();
            listOfY.pop();

            if (listOfX.length != 0) {
                newListX = listOfX[0];
                newListY = listOfY[0];
            }

            for (i = 1; i < listOfX.length; i++) {
                newListX += ',' + listOfX[i];
                newListY += ',' + listOfY[i];
            }

            holesPointsX.value = newListX;
            holesPointsY.value = newListY;

        }

        else {
            alert('Všechny body otvorů už jsou smazány!')
        }
    }

    if ((!window.location.href.includes('frame')) && (closeButton.getAttribute('clicked') == 'yes')) {
        console.log('Zde by se měl uzavřít obrazec (řádek 590).');
        //closeYourDraw();
    }

    else {
        console.log('Zde by se měly přepsat grid (řádek 595).');
        // canvasGridNew();       //--- překreslí body ---//
    }

    redrawAll('');
}


function deleteYourDraw() {     //--- vymaže nakreslenou geometrii smazáním globálních listů souřadnic---//
    let canvas = $('#myCanvas')[0];
    let context = canvas.getContext('2d');
    let holesButton = $('#holesButton')[0];
    let scaleValue = parseFloat($('#scaleValue')[0].value);

    let myPointsX = $('#cnv_Xco')[0];     // skrytý input obsahující seznam X souřadnich kliknutých bodů
    let myPointsY = $('#cnv_Yco')[0];     // skrytý input obsahující seznam Y souřadnich kliknutých bodů
    let holesPointsX = $('#cnv_Xho')[0];     // skrytý input obsahující seznam X souřadnich kliknutých bodů
    let holesPointsY = $('#cnv_Yho')[0];     // skrytý input obsahující seznam Y souřadnich kliknutých bodů

    if (myPointsX.value != '') {
        myPointsX.value = '';
        myPointsY.value = '';

        if ((!window.location.href.includes('frame')) && (holesPointsX.value != '')) {
            holesPointsX.value = '';
            holesPointsY.value = '';
            holesButton.removeAttribute('active');
        }
    }

    else {
        if ((window.location.href.includes('frame')) || (holesButton.getAttribute('active') != 'yes')) {
            alert('Vše už je smazáno!');
        }
    }

    $('#numberOfPoints')[0].value = '';
    redrawAll('');
}


function closeYourDraw() {      //--- uzavře geometrii propojením posledního a prvního bodu ---//
    let canvas = $('#myCanvas')[0];
    let context = canvas.getContext('2d');
    let myPointsX = $('#cnv_Xco')[0].value.split(',');
    let holesPointsX = $('#cnv_Xho')[0].value.split(',');

    if (myPointsX.length > 2) {
        closeButton.setAttribute('clicked', 'yes');

        if (holesPointsX.length > 2) {
            closeButton.setAttribute('clicked', 'yes');
        }
    }

    else {
        alert('Tato geometrie nejde uzavřít!');
        closeButton.removeAttribute('clicked');
    }

    redrawAll('');
}


// funkce na přepínání mezi body a otvory + aktivaci/deaktivaci holesButtonu
function drawHoles() {
    let myPointsX = $('#cnv_Xco')[0];     // skrytý input obsahující seznam X souřadnich kliknutých bodů
    let holesButton = $('#holesButton')[0];

    if ((myPointsX.value == '') || (myPointsX.length < 3)) {
        alert("Nemůžeš přidat otvory, když nemáš žádnou uzavřenou geometrii!");
        // holesButton.classList.add('btn-light');
        // holesButton.classList.remove('btn-secondary');
    }

    else {
        let activeHoles = ($('#holesButton')[0].getAttribute('active') == 'yes') ? 'no' : 'yes';
        holesButton.setAttribute('active', activeHoles);
        /*
        Pokud jsou otvory neaktivní, button se aktivuje - jeho atribut "active" získá hodnotu "yes".
        Pokud jsou otvory aktivní, button se deaktivuje - jeho atribut "active" získá hodnotu "no".
        */
        redrawAll('');

        if (holesButton.getAttribute('class').includes('btn-light')) {
            holesButton.classList.remove('btn-light');
            holesButton.classList.add('btn-secondary');
        }

        else {
            holesButton.classList.add('btn-light');
            holesButton.classList.remove('btn-secondary');
        }
    }
}


function redrawAll(evt) {
    let canvas = $('#myCanvas')[0];
    let context = canvas.getContext('2d');
    let gridValue = $('#canvasGrid')[0].value;
    let stepValue = $('#canvasAxes')[0].value;
    let scaleValue = parseFloat($('#scaleValue')[0].value);

    // pokud je hodnota jiná než kladné nenulové číslo, platí defaultní hodnota 1
    if ((isNaN(scaleValue)) || (scaleValue <= 0)) {
        scaleValue = 1;
        $('#scaleValue')[0].value = '';
    }

    // pokud je hodnota jiná než kladné nenulové číslo, platí defaultní hodnota 50 mm
    if ((isNaN(stepValue)) || (stepValue <= 0)) {
        stepValue = 50;
        $('#canvasAxes')[0].value = '';
    }

    let newCursorX = $('#newCursorX')[0].value;
    let newCursorY = $('#newCursorY')[0].value;
    let myPointsX = $('#cnv_Xco')[0].value.split(',');
    let myPointsY = $('#cnv_Yco')[0].value.split(',');
    let gridPointsCoordinatesX = $('#gridPointsX')[0].value.split(',');
    let gridPointsCoordinatesY = $('#gridPointsX')[0].value.split(',');

    let canvasElements = {
        'canvas' : canvas,
        'context' : context,
        'gridValue' : gridValue,
        'stepValue' : stepValue,
        'scaleValue' : scaleValue,
        'newCursorX' : newCursorX,
        'newCursorY' : newCursorY,
        'myPointsX' : myPointsX,
        'myPointsY' : myPointsY,
        'gridPointsCoordinatesX' : gridPointsCoordinatesX,
        'gridPointsCoordinatesY' : gridPointsCoordinatesY
    };

    if (($('#cnv_Xho')[0]) || (!window.location.href.includes('frame'))) {
        let holesPointsX = $('#cnv_Xho')[0].value.split(',');
        let holesPointsY = $('#cnv_Yho')[0].value.split(',');
        let closeButton = $('#closeButton')[0];
        let holesButton = $('#holesButton')[0];

        canvasElements['holesPointsX'] = holesPointsX;
        canvasElements['holesPointsY'] = holesPointsY;
        canvasElements['closeButton'] = closeButton;
        canvasElements['holesButton'] = holesButton;

        context.clearRect(0, 0, canvas.width, canvas.height);
        startFakeCursor(evt, canvas, context);
        drawAxes('canvas', canvasElements);
        drawPoints(canvas, context, canvasElements);
        drawShapes(evt, canvasElements);
        drawEdges(canvasElements);
    }

    else {
        let supportX = $('#sup_X')[0];
        let supportY = $('#sup_Y')[0];
        canvasElements['supX'] = supportX;
        canvasElements['supY'] = supportY;

        context.clearRect(0, 0, canvas.width, canvas.height);
        startFakeCursor(evt, canvas, context);
        drawAxes('canvas', canvasElements);

        drawMembers(canvas, context, canvasElements);
        drawFrameShapes(evt, canvasElements);
        saveCanvas();
    }
}


// ------------------------------------------------------------------

// funkce vykreslující osy v závislosti na definovaném kroku (defaultně 50 mm) a měřítku (defaultně 1)
function drawAxes(caller, canvasElements) {
    let canvas = '';
    let context = '';
    let stepValue = '';
    let scaleValue = '';

    if (caller == 'form') {
        canvas = $('#myCanvas')[0];     // canvas a context zde musí být deklarován, protože se funkce volá taky při tvoření formuláře
        context = canvas.getContext('2d');
        scaleValue = parseFloat($('#scaleValue')[0].value);
        stepValue = $('#canvasAxes')[0];

        // pokud je hodnota jiná než kladné nenulové číslo, platí defaultní hodnota 1
        if ((isNaN(scaleValue)) || (scaleValue <= 0)) {
            scaleValue = 1;
            $('#scaleValue')[0].value = '';
        }

        // pokud je hodnota jiná než kladné nenulové číslo, platí defaultní hodnota 50 mm
        if ((isNaN(stepValue)) || (stepValue <= 0)) {
            stepValue = 50;
            $('#canvasAxes')[0].value = '';
        }
    }

    else {
        canvas = canvasElements['canvas'];
        context = canvasElements['context'];
        scaleValue = canvasElements['scaleValue'];
        stepValue = canvasElements['stepValue'];
    }

    // krok vykreslení podle měřítka
    let step = stepValue * scaleValue;

    // kreslení svislých os
    for (i = 0; i < canvas.width; i+=parseFloat(step)) {
        context.lineWidth = 0.5;
        context.beginPath();
        context.moveTo(i, canvas.height);     // počátek kreslení osy X
        context.lineTo(i, 0);                 // konec kreslení osy
        context.closePath();
        context.strokeStyle = '#808080';       // styl čáry osy
        context.stroke();
        context.font = '10px Arial';          // font popisků os
        context.fillStyle = '#0abab5';
        context.fillText(i / scaleValue, i, 10);    // popisek hodnoty osy
    }

    for (j = 0; j < canvas.height; j+=parseFloat(step)) {
        context.lineWidth = 0.5;
        context.beginPath();
        context.moveTo(canvas.width, j);     // počátek kreslení osy Y
        context.lineTo(0, j);                // konec kreslení osy
        context.closePath();
        context.strokeStyle = '#808080';      // styl čáry osy
        context.stroke();
        context.font = '10px Arial';         // font popisků os
        context.fillStyle = '#0abab5';
        context.fillText(j / scaleValue, 0, j);    // popisek hodnoty osy
    }
}


function drawPoints(canvas, context, canvasElements) {
    let scaleValue = canvasElements['scaleValue'];

    // vykreslí již existující body
    if ($('#cnv_Xco')[0].value != '') {
        for (i = 0; i < canvasElements['myPointsX'].length; i++) {
            context.beginPath();
            context.arc(canvasElements['myPointsX'][i] * scaleValue, canvasElements['myPointsY'][i] * scaleValue, 5, 0, 2 * Math.PI);
            context.closePath();
            context.stroke();
        }
    }

    if (!window.location.href.includes('frame')) {
        // vykreslí již existující body otvorů
        if ($('#cnv_Xho')[0].value != '') {
            for (i = 0; i < canvasElements['holesPointsX'].length; i++) {
                context.beginPath();
                context.arc(canvasElements['holesPointsX'][i] * scaleValue, canvasElements['holesPointsY'][i] * scaleValue, 5, 0, 2 * Math.PI);
                context.closePath();
                context.stroke();
            }
        }
    }

    // není-li definováno kladné nenulové měřítko, je krok grid mřížky roven 0 (defaultní hodnota)
    if ((isNaN(canvasElements['gridValue'])) || (canvasElements['gridValue'] <= 0)) {
        canvasElements['gridValue'] = 0;
        $('#gridPointsX')[0].value = '';
        $('#gridPointsY')[0].value = '';
    }

    if (canvasElements['gridValue'] != 0) {
        for (i = 0; i * canvasElements['gridValue'] * scaleValue < canvas.width; i++) {
            for (j = 0; j * canvasElements['gridValue'] * scaleValue < canvas.height; j++) {

                context.beginPath();
                context.arc(i * canvasElements['gridValue'] * scaleValue, j * canvasElements['gridValue'] * scaleValue, 1, 0, 2 * Math.PI);
                context.closePath();
                context.strokeStyle = '#0abab5'
                context.stroke();
            }
        }
    }
}

// tažení linie z posledního bodu za kurzorem
function drawShapes(evt, canvasElements) {
    let canvas = canvasElements['canvas'];
    let context = canvasElements['context'];
    let scaleValue = canvasElements['scaleValue'];

    if ((closeButton.getAttribute('clicked') != 'yes') && (holesButton.getAttribute('active') != 'yes')) {     //--- přestane kreslit při kkliknutí na "Uzavři průřez" ---//
        if ($('#cnv_Xco')[0].value != '') {
            context.lineWidth = 2;
            context.moveTo(canvasElements['myPointsX'].slice(-1)[0] * scaleValue, canvasElements['myPointsY'].slice(-1)[0] * scaleValue);   //--- kreslí linii sledující pohyb kurzoru ---//
            context.lineTo(canvasElements['newCursorX'] * scaleValue, canvasElements['newCursorY'] * scaleValue);
            context.strokeStyle = '#0abab5';
            context.stroke();
        }
    }

    else if ((closeButton.getAttribute('clicked') != 'yes') && (holesButton.getAttribute('active') == 'yes')) {
        if ($('#cnv_Xho')[0].value != '') {
            context.lineWidth = 2;
            context.moveTo(canvasElements['holesPointsX'].slice(-1)[0] * scaleValue, canvasElements['holesPointsY'].slice(-1)[0] * scaleValue);
            context.lineTo(canvasElements['newCursorX'] * scaleValue, canvasElements['newCursorY'] * scaleValue);   //--- dokreslí poslední linii ---//
            context.strokeStyle = '#0abab5';
            context.stroke();
        }
    }

    else {      //--- uzavře průřez ---//
        console.log('Zde by se měl uzavřít obrazec (řádek 148).');
        //closeYourDraw();
    }
}


function drawEdges(canvasElements) {      //--- vykreslí všechny spojnice bodů ---//
    let canvas = canvasElements['canvas'];
    let context = canvasElements['context'];

    // není-li definováno kladné nenulové měřítko, je rovno 1 (defaultní hodnota)
    if ((isNaN(canvasElements['scaleValue'])) || (canvasElements['scaleValue'] <= 0)) {
        canvasElements['scaleValue'] = 1;
        $('#scaleValue')[0].value = '';
    }

    if ($('#cnv_Xco')[0].value != '') {
        for (i = 1; i < canvasElements['myPointsX'].length; i++) {
            context.lineWidth = 2;
            context.beginPath();
            context.moveTo(canvasElements['myPointsX'][i] * canvasElements['scaleValue'], canvasElements['myPointsY'][i] * canvasElements['scaleValue']);     //--vykreslí hrany kromě spojnice posledního a prvního bodu ---//
            context.lineTo(canvasElements['myPointsX'][i - 1] * canvasElements['scaleValue'], canvasElements['myPointsY'][i - 1] * canvasElements['scaleValue']);
            context.strokeStyle = '#FFFFF';
            context.stroke();
        }

        if (($('#closeButton')[0].getAttribute('clicked') == "yes") || ($('#holesButton')[0].getAttribute('active') == "yes")) {
            context.lineWidth = 2;
            context.beginPath();
            context.moveTo(canvasElements['myPointsX'].slice(-1)[0] * canvasElements['scaleValue'], canvasElements['myPointsY'].slice(-1)[0] * canvasElements['scaleValue']);     //--vykreslí hrany kromě spojnice posledního a prvního bodu ---//
            context.lineTo(canvasElements['myPointsX'][0] * canvasElements['scaleValue'], canvasElements['myPointsY'][0] * canvasElements['scaleValue']);
            context.strokeStyle = '#FFFFF';
            context.stroke();
        }
    }

    if ($('#cnv_Xho')[0].value != '') {
        for (i = 1; i < canvasElements['holesPointsX'].length; i++) {
            context.lineWidth = 2;
            context.beginPath();
            context.moveTo(canvasElements['holesPointsX'][i] * canvasElements['scaleValue'], canvasElements['holesPointsY'][i] * canvasElements['scaleValue']);     //--vykreslí hrany kromě spojnice posledního a prvního bodu ---//
            context.lineTo(canvasElements['holesPointsX'][i - 1] * canvasElements['scaleValue'], canvasElements['holesPointsY'][i - 1] * canvasElements['scaleValue']);
            context.strokeStyle = '#FFFFF';
            context.stroke();
        }

        if ($('#closeButton')[0].getAttribute('clicked') == "yes") {
            context.lineWidth = 2;
            context.beginPath();
            context.moveTo(canvasElements['myPointsX'].slice(-1)[0] * canvasElements['scaleValue'], canvasElements['myPointsY'].slice(-1)[0] * canvasElements['scaleValue']);     //--vykreslí hrany kromě spojnice posledního a prvního bodu ---//
            context.lineTo(canvasElements['myPointsX'][0] * canvasElements['scaleValue'], canvasElements['myPointsY'][0] * canvasElements['scaleValue']);
            context.strokeStyle = '#FFFFF';
            context.stroke();

            context.lineWidth = 2;
            context.beginPath();
            context.moveTo(canvasElements['holesPointsX'].slice(-1)[0] * canvasElements['scaleValue'], canvasElements['holesPointsY'].slice(-1)[0] * canvasElements['scaleValue']);     //--vykreslí hrany kromě spojnice posledního a prvního bodu ---//
            context.lineTo(canvasElements['holesPointsX'][0] * canvasElements['scaleValue'], canvasElements['holesPointsY'][0] * canvasElements['scaleValue']);
            context.strokeStyle = '#FFFFF';
            context.stroke();
        }

        if ($('#holesButton')[0].getAttribute('active') == "yes") {
            context.lineWidth = 2;
            context.beginPath();
            context.moveTo(canvasElements['myPointsX'].slice(-1)[0] * canvasElements['scaleValue'], canvasElements['myPointsY'].slice(-1)[0] * canvasElements['scaleValue']);     //--vykreslí hrany kromě spojnice posledního a prvního bodu ---//
            context.lineTo(canvasElements['myPointsX'][0] * canvasElements['scaleValue'], canvasElements['myPointsY'][0] * canvasElements['scaleValue']);
            context.strokeStyle = '#FFFFF';
            context.stroke();
        }
    }
}

// ------------------------------------------------------------------

// funkce zaznamenávající kliknutý bod - jednak přidá jeho souřadnice do skrytých inputů, jednak jej zaznačí graficky
function getPointCoordinates(evt) {
    let canvas = $('#myCanvas')[0];
    let context = canvas.getContext('2d');
    let holesButton = $('#holesButton')[0];
    let scaleValue = parseFloat($('#scaleValue')[0].value);

    // není-li definováno kladné nenulové měřítko, je rovno 1 (defaultní hodnota)
    if ((isNaN(scaleValue)) || (scaleValue <= 0)) {
        scaleValue = 1;
        $('#scaleValue')[0].value = '';
    }

    let myPointsX = $('#cnv_Xco')[0];     // skrytý input obsahující seznam X souřadnich kliknutých bodů
    let myPointsY = $('#cnv_Yco')[0];     // skrytý input obsahující seznam Y souřadnich kliknutých bodů
    let holesPointsX = $('#cnv_Xho')[0];     // skrytý input obsahující seznam X souřadnich kliknutých bodů
    let holesPointsY = $('#cnv_Yho')[0];     // skrytý input obsahující seznam Y souřadnich kliknutých bodů
    let coordinateX = $('#newCursorX')[0].value;    // souřadnice X kurzoru
    let coordinateY = $('#newCursorY')[0].value;    // souřadnice Y kurzoru

    // pokud není aktivní holesButton (tzn. pokud se právě nekreslí otvory), přidávají se souřadnice do inputů pro body
    if ((window.location.href.includes('frame')) || (holesButton.getAttribute('active') != 'yes')) {
        setTimeout(function e() {
            if (($('#cnv_Xho')[0]) || (!window.location.href.includes('frame'))) {
                if (myPointsX.value == '') {    // pokud je input prázdný, jeho hodnotou se stanou nové souřadnice
                    myPointsX.value = coordinateX;
                    myPointsY.value = coordinateY;
                }

                else {  // pokud input obsahuje nějaké body, nové souřadnice se přípíšou k jeho hodnotě
                    myPointsX.value += ',' + coordinateX;
                    myPointsY.value += ',' + coordinateY;
                }
            }

            else {
                if ($('#nod_X')[0].value == '') {    // pokud je input prázdný, jeho hodnotou se stanou nové souřadnice
                    $('#nod_X')[0].value = coordinateX;
                    $('#nod_Y')[0].value = coordinateY;
                }

                else {  // pokud input obsahuje nějaké body, nové souřadnice se přípíšou k jeho hodnotě
                    $('#nod_X')[0].value += ',' + coordinateX;
                    $('#nod_Y')[0].value += ',' + coordinateY;
                }

                findUniqueNodes();
            }

            $('#numberOfPoints')[0].value = myPointsX.value.split(',').length;
            // input hlídající počet bodů průřezu - je validní jen pokud jsou zvoleny alespoň 3 body (otvory se nepočítají)

        }, 50);
    }

    else {
        setTimeout(function e() {
            if (holesPointsX.value == '') {
                holesPointsX.value = coordinateX;
                holesPointsY.value = coordinateY;
            }

            else {  // pokud input obsahuje nějaké body, nové souřadnice se připíšou k jeho hodnotě
                holesPointsX.value += ',' + coordinateX;
                holesPointsY.value += ',' + coordinateY;
            }
        }, 50);
    }

    //vykreslí aktuální kliknutý bod
    context.beginPath();
    context.arc(coordinateX * scaleValue, coordinateY * scaleValue, 2.5, 0, 2 * Math.PI);
    context.closePath();
    context.stroke();

    if ((!window.location.href.includes('frame')) && ($('#closeButton')[0].getAttribute('clicked') == 'yes')) {
        $('#closeButton')[0].removeAttribute('clicked');
    }
}


function startFakeCursor(evt, canvas, context) {        //---při vjetí do canvasu skryje skutečný kurzor a vytvoří fiktivní ---//
    canvas.style.cursor = 'none';
    rect = canvas.getBoundingClientRect();
    let newCursor = new Image(15, 20);
    newCursor.src = './static/pictures/png/website/new_cursor.png';
    moveFakeCursor(evt);
    context.drawImage(newCursor, newCursorX, newCursorY, 15, 20);
}


function moveFakeCursor(evt) {  // pohybuje fiktivním kurzorem//
    let scaleValue = $('#scaleValue')[0].value;

    // není-li definováno kladné nenulové měřítko, je měřítko rovno 1 (defaultní hodnota)
    if ((isNaN(scaleValue)) || (scaleValue <= 0)) {
        scaleValue = 1;
        $('#scaleValue')[0].value = '';
    }

    let actualCursorX = evt.clientX - rect.left;
    let actualCursorY = evt.clientY - rect.top;
    let gridValue = parseFloat($('#canvasGrid')[0].value);
    let gridPointsX = $('#gridPointsX')[0].value.split(',');
    let gridPointsY = $('#gridPointsY')[0].value.split(',');

    // není-li definováno kladné nenulové měřítko, je krok grid mřížky roven 0 (defaultní hodnota)
    if ((isNaN(gridValue)) || (gridValue <= 0)) {
        gridValue = 50;
        $('#gridPointsX')[0].value = '';
        $('#gridPointsY')[0].value = '';
    }

    /*Pokud se skutečný cursor přiblíží dostatečně blízko bodu grid sítě, fixne se fiktivní kurzor na něj.
    Toto platí, dokud se skutečný kurzor zase dostatečně nevzdálí od grid bodu - tehdy se fiktivní kurzor
    opět pohybuje s jeho souřadnicemi.*/


    if ($('#gridPointsX')[0].value != '') {
        for (i = 0; i < gridPointsX.length; i++) {
            if (Math.sqrt(Math.pow(gridPointsX[i] - actualCursorX, 2) + Math.pow(gridPointsY[i] - actualCursorY, 2)) * scaleValue < (gridValue * 0.3 * scaleValue)) {
                newCursorX = gridPointsX[i];
                newCursorY = gridPointsY[i];
                break;
            }

            else {
                newCursorX = actualCursorX;
                newCursorY = actualCursorY;
            }
        }
    }

    else {
    newCursorX = actualCursorX;
    newCursorY = actualCursorY;
    }

    $('#actualCursorX')[0].value = actualCursorX / scaleValue;
    $('#actualCursorY')[0].value = actualCursorY / scaleValue;
    $('#newCursorX')[0].value = newCursorX / scaleValue;
    $('#newCursorY')[0].value = newCursorY / scaleValue;
}

// ------------------------------------------------------------------








