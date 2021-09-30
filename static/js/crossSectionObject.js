// Vytvoření nového objektu - formulář průřezu, a jeho vložení na stránku.

class CrossSectionObject {

    constructor(clicked_id, part, mainDiv) {
        // pokud na stránce existuje div "results", smaže ho
        if ($('#results')[0]) {
            $('#results')[0].remove();
        }

        this.part = part;   // hodnota rozlišující klasický průřez a první/druhý průřez pro složený průřez

        this.switcher = $(`#${clicked_id}`).prop('id');   // kliknutý switcher
        this.objectId = this.switcher.substr(0, 3);     // název typu průřezu

        if (this.part != '') {      // pokud je objekt tvořen z merged průřezu, je potřeba předefinovat part a objectId
            this.part = '_' + this.part;    // upraví identifikátor prvního/druhého průřezu, aby jej bylo možné přidávat do names a IDs
            this.objectId = this.switcher.substr(this.switcher.length - 3, 3);  // nově získá typ průřezu
        }

        this.selectedCard = $(`#${this.switcher}_card`)[0]; // div obsahující switcher a obrázek
        this.flexDiv = mainDiv;  // div, do kterého se má vytvořit form
        this.values = $('#select_values')[0];     // input select_values

        let crossSectionCard = '';
        let crossSectionCardRow = '';

        if (this.part == '_fir') {
            crossSectionCardRow = createNewDiv(['card', 'text-white', 'bg-dark', 'col-12', 'col-lg-6'], true, $('#first_cross_section')[0]);  // vytvoření karty průřezu
        }

        else if (this.part == '_sec') {
            crossSectionCardRow = createNewDiv(['card', 'text-white', 'bg-dark', 'col-12', 'col-lg-6'], true, $('#second_cross_section')[0]);  // vytvoření karty průřezu
        }

        else {
            crossSectionCard = createNewDiv(['card', 'text-white', 'bg-dark'], true, this.flexDiv);
            crossSectionCardRow = createNewDiv(['row'], true, crossSectionCard);  // vytvoření karty průřezu

            // složený průřez nemá v kartě obrázek průřezu (stejně jako canvas)
            let cardImage = document.createElement('img');  // obrázek v hlavičce

            if (this.objectId == 'L_s') {
                cardImage.setAttribute('src', `static/pictures/svg/L_section_pic.svg`);
            }

            else if (this.objectId == 'T_s') {
                cardImage.setAttribute('src', `static/pictures/svg/T_section_pic.svg`);
            }

            else {
                cardImage.setAttribute('src', `static/pictures/svg/${this.objectId}_section_pic.svg`);
            }

            /*
            let cardImageDiv = createNewDiv(['col-8', 'offset-2', 'col-sm-6', 'offset-sm-3', 'col-md-4', 'text-center', 'align-items-center'], true, crossSectionCardRow);
            cardImage.setAttribute('class', 'card-img-top img-responsive');
            cardImage.setAttribute('width', '75%');    //
            cardImage.setAttribute('width', '75%');
            cardImageDiv.appendChild(cardImage);
            */
        }

// ====== close button =====
        if (!/fir|sec/.test(this.part)) {
            let cardElement = $('#selected_section_card')[0].children[0];

            if ((!this.part.includes('fir')) && (!this.part.includes('sec'))) {
                cardElement.setAttribute('id', `${clicked_id.substr(0, 3)}`);
            }

            //let closeRow = createNewDiv(['row', 'justify-content-end'], false, '');
            //cardElement.insertBefore(closeRow, cardElement.children[0]);;

            let closeButton = document.createElement('button');
            closeButton.setAttribute('type', 'button');
            closeButton.setAttribute('id', `${clicked_id}_close`);
            closeButton.setAttribute('class', 'btn btn-sm close');
            closeButton.setAttribute('onclick', 'createNewCrossSection(this.id);');
            closeButton.setAttribute('aria-label', 'Close');
            //closeRow.append(closeButton);
            cardElement.children[0].insertBefore(closeButton, cardElement.children[0].children[1]);

            let buttonSpan = createNewTextElement('span', '', true, closeButton);
            buttonSpan.setAttribute('aria-hidden', 'true');
            buttonSpan.innerHTML = '&times;'
        }
// ====== konec close buttonu =====

        let cardBody = createNewDiv(['col'], true, crossSectionCardRow);  // vytvoření body divu karty

        this.createCrossSectionForm(); // vytvoří formulář průřezu

        // vložení hotového formuláře do divu na stránce
        cardBody.appendChild(this.newCrossSectionForm);

        if (this.objectId == 'usr') {
            this.loadCrossSection();
        }

        else {
            /* Jelikož každý průřez má defaultně přiřazen welded/rolled už při inicializaci, volá se v konstruktoru funkce
            na vytvoření selectu s dimenzemi nebo inputů pro svařovaný průřez. */
            createSelectValues(clicked_id, this.weldedCheckbox, '');
        }
    }

// metoda na vytvoření formuláře se základními elementy
    createCrossSectionForm() {
        this.newCrossSectionForm = document.createElement('form');

        /*formuláři se přiřadí metoda get kvůli posílání dat do SSE, url adresa pro action, odkazující na SSE výpočet
        a class pro průřezový formulář*/

        this.newCrossSectionForm.setAttribute('method', 'get');
        this.newCrossSectionForm.setAttribute('class', 'input_formular');
        this.newCrossSectionForm.setAttribute('id', this.objectId + '_form' + this.part);
        this.newCrossSectionForm.setAttribute('onchange', 'checkFormInputs(event); editFinalForm(this.id);');
        this.newCrossSectionForm.setAttribute('onsubmit', 'ajaxSubmit(event)');

// ====== část pro hlavičku formuláře =====

        //vytvoření divu hlavičky formuláře
        let formHeader = createNewDiv(['form-row', 'justify-content-center', 'align-items-center', 'headerPart'], false, '');
        formHeader.setAttribute('id', `header_part${this.part}`);

        //vytvoření form-group hlavičky
        let headerGroup = createNewDiv(['col-12', 'text-center'], true, formHeader);
        headerGroup.setAttribute('id', this.objectId + '_headerPart');

        // pozmění string nadpisu do podoby pro první/druhý profil merged průřezu nebo pro klasické průřezy
        let crossSectionPart = '';
        if (this.part == '_fir') {
            crossSectionPart = ' č. 1:';
        }

        else if (this.part == '_sec') {
            crossSectionPart = ' č. 2:';
        }

        else {
            crossSectionPart = ':';
        }

        // vytvoření hlavičky - titulek průřezu: pokud se jedná o netypický průřez (L, T, kulatina, plech...), je pojmenování odlišné od objectId
        if ((this.objectId != 'L_s') && (this.objectId != 'T_s') && (this.objectId != 'crl') && (this.objectId != 'rtg') && (this.objectId != 'usr')) {
            let headerOfForm = createNewTextElement('legend', `Průřez${crossSectionPart} ${this.objectId}`, true, headerGroup);
        }

        else if (this.objectId == 'L_s') {
            let headerOfForm = createNewTextElement('legend', `Průřez${crossSectionPart} Úhelník`, true, headerGroup);
        }

        else if (this.objectId == 'T_s') {
            let headerOfForm = createNewTextElement('legend', `Průřez${crossSectionPart} T-profil`, true, headerGroup);
        }

        else if (this.objectId == 'crl') {
            let headerOfForm = createNewTextElement('legend', `Průřez${crossSectionPart} Kulatina`, true, headerGroup);
        }

        else if (this.objectId == 'rtg') {
            let headerOfForm = createNewTextElement('legend', `Průřez${crossSectionPart} Plech`, true, headerGroup);
        }

        else if (this.objectId == 'usr') {
            let headerOfForm = createNewTextElement('legend', `Moje průřezy`, true, headerGroup);
        }

        // vytvoření inputu s informací o typu průřezu - bude předán serveru
        let typeOfSection = createNewInput('hidden', '', 'dimension_type' + this.part, '', '', '', '', this.objectId, 'form-control', true, headerGroup);
        //typeOfSection.setAttribute('onchange', 'validation(event)');

        // vložení hlavičky formuláře
        this.newCrossSectionForm.appendChild(formHeader);

// ====== konec části pro hlavičku formuláře =====


// ====== část welded/rolled checkboxu =====
        // vytvoření divu pro welding
        let formWelding = createNewDiv(['form-group', 'justify-content-center'], false, '');
        formWelding.setAttribute('id', `welding_part${this.part}`);

        // vytvoření divu pro checkbox
        let checkboxDiv = createNewDiv(['custom-control', 'custom-switch', 'switchDiv', 'justify-content-between', 'align-items-center', 'm-3'], true, formWelding);

        // přidání welded checkboxu (switcher) vytvoření akce pro checkbox (switcher)
        let addFunction = ' activeSectionType(this.id);';

        if ((this.part == '_fir') || (this.part == '_sec')) {
            addFunction = ' activeSectionType(this.id); editFinalForm(this.id);'
        }

        // CHS průřez má permanentně welded value "no" a je pouze válcovaný
        if (this.objectId == 'CHS') {
            // přidání checkboxu pro svařovaný/válcovaný průřez
            this.weldedCheckbox = createNewCheckbox('custom_' + this.objectId + '_welded_check' + this.part, 'welded_check' + this.part, addFunction, false, '');
            this.weldedCheckbox.checked = false;
            this.weldedCheckbox.style.display = 'none';
            // this.weldedCheckbox.setAttribute('class', 'form-control');
            checkboxDiv.appendChild(this.weldedCheckbox);
        }

        // kulatina a plech má permanentně welded value "yes" a je pouze svařovaná
        else if ((this.objectId == 'crl') || (this.objectId == 'rtg')) {
            // přidání checkboxu pro svařovaný/válcovaný průřez
            this.weldedCheckbox = createNewCheckbox('custom_' + this.objectId + '_welded_check' + this.part, 'welded_check' + this.part, '', false, '');
            this.weldedCheckbox.checked = true;
            this.weldedCheckbox.style.display = 'none';
            // this.weldedCheckbox.setAttribute('class', 'form-control');
            checkboxDiv.appendChild(this.weldedCheckbox);
        }

        else {
            // přidání popisků weldingu
            let rolledLabel = createNewTextElement('label', 'Databázový', true, checkboxDiv);
            let weldedLabel = createNewTextElement('label', 'Parametrický', true, checkboxDiv);
            rolledLabel.setAttribute('class', 'activeOption px-1');
            weldedLabel.setAttribute('class', 'custom-control-label');

            // nalinkování labelů na checkbox (switcher)
            rolledLabel.setAttribute('for', 'custom_' + this.objectId + '_welded_check' + this.part);
            weldedLabel.setAttribute('for', 'custom_' + this.objectId + '_welded_check' + this.part);

            // přidání checkboxu pro svařovaný/válcovaný průřez
            this.weldedCheckbox = createNewCheckbox('custom_' + this.objectId + '_welded_check' + this.part, 'welded_check' + this.part, "createSelectValues(this.id, '', true); checkFormInputs(this.id);" + addFunction, false, '');
            this.weldedCheckbox.setAttribute('class', 'custom-control-input'); // pro selenium GUI test zde má být 'custom-control', jinak 'custom-control-input'
            checkboxDiv.insertBefore(this.weldedCheckbox, weldedLabel);
        }

        // vytvoření inputu s informací, jeslti je průřez svařovaný nebo válcovaný - bude předán serveru (plech, kulatina a canvas má weldedValue vždy "yes")
        let value = 'no';

        if ((this.objectId == 'crl') || (this.objectId == 'rtg') || (this.objectId == 'cnv')) {
            value = 'yes';
        }

        this.weldedValue = createNewInput('hidden', '', 'is_welded' + this.part, '', '', '', '', value, 'form-control', true, formWelding);
        // this.weldedValue.setAttribute('onchange', 'validation(event)');

        // přidání části rolled/welded checkboxu do formuláře
        this.newCrossSectionForm.appendChild(formWelding);

// ====== konec části welded/rolled checkboxu =====

// ====== část hodnot průřezu =====
        // vytvoření části formuláře a sloupce pro labely
        let formValues = createNewDiv(['form-row', 'justify-content-left', 'align-items-center', 'm-2'], true, this.newCrossSectionForm);;

        if ((this.objectId == 'L_s') || (this.objectId == 'RHS')) {
            formValues.classList.remove('m-2');
        }

        formValues.setAttribute('id', `values_part${this.part}`);
        let equalValue = createNewInput('hidden', 'equalValue' + this.part, '', '', '', '', '', 'equal', '', true, formValues);

// ====== konec části hodnot průřezu =====

        // rotate a mirror pro merged průřezy
        if ((this.part == '_fir') || (this.part == '_sec')) {
            this.sectionManipulate();
        }

// ====== calculate option =========
        if ((this.part == '') && (this.objectId != 'usr') && (!window.location.href.includes('stresses'))) {
            createCalculateOptions(this.newCrossSectionForm);
        }
// ====== !calculate option =========

// ====== část sítě a samostatného submitu =====

        // vytvoření divu pro síť
        let formMesh = createNewDiv(['form-row', 'justify-content-left', 'align-items-center', 'm-2'], false, '');
        formMesh.setAttribute('id', `mesh_part${this.part}`);

        //vytvoření a vložení form-group pro mesh label
        let meshGroupLabel = createNewDiv(['col-6'], true, formMesh);
        meshGroupLabel.setAttribute('id', this.objectId + '_meshPart');

        //vytvoření a vložení form-group pro mesh label
        let meshGroupInput = createNewDiv(['col-6'], true, formMesh);

        // popisek inputu velikosti max FE prvku
        let labelOfMesh = createNewTextElement('label', 'Velikost prvku sítě:', true, meshGroupLabel);
        labelOfMesh.setAttribute('class', 'col-form-label');
        labelOfMesh.setAttribute('for', this.objectId + 'calculate_mesh_value');

        // vytvoření inputu s velikostí FE prvku - bude předán serveru
        this.meshValue = createNewInput('text', this.objectId + '_calculate_mesh_value' + this.part, 'FE_number' + this.part, 5, 1, 1, 2500, '', 'noinput', true, meshGroupInput);
        this.meshValue.setAttribute('class', 'form-control rounded');
        // this.meshValue.setAttribute('placeholder', 'Zadej v mm.');

        // pokud se jedná o formulář svařovaného průřezu, je potřeba při změně velikosti prvku editovat finální formulář
        if (this.part == '') {
            this.meshValue.setAttribute('oninput', 'checkFormInputs(event)');
        }

        else {
            this.meshValue.setAttribute('onchange', 'editFinalForm(this.id)');
            this.meshValue.setAttribute('oninput', 'checkFormInputs(event)');
        }

        // přidání span elementu k FE inputu
        let meshSpan = createNewTextElement('span', '', true, meshGroupInput);
        meshSpan.setAttribute('id', this.objectId + '_calculate_mesh_value_check_valid' + this.part);

        // přidání mesh části do formuláře
        this.newCrossSectionForm.appendChild(formMesh);

        // přidání defaultně deaktivovaného samostatného  submitu
        this.submitButton = createNewInput('submit', this.objectId + '_calculate' + this.part, '', '', '', '', '', 'Výpočet', 'btn-block rounded disabledSubmit', true, this.newCrossSectionForm);
        this.submitButton.setAttribute('disabled', '');
        this.submitButton.setAttribute('onclick', 'activeBigIcons(this.id, "")');

        if ((this.part == '_fir') || (this.part == '_sec')) {
            this.submitButton.style.display = 'none';
// ====== konec části sítě =====
        }
    }

    sectionManipulate() {

// ====== rotace průřezu =====
        // vytvoření řádku pro rotate
        let rotateRow = createNewDiv(['form-row', 'justify-content-left', 'align-items-center', 'm-2'], true, this.newCrossSectionForm);
        rotateRow.setAttribute('id', `rotate_part${this.part}`);

        // popis rotate inputu
        let rotateLabelDiv = createNewDiv(['col-6'], true, rotateRow);
        let rotateLabel = createNewTextElement('label', 'Rotace průřezu:', true, rotateLabelDiv);
        rotateLabel.setAttribute('class', 'col-form-label');
        rotateLabel.setAttribute('for', this.objectId + '_rotate' + this.part);

        // rotate input
        let rotateInputDiv = createNewDiv(['col-6'], true, rotateRow);
        let rotateInput = createNewInput('text', this.objectId + '_rotate' + this.part, 'rotate' + this.part, '5', '1', '1', '2500', '', 'form-control rounded', true, rotateInputDiv);
        rotateInput.setAttribute('onchange', 'editFinalForm(this.id)');
        rotateInput.setAttribute('oninput', 'checkFormInputs(event)');
        // rotateInput.setAttribute('placeholder', 'Zadej ve °.');

        // přidání span elementu k FE inputu
        let meshSpan = createNewTextElement('span', '', true, rotateInputDiv);
        meshSpan.setAttribute('id', this.objectId + '_rotate_value_check_valid' + this.part);
// ====== konec rotace průřezu =====

// ====== zrcadlení průřezu =====
        // vytvoření divu pro mirror
        let mirrorRow = createNewDiv(['form-group', 'justify-content-left', 'align-items-center', 'm-2'], false, '');
        mirrorRow.setAttribute('id', `mirror_part${this.part}`);

        // vytvoření checkboxu pro zrcadlení
        let mirrorSwitcherFormRow = createNewDiv(['form-row'], true, mirrorRow);
        let mirrorSwitcherRow = createNewDiv(['form-check'], true, mirrorSwitcherFormRow);

        let mirrorSwitcher = document.createElement('input');
        mirrorSwitcher.setAttribute('class', 'form-check-input');
        mirrorSwitcher.setAttribute('type', 'checkbox');
        mirrorSwitcher.setAttribute('id', 'custom_' + this.objectId + '_mirror_check' + this.part);
        mirrorSwitcher.setAttribute('name', 'mirror_check' + this.part);
        mirrorSwitcher.setAttribute('onclick', 'activeMirror(this.id); editFinalForm(this.id);');
        mirrorSwitcherRow.appendChild(mirrorSwitcher);

        let mirrorSwitcherLabel = createNewTextElement('label', 'Zrcadlit', true, mirrorSwitcherRow);
        mirrorSwitcherLabel.setAttribute('class', 'form-check-label');
        mirrorSwitcherLabel.setAttribute('for', 'custom_' + this.objectId + '_mirror_check' + this.part);

        // div pro volbu os
        let mirrorAxisRow = createNewDiv(['form-row', 'm-2'], true, mirrorRow);
        mirrorAxisRow.setAttribute('id', 'mirror_axis' + this.part);

        // přidání části rolled/welded checkboxu do formuláře
        this.newCrossSectionForm.appendChild(mirrorRow);

        // vytvoření inputu s informací, jestli a kolem jaké osy je průřez zrcadlen - bude předáno serveru
        this.mirrorValue = createNewInput('hidden', 'mirrored' + this.part, 'mirrored' + this.part, '', '', '', '', 'no', 'form-control', true, mirrorRow);
        // this.mirrorValue.setAttribute('onchange', 'validation(event)');
// ====== konec zrcadlení průřezu =====
    }
    
    loadCrossSection() {
        // umazání nepotřebných prvků ve formuláři načítání průřezů
        this.newCrossSectionForm.removeChild(this.newCrossSectionForm.children[1]);
        this.newCrossSectionForm.removeChild(this.newCrossSectionForm.children[1]); // protože smazáním elementu došlo k přečíslování
        this.newCrossSectionForm.removeChild(this.newCrossSectionForm.children[1]); // protože smazáním elementu došlo k přečíslování

        // přidání buttonu pro vyvolání modal dialogu uložených průřezů
        let modalRow = createNewDiv(['row', 'justify-content-center', 'mt-3'], false, '');
        this.newCrossSectionForm.insertBefore(modalRow, $('[id*="calculate"]')[0]);

        let loadButton = document.createElement('button');
        loadButton.setAttribute('type', 'button');
        loadButton.setAttribute('id', 'sectionSave');
        loadButton.setAttribute('class', 'btn btn-secondary');
        loadButton.setAttribute('data-toggle', 'modal');
        loadButton.setAttribute('data-target', '#sectionManager');
        loadButton.setAttribute('onclick', 'getSavedSections();');
        loadButton.innerHTML = 'Moje průřezy';
        modalRow.append(loadButton);
        createModalDialog();
    }
}


function createCalculateOptions(formular) {
    let optionRow = createNewDiv(['form-col-12'], true, formular);
    optionRow.setAttribute('id', 'optionsRow');

    let geometricRow = createNewDiv(['form-row', 'align-items-center', 'm-2'], true, optionRow);
    let geometricCheckbox = createNewCheckbox('geometric_checkbox', '', 'propertiesCalculateOption(this.id);', true, geometricRow);
    geometricCheckbox.checked = true;
    let geometricLabel = createNewTextElement('label', 'Geometrické charakteristiky', true, geometricRow);
    geometricLabel.setAttribute('class', 'col-form-label');
    geometricLabel.setAttribute('for', 'geometric_checkbox');
    createNewInput('hidden', 'geometric_value', 'geometric_value', '', '', '', '', 'yes', 'form-control', true, geometricRow);

    let warpingRow = createNewDiv(['form-row', 'align-items-center', 'm-2'], true, optionRow);
    let warpingCheckbox = createNewCheckbox('warping_checkbox', '', 'propertiesCalculateOption(this.id);', true, warpingRow);
    warpingCheckbox.checked = true;
    let warpingLabel = createNewTextElement('label', 'Torzní a výsečové charakteristiky', true, warpingRow);
    warpingLabel.setAttribute('class', 'col-form-label');
    warpingLabel.setAttribute('for', 'warping_checkbox');
    createNewInput('hidden', 'warping_value', 'warping_value', '', '', '', '', 'yes', 'form-control', true, warpingRow);

    let plasticRow = createNewDiv(['form-row', 'align-items-center', 'm-2'], true, optionRow);
    let plasticCheckbox = createNewCheckbox('plastic_checkbox', '', 'propertiesCalculateOption(this.id);', true, plasticRow);
    plasticCheckbox.checked = true;
    let plasticLabel = createNewTextElement('label', 'Plastické charakteristiky', true, plasticRow);
    plasticLabel.setAttribute('class', 'col-form-label');
    plasticLabel.setAttribute('for', 'plastic_checkbox');
    createNewInput('hidden', 'plastic_value', 'plastic_value', '', '', '', '', 'yes', 'form-control', true, plasticRow);
}