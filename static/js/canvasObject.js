// Vytvoření nového objektu - formuláře canvas průřezu, a jeho vložení na stránku.

class CanvasCrossSection {

    constructor(clicked_id) {
        // pokud na stránce existuje div "results", smaže ho
        if ($('#results')[0]) {
            $('#results')[0].remove();
        }

        this.switcher = $(`#${clicked_id}`).prop('id');   // kliknutý switcher
        this.objectId = this.switcher.substr(0, 3);     // název typu průřezu
        this.selectedCard = $(`#${this.switcher}_card`)[0]; // div obsahující switcher a obrázek
        this.flexDiv = $("#selected_section_card")[0];  // div, do kterého se má vytvořit form
        this.values = $('#select_values')[0];     // input select_values

        let crossSectionCard = createNewDiv(['card', 'text-white', 'bg-dark', 'xs-10'], true, this.flexDiv);  // vytvoření karty průřezu
        crossSectionCard.setAttribute('id', 'cnv');

        // vytvoření formuláře
        this.newCrossSectionForm = document.createElement('form');

        /*formuláři se přiřadí metoda get kvůli posílání dat do SSE, url adresa pro action, odkazující na SSE výpočet
        a class pro průřezový formulář*/

        this.newCrossSectionForm.setAttribute('method', 'get');
        this.newCrossSectionForm.setAttribute('class', 'input_formular');
        this.newCrossSectionForm.setAttribute('id', this.objectId + '_form');
        this.newCrossSectionForm.setAttribute('onchange', 'checkFormInputs(event);');
        this.newCrossSectionForm.setAttribute('onsubmit', 'ajaxSubmit(event)');

        this.createCrossSectionEnviroment(); //vytvoří ovládací prostředí canvasu
        this.createDataForm(); // části formuláře, které jsou potřebné pro výpočet

        crossSectionCard.appendChild(this.newCrossSectionForm); // vložení hotového formuláře do divu na stránce

        // close button
        let closeRow = createNewDiv(['row', 'justify-content-end'], false, '');
        crossSectionCard.insertBefore(closeRow, crossSectionCard.children[0]);;

        let closeButton = document.createElement('button');
        closeButton.setAttribute('type', 'button');
        closeButton.setAttribute('id', `${clicked_id}_close`);
        closeButton.setAttribute('class', 'close');
        closeButton.setAttribute('onclick', 'createNewCrossSection(this.id);');
        closeButton.setAttribute('aria-label', 'Close');
        closeRow.append(closeButton);

        let buttonSpan = createNewTextElement('span', '', true, closeButton);
        buttonSpan.setAttribute('aria-hidden', 'true');
        buttonSpan.innerHTML = '&times;'

        /*Přidání inputu, do kterého se uloží json výsledky ze serveru, jakmile budou k dipozici. Po jejich
        obdržení a přidání výsledků na stránku bude hodnota tohoto inputu vymazána - tudíž bude možné poslat
        nový výpočet bez nutnosti aktualizace stránky. V případě zavření průřezu bude vymazán i tento input.*/
        let resultInput = createNewInput('hidden', 'json_result', 'json_result', '', '', '', '', '', '', true, this.flexDiv);

        drawAxes('form');
    }

    // funkce na vytvoření ovládacích prvků canvasu
    createCrossSectionEnviroment() {
        //vytvoření divu pro canvas a jeho tlačítka
        let canvasDiv = createNewDiv(['container'], false, '');

        // vytvoření canvas elementu
        let canvasElement = document.createElement('canvas');
        canvasElement.id = 'myCanvas';
        canvasElement.setAttribute('class', 'canvasObject m-3');
        canvasElement.setAttribute('style', 'border:1px solid #000000;');
        canvasElement.setAttribute('height', '300px');
        let width = 0;
        300 > window.innerWidth * 0.33 ? width = window.innerWidth * 0.33 : width = 300;
        canvasElement.setAttribute('width', String(width) + 'px');
        canvasElement.setAttribute('onmousemove', 'redrawAll(event);');
        canvasElement.setAttribute('onclick', 'getPointCoordinates(event); checkFormInputs(event);');
        canvasElement.setAttribute('onscroll', 'changeScale(event);');
        canvasDiv.appendChild(canvasElement);

        //sloupec pro canvas tlačítka
        let buttonsColumn = createNewDiv(['row', 'justify-content-between', 'my-2', 'ml-1'], true, canvasDiv);

        // div pro tlačítka na ovládání velikosti plátna
        let drawDimensionsRow = createNewDiv(['col-7', 'col-sm-5', 'col-lg-3', 'align-items-center', 'ml-2'], true, buttonsColumn);

        // inputy pro ovládání velikosti plátna
        let dimensionLabelColumn = createNewDiv(['row', 'justify-content-center'], true, drawDimensionsRow);
        let labelOfCanvasDimension = createNewTextElement('label', 'Rozměry plátna: ', true, dimensionLabelColumn);
        labelOfCanvasDimension.setAttribute('class', 'col-form-label');

        let widthColumn = createNewDiv(['row', 'my-2'], true, drawDimensionsRow);
        let canvasWidth = createNewInput('text', 'widthOfCanvas', '', 5, 1, 1, 2500, '', 'canvasInputs', true, widthColumn);
        canvasWidth.setAttribute('placeholder', 'Šířka: 300 mm');
        canvasWidth.setAttribute('onchange', 'widthOfMyCanvas(); redrawAll("");');

        let heightColumn = createNewDiv(['row', 'my-2'], true, drawDimensionsRow);
        let canvasHeight = createNewInput('text', 'heightOfCanvas', '', 5, 1, 1, 2500, '', 'canvasInputs', true, heightColumn);
        canvasHeight.setAttribute('placeholder', 'Výška: 300 mm');
        canvasHeight.setAttribute('onchange', 'heightOfMyCanvas(); redrawAll("");');

        // div pro inputy na ovládání prostředí plátna
        let drawSpaceRow = createNewDiv(['col-7', 'col-sm-5', 'col-lg-3', 'align-items-center', 'ml-2'], true, buttonsColumn);

        // inputy pro ovládání velikosti plátna
        let gridLabelColumn = createNewDiv(['row', 'justify-content-center'], true, drawSpaceRow);
        let labelOfGrid = createNewTextElement('label', 'Kroky mřížek: ', true, gridLabelColumn);
        labelOfGrid.setAttribute('class', 'col-form-label');

        let axesColumn = createNewDiv(['row', 'my-2'], true, drawSpaceRow);
        let canvasAxes = createNewInput('text', 'canvasAxes', '', 5, 1, 1, 2500, '', 'canvasInputs', true, axesColumn)
        canvasAxes.setAttribute('placeholder', 'Osy: 50');
        canvasAxes.setAttribute('onchange', 'redrawAll("");');

        let gridColumn = createNewDiv(['row', 'my-2'], true, drawSpaceRow);
        let canvasGrid = createNewInput('text', 'canvasGrid', '', 5, 1, 1, 2500, '', 'canvasInputs', true, gridColumn);
        canvasGrid.setAttribute('placeholder', 'Grid: ne');
        canvasGrid.setAttribute('onchange', 'canvasGridNew();');

        // div pro input měřítka
        let drawScaleRow = createNewDiv(['col-7', 'col-sm-5', 'col-lg-3', 'align-items-center', 'ml-2'], true, buttonsColumn);

        // input ovládající měřítko canvasu
        let scaleLabelColumn = createNewDiv(['row', 'align-items-center', 'justify-content-center', 'my-2'], true, drawScaleRow);
        let labelOfScale = createNewTextElement('label', 'Měřítko: ', true, scaleLabelColumn);

        let scaleColumn = createNewDiv(['row', 'align-items-center', 'justify-content-center'], true, drawScaleRow);
        let scaleValue = createNewInput('text', 'scaleValue', '', 2, 1, 1, 10, '', 'canvasInputs', true, scaleColumn);
        scaleValue.setAttribute('placeholder', '1');
        scaleValue.setAttribute('onchange', 'redrawAll("");');

        // div pro ovládání kresby
        let buttonsRow = createNewDiv(['row'], true, canvasDiv);
        let drawWorkRowFirst = createNewDiv(['col-12', 'col-sm-6'], true, buttonsRow);
        let drawWorkRowSecond = createNewDiv(['col-12', 'col-sm-6'], true, buttonsRow);
        let drawWorkRowThird = createNewDiv(['col-12', 'col-sm-6'], true, buttonsRow);
        let drawWorkRowFourth = createNewDiv(['col-12', 'col-sm-6'], true, buttonsRow);

        // tlačítka na ovládání kresby
        let closeButton = createNewButton('closeButton', '', 'closeYourDraw(); checkFormInputs(event);', 'Uzavři průřez', true, drawWorkRowFirst);
        let deleteButton = createNewButton('deleteButton', '', 'deleteYourDraw(); checkFormInputs(event);', 'Smaž průřez', true, drawWorkRowSecond);
        let deletePointButton = createNewButton('deletePointButton', '', 'deleteLastPoint(); checkFormInputs(event);', 'Smaž poslední bod', true, drawWorkRowThird);
        let holesButton = createNewButton('holesButton', '', 'drawHoles()', 'Vytvoř otvor', true, drawWorkRowFourth);
        holesButton.setAttribute('active', 'no');

        // stylizace všech tlačítek
        let buttons = [closeButton, deleteButton, deletePointButton, holesButton];

        for (let m = 0; m < buttons.length; m++) {
            buttons[m].classList.add('btn');
            buttons[m].classList.add('btn-secondary');
            buttons[m].classList.add('rounded');
            buttons[m].classList.add('m-1');
        }

        // stylizace všech inputů
        let inputs = [canvasWidth, canvasHeight, canvasAxes, canvasGrid, scaleValue];

        for (let n = 0; n < inputs.length; n++) {
            inputs[n].classList.add('rounded');
        }

        // přidání prvků canvas průřezu do formuláře
        this.newCrossSectionForm.appendChild(canvasDiv);
    }

// funkce na vytvoření ovládacích prvků canvasu
    createDataForm() {

// ====== část pro hlavičku formuláře =====

        //vytvoření divu hlavičky formuláře
        let formHeader = createNewDiv(['form-row', 'justify-content-center', 'headerPart', 'rounded'], false, '');
        formHeader.setAttribute('id', 'header_part');

        //vytvoření form-group hlavičky
        let headerGroup = createNewDiv(['col-12', 'text-center', 'headerPart', 'rounded'], true, formHeader);
        headerGroup.setAttribute('id', this.objectId + '_headerPart');

        // vytvoření hlavičky - titulek průřezu: pokud se jedná o netypický průřez (L, T, kulatina, plech...), je pojmenování odlišné od objectId
        let headerOfForm = createNewTextElement('legend', 'Průřez: Grafický', true, headerGroup);

        // vytvoření inputu s informací o typu průřezu - bude předán serveru
        let typeOfSection = createNewInput('hidden', '', 'dimension_type', '', '', '', '', this.objectId, 'form-control', true, headerGroup);
        typeOfSection.setAttribute('placeholder', 'section_type');

        // vložení hlavičky formuláře, před canvas elementy
        this.newCrossSectionForm.insertBefore(formHeader, this.newCrossSectionForm.children[0]);

// ====== konec části pro hlavičku formuláře =====

// ====== část welded/rolled checkboxu =====
        // vytvoření divu pro welding
        let formWelding = createNewDiv(['row', 'justify-content-between'], false, '');
        formWelding.setAttribute('id', 'welding_part');

        // vytvoření form-group pro welding
        let weldingGroup = createNewDiv(['form-group', 'col-xs-12'], true, formWelding);
        weldingGroup.setAttribute('id', this.objectId + '_sectionTypePart');

        // vytvoření divu pro checkbox
        let checkboxDiv = createNewDiv(['custom-control', 'custom-switch', 'switchDiv'], true, weldingGroup);

        // přidání welded checkboxu (switcher)
        // vytvoření akce pro checkbox (switcher)
        let addFunction = 'activeSectionType(this.id);';

        // přidání checkboxu pro svařovaný/válcovaný průřez - canvas má welded value "yes" a je pouze svařovaným průřezem
        this.weldedCheckbox = createNewCheckbox('custom_' + this.objectId + '_welded_check', 'welded_check', '', false, '');
        this.weldedCheckbox.checked = true;
        this.weldedCheckbox.style.display = 'none';
        this.weldedCheckbox.setAttribute('class', 'form-control');
        checkboxDiv.appendChild(this.weldedCheckbox);

        // vytvoření inputu s informací, jeslti je průřez svařovaný nebo válcovaný - bude předán serveru
        this.weldedValue = createNewInput('hidden', '', 'is_welded', '', '', '', '', 'yes', 'form-control', true, weldingGroup);

        // přidání části rolled/welded checkboxu do formuláře
        this.newCrossSectionForm.appendChild(formWelding);

// ====== konec části welded/rolled checkboxu =====

// ====== část hodnot průřezu =====

        // vytvoření skrytých inputů, přebírajících informace o průřezech během kreslení
        let listOfInputsNames = ['', '', 'allClickedPointsX', 'allClickedPointsY', '', '', '', '', 'allHolesPointsX', 'allHolesPointsY', 'numberOfPoints'];
        let listOfInputsIds = ['gridPointsX', 'gridPointsY', 'cnv_Xco', 'cnv_Yco', 'actualCursorX', 'actualCursorY', 'newCursorX', 'newCursorY', 'cnv_Xho', 'cnv_Yho', 'numberOfPoints'];

        // v cyklu musí být "k", protože "i" je použitu uvnitř createNewInput a přebralo by se - cyklus by skončil po prvním kroku
        for (let k = 0; k < listOfInputsNames.length; k++) {
            let element = '';

            // pouze podstatné inputy mají třídu form-control, zbylé nebudou pro výpočet serializovány
            if ((listOfInputsNames[k] == 'cnv_Xco') || (listOfInputsNames[k] == 'cnv_Yco') || (listOfInputsNames[k] == 'cnv_Xho') || (listOfInputsNames[k] == 'cnv_Yho') || (listOfInputsNames[k] == 'numberofPoints')) {
                element = createNewInput('hidden', listOfInputsIds[k], listOfInputsNames[k], '', '', '', '', '', 'noinput form-control', false, '');
                element.setAttribute('placeholder', listOfInputsIds[k]);
            }

            else {
                element = createNewInput('hidden', listOfInputsIds[k], listOfInputsNames[k], '', '', '', '', '', 'noinput', false, '');
                element.setAttribute('placeholder', listOfInputsIds[k]);
            }

            this.newCrossSectionForm.appendChild(element);
        }

// ====== konec části hodnot průřezu =====

        if (!window.location.href.includes('stresses')) {
            createCalculateOptions(this.newCrossSectionForm);
        }

// ====== část sítě a samostatného submitu =====

        // vytvoření divu pro síť
        let formMesh = createNewDiv(['form-row', 'justify-content-left', 'align-items-center', 'm-2'], false, '');
        formMesh.setAttribute('id', 'mesh_part');

        //vytvoření a vložení form-group pro mesh label
        let meshGroupLabel = createNewDiv(['col-6'], true, formMesh);

        //vytvoření a vložení form-group pro mesh label
        let meshGroupInput = createNewDiv(['col-6'], true, formMesh);
        meshGroupLabel.setAttribute('id', this.objectId + '_meshPart');

        // popisek inputu velikosti max FE prvku
        let labelOfMesh = createNewTextElement('label', 'Velikost prvku sítě:', true, meshGroupLabel);
        labelOfMesh.setAttribute('class', 'col-form-label');
        labelOfMesh.setAttribute('for', 'calculate_mesh_value');

        // vytvoření inputu s velikostí FE prvku - bude předán serveru
        this.meshValue = createNewInput('text', this.objectId + '_calculate_mesh_value', 'FE_number', 5, 1, 1, 2500, '', 'noinput', true, meshGroupInput);
        this.meshValue.setAttribute('class', 'form-control rounded');
        // this.meshValue.setAttribute('placeholder', 'Zadej v mm.');

        // přidání span elementu k FE inputu
        let meshSpan = createNewTextElement('span', '', true, meshGroupInput);
        meshSpan.setAttribute('id', this.objectId + '_calculate_mesh_value_check_valid');

        // přidání mesh části do formuláře
        this.newCrossSectionForm.appendChild(formMesh);

        // přidání defaultně deaktivovaného samostatného  submitu
        let submitButton = createNewInput('submit', this.objectId + '_calculate', '', '', '', '', '', 'Výpočet', 'disabledSubmit', true, this.newCrossSectionForm);
        submitButton.setAttribute('class', 'btn-block rounded disabledSubmit');
        submitButton.setAttribute('disabled', '');

// ====== konec části sítě =====
    }

}


window.addEventListener("resize", updateCanvas);

function updateCanvas() {
    if (!window.location.href.includes('frame')) {
        try {
            let canvas = $('#myCanvas')[0];
            let context = canvas.getContext('2d');
            let gridValue = $('#canvasGrid')[0].value;
            let stepValue = $('#canvasAxes')[0].value;
            let scaleValue = parseFloat($('#scaleValue')[0].value);

            window.innerWidth < canvas.parentElement ? canvas.width = window.innerWidth * 0.33 : canvas.width = canvas.parentElement.getBoundingClientRect()["width"] * 0.85;
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
