// --- MODUL PRO PRÁCI S CANVAS ELEMENTEM PRO ZADÁVÁNÍ GEMOETRIE KONSTRUKCE--- //
window.addEventListener("resize", updateCanvas);

// funkce měnící šířku canvasu na zadanou hodnotu (defaultně 300 px)
function updateCanvas() {
    if (window.location.href.includes('frame')) {
        try {
            let canvas = $('#myCanvas')[0];
            let context = canvas.getContext('2d');
            let gridValue = $('#canvasGrid')[0].value;
            let stepValue = $('#canvasAxes')[0].value;
            let scaleValue = parseFloat($('#scaleValue')[0].value);

            canvas.width = canvas.parentElement.getBoundingClientRect()["width"]* 0.85;
            // canvas.height = canvas.parentElement.getBoundingClientRect()["width"]* 0.85;

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


            let canvasElements = {
                'canvas': canvas,
                'context': context,
                'scaleValue': scaleValue,
                'stepValue': stepValue
            };

            drawAxes('window', canvasElements);
        }

        catch {
            return false
        }
    }
}


function getNodesOfMembers() {
    let canvas = $('#myCanvas')[0];
    let context = canvas.getContext('2d');
    let scaleValue = parseFloat($('#scaleValue')[0].value);
    let drawDetector = $('#draw_detector')[0];
    let drawState = drawDetector.value;
    let coordinateX = $('#nod_X')[0].value.split(',').slice(-1)[0];
    let coordinateY = $('#nod_Y')[0].value.split(',').slice(-1)[0];

    // není-li definováno kladné nenulové měřítko, je rovno 1 (defaultní hodnota)
    if ((isNaN(scaleValue)) || (scaleValue <= 0)) {
        scaleValue = 1;
        $('#scaleValue')[0].value = '';
    }

    let myPointsX = $('#nod_X')[0];     // skrytý input obsahující seznam X souřadnich kliknutých bodů

    $('#numberOfPoints')[0].value = myPointsX.value.split(',').length;
    // input hlídající počet bodů průřezu - je validní jen pokud jsou zvoleny alespoň 3 body (otvory se nepočítají)

    //vykreslí aktuální kliknutý bod
    context.beginPath();
    context.arc(coordinateX * scaleValue, coordinateY * scaleValue, 5, 0, 2 * Math.PI);
    context.closePath();
    context.stroke();

    $('#draw_detector')[0].value == 'watch' ? $('#draw_detector')[0].value = 'draw' : $('#draw_detector')[0].value = 'watch';
    checkFormInputs(event);
}


function findUniqueNodes() {
    let listOfNodesX = $('#nod_X')[0].value.split(';').join(',').split(',');
    let listOfNodesY = $('#nod_Y')[0].value.split(';').join(',').split(',');
    let listOfNodes = [];
    let pointsToDrawX = $('#cnv_Xco')[0];
    let pointsToDrawY = $('#cnv_Yco')[0];

    for (i = 0; i < listOfNodesX.length; i++) {
        listOfNodes.push(`[${listOfNodesX[i]}, ${listOfNodesY[i]}]`);
    }

    let nodeSet = Array.from(new Set(listOfNodes));
    let uniqueNodes = [];
    nodeSet.forEach(node => uniqueNodes.push(eval(node)));

    let pointsStringX = '';
    let pointsStringY = '';
    let node = '';

    for (j = 0; j < uniqueNodes.length; j++) {
        node = uniqueNodes[j];
        pointsStringX += node[0] + ',';
        pointsStringY += node[1] + ',';
    }

    pointsToDrawX.value = pointsStringX.slice(0, -1);
    pointsToDrawY.value = pointsStringY.slice(0, -1);
}


function drawMembers(canvas, context, canvasElements) {
    let scaleValue = canvasElements['scaleValue'];
    let myPointsX = $('#cnv_Xco')[0].value.split(',');
    let myPointsY = $('#cnv_Yco')[0].value.split(',');

    let saveCanvas = 0;

    try {
        saveCanvas = canvasElements['saveCanvas'];
    }

    catch {
        saveCanvas = 0;
    }

    // vykreslí již existující body
    if (myPointsX != '') {
        for (i = 0; i < myPointsX.length; i++) {
            context.beginPath();
            context.arc(myPointsX[i] * scaleValue, myPointsY[i] * scaleValue, 2, 0, 2 * Math.PI);
            context.closePath();
            //context.strokeStyle = '#808080';
            context.strokeStyle = 'yellow';
            context.stroke();

            if (canvasElements['saveCanvas'] == 'supports') {
                context.font = '15px Arial';          // font popisků os
                context.fillStyle = '#FFFFFF';
                context.fillText(i + 1, (parseFloat(myPointsX[i]) + 10) * scaleValue, (parseFloat(myPointsY[i]) + 10) * scaleValue);    // popisek hodnoty osy
            }
        }

        if (saveCanvas != 0) {
            if (canvasElements['saveCanvas'] == 'members') {
                let nodesX = $('#nod_X')[0].value.split(',');
                let nodesY = $('#nod_Y')[0].value.split(',');
                let members = [];

                if (nodesX.length % 2 == 1) {
                    for (let m = 1; m < nodesX.length - 1; m += 2) {
                        members.push([[nodesX[m - 1], nodesY[m - 1]], [nodesX[m], nodesY[m]]])
                    }
                }

                else {
                    for (let m = 1; m < nodesX.length; m += 2) {
                        members.push([[nodesX[m - 1], nodesY[m - 1]], [nodesX[m], nodesY[m]]])
                    }
                }

                for (let n = 0; n < members.length; n++) {
                    context.font = '15px Arial';          // font popisků os
                    context.fillStyle = '#FFFFFF';
                    context.fillText(n + 1, ((parseFloat(members[n][0][0]) + parseFloat(members[n][1][0])) / 2 + 10) * scaleValue, ((parseFloat(members[n][0][1]) + parseFloat(members[n][1][1])) / 2 + 10) * scaleValue);    // popisek hodnoty osy
                }
            }
        }
    }

    if (saveCanvas == 0) {
        if (canvasElements['gridValue'] != 'no') {
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
                        context.strokeStyle = '#FFFFFF'
                        context.stroke();
                    }
                }
            }
        }
    }

    let nodesX = $('#nod_X')[0].value.split(',');
    let nodesY = $('#nod_Y')[0].value.split(',');
    let members = [];

    // sudý počet uzlů
    if (nodesX.length % 2 == 0) {
        for (let i = 0; i < nodesX.length; i++) {
            members.push([nodesX[i], nodesY[i]]);
        }
    }

    // lichý počet uzlů
    else if (nodesX.length % 2 == 1) {
        for (let i = 0; i < nodesX.length - 1; i++) {
            members.push([nodesX[i], nodesY[i]]);
        }
    }

    for (k = 0; k < members.length; k += 2) {
        context.lineWidth = 2;
        context.beginPath();
        context.moveTo(members[k][0] * canvasElements['scaleValue'], members[k][1] * canvasElements['scaleValue']);     //--vykreslí hrany kromě spojnice posledního a prvního bodu ---//
        context.lineTo(members[k + 1][0] * canvasElements['scaleValue'], members[k + 1][1] * canvasElements['scaleValue']);
        context.strokeStyle = '#FFFFF';
        context.stroke();
    }
}


// tažení linie z posledního bodu za kurzorem
function drawFrameShapes(evt, canvasElements) {
    let canvas = $('#myCanvas')[0];
    let context = canvas.getContext('2d');
    let scaleValue = canvasElements['scaleValue'];
    let myPointsX = $('#nod_X')[0].value.split(',');
    let myPointsY = $('#nod_Y')[0].value.split(',');

    if ($('#draw_detector')[0].value == 'draw') {
        if ($('#nod_X')[0].value != '') {
            context.moveTo(parseFloat(myPointsX.slice(-1)[0]) * scaleValue, parseFloat(myPointsY.slice(-1)[0]) * scaleValue);   //--- kreslí linii sledující pohyb kurzoru ---//
            context.lineTo(parseFloat($('#newCursorX')[0].value) * scaleValue, parseFloat($('#newCursorY')[0].value) * scaleValue);
            context.strokeStyle = 'yellow';
            // context.strokeStyle = '#FFFFFF';
            context.lineWidth = 2;
            context.stroke();
        }
    }
}


function deleteLastPointOfFrame() {
    let myPointsX = $('#cnv_Xco')[0];     // skrytý input obsahující seznam X souřadnich kliknutých bodů
    let myPointsY = $('#cnv_Yco')[0];     // skrytý input obsahující seznam Y souřadnich kliknutých bodů
    let numberOfPoints = $('#numberOfPoints')[0];

    if (numberOfPoints.value != '') {
        let listOfX = myPointsX.value.split(',');
        let listOfY = myPointsY.value.split(',');

        $('#draw_detector')[0].value == 'draw' ? $('#draw_detector')[0].value = 'watch' : $('#draw_detector')[0].value = 'draw';

        listOfX.pop();
        listOfY.pop();
        let newListX = [];
        let newListY = [];

        if (listOfX.length != 0) {
            listOfX.forEach(node => newListX.push(node));
            listOfY.forEach(node => newListY.push(node));

            newListX = newListX.join(',');
            newListY = newListY.join(',');
        }

        else {
            newListX = '';
            newListY = '';
        }

        $('#nod_X')[0].value = newListX;
        $('#nod_Y')[0].value = newListY;
        findUniqueNodes();

        if (parseFloat(numberOfPoints.value) > 1) {
            numberOfPoints.value = parseFloat(numberOfPoints.value) - 1;
        }

        else {
            numberOfPoints.value = '';
        }
    }

    else {
        alert('Všechny body už jsou smazány!');
    }

    redrawAll('');

    // promazání inputů kurzorů
    $('#actualCursorX')[0].value = '';
    $('#actualCursorY')[0].value = '';
    $('#newCursorX')[0].value = '';
    $('#newCursorY')[0].value = '';

    checkFormInputs(event);
}


function deleteYourFrameDraw() {    //--- vymaže nakreslenou geometrii smazáním globálních listů souřadnic---//
    let canvas = $('#myCanvas')[0];
    let context = canvas.getContext('2d');
    let holesButton = $('#holesButton')[0];
    let scaleValue = parseFloat($('#scaleValue')[0].value);

    if ($('#nod_X')[0].value != '') {
        $('#cnv_Xco')[0].value = '';
        $('#cnv_Yco')[0].value = '';
        $('#nod_X')[0].value = '';
        $('#nod_Y')[0].value = '';
    }

    else {
        alert('Vše už je smazáno!');
    }

    $('#numberOfPoints')[0].value = '';
    $('#draw_detector')[0].value = 'watch';

    redrawAll('');
    checkFormInputs(event);
}


function saveCanvas() {
    let canvas = $('#myCanvas')[0].cloneNode(true);
    canvas.setAttribute('style', 'border: 1px solid rgb(0, 0, 0); cursor: none;');
    let context = canvas.getContext('2d');
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

    let canvasElements = {
        'scaleValue': scaleValue,
        'gridValue': stepValue,
        'saveCanvas': 'supports'
    };

    context.clearRect(0, 0, canvas.width, canvas.height);
    drawMembers(canvas, context, canvasElements);
    let canvasImage = canvas.toDataURL("image/png").replace("image/png", "image/octet-stream");
    $('#structure_geometry_supports')[0].value = canvasImage;

    canvasElements['saveCanvas'] = 'members';
    context.clearRect(0, 0, canvas.width, canvas.height);
    drawMembers(canvas, context, canvasElements);
    canvasImage = canvas.toDataURL("image/png").replace("image/png", "image/octet-stream");
    $('#structure_geometry_members')[0].value = canvasImage;
}

// ------------------------------------------------
// funkce pro ukládání dat konstrukce vytvořených v dialozích

function addNewSupportRow() {
    let columns = [['col-1', 'my-2'], ['col-4', 'col-md-2', 'my-2'], ['col-2', 'my-2'], ['col-2', 'my-2'], ['col-2', 'my-2'], ['col-2', 'my-2'], ['col-1', 'my-2']];
    let divNames = ['identifier', 'element', 'conditions', 'stiffness', 'nodes', 'member_nodes', 'close']
    let elements = [];

    let part = $('#supportsPart')[0].children.length;   // row ID
    let identifier = createNewInput('text', '', 'identifier', '', '', '', '', part, 'rounded', false, '');
    identifier.setAttribute('disabled', 'true');
    identifier.setAttribute('style', 'width: 50%; display: block;');
    elements.push(identifier);  // ID řádku

    let elementSelectValues = ['input_name', 'support', 'joint'];
    let elementSelectOptionsLabels = ['--Prvek--', 'Podpora', 'Přípoj'];
    elements.push(addSelectWithOptions('element_val_option', elementSelectValues, elementSelectOptionsLabels));     // select element

    let tableRow= createNewDiv(['row', 'justify-content-between', 'align-items-center', 'my-2'], true, $('#supportsPart')[0]);
    tableRow.setAttribute('id', `supportRow_${part}`);

    for (k = 0; k < columns.length; k++) {
        let tableRowColumn = createNewDiv(columns[k], true, tableRow);

        if (k == 1) {
            tableRowColumn.setAttribute('style', 'margin-left: -1.5rem; margin-right: -1.5rem;');
        }

        tableRowColumn.setAttribute('name', divNames[k]);
        let tableRowColumnDiv = createNewDiv(['row', 'align-items-center', 'justify-content-center', 'my-2'], true, tableRowColumn);

        try {
            tableRowColumnDiv.appendChild(elements[k]);

            if (k == 2) {
                tableRowColumnDiv.appendChild(createNewInput('hidden', '', '', '', '', '', '', '', 'rounded', false, ''));
            }
        }

        catch {
            continue;
        }
    }

    let closeButton = document.createElement('button');
    closeButton.setAttribute('type', 'button');
    closeButton.setAttribute('class', 'close supportRowClose');
    closeButton.setAttribute('onclick', 'deleteCurrentRow(this); getSupportsData();');

    let spanX = document.createElement('span');
    spanX.innerText = 'x';
    closeButton.appendChild(spanX);
    $(`#supportRow_${part} [name*="close"]`)[0].children[0].appendChild(closeButton);
}


function addSelectWithOptions(name, values, options) {
    let element = document.createElement('select');
    element.setAttribute('name', name);

    for (j = 0; j < values.length; j++) {
        let option = document.createElement('option');
        option.setAttribute('value', values[j]);
        option.innerText = options[j];
        element.appendChild(option);
    }

    if ((!/start|end/.test(values[0])) && (!name.includes('material'))) {
        element.setAttribute('onchange', 'openNextSupportInput(this);');
    }

    return element
}


function openNextSupportInput(this_input) {
    let elements = [];
    let columns = [];
    let rowId = this_input.parentElement.parentElement.parentElement.id;

    if (rowId.includes('support')) {
        $(`#${rowId} [name*="member_nodes"]`)[0].children[0].innerHTML = '';
        $(`#${rowId} [name*="stiffness"]`)[0].children[0].innerHTML = '';

        // ---------- přípoj/podpora, přidá se inpout s typem -----------------------------//
        if (((this_input.name == 'element_val_option') || (this_input.name == 'support_val_option')) && ($(`#${rowId} [name="element_val_option"]`)[0].value != 'joint')) {
            $(`#${rowId} [name*="nodes"]`)[0].children[0].innerHTML = '';

            if (this_input.value != 'input_name') {
                let assignedElementsInput = createNewInput('text', '', '', '', '', '', '', '', 'rounded', false, '');
                assignedElementsInput.setAttribute('placeholder', 'Uzly');
                $(`#${rowId} [name*="nodes"]`)[0].children[0].appendChild(assignedElementsInput);
            }

            if (this_input.name == 'element_val_option') {
                $(`#${rowId} [name*="conditions"]`)[0].children[0].innerHTML = '';

                if (this_input.value == 'support') {
                    let supportSelectValues = ['support_type', 'hinged', 'roll_x', 'roll_y', 'fixed', 'spring_x', 'spring_y', 'spring_rot'];
                    let supportSelectOptionsLabels = ['--Podepření--', 'Pevný kloub', 'Kloub (posun v X)', 'Kloub (posun v Y)', 'Vetknutí', 'Pružná v X', 'Pružná v Y', 'Rotačně pružná'];
                    $(`#${rowId} [name*="conditions"]`)[0].children[0].appendChild(addSelectWithOptions('support_val_option', supportSelectValues, supportSelectOptionsLabels));
                }
            }

            else if (/spring_x|spring_y|spring_rot/.test(this_input.value)) {
                let supportStiffnessInput = createNewInput('text', '', '', '', '', '', '', '', 'rounded', false, '');
                supportStiffnessInput.setAttribute('placeholder', 'Zadej tuhost');
                $(`#${rowId} [name*="stiffness"]`)[0].children[0].appendChild(supportStiffnessInput);
            }

            else {
                return false;
            }
        }

        else if ((this_input.name == 'element_val_option') || (this_input.name == 'joint_val_option')) {
            $(`#${rowId} [name*="nodes"]`)[0].children[0].innerHTML = '';

            if (this_input.value != 'input_name') {
                let assignedElementsInput = createNewInput('text', '', '', '', '', '', '', '', 'rounded', false, '');
                assignedElementsInput.setAttribute('placeholder', 'Pruty');
                $(`#${rowId} [name*="nodes"]`)[0].children[0].appendChild(assignedElementsInput);

                let springNodeSelectValues = ['start', 'end'];
                let springNodeSelectOptionsLabels = ['Na začátku', 'Na konci'];
                $(`#${rowId} [name*="member_nodes"]`)[0].children[0].appendChild(addSelectWithOptions('member_node_val_option', springNodeSelectValues, springNodeSelectOptionsLabels));
            }

            if (this_input.name == 'element_val_option') {
                $(`#${rowId} [name*="conditions"]`)[0].children[0].innerHTML = '';

                if (this_input.value == 'joint') {
                    let jointSelectValues = ['joint_type', 'fixed', 'hinged', 'stiffness'];
                    let jointSelectOptionsLabels = ['--Spoj--', 'Tuhý', 'Kloubový', 'Polotuhý'];
                    $(`#${rowId} [name*="conditions"]`)[0].children[0].appendChild(addSelectWithOptions('joint_val_option', jointSelectValues, jointSelectOptionsLabels));
                }
            }

            else if (this_input.value == 'stiffness') {
                let supportStiffnessInput = createNewInput('text', '', '', '', '', '', '', '', 'rounded', false, '');
                supportStiffnessInput.setAttribute('placeholder', 'Zadej tuhost');
                $(`#${rowId} [name*="stiffness"]`)[0].children[0].appendChild(supportStiffnessInput);
            }

            else {
                return false;
            }

        }
    }

    else if ((rowId.includes('member')) && (!rowId.includes('Loads'))) {
        $(`#${rowId} [name*="sectionButton"]`)[0].children[0].innerHTML = '';
        $(`#${rowId} [name*="crossSection"]`)[0].children[0].innerHTML = '';

        let buttonAction = (this_input.value == 'create') ? 'refreshBigIcons();' : 'getSavedSections();';
        let dataTarget = (this_input.value == 'create') ? '#sectionCreator' : '#sectionManager';
        let buttonName = (this_input.value == 'create') ? 'Vytvořit průřez' : 'Načíst průřez';

        if (!/create|load/.test(this_input.value)) {
            return false;
        }

        let sectionButton = createNewButton('', `section_${this_input.value}`, 'createCrossSection(this); ' + buttonAction, buttonName, false, '');
        sectionButton.setAttribute('class', 'btn btn-secondary rounded');
        sectionButton.setAttribute('data-toggle', 'modal');
        sectionButton.setAttribute('data-target', dataTarget);
        $(`#${rowId} [name*="sectionButton"]`)[0].children[0].appendChild(sectionButton);
    }

    else if (rowId.includes('nodalLoads')) {
        $(`#${rowId} [name*="magnitude"]`)[0].children[0].innerHTML = '';
        $(`#${rowId} [name*="forceRotation"]`)[0].children[0].innerHTML = '';
        $(`#${rowId} [name*="forceX"]`)[0].children[0].innerHTML = '';
        $(`#${rowId} [name*="forceY"]`)[0].children[0].innerHTML = '';

        if (this_input.value == 'force_components') {
            let forceComponentX = createNewInput('text', '', '', '', '', '', '', '', 'rounded', false, '');
            forceComponentX.setAttribute('placeholder', 'X');
            $(`#${rowId} [name*="forceX"]`)[0].children[0].appendChild(forceComponentX);

            let forceComponentY = createNewInput('text', '', '', '', '', '', '', '', 'rounded', false, '');
            forceComponentY.setAttribute('placeholder', 'Y');
            $(`#${rowId} [name*="forceY"]`)[0].children[0].appendChild(forceComponentY);
        }

        else if ((this_input.value == 'force') || (this_input.value == 'moment')) {
            let magnitude = createNewInput('text', '', '', '', '', '', '', '', 'rounded', false, '');
            magnitude.setAttribute('placeholder', 'Intenzita');
            $(`#${rowId} [name*="magnitude"]`)[0].children[0].appendChild(magnitude);

            if (this_input.value == 'force') {
                let forceRotation = createNewInput('text', '', '', '', '', '', '', '', 'rounded', false, '');
                forceRotation.setAttribute('placeholder', 'Pootočení');
                $(`#${rowId} [name*="forceRotation"]`)[0].children[0].appendChild(forceRotation);
            }
        }

        else {
            return false;
        }
    }
}


function deleteCurrentRow(closeButton) {
    let thisRow = closeButton.parentElement.parentElement.parentElement;
    thisRow.parentElement.removeChild(thisRow);

    let identifiers = $(`div[id*=${thisRow.id.split('_')[0].replace('Row', '')}] input[name*="identifier"]`);

    for (m = 0; m < identifiers.length; m++) {
        if (!closeButton.parentElement.parentElement.parentElement.getAttribute('id').includes('combinationCasesRow_')) {
            identifiers[m].setAttribute('value', m + 1);
        }

        let rowId = identifiers[m].parentElement.parentElement.getAttribute('name');
        identifiers[m].parentElement.parentElement.parentElement.id = identifiers[m].parentElement.parentElement.parentElement.id.split('_')[0] + '_' + String(m + 1);
    }
}


function createNewMaterial() {
    let columns = [['col-1', 'my-2'], ['col-2', 'col-md-2', 'my-2'], ['col-2', 'col-md-2', 'my-2'], ['col-2', 'col-md-2', 'my-2'], ['col-2', 'col-md-2', 'my-2'], ['col-1', 'my-2']];
    let divNames = ['identifier', 'name', 'young', 'weight', 'save', 'close']
    let elements = [];

    let part = $('#materialsPart')[0].children.length;   // row ID
    let identifier = createNewInput('text', '', 'identifier', '', '', '', '', part, 'rounded', false, '');
    identifier.setAttribute('disabled', 'true');
    identifier.setAttribute('style', 'width: 50%; display: block;');
    elements.push(identifier);  // ID řádku

    let materialName = createNewInput('text', '', 'name', '', '', '', '', '', 'rounded', false, '');
    materialName.setAttribute('placeholder', 'Název');
    elements.push(materialName);

    let materialE = createNewInput('text', '', 'modulus', '', '', '', '', '', 'rounded', false, '');
    materialE.setAttribute('placeholder', 'Modul pružnosti [GPa]');
    elements.push(materialE);

    let materialWeight = createNewInput('text', '', 'weight', '', '', '', '', '', 'rounded', false, '');
    materialWeight.setAttribute('placeholder', 'Objemová tíha [kN/m3]');
    elements.push(materialWeight);

    let saveMaterial = createNewButton('', 'support_type', 'saveMaterial(this);', 'Ulož materiál', false, '');
    saveMaterial.setAttribute('class', 'btn btn-secondary rounded');
    elements.push(saveMaterial);

    let tableRow= createNewDiv(['row', 'justify-content-between', 'align-items-center', 'my-2'], true, $('#materialsPart')[0]);
    tableRow.setAttribute('id', `materialRow_${part}`);

    for (k = 0; k < columns.length; k++) {
        let tableRowColumn = createNewDiv(columns[k], true, tableRow);

        if (k == 4) {
            tableRowColumn.setAttribute('style', 'margin-left: -1.5rem; margin-right: -1.5rem;');
        }

        tableRowColumn.setAttribute('name', divNames[k]);
        let tableRowColumnDiv = createNewDiv(['row', 'align-items-center', 'justify-content-center', 'my-2'], true, tableRowColumn);

        try {
            tableRowColumnDiv.appendChild(elements[k]);
        }

        catch {
            continue;
        }
    }

    let closeButton = document.createElement('button');
    closeButton.setAttribute('type', 'button');
    closeButton.setAttribute('class', 'close supportRowClose');
    closeButton.setAttribute('onclick', 'deleteCurrentRow(this); getSupportsData();');

    let spanX = document.createElement('span');
    spanX.innerText = 'x';
    closeButton.appendChild(spanX);
    $(`#materialRow_${part} [name*="close"]`)[0].children[0].appendChild(closeButton);
}


function addNewMemberRow() {
    let columns = [['col-1', 'my-2'], ['col-1', 'col-md-1', 'my-2'], ['col-2', 'col-md-2', 'my-2'], ['col-2', 'col-md-2', 'my-2'], ['col-2', 'col-md-2', 'my-2'], ['col-2', 'col-md-2', 'my-2'], ['col-1', 'my-2']];
    let divNames = ['identifier', 'sectionType', 'sectionButton', 'crossSection', 'material', 'members', 'close']
    let elements = [];

    let part = $('#membersPart')[0].children.length;   // row ID
    let identifier = createNewInput('text', '', 'identifier', '', '', '', '', part, 'rounded', false, '');
    identifier.setAttribute('disabled', 'true');
    identifier.setAttribute('style', 'width: 50%; display: block;');
    elements.push(identifier);  // ID řádku

    let sectionTypeValues = ['input_name', 'create', 'load'];
    let sectionTypeOptionsLabels = ['--Průřez--', 'Nový', 'Můj'];
    elements.push(addSelectWithOptions('section_val_option', sectionTypeValues, sectionTypeOptionsLabels));

    elements.push('');
    elements.push('');

    let materialValues = ['input_name'];
    let materialOptionsLabels = ['--Materiál--'];
    // načtení materiálů
    let materialData = JSON.parse($('#structure_materials')[0].value);

    for (const rowNumber of Object.keys(materialData)) {
        materialValues.push(rowNumber);
        materialOptionsLabels.push(materialData[rowNumber]['name']);
    }

    elements.push(addSelectWithOptions('member_material_val_option', materialValues, materialOptionsLabels));

    let assignedMembers = createNewInput('text', '', 'members', '', '', '', '', '', 'rounded', false, '');
    assignedMembers.setAttribute('placeholder', 'Pruty');
    elements.push(assignedMembers);

    let tableRow= createNewDiv(['row', 'justify-content-between', 'align-items-center', 'my-2'], true, $('#membersPart')[0]);
    tableRow.setAttribute('id', `memberRow_${part}`);

    for (k = 0; k < columns.length; k++) {
        let tableRowColumn = createNewDiv(columns[k], true, tableRow);

        if (k == 4) {
            tableRowColumn.setAttribute('style', 'margin-left: -1.5rem; margin-right: -1.5rem;');
        }

        tableRowColumn.setAttribute('name', divNames[k]);
        let tableRowColumnDiv = createNewDiv(['row', 'align-items-center', 'justify-content-center', 'my-2'], true, tableRowColumn);

        try {
            tableRowColumnDiv.appendChild(elements[k]);
        }

        catch {
            continue;
        }
    }

    let closeButton = document.createElement('button');
    closeButton.setAttribute('type', 'button');
    closeButton.setAttribute('class', 'close supportRowClose');
    closeButton.setAttribute('onclick', 'deleteCurrentRow(this); getSupportsData();');

    let spanX = document.createElement('span');
    spanX.innerText = 'x';
    closeButton.appendChild(spanX);
    $(`#memberRow_${part} [name*="close"]`)[0].children[0].appendChild(closeButton);
}


function createCrossSection(button) {
    let rowId = button.parentElement.parentElement.parentElement.id.split('_')[1];
    let modalTitle = (button.getAttribute('data-target').includes('Creator')) ? 'Vytvoř průřez č. ' : 'Vyber průřez č. '
    $(`${button.getAttribute('data-target')} [class="modal-title"]`)[0].innerText = modalTitle + rowId;

    if (button.getAttribute('data-target').includes('Creator')) {
        $('#section_content')[0].getAttribute('class').includes('show') ? true : $('#section_content')[0].classList.add('show');
    }
}


function chooseCrossSection(newSectionData, sectionNumber) {
    $(`#memberRow_${sectionNumber} [name*="crossSection"]`)[0].children[0].innerHTML = '';
    $('#section_content').collapse('toggle');
    let sectionDictionary = {};
    let sectionName = '';
    newSectionData = newSectionData.split(',');

    if (newSectionData.length != 1) {
        for (const data of newSectionData) {
            sectionDictionary[data.split(':')[0]] = data.split(':')[1];
        }

        sectionName = createSectionName(sectionDictionary);
        sectionDictionary = JSON.stringify(sectionDictionary);
    }

    else {
        sectionName = newSectionData[0].split(':')[0];
        sectionDictionary = newSectionData[0].split(':')[1];
    }

    let sectionNameInput = createNewInput('text', '', '', '', '', '', '', sectionName, 'rounded', false, '');
    sectionNameInput.setAttribute('disabled', 'true');
    $(`#memberRow_${sectionNumber} [name*="crossSection"]`)[0].children[0].appendChild(sectionNameInput);

    let sectionData = createNewInput('hidden', '', '', '', '', '', '', sectionDictionary, 'rounded', false, '');
    sectionData.setAttribute('disabled', 'true');
    $(`#memberRow_${sectionNumber} [name*="crossSection"]`)[0].children[0].appendChild(sectionData);
}


function createSectionName(sectionDictionary) {
    console.log(sectionDictionary);
    let sectionName = '';

    if (sectionDictionary['is_welded'] == 'no') {
        sectionName = `${sectionDictionary['dimension_type']}|${sectionDictionary['dimension_val']}`;
    }

    else if (sectionDictionary['is_welded'] == 'yes') {
        if (/IPE|HEB|UPE/.test(sectionDictionary['dimension_type'])) {
            sectionName = `${sectionDictionary['dimension_type']}|${sectionDictionary['h']}/${sectionDictionary['tw']}/${sectionDictionary['bfh']}/${sectionDictionary['tfh']}/${sectionDictionary['bfd']}/${sectionDictionary['tfd']}`;
        }

        else if (/L_s|T_s|RHS/.test(sectionDictionary['dimension_type'])) {
            let dimensionType = sectionDictionary['dimension_type'];

            if (dimensionType != 'RHS') {
                dimensionType = (dimensionType == 'L_s') ? 'L' : 'T';
            }

            sectionName = `${dimensionType}|${sectionDictionary['h']}/${sectionDictionary['tw']}/${sectionDictionary['bfh']}/${sectionDictionary['tfh']}`;
        }

        else if (sectionDictionary['dimension_type'] == 'crl') {
            sectionName = `ROUND|${sectionDictionary['D']}`;
        }

        else if (sectionDictionary['dimension_type'] == 'rtg') {
            sectionName = `RECT|${sectionDictionary['h']}/${sectionDictionary['bfd']}`;
        }

        else if (sectionDictionary['dimension_type'] == 'cnv') {
            sectionName = 'GRAPHIC';
        }
    }

    else if (sectionDictionary['dimension_type'] == 'mrg') {
        sectionName = `${sectionDictionary['dimension_type_fir']}+${sectionDictionary['dimension_type_sec']}`;
    }

    return sectionName;
}


function addNewLoadCaseandCombinationsRow(button) {
    let columns = [['col-1', 'my-2'], ['col-3', 'col-md-3', 'my-2'], ['col-3', 'col-md-3', 'my-2'], ['col-3', 'col-md-3', 'my-2'], ['col-1', 'my-2']];
    let divNames = ['identifier', 'name', 'loadButton', 'selfWeight', 'close']
    let elements = [];

    let currentContainer = (button.getAttribute('name').includes('Cases')) ? $('#loadCasePart')[0] : $('#loadCombinationPart')[0];

    let part = currentContainer.children.length;   // row ID
    let identifier = createNewInput('text', '', 'identifier', '', '', '', '', part, 'rounded', false, '');
    identifier.setAttribute('disabled', 'true');
    identifier.setAttribute('style', 'width: 50%; display: block;');
    elements.push(identifier);  // ID řádku

    let nameInput = createNewInput('text', '', 'name', '', '', '', '', '', 'rounded', false, '');
    nameInput.setAttribute('placeholder', 'Název');
    elements.push(nameInput);

    let buttonAction = (button.getAttribute('name').includes('Cases')) ? 'manageLoads(this);' : 'manageCombinations(this);';
    let buttonText = (button.getAttribute('name').includes('Cases')) ? 'Definuj zatížení' : 'Schéma kombinace';
    let buttonName = (button.getAttribute('name').includes('Cases')) ? 'loads_manager' : 'combinations_manager';
    let dataTarget = (button.getAttribute('name').includes('Cases')) ? '#loadOfLoadCases' : '#loadCombinations';

    let loadButton = createNewButton('', buttonName, buttonAction, buttonText, false, '');
    loadButton.setAttribute('class', 'btn btn-secondary rounded');
    loadButton.setAttribute('data-toggle', 'modal');
    loadButton.setAttribute('data-target', dataTarget);
    elements.push(loadButton);

    let selfWeightCheckbox = createNewCheckbox('self_weight_checkbox', '', '', false, '');
    selfWeightCheckbox.checked = false;
    elements.push(selfWeightCheckbox);

    let tableRow= createNewDiv(['row', 'justify-content-between', 'align-items-center', 'my-2'], true, currentContainer);
    tableRow.setAttribute('id', `${currentContainer.id.replace('Part', 'Row')}_${part}`);

    for (k = 0; k < columns.length; k++) {
        let tableRowColumn = createNewDiv(columns[k], true, tableRow);

        if (k == 4) {
            tableRowColumn.setAttribute('style', 'margin-left: -1.5rem; margin-right: -1.5rem;');
        }

        tableRowColumn.setAttribute('name', divNames[k]);
        let tableRowColumnDiv = createNewDiv(['row', 'align-items-center', 'justify-content-center', 'my-2'], true, tableRowColumn);

        try {
            tableRowColumnDiv.appendChild(elements[k]);
        }

        catch {
            continue;
        }
    }

    let selfWeightCheckboxLabel = createNewTextElement('label', 'Vlastní tíha', false, '');
    selfWeightCheckboxLabel.setAttribute('for', 'self_weight_checkbox');
    selfWeightCheckboxLabel.setAttribute('class', 'col-form-label');
    $(`#${currentContainer.id.replace('Part', 'Row')}_${part} [name*="selfWeight"]`)[0].children[0].appendChild(selfWeightCheckboxLabel);

    let closeButton = document.createElement('button');
    closeButton.setAttribute('type', 'button');
    closeButton.setAttribute('class', 'close supportRowClose');
    closeButton.setAttribute('onclick', 'deleteCurrentRow(this); getSupportsData();');

    let spanX = document.createElement('span');
    spanX.innerText = 'x';
    closeButton.appendChild(spanX);
    $(`#${currentContainer.id.replace('Part', 'Row')}_${part} [name*="close"]`)[0].children[0].appendChild(closeButton);
}


function manageLoads(button) {
    let rowId = button.parentElement.parentElement.parentElement.id;
    let rowNumber = rowId.split('_')[1];

    $('[id="loadOfLoadCases"] [class="modal-title"]')[0].innerText = 'Zatěžovací stav č. ' + rowNumber;

    while ($('#nodalLoadsPart')[0].children.length != 1) {
        $('#nodalLoadsPart')[0].removeChild($('#nodalLoadsPart')[0].children[1]);
    }

    while ($('#memberLoadsPart')[0].children.length != 1) {
        $('#memberLoadsPart')[0].removeChild($('#memberLoadsPart')[0].children[1]);
    }

    if ($(`#loadCaseRow_${rowNumber} [name="loadButton"]`)[0].children[0].children.length > 1) {
        let loadCasesData = JSON.parse($(`#loadCaseRow_${rowNumber} [name="loadButton"]`)[0].children[0].children[1].value);

        for (const nodalLoad of Object.keys(loadCasesData['nodal_loads'])) {
            addNewNodalLoadRow($(`#loadCaseRow_${rowNumber} [name="loadButton"] [type="button"]`)[0]);

            $(`#nodalLoadsRow_${nodalLoad} [name="nodes"] input[type="text"]`)[0].value = loadCasesData['nodal_loads'][nodalLoad]['nodes'];
            $(`#nodalLoadsRow_${nodalLoad} [name="loadType"] select[name="nodal_load_val_option"]`)[0].value = loadCasesData['nodal_loads'][nodalLoad]['loadType'];
            openNextSupportInput($(`#nodalLoadsRow_${nodalLoad} [name="loadType"] select[name="nodal_load_val_option"]`)[0]);

            for (let j = 3; j < $(`#nodalLoadsRow_${nodalLoad}`)[0].children.length - 1; j++) {
                if ($(`#nodalLoadsRow_${nodalLoad}`)[0].children[j].children[0].children.length != 0) {
                    $(`#nodalLoadsRow_${nodalLoad}`)[0].children[j].children[0].children[0].value = loadCasesData['nodal_loads'][nodalLoad][$(`#nodalLoadsRow_${nodalLoad}`)[0].children[j].getAttribute('name')];
                }

                else {
                    continue;
                }
            }
        }

        for (const memberLoad of Object.keys(loadCasesData['member_loads'])) {
            addNewMemberLoadRow($(`#loadCaseRow_${rowNumber} [name="loadButton"] [type="button"]`)[0]);

            $(`#memberLoadsRow_${memberLoad} [name="members"] input[type="text"]`)[0].value = loadCasesData['member_loads'][memberLoad]['members'];
            $(`#memberLoadsRow_${memberLoad} [name="magnitude"] input[type="text"]`)[0].value = loadCasesData['member_loads'][memberLoad]['magnitude'];
            $(`#memberLoadsRow_${memberLoad} [name="direction"] select[name="member_load_val_option"]`)[0].value = loadCasesData['member_loads'][memberLoad]['direction'];
        }
    }

    $('#loadOfLoadCases').modal('toggle');
}


function addNewNodalLoadRow() {
    let columns = [['col-1', 'my-2'], ['col-1', 'my-2'], ['col-2', 'my-2'], ['col-2', 'my-2'], ['col-2', 'my-2'], ['col-1', 'my-2'], ['col-1', 'my-2'], ['col-1','mr-3' , 'my-2']];
    let divNames = ['identifier', 'nodes', 'loadType', 'magnitude', 'forceRotation', 'forceX', 'forceY', 'close']
    let elements = [];

    let part = $('#nodalLoadsPart')[0].children.length;   // row ID
    let identifier = createNewInput('text', '', 'identifier', '', '', '', '', part, 'rounded', false, '');
    identifier.setAttribute('disabled', 'true');
    identifier.setAttribute('style', 'width: 50%; display: block;');
    elements.push(identifier);  // ID řádku

    let assignedNodes = createNewInput('text', '', 'nodes', '', '', '', '', '', 'rounded', false, '');
    assignedNodes.setAttribute('placeholder', 'Uzly');
    elements.push(assignedNodes);

    let sectionTypeValues = ['input_name', 'force_components', 'force', 'moment'];
    let sectionTypeOptionsLabels = ['--Typ--', 'Složky sil', 'Síla', 'Moment'];
    elements.push(addSelectWithOptions('nodal_load_val_option', sectionTypeValues, sectionTypeOptionsLabels));

    let tableRow= createNewDiv(['row', 'justify-content-between', 'align-items-center', 'my-2'], true, $('#nodalLoadsPart')[0]);
    tableRow.setAttribute('id', `nodalLoadsRow_${part}`);

    for (k = 0; k < columns.length; k++) {
        let tableRowColumn = createNewDiv(columns[k], true, tableRow);

        if (k == 4) {
            tableRowColumn.setAttribute('style', 'margin-left: -1.5rem; margin-right: -1.5rem;');
        }

        tableRowColumn.setAttribute('name', divNames[k]);
        let tableRowColumnDiv = createNewDiv(['row', 'align-items-center', 'justify-content-center', 'my-2'], true, tableRowColumn);

        try {
            tableRowColumnDiv.appendChild(elements[k]);
        }

        catch {
            continue;
        }
    }

    let closeButton = document.createElement('button');
    closeButton.setAttribute('type', 'button');
    closeButton.setAttribute('class', 'close supportRowClose');
    closeButton.setAttribute('onclick', 'deleteCurrentRow(this); getSupportsData();');

    let spanX = document.createElement('span');
    spanX.innerText = 'x';
    closeButton.appendChild(spanX);
    $(`#nodalLoadsRow_${part} [name*="close"]`)[0].children[0].appendChild(closeButton);
}


function addNewMemberLoadRow() {
    let columns = [['col-1', 'my-2'], ['col-1', 'my-2'], ['col-2', 'my-2'], ['col-2', 'my-2'], ['col-1','mr-3' , 'my-2']];
    let divNames = ['identifier', 'members', 'magnitude', 'direction', 'close']
    let elements = [];

    let part = $('#memberLoadsPart')[0].children.length;   // row ID
    let identifier = createNewInput('text', '', 'identifier', '', '', '', '', part, 'rounded', false, '');
    identifier.setAttribute('disabled', 'true');
    identifier.setAttribute('style', 'width: 50%; display: block;');
    elements.push(identifier);  // ID řádku

    let assignedMembers = createNewInput('text', '', 'members', '', '', '', '', '', 'rounded', false, '');
    assignedMembers.setAttribute('placeholder', 'Pruty');
    elements.push(assignedMembers);

    let magnitude = createNewInput('text', '', 'magnitude', '', '', '', '', '', 'rounded', false, '');
    magnitude.setAttribute('placeholder', 'Intenzita');
    elements.push(magnitude);

    let directionValues = ['load_direction', 'element', 'parallel', 'x', 'y'];
    let directionOptionsLabels = ['--Směr--', 'Kolmo na prut', 'V ose prutu', 'Vodorovně', 'Svisle'];
    elements.push(addSelectWithOptions('member_load_val_option', directionValues, directionOptionsLabels));

    let tableRow= createNewDiv(['row', 'justify-content-between', 'align-items-center', 'my-2'], true, $('#memberLoadsPart')[0]);
    tableRow.setAttribute('id', `memberLoadsRow_${part}`);

    for (k = 0; k < columns.length; k++) {
        let tableRowColumn = createNewDiv(columns[k], true, tableRow);

        if (k == 4) {
            tableRowColumn.setAttribute('style', 'margin-left: -1.5rem; margin-right: -1.5rem;');
        }

        tableRowColumn.setAttribute('name', divNames[k]);
        let tableRowColumnDiv = createNewDiv(['row', 'align-items-center', 'justify-content-center', 'my-2'], true, tableRowColumn);

        try {
            tableRowColumnDiv.appendChild(elements[k]);
        }

        catch {
            continue;
        }
    }

    let closeButton = document.createElement('button');
    closeButton.setAttribute('type', 'button');
    closeButton.setAttribute('class', 'close supportRowClose');
    closeButton.setAttribute('onclick', 'deleteCurrentRow(this); getSupportsData();');

    let spanX = document.createElement('span');
    spanX.innerText = 'x';
    closeButton.appendChild(spanX);
    $(`#memberLoadsRow_${part} [name*="close"]`)[0].children[0].appendChild(closeButton);
}


function manageCombinations(button) {
    let rowId = button.parentElement.parentElement.parentElement.id;
    let rowNumber = rowId.split('_')[1];

    $('[id="loadCombinations"] [class="modal-title"]')[0].innerText = 'Kombinace zatížení č. ' + rowNumber;
    let loadCasesSelect = $('#available_lc_val_option')[0];
    loadCasesSelect.innerHTML = '';

    let lcValues = ['lcMark'];
    let lcOptions = ['--ZS--'];

    let allLoadCases = $('[id*="loadCaseRow_"]');

    for (const lcRow of allLoadCases) {
        lcValues.push(lcRow.getAttribute('id').split('_')[1]);
        lcOptions.push($(`#loadCaseRow_${lcRow.getAttribute('id').split('_')[1]} [name="name"] [type="text"]`)[0].value);
    }

    for (let j = 0; j < lcValues.length; j++) {
        let option = document.createElement('option');
        option.setAttribute('value', lcValues[j]);
        option.innerText = lcOptions[j];

        loadCasesSelect.appendChild(option);
    }

    while ($('#combinationCasesPart')[0].children.length != 1) {
        $('#combinationCasesPart')[0].removeChild($('#combinationCasesPart')[0].children[1]);
    }

    if ($(`#loadCombinationRow_${rowNumber} [name="loadButton"]`)[0].children[0].children.length > 1) {
        let combinationData = JSON.parse($(`#loadCombinationRow_${rowNumber} [name="loadButton"] [type="hidden"]`)[0].value);

        for (const loadCase of Object.keys(combinationData)) {
            $('#available_lc_val_option')[0].value = loadCase;
            putLoadCaseToCombination();

            $(`#combinationCasesRow_${loadCase} [name="name"] [type="text"]`)[0].value = combinationData[loadCase]['name'];
            $(`#combinationCasesRow_${loadCase} [name="factor"] [type="text"]`)[0].value = combinationData[loadCase]['factor'];
        }

        $('#available_lc_val_option')[0].value = 'lcMark';
    }

    $('#loadCombinations').modal('toggle');
}


function putLoadCaseToCombination() {
    let columns = [['col-2', 'my-2'], ['col-4', 'my-2'], ['col-3', 'my-2'], ['col-1','mr-3' , 'my-2']];
    let divNames = ['identifier', 'name', 'factor', 'close']
    let elements = [];

    let part = $('#combinationCasesPart')[0].children.length;   // row ID
    let identifier = createNewInput('text', '', 'identifier', '', '', '', '', $('#available_lc_val_option')[0].value, 'rounded', false, '');
    identifier.setAttribute('disabled', 'true');
    identifier.setAttribute('style', 'width: 50%; display: block;');
    elements.push(identifier);  // ID řádku

    let caseName = createNewInput('text', '', 'name', '', '', '', '', '', 'rounded', false, '');

    caseName.value = $(`#available_lc_val_option option[value=${$('#available_lc_val_option')[0].value}]`)[0].innerText;
    caseName.setAttribute('disabled', 'true');
    elements.push(caseName);

    let loadType = createNewInput('text', '', 'type', '', '', '', '', '', 'rounded', false, '');
    loadType.setAttribute('placeholder', 'Součinitel');
    elements.push(loadType);

    let tableRow= createNewDiv(['row', 'justify-content-between', 'align-items-center', 'my-2'], true, $('#combinationCasesPart')[0]);
    tableRow.setAttribute('id', `combinationCasesRow_${part}`);

    for (k = 0; k < columns.length; k++) {
        let tableRowColumn = createNewDiv(columns[k], true, tableRow);

        if (k == 4) {
            tableRowColumn.setAttribute('style', 'margin-left: -1.5rem; margin-right: -1.5rem;');
        }

        tableRowColumn.setAttribute('name', divNames[k]);
        let tableRowColumnDiv = createNewDiv(['row', 'align-items-center', 'justify-content-center', 'my-2'], true, tableRowColumn);

        try {
            tableRowColumnDiv.appendChild(elements[k]);
        }

        catch {
            continue;
        }
    }

    let closeButton = document.createElement('button');
    closeButton.setAttribute('type', 'button');
    closeButton.setAttribute('class', 'close supportRowClose');
    closeButton.setAttribute('onclick', 'deleteCurrentRow(this);');

    let spanX = document.createElement('span');
    spanX.innerText = 'x';
    closeButton.appendChild(spanX);
    $(`#combinationCasesRow_${part} [name*="close"]`)[0].children[0].appendChild(closeButton);
}

// ------------------------------------------------
// funkce pro ukládání a přebírání dat o konstrukci v rámci dialogů

function getMaterialData() {
    let materialRows = $('[id*=materialRow_]');
    let materialData = {};

    for (const row of materialRows) {
        let rowDictionary = {};

        for (let i = 1; i < row.children.length - 2; i++) {
            rowDictionary[row.children[i].getAttribute('name')] = row.children[i].children[0].children[0].value;
        }

        materialData[row.getAttribute('id').split('_')[1]] = rowDictionary;
    }


    $('#structure_materials')[0].value = JSON.stringify(materialData);
}


function saveLoads() {
    let loadCaseData = {};
    let rowNumber = $('#loadOfLoadCases [class="modal-title"]')[0].innerText.split('č. ')[1];

    if ($(`#loadCaseRow_${rowNumber} [name="loadButton"]`)[0].children[0].children.length > 1) {
        $(`#loadCaseRow_${rowNumber} [name="loadButton"]`)[0].children[0].removeChild($(`#loadCaseRow_${rowNumber} [name="loadButton"]`)[0].children[0].children[1]);
    }

    let nodalLoadsRows = $('[id*=nodalLoadsRow_]');
    let nodalLoadsData = {};

    for (const row of nodalLoadsRows) {
        let rowDictionary = {};

        for (let i = 1; i < row.children.length - 1; i++) {
            if (row.children[i].children[0].children.length != 0) {
                rowDictionary[row.children[i].getAttribute('name')] = row.children[i].children[0].children[0].value;
            }

            else {
                rowDictionary[row.children[i].getAttribute('name')] = null;
            }
        }

        nodalLoadsData[row.getAttribute('id').split('_')[1]] = rowDictionary;
    }

    loadCaseData['nodal_loads'] = nodalLoadsData;

    let memberLoadsRows = $('[id*=memberLoadsRow_]');
    let memberLoadsData = {};

    for (const row of memberLoadsRows) {
        let rowDictionary = {};

        for (let i = 1; i < row.children.length - 1; i++) {
            if (row.children[i].children[0].children.length != 0) {
                rowDictionary[row.children[i].getAttribute('name')] = row.children[i].children[0].children[0].value;
            }

            else {
                rowDictionary[row.children[i].getAttribute('name')] = null;
            }
        }

        memberLoadsData[row.getAttribute('id').split('_')[1]] = rowDictionary;
    }

    loadCaseData['member_loads'] = memberLoadsData;
    createNewInput('hidden', '', 'lcData', '', '', '', '', JSON.stringify(loadCaseData), '', true, $(`#loadCaseRow_${rowNumber} [name="loadButton"]`)[0].children[0]);

    let loadCases = getLoadCases();

    $('#structure_loads')[0].value = JSON.stringify(loadCases);
}


function getLoadCases() {
    let loadCaseRows = $('[id*=loadCaseRow_]');
    let lcData = {};

    for (const row of loadCaseRows) {
        let rowDictionary = {};
        rowDictionary['name'] = $(`#${row.getAttribute('id')} [name="name"] input[type="text"]`)[0].value;

        if ($(`#${row.getAttribute('id')} [name="loadButton"]`)[0].children[0].children.length > 1) {
            rowDictionary['loads'] = JSON.parse($(`#${row.getAttribute('id')} [name="loadButton"] input[type="hidden"]`)[0].value);
        }

        else {
            rowDictionary['loads'] = null;
        }

        rowDictionary['selfWeight'] = $(`#${row.getAttribute('id')} [name="selfWeight"] [type="checkbox"]`)[0].checked;

        lcData[row.getAttribute('id').split('_')[1]] = rowDictionary;
    }


    return lcData;
}


function saveCombinationsSchemes() {
    let loadCombinationsData = {};
    let rowNumber = $('#loadCombinations [class="modal-title"]')[0].innerText.split('č. ')[1];

    if ($(`#loadCombinationRow_${rowNumber} [name="loadButton"]`)[0].children[0].children.length > 1) {
        $(`#loadCombinationRow_${rowNumber} [name="loadButton"]`)[0].children[0].removeChild($(`#loadCombinationRow_${rowNumber} [name="loadButton"]`)[0].children[0].children[1]);
    }

    let combinationSchemaRows = $('[id*=combinationCasesRow_]');
    let combinationSchemaData = {};

    for (const row of combinationSchemaRows) {
        let rowDictionary = {};

        for (let i = 0; i < row.children.length - 1; i++) {
            rowDictionary[row.children[i].getAttribute('name')] = row.children[i].children[0].children[0].value;
        }

        combinationSchemaData[row.getAttribute('id').split('_')[1]] = rowDictionary;
    }

    createNewInput('hidden', '', 'coData', '', '', '', '', JSON.stringify(combinationSchemaData), '', true, $(`#loadCombinationRow_${rowNumber} [name="loadButton"]`)[0].children[0]);

    let loadCombinations = getLoadCombinations();

    $('#structure_load_combinations')[0].value = JSON.stringify(loadCombinations);
}


function getLoadCombinations() {
    let loadCombinationRows = $('[id*=loadCombinationRow_]');
    let coData = {};

    for (const row of loadCombinationRows) {
        let rowDictionary = {};
        rowDictionary['name'] = $(`#${row.getAttribute('id')} [name="name"] input[type="text"]`)[0].value;

        if ($(`#${row.getAttribute('id')} [name="loadButton"]`)[0].children[0].children.length > 1) {
            rowDictionary['loads'] = JSON.parse($(`#${row.getAttribute('id')} [name="loadButton"] input[type="hidden"]`)[0].value);
        }

        else {
            rowDictionary['loads'] = null;
        }

        coData[row.getAttribute('id').split('_')[1]] = rowDictionary;
    }


    return coData;
}


function getSupportData() {
    let supportRows = $('[id*=supportRow_]');
    let supportData = {};

    for (const row of supportRows) {
        let rowDictionary = {};

        for (let i = 1; i < row.children.length - 1; i++) {
            if (row.children[i].children[0].children.length > 1) {
                rowDictionary[row.children[i].getAttribute('name')] = row.children[i].children[0].children[1].value;
            }

            else if (row.children[i].children[0].children.length == 0) {
                continue;
            }

            else {
                rowDictionary[row.children[i].getAttribute('name')] = row.children[i].children[0].children[0].value;
            }
        }

        supportData[row.getAttribute('id').split('_')[1]] = rowDictionary;
    }


    $('#structure_supports')[0].value = JSON.stringify(supportData);
}


function getMemberData() {
    let memberRows = $('[id*=memberRow_]');
    let memberData = {};

    for (const row of memberRows) {
        let rowDictionary = {};
        let rowNumber = row.getAttribute('id').split('_')[1];

        rowDictionary['sectionType'] = $(`#memberRow_${rowNumber} [name="sectionType"] select[name="section_val_option"]`)[0].value;

        for (let i = 3; i < row.children.length - 1; i++) {
            if (row.children[i].children[0].children.length > 1) {
                try {
                    if (row.children[i].children[0].children[1].value.substr(0, 5) == 'image') {
                        rowDictionary[row.children[i].getAttribute('name')] = [row.children[i].children[0].children[0].value, row.children[i].children[0].children[1].value];
                    }

                     else {
                        rowDictionary[row.children[i].getAttribute('name')] = [row.children[i].children[0].children[0].value, JSON.parse(row.children[i].children[0].children[1].value)];
                    }
                }

                catch {
                    rowDictionary[row.children[i].getAttribute('name')] = row.children[i].children[0].children[1].value;
                }
            }

            else {
                rowDictionary[row.children[i].getAttribute('name')] = row.children[i].children[0].children[0].value;
            }
        }

        memberData[row.getAttribute('id').split('_')[1]] = rowDictionary;
    }


    $('#structure_members')[0].value = JSON.stringify(memberData);
}


function getGeometryData() {
    let supportData = {
        'allNodesX': $('#nod_X')[0].value,
        'allNodesY': $('#nod_Y')[0].value,
        'nodesX': $('#cnv_Xco')[0].value,
        'nodesY': $('#cnv_Yco')[0].value,
        'canvasWidth': $('#widthOfCanvas')[0].value,
        'canvasAxes': $('#canvasAxes')[0].value,
        'canvasGrid': $('#canvasGrid')[0].value,
        'scaleValue': $('#scaleValue')[0].value,
        'structureFE': $('#calculate_mesh_value')[0].value,
    };

    $('#structure_geometry')[0].value = JSON.stringify(supportData);
}


function getCalculateOptions() {
    let optionCheckboxes = $('#calculateOptionsRow [type="checkbox"], #resultOptionsRow [type="checkbox"]');
    let optionsData = {};

    for (const checkbox of optionCheckboxes) {
        optionsData[checkbox.id] = checkbox.checked;
    }

    optionsData['iterations'] = $('#iterations')[0].value;

    $('#structure_options')[0].value = JSON.stringify(optionsData);
}


function getStructureData() {
    let structureData = {
        'geometry' : JSON.parse($('#structure_geometry')[0].value),
        'supports' : JSON.parse($('#structure_supports')[0].value),
        'materials' : JSON.parse($('#structure_materials')[0].value),
        'members' : JSON.parse($('#structure_members')[0].value),
        'loads' : {
                    'loadCases' : JSON.parse($('#structure_loads')[0].value),
                    'loadCombinations' : JSON.parse($('#structure_load_combinations')[0].value)
                    },
        'options' : JSON.parse($('#structure_options')[0].value),
    }

    return JSON.stringify(structureData);
}

// ------------------------------------------------
// funkce pro vytváření dialogů podle již definovaných dat

function loadGeometryData() {
    let geometryData = JSON.parse($('#structure_geometry')[0].value);

    $('#nod_X')[0].value = geometryData['nodesX'];
    $('#nod_Y')[0].value = geometryData['nodesY'];
    $('#cnv_Xco')[0].value = geometryData['allNodesX'];
    $('#cnv_Yco')[0].value = geometryData['allNodesY'];
    $('#calculate_mesh_value')[0].value = geometryData['structureFE'];
    $('#widthOfCanvas')[0].value = geometryData['canvasWidth'];
    $('#heightOfCanvas')[0].value = geometryData['canvasWidth'];
    $('#canvasAxes')[0].value = geometryData['canvasAxes'];
    $('#canvasGrid')[0].value = geometryData['canvasGrid'];
    $('#scaleValue')[0].value = geometryData['scaleValue'];

    widthOfMyCanvas();
    heightOfMyCanvas();
    canvasGridNew();
    $('#myCanvas')[0].dispatchEvent(new Event('mousemove'));
}


function loadSupportsData() {
    let supportData = JSON.parse($('#structure_supports')[0].value);

    for (const support of Object.keys(supportData)) {
        addNewSupportRow();
        $(`#supportRow_${support} [name="element"] select[name="element_val_option"]`)[0].value = supportData[support]['element'];
        openNextSupportInput($(`#supportRow_${support} [name="element"] select[name="element_val_option"]`)[0]);

        $(`#supportRow_${support} [name="conditions"]`)[0].children[0].children[0].value = supportData[support]['conditions'];
        openNextSupportInput($(`#supportRow_${support} [name="conditions"]`)[0].children[0].children[0]);

        for (let i = 1; i < $(`#supportRow_${support}`)[0].children.length - 1; i++) {
            if ($(`#supportRow_${support}`)[0].children[i].children[0].children.length == 0) {
                continue;
            }

            else if ($(`#supportRow_${support}`)[0].children[i].children[0].children[0].getAttribute('type') == 'button') {
                let conditions = createNewInput('hidden', '', '', '', '', '', '', '', '', false, '')
                conditions.value = supportData[support]['conditions'];
                $(`#supportRow_${support}`)[0].children[i].children[0].appendChild(conditions);
            }

            else {
                $(`#supportRow_${support}`)[0].children[i].children[0].children[0].value = supportData[support][$(`#supportRow_${support}`)[0].children[i].getAttribute('name')];
            }
        }
    }
}


function loadMaterialData() {
    let materialData = JSON.parse($('#structure_materials')[0].value);

    for (const material of Object.keys(materialData)) {
        createNewMaterial();

        for (let i = 1; i < $(`#materialRow_${material}`)[0].children.length - 2; i++) {
            $(`#materialRow_${material}`)[0].children[i].children[0].children[0].value = materialData[material][$(`#materialRow_${material}`)[0].children[i].getAttribute('name')];
        }
    }
}


function loadMembersData() {
    let memberData = JSON.parse($('#structure_members')[0].value);

    for (const member of Object.keys(memberData)) {
        addNewMemberRow();
        $(`#memberRow_${member} [name="sectionType"] select[name="section_val_option"]`)[0].value = memberData[member]['sectionType'];
        openNextSupportInput($(`#memberRow_${member} [name="sectionType"] select[name="section_val_option"]`)[0]);

        if (memberData[member]['crossSection'][0].length > 1) {
            chooseCrossSection(JSON.stringify(memberData[member]['crossSection'][1]), member);
        }

        else {
            chooseCrossSection(memberData[member]['crossSection'], member);
        }

        $(`#memberRow_${member} [name="crossSection"] [type="text"]`)[0].value = memberData[member]['crossSection'][0];
        $(`#memberRow_${member} [name="crossSection"] [type="hidden"]`)[0].value = memberData[member]['crossSection'][1];

        for (let i = 4; i < $(`#memberRow_${member}`)[0].children.length - 1; i++) {
            $(`#memberRow_${member}`)[0].children[i].children[0].children[0].value = memberData[member][$(`#memberRow_${member}`)[0].children[i].getAttribute('name')];
        }
    }
}


function loadCasesData() {
    let loadCasesData = JSON.parse($('#structure_loads')[0].value);

    for (const loadCase of Object.keys(loadCasesData)) {
        addNewLoadCaseandCombinationsRow($('[name="loadCasesCreator"]')[0]);
        $(`#loadCaseRow_${loadCase} [name="name"] [type="text"]`)[0].value = loadCasesData[loadCase]['name'];
        createNewInput('hidden', '', 'lcData', '', '', '', '', JSON.stringify(loadCasesData[loadCase]['loads']), '', true, $(`#loadCaseRow_${loadCase} [name="loadButton"]`)[0].children[0]);
        $(`#loadCaseRow_${loadCase} [name="selfWeight"] [type="checkbox"]`)[0].checked = loadCasesData[loadCase]['selfWeight'];
    }

    let loadCombinationsData = JSON.parse($('#structure_load_combinations')[0].value);

    for (const loadCombination of Object.keys(loadCombinationsData)) {
        addNewLoadCaseandCombinationsRow($('[name="loadCombinationsCreator"]')[0]);
        $(`#loadCombinationRow_${loadCombination} [name="name"] [type="text"]`)[0].value = loadCombinationsData[loadCombination]['name'];
        createNewInput('hidden', '', 'coData', '', '', '', '', JSON.stringify(loadCombinationsData[loadCombination]['loads']), '', true, $(`#loadCombinationRow_${loadCombination} [name="loadButton"]`)[0].children[0])
    }
}


function loadOptionsData() {
    let optionsData = JSON.parse($('#structure_options')[0].value);

    for (const checkbox of Object.keys(optionsData)) {
        $(`#${checkbox}`)[0].checked = optionsData[checkbox];
    }

    $('#iterations')[0].value = optionsData['iterations'];
}


function loadStructure() {
    let structureData = JSON.parse("{\"geometry\":{\"allNodesX\":\"50,350\",\"allNodesY\":\"100,100\",\"nodesX\":\"50,350\",\"nodesY\":\"100,100\",\"canvasWidth\":\"\",\"canvasAxes\":\"\",\"canvasGrid\":\"50\",\"scaleValue\":\"\",\"structureFE\":\"15\"},\"supports\":{\"1\":{\"element\":\"support\",\"conditions\":\"hinged\",\"nodes\":\"1\"},\"2\":{\"element\":\"support\",\"conditions\":\"roll_y\",\"nodes\":\"2\"}},\"materials\":{\"1\":{\"name\":\"S235\",\"young\":\"210\",\"weight\":\"78.5\"}},\"members\":{\"1\":{\"sectionType\":\"create\",\"crossSection\":[\"IPE|270\",{\"dimension_type\":\"IPE\",\"is_welded\":\"no\",\"dimension_val\":\"270\",\"geometric_value\":\"yes\",\"warping_value\":\"yes\",\"plastic_value\":\"yes\",\"FE_number\":\"15\"}],\"material\":\"1\",\"members\":\"1\"}},\"loads\":{\"loadCases\":{\"1\":{\"name\":\"LC1: stálá\",\"loads\":{\"nodal_loads\":{},\"member_loads\":{\"1\":{\"members\":\"1\",\"magnitude\":\"10\",\"direction\":\"element\"}}},\"selfWeight\":false},\"2\":{\"name\":\"LC: užitná\",\"loads\":{\"nodal_loads\":{\"1\":{\"nodes\":\"1\",\"loadType\":\"moment\",\"magnitude\":\"15\",\"forceRotation\":null,\"forceX\":null,\"forceY\":null}},\"member_loads\":{}},\"selfWeight\":false}},\"loadCombinations\":{\"1\":{\"name\":\"CO1\",\"loads\":{\"1\":{\"identifier\":\"1\",\"name\":\"LC1: stálá\",\"factor\":\"1\"},\"2\":{\"identifier\":\"2\",\"name\":\"LC: užitná\",\"factor\":\"2\"}}}}},\"options\":{\"linear_calculate_checkbox\":false,\"geometrical_nonlinear_checkbox\":false,\"axial_force_checkbox\":true,\"shear_force_checkbox\":true,\"bending_moment_checkbox\":true,\"reaction_force_checkbox\":true,\"displacement_checkbox\":true,\"iterations\":\"\"}}");

    $('#structure_geometry')[0].value = JSON.stringify(structureData['geometry']);
    $('#structure_supports')[0].value = JSON.stringify(structureData['supports']);
    $('#structure_materials')[0].value = JSON.stringify(structureData['materials']);
    $('#structure_members')[0].value = JSON.stringify(structureData['members']);
    $('#structure_loads')[0].value = JSON.stringify(structureData['loads']['loadCases']);
    $('#structure_load_combinations')[0].value = JSON.stringify(structureData['loads']['loadCombinations']);
    $('#structure_options')[0].value = JSON.stringify(structureData['options']);

    $('#usr_calculate')[0].removeAttribute('disabled');
    $('#usr_calculate')[0].click();
}