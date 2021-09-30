// SCRIPTY PRO GLOBÁLNÍ OVLÁDÁNÍ DIALOGU ANALÝZY KONSTRUKCE

// vytvoření jednotlivých panelů dialogu konstrukce
function createTabEnviroment(clicked_id) {
    let currentTab = $('[class="nav-link active"]')[0];
    let savedTab = currentTab.getAttribute('id').split('_')[0];

    if (savedTab == 'geometry') {
        getGeometryData();
    }

    else if (savedTab == 'support') {
        getSupportData();
    }

    else if (savedTab == 'material') {
        getMaterialData();
    }

    else if (savedTab == 'section') {
        getMemberData();
    }

    else if (savedTab == 'load') {
        getLoadCases();
        getLoadCombinations();
    }

    else if (savedTab == 'calculate') {
        getCalculateOptions();
    }

    let actualTabPanel = $(`#${clicked_id.replace('_href', '')}`)[0];
    let allTabPanels = $('div[id$="section"]');

    for (const tabPanel of allTabPanels) {
        tabPanel.innerHTML = '';
    }

    eval(`${clicked_id.split('_')[0]}Enviroment(actualTabPanel)`);
}


function geometryEnviroment(structurePart) {
    // --------------- canvas enviroment ---------------

    let canvasStuffContainer = createNewDiv(['container', 'text-center'], true, structurePart);
    let canvas = document.createElement('canvas');
    canvas.setAttribute('id', 'myCanvas');
    canvas.setAttribute('class', 'canvasObject m-3');
    canvas.setAttribute('onmousemove', 'redrawAll(event);');
    canvas.setAttribute('onclick', 'getPointCoordinates(event); getNodesOfMembers();');
    canvas.setAttribute('width', '300px');
    canvas.setAttribute('height', '300px');
    canvasStuffContainer.appendChild(canvas);

    // canvas control
    let canvasDimensionAndAxisPart = createNewDiv(['row', 'justify-content-center', 'm-2'], true, canvasStuffContainer);

    let canvasDimensionInputsColumn = createNewDiv(['col-9', 'col-sm-6', 'col-md-4', 'm-2'], true, canvasDimensionAndAxisPart);
    let canvasDimensionLabelRow = createNewDiv(['row', 'align-items-center', 'justify-content-center'], true, canvasDimensionInputsColumn);
    let canvasDimensionInputsLabel = createNewTextElement('label', 'Rozměry plátna: ', true, canvasDimensionLabelRow);
    canvasDimensionInputsLabel.setAttribute('class', 'col-form-label');

    let canvasDimensionWidthRow = createNewDiv(['row', 'align-items-center', 'justify-content-center', 'my-2'], true, canvasDimensionInputsColumn);
    let canvasDimensionWidth = createNewInput('text', 'widthOfCanvas', '', 4, 1, 150, 1500, '', 'canvasInputs rounded', true, canvasDimensionWidthRow);
    canvasDimensionWidth.setAttribute('placeholder', 'Šířka: 300 mm');
    canvasDimensionWidth.setAttribute('onchange', 'widthOfMyCanvas();');

    let canvasDimensionHeightRow = createNewDiv(['row', 'align-items-center', 'justify-content-center', 'my-2'], true, canvasDimensionInputsColumn);
    let canvasDimensionHeight = createNewInput('text', 'heightOfCanvas', '', 4, 1, 150, 1500, '', 'canvasInputs rounded', true, canvasDimensionHeightRow);
    canvasDimensionHeight.setAttribute('placeholder', 'Výška: 300 mm');
    canvasDimensionHeight.setAttribute('onchange', 'heightOfMyCanvas();');
    // ---------------
    let canvasAxisandGridColumn = createNewDiv(['col-9', 'col-sm-6', 'col-md-4', 'm-2'], true, canvasDimensionAndAxisPart);
    let canvasAxisLabelRow = createNewDiv(['row', 'align-items-center', 'justify-content-center'], true, canvasAxisandGridColumn);
    let canvasAxisInputsLabel = createNewTextElement('label', 'Kroky mřížek: ', true, canvasAxisLabelRow);
    canvasAxisInputsLabel.setAttribute('class', 'col-form-label');

    let canvasAxisRow = createNewDiv(['row', 'align-items-center', 'justify-content-center', 'my-2'], true, canvasAxisandGridColumn);
    let canvasAxis = createNewInput('text', 'canvasAxes', '', 3, 1, 10, 200, '', 'canvasInputs rounded', true, canvasAxisRow);
    canvasAxis.setAttribute('placeholder', 'Osy: 50');
    canvasAxis.setAttribute('onchange', 'redrawAll("");');

    let canvasGridRow = createNewDiv(['row', 'align-items-center', 'justify-content-center', 'my-2'], true, canvasAxisandGridColumn);
    let canvasGrid = createNewInput('text', 'canvasGrid', '', 3, 1, 10, 200, '', 'canvasInputs rounded', true, canvasGridRow);
    canvasGrid.setAttribute('placeholder', 'Grid: ne');
    canvasGrid.setAttribute('onchange', 'canvasGridNew();');
    // ---------------
    let canvasScaleRow = createNewDiv(['form-row', 'align-items-center', 'm-2'], true, canvasStuffContainer);
    let canvasScaleLabelColumn = createNewDiv(['col-9', 'offset-1', 'col-md-3', 'offset-md-3', 'my-2', 'my-md-0', 'justify-content-center'], true, canvasScaleRow);
    let canvasScaleLabel = createNewTextElement('label', 'Měřítko: ', true, canvasScaleLabelColumn);

    let canvasScaleInputColumn = createNewDiv(['col-6', 'offset-3', 'offset-md-0', 'col-md-3', 'ml-md-2', 'justify-content-left'], true, canvasScaleRow);
    let canvasScaleInput = createNewInput('text', 'scaleValue', '', 1, 1, 1, 5, '', 'canvasInputs rounded', true, canvasScaleInputColumn);
    canvasScaleInput.setAttribute('placeholder', '1');
    canvasScaleInput.setAttribute('onchange', 'redrawAll("");');
    // !canvas control

    // mesh input
    let structureMeshRow = createNewDiv(['form-row', 'align-items-center', 'm-2'], true, canvasStuffContainer);
    structureMeshRow.setAttribute('id', 'mesh_part');
    let canvasMeshLabelColumn = createNewDiv(['col-9', 'offset-1', 'col-md-3', 'offset-md-3', 'my-2', 'my-md-0', 'justify-content-center'], true, structureMeshRow);
    canvasMeshLabelColumn.setAttribute('id', 'cnv_meshPart');
    let canvasMeshLabel = createNewTextElement('label', 'Velikost prvku sítě: ', true, canvasMeshLabelColumn);
    canvasMeshLabel.setAttribute('class', 'col-form-label');
    canvasMeshLabel.setAttribute('for', 'calculate_mesh_value');

    let canvasMeshInputColumn = createNewDiv(['col-6', 'offset-3', 'offset-md-0', 'col-md-3', 'ml-md-2', 'justify-content-left'], true, structureMeshRow);
    let canvasMeshInput = createNewInput('text', 'calculate_mesh_value', '', 1, 5, 1, 100, '', 'form-control rounded', true, canvasMeshInputColumn);
    canvasMeshInput.setAttribute('name', 'FE_number');
    let canvasMeshInputSpan = createNewTextElement('span', '', true, canvasMeshInputColumn);
    canvasMeshInputSpan.setAttribute('id', 'cnv_calculate_mesh_value_check_valid');
    // !mesh input

    // buttons for deleting geometry
    let structureButtons = createNewDiv(['form-row', 'justify-content-left', 'align-items-center', 'm-2'], true, structurePart);

    let deleteGeometryColumn = createNewDiv(['col-12', 'col-sm-6', 'offset-sm-3', 'offset-md-0', 'col-md-3', 'offset-md-3'], true, structureButtons);
    let deleteGeometryButton = createNewButton('deleteButton', '', 'deleteYourFrameDraw();', 'Smaž geometrii', true, deleteGeometryColumn);
    deleteGeometryButton.setAttribute('class', 'btn btn-secondary rounded');
    let deleteLastPointColumn = createNewDiv(['col-12', 'col-sm-6', 'offset-sm-3', 'offset-md-0', 'col-md-3', 'ml-md-2'], true, structureButtons);
    let deleteLastPointButton = createNewButton('deletePointButton', '', 'deleteLastPointOfFrame();', 'Smaž poslední bod', true, deleteLastPointColumn);
    deleteLastPointButton.setAttribute('class', 'btn btn-secondary rounded my-2');
    // !buttons for deleting geometry

    // canvas data
    let canvasDataRow = createNewDiv(['row'], true, structurePart);

    let canvasData = {
        'gridPointsX': '',
        'gridPointsY': '',
        'cnv_Xco': 'allClickedPointsX',
        'cnv_Yco': 'allClickedPointsY',
        'nod_X': '',
        'nod_Y': '',
        'actualCursorX': '',
        'actualCursorY': '',
        'newCursorX': '',
        'newCursorY': '',
        'numberOfPoints': 'numberOfPoints',
    }

    for (const [key, value] of Object.entries(canvasData)) {
        createNewInput('hidden', key, value, '', '', '', '', '', 'noinput', true, canvasDataRow);
    }

    let drawDetector = createNewInput('hidden', 'draw_detector', 'draw_detector', '', '', '', '', '', 'noinput', true, canvasDataRow);
    drawDetector.setAttribute('value', 'watch');
    // !canvas data

    // --------------- !canvas enviroment ---------------

    if ($('#structure_geometry')[0].value != '0') {
        loadGeometryData();
    }
}


function supportEnviroment(structurePart) {
    let supportEnviromentContainer = createNewDiv(['row', 'justify-content-center'], true, structurePart);
    // --------------- nodes and members pictures ---------------
        // nodes schema
    let nodesSchemaColumn = createNewDiv(['col-12', 'col-md-6', 'p-3', 'align-items-center', 'text-center'], true, supportEnviromentContainer);
    createNewTextElement('h5', 'Schéma uzlů', true, nodesSchemaColumn);
    let nodeSchemaPicture = document.createElement('img');
    nodeSchemaPicture .setAttribute('src', $('#structure_geometry_supports')[0].value);
    nodesSchemaColumn.appendChild(nodeSchemaPicture);
        // !nodes schema

        // members schema
    let membersSchemaColumn = createNewDiv(['col-12', 'col-md-6', 'p-3', 'align-items-center', 'text-center'], true, supportEnviromentContainer);
    createNewTextElement('h5', 'Schéma prutů', true, membersSchemaColumn);
    let membersSchemaPicture = document.createElement('img');
    membersSchemaPicture.setAttribute('src',  $('#structure_geometry_members')[0].value);
    membersSchemaColumn.appendChild(membersSchemaPicture);
        // !members schema
    // --------------- !nodes and members pictures ---------------

    // --------------- support row section ---------------
    let supportAndHingesEnviroment = createNewDiv(['col-10'], true, supportEnviromentContainer);
    supportAndHingesEnviroment.setAttribute('id', 'supportsPart');
    let newSupportButtonRow = createNewDiv(['row', 'my-2'], true, supportAndHingesEnviroment);
    let newSupportButton = createNewButton('addSupportButton', '', 'addNewSupportRow();', 'Přidat element', true, newSupportButtonRow);
    newSupportButton.setAttribute('class', 'btn btn-secondary rounded');

    // --------------- support row section ---------------

    if ($('#structure_supports')[0].value != '0') {
        loadSupportsData();
    }
}


function materialEnviroment(structurePart) {
    let materialTab = createNewDiv(['row', 'justify-content-center'], true, structurePart);
    let materialEnviroment = createNewDiv(['col-10'], true, materialTab);
    materialEnviroment.setAttribute('id', 'materialsPart');
    let materialButtonRow = createNewDiv(['row', 'mb-2', 'mt-4'], true, materialEnviroment);

    // --------------- material buttons ---------------
    let newMaterialButtonColumn = createNewDiv(['col-12', 'col-sm-6', 'offset-sm-3', 'offset-md-0', 'col-md-3', 'offset-md-3'], true, materialButtonRow);
    let newMaterialButton = createNewButton('materialNew', '', 'createNewMaterial();', 'Nový materiál', true, newMaterialButtonColumn);
    newMaterialButton.setAttribute('class', 'btn btn-secondary rounded');

    let savedMaterialButtonColumn = createNewDiv(['col-12', 'col-sm-6', 'offset-sm-3', 'offset-md-0', 'col-md-3', 'ml-md-2'], true, materialButtonRow);
    let savedMaterialButton = createNewButton('materialSaved', '', 'getMyMaterials();', 'Moje materiály', true, savedMaterialButtonColumn);
    savedMaterialButton.setAttribute('class', 'btn btn-secondary rounded');
    savedMaterialButton.setAttribute('data-toggle', 'modal');
    savedMaterialButton.setAttribute('data-target', '#materialManager');
    // --------------- !material buttons ---------------

    if ($('#structure_materials')[0].value != '0') {
        loadMaterialData();
    }
}


function sectionEnviroment(structurePart) {
    let sectionEnviromentContainer = createNewDiv(['row', 'justify-content-center'], true, structurePart);
    // --------------- nodes and members pictures ---------------
        // nodes schema
    let nodesSchemaColumn = createNewDiv(['col-12', 'col-md-6', 'p-3', 'align-items-center', 'text-center'], true, sectionEnviromentContainer);
    createNewTextElement('h5', 'Schéma uzlů', true, nodesSchemaColumn);
    let nodeSchemaPicture = document.createElement('img');
    nodeSchemaPicture .setAttribute('src', $('#structure_geometry_supports')[0].value);
    nodesSchemaColumn.appendChild(nodeSchemaPicture);
        // !nodes schema

        // members schema
    let membersSchemaColumn = createNewDiv(['col-12', 'col-md-6', 'p-3', 'align-items-center', 'text-center'], true, sectionEnviromentContainer);
    createNewTextElement('h5', 'Schéma prutů', true, membersSchemaColumn);
    let membersSchemaPicture = document.createElement('img');
    membersSchemaPicture.setAttribute('src',  $('#structure_geometry_members')[0].value);
    membersSchemaColumn.appendChild(membersSchemaPicture);
        // !members schema
    // --------------- !nodes and members pictures ---------------

    // --------------- support row section ---------------

    let membersEnviroment = createNewDiv(['col-10'], true, sectionEnviromentContainer);
    membersEnviroment.setAttribute('id', 'membersPart');
    let newMemberButtonRow = createNewDiv(['row', 'my-2'], true, membersEnviroment);
    let newMemberButton = createNewButton('addMemberButton', '', 'addNewMemberRow();', 'Přidat nastavení prutů', true, newMemberButtonRow);
    newMemberButton.setAttribute('class', 'btn btn-secondary rounded');

    // --------------- support row section ---------------
    if ($('#structure_members')[0].value != '0') {
        loadMembersData();
    }
}


function loadEnviroment(structurePart) {
    let loadEnviromentContainer = createNewDiv(['row', 'justify-content-center'], true, structurePart);
    // --------------- nodes and members pictures ---------------
        // nodes schema
    let nodesSchemaColumn = createNewDiv(['col-12', 'col-md-6', 'p-3', 'align-items-center', 'text-center'], true, loadEnviromentContainer);
    createNewTextElement('h5', 'Schéma uzlů', true, nodesSchemaColumn);
    let nodeSchemaPicture = document.createElement('img');
    nodeSchemaPicture .setAttribute('src', $('#structure_geometry_supports')[0].value);
    nodesSchemaColumn.appendChild(nodeSchemaPicture);
        // !nodes schema

        // members schema
    let membersSchemaColumn = createNewDiv(['col-12', 'col-md-6', 'p-3', 'align-items-center', 'text-center'], true, loadEnviromentContainer);
    createNewTextElement('h5', 'Schéma prutů', true, membersSchemaColumn);
    let membersSchemaPicture = document.createElement('img');
    membersSchemaPicture.setAttribute('src',  $('#structure_geometry_members')[0].value);
    membersSchemaColumn.appendChild(membersSchemaPicture);
        // !members schema
    // --------------- !nodes and members pictures ---------------

    // --------------- load row section ---------------
    let casesAndCombinationsEnviroment = createNewDiv(['col-12'], true, loadEnviromentContainer);
    casesAndCombinationsEnviroment.setAttribute('id', 'lcCoPart');

        // load cases
    let loadCaseContainer = createNewDiv(['container', 'availableLoadCases', 'my-4'], true, casesAndCombinationsEnviroment);
    loadCaseContainer.setAttribute('name', 'load_cases');
    let loadCaseContainerSpace = createNewDiv(['row', 'justify-content-center', 'text-center', 'my-2'], true, loadCaseContainer);
    let loadCaseLabelColumn = createNewDiv(['col-10'], true, loadCaseContainerSpace);
    createNewTextElement('h5', 'Zatěžovací stavy', true, loadCaseLabelColumn);

    let loadCasePart = createNewDiv(['col-10'], true, loadCaseContainerSpace);
    loadCasePart.setAttribute('id', 'loadCasePart');
    let loadCaseRows = createNewDiv(['row', 'my-2'], true, loadCasePart );
    let newLoadCaseButton = createNewButton('', 'loadCasesCreator', 'addNewLoadCaseandCombinationsRow(this);', 'Nový zatěžovací stav', true, loadCaseRows);
    newLoadCaseButton.setAttribute('class', 'btn btn-secondary rounded m-2');
        // !load cases

        // load combinations
    let loadCombinationContainer = createNewDiv(['container', 'loadCombinationsLoadCases', 'my-4'], true, casesAndCombinationsEnviroment);
    loadCombinationContainer.setAttribute('name', 'load_combinations');
    let loadCombinationContainerSpace = createNewDiv(['row', 'justify-content-center', 'text-center', 'my-2'], true, loadCombinationContainer);
    let loadCombinationLabelColumn = createNewDiv(['col-10'], true, loadCombinationContainerSpace);
    createNewTextElement('h5', 'Kombinace zatížení', true, loadCombinationLabelColumn);

    let loadCombinationPart = createNewDiv(['col-10'], true, loadCombinationContainerSpace);
    loadCombinationPart.setAttribute('id', 'loadCombinationPart');
    let loadCombinationRows = createNewDiv(['row', 'my-2'], true, loadCombinationPart );
    let newLoadCombinationButton = createNewButton('', 'loadCombinationsCreator', 'addNewLoadCaseandCombinationsRow(this);', 'Nová kombinace zatížení', true, loadCombinationRows);
    newLoadCombinationButton.setAttribute('class', 'btn btn-secondary rounded m-2');
        // !load combinations

    // --------------- !load row section ---------------

    if ($('#structure_loads')[0].value != '0') {
        loadCasesData();
    }
}


function calculateEnviroment(structurePart) {
    // --------------- calculate options  ---------------
    let calculateOptionsContainer = createNewDiv(['col-8', 'offset-2', 'justify-content-center', 'my-4', 'optionsContainer'], true, structurePart);
    calculateOptionsContainer.setAttribute('id', 'calculateOptionsRow');
    let calculateOptionsLabel = createNewDiv(['form-row', 'justify-content-center', 'my-2'], true, calculateOptionsContainer);
    createNewTextElement('h5', 'Možnosti výpočtu', true, calculateOptionsLabel);

    let linearCalculateCheckboxDiv = createNewDiv(['form-row', 'align-items-center', 'm-2'], true, calculateOptionsContainer);
    createNewCheckbox('linear_calculate_checkbox', '', '', true, linearCalculateCheckboxDiv);
    let linearCalculateCheckboxLabel = createNewTextElement('label', 'Lineární výpočet (i když obsahuje nelineární prvky)', true, linearCalculateCheckboxDiv);
    linearCalculateCheckboxLabel.setAttribute('for', 'linear_calculate_checkbox');
    linearCalculateCheckboxLabel.setAttribute('class', 'col-form-label');
    let linearCalculateCheckboxValue = createNewInput('hidden', 'linear_calculate', 'linear_calculate', '', '', '', '', 'no', 'form-control', true, linearCalculateCheckboxDiv);

    let nonlinearCalculateCheckboxDiv = createNewDiv(['form-row', 'align-items-center', 'm-2'], true, calculateOptionsContainer);
    createNewCheckbox('geometrical_nonlinear_checkbox', '', '', true, nonlinearCalculateCheckboxDiv);
    let nonlinearCalculateCheckboxLabel = createNewTextElement('label', 'Výpočet podle teorie II. řádu', true, nonlinearCalculateCheckboxDiv);
    nonlinearCalculateCheckboxLabel.setAttribute('for', 'geometrical_nonlinear_checkbox');
    nonlinearCalculateCheckboxLabel.setAttribute('class', 'col-form-label');
    let nonlinearCalculateCheckboxValue = createNewInput('hidden', 'geometrical_nonlinear', 'geometrical_nonlinear', '', '', '', '', 'no', 'form-control', true, nonlinearCalculateCheckboxDiv);

    let iterationsDiv = createNewDiv(['form-row', 'align-items-center', 'm-2'], true, calculateOptionsContainer);
    let iterationsLabelColumn = createNewDiv(['col-6'], true, iterationsDiv);
    let iterationsLabel = createNewTextElement('label', 'Maximální počet iterací', true, iterationsLabelColumn);
    iterationsLabel.setAttribute('for', 'iterations');
    let iterationsLabelInput = createNewDiv(['col-6'], true, iterationsDiv);
    let iterationsValue = createNewInput('text', 'iterations', 'iterations', 1, 3, 1, 500, '', 'form-control', true, iterationsLabelInput);

    // --------------- !calculate options  ---------------

    // --------------- !results options  ---------------
    let resultOptionsContainer = createNewDiv(['col-8', 'offset-2', 'justify-content-center', 'my-4', 'optionsContainer'], true, structurePart);
    resultOptionsContainer.setAttribute('id', 'resultOptionsRow');
    let resultOptionsLabel = createNewDiv(['form-row', 'justify-content-center', 'my-2'], true, resultOptionsContainer);
    createNewTextElement('h5', 'Filtr výsledků', true, resultOptionsLabel);

    let axialForcesCheckboxDiv = createNewDiv(['form-row', 'align-items-center', 'm-2'], true, resultOptionsContainer);
    let axialForcesCheckbox = createNewCheckbox('axial_force_checkbox', '', '', true, axialForcesCheckboxDiv);
    axialForcesCheckbox.checked = true;
    let axialForcesCheckboxLabel = createNewTextElement('label', 'Osové síly', true, axialForcesCheckboxDiv);
    axialForcesCheckboxLabel.setAttribute('for', 'axial_force_checkbox');
    axialForcesCheckboxLabel.setAttribute('class', 'col-form-label');
    let axialForcesCheckboxValue = createNewInput('hidden', 'axial_force', 'axial_force', '', '', '', '', 'yes', 'form-control', true, axialForcesCheckboxDiv);

    let shearForcesCheckboxDiv = createNewDiv(['form-row', 'align-items-center', 'm-2'], true, resultOptionsContainer);
    let shearForcesCheckbox = createNewCheckbox('shear_force_checkbox', '', '', true, shearForcesCheckboxDiv);
    shearForcesCheckbox.checked = true;
    let shearForcesCheckboxLabel = createNewTextElement('label', 'Posouvající síly', true, shearForcesCheckboxDiv);
    shearForcesCheckboxLabel.setAttribute('for', 'shear_force_checkbox');
    shearForcesCheckboxLabel.setAttribute('class', 'col-form-label');
    let shearForcesCheckboxValue = createNewInput('hidden', 'shear_force', 'shear_force', '', '', '', '', 'yes', 'form-control', true, shearForcesCheckboxDiv);

    let bendingMomentsCheckboxDiv = createNewDiv(['form-row', 'align-items-center', 'm-2'], true, resultOptionsContainer);
    let bendingMomentsCheckbox = createNewCheckbox('bending_moment_checkbox', '', '', true, bendingMomentsCheckboxDiv);
    bendingMomentsCheckbox.checked = true;
    let bendingMomentsCheckboxLabel = createNewTextElement('label', 'Ohybové momenty', true, bendingMomentsCheckboxDiv);
    bendingMomentsCheckboxLabel.setAttribute('for', 'bending_moment_checkbox');
    bendingMomentsCheckboxLabel.setAttribute('class', 'col-form-label');
    let bendingMomentsCheckboxValue = createNewInput('hidden', 'bending_moment_forces', 'bending_moment_forces', '', '', '', '', 'yes', 'form-control', true, bendingMomentsCheckboxDiv);

    let supportForcesCheckboxDiv = createNewDiv(['form-row', 'align-items-center', 'm-2'], true, resultOptionsContainer);
    let supportForcesCheckbox = createNewCheckbox('reaction_force_checkbox', '', '', true, supportForcesCheckboxDiv);
    supportForcesCheckbox.checked = true;
    let supportForcesCheckboxLabel = createNewTextElement('label', 'Podporové reakce', true, supportForcesCheckboxDiv);
    supportForcesCheckboxLabel.setAttribute('for', 'reaction_force_checkbox');
    supportForcesCheckboxLabel.setAttribute('class', 'col-form-label');
    let supportForcesCheckboxValue = createNewInput('hidden', 'reaction_force', 'reaction_force', '', '', '', '', 'yes', 'form-control', true, supportForcesCheckboxDiv);

    let deformationsCheckboxDiv = createNewDiv(['form-row', 'align-items-center', 'm-2'], true, resultOptionsContainer);
    let deformationsCheckbox = createNewCheckbox('displacement_checkbox', '', '', true, deformationsCheckboxDiv);
    deformationsCheckbox.checked = true;
    let deformationsCheckboxLabel = createNewTextElement('label', 'Deformace', true, deformationsCheckboxDiv);
    deformationsCheckboxLabel.setAttribute('for', 'displacement_checkbox');
    deformationsCheckboxLabel.setAttribute('class', 'col-form-label');
    let deformationsCheckboxValue = createNewInput('hidden', 'displacement', 'displacement', '', '', '', '', 'yes', 'form-control', true, deformationsCheckboxDiv);

    // --------------- !results options  ---------------
    if ($('#structure_options')[0].value != '0') {
        loadOptionsData();
    }
}